// ============================================
// Auth Module — JWT + Mail-based OTP + Password
// ============================================

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './guards/jwt.strategy';
import { UsersModule } from '../users/users.module';
import { MailService } from './mail.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { PrismaModule } from '../../database/postgres/prisma/prisma.module';
import { RedisModule } from '../database/redis/redis.module';

@Module({
  imports: [
    UsersModule,
    WhatsappModule,
    PrismaModule,
    RedisModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailService],
  exports: [AuthService],
})
export class AuthModule {}
