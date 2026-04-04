// ============================================
// MongoDB Module — Global Mongoose provider
// ============================================

import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongodb.uri'),
        retryAttempts: 3,
        retryDelay: 1000,
      }),
    }),
  ],
})
export class MongoDBModule {}
