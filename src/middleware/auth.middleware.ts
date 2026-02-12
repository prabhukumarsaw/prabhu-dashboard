import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/**
 * Strict auth middleware.
 * - Requires a valid access token.
 * - Loads user with tenant and roles into req.user.
 */
export async function authRequired(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      res.status(401).json({ success: false, message: 'Invalid token type' });
      return;
    }

    const user = await prisma.user.findUnique({
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

    req.user = user as Express.Request['user'];
    req.tenantId = payload.tenantId;
    req.sessionId = payload.sessionId;
    next();
  } catch (e) {
    logger.debug('Auth middleware error', e);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Optional auth middleware.
 * - If a valid access token is present, sets req.user/tenantId/sessionId.
 * - Otherwise just calls next() without failing the request.
 */
export async function authOptional(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.accessToken;

  if (!token) {
    next();
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.type !== 'access') {
      next();
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub, tenantId: payload.tenantId },
      include: { tenant: true, userRoles: { include: { role: true } } },
    });

    if (user && user.isActive) {
      req.user = user as Express.Request['user'];
      req.tenantId = payload.tenantId;
      req.sessionId = payload.sessionId;
    }
  } catch (e) {
    logger.debug('Auth optional middleware error', e);
  }

  next();
}
