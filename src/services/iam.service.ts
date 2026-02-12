/**
 * IAM Service - Central access control evaluation
 * Supports: RBAC, ABAC, PBAC, ACL
 */
import { prisma } from '../lib/prisma';
import type { User } from '@prisma/client';

export type AccessContext = {
  userId: string;
  tenantId: string;
  roleIds: string[];
  attributes: Record<string, unknown>;
  resourceType?: string;
  resourceId?: string;
  action?: string;
};

// ---------- RBAC ----------
export async function checkRBAC(
  userId: string,
  tenantId: string,
  permissionCode: string
): Promise<boolean> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId, tenantId },
    include: {
      userRoles: {
        where: { role: { isActive: true } },
        include: {
          role: {
            include: {
              rolePermissions: {
                where: { permission: { isActive: true } },
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return false;

  for (const ur of userWithRoles.userRoles) {
    const expires = ur.expiresAt;
    if (expires && new Date() > expires) continue;
    for (const rp of ur.role.rolePermissions) {
      if (rp.permission.code === permissionCode) return true;
    }
  }
  return false;
}

// ---------- ABAC (attribute-based) ----------
export async function getUserAttributes(userId: string): Promise<Record<string, unknown>> {
  const attrs = await prisma.userAttribute.findMany({
    where: { userId },
    include: { attribute: true },
  });
  const out: Record<string, unknown> = {};
  for (const a of attrs) {
    out[a.attribute.name] = a.value;
  }
  return out;
}

export function evaluateABACCondition(
  userAttrs: Record<string, unknown>,
  attributeName: string,
  operator: string,
  expectedValue: unknown
): boolean {
  const actual = userAttrs[attributeName];
  switch (operator) {
    case 'eq':
      return actual === expectedValue;
    case 'ne':
      return actual !== expectedValue;
    case 'in':
      return Array.isArray(expectedValue) && expectedValue.includes(actual);
    case 'contains':
      return Array.isArray(actual) && actual.includes(expectedValue);
    case 'gte':
      return typeof actual === 'number' && typeof expectedValue === 'number' && actual >= expectedValue;
    case 'lte':
      return typeof actual === 'number' && typeof expectedValue === 'number' && actual <= expectedValue;
    default:
      return false;
  }
}

// ---------- PBAC (policy-based) ----------
export async function checkPBAC(ctx: AccessContext): Promise<'ALLOW' | 'DENY' | null> {
  const policies = await prisma.policy.findMany({
    where: { tenantId: ctx.tenantId, isActive: true },
    orderBy: { priority: 'desc' },
    include: { rules: { include: { attribute: true } } },
  });

  for (const policy of policies) {
    let allRulesMatch = true;
    for (const rule of policy.rules) {
      const attrName = rule.attribute?.name;
      if (!attrName || ctx.attributes[attrName] === undefined) {
        allRulesMatch = false;
        break;
      }
      if (!evaluateABACCondition(ctx.attributes, attrName, rule.operator, rule.value)) {
        allRulesMatch = false;
        break;
      }
    }
    if (allRulesMatch) return policy.effect as 'ALLOW' | 'DENY';
  }
  return null;
}

// ---------- ACL ----------
export async function checkACL(
  subjectType: 'user' | 'role',
  subjectId: string,
  tenantId: string,
  resourceType: string,
  resourceId: string | null,
  permission: string
): Promise<boolean> {
  const entry = await prisma.aCLEntry.findFirst({
    where: {
      tenantId,
      subjectType,
      subjectId,
      resourceType,
      resourceId: resourceId ?? undefined,
      permission,
    },
  });
  return !!entry;
}

// ---------- Combined check (recommended for routes) ----------
export async function canAccess(ctx: AccessContext & { permissionCode?: string }): Promise<boolean> {
  const { userId, tenantId, permissionCode, resourceType, resourceId, action } = ctx;

  // 1. PBAC (policy-based) - highest priority if policies exist
  const userAttrs = await getUserAttributes(userId);
  const pbacResult = await checkPBAC({
    ...ctx,
    attributes: { ...userAttrs, ...ctx.attributes },
  });
  if (pbacResult === 'DENY') return false;
  if (pbacResult === 'ALLOW' && !permissionCode) return true;

  // 2. RBAC - permission code
  if (permissionCode) {
    const rbac = await checkRBAC(userId, tenantId, permissionCode);
    if (rbac) return true;
  }

  // 3. ACL - resource-level
  if (resourceType && (resourceId || action)) {
    const aclUser = await checkACL('user', userId, tenantId, resourceType, resourceId ?? null, action || permissionCode || 'read');
    if (aclUser) return true;
    for (const roleId of ctx.roleIds) {
      const aclRole = await checkACL('role', roleId, tenantId, resourceType, resourceId ?? null, action || permissionCode || 'read');
      if (aclRole) return true;
    }
  }

  return false;
}
