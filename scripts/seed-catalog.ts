// ============================================
// Seed Script: Catalog — Categories & Products
// Tenant: golden-cafe (Restaurant / Testing)
// Run: npx ts-node -P tsconfig.json scripts/seed-catalog.ts
// ============================================

import { PrismaClient } from '@prisma/client';

const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://admin:password@127.0.0.1:5433/whatsapp_automation?schema=public&sslmode=disable';

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
});

const TENANT_ID = 'golden-cafe';

// ─── Hardcoded Categories ─────────────────────────────────────
const CATEGORIES = [
  {
    id: 'cat-beverages',
    name: '☕ Beverages',
    slug: 'beverages',
    description: 'Hot & Cold drinks',
    icon: '☕',
    sortOrder: 1,
    tenantId: TENANT_ID,
    isActive: true,
  },
  {
    id: 'cat-snacks',
    name: '🍟 Snacks & Starters',
    slug: 'snacks',
    description: 'Quick bites & starters',
    icon: '🍟',
    sortOrder: 2,
    tenantId: TENANT_ID,
    isActive: true,
  },
  {
    id: 'cat-mains',
    name: '🍛 Main Course',
    slug: 'mains',
    description: 'Full meals & combos',
    icon: '🍛',
    sortOrder: 3,
    tenantId: TENANT_ID,
    isActive: true,
  },
];

// ─── Hardcoded Products ───────────────────────────────────────
const PRODUCTS = [
  // ☕ Beverages
  {
    id: 'prod-cappuccino',
    name: 'Premium Cappuccino',
    slug: 'premium-cappuccino',
    description: 'Rich espresso with velvety milk foam',
    price: 149,
    imageUrl: null,
    categoryId: 'cat-beverages',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 100,
  },
  {
    id: 'prod-cold-brew',
    name: 'Cold Brew Coffee',
    slug: 'cold-brew-coffee',
    description: '12-hour steeped cold coffee blend',
    price: 179,
    imageUrl: null,
    categoryId: 'cat-beverages',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 50,
  },
  {
    id: 'prod-mango-shake',
    name: 'Mango Shake',
    slug: 'mango-shake',
    description: 'Fresh mango blended with chilled milk',
    price: 129,
    imageUrl: null,
    categoryId: 'cat-beverages',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 60,
  },
  // 🍟 Snacks
  {
    id: 'prod-veg-puff',
    name: 'Veg Puff',
    slug: 'veg-puff',
    description: 'Flaky pastry with spiced veggie filling',
    price: 49,
    imageUrl: null,
    categoryId: 'cat-snacks',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 80,
  },
  {
    id: 'prod-samosa',
    name: 'Samosa (2 pcs)',
    slug: 'samosa',
    description: 'Crispy golden samosas with mint chutney',
    price: 39,
    imageUrl: null,
    categoryId: 'cat-snacks',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 100,
  },
  {
    id: 'prod-cheese-toast',
    name: 'Cheese Toast',
    slug: 'cheese-toast',
    description: 'Toasted bread with melted cheese & herbs',
    price: 89,
    imageUrl: null,
    categoryId: 'cat-snacks',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 40,
  },
  // 🍛 Main Course
  {
    id: 'prod-dal-rice',
    name: 'Dal Tadka + Rice',
    slug: 'dal-tadka-rice',
    description: 'Comfort food with ghee tempering & basmati rice',
    price: 199,
    imageUrl: null,
    categoryId: 'cat-mains',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 30,
  },
  {
    id: 'prod-paneer-masala',
    name: 'Paneer Butter Masala + Roti',
    slug: 'paneer-butter-masala-roti',
    description: 'Creamy tomato-based paneer curry with 2 rotis',
    price: 249,
    imageUrl: null,
    categoryId: 'cat-mains',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 25,
  },
  {
    id: 'prod-veg-biryani',
    name: 'Veg Biryani',
    slug: 'veg-biryani',
    description: 'Fragrant basmati rice with seasonal veggies & raita',
    price: 229,
    imageUrl: null,
    categoryId: 'cat-mains',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 20,
  },
  {
    id: 'prod-thali',
    name: 'Golden Cafe Thali',
    slug: 'golden-cafe-thali',
    description: 'Dal + 2 Sabzis + Rice + 2 Rotis + Salad + Dessert',
    price: 329,
    imageUrl: null,
    categoryId: 'cat-mains',
    tenantId: TENANT_ID,
    isActive: true,
    stock: 15,
  },
];

async function seedCatalog() {
  console.log('🌱 Starting Catalog Seed for tenant: golden-cafe\n');

  // ── Seed Categories ────────────────────────────────────────
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug_tenantId: { slug: cat.slug, tenantId: TENANT_ID } },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
    console.log(`  ✅ Category: ${cat.name}`);
  }

  console.log('\n');

  // ── Seed Products + Inventory ──────────────────────────────
  for (const p of PRODUCTS) {
    const { stock, ...productData } = p;

    await prisma.product.upsert({
      where: { slug_tenantId: { slug: p.slug, tenantId: TENANT_ID } },
      update: { name: p.name, description: p.description, price: p.price },
      create: {
        id: productData.id,
        name: productData.name,
        slug: productData.slug,
        description: productData.description,
        price: productData.price,
        imageUrl: productData.imageUrl,
        isActive: productData.isActive,
        tenantId: productData.tenantId,
        categoryId: productData.categoryId,
      },
    });

    // Upsert inventory for each product
    await prisma.inventory.upsert({
      where: { productId: p.id },
      update: { stock },
      create: {
        productId: p.id,
        tenantId: TENANT_ID,
        stock,
        lowStockThreshold: 5,
      },
    });

    console.log(`  ✅ Product: ${p.name}  (₹${p.price}, Stock: ${stock})`);
  }

  console.log('\n🎉 Catalog seeded successfully! 🎉');
  console.log('────────────────────────────────────');
  console.log(`Tenant   : ${TENANT_ID}`);
  console.log(`Categories: ${CATEGORIES.length}`);
  console.log(`Products  : ${PRODUCTS.length}`);
}

seedCatalog()
  .catch((e) => {
    console.error('❌ Catalog seed failed:', e.message);
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
