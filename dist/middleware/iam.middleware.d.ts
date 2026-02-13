import { Request, Response, NextFunction } from 'express';
type IAMOptions = {
    permissionCode?: string;
    permissionResource?: string;
    permissionAction?: string;
    resourceType?: string;
    resourceIdParam?: string;
    action?: string;
};
/**
 * Middleware: require IAM access (RBAC/ABAC/PBAC/ACL).
 * Use after authRequired so req.user is set.
 */
export declare function requirePermission(options: IAMOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/** Require one of the given permission codes (OR) */
export declare function requireAnyPermission(permissionCodes: string[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export {};
//# sourceMappingURL=iam.middleware.d.ts.map