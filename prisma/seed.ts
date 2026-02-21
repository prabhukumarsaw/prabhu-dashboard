import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create 3 Tenants
  const defaultTenant = await prisma.tenant.upsert({
    where: { slug: 'default' },
    create: { name: 'Acme Corp', slug: 'default', domain: 'acme.localhost', isActive: true },
    update: {},
  });

  const tenantTwo = await prisma.tenant.upsert({
    where: { slug: 'stark' },
    create: { name: 'Stark Industries', slug: 'stark', domain: 'stark.localhost', isActive: true },
    update: {},
  });

  const tenantThree = await prisma.tenant.upsert({
    where: { slug: 'wayne' },
    create: { name: 'Wayne Enterprises', slug: 'wayne', domain: 'wayne.localhost', isActive: true },
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

  // Assign Core Module to all tenants
  for (const tenant of [defaultTenant, tenantTwo, tenantThree]) {
    await prisma.tenantModule.upsert({
      where: { tenantId_moduleId: { tenantId: tenant.id, moduleId: coreModule.id } },
      create: { tenantId: tenant.id, moduleId: coreModule.id, isEnabled: true },
      update: { isEnabled: true },
    });
  }

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
    { code: 'file:read', name: 'Read files', resource: 'file', action: 'read' },
    { code: 'file:create', name: 'Create files', resource: 'file', action: 'create' },
    { code: 'file:delete', name: 'Delete files', resource: 'file', action: 'delete' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: { ...p, moduleId: coreModule.id },
      update: {},
    });
  }

  const allPerms = await prisma.permission.findMany();
  const filePerms = allPerms.filter((p) => p.resource === 'file');
  const readPerms = allPerms.filter((p) => p.action === 'read');

  // We need to create Roles per tenant
  const createRolesForTenant = async (tenantId: string) => {
    let adminRole = await prisma.role.findFirst({ where: { tenantId, code: 'admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: { tenantId, name: 'Admin', code: 'admin', description: 'Full access', isSystem: true, isActive: true },
      });
      for (const perm of allPerms) {
        await prisma.rolePermission.create({ data: { roleId: adminRole.id, permissionId: perm.id } });
      }
    }

    let managerRole = await prisma.role.findFirst({ where: { tenantId, code: 'manager' } });
    if (!managerRole) {
      managerRole = await prisma.role.create({
        data: { tenantId, name: 'Manager', code: 'manager', description: 'Management access', isSystem: true, isActive: true },
      });
    }

    let editorRole = await prisma.role.findFirst({ where: { tenantId, code: 'editor' } });
    if (!editorRole) {
      editorRole = await prisma.role.create({
        data: { tenantId, name: 'Editor', code: 'editor', description: 'Can read and update', isSystem: true, isActive: true },
      });
    }

    let viewerRole = await prisma.role.findFirst({ where: { tenantId, code: 'viewer' } });
    if (!viewerRole) {
      viewerRole = await prisma.role.create({
        data: { tenantId, name: 'Viewer', code: 'viewer', description: 'Read-only access', isSystem: true, isActive: true },
      });
      for (const perm of readPerms) {
        await prisma.rolePermission.create({ data: { roleId: viewerRole.id, permissionId: perm.id } });
      }
    }

    let userRole = await prisma.role.findFirst({ where: { tenantId, code: 'user' } });
    if (!userRole) {
      userRole = await prisma.role.create({
        data: { tenantId, name: 'User', code: 'user', description: 'Default user access', isSystem: true, isActive: true },
      });
      for (const perm of filePerms) {
        await prisma.rolePermission.create({ data: { roleId: userRole.id, permissionId: perm.id } });
      }
    }

    return { adminRole, managerRole, editorRole, viewerRole, userRole };
  };

  const rolesDefault = await createRolesForTenant(defaultTenant.id);
  const rolesStark = await createRolesForTenant(tenantTwo.id);
  const rolesWayne = await createRolesForTenant(tenantThree.id);

  // 4 Users across various configurations
  const passwordHash = await hash('Security@123!', 12);

  // 1. Admin (Default Tenant)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: defaultTenant.id, email: 'admin@example.com' } },
    create: {
      tenantId: defaultTenant.id,
      email: 'admin@example.com',
      username: 'admin',
      passwordHash,
      firstName: 'Alice',
      lastName: 'Admin',
      isActive: true,
      userRoles: { create: [{ roleId: rolesDefault.adminRole.id }] },
    },
    update: { passwordHash },
  });

  // 2. Manager (Stark Industries)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenantTwo.id, email: 'manager@stark.com' } },
    create: {
      tenantId: tenantTwo.id,
      email: 'manager@stark.com',
      username: 'manager_stark',
      passwordHash,
      firstName: 'Tony',
      lastName: 'Manager',
      isActive: true,
      userRoles: { create: [{ roleId: rolesStark.managerRole.id }] },
    },
    update: { passwordHash },
  });

  // 3. Editor (Wayne Enterprises)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenantThree.id, email: 'editor@wayne.com' } },
    create: {
      tenantId: tenantThree.id,
      email: 'editor@wayne.com',
      username: 'editor_wayne',
      passwordHash,
      firstName: 'Bruce',
      lastName: 'Editor',
      isActive: true,
      userRoles: { create: [{ roleId: rolesWayne.editorRole.id }] },
    },
    update: { passwordHash },
  });

  // 4. Viewer (Default Tenant)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: defaultTenant.id, email: 'viewer@acme.com' } },
    create: {
      tenantId: defaultTenant.id,
      email: 'viewer@acme.com',
      username: 'viewer',
      passwordHash,
      firstName: 'Bob',
      lastName: 'Viewer',
      isActive: true,
      userRoles: { create: [{ roleId: rolesDefault.viewerRole.id }] },
    },
    update: { passwordHash },
  });

  console.log('Seed completed successfully!');
  console.log('--- Configured 3 Tenants ---');
  console.log(`1. ${defaultTenant.name}`);
  console.log(`2. ${tenantTwo.name}`);
  console.log(`3. ${tenantThree.name}`);
  console.log('\n--- Provisioned 4 Users ---');
  console.log('admin@example.com / Security@123!');
  console.log('manager@stark.com / Security@123!');
  console.log('editor@wayne.com / Security@123!');
  console.log('viewer@acme.com / Security@123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
