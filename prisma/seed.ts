import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    create: {
      name: 'Default Tenant',
      slug: 'default',
      domain: 'localhost',
      isActive: true,
    },
    update: {},
  });

  const coreModule = await prisma.module.upsert({
    where: { code: 'core' },
    create: {
      name: 'Core',
      code: 'core',
      description: 'Core IAM module',
      isActive: true,
    },
    update: {},
  });

  const permissions = [
    { code: 'user:read', name: 'Read users', resource: 'user', action: 'read' },
    { code: 'user:create', name: 'Create users', resource: 'user', action: 'create' },
    { code: 'user:update', name: 'Update users', resource: 'user', action: 'update' },
    { code: 'user:delete', name: 'Delete users', resource: 'user', action: 'delete' },
    { code: 'role:read', name: 'Read roles', resource: 'role', action: 'read' },
    { code: 'role:create', name: 'Create roles', resource: 'role', action: 'create' },
    { code: 'role:update', name: 'Update roles', resource: 'role', action: 'update' },
    { code: 'role:delete', name: 'Delete roles', resource: 'role', action: 'delete' },
    { code: 'tenant:read', name: 'Read tenants', resource: 'tenant', action: 'read' },
    { code: 'tenant:create', name: 'Create tenants', resource: 'tenant', action: 'create' },
    { code: 'tenant:update', name: 'Update tenants', resource: 'tenant', action: 'update' },
    { code: 'menu:read', name: 'Read menus', resource: 'menu', action: 'read' },
    { code: 'menu:create', name: 'Create menus', resource: 'menu', action: 'create' },
    { code: 'menu:update', name: 'Update menus', resource: 'menu', action: 'update' },
    { code: 'menu:delete', name: 'Delete menus', resource: 'menu', action: 'delete' },
    { code: 'permission:read', name: 'Read permissions', resource: 'permission', action: 'read' },
    { code: 'policy:read', name: 'Read policies', resource: 'policy', action: 'read' },
    { code: 'policy:create', name: 'Create policies', resource: 'policy', action: 'create' },
    { code: 'policy:update', name: 'Update policies', resource: 'policy', action: 'update' },
    { code: 'policy:delete', name: 'Delete policies', resource: 'policy', action: 'delete' },
    { code: 'acl:read', name: 'Read ACL', resource: 'acl', action: 'read' },
    { code: 'acl:create', name: 'Create ACL entry', resource: 'acl', action: 'create' },
    { code: 'acl:delete', name: 'Delete ACL entry', resource: 'acl', action: 'delete' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: { ...p, moduleId: coreModule.id },
      update: {},
    });
  }

  let adminRole = await prisma.role.findFirst({
    where: { tenantId: defaultTenant.id, code: 'admin' },
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        tenantId: defaultTenant.id,
        name: 'Admin',
        code: 'admin',
        description: 'Full access',
        isSystem: true,
        isActive: true,
      },
    });
  }

  const allPerms = await prisma.permission.findMany();
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      create: { roleId: adminRole.id, permissionId: perm.id },
      update: {},
    });
  }

  const passwordHash = await hash('Admin@123', 12);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: defaultTenant.id, email: 'admin@example.com' } },
    create: {
      tenantId: defaultTenant.id,
      email: 'admin@example.com',
      username: 'admin',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      emailVerified: true,
      userRoles: { create: [{ roleId: adminRole.id }] },
    },
    update: { passwordHash },
  });

  await prisma.tenantModule.upsert({
    where: { tenantId_moduleId: { tenantId: defaultTenant.id, moduleId: coreModule.id } },
    create: { tenantId: defaultTenant.id, moduleId: coreModule.id, isEnabled: true },
    update: { isEnabled: true },
  });

  console.log('Seed done. Default tenant:', defaultTenant.slug);
  console.log('Admin user: admin@example.com / Admin@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
