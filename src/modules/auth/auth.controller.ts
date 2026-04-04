// ============================================
// Auth Controller
// ============================================

import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User Login (Phone-based)
   * Returns JWT token for phone number
   */
  @Post('login')
  @ApiOperation({ summary: 'Login user with phone number' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in, returns JWT token',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Phone number and tenant ID are required',
  })
  async login(
    @Body()
    loginDto: {
      phone: string;
      tenantId: string;
    },
  ) {
    const { phone, tenantId } = loginDto;

    if (!phone || !tenantId) {
      throw new BadRequestException(
        'Phone number and tenant ID are required',
      );
    }

    // Validate user and get user details
    const user = await this.authService.validateUser(phone, tenantId);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    // Generate JWT token
    const result = await this.authService.login(user);
    return result;
  }

  /**
   * Validate JWT Token
   * Returns token validity status
   */
  @Post('validate')
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: { example: { valid: true, message: 'Token is valid' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Token is invalid or expired',
  })
  async validateToken(@Body() tokenDto: { token: string }) {
    try {
      const decoded = this.authService.validateUser(
        tokenDto.token,
        tokenDto.token,
      );
      return { valid: !!decoded, message: 'Token is valid' };
    } catch {
      throw new BadRequestException('Invalid token');
    }
  }
}
