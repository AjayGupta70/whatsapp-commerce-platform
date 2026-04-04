// ============================================
// Catalog Service — Dynamic Menu Generation
// ============================================

import { Injectable } from '@nestjs/common';
import { CatalogRepository } from '../repositories/catalog.repository';

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepo: CatalogRepository) {}

  /**
   * Get formatted menu for WhatsApp display
   */
  async getFormattedMenu(tenantId: string): Promise<string> {
    const products = await this.catalogRepo.findProductsByTenant(tenantId);
    if (!products.length) return "Our menu is currently empty. Please check back later! 😊";

    const grouped = products.reduce((acc, p) => {
      const catName = p.category?.name || 'Other';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(p);
      return acc;
    }, {});

    let menu = "Here's our menu 🍽️\n\n";
    for (const [category, items] of Object.entries(grouped)) {
      menu += `*${category.toUpperCase()}*\n`;
      (items as any[]).forEach(item => {
        const stockInfo = item.inventory?.stock > 0 ? `(₹${item.price})` : "(Out of stock)";
        menu += `- ${item.name} ${stockInfo}\n`;
      });
      menu += "\n";
    }

    menu += "What would you like to order? 😊";
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
    return this.catalogRepo.createProduct(data);
  }

  async getProducts(tenantId: string) {
    return this.catalogRepo.findProductsByTenant(tenantId);
  }

  async getCategories(tenantId: string) {
    return this.catalogRepo.findCategoriesByTenant(tenantId);
  }

  async createCategory(data: any) {
    return this.catalogRepo.createCategory(data);
  }
}
