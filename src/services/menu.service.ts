import { prisma } from '../lib/prisma';

export async function listMenusForTenant(tenantId: string) {
  return prisma.menu.findMany({
    where: { tenantId, isActive: true },
    include: { children: true, parent: true },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  });
}

export async function listMenusForUser(userId: string, tenantId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: { userRoles: { include: { role: { include: { roleMenus: { include: { menu: true } } } } } } },
  });
  if (!user) return [];
  const menuIds = new Set<string>();
  for (const ur of user.userRoles) {
    for (const rm of ur.role.roleMenus) {
      menuIds.add(rm.menuId);
    }
  }
  const menus = await prisma.menu.findMany({
    where: { id: { in: Array.from(menuIds) }, tenantId, isActive: true },
    orderBy: [{ order: 'asc' }, { title: 'asc' }],
  });
  return menus;
}

export async function getMenuById(menuId: string, tenantId: string) {
  return prisma.menu.findFirst({
    where: { id: menuId, tenantId },
    include: { parent: true, children: true },
  });
}

export async function createMenu(
  tenantId: string,
  data: { title: string; path?: string; icon?: string; parentId?: string; moduleId?: string; order?: number; permissionCode?: string }
) {
  return prisma.menu.create({
    data: { tenantId, ...data },
  });
}

export async function updateMenu(menuId: string, tenantId: string, data: Partial<{ title: string; path: string; icon: string; parentId: string; order: number; permissionCode: string; isActive: boolean }>) {
  return prisma.menu.update({
    where: { id: menuId },
    data: { ...data, tenantId: undefined } as any,
  });
}

export async function deleteMenu(menuId: string, tenantId: string) {
  return prisma.menu.deleteMany({
    where: { id: menuId, tenantId },
  });
}
