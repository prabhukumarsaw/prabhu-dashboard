"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRoles = listRoles;
exports.getRoleById = getRoleById;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
const prisma_1 = require("../lib/prisma");
async function listRoles(tenantId) {
    return prisma_1.prisma.role.findMany({
        where: { tenantId, isActive: true },
        include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
        orderBy: { name: 'asc' },
    });
}
async function getRoleById(roleId, tenantId) {
    return prisma_1.prisma.role.findFirst({
        where: { id: roleId, tenantId },
        include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
    });
}
async function createRole(tenantId, data) {
    const role = await prisma_1.prisma.role.create({
        data: {
            tenantId,
            name: data.name,
            code: data.code,
            description: data.description,
            rolePermissions: data.permissionIds?.length
                ? { create: data.permissionIds.map((pId) => ({ permissionId: pId })) }
                : undefined,
            roleMenus: data.menuIds?.length ? { create: data.menuIds.map((menuId) => ({ menuId })) } : undefined,
        },
        include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
    });
    return role;
}
async function updateRole(roleId, tenantId, data) {
    if (data.permissionIds !== undefined) {
        await prisma_1.prisma.rolePermission.deleteMany({ where: { roleId } });
        if (data.permissionIds.length > 0) {
            await prisma_1.prisma.rolePermission.createMany({
                data: data.permissionIds.map((pId) => ({ roleId, permissionId: pId })),
            });
        }
    }
    if (data.menuIds !== undefined) {
        await prisma_1.prisma.roleMenu.deleteMany({ where: { roleId } });
        if (data.menuIds.length > 0) {
            await prisma_1.prisma.roleMenu.createMany({
                data: data.menuIds.map((menuId) => ({ roleId, menuId })),
            });
        }
    }
    const { permissionIds, menuIds, ...rest } = data;
    return prisma_1.prisma.role.update({
        where: { id: roleId },
        data: rest,
        include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
    });
}
async function deleteRole(roleId, tenantId) {
    const role = await prisma_1.prisma.role.findFirst({ where: { id: roleId, tenantId } });
    if (role?.isSystem) {
        throw new Error('System roles cannot be deleted');
    }
    return prisma_1.prisma.role.deleteMany({ where: { id: roleId, tenantId } });
}
//# sourceMappingURL=role.service.js.map