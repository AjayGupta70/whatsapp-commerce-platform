// ============================================
// Auth Controller — All Endpoints
// ============================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  BadRequestException,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

// DTOs
import { AdminRequestLoginCodeDto } from './dto/admin-request-login-code.dto';
import { AdminVerifyLoginCodeDto } from './dto/admin-verify-login-code.dto';
import { CustomerRequestLoginCodeDto } from './dto/customer-request-login-code.dto';
import { CustomerVerifyLoginCodeDto } from './dto/customer-verify-login-code.dto';
import { SignupDto } from './dto/signup.dto';
import { PasswordLoginDto } from './dto/password-login.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthUserResponseDto } from './dto/auth-user-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { VerifySignupOtpDto } from './dto/verify-signup-otp.dto';
import { VerifyForgotPasswordOtpDto } from './dto/verify-forgot-password-otp.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional as ApiPropOpt } from '@nestjs/swagger';

class UpdateUserSettingsDto {
  @ApiPropOpt({ enum: ['PASSWORD_ONLY', 'OTP_ONLY', 'PASSWORD_AND_OTP'] })
  @IsEnum(['PASSWORD_ONLY', 'OTP_ONLY', 'PASSWORD_AND_OTP'])
  @IsOptional()
  loginMethod?: 'PASSWORD_ONLY' | 'OTP_ONLY' | 'PASSWORD_AND_OTP';

  @ApiPropOpt()
  @IsBoolean()
  @IsOptional()
  otpEnabled?: boolean;
}

@ApiTags('Auth')
@ApiExtraModels(AuthLoginResponseDto, AuthUserResponseDto, MessageResponseDto)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'User profile', type: AuthUserResponseDto })
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

  // ─── Login (Universal / Password) ────────────

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with password. Might return 2FA requirement.' })
  @ApiResponse({ status: 200, description: 'Login success OR 2FA challenge' })
  async login(@Body() dto: PasswordLoginDto) {
    return this.authService.passwordLogin(dto);
  }

  // ─── Signup ──────────────────────────────────

  @Post('signup')
  @ApiOperation({ summary: 'Register a new customer account — sends OTP via WhatsApp' })
  @ApiResponse({ status: 201, description: 'OTP sent for verification', type: MessageResponseDto })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async signUp(@Body() dto: SignupDto) {
    return this.authService.signUp(dto);
  }

  @Post('signup/verify-otp')
  @ApiOperation({ summary: 'Verify signup OTP and create the user account' })
  @ApiResponse({ status: 201, description: 'Account created, returns token pair', type: AuthLoginResponseDto })
  async verifySignupOtp(
    @Body() dto: VerifySignupOtpDto,
  ) {
    return this.authService.verifySignupOtp(dto.phone, dto.tenantId, dto.otp);
  }

  // ─── Admin Login ─────────────────────────────

  @Post('admin/request-login-code')
  @ApiOperation({ summary: 'Request OTP for admin login (email or WhatsApp)' })
  @ApiResponse({ status: 200, description: 'OTP sent', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async requestAdminLoginCode(@Body() dto: AdminRequestLoginCodeDto) {
    return this.authService.requestAdminLoginCode(dto);
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify admin OTP and log in — returns access + refresh tokens' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthLoginResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid OTP' })
  async adminLogin(@Body() dto: AdminVerifyLoginCodeDto) {
    const user = await this.authService.verifyAdminLoginCode(dto);
    return this.authService.login(user);
  }

  // ─── Customer Login ───────────────────────────

  @Post('customer/request-login-code')
  @ApiOperation({ summary: 'Request OTP for customer login via WhatsApp' })
  @ApiResponse({ status: 200, description: 'OTP sent', type: MessageResponseDto })
  async requestCustomerLoginCode(@Body() dto: CustomerRequestLoginCodeDto) {
    return this.authService.requestCustomerLoginCode(dto.phone, dto.tenantId);
  }

  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify customer OTP and log in — returns access + refresh tokens' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthLoginResponseDto })
  async customerLogin(@Body() dto: CustomerVerifyLoginCodeDto) {
    const user = await this.authService.verifyCustomerLoginCode(dto.phone, dto.tenantId, dto.code);
    return this.authService.login(user);
  }

  // ─── Resend OTP ───────────────────────────────

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to phone or email' })
  @ApiResponse({ status: 200, description: 'OTP resent', type: MessageResponseDto })
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.identifier, dto.tenantId, dto.provider);
  }

  // ─── Forgot Password ──────────────────────────

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate forgot-password flow — sends OTP via WhatsApp or email' })
  @ApiResponse({ status: 200, description: 'OTP sent if account exists', type: MessageResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('forgot-password/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify forgot-password OTP — returns a short-lived reset token' })
  @ApiResponse({ status: 200, description: 'OTP verified, reset token returned' })
  async verifyForgotPasswordOtp(
    @Body() dto: VerifyForgotPasswordOtpDto,
  ) {
    return this.authService.verifyForgotPasswordOtp(
      dto.identifier,
      dto.tenantId,
      dto.otp,
      dto.provider,
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set new password using the reset token from forgot-password flow' })
  @ApiResponse({ status: 200, description: 'Password reset successfully', type: MessageResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const { resetToken, ...setPasswordDto } = dto;
    return this.authService.resetPasswordWithToken(resetToken, setPasswordDto);
  }

  // ─── Set Password (first-time / after signup) ─

  @Post('set-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a password for the first time (logged-in user)' })
  @ApiResponse({ status: 200, description: 'Password set', type: MessageResponseDto })
  async setPassword(@Request() req: any, @Body() dto: SetPasswordDto) {
    return this.authService.setPassword(req.user.id, dto);
  }

  // ─── Change Password ──────────────────────────

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change password — requires current password' })
  @ApiResponse({ status: 200, description: 'Password changed', type: MessageResponseDto })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  // ─── Refresh Token ────────────────────────────

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token — returns new access + refresh token pair' })
  @ApiResponse({ status: 200, description: 'Token pair refreshed', type: AuthLoginResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // ─── Logout ───────────────────────────────────

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from current device — invalidates the refresh token' })
  @ApiResponse({ status: 200, description: 'Logged out', type: MessageResponseDto })
  async logout(@Request() req: any, @Body() dto: LogoutDto) {
    return this.authService.logout(req.user.id, dto.refreshToken);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout from ALL devices — invalidates all refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices', type: MessageResponseDto })
  async logoutAllDevices(@Request() req: any) {
    return this.authService.logoutAllDevices(req.user.id);
  }

  // ─── Validate Token ───────────────────────────

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a JWT access token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  async validateToken(@Body() dto: ValidateTokenDto) {
    try {
      const decoded = await this.authService.validateJwtToken(dto.token);
      return { valid: !!decoded, message: 'Token is valid' };
    } catch {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  // ─── Settings ────────────────────────────────

  @Get('settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user login settings' })
  async getSettings(@Request() req: any) {
    const user = await this.authService.findOrCreateCustomer(req.user.phone, req.user.tenantId);
    return this.authService.getUserSettings(user.id);
  }

  @Post('settings')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your login preferences (PASSWORD_ONLY, OTP_ONLY, 2FA)' })
  async updateSettings(@Request() req: any, @Body() dto: UpdateUserSettingsDto) {
     return this.authService.updateUserSettings(req.user.id, dto);
  }
}
