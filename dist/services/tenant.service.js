"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTenants = listTenants;
exports.getTenantById = getTenantById;
exports.getTenantBySlug = getTenantBySlug;
exports.createTenant = createTenant;
exports.updateTenant = updateTenant;
exports.enableModule = enableModule;
exports.disableModule = disableModule;
const prisma_1 = require("../lib/prisma");
async function listTenants(page = 1, limit = 20, search) {
    const skip = (page - 1) * limit;
    const where = search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { slug: { contains: search, mode: 'insensitive' } }], isActive: true }
        : { isActive: true };
    const [tenants, total] = await Promise.all([
        prisma_1.prisma.tenant.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
        prisma_1.prisma.tenant.count({ where }),
    ]);
    return { tenants, total, page, limit };
}
async function getTenantById(id) {
    return prisma_1.prisma.tenant.findUnique({
        where: { id },
        include: { modules: { include: { module: true } } },
    });
}
async function getTenantBySlug(slug) {
    return prisma_1.prisma.tenant.findFirst({
        where: { slug, isActive: true },
    });
}
async function createTenant(data) {
    return prisma_1.prisma.tenant.create({
        data,
    });
}
async function updateTenant(id, data) {
    return prisma_1.prisma.tenant.update({
        where: { id },
        data,
    });
}
async function enableModule(tenantId, moduleId, config) {
    return prisma_1.prisma.tenantModule.upsert({
        where: { tenantId_moduleId: { tenantId, moduleId } },
        create: { tenantId, moduleId, config: config },
        update: { isEnabled: true, config: config },
    });
}
async function disableModule(tenantId, moduleId) {
    return prisma_1.prisma.tenantModule.updateMany({
        where: { tenantId, moduleId },
        data: { isEnabled: false },
    });
}
//# sourceMappingURL=tenant.service.js.map