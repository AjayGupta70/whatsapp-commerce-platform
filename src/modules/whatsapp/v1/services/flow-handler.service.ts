// ============================================
// Flow Handler Service — The "Brain" of Static Converstions
// Industry-standard way to manage decision trees and interactive responses
// ============================================

import { Injectable, Logger } from '@nestjs/common';
import { CatalogService } from '../../../catalog/v1/services/catalog.service';
import { OrdersService } from '../../../orders/v1/services/orders.service';
import { PaymentsService } from '../../../payments/v1/services/payments.service';

@Injectable()
export class FlowHandlerService {
  private readonly logger = new Logger(FlowHandlerService.name);

  constructor(
    private readonly catalogService: CatalogService,
    private readonly ordersService: OrdersService,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Main entry point to handle current state and user input
   */
  async handle(stateDoc: any, payload: any, tenantId: string): Promise<{ reply: any; nextState: string; updatedContext?: any }> {
    const state = stateDoc.state;
    const context = stateDoc.context || {};
    const input = payload.text.trim().toUpperCase();

    // ─── Global Commands ────────────────────────
    if (input === 'MENU' || input === 'HELP') {
      return this.sendStartMenu();
    }

    // ─── State-Based Logic ──────────────────────
    switch (state) {
      case 'NEW':
      case 'GREETING':
        return this.handleGreeting(input, tenantId);

      case 'BROWSING':
        return this.handleBrowsing(input, tenantId, context);

      case 'ORDERING':
        return this.handleOrdering(input, tenantId, context, stateDoc);

      case 'ADDRESS_COLLECTION':
        return this.handleAddressCollection(input, context);

      case 'CONFIRMING_OFFLINE':
        return this.handleOfflineConfirmation(input, tenantId, stateDoc.userId, context);

      case 'PAUSED':
        return { reply: null, nextState: 'PAUSED' }; // Bot is quiet during handover

      default:
        return this.sendStartMenu();
    }
  }

  /**
   * INITIAL GREETING - Sent after campaign or first user text
   */
  private async handleGreeting(input: string, tenantId: string): Promise<{ reply: any; nextState: string }> {
    if (input === 'TALK_ADMIN') {
      return { 
        nextState: 'PAUSED', 
        reply: { type: 'text', content: '✅ I have notified our team! An admin will be with you shortly. Bot is now paused. ⏸️' } 
      };
    }

    if (input === 'START_ORDER' || input === 'VIEW_MENU') {
      return this.sendCategoryList(tenantId);
    }

    return {
      nextState: 'GREETING',
      reply: {
        type: 'button',
        content: '👋 Welcome! How can we help you today?',
        footer: 'Select an option below',
        buttons: [
          { id: 'START_ORDER', text: '🛍️ Order Products' },
          { id: 'VIEW_CATALOG', text: '📖 View Catalog' },
          { id: 'TALK_ADMIN', text: '💬 Talk to Admin' },
        ],
      },
    };
  }

  /**
   * BROWSING - When user is looking at categories or products
   */
  private async handleBrowsing(input: string, tenantId: string, context: any): Promise<{ reply: any; nextState: string; updatedContext?: any }> {
    if (input === 'TALK_ADMIN') {
      return { 
        nextState: 'PAUSED', 
        reply: { type: 'text', content: '✅ I have notified our team! An admin will be with you shortly. Bot is now paused. ⏸️' } 
      };
    }

    // If user clicked a category ID (we'll prefix them with CAT_)
    if (input.startsWith('CAT_')) {
      const categoryId = input.replace('CAT_', '');
      return this.sendProductList(categoryId, tenantId);
    }

    // If user clicked a product ID (prefix with PROD_)
    if (input.startsWith('PROD_')) {
       const productId = input.replace('PROD_', '');
       return this.handleProductSelection(productId, context);
    }

    return this.sendCategoryList(tenantId);
  }

  /**
   * ORDERING - When user is adding items to cart or confirming details
   */
  private async handleOrdering(input: string, tenantId: string, context: any, stateDoc: any): Promise<{ reply: any; nextState: string; updatedContext?: any }> {
     if (input === 'CONFIRM_ORDER') {
        return { 
          nextState: 'ORDERING',
          reply: { 
            type: 'button', 
            content: `🧾 *ORDER SUMMARY*\n\n${this.getCartSummary(context)}\n\n*Total: ₹${context.total}*`,
            footer: 'Choose your preferred payment method:',
            buttons: [
              { id: 'PAY_ONLINE', text: '💳 Pay Online' },
              { id: 'PAY_OFFLINE', text: '🏠 Cash on Delivery' }
            ]
          }
        };
     }

     if (input === 'PAY_ONLINE') {
        return this.finalizeOrder(tenantId, stateDoc.userId, context);
     }

     if (input === 'PAY_OFFLINE') {
        return {
          nextState: 'ADDRESS_COLLECTION',
          reply: { type: 'text', content: '📍 Great! Please type your *Full Delivery Address* below.' }
        };
     }

    if (input === 'VIEW_MENU' || input === 'START_ORDER') {
       return this.sendCategoryList(tenantId);
    }

    return { nextState: 'ORDERING', reply: { type: 'text', content: 'Please select an item or type "CHECKOUT".' } };
  }

  private sendStartMenu() {
    return {
      nextState: 'GREETING',
      reply: {
        type: 'button',
        content: '👋 Hello! I am your automated assistant. What would you like to do?',
        buttons: [
          { id: 'START_ORDER', text: '🛍️ Order Products' },
          { id: 'VIEW_CATALOG', text: '📖 Full Catalog' },
        ],
      },
    };
  }

  // ─── Helper Response Generators ──────────────

  private async sendCategoryList(tenantId: string) {
    const sections = await this.catalogService.getInteractiveCategoryList(tenantId);
    
    if (sections.length === 0) {
      return {
        nextState: 'GREETING',
        reply: { type: 'text', content: 'Our catalog is empty right now. Please try again later! 😊' }
      };
    }

    return {
      nextState: 'BROWSING',
      reply: {
        type: 'list',
        title: '📖 Browse Our Categories',
        content: 'Select a category to view items:',
        buttonText: 'View Categories',
        sections: sections,
        footer: 'Automated order system'
      },
    };
  }

  private async sendProductList(categoryId: string, tenantId: string) {
     const sections = await this.catalogService.getInteractiveProductList(categoryId, tenantId);
     
     return {
       nextState: 'BROWSING',
       reply: {
         type: 'list',
         title: '🛍️ Choose Product',
         content: 'Select an item to add to your order:',
         buttonText: 'See Products',
         sections: sections,
         footer: 'Reply "START OVER" to go back'
       }
     };
  }

  private async handleProductSelection(productId: string, context: any) {
     const product = await this.catalogService.getProductById(productId);
     if (!product) {
       return { nextState: 'BROWSING', reply: { type: 'text', content: 'Sorry, that product is no longer available.' } };
     }

     // Update cart in context
     const cart = context.cart || [];
     const existing = cart.find((i: any) => i.productId === productId);
     if (existing) {
       existing.qty += 1;
     } else {
       cart.push({ productId: product.id, name: product.name, price: Number(product.price), qty: 1 });
     }

     const total = cart.reduce((sum: number, i: any) => sum + (i.price * i.qty), 0);
     const updatedContext = { ...context, cart, total };

     return {
       nextState: 'ORDERING',
       updatedContext,
       reply: {
         type: 'button',
         content: `✅ Added *${product.name}* to cart.\n\n*Cart Total: ₹${total}*`,
         footer: 'Add more items or checkout?',
         buttons: [
           { id: 'VIEW_MENU', text: '➕ Add More' },
           { id: 'CONFIRM_ORDER', text: '💳 Checkout' }
         ]
       }
     };
  }

  private getCartSummary(context: any): string {
    const cart = context.cart || [];
    if (cart.length === 0) return "Empty Cart";
    return cart.map((i: any) => `• ${i.name} (x${i.qty}) — ₹${i.price * i.qty}`).join('\n');
  }

  /**
   * Capture address and ask for final confirmation
   */
  private handleAddressCollection(input: string, context: any) {
    const address = input; // The raw text from the user
    return {
      nextState: 'CONFIRMING_OFFLINE',
      updatedContext: { ...context, address },
      reply: {
        type: 'button',
        content: `🏠 *Confirm Delivery Address*\n\n${address}`,
        footer: 'Is this address correct?',
        buttons: [
          { id: 'CONFIRM_COD', text: '✅ Confirm Order' },
          { id: 'PAY_OFFLINE', text: '❌ Edit Address' }
        ]
      }
    };
  }

  /**
   * Final confirmation for COD order
   */
  private async handleOfflineConfirmation(input: string, tenantId: string, userId: string, context: any) {
    if (input === 'CONFIRM_COD') {
      return this.finalizeOrderOffline(tenantId, userId, context);
    }
    return { nextState: 'ADDRESS_COLLECTION', reply: { type: 'text', content: 'Please type your updated address:' } };
  }

  /**
   * Finalize the order: Place it in DB for Offline Payment
   */
  private async finalizeOrderOffline(tenantId: string, userId: string, context: any) {
    try {
      const cart = context.cart || [];
      const order = await this.ordersService.placeOrder(
        tenantId, 
        userId, 
        cart.map((i: any) => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.qty
        })),
        context.address,
        'OFFLINE'
      );

      return {
        nextState: 'GREETING',
        updatedContext: { ...context, cart: [], total: 0, lastOrderId: order.id },
        reply: {
          type: 'text',
          content: `✅ *Order Confirmed!* (#${order.orderNumber})\n\nPayment Mode: *Cash on Delivery*\nDelivery Address: ${context.address}\n\nWe will contact you soon for delivery. Thank you! 🙏`
        }
      };
    } catch (error) {
      this.logger.error('Failed to finalize offline order:', error);
      return {
        nextState: 'ORDERING',
        reply: { type: 'text', content: `❌ Error: ${error.message}` }
      };
    }
  }

  /**
   * Finalize the order: Place it in DB and get Payment Link (Online)
   */
  private async finalizeOrder(tenantId: string, userId: string, context: any) {
    try {
      const cart = context.cart || [];
      if (cart.length === 0) {
        return { nextState: 'GREETING', reply: { type: 'text', content: 'Your cart is empty!' } };
      }

      // 1. Place order in PostgreSQL
      const order = await this.ordersService.placeOrder(tenantId, userId, cart.map((i: any) => ({
        id: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.qty
      })));

      // 2. Create Razorpay Payment Link
      const paymentUrl = await this.paymentsService.createPaymentLink(order.id);

      return {
        nextState: 'PAYING',
        updatedContext: { ...context, lastOrderId: order.id, paymentUrl },
        reply: {
          type: 'text',
          content: `✅ *Order Placed!* (#${order.orderNumber})\n\nTotal Amount: *₹${order.total}*\n\nPlease complete your payment using the secure link below:\n\n🔗 ${paymentUrl}\n\n_Note: Your order will be processed once payment is confirmed._`
        }
      };
    } catch (error) {
      this.logger.error('Failed to finalize order:', error);
      return {
        nextState: 'CONFIRMING',
        reply: { type: 'text', content: `❌ Sorry, we encountered an error: ${error.message}. Please try again.` }
      };
    }
  }
}
