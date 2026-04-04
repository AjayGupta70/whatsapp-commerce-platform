// ============================================
// Inventory DTOs
// ============================================

export class UpdateStockDto {
  productId: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}

export class StockStatusDto {
  productId: string;
  available: number;
  reserved: number;
}
