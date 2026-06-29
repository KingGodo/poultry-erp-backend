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

  // 2. Create ALL permissions
  const permissions = [
    // === Financial ===
    { permissionKey: 'view_financials' },
    { permissionKey: 'delete_financial_record' },

    // === System ===
    { permissionKey: 'manage_all_farms' },

    // === User Management ===
    { permissionKey: 'view_users' },
    { permissionKey: 'create_user' },
    { permissionKey: 'update_user' },
    { permissionKey: 'delete_user' },
    { permissionKey: 'change_role' },
    { permissionKey: 'change_status' },
    { permissionKey: 'manage_farm_access' },

    // === Farm Management ===
    { permissionKey: 'view_farms' },
    { permissionKey: 'create_farm' },
    { permissionKey: 'update_farm' },
    { permissionKey: 'delete_farm' },
    { permissionKey: 'manage_farm_settings' },
    { permissionKey: 'view_farm_users' },

    // === Houses & Runs ===
    { permissionKey: 'view_houses' },
    { permissionKey: 'create_house' },
    { permissionKey: 'update_house' },
    { permissionKey: 'delete_house' },
    { permissionKey: 'view_runs' },
    { permissionKey: 'create_run' },
    { permissionKey: 'update_run' },
    { permissionKey: 'delete_run' },
    { permissionKey: 'update_run_status' },

    // === Batch Management ===
    { permissionKey: 'view_batches' },
    { permissionKey: 'create_batch' },
    { permissionKey: 'update_batch' },
    { permissionKey: 'delete_batch' },
    { permissionKey: 'change_batch_status' },
    { permissionKey: 'view_allocations' },
    { permissionKey: 'create_allocation' },
    { permissionKey: 'update_allocation' },
    { permissionKey: 'delete_allocation' },
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
  const rolePermissionMap = {
    system_admin: [
      // Financial
      'view_financials',
      'delete_financial_record',
      // System
      'manage_all_farms',
      // User Management
      'view_users',
      'create_user',
      'update_user',
      'delete_user',
      'change_role',
      'change_status',
      'manage_farm_access',
      // Farm Management
      'view_farms',
      'create_farm',
      'update_farm',
      'delete_farm',
      'manage_farm_settings',
      'view_farm_users',
      // Houses & Runs
      'view_houses',
      'create_house',
      'update_house',
      'delete_house',
      'view_runs',
      'create_run',
      'update_run',
      'delete_run',
      'update_run_status',
      // Batch Management
      'view_batches',
      'create_batch',
      'update_batch',
      'delete_batch',
      'change_batch_status',
      'view_allocations',
      'create_allocation',
      'update_allocation',
      'delete_allocation',
    ],
    owner: [
      // Financial
      'view_financials',
      // User Management
      'view_users',
      'create_user',
      'update_user',
      'change_status',
      'manage_farm_access',
      // Farm Management
      'view_farms',
      'create_farm',
      'update_farm',
      'manage_farm_settings',
      'view_farm_users',
      // Houses & Runs
      'view_houses',
      'create_house',
      'update_house',
      'view_runs',
      'create_run',
      'update_run',
      'update_run_status',
      // Batch Management
      'view_batches',
      'create_batch',
      'update_batch',
      'change_batch_status',
      'view_allocations',
      'create_allocation',
      'update_allocation',
      'delete_allocation',
    ],
    manager: [
      // User Management
      'view_users',
      'update_user',
      'change_status',
      // Farm Management
      'view_farms',
      'view_farm_users',
      // Houses & Runs
      'view_houses',
      'view_runs',
      'update_run_status',
      // Batch Management
      'view_batches',
      'view_allocations',
      'create_allocation',
      'update_allocation',
    ],
    staff: [
      // Houses & Runs (read-only)
      'view_houses',
      'view_runs',
      // Batch Management (read-only)
      'view_batches',
      'view_allocations',
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