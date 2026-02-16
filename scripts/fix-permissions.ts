import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting permission fix...');

    // 1. Find the core module
    const coreModule = await prisma.module.findUnique({
        where: { code: 'core' },
    });

    if (!coreModule) {
        console.error('Core module not found. Please run seed first.');
        return;
    }

    // 2. Ensure file permissions exist
    const filePermissions = [
        { code: 'file:read', name: 'Read files', resource: 'file', action: 'read' },
        { code: 'file:create', name: 'Create files', resource: 'file', action: 'create' },
        { code: 'file:delete', name: 'Delete files', resource: 'file', action: 'delete' },
    ];

    for (const p of filePermissions) {
        await prisma.permission.upsert({
            where: { code: p.code },
            create: { ...p, moduleId: coreModule.id },
            update: {},
        });
    }
    console.log('File permissions ensured.');

    // 3. Find default tenant
    const defaultTenant = await prisma.tenant.findUnique({
        where: { slug: 'default' },
    });

    if (!defaultTenant) {
        console.error('Default tenant not found.');
        return;
    }

    // 4. Ensure "user" role exists in default tenant
    let userRole = await prisma.role.findFirst({
        where: { tenantId: defaultTenant.id, code: 'user' },
    });

    if (!userRole) {
        userRole = await prisma.role.create({
            data: {
                tenantId: defaultTenant.id,
                name: 'User',
                code: 'user',
                description: 'Default user access',
                isSystem: true,
                isActive: true,
            },
        });
        console.log('User role created.');
    }

    // 5. Assign file permissions to user role
    const filePermsInDb = await prisma.permission.findMany({
        where: { resource: 'file' },
    });

    for (const perm of filePermsInDb) {
        await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: userRole.id, permissionId: perm.id } },
            create: { roleId: userRole.id, permissionId: perm.id },
            update: {},
        });
    }
    console.log('File permissions assigned to user role.');

    // 6. Assign "user" role to all users who don't have it
    const users = await prisma.user.findMany({
        include: { userRoles: true },
    });

    console.log(`Checking ${users.length} users...`);
    let updatedCount = 0;

    for (const user of users) {
        const hasUserRole = user.userRoles.some((ur) => ur.roleId === userRole!.id);
        if (!hasUserRole) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: userRole.id,
                },
            });
            updatedCount++;
        }
    }

    console.log(`Done! Assigned "user" role to ${updatedCount} users.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
