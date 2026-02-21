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
  address?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  organization?: string;
  currency?: string;
  locale?: string;
  timezone?: string;
  avatar?: string;
  isActive?: boolean;
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
  avatar: string;
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
      address: data.address,
      state: data.state,
      country: data.country,
      zipCode: data.zipCode,
      organization: data.organization,
      currency: data.currency,
      locale: data.locale,
      timezone: data.timezone,
      avatar: data.avatar,
      isActive: data.isActive !== undefined ? data.isActive : true,
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
  return { users, total, page, limit, pages: Math.ceil(total / limit) };
}

export async function listAllUsers(
  page = 1,
  limit = 20,
  search?: string,
  filters?: {
    email?: string;
    username?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    fromDate?: string;
    toDate?: string;
    status?: string;
    tenantId?: string;
  }
) {
  const skip = (page - 1) * limit;
  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { username: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (filters?.email) where.email = { contains: filters.email, mode: 'insensitive' };
  if (filters?.username) where.username = { contains: filters.username, mode: 'insensitive' };
  if (filters?.phone) where.phone = { contains: filters.phone, mode: 'insensitive' };
  if (filters?.firstName) where.firstName = { contains: filters.firstName, mode: 'insensitive' };
  if (filters?.lastName) where.lastName = { contains: filters.lastName, mode: 'insensitive' };
  if (filters?.tenantId) where.tenantId = filters.tenantId;

  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {};
    if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
    if (filters.toDate) {
      const toDateObj = new Date(filters.toDate);
      toDateObj.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDateObj;
    }
  }

  if (filters?.status && filters.status !== 'all') {
    where.isActive = filters.status === 'active';
  }

  const [users, total, globalTotal, activeTotal, verifiedTotal] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { tenant: true, userRoles: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { mfaEnabled: true } })
  ]);

  return {
    users,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    stats: {
      total: globalTotal,
      active: activeTotal,
      revoked: globalTotal - activeTotal,
      verified: verifiedTotal,
      unverified: globalTotal - verifiedTotal
    }
  };
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
