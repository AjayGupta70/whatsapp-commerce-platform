// ============================================
// Catalog Service — Dynamic Menu Generation
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { CatalogRepository } from '../repositories/catalog.repository';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);
  constructor(private readonly catalogRepo: CatalogRepository) {}

  /**
   * Get formatted menu for WhatsApp display
   */
  async getFormattedMenu(tenantId: string): Promise<string> {
    const products = await this.catalogRepo.findProductsByTenant(tenantId);
    if (!products.length) return "👋 Welcome! Our menu is currently being updated. Please check back soon! 😊";

    // Group products by category
    const grouped = products.reduce((acc, p) => {
      const catName = p.category?.name || 'Other Items';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {});

    let menu = "🌟 *WELCOME TO OUR MENU* 🌟\n\n";
    
    for (const [category, items] of Object.entries(grouped)) {
      menu += `⭐ *${category.toUpperCase()}*\n`;
      (items as any[]).forEach(item => {
        const isOutOfStock = item.inventory?.stock <= 0;
        const priceTag = isOutOfStock ? "_[Out of Stock]_" : `*₹${item.price}*`;
        menu += `• ${item.name} — ${priceTag}\n`;
        if (item.description) {
          menu += `  _${item.description}_\n`;
        }
      });
      menu += "\n";
    }

    menu += "━━━━━━━━━━━━━━━\n";
    menu += "💬 *Simply reply with your order!*\n";
    menu += "_Example: 'I want 2 Premium Cappuccinos'_";
    
    return menu;
  }

  /**
   * Get menu with images for WhatsApp (returns array of messages to send)
   */
  async getMenuWithImages(tenantId: string): Promise<any[]> {
    const products = await this.catalogRepo.findProductsByTenant(tenantId);
    if (!products.length) {
      return [{
        type: 'text',
        content: "Our menu is currently empty. Please check back later! 😊"
      }];
    }

    const messages = [];
    const grouped = products.reduce((acc, p) => {
      const catName = p.category?.name || 'Other';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {});

    // Send header
    messages.push({
      type: 'text',
      content: "🍽️ *Our Menu*\n\nChoose what you'd like to order:"
    });

    // Send each category with products
    for (const [category, items] of Object.entries(grouped)) {
      messages.push({
        type: 'text',
        content: `*${category.toUpperCase()}*`
      });

      // Send each product with image if available
      for (const product of items as any[]) {
        const stockInfo = product.inventory?.stock > 0 ? `₹${product.price}` : "Out of stock";
        const caption = `${product.name}\n${stockInfo}\n${product.description || ''}`;

        if (product.imageUrl) {
          messages.push({
            type: 'image',
            mediaUrl: product.imageUrl,
            content: caption
          });
        } else {
          messages.push({
            type: 'text',
            content: `• ${product.name} - ${stockInfo}`
          });
        }
      }

      messages.push({
        type: 'text',
        content: "---"
      });
    }

    // Send footer with instructions
    messages.push({
      type: 'text',
      content: "💬 Reply with what you'd like to order!\nExample: 'I want 2 burgers and 1 drink'"
    });

    return messages;
  }

  /**
   * Get product details with image
   */
  async getProductWithImage(productId: string): Promise<any> {
    const product = await this.catalogRepo.findProductById(productId);
    if (!product) return null;

    return {
      ...product,
      imageMessage: product.imageUrl ? {
        type: 'image',
        mediaUrl: product.imageUrl,
        content: `${product.name}\n₹${product.price}\n${product.description || ''}`
      } : null
    };
  }

  async getProductById(id: string) {
    return this.catalogRepo.findProductById(id);
  }

  async createProduct(data: any) {
    const product = await this.catalogRepo.createProduct(data);
    this.logger.log(`New product created: ${product.name} with ID ${product.id}`);
    return product;
  }

  async getProducts(tenantId: string) {
    return this.catalogRepo.findProductsByTenant(tenantId);
  }

  async getCategories(tenantId: string) {
    return this.catalogRepo.findCategoriesByTenant(tenantId);
  }

  async createCategory(data: any) {
    const category = await this.catalogRepo.createCategory(data);
    this.logger.log(`New category created: ${category.name} with ID ${category.id}`);
    return category;
  }

  /**
   * Get categories as segments for a List Message
   */
  async getInteractiveCategoryList(tenantId: string): Promise<any[]> {
    const categories = await this.catalogRepo.findCategoriesByTenant(tenantId);
    return categories.map(cat => ({
      title: cat.name,
      rows: [
        { id: `CAT_${cat.id}`, title: `View ${cat.name}`, description: `Browse items in ${cat.name}` }
      ]
    }));
  }

  /**
   * Get products in a category for a List Message
   */
  async getInteractiveProductList(categoryId: string, tenantId: string): Promise<any[]> {
     const products = await this.catalogRepo.findProductsByTenant(tenantId);
     const filtered = products.filter(p => p.categoryId === categoryId);
     
     return [{
       title: 'Products',
       rows: filtered.map(p => ({
         id: `PROD_${p.id}`,
         title: p.name,
         description: `₹${p.price} - ${p.description || ''}`
       }))
     }];
  }
}
