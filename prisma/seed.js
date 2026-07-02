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

    // === Feed Management ===
    { permissionKey: 'view_feed_types' },
    { permissionKey: 'create_feed_type' },
    { permissionKey: 'update_feed_type' },
    { permissionKey: 'delete_feed_type' },
    { permissionKey: 'view_feed_purchases' },
    { permissionKey: 'create_feed_purchase' },
    { permissionKey: 'update_feed_purchase' },
    { permissionKey: 'delete_feed_purchase' },
    { permissionKey: 'view_feed_stock' },
    { permissionKey: 'view_feed_distributions' },
    { permissionKey: 'create_feed_distribution' },
    { permissionKey: 'update_feed_distribution' },
    { permissionKey: 'delete_feed_distribution' },

    // === Mortality & Vaccination ===
    { permissionKey: 'view_mortality_reasons' },
    { permissionKey: 'create_mortality_reason' },
    { permissionKey: 'update_mortality_reason' },
    { permissionKey: 'delete_mortality_reason' },
    { permissionKey: 'view_mortality_records' },
    { permissionKey: 'create_mortality_record' },
    { permissionKey: 'update_mortality_record' },
    { permissionKey: 'delete_mortality_record' },
    { permissionKey: 'view_vaccines' },
    { permissionKey: 'create_vaccine' },
    { permissionKey: 'update_vaccine' },
    { permissionKey: 'delete_vaccine' },
    { permissionKey: 'view_vaccination_schedules' },
    { permissionKey: 'create_vaccination_schedule' },
    { permissionKey: 'update_vaccination_schedule' },
    { permissionKey: 'delete_vaccination_schedule' },
    { permissionKey: 'update_schedule_status' },
    { permissionKey: 'view_vaccinations' },
    { permissionKey: 'create_vaccination' },
    { permissionKey: 'update_vaccination' },
    { permissionKey: 'delete_vaccination' },

    // === Customers ===
    { permissionKey: 'view_customers' },
    { permissionKey: 'create_customer' },
    { permissionKey: 'update_customer' },
    { permissionKey: 'delete_customer' },

    // === Sales ===
    { permissionKey: 'view_sales' },
    { permissionKey: 'create_sale' },
    { permissionKey: 'update_sale' },
    { permissionKey: 'delete_sale' },
    { permissionKey: 'view_sales_stats' },
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
      // Feed Management
      'view_feed_types',
      'create_feed_type',
      'update_feed_type',
      'delete_feed_type',
      'view_feed_purchases',
      'create_feed_purchase',
      'update_feed_purchase',
      'delete_feed_purchase',
      'view_feed_stock',
      'view_feed_distributions',
      'create_feed_distribution',
      'update_feed_distribution',
      'delete_feed_distribution',
      // Mortality & Vaccination
      'view_mortality_reasons',
      'create_mortality_reason',
      'update_mortality_reason',
      'delete_mortality_reason',
      'view_mortality_records',
      'create_mortality_record',
      'update_mortality_record',
      'delete_mortality_record',
      'view_vaccines',
      'create_vaccine',
      'update_vaccine',
      'delete_vaccine',
      'view_vaccination_schedules',
      'create_vaccination_schedule',
      'update_vaccination_schedule',
      'delete_vaccination_schedule',
      'update_schedule_status',
      'view_vaccinations',
      'create_vaccination',
      'update_vaccination',
      'delete_vaccination',
      // Customers
      'view_customers',
      'create_customer',
      'update_customer',
      'delete_customer',
      // Sales
      'view_sales',
      'create_sale',
      'update_sale',
      'delete_sale',
      'view_sales_stats',
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
      // Feed Management
      'view_feed_types',
      'create_feed_type',
      'update_feed_type',
      'view_feed_purchases',
      'create_feed_purchase',
      'update_feed_purchase',
      'view_feed_stock',
      'view_feed_distributions',
      'create_feed_distribution',
      'update_feed_distribution',
      // Mortality & Vaccination
      'view_mortality_reasons',
      'create_mortality_reason',
      'update_mortality_reason',
      'view_mortality_records',
      'create_mortality_record',
      'update_mortality_record',
      'view_vaccines',
      'create_vaccine',
      'update_vaccine',
      'view_vaccination_schedules',
      'create_vaccination_schedule',
      'update_vaccination_schedule',
      'update_schedule_status',
      'view_vaccinations',
      'create_vaccination',
      'update_vaccination',
      // Customers
      'view_customers',
      'create_customer',
      'update_customer',
      'delete_customer',
      // Sales
      'view_sales',
      'create_sale',
      'update_sale',
      'delete_sale',
      'view_sales_stats',
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
      // Feed Management
      'view_feed_types',
      'view_feed_purchases',
      'view_feed_stock',
      'view_feed_distributions',
      'create_feed_distribution',
      // Mortality & Vaccination
      'view_mortality_reasons',
      'view_mortality_records',
      'create_mortality_record',
      'view_vaccines',
      'view_vaccination_schedules',
      'view_vaccinations',
      'create_vaccination',
      // Customers
      'view_customers',
      'create_customer',
      'update_customer',
      // Sales
      'view_sales',
      'create_sale',
      'view_sales_stats',
    ],
    staff: [
      // Houses & Runs
      'view_houses',
      'view_runs',
      // Batch Management
      'view_batches',
      'view_allocations',
      // Feed Management
      'view_feed_types',
      'view_feed_purchases',
      'view_feed_stock',
      'view_feed_distributions',
      // Mortality & Vaccination
      'view_mortality_reasons',
      'view_mortality_records',
      'view_vaccines',
      'view_vaccination_schedules',
      'view_vaccinations',
      // Customers
      'view_customers',
      // Sales
      'view_sales',
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