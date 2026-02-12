import { prisma } from '../lib/prisma';

const SESSION_EXPIRY_DAYS = 30;

export async function createSession(
  userId: string,
  tenantId: string,
  ip?: string,
  userAgent?: string
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  return prisma.session.create({
    data: { userId, tenantId, ip, userAgent, expiresAt },
  });
}

export async function listUserSessions(userId: string, tenantId: string) {
  return prisma.session.findMany({
    where: { userId, tenantId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeSession(sessionId: string, userId: string) {
  return prisma.session.updateMany({
    where: { id: sessionId, userId },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllSessions(userId: string, tenantId: string, exceptSessionId?: string) {
  const where: { userId: string; tenantId: string; revokedAt: null; id?: { not: string } } = {
    userId,
    tenantId,
    revokedAt: null,
  };
  if (exceptSessionId) where.id = { not: exceptSessionId };
  return prisma.session.updateMany({
    where,
    data: { revokedAt: new Date() },
  });
}
