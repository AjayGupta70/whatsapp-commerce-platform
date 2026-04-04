// ============================================
// Orders Controller
// ============================================

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new order' })
  async placeOrder(@Body() body: any) {
    const { tenantId, userId, items } = body;
    return this.ordersService.placeOrder(tenantId, userId, items);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order details by order number' })
  async getOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderByNumber(orderNumber);
  }
}
