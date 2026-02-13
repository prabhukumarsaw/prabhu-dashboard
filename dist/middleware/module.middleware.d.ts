import { Request, Response, NextFunction } from 'express';
/**
 * Require that the tenant has the given module enabled.
 * Use for module-specific routes (e.g. /api/v1/billing/*).
 */
export declare function requireModule(moduleCode: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=module.middleware.d.ts.map