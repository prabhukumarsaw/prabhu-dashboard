"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRequired = authRequired;
exports.authOptional = authOptional;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
const logger_1 = require("../lib/logger");
/**
 * Strict auth middleware.
 * - Requires a valid access token.
 * - Loads user with tenant and roles into req.user.
 */
async function authRequired(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== 'access') {
            res.status(401).json({ success: false, message: 'Invalid token type' });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub, tenantId: payload.tenantId },
            include: {
                tenant: true,
                userRoles: { include: { role: true } },
            },
        });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User not found or inactive' });
            return;
        }
        req.user = user;
        req.tenantId = payload.tenantId;
        req.sessionId = payload.sessionId;
        next();
    }
    catch (e) {
        logger_1.logger.debug('Auth middleware error', e);
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
}
/**
 * Optional auth middleware.
 * - If a valid access token is present, sets req.user/tenantId/sessionId.
 * - Otherwise just calls next() without failing the request.
 */
async function authOptional(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;
    if (!token) {
        next();
        return;
    }
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== 'access') {
            next();
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.sub, tenantId: payload.tenantId },
            include: { tenant: true, userRoles: { include: { role: true } } },
        });
        if (user && user.isActive) {
            req.user = user;
            req.tenantId = payload.tenantId;
            req.sessionId = payload.sessionId;
        }
    }
    catch (e) {
        logger_1.logger.debug('Auth optional middleware error', e);
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map