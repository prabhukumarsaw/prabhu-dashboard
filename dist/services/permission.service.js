"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPermissions = listPermissions;
exports.getByCode = getByCode;
const prisma_1 = require("../lib/prisma");
async function listPermissions(moduleCode) {
    const where = moduleCode ? { module: { code: moduleCode }, isActive: true } : { isActive: true };
    return prisma_1.prisma.permission.findMany({
        where,
        include: { module: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }, { code: 'asc' }],
    });
}
async function getByCode(code) {
    return prisma_1.prisma.permission.findUnique({
        where: { code, isActive: true },
        include: { module: true },
    });
}
//# sourceMappingURL=permission.service.js.map