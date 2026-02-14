import { prisma } from '../../lib/prisma';

export async function listPermissions(moduleCode?: string) {
  const where = moduleCode ? { module: { code: moduleCode }, isActive: true } : { isActive: true };
  return prisma.permission.findMany({
    where,
    include: { module: true },
    orderBy: [{ resource: 'asc' }, { action: 'asc' }, { code: 'asc' }],
  });
}

export async function getByCode(code: string) {
  return prisma.permission.findUnique({
    where: { code, isActive: true },
    include: { module: true },
  });
}
