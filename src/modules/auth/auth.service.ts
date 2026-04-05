// ============================================
// Auth Service
// ============================================

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/v1/services/users.service';
import { MailService } from './mail.service';
import { WhatsappService } from '../whatsapp/v1/services/whatsapp.service';
import { UserRole } from '@prisma/client';
import { AdminRequestLoginCodeDto } from './dto/admin-request-login-code.dto';
import { AdminVerifyLoginCodeDto } from './dto/admin-verify-login-code.dto';
import { RedisService } from '../database/redis/redis.service';

interface OtpEntry {
  code: string;
  expiresAt: number;
  userId: string;
}

@Injectable()
export class AuthService {
  private readonly OTP_MAX_ATTEMPTS = 5;
  private readonly OTP_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly whatsappService: WhatsappService,
    private readonly redisService: RedisService,
  ) {}

  private getRedisOtpKey(key: string): string {
    return `auth:otp:${key}`;
  }

  private getRedisAttemptsKey(key: string): string {
    return `auth:otp_attempts:${key}`;
  }

  private getRedisBlockedKey(key: string): string {
    return `auth:otp_blocked:${key}`;
  }

  private async isBlocked(key: string): Promise<boolean> {
    return this.redisService.exists(this.getRedisBlockedKey(key));
  }

  private async recordFailedAttempt(key: string): Promise<void> {
    const attemptsKey = this.getRedisAttemptsKey(key);
    const blockedKey = this.getRedisBlockedKey(key);
    const attempts = await this.redisService.incr(attemptsKey);

    if (attempts === 1) {
      await this.redisService.expire(attemptsKey, this.OTP_BLOCK_DURATION_MS / 1000);
    }

    if (attempts >= this.OTP_MAX_ATTEMPTS) {
      await this.redisService.set(blockedKey, '1', this.OTP_BLOCK_DURATION_MS / 1000);
      await this.redisService.del(attemptsKey);
    }
  }

  private async clearFailedAttempts(key: string): Promise<void> {
    await this.redisService.del(this.getRedisAttemptsKey(key), this.getRedisBlockedKey(key));
  }

  private async setOtpEntry(key: string, entry: OtpEntry, ttlSeconds: number): Promise<void> {
    await this.redisService.set(this.getRedisOtpKey(key), entry, ttlSeconds);
  }

  private async getOtpEntry(key: string): Promise<OtpEntry | null> {
    return this.redisService.get<OtpEntry>(this.getRedisOtpKey(key));
  }

  private normalizePhone(phone: string): string {
    const trimmed = phone.trim();
    if (trimmed.startsWith('+')) {
      return trimmed;
    }
    return trimmed.length === 10 ? `+91${trimmed}` : trimmed;
  }

  private getOtpKey(identifier: string, tenantId?: string): string {
    if (tenantId) {
      return `${identifier.toLowerCase()}_${tenantId}`;
    }
    return identifier.toLowerCase();
  }

  /**
   * Generate JWT for a user
   */
  async login(user: any) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      },
    };
  }

  // Admin Login Methods
  async requestAdminLoginCode(dto: AdminRequestLoginCodeDto) {
    const identifier = dto.identifier.trim();
    const provider = dto.provider || 'email';
    const normalizedIdentifier = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalizedIdentifier, dto.tenantId);

    if (await this.isBlocked(key)) {
      throw new BadRequestException('Too many failed OTP attempts. Please try again later.');
    }

    let user;
    if (provider === 'phone') {
      if (!dto.tenantId) {
        throw new BadRequestException('TenantId is required for admin phone login');
      }
      user = await this.usersService.findByPhone(normalizedIdentifier, dto.tenantId);
    } else {
      user = await this.usersService.findByEmail(normalizedIdentifier);
    }

    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      throw new BadRequestException('Admin user not found for provided credentials');
    }

    // Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const ttlSeconds = 5 * 60;

    await this.setOtpEntry(key, { code, expiresAt, userId: user.id }, ttlSeconds);
    await this.clearFailedAttempts(key);

    if (provider === 'phone') {
      const tenantId = dto.tenantId!;
      await this.whatsappService.sendMessage({
        phone: this.normalizePhone(identifier),
        tenantId,
        content: `Your admin login OTP is ${code}. It expires in 5 minutes.`,
      });
    } else {
      await this.mailService.sendLoginCode(identifier, code, user.name || undefined);
    }

    return { message: 'OTP sent successfully' };
  }

  async verifyAdminLoginCode(dto: AdminVerifyLoginCodeDto) {
    const identifier = dto.identifier.trim();
    const provider = dto.provider || 'email';
    const normalizedIdentifier = provider === 'phone' ? this.normalizePhone(identifier) : identifier.toLowerCase();
    const key = this.getOtpKey(normalizedIdentifier, dto.tenantId);

    if (await this.isBlocked(key)) {
      throw new BadRequestException('Too many failed OTP attempts. Please try again later.');
    }

    const otpEntry = await this.getOtpEntry(key);
    if (!otpEntry) {
      throw new BadRequestException('OTP not requested or expired');
    }

    if (Date.now() > otpEntry.expiresAt) {
      await this.redisService.del(this.getRedisOtpKey(key));
      throw new BadRequestException('OTP expired');
    }

    if (otpEntry.code !== dto.otp) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code');
    }

    await this.redisService.del(this.getRedisOtpKey(key));
    await this.clearFailedAttempts(key);

    const user = await this.usersService.findById(otpEntry.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  // Customer Login Methods
  async requestCustomerLoginCode(phone: string, tenantId: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const key = this.getOtpKey(normalizedPhone, tenantId);

    if (await this.isBlocked(key)) {
      throw new BadRequestException('Too many failed OTP attempts. Please try again later.');
    }

    const user = await this.usersService.getOrCreateCustomer(normalizedPhone, tenantId);

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const ttlSeconds = 5 * 60;

    await this.setOtpEntry(key, { code, expiresAt, userId: user.id }, ttlSeconds);
    await this.clearFailedAttempts(key);

    await this.whatsappService.sendMessage({
      phone: normalizedPhone,
      tenantId,
      content: `Your login code is ${code}. It expires in 5 minutes.`,
    });

    return { message: 'OTP sent to WhatsApp successfully' };
  }

  async verifyCustomerLoginCode(phone: string, tenantId: string, code: string) {
    const normalizedPhone = this.normalizePhone(phone);
    const key = this.getOtpKey(normalizedPhone, tenantId);

    if (await this.isBlocked(key)) {
      throw new BadRequestException('Too many failed OTP attempts. Please try again later.');
    }

    const otpEntry = await this.getOtpEntry(key);
    if (!otpEntry) {
      throw new BadRequestException('OTP not requested or expired');
    }

    if (Date.now() > otpEntry.expiresAt) {
      await this.redisService.del(this.getRedisOtpKey(key));
      throw new BadRequestException('OTP expired');
    }

    if (otpEntry.code !== code) {
      await this.recordFailedAttempt(key);
      throw new BadRequestException('Invalid OTP code');
    }

    await this.redisService.del(this.getRedisOtpKey(key));
    await this.clearFailedAttempts(key);

    const user = await this.usersService.findById(otpEntry.userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async validateJwtToken(token: string): Promise<any> {
    if (!token) {
      throw new BadRequestException('Token is required');
    }

    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

  async findOrCreateCustomer(phone: string, tenantId: string): Promise<any> {
    return this.usersService.getOrCreateCustomer(this.normalizePhone(phone), tenantId);
  }
}
