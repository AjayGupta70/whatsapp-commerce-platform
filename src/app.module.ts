// ============================================
// Main App Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import configuration from './config/configuration';

// ─── Logging ──────────────────────────────
import { CommonLoggerModule } from './common/logger/logger.module';

// ─── Database Modules ──────────────────────
import { MongoDBModule } from './database/mongodb/mongodb.module';
import { PrismaModule } from './database/postgres/prisma/prisma.module';
import { RedisModule } from './modules/database/redis/redis.module';

// ─── Feature Modules ────────────────────────
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { AuthModule } from './modules/auth/auth.module';
import { RabbitMQModule } from './microservices/rabbitmq-service/rabbitmq.module';
import { AIModule } from './modules/ai/ai.module';
import { StorageModule } from './modules/storage/storage.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ContactModule } from './modules/contact/contact.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';

@Module({
  imports: [
    // Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Queues
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
        },
      }),
    }),

    // Logging
    CommonLoggerModule,

    // Central Databases
    PrismaModule,
    MongoDBModule,
    RedisModule,

    // Business Modules
    TenantsModule,
    UsersModule,
    CatalogModule,
    InventoryModule,
    ContactModule,
    CampaignModule,
    OrdersModule,
    PaymentsModule,
    AIModule,
    StorageModule,
    WhatsappModule,
    AuthModule,
    RabbitMQModule,
  ],
})
export class AppModule {}
