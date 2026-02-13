"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTenant = resolveTenant;
const prisma_1 = require("../lib/prisma");
const config_1 = require("../config");
/**
 * Resolve tenant from:
 * 1. Header X-Tenant-Id or x-tenant-id
 * 2. Subdomain (if domain mapped)
 * 3. req.tenantId (set by auth)
 * 4. DEFAULT_TENANT_ID / first tenant
 */
async function resolveTenant(req, res, next) {
    const headerTenant = req.headers['x-tenant-id'];
    const slug = (headerTenant || req.headers['x-tenant-slug']);
    if (req.tenantId) {
        // Already set by auth
        next();
        return;
    }
    try {
        if (slug) {
            const tenant = await prisma_1.prisma.tenant.findFirst({
                where: { slug, isActive: true },
            });
            if (tenant) {
                req.tenantId = tenant.id;
                next();
                return;
            }
        }
        if (headerTenant) {
            const tenant = await prisma_1.prisma.tenant.findUnique({
                where: { id: headerTenant, isActive: true },
            });
            if (tenant) {
                req.tenantId = tenant.id;
                next();
                return;
            }
        }
        // Default tenant for unauthenticated or fallback
        const defaultTenant = await prisma_1.prisma.tenant.findFirst({
            where: { slug: config_1.config.defaultTenantId, isActive: true },
        });
        if (defaultTenant) {
            req.tenantId = defaultTenant.id;
        }
    }
    catch (e) {
        // continue without tenant
    }
    next();
}
//# sourceMappingURL=tenant.middleware.js.map