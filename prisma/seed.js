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
    { permissionKey: 'view_financials' },
    { permissionKey: 'delete_financial_record' },
    { permissionKey: 'manage_users' },
    { permissionKey: 'manage_all_farms' }, // for system_admin only
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { permissionKey: perm.permissionKey },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions seeded');

  // 3. Create default system admin user (if not exists)
  const adminEmail = 'admin@poultry.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const adminRole = await prisma.role.findUnique({
      where: { name: 'system_admin' },
    });

    const adminUser = await prisma.user.create({
      data: {
        fullName: 'System Administrator',
        email: adminEmail,
        passwordHash: hashedPassword,
        roleId: adminRole.id,
        status: 'active',
      },
    });
    console.log(`✅ Default admin user created (${adminEmail})`);

    // Optionally, create a default farm for the admin (if needed)
    // But system_admin can access all farms without explicit assignment.
    // We'll skip creating a farm for now.
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