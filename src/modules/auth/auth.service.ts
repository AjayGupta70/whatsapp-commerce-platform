// ============================================
// Auth Service
// ============================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/v1/services/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate JWT for a user
   */
  async login(user: any) {
    const payload = { sub: user.id, phone: user.phone, tenantId: user.tenantId };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * Validate user (for admin login later)
   */
  async validateUser(phone: string, tenantId: string): Promise<any> {
    const user = await this.usersService.getOrCreateCustomer(phone, tenantId);
    if (user) return user;
    return null;
  }
}
