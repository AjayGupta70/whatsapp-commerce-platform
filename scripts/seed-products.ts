// ============================================
// Seed Products with Images
// For testing WhatsApp image functionality
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProducts() {
  const tenantId = 'demo-tenant';

  // Create demo tenant if it doesn't exist
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      type: 'RESTAURANT',
      whatsappNumber: '+1234567890',
    },
  });

  // Create category
  const category = await prisma.category.upsert({
    where: { slug_tenantId: { slug: 'main-course', tenantId } },
    update: {},
    create: {
      name: 'Main Course',
      slug: 'main-course',
      tenantId,
    },
  });

  // Create products with sample images (using placeholder URLs)
  const products = [
    {
      name: 'Classic Burger',
      slug: 'classic-burger',
      description: 'Juicy beef patty with lettuce, tomato, and our special sauce',
      price: 150.00,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    },
    {
      name: 'Cheese Burger',
      slug: 'cheese-burger',
      description: 'Classic burger with melted cheddar cheese',
      price: 180.00,
      imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    },
    {
      name: 'Chicken Burger',
      slug: 'chicken-burger',
      description: 'Grilled chicken patty with spicy mayo',
      price: 160.00,
      imageUrl: 'https://images.unsplash.com/photo-1572441713132-fb0c7833b33?w=400',
    },
    {
      name: 'French Fries',
      slug: 'french-fries',
      description: 'Crispy golden fries with sea salt',
      price: 80.00,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400',
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: { slug_tenantId: { slug: productData.slug, tenantId } },
      update: {},
      create: {
        ...productData,
        tenantId,
        categoryId: category.id,
      },
    });
  }

  // Create inventory
  const allProducts = await prisma.product.findMany({ where: { tenantId } });
  for (const product of allProducts) {
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        tenantId,
        stock: 50, // 50 items in stock
      },
    });
  }

  console.log('✅ Demo products with images seeded successfully!');
}

seedProducts()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });