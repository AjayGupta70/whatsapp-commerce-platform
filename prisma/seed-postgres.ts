// ============================================
// Database Seed — PostgreSQL (Prisma)
// Run: npx prisma db seed
// ============================================

import { PrismaClient, StoreType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding PostgreSQL database...');

  // ─── Create default tenant ───────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-store' },
    update: {},
    create: {
      name: 'Demo Store',
      slug: 'demo-store',
      type: StoreType.RESTAURANT,
      whatsappNumber: '+911234567890',
      email: 'admin@demostore.com',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        autoReply: true,
        paymentTimeout: 600, // seconds
      },
    },
  });

  console.log(`  ✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Create admin user ────────────────────
  const admin = await prisma.user.upsert({
    where: { phone_tenantId: { phone: '+911234567890', tenantId: tenant.id } },
    update: {},
    create: {
      phone: '+911234567890',
      name: 'Admin User',
      email: 'admin@demostore.com',
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  });

  console.log(`  ✅ Admin: ${admin.name} (${admin.id})`);

  // ─── Create categories ────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug_tenantId: { slug: 'burgers', tenantId: tenant.id } },
      update: {},
      create: { name: 'Burgers', slug: 'burgers', icon: '🍔', sortOrder: 1, tenantId: tenant.id },
    }),
    prisma.category.upsert({
      where: { slug_tenantId: { slug: 'pizzas', tenantId: tenant.id } },
      update: {},
      create: { name: 'Pizzas', slug: 'pizzas', icon: '🍕', sortOrder: 2, tenantId: tenant.id },
    }),
    prisma.category.upsert({
      where: { slug_tenantId: { slug: 'drinks', tenantId: tenant.id } },
      update: {},
      create: { name: 'Drinks', slug: 'drinks', icon: '🥤', sortOrder: 3, tenantId: tenant.id },
    }),
  ]);

  console.log(`  ✅ Categories: ${categories.map((c: any) => c.name).join(', ')}`);

  // ─── Create products + inventory ──────────
  const products = [
    { name: 'Classic Burger', slug: 'classic-burger', price: 150, category: categories[0], stock: 20 },
    { name: 'Cheese Burger', slug: 'cheese-burger', price: 180, category: categories[0], stock: 15 },
    { name: 'Veggie Burger', slug: 'veggie-burger', price: 130, category: categories[0], stock: 10 },
    { name: 'Margherita Pizza', slug: 'margherita-pizza', price: 250, category: categories[1], stock: 12 },
    { name: 'Pepperoni Pizza', slug: 'pepperoni-pizza', price: 300, category: categories[1], stock: 8 },
    { name: 'Coke', slug: 'coke', price: 50, category: categories[2], stock: 50 },
    { name: 'Lemonade', slug: 'lemonade', price: 60, category: categories[2], stock: 30 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug_tenantId: { slug: p.slug, tenantId: tenant.id } },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        price: p.price,
        description: `Delicious ${p.name}`,
        tenantId: tenant.id,
        categoryId: p.category.id,
      },
    });

    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        stock: p.stock,
        lowStockThreshold: 5,
        productId: product.id,
        tenantId: tenant.id,
      },
    });

    console.log(`  ✅ Product: ${p.name} (stock: ${p.stock})`);
  }

  console.log('\n🎉 PostgreSQL seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
