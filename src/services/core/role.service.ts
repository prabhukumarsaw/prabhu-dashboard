import { prisma } from '../../lib/prisma';

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId, isActive: true },
    include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function getRoleById(roleId: string, tenantId: string) {
  return prisma.role.findFirst({
    where: { id: roleId, tenantId },
    include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
  });
}

export async function createRole(
  tenantId: string,
  data: { name: string; code: string; description?: string; permissionIds?: string[]; menuIds?: string[] }
) {
  const role = await prisma.role.create({
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

export async function updateRole(
  roleId: string,
  tenantId: string,
  data: Partial<{ name: string; code: string; description: string; isActive: boolean; permissionIds: string[]; menuIds: string[] }>
) {
  if (data.permissionIds !== undefined) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map((pId) => ({ roleId, permissionId: pId })),
      });
    }
  }
  if (data.menuIds !== undefined) {
    await prisma.roleMenu.deleteMany({ where: { roleId } });
    if (data.menuIds.length > 0) {
      await prisma.roleMenu.createMany({
        data: data.menuIds.map((menuId) => ({ roleId, menuId })),
      });
    }
  }
  const { permissionIds, menuIds, ...rest } = data;
  return prisma.role.update({
    where: { id: roleId },
    data: rest,
    include: { rolePermissions: { include: { permission: true } }, roleMenus: { include: { menu: true } } },
  });
}

export async function deleteRole(roleId: string, tenantId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (role?.isSystem) {
    throw new Error('System roles cannot be deleted');
  }
  return prisma.role.deleteMany({ where: { id: roleId, tenantId } });
}
