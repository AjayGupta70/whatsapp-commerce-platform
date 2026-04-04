// ============================================
// AI DTOs
// ============================================

export class AIRequestDto {
  text: string;
  userId: string;
  tenantId: string;
  context?: any;
}

export class AIResponseDto {
  intent: string;
  entities: any;
  reply: string;
}
