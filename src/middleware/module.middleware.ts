import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Require that the tenant has the given module enabled.
 * Use for module-specific routes (e.g. /api/v1/billing/*).
 */
export function requireModule(moduleCode: string) {
  return async function moduleCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(400).json({ success: false, message: 'Tenant context required' });
      return;
    }
    const mod = await prisma.module.findUnique({
      where: { code: moduleCode, isActive: true },
    });
    if (!mod) {
      res.status(503).json({ success: false, message: 'Module not available' });
      return;
    }
    const tenantModule = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
    });
    if (!tenantModule?.isEnabled) {
      res.status(403).json({ success: false, message: 'Module not enabled for this tenant' });
      return;
    }
    next();
  };
}
