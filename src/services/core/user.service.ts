import { prisma } from '../../lib/prisma';
import { hashPassword } from '../../lib/password';

export type CreateUserInput = {
  tenantId: string;
  email: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleIds?: string[];
};

export type UpdateUserInput = Partial<{
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  zipCode: string;
  organization: string;
  currency: string;
  background: string;
  locale: string;
  timezone: string;
  isActive: boolean;
  roleIds: string[];
}>;

export async function createUser(data: CreateUserInput) {
  // Check if user already exists in this tenant
  const existing = await prisma.user.findFirst({
    where: {
      tenantId: data.tenantId,
      OR: [
        { email: data.email },
        ...(data.username ? [{ username: data.username }] : []),
      ],
    },
  });

  if (existing) {
    throw new Error("User with this email or username already exists");
  }

  const passwordHash = data.password ? await hashPassword(data.password) : null;

  // Resolve role IDs - if none provided, look for a default "user" role for the tenant
  let refinedRoleIds = data.roleIds || [];
  if (refinedRoleIds.length === 0) {
    const defaultRole = await prisma.role.findFirst({
      where: {
        tenantId: data.tenantId,
        code: "user", // Standard default role code
        isActive: true,
      },
    });
    if (defaultRole) {
      refinedRoleIds = [defaultRole.id];
    }
  }

  const user = await prisma.user.create({
    data: {
      tenantId: data.tenantId,
      email: data.email,
      username: data.username,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      userRoles: refinedRoleIds.length
        ? { create: refinedRoleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });
  return user;
}

export async function updateUser(userId: string, tenantId: string, data: UpdateUserInput) {
  if (data.password) {
    (data as any).passwordHash = await hashPassword(data.password);
    delete (data as any).password;
  }
  if (data.roleIds !== undefined) {
    await prisma.userRole.deleteMany({ where: { userId } });
    if (data.roleIds.length > 0) {
      await prisma.userRole.createMany({
        data: data.roleIds.map((roleId) => ({ userId, roleId })),
      });
    }
    delete (data as any).roleIds;
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: data as any,
  });
  return prisma.user.findUnique({
    where: { id: user.id },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });
}

export async function listUsers(tenantId: string, page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;
  const where: { tenantId: string; OR?: object[] } = { tenantId };
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, total, page, limit };
}

export async function getUserById(userId: string, tenantId: string) {
  return prisma.user.findFirst({
    where: { id: userId, tenantId },
    include: { tenant: true, userRoles: { include: { role: true } } },
  });
}

export async function deleteUser(userId: string, tenantId: string) {
  return prisma.user.deleteMany({
    where: { id: userId, tenantId },
  });
}
