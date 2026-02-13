"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.deleteUser = deleteUser;
const prisma_1 = require("../lib/prisma");
const password_1 = require("../lib/password");
async function createUser(data) {
    const passwordHash = data.password ? await (0, password_1.hashPassword)(data.password) : null;
    const user = await prisma_1.prisma.user.create({
        data: {
            tenantId: data.tenantId,
            email: data.email,
            username: data.username,
            passwordHash,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            userRoles: data.roleIds?.length
                ? { create: data.roleIds.map((roleId) => ({ roleId })) }
                : undefined,
        },
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
    return user;
}
async function updateUser(userId, tenantId, data) {
    if (data.password) {
        data.passwordHash = await (0, password_1.hashPassword)(data.password);
        delete data.password;
    }
    if (data.roleIds !== undefined) {
        await prisma_1.prisma.userRole.deleteMany({ where: { userId } });
        if (data.roleIds.length > 0) {
            await prisma_1.prisma.userRole.createMany({
                data: data.roleIds.map((roleId) => ({ userId, roleId })),
            });
        }
        delete data.roleIds;
    }
    const user = await prisma_1.prisma.user.update({
        where: { id: userId },
        data: data,
    });
    return prisma_1.prisma.user.findUnique({
        where: { id: user.id },
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
}
async function listUsers(tenantId, page = 1, limit = 20, search) {
    const skip = (page - 1) * limit;
    const where = { tenantId };
    if (search) {
        where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
        ];
    }
    const [users, total] = await Promise.all([
        prisma_1.prisma.user.findMany({
            where,
            skip,
            take: limit,
            include: { userRoles: { include: { role: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma_1.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
}
async function getUserById(userId, tenantId) {
    return prisma_1.prisma.user.findFirst({
        where: { id: userId, tenantId },
        include: { tenant: true, userRoles: { include: { role: true } } },
    });
}
async function deleteUser(userId, tenantId) {
    return prisma_1.prisma.user.deleteMany({
        where: { id: userId, tenantId },
    });
}
//# sourceMappingURL=user.service.js.map