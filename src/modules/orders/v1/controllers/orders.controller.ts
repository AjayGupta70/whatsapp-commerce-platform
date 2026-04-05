// ============================================
// Orders Controller
// ============================================

import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

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

  // Customer endpoints
  @Get('customer/my-orders')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current customer orders' })
  async getMyOrders(@Request() req: any) {
    const { user } = req;
    return this.ordersService.getOrdersByUser(user.id);
  }

  @Get('customer/:orderId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific order for current customer' })
  async getMyOrder(@Param('orderId') orderId: string, @Request() req: any) {
    const { user } = req;
    return this.ordersService.getOrderByIdAndUser(orderId, user.id);
  }

  // Admin endpoints
  @Get('admin/tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all orders for a tenant (admin only)' })
  async getTenantOrders(@Param('tenantId') tenantId: string) {
    return this.ordersService.getOrdersByTenant(tenantId);
  }
}
