import { PrismaClient, StoreType, UserRole } from '@prisma/client';
import * as fs from 'fs';

const databaseUrl = process.env.DATABASE_URL || "postgresql://admin:password@127.0.0.1:5432/whatsapp_automation?schema=public&sslmode=disable";
const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function seedUsersAndTenants() {
  console.log('🌱 Starting Users and Tenants Seed...\n');

  // 1. Seed Tenants
  const tenantsData = [
    {
      id: 'golden-cafe',
      name: 'The Golden Cafe ☕✨',
      slug: 'golden-cafe',
      type: StoreType.RESTAURANT,
      whatsappNumber: '+919999999999',
      address: '123 Gourmet St, Foodie City',
    },
    {
      id: 'tech-hub',
      name: 'Tech Hub Electronics 💻',
      slug: 'tech-hub',
      type: StoreType.ECOMMERCE,
      whatsappNumber: '+918888888888',
      address: '404 Silicon Valley',
    },
    {
      id: 'pharmacy-plus',
      name: 'Pharmacy Plus 💊',
      slug: 'pharmacy-plus',
      type: StoreType.PHARMACY,
      whatsappNumber: '+917777777777',
      address: '77 Health Ave',
    }
  ];

  for (const t of tenantsData) {
    await prisma.tenant.upsert({
      where: { slug: t.slug },
      update: { name: t.name, address: t.address, type: t.type },
      create: t,
    });
    console.log(`✅ Tenant Created: ${t.name}`);
  }

  // 2. Seed Users / Customers
  const usersData = [
    {
      phone: '+919876543210',
      name: 'Ajay Gupta',
      email: 'ajay@example.com',
      tenantId: 'golden-cafe',
      role: UserRole.CUSTOMER,
      metadata: { lastOrder: 'Premium Cappuccino', preference: 'Hot' }
    },
    {
      phone: '+919876543210',  // Notice how the SAME phone number can exist in a DIFFERENT tenant
      name: 'Ajay Tech',
      email: 'ajay.tech@example.com',
      tenantId: 'tech-hub',
      role: UserRole.CUSTOMER,
      metadata: { lastOrder: 'Mechanical Keyboard' }
    },
    {
      phone: '+915555555555',
      name: 'Alice Manager',
      email: 'alice@goldencafe.com',
      tenantId: 'golden-cafe',
      role: UserRole.ADMIN, // Admin role within golden cafe
      metadata: {}
    },
    {
      phone: '+914444444444',
      name: 'Deleted User',
      email: 'deleted@example.com',
      tenantId: 'pharmacy-plus',
      role: UserRole.CUSTOMER,
      isActive: false, // Showcasing the soft delete
      metadata: { note: 'Account was deactivated' }
    }
  ];

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { phone_tenantId: { phone: u.phone, tenantId: u.tenantId } },
      update: { name: u.name, isActive: u.isActive, role: u.role, metadata: u.metadata },
      create: u,
    });
    console.log(`✅ User Created: ${u.name} (Tenant: ${u.tenantId}, Active: ${u.isActive !== false})`);
  }

  console.log('\n🌟 Users and Tenants Seeded Successfully! 🌟');
}

seedUsersAndTenants()
  .catch((e) => {
    const errorMsg = `❌ Error seeding Users/Tenants: ${e.message}\n${e.stack || ''}`;
    console.error(errorMsg);
    fs.writeFileSync('seeder_users_debug.log', errorMsg);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
