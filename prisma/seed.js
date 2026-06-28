// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Create roles
  const roles = [
    { name: 'owner', description: 'Full system access' },
    { name: 'manager', description: 'Operations management' },
    { name: 'staff', description: 'Field data entry' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log('✅ Roles seeded');

  // Create permissions
  const permissions = [
    { permissionKey: 'view_financials' },
    { permissionKey: 'delete_financial_record' },
    { permissionKey: 'manage_users' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { permissionKey: perm.permissionKey },
      update: {},
      create: perm,
    });
  }
  console.log('✅ Permissions seeded');

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