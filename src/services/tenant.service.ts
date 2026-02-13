import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export async function listTenants(page = 1, limit = 20, search?: string) {
  const skip = (page - 1) * limit;
  const where: Prisma.TenantWhereInput = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }, { slug: { contains: search, mode: 'insensitive' as Prisma.QueryMode } }], isActive: true }
    : { isActive: true };
  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
    prisma.tenant.count({ where }),
  ]);
  return { tenants, total, page, limit };
}

export async function getTenantById(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { modules: { include: { module: true } } },
  });
}

export async function getTenantBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: { slug, isActive: true },
  });
}

export async function createTenant(data: { name: string; slug: string; domain?: string; logo?: string; settings?: object }) {
  return prisma.tenant.create({
    data,
  });
}

export async function updateTenant(id: string, data: Partial<{ name: string; slug: string; domain: string; logo: string; settings: object; isActive: boolean }>) {
  return prisma.tenant.update({
    where: { id },
    data,
  });
}

export async function enableModule(tenantId: string, moduleId: string, config?: object) {
  return prisma.tenantModule.upsert({
    where: { tenantId_moduleId: { tenantId, moduleId } },
    create: { tenantId, moduleId, config: config as any },
    update: { isEnabled: true, config: config as any },
  });
}

export async function disableModule(tenantId: string, moduleId: string) {
  return prisma.tenantModule.updateMany({
    where: { tenantId, moduleId },
    data: { isEnabled: false },
  });
}
