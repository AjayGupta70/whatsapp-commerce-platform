// ============================================
// User Module
// ============================================

import { Module } from '@nestjs/common';
import { UsersService } from './v1/services/users.service';
import { UsersRepository } from './v1/repositories/users.repository';
import { UsersController } from './v1/controllers/users.controller';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
