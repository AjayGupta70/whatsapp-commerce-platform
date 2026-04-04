// ============================================
// Auth DTOs
// ============================================

export class LoginDto {
  phone: string;
  otp?: string;
}

export class AuthResponseDto {
  token: string;
  user: any;
}
