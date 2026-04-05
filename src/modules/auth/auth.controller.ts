// ============================================
// Auth Controller
// ============================================

import { Controller, Post, Body, BadRequestException, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { AdminRequestLoginCodeDto } from './dto/admin-request-login-code.dto';
import { AdminVerifyLoginCodeDto } from './dto/admin-verify-login-code.dto';
import { CustomerRequestLoginCodeDto } from './dto/customer-request-login-code.dto';
import { CustomerVerifyLoginCodeDto } from './dto/customer-verify-login-code.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Auth')
@ApiExtraModels(AuthLoginResponseDto, AuthUserResponseDto, MessageResponseDto)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  // Admin Login Flow
  @Post('admin/request-login-code')
  @ApiOperation({ summary: 'Request a login OTP code via email for admin access' })
  @ApiResponse({
    status: 200,
    description: 'OTP code sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login request',
  })
  async requestAdminLoginCode(@Body() dto: AdminRequestLoginCodeDto) {
    return this.authService.requestAdminLoginCode(dto);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Login with OTP code sent by email for admin' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in, returns JWT token',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login code or credentials',
  })
  async adminLogin(@Body() dto: AdminVerifyLoginCodeDto) {
    const user = await this.authService.verifyAdminLoginCode(dto);
    return this.authService.login(user);
  }

  // Customer Login Flow
  @Post('customer/request-login-code')
  @ApiOperation({ summary: 'Request a login OTP code via phone for customer access' })
  @ApiResponse({
    status: 200,
    description: 'OTP code sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login request',
  })
  async requestCustomerLoginCode(@Body() dto: CustomerRequestLoginCodeDto) {
    return this.authService.requestCustomerLoginCode(dto.phone, dto.tenantId);
  }

  @Post('customer/login')
  @ApiOperation({ summary: 'Login with OTP code sent via WhatsApp for customer' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in, returns JWT token',
    type: AuthLoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid login code or credentials',
  })
  async customerLogin(@Body() dto: CustomerVerifyLoginCodeDto) {
    const user = await this.authService.verifyCustomerLoginCode(dto.phone, dto.tenantId, dto.code);
    return this.authService.login(user);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token is invalid or expired',
  })
  async validateToken(@Body() tokenDto: { token: string }) {
    try {
      const decoded = await this.authService.validateJwtToken(tokenDto.token);
      return { valid: !!decoded, message: 'Token is valid' };
    } catch {
      throw new BadRequestException('Invalid token');
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile data',
    type: AuthUserResponseDto,
  })
  async getProfile(@Request() req: any) {
    return {
      id: req.user.id,
      phone: req.user.phone,
      email: req.user.email,
      name: req.user.name,
      tenantId: req.user.tenantId,
      role: req.user.role,
    };
  }
}
