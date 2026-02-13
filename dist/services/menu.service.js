"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMenusForTenant = listMenusForTenant;
exports.listMenusForUser = listMenusForUser;
exports.getMenuById = getMenuById;
exports.createMenu = createMenu;
exports.updateMenu = updateMenu;
exports.deleteMenu = deleteMenu;
const prisma_1 = require("../lib/prisma");
async function listMenusForTenant(tenantId) {
    return prisma_1.prisma.menu.findMany({
        where: { tenantId, isActive: true },
        include: { children: true, parent: true },
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
    });
}
async function listMenusForUser(userId, tenantId) {
    const user = await prisma_1.prisma.user.findFirst({
        where: { id: userId, tenantId },
        include: { userRoles: { include: { role: { include: { roleMenus: { include: { menu: true } } } } } } },
    });
    if (!user)
        return [];
    const menuIds = new Set();
    for (const ur of user.userRoles) {
        for (const rm of ur.role.roleMenus) {
            menuIds.add(rm.menuId);
        }
    }
    const menus = await prisma_1.prisma.menu.findMany({
        where: { id: { in: Array.from(menuIds) }, tenantId, isActive: true },
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
    });
    return menus;
}
async function getMenuById(menuId, tenantId) {
    return prisma_1.prisma.menu.findFirst({
        where: { id: menuId, tenantId },
        include: { parent: true, children: true },
    });
}
async function createMenu(tenantId, data) {
    return prisma_1.prisma.menu.create({
        data: { tenantId, ...data },
    });
}
async function updateMenu(menuId, tenantId, data) {
    return prisma_1.prisma.menu.update({
        where: { id: menuId },
        data: { ...data, tenantId: undefined },
    });
}
async function deleteMenu(menuId, tenantId) {
    return prisma_1.prisma.menu.deleteMany({
        where: { id: menuId, tenantId },
    });
}
//# sourceMappingURL=menu.service.js.map