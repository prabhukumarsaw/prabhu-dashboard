import { prisma } from '../lib/prisma';

export async function listPolicies(tenantId: string) {
  return prisma.policy.findMany({
    where: { tenantId, isActive: true },
    include: { rules: { include: { attribute: true } } },
    orderBy: [{ priority: 'desc' }, { name: 'asc' }],
  });
}

export async function getPolicyById(policyId: string, tenantId: string) {
  return prisma.policy.findFirst({
    where: { id: policyId, tenantId },
    include: { rules: { include: { attribute: true } } },
  });
}

export async function createPolicy(
  tenantId: string,
  data: {
    name: string;
    code: string;
    description?: string;
    effect: 'ALLOW' | 'DENY';
    priority?: number;
    rules?: { attributeId: string; operator: string; value: object }[];
  }
) {
  return prisma.policy.create({
    data: {
      tenantId,
      name: data.name,
      code: data.code,
      description: data.description,
      effect: data.effect,
      priority: data.priority ?? 0,
      rules: data.rules?.length
        ? { create: data.rules.map((r) => ({ attributeId: r.attributeId, operator: r.operator, value: r.value as any })) }
        : undefined,
    },
    include: { rules: { include: { attribute: true } } },
  });
}

export async function updatePolicy(
  policyId: string,
  tenantId: string,
  data: Partial<{ name: string; code: string; description: string; effect: string; priority: number; isActive: boolean }>
) {
  return prisma.policy.update({
    where: { id: policyId },
    data,
    include: { rules: { include: { attribute: true } } },
  });
}

export async function deletePolicy(policyId: string, tenantId: string) {
  return prisma.policy.deleteMany({
    where: { id: policyId, tenantId },
  });
}
