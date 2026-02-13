"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listACLEntries = listACLEntries;
exports.createACLEntry = createACLEntry;
exports.deleteACLEntry = deleteACLEntry;
const prisma_1 = require("../lib/prisma");
async function listACLEntries(tenantId, filters) {
    const where = { tenantId };
    if (filters?.subjectType)
        where.subjectType = filters.subjectType;
    if (filters?.subjectId)
        where.subjectId = filters.subjectId;
    if (filters?.resourceType)
        where.resourceType = filters.resourceType;
    if (filters?.resourceId)
        where.resourceId = filters.resourceId;
    return prisma_1.prisma.aCLEntry.findMany({
        where,
        orderBy: { createdAt: 'desc' },
    });
}
async function createACLEntry(data) {
    return prisma_1.prisma.aCLEntry.create({
        data: {
            tenantId: data.tenantId,
            subjectType: data.subjectType,
            subjectId: data.subjectId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            permission: data.permission,
            conditions: data.conditions,
        },
    });
}
async function deleteACLEntry(id, tenantId) {
    return prisma_1.prisma.aCLEntry.deleteMany({
        where: { id, tenantId },
    });
}
//# sourceMappingURL=acl.service.js.map