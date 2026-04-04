// ============================================
// Order DTOs
// ============================================

export class CreateOrderDto {
  tenantId: string;
  userId: string;
  items: OrderItemDto[];
  total: number;
  notes?: string;
}

export class OrderItemDto {
  productId: string;
  quantity: number;
  price: number;
}

export class OrderStatusUpdateDto {
  orderId: string;
  status: string;
}
