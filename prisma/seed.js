// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create roles
  const roles = [
    { name: 'system_admin', description: 'System Administrator with full access to all farms' },
    { name: 'owner', description: 'Farm owner, full access to their own farm' },
    { name: 'manager', description: 'Operations management for a farm' },
    { name: 'staff', description: 'Field data entry only' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles seeded');

  // 2. Create permissions
  const permissions = [
    // Existing
    { permissionKey: 'view_financials' },
    { permissionKey: 'delete_financial_record' },
    { permissionKey: 'manage_all_farms' },

    // User management
    { permissionKey: 'view_users' },
    { permissionKey: 'create_user' },
    { permissionKey: 'update_user' },
    { permissionKey: 'delete_user' },
    { permissionKey: 'change_role' },
    { permissionKey: 'change_status' },
    { permissionKey: 'manage_farm_access' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { permissionKey: perm.permissionKey },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions seeded');

  // 3. Assign permissions to roles (via RolePermission)
  // Map role names to permission keys
  const rolePermissionMap = {
    system_admin: [
      'view_financials',
      'delete_financial_record',
      'manage_all_farms',
      'view_users',
      'create_user',
      'update_user',
      'delete_user',
      'change_role',
      'change_status',
      'manage_farm_access',
    ],
    owner: [
      'view_financials',
      'view_users',
      'create_user',
      'update_user',
      'change_status',
      'manage_farm_access',
    ],
    manager: [
      'view_users',
      'update_user',
      'change_status',
    ],
    staff: [
      // No user management permissions
    ],
  };

  // Get all roles and permissions from DB
  const allRoles = await prisma.role.findMany();
  const allPermissions = await prisma.permission.findMany();
  const permMap = {};
  allPermissions.forEach(p => { permMap[p.permissionKey] = p.id; });

  // For each role, assign permissions
  for (const role of allRoles) {
    const permKeys = rolePermissionMap[role.name] || [];
    for (const key of permKeys) {
      const permId = permMap[key];
      if (!permId) continue;
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permId,
        },
      });
    }
  }
  console.log('✅ Role permissions assigned');

  // 4. Create default system admin user (if not exists)
  const adminEmail = 'admin@poultry.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminRole = await prisma.role.findUnique({
      where: { name: 'system_admin' },
    });

    await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: adminEmail,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        status: 'active',
      },
    });
    console.log(`✅ Default admin user created (${adminEmail})`);
  } else {
    console.log(`ℹ️ Admin user already exists (${adminEmail})`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  const permissions = [
  // ... existing permissions
  { permissionKey: 'view_farms' },
  { permissionKey: 'create_farm' },
  { permissionKey: 'update_farm' },
  { permissionKey: 'delete_farm' },
  { permissionKey: 'manage_farm_settings' },
  { permissionKey: 'view_farm_users' },
];

// In rolePermissionMap, update:
const rolePermissionMap = {
  system_admin: [
    // ... existing
    'view_farms',
    'create_farm',
    'update_farm',
    'delete_farm',
    'manage_farm_settings',
    'view_farm_users',
  ],
  owner: [
    // ... existing
    'view_farms',
    'create_farm',
    'update_farm',
    'manage_farm_settings',
    'view_farm_users',
  ],
  manager: [
    // ... existing
    'view_farms',
    'view_farm_users',
  ],
  staff: [
    // no farm permissions
  ],
};