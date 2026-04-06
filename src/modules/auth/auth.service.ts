// ============================================
// Auth Service — Full Implementation
// Signup, Password, Refresh Tokens, Logout, OTP
// ============================================

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/v1/services/users.service';
import { MailService } from './mail.service';
import { WhatsappService } from '../whatsapp/v1/services/whatsapp.service';
import { RedisService } from '../database/redis/redis.service';
import { PrismaService } from '../../database/postgres/prisma/prisma.service';

import { UserRole } from '@prisma/client';
import { AdminRequestLoginCodeDto } from './dto/admin-request-login-code.dto';
import { AdminVerifyLoginCodeDto } from './dto/admin-verify-login-code.dto';
import { SignupDto } from './dto/signup.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

// ─── Constants ──────────────────────────────
const OTP_TTL_SECONDS = 5 * 60;          // 5 min
const OTP_MAX_ATTEMPTS = 5;
const OTP_BLOCK_TTL_SECONDS = 15 * 60;   // 15 min
const REFRESH_TOKEN_DAYS = 30;

interface OtpEntry {
  code: string;
  expiresAt: number;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ═══════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) return trimmed;
    return trimmed.length === 10 ? `+91${trimmed}` : trimmed;
  }

  private getOtpKey(identifier: string, tenantId?: string): string {
    const base = identifier.toLowerCase();
    return tenantId ? `${base}_${tenantId}` : base;
  }

  private redisOtpKey(key: string) { return `auth:otp:${key}`; }
  private redisAttemptsKey(key: string) { return `auth:otp_attempts:${key}`; }
  private redisBlockedKey(key: string) { return `auth:otp_blocked:${key}`; }
  private redisSignupKey(key: string) { return `auth:signup:${key}`; }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async isBlocked(key: string): Promise<boolean> {
    return this.redisService.exists(this.redisBlockedKey(key));
  }

  private async assertNotBlocked(key: string): Promise<void> {
    if (await this.isBlocked(key)) {
      throw new BadRequestException('Too many failed OTP attempts. Please try again in 15 minutes.');
    }
  }

  private async recordFailedAttempt(key: string): Promise<void> {
    const attemptsKey = this.redisAttemptsKey(key);
    const attempts = await this.redisService.incr(attemptsKey);
    if (attempts === 1) {
      await this.redisService.expire(attemptsKey, OTP_BLOCK_TTL_SECONDS);
    }
    if (attempts >= OTP_MAX_ATTEMPTS) {
      await this.redisService.set(this.redisBlockedKey(key), '1', OTP_BLOCK_TTL_SECONDS);
      await this.redisService.del(attemptsKey);
    }
  }

  private async clearOtpState(key: string): Promise<void> {
    await this.redisService.del(
      this.redisOtpKey(key),
      this.redisAttemptsKey(key),
      this.redisBlockedKey(key),
    );
  }

  private async storeOtp(key: string, entry: OtpEntry): Promise<void> {
    await this.redisService.set(this.redisOtpKey(key), entry, OTP_TTL_SECONDS);
  }

  private async getOtpEntry(key: string): Promise<OtpEntry | null> {
    return this.redisService.get<OtpEntry>(this.redisOtpKey(key));
  }

  // ═══════════════════════════════════════════════
  // TOKEN GENERATION
  // ═══════════════════════════════════════════════

  private getJwtConfig() {
    return {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: this.configService.get<string>('jwt.expiresIn') || '15m',
    };
  }

  async generateTokenPair(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };

    const secret = this.configService.get<string>('jwt.secret') ?? 'fallback-secret';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '15m';

    // Use module-level config (no override needed — just call sign with payload)
    const accessToken = this.jwtService.sign(payload);

    // Refresh token uses its own longer expiry injected via ConfigService
    const refreshToken = this.jwtService.sign(
      { ...payload, tokenType: 'refresh' },
      { secret, expiresIn: `${REFRESH_TOKEN_DAYS}d` },
    );

    // Persist refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  /** @deprecated Use generateTokenPair for new flows */
  async login(user: any) {
    const tokens = await this.generateTokenPair(user);
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
        name: user.name,
      },
    };
  }

  /**
   * Main login flow via password.
   * Handles PASSWORD_ONLY, PASSWORD_AND_OTP (2FA), and OTP_ONLY settings.
   */
  async passwordLogin(dto: any) {
    const provider = dto.provider || 'email';
    const identifier = dto.identifier.trim();
    const normalized = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();

    let user: any;
    if (provider === 'phone') {
      if (!dto.tenantId) throw new BadRequestException('tenantId is required for phone-based login.');
      user = await this.prisma.user.findUnique({
        where: { phone_tenantId: { phone: normalized, tenantId: dto.tenantId } },
        include: { settings: true },
      });
    } else {
      user = await this.prisma.user.findFirst({
        where: { email: normalized, isActive: true },
        include: { settings: true },
      });
    }

    if (!user) throw new BadRequestException('Invalid credentials.');

    // Check if password exists
    if (!user.password) {
      throw new BadRequestException('No password set for this account. Please use OTP login or reset password.');
    }

    // Verify Password
    const isValid = await bcrypt.compare(dto.password, user.password);
    if (!isValid) throw new BadRequestException('Invalid credentials.');

    // Check login method settings
    const method = user.settings?.loginMethod || 'PASSWORD_AND_OTP';

    if (method === 'OTP_ONLY') {
      throw new BadRequestException('Password login is disabled for your account. Please use OTP login.');
    }

    if (method === 'PASSWORD_AND_OTP') {
      // 2FA - Initiate OTP
      const code = this.generateOtpCode();
      const key = this.getOtpKey(normalized, dto.tenantId);
      await this.clearOtpState(key);
      await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: user.id });

      if (provider === 'phone' && user.phone && user.tenantId) {
        await this.whatsappService.sendMessage({
          phone: user.phone,
          tenantId: user.tenantId,
          content: `Your second factor verification code is *${code}*. It expires in 5 minutes.`,
        });
      } else if (user.email) {
        await this.mailService.sendLoginCode(user.email, code, user.name);
      }

      return {
        message: 'Password verified. An OTP has been sent to your ' + (provider === 'phone' ? 'WhatsApp' : 'email') + ' for verification.',
        requiresOtp: true,
        identifier: normalized,
        tenantId: user.tenantId,
        provider,
      };
    }

    // PASSWORD_ONLY
    return this.login(user);
  }

  async validateJwtToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  // ═══════════════════════════════════════════════
  // SIGNUP FLOW
  // ═══════════════════════════════════════════════

  async signUp(dto: SignupDto) {
    const { tenantId, name, email, role } = dto;
    const phone = this.normalizePhone(dto.phone);
    const key = this.getOtpKey(phone, tenantId);

    await this.assertNotBlocked(key);

    // Check for existing user
    const existing = await this.prisma.user.findUnique({
      where: { phone_tenantId: { phone, tenantId } },
    });
    if (existing) {
      throw new ConflictException('An account with this phone number already exists in this store.');
    }

    // Store signup data in Redis (TTL 10min, user created after OTP verify)
    await this.redisService.set(
      this.redisSignupKey(key),
      JSON.stringify({ phone, tenantId, name, email, role: role || 'CUSTOMER' }),
      600,
    );

    // Generate & send OTP via WhatsApp
    const code = this.generateOtpCode();
    await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: '' });

    await this.whatsappService.sendMessage({
      phone,
      tenantId,
      content: `Welcome! Your verification code is *${code}*. It expires in 5 minutes.`,
    });

    this.logger.log(`Signup OTP sent to ${phone}`);
    return { message: 'OTP sent to your WhatsApp. Please verify to complete registration.' };
  }

  async verifySignupOtp(phone: string, tenantId: string, otp: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const key = this.getOtpKey(normalizedPhone, tenantId);

    await this.assertNotBlocked(key);

    const entry = await this.getOtpEntry(key);
    if (!entry) throw new BadRequestException('OTP not requested or has expired. Please try again.');
    if (Date.now() > entry.expiresAt) {
      await this.redisService.del(this.redisOtpKey(key));
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }
    if (entry.code !== otp) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code.');
    }

    // OTP valid — retrieve signup data
    const raw = await this.redisService.get<string>(this.redisSignupKey(key));
    if (!raw) throw new BadRequestException('Signup session expired. Please start over.');

    const signupData = JSON.parse(raw as unknown as string);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        phone: signupData.phone,
        name: signupData.name,
        email: signupData.email,
        role: (signupData.role as UserRole) || UserRole.CUSTOMER,
        tenant: { connect: { id: signupData.tenantId } },
      },
    });

    // Initialize UserSettings
    await this.prisma.userSettings.create({
      data: { userId: user.id },
    });

    await this.clearOtpState(key);
    await this.redisService.del(this.redisSignupKey(key));

    // Send welcome message
    try {
      await this.whatsappService.sendMessage({
        phone: user.phone,
        tenantId,
        content: `🎉 Welcome${user.name ? ` ${user.name}` : ''}! Your account has been created successfully.`,
      });
    } catch (e) {
      this.logger.warn('Welcome message failed to send, continuing anyway.');
    }

    const tokens = await this.generateTokenPair(user);
    return {
      message: 'Account created successfully.',
      ...tokens,
      user: { id: user.id, phone: user.phone, name: user.name, role: user.role, tenantId: user.tenantId },
    };
  }

  // ═══════════════════════════════════════════════
  // ADMIN OTP LOGIN (existing — preserved & upgraded)
  // ═══════════════════════════════════════════════

  async requestAdminLoginCode(dto: AdminRequestLoginCodeDto) {
    const provider = dto.provider || 'email';
    const identifier = dto.identifier.trim();
    const normalized = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalized, dto.tenantId);

    await this.assertNotBlocked(key);

    let user: any;
    if (provider === 'phone') {
      if (!dto.tenantId) throw new BadRequestException('tenantId is required for phone-based admin login.');
      user = await this.prisma.user.findUnique({
        where: { phone_tenantId: { phone: normalized, tenantId: dto.tenantId } },
        include: { settings: true },
      });
    } else {
      user = await this.prisma.user.findFirst({
        where: { email: normalized, isActive: true },
        include: { settings: true },
      });
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new BadRequestException('No admin account found for these credentials.');
    }

    // Check settings
    const method = user.settings?.loginMethod || 'PASSWORD_AND_OTP';
    if (method === 'PASSWORD_ONLY') {
      throw new BadRequestException('OTP login is disabled for your admin account. Please use password login.');
    }

    const code = this.generateOtpCode();
    await this.clearOtpState(key);
    await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: user.id });

    if (provider === 'phone') {
      await this.whatsappService.sendMessage({
        phone: normalized,
        tenantId: dto.tenantId!,
        content: `Your admin login OTP is *${code}*. It expires in 5 minutes.`,
      });
    } else {
      await this.mailService.sendLoginCode(identifier, code, user.name || undefined);
    }

    return { message: 'OTP sent successfully.' };
  }

  async verifyAdminLoginCode(dto: AdminVerifyLoginCodeDto) {
    const provider = dto.provider || 'email';
    const identifier = dto.identifier.trim();
    const normalized = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalized, dto.tenantId);

    await this.assertNotBlocked(key);

    const entry = await this.getOtpEntry(key);
    if (!entry) throw new BadRequestException('OTP not requested or has expired.');
    if (Date.now() > entry.expiresAt) {
      await this.redisService.del(this.redisOtpKey(key));
      throw new BadRequestException('OTP has expired.');
    }
    if (entry.code !== dto.otp) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code.');
    }

    await this.clearOtpState(key);

    const user = await this.usersService.findById(entry.userId);
    if (!user) throw new BadRequestException('User not found.');

    return user;
  }

  // ═══════════════════════════════════════════════
  // CUSTOMER OTP LOGIN (existing — preserved & upgraded)
  // ═══════════════════════════════════════════════

  async requestCustomerLoginCode(phone: string, tenantId: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const key = this.getOtpKey(normalizedPhone, tenantId);

    await this.assertNotBlocked(key);

    const user = await this.usersService.getOrCreateCustomer(normalizedPhone, tenantId);
    
    // Check settings if user just got created, settings might be default
    const userWithSettings = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    });

    if (!userWithSettings?.settings) {
      // First time customer, create settings if missing
      await this.prisma.userSettings.create({ data: { userId: user.id } });
    } else if (userWithSettings.settings.loginMethod === 'PASSWORD_ONLY') {
       throw new BadRequestException('OTP login is disabled for your account. Please use password login.');
    }

    const code = this.generateOtpCode();
    await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: user.id });

    await this.whatsappService.sendMessage({
      phone: normalizedPhone,
      tenantId,
      content: `Your login code is *${code}*. It expires in 5 minutes.`,
    });

    return { message: 'OTP sent to your WhatsApp successfully.' };
  }

  async verifyCustomerLoginCode(phone: string, tenantId: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const key = this.getOtpKey(normalizedPhone, tenantId);

    await this.assertNotBlocked(key);

    const entry = await this.getOtpEntry(key);
    if (!entry) throw new BadRequestException('OTP not requested or has expired.');
    if (Date.now() > entry.expiresAt) {
      await this.redisService.del(this.redisOtpKey(key));
      throw new BadRequestException('OTP has expired.');
    }
    if (entry.code !== code) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code.');
    }

    await this.clearOtpState(key);

    const user = await this.usersService.findById(entry.userId);
    if (!user) throw new BadRequestException('User not found.');

    return user;
  }

  // ═══════════════════════════════════════════════
  // RESEND OTP
  // ═══════════════════════════════════════════════

  async resendOtp(identifier: string, tenantId: string, provider: 'phone' | 'email' = 'phone') {
    const normalized = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalized, tenantId);

    await this.assertNotBlocked(key);

    // Clear old OTP first, then re-send
    await this.redisService.del(this.redisOtpKey(key));

    const user = provider === 'phone'
      ? await this.usersService.findByPhone(normalized, tenantId)
      : await this.usersService.findByEmail(normalized);

    if (!user) throw new NotFoundException('No account found for this identifier.');

    const code = this.generateOtpCode();
    await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: user.id });

    if (provider === 'phone') {
      await this.whatsappService.sendMessage({
        phone: normalized,
        tenantId,
        content: `Your new OTP is *${code}*. It expires in 5 minutes.`,
      });
    } else {
      await this.mailService.sendLoginCode(normalized, code, (user as any).name);
    }

    return { message: 'A new OTP has been sent.' };
  }

  // ═══════════════════════════════════════════════
  // PASSWORD MANAGEMENT
  // ═══════════════════════════════════════════════

  /**
   * Set or reset a user's password (after OTP verification — signup or forgot-password flow).
   * The OTP must have been verified first; we look up the user by phone/tenantId.
   */
  async setPassword(userId: string, dto: SetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }
    if (dto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    const hashed = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { message: 'Password set successfully.' };
  }

  /**
   * Change password for a logged-in user — requires the current password.
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match.');
    }
    if (dto.newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    if (!user.password) throw new BadRequestException('No password set. Use the reset-password flow.');

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Current password is incorrect.');

    const hashed = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return { message: 'Password changed successfully.' };
  }

  /**
   * Forgot password — sends OTP via WhatsApp/email to initiate reset.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const provider = dto.provider || 'phone';
    const normalized = provider === 'phone'
      ? this.normalizePhone(dto.identifier)
      : dto.identifier.toLowerCase();
    const key = this.getOtpKey(normalized, dto.tenantId);

    await this.assertNotBlocked(key);

    const user = provider === 'phone'
      ? await this.prisma.user.findUnique({ where: { phone_tenantId: { phone: normalized, tenantId: dto.tenantId } } })
      : await this.usersService.findByEmail(normalized);

    if (!user) {
      // Security: don't reveal if user exists
      return { message: 'If an account exists, an OTP has been sent.' };
    }

    const code = this.generateOtpCode();
    await this.storeOtp(key, { code, expiresAt: Date.now() + OTP_TTL_SECONDS * 1000, userId: user.id });

    if (provider === 'phone') {
      await this.whatsappService.sendMessage({
        phone: normalized,
        tenantId: dto.tenantId,
        content: `Your password reset OTP is *${code}*. It expires in 5 minutes. If you did not request this, ignore it.`,
      });
    } else if (user.email) {
      await this.mailService.sendLoginCode(user.email, code, (user as any).name);
    }

    return { message: 'If an account exists, an OTP has been sent.' };
  }

  /**
   * Verify forgot-password OTP and return a one-time token to set password.
   * Returns the userId so the set-password endpoint can be called.
   */
  async verifyForgotPasswordOtp(identifier: string, tenantId: string, otp: string, provider: 'phone' | 'email' = 'phone') {
    const normalized = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalized, tenantId);

    await this.assertNotBlocked(key);

    const entry = await this.getOtpEntry(key);
    if (!entry) throw new BadRequestException('OTP not requested or has expired.');
    if (Date.now() > entry.expiresAt) {
      await this.redisService.del(this.redisOtpKey(key));
      throw new BadRequestException('OTP has expired.');
    }
    if (entry.code !== otp) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code.');
    }

    await this.clearOtpState(key);

    // Issue a short-lived reset token (5 min) using module-level secret
    const secret = this.configService.get<string>('jwt.secret') ?? 'fallback-secret';
    const resetToken = this.jwtService.sign(
      { sub: entry.userId, purpose: 'password_reset' },
      { secret, expiresIn: '5m' },
    );

    return { message: 'OTP verified. Use the reset token to set your new password.', resetToken };
  }

  /**
   * Reset password using the token issued from verifyForgotPasswordOtp.
   */
  async resetPasswordWithToken(resetToken: string, dto: SetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(resetToken);
    } catch {
      throw new BadRequestException('Reset token is invalid or has expired.');
    }
    if (payload.purpose !== 'password_reset') {
      throw new BadRequestException('Invalid reset token.');
    }
    return this.setPassword(payload.sub, dto);
  }

  // ═══════════════════════════════════════════════
  // REFRESH TOKEN ROTATION
  // ═══════════════════════════════════════════════

  async refresh(oldRefreshToken: string) {
    if (!oldRefreshToken) throw new BadRequestException('Refresh token is required.');

    let payload: any;
    try {
      payload = this.jwtService.verify(oldRefreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token is invalid or expired.');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token not found or has expired. Please log in again.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException('User account not found.');

    // Rotate: delete old, issue new pair
    await this.prisma.refreshToken.delete({ where: { token: oldRefreshToken } });

    const tokens = await this.generateTokenPair(user);
    return { message: 'Token refreshed.', ...tokens };
  }

  // ═══════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════

  async logout(userId: string, refreshToken: string) {
    try {
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken, userId },
      });
    } catch {
      // Token already gone — treat as success
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * Logout from all devices — invalidates every refresh token for the user.
   */
  async logoutAllDevices(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logged out from all devices.' };
  }

  // ═══════════════════════════════════════════════
  // USER SETTINGS
  // ═══════════════════════════════════════════════

  async getUserSettings(userId: string) {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateUserSettings(userId: string, data: any) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        loginMethod: data.loginMethod,
        otpEnabled: data.otpEnabled,
      },
      create: {
        userId,
        loginMethod: data.loginMethod,
        otpEnabled: data.otpEnabled,
      },
    });
  }

  // ═══════════════════════════════════════════════
  // HELPER — used by JwtStrategy
  // ═══════════════════════════════════════════════

  async findOrCreateCustomer(phone: string, tenantId: string): Promise<any> {
    return this.usersService.getOrCreateCustomer(this.normalizePhone(phone), tenantId);
  }
}
