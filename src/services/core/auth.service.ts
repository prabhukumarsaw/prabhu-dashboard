import { prisma } from '../../lib/prisma';
import { hashPassword, verifyPassword } from '../../lib/password';
import { signAccessToken, signRefreshToken, verifyToken } from '../../lib/jwt';
import crypto from 'crypto';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '../../config';
import { logger } from '../../lib/logger';

authenticator.options = { window: config.otp.window };

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 30;

/**
 * Validate tenant exists and is active
 */
async function validateTenant(tenantId: string): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new Error('Tenant not found');
  }

  if (!tenant.isActive) {
    throw new Error('Tenant is not active');
  }
}

export type LoginInput = {
  tenantId: string;
  email?: string;
  username?: string;
  password: string;
  ip?: string;
  userAgent?: string;
};

export type RegisterInput = {
  tenantId: string;
  email: string;
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export async function register(data: RegisterInput) {
  // Validate tenant exists and is active
  await validateTenant(data.tenantId);

  // Check if user already exists
  const existing = await prisma.user.findFirst({
    where: {
      tenantId: data.tenantId,
      OR: [{ email: data.email }, ...(data.username ? [{ username: data.username }] : [])],
    },
  });
  if (existing) {
    throw new Error('User with this email or username already exists');
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      tenantId: data.tenantId,
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });
  return user;
}

export async function login(input: LoginInput) {
  // Validate tenant exists and is active
  await validateTenant(input.tenantId);

  const where: { tenantId: string; passwordHash?: { not: null }; OR: object[] } = {
    tenantId: input.tenantId,
    passwordHash: { not: null },
    OR: [],
  };
  if (input.email) where.OR.push({ email: input.email });
  if (input.username) where.OR.push({ username: input.username });
  if (where.OR.length === 0) where.OR.push({ email: '' }); // force invalid

  const user = await prisma.user.findFirst({
    where,
    include: { tenant: true, userRoles: { include: { role: true } } },
  });

  if (!user || !user.passwordHash) {
    throw new Error('Invalid credentials');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  if (!user.isActive) {
    throw new Error('Account is disabled');
  }

  const session = await createSession(user.id, user.tenantId, input.ip, input.userAgent);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: session.id,
  });
  const refreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: session.id,
  });

  await saveRefreshToken(user.id, refreshToken, input.userAgent);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
    sessionId: session.id,
  };
}

export async function createSession(
  userId: string,
  tenantId: string,
  ip?: string,
  userAgent?: string
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  return prisma.session.create({
    data: {
      userId,
      tenantId,
      ip,
      userAgent,
      expiresAt,
    },
  });
}

function refreshTokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function saveRefreshToken(userId: string, token: string, deviceId?: string) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: refreshTokenHash(token),
      deviceId,
      expiresAt,
    },
  });
}

export async function refreshTokens(refreshToken: string) {
  const payload = verifyToken(refreshToken);
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: payload.sub,
      tokenHash: refreshTokenHash(refreshToken),
      revokedAt: null,
    },
  });

  if (!stored || new Date() > stored.expiresAt) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub, tenantId: payload.tenantId },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });

  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: payload.sessionId,
  });
  const newRefreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: payload.sessionId,
  });
  await saveRefreshToken(user.id, newRefreshToken);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    expiresIn: config.jwt.accessExpiry,
  };
}

export async function logout(refreshToken?: string, sessionId?: string) {
  if (refreshToken) {
    const hash = refreshTokenHash(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    });
  }
  if (sessionId) {
    await prisma.session.updateMany({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }
  return { success: true };
}

// ---------- OTP ----------
export function generateOTP(): string {
  return authenticator.generateSecret();
}

export async function setupMFA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  const secret = authenticator.generateSecret();
  const otpauth = authenticator.keyuri(user.email, config.otp.issuer, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecret: secret },
  });
  return { secret, qrDataUrl };
}

export async function verifyMFA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecret) return false;
  const valid = authenticator.verify({ token, secret: user.mfaSecret });
  if (valid) {
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });
  }
  return valid;
}

export async function createOTPCode(userId: string, type: string): Promise<string> {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
  await prisma.oTPCode.create({
    data: {
      userId,
      code: crypto.createHash('sha256').update(code).digest('hex'),
      type,
      expiresAt,
    },
  });
  return code;
}

export async function verifyOTPCode(userId: string, code: string, type: string): Promise<boolean> {
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const record = await prisma.oTPCode.findFirst({
    where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
  if (!record || record.code !== hash) return false;
  await prisma.oTPCode.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return true;
}

export async function requestLoginOTP(tenantId: string, email: string): Promise<{ userId: string } | null> {
  // Validate tenant exists and is active
  await validateTenant(tenantId);

  const user = await prisma.user.findFirst({
    where: { tenantId, email, isActive: true },
  });
  if (!user) return null;
  await createOTPCode(user.id, 'login_otp');
  return { userId: user.id };
}

export async function loginWithOTP(
  tenantId: string,
  email: string,
  code: string,
  ip?: string,
  userAgent?: string
) {
  // Validate tenant exists and is active
  await validateTenant(tenantId);

  const user = await prisma.user.findFirst({
    where: { tenantId, email, isActive: true },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });
  if (!user) throw new Error('Invalid credentials');
  const valid = await verifyOTPCode(user.id, code, 'login_otp');
  if (!valid) throw new Error('Invalid or expired OTP');
  const session = await createSession(user.id, user.tenantId, ip, userAgent);
  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: session.id,
  });
  const refreshToken = signRefreshToken({
    sub: user.id,
    email: user.email,
    tenantId: user.tenantId,
    sessionId: session.id,
  });
  await saveRefreshToken(user.id, refreshToken, userAgent);
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiry,
    sessionId: session.id,
  };
}

// ---------- Password reset ----------

export async function requestPasswordReset(tenantId: string, email: string): Promise<void> {
  // Validate tenant exists and is active
  await validateTenant(tenantId);

  const user = await prisma.user.findFirst({
    where: { tenantId, email, isActive: true },
  });
  if (!user) {
    // Do not reveal whether user exists
    return;
  }
  const code = await createOTPCode(user.id, 'password_reset');
  // In real implementation, send code via email / SMS.
  logger.info('Password reset OTP generated', { email, tenantId, code });
}

export async function resetPasswordWithOTP(
  tenantId: string,
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  // Validate tenant exists and is active
  await validateTenant(tenantId);

  const user = await prisma.user.findFirst({
    where: { tenantId, email, isActive: true },
  });
  if (!user) {
    throw new Error('Invalid OTP or user');
  }
  const valid = await verifyOTPCode(user.id, code, 'password_reset');
  if (!valid) {
    throw new Error('Invalid or expired OTP');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  // Revoke all refresh tokens for this user after password change
  await prisma.refreshToken.updateMany({
    where: { userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user || !user.passwordHash) {
    throw new Error('User not found');
  }
  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Current password is incorrect');
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ---------- Helpers ----------
export function sanitizeUser(user: { passwordHash?: string | null; mfaSecret?: string | null;[k: string]: unknown }) {
  const { passwordHash, mfaSecret, ...rest } = user;
  return rest;
}
