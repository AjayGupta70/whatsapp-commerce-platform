// ============================================
// User Module
// ============================================

import { Module } from '@nestjs/common';
import { UsersService } from './v1/services/users.service';
import { UsersRepository } from './v1/repositories/users.repository';

@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
