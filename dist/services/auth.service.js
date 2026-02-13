"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.createSession = createSession;
exports.refreshTokens = refreshTokens;
exports.logout = logout;
exports.generateOTP = generateOTP;
exports.setupMFA = setupMFA;
exports.verifyMFA = verifyMFA;
exports.createOTPCode = createOTPCode;
exports.verifyOTPCode = verifyOTPCode;
exports.requestLoginOTP = requestLoginOTP;
exports.loginWithOTP = loginWithOTP;
exports.requestPasswordReset = requestPasswordReset;
exports.resetPasswordWithOTP = resetPasswordWithOTP;
exports.changePassword = changePassword;
exports.sanitizeUser = sanitizeUser;
const prisma_1 = require("../lib/prisma");
const password_1 = require("../lib/password");
const jwt_1 = require("../lib/jwt");
const crypto_1 = __importDefault(require("crypto"));
const otplib_1 = require("otplib");
const qrcode_1 = __importDefault(require("qrcode"));
const config_1 = require("../config");
const logger_1 = require("../lib/logger");
otplib_1.authenticator.options = { window: config_1.config.otp.window };
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const OTP_EXPIRY_MINUTES = 10;
const SESSION_EXPIRY_DAYS = 30;
/**
 * Validate tenant exists and is active
 */
