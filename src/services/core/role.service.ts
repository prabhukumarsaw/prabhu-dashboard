import { prisma } from '../../lib/prisma';

export async function listRoles(
  tenantId: string,
  options?: { search?: string; page?: number; limit?: number; includeStats?: boolean }
) {
  const { search, page = 1, limit = 50, includeStats = false } = options || {};
  const skip = (page - 1) * limit;

  const where: any = { tenantId };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      where,
      skip,
      take: limit,
      include: {
        rolePermissions: { include: { permission: true } },
        roleMenus: { include: { menu: true } },
        _count: includeStats ? { select: { userRoles: true } } : false,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.role.count({ where }),
  ]);

  return { roles, total, page, limit };
}

export async function getRoleById(roleId: string, tenantId: string) {
  return prisma.role.findFirst({
    where: { id: roleId, tenantId },
    include: {
      rolePermissions: { include: { permission: true } },
      roleMenus: { include: { menu: true } },
      _count: { select: { userRoles: true } },
    },
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
  // Check if system role
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (role?.isSystem && (data.code !== undefined && data.code !== role.code)) {
    throw new Error('System role code cannot be modified');
  }

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

export async function toggleRoleStatus(roleId: string, tenantId: string, isActive: boolean) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (!role) {
    throw new Error('Role not found');
  }
  if (role.isSystem && !isActive) {
    throw new Error('System roles cannot be suspended');
  }
  return prisma.role.update({
    where: { id: roleId },
    data: { isActive },
  });
}

export async function deleteRole(roleId: string, tenantId: string) {
  const role = await prisma.role.findFirst({ where: { id: roleId, tenantId } });
  if (role?.isSystem) {
    throw new Error('System roles cannot be deleted');
  }
  return prisma.role.deleteMany({ where: { id: roleId, tenantId } });
}
