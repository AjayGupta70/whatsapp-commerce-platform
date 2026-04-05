// ============================================
// Seed Golden Catalog Data
// For perfectly structured WhatsApp Menu testing
// ============================================

import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || "postgresql://admin:password@127.0.0.1:5432/whatsapp_automation?schema=public&sslmode=disable";
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

async function seedGoldenCatalog() {
  const tenantId = 'golden-cafe';

  const [dbInfo] = await (prisma as any).$queryRawUnsafe(`SELECT current_database(), current_schema()`);
  console.log('🏦 Connected to Database:', dbInfo.current_database);
  console.log('📑 Target Schema:', dbInfo.current_schema);

  console.log('🌱 Starting Golden Seeding for tenant:', tenantId);

  // 1. Create or Update Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'golden-cafe' },
    update: {},
    create: {
      id: tenantId,
      name: 'The Golden Cafe ☕✨',
      slug: 'golden-cafe',
      type: 'RESTAURANT',
      whatsappNumber: '+919999999999',
      address: '123 Gourmet St, Foodie City',
    },
  });

  // 2. Define Golden Categories
  const categoriesData = [
    { name: '🔥 Hot Beverages', slug: 'hot-beverages', icon: '☕', sortOrder: 1 },
    { name: '❄️ Cold Beverages', slug: 'cold-beverages', icon: '🍹', sortOrder: 2 },
    { name: '🥐 Breakfast Specials', slug: 'breakfast', icon: '🍳', sortOrder: 3 },
    { name: '🍰 Signature Desserts', slug: 'desserts', icon: '🧁', sortOrder: 4 },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { slug_tenantId: { slug: cat.slug, tenantId } },
      update: { name: cat.name, icon: cat.icon, sortOrder: cat.sortOrder },
      create: { ...cat, tenantId },
    });
    categories.push(createdCat);
    console.log(`✅ Category Created: ${cat.name}`);
  }

  // 3. Define Golden Products
  const productsData = [
    // Hot Beverages
    {
      categoryId: categories[0].id,
      name: 'Premium Cappuccino',
      slug: 'premium-cappuccino',
      description: 'Double shot of espresso with silky steamed milk and a light dusting of cocoa.',
      price: 180.00,
      imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e539?w=500&q=80',
    },
    {
      categoryId: categories[0].id,
      name: 'Masala Chai (Double)',
      slug: 'masala-chai',
      description: 'Handcrafted tea infused with ginger, cardamom, and secret spices.',
      price: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1544787210-2213d84ad9a0?w=500&q=80',
    },
    // Cold Beverages
    {
      categoryId: categories[1].id,
      name: 'Iced Vanilla Latte',
      slug: 'iced-vanilla-latte',
      description: 'Cold brewed espresso with Madagascar vanilla bean syrup and chilled milk.',
      price: 220.00,
      imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&q=80',
    },
    {
      categoryId: categories[1].id,
      name: 'Exotic Fruit Punch',
      slug: 'fruit-punch',
      description: 'A refreshing blend of seasonal tropical fruits and a dash of mint.',
      price: 195.00,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&q=80',
    },
    // Breakfast Specials
    {
      categoryId: categories[2].id,
      name: 'Avocado Toast Deluxe',
      slug: 'avocado-toast',
      description: 'Sourdough bread topped with creamy avocado, cherry tomatoes, and a poached egg.',
      price: 350.00,
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&q=80',
    },
    {
      categoryId: categories[2].id,
      name: 'Fluffy Pancakes (3 Pcs)',
      slug: 'pancakes',
      description: 'Golden buttermilk pancakes served with maple syrup and fresh berries.',
      price: 280.00,
      imageUrl: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=500&q=80',
    },
    // Signature Desserts
    {
      categoryId: categories[3].id,
      name: 'Dark Chocolate Lava Cake',
      slug: 'lava-cake',
      description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
      price: 240.00,
      imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&q=80',
    },
    {
      categoryId: categories[3].id,
      name: 'New York Cheesecake',
      slug: 'cheesecake',
      description: 'Rich and creamy classic cheesecake with a graham cracker crust.',
      price: 260.00,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&q=80',
    },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { slug_tenantId: { slug: p.slug, tenantId } },
      update: { ...p, tenantId },
      create: { ...p, tenantId },
    });

    // Seed Initial Inventory
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { stock: 50 },
      create: { productId: product.id, tenantId, stock: 50 },
    });

    console.log(`✅ Product Created & Stocked: ${p.name}`);
  }

  console.log('\n🌟 Golden Catalog Seeded Successfully! 🌟');
}

import * as fs from 'fs';

seedGoldenCatalog()
  .catch((e) => {
    const errorMsg = `❌ Error seeding Golden Catalog: ${e.message}\n${e.stack || ''}\nMeta: ${JSON.stringify(e.meta || {})}`;
    console.error(errorMsg);
    fs.writeFileSync('seeder_debug.log', errorMsg);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
