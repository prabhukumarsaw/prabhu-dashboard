import { Request, Response, NextFunction } from 'express';
/**
 * Strict auth middleware.
 * - Requires a valid access token.
 * - Loads user with tenant and roles into req.user.
 */
export declare function authRequired(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Optional auth middleware.
 * - If a valid access token is present, sets req.user/tenantId/sessionId.
 * - Otherwise just calls next() without failing the request.
 */
export declare function authOptional(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=auth.middleware.d.ts.map