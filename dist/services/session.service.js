"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.listUserSessions = listUserSessions;
exports.revokeSession = revokeSession;
exports.revokeAllSessions = revokeAllSessions;
const prisma_1 = require("../lib/prisma");
const SESSION_EXPIRY_DAYS = 30;
async function createSession(userId, tenantId, ip, userAgent) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
    return prisma_1.prisma.session.create({
        data: { userId, tenantId, ip, userAgent, expiresAt },
    });
}
async function listUserSessions(userId, tenantId) {
    return prisma_1.prisma.session.findMany({
        where: { userId, tenantId, revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
    });
}
async function revokeSession(sessionId, userId) {
    return prisma_1.prisma.session.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: new Date() },
    });
}
async function revokeAllSessions(userId, tenantId, exceptSessionId) {
    const where = {
        userId,
        tenantId,
        revokedAt: null,
    };
    if (exceptSessionId)
        where.id = { not: exceptSessionId };
    return prisma_1.prisma.session.updateMany({
        where,
        data: { revokedAt: new Date() },
    });
}
//# sourceMappingURL=session.service.js.map