"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRBAC = checkRBAC;
exports.getUserAttributes = getUserAttributes;
exports.evaluateABACCondition = evaluateABACCondition;
exports.checkPBAC = checkPBAC;
exports.checkACL = checkACL;
exports.canAccess = canAccess;
/**
 * IAM Service - Central access control evaluation
 * Supports: RBAC, ABAC, PBAC, ACL
 */
const prisma_1 = require("../lib/prisma");
// ---------- RBAC ----------
async function checkRBAC(userId, tenantId, permissionCode) {
    const userWithRoles = await prisma_1.prisma.user.findUnique({
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
    if (!userWithRoles)
        return false;
    for (const ur of userWithRoles.userRoles) {
        const expires = ur.expiresAt;
        if (expires && new Date() > expires)
            continue;
        for (const rp of ur.role.rolePermissions) {
            if (rp.permission.code === permissionCode)
                return true;
        }
    }
    return false;
}
// ---------- ABAC (attribute-based) ----------
async function getUserAttributes(userId) {
    const attrs = await prisma_1.prisma.userAttribute.findMany({
        where: { userId },
        include: { attribute: true },
    });
    const out = {};
    for (const a of attrs) {
        out[a.attribute.name] = a.value;
    }
    return out;
}
function evaluateABACCondition(userAttrs, attributeName, operator, expectedValue) {
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
async function checkPBAC(ctx) {
    const policies = await prisma_1.prisma.policy.findMany({
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
        if (allRulesMatch)
            return policy.effect;
    }
    return null;
}
// ---------- ACL ----------
async function checkACL(subjectType, subjectId, tenantId, resourceType, resourceId, permission) {
    const entry = await prisma_1.prisma.aCLEntry.findFirst({
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
async function canAccess(ctx) {
    const { userId, tenantId, permissionCode, resourceType, resourceId, action } = ctx;
    // 1. PBAC (policy-based) - highest priority if policies exist
    const userAttrs = await getUserAttributes(userId);
    const pbacResult = await checkPBAC({
        ...ctx,
        attributes: { ...userAttrs, ...ctx.attributes },
    });
    if (pbacResult === 'DENY')
        return false;
    if (pbacResult === 'ALLOW' && !permissionCode)
        return true;
    // 2. RBAC - permission code
    if (permissionCode) {
        const rbac = await checkRBAC(userId, tenantId, permissionCode);
        if (rbac)
            return true;
    }
    // 3. ACL - resource-level
    if (resourceType && (resourceId || action)) {
        const aclUser = await checkACL('user', userId, tenantId, resourceType, resourceId ?? null, action || permissionCode || 'read');
        if (aclUser)
            return true;
        for (const roleId of ctx.roleIds) {
            const aclRole = await checkACL('role', roleId, tenantId, resourceType, resourceId ?? null, action || permissionCode || 'read');
            if (aclRole)
                return true;
        }
    }
    return false;
}
//# sourceMappingURL=iam.service.js.map