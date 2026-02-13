"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPolicies = listPolicies;
exports.getPolicyById = getPolicyById;
exports.createPolicy = createPolicy;
exports.updatePolicy = updatePolicy;
exports.deletePolicy = deletePolicy;
const prisma_1 = require("../lib/prisma");
async function listPolicies(tenantId) {
    return prisma_1.prisma.policy.findMany({
        where: { tenantId, isActive: true },
        include: { rules: { include: { attribute: true } } },
        orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
}
async function getPolicyById(policyId, tenantId) {
    return prisma_1.prisma.policy.findFirst({
        where: { id: policyId, tenantId },
        include: { rules: { include: { attribute: true } } },
    });
}
async function createPolicy(tenantId, data) {
    return prisma_1.prisma.policy.create({
        data: {
            tenantId,
            name: data.name,
            code: data.code,
            description: data.description,
            effect: data.effect,
            priority: data.priority ?? 0,
            rules: data.rules?.length
                ? { create: data.rules.map((r) => ({ attributeId: r.attributeId, operator: r.operator, value: r.value })) }
                : undefined,
        },
        include: { rules: { include: { attribute: true } } },
    });
}
async function updatePolicy(policyId, tenantId, data) {
    return prisma_1.prisma.policy.update({
        where: { id: policyId },
        data,
        include: { rules: { include: { attribute: true } } },
    });
}
async function deletePolicy(policyId, tenantId) {
    return prisma_1.prisma.policy.deleteMany({
        where: { id: policyId, tenantId },
    });
}
//# sourceMappingURL=policy.service.js.map