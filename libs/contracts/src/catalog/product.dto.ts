// ============================================
// Catalog DTOs
// ============================================

export class ProductDto {
  id: string;
  name: string;
  price: number;
  description?: string;
  category: string;
  stock?: number;
}