async function validateTenant(tenantId) {
    const tenant = await prisma_1.prisma.tenant.findUnique({
        where: { id: tenantId },
    });
    if (!tenant) {
        throw new Error('Tenant not found');
    }
    if (!tenant.isActive) {
        throw new Error('Tenant is not active');
    }
}
async function register(data) {
    // Validate tenant exists and is active
    await validateTenant(data.tenantId);
    // Check if user already exists
    const existing = await prisma_1.prisma.user.findFirst({
        where: {
            tenantId: data.tenantId,
            OR: [{ email: data.email }, ...(data.username ? [{ username: data.username }] : [])],
        },
    });
    if (existing) {
        throw new Error('User with this email or username already exists');
    }
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    const user = await prisma_1.prisma.user.create({
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
async function login(input) {
    // Validate tenant exists and is active
    await validateTenant(input.tenantId);
    const where = {
        tenantId: input.tenantId,
        passwordHash: { not: null },
        OR: [],
    };
    if (input.email)
        where.OR.push({ email: input.email });
    if (input.username)
        where.OR.push({ username: input.username });
    if (where.OR.length === 0)
        where.OR.push({ email: '' }); // force invalid
    const user = await prisma_1.prisma.user.findFirst({
        where,
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
    if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
    }
    const valid = await (0, password_1.verifyPassword)(input.password, user.passwordHash);
    if (!valid) {
        throw new Error('Invalid credentials');
    }
    if (!user.isActive) {
        throw new Error('Account is disabled');
    }
    const session = await createSession(user.id, user.tenantId, input.ip, input.userAgent);
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: session.id,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: session.id,
    });
    await saveRefreshToken(user.id, refreshToken, input.userAgent);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: config_1.config.jwt.accessExpiry,
        sessionId: session.id,
    };
}
async function createSession(userId, tenantId, ip, userAgent) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    return prisma_1.prisma.session.create({
        data: {
            userId,
            tenantId,
            ip,
            userAgent,
            expiresAt,
        },
    });
}
function refreshTokenHash(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
async function saveRefreshToken(userId, token, deviceId) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    await prisma_1.prisma.refreshToken.create({
        data: {
            userId,
            tokenHash: refreshTokenHash(token),
            deviceId,
            expiresAt,
        },
    });
}
async function refreshTokens(refreshToken) {
    const payload = (0, jwt_1.verifyToken)(refreshToken);
    if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
    }
    const stored = await prisma_1.prisma.refreshToken.findFirst({
        where: {
            userId: payload.sub,
            tokenHash: refreshTokenHash(refreshToken),
            revokedAt: null,
        },
    });
    if (!stored || new Date() > stored.expiresAt) {
        throw new Error('Invalid or expired refresh token');
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: payload.sub, tenantId: payload.tenantId },
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
    }
    await prisma_1.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
    });
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: payload.sessionId,
    });
    const newRefreshToken = (0, jwt_1.signRefreshToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: payload.sessionId,
    });
    await saveRefreshToken(user.id, newRefreshToken);
    return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: config_1.config.jwt.accessExpiry,
    };
}
async function logout(refreshToken, sessionId) {
    if (refreshToken) {
        const hash = refreshTokenHash(refreshToken);
        await prisma_1.prisma.refreshToken.updateMany({
            where: { tokenHash: hash },
            data: { revokedAt: new Date() },
        });
    }
    if (sessionId) {
        await prisma_1.prisma.session.updateMany({
            where: { id: sessionId },
            data: { revokedAt: new Date() },
        });
    }
    return { success: true };
}
// ---------- OTP ----------
function generateOTP() {
    return otplib_1.authenticator.generateSecret();
}
async function setupMFA(userId) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        throw new Error('User not found');
    const secret = otplib_1.authenticator.generateSecret();
    const otpauth = otplib_1.authenticator.keyuri(user.email, config_1.config.otp.issuer, secret);
    const qrDataUrl = await qrcode_1.default.toDataURL(otpauth);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { mfaSecret: secret },
    });
    return { secret, qrDataUrl };
}
async function verifyMFA(userId, token) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret)
        return false;
    const valid = otplib_1.authenticator.verify({ token, secret: user.mfaSecret });
    if (valid) {
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });
    }
    return valid;
}
async function createOTPCode(userId, type) {
    const code = crypto_1.default.randomInt(100000, 999999).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    await prisma_1.prisma.oTPCode.create({
        data: {
            userId,
            code: crypto_1.default.createHash('sha256').update(code).digest('hex'),
            type,
            expiresAt,
        },
    });
    return code;
}
async function verifyOTPCode(userId, code, type) {
    const hash = crypto_1.default.createHash('sha256').update(code).digest('hex');
    const record = await prisma_1.prisma.oTPCode.findFirst({
        where: { userId, type, usedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });
    if (!record || record.code !== hash)
        return false;
    await prisma_1.prisma.oTPCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
    });
    return true;
}
async function requestLoginOTP(tenantId, email) {
    // Validate tenant exists and is active
    await validateTenant(tenantId);
    const user = await prisma_1.prisma.user.findFirst({
        where: { tenantId, email, isActive: true },
    });
    if (!user)
        return null;
    await createOTPCode(user.id, 'login_otp');
    return { userId: user.id };
}
async function loginWithOTP(tenantId, email, code, ip, userAgent) {
    // Validate tenant exists and is active
    await validateTenant(tenantId);
    const user = await prisma_1.prisma.user.findFirst({
        where: { tenantId, email, isActive: true },
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await verifyOTPCode(user.id, code, 'login_otp');
    if (!valid)
        throw new Error('Invalid or expired OTP');
    const session = await createSession(user.id, user.tenantId, ip, userAgent);
    const accessToken = (0, jwt_1.signAccessToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: session.id,
    });
    const refreshToken = (0, jwt_1.signRefreshToken)({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        sessionId: session.id,
    });
    await saveRefreshToken(user.id, refreshToken, userAgent);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });
    return {
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
        expiresIn: config_1.config.jwt.accessExpiry,
        sessionId: session.id,
    };
}
// ---------- Password reset ----------
async function requestPasswordReset(tenantId, email) {
    // Validate tenant exists and is active
    await validateTenant(tenantId);
    const user = await prisma_1.prisma.user.findFirst({
        where: { tenantId, email, isActive: true },
    });
    if (!user) {
        // Do not reveal whether user exists
        return;
    }
    const code = await createOTPCode(user.id, 'password_reset');
    // In real implementation, send code via email / SMS.
    logger_1.logger.info('Password reset OTP generated', { email, tenantId, code });
}
async function resetPasswordWithOTP(tenantId, email, code, newPassword) {
    // Validate tenant exists and is active
    await validateTenant(tenantId);
    const user = await prisma_1.prisma.user.findFirst({
        where: { tenantId, email, isActive: true },
    });
    if (!user) {
        throw new Error('Invalid OTP or user');
    }
    const valid = await verifyOTPCode(user.id, code, 'password_reset');
    if (!valid) {
        throw new Error('Invalid or expired OTP');
    }
    const passwordHash = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
    });
    // Revoke all refresh tokens for this user after password change
    await prisma_1.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}
async function changePassword(userId, currentPassword, newPassword) {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user || !user.passwordHash) {
        throw new Error('User not found');
    }
    const valid = await (0, password_1.verifyPassword)(currentPassword, user.passwordHash);
    if (!valid) {
        throw new Error('Current password is incorrect');
    }
    const passwordHash = await (0, password_1.hashPassword)(newPassword);
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
    });
    await prisma_1.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
    });
}
// ---------- Helpers ----------
function sanitizeUser(user) {
    const { passwordHash, mfaSecret, ...rest } = user;
    return rest;
}
//# sourceMappingURL=auth.service.js.map