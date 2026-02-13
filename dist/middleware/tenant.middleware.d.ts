import { Request, Response, NextFunction } from 'express';
/**
 * Resolve tenant from:
 * 1. Header X-Tenant-Id or x-tenant-id
 * 2. Subdomain (if domain mapped)
 * 3. req.tenantId (set by auth)
 * 4. DEFAULT_TENANT_ID / first tenant
 */
export declare function resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=tenant.middleware.d.ts.map