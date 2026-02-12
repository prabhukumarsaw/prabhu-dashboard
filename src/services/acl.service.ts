import { prisma } from '../lib/prisma';

export type CreateACLEntryInput = {
  tenantId: string;
  subjectType: 'user' | 'role';
  subjectId: string;
  resourceType: string;
  resourceId?: string;
  permission: string;
  conditions?: object;
};

export async function listACLEntries(tenantId: string, filters?: { subjectType?: string; subjectId?: string; resourceType?: string; resourceId?: string }) {
  const where: { tenantId: string; subjectType?: string; subjectId?: string; resourceType?: string; resourceId?: string } = { tenantId };
  if (filters?.subjectType) where.subjectType = filters.subjectType;
  if (filters?.subjectId) where.subjectId = filters.subjectId;
  if (filters?.resourceType) where.resourceType = filters.resourceType;
  if (filters?.resourceId) where.resourceId = filters.resourceId;

  return prisma.aCLEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function createACLEntry(data: CreateACLEntryInput) {
  return prisma.aCLEntry.create({
    data: {
      tenantId: data.tenantId,
      subjectType: data.subjectType,
      subjectId: data.subjectId,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      permission: data.permission,
      conditions: data.conditions as any,
    },
  });
}

export async function deleteACLEntry(id: string, tenantId: string) {
  return prisma.aCLEntry.deleteMany({
    where: { id, tenantId },
  });
}
