"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireModule = requireModule;
const prisma_1 = require("../lib/prisma");
/**
 * Require that the tenant has the given module enabled.
 * Use for module-specific routes (e.g. /api/v1/billing/*).
 */
function requireModule(moduleCode) {
    return async function moduleCheck(req, res, next) {
        const tenantId = req.tenantId;
        if (!tenantId) {
            res.status(400).json({ success: false, message: 'Tenant context required' });
            return;
        }
        const mod = await prisma_1.prisma.module.findUnique({
            where: { code: moduleCode, isActive: true },
        });
        if (!mod) {
            res.status(503).json({ success: false, message: 'Module not available' });
            return;
        }
        const tenantModule = await prisma_1.prisma.tenantModule.findUnique({
            where: { tenantId_moduleId: { tenantId, moduleId: mod.id } },
        });
        if (!tenantModule?.isEnabled) {
            res.status(403).json({ success: false, message: 'Module not enabled for this tenant' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=module.middleware.js.map