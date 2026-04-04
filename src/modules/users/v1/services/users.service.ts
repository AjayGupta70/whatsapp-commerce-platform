// ============================================
// Users Service
// ============================================

import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  /**
   * Get or create a customer by phone number
   */
  async getOrCreateCustomer(phone: string, tenantId: string): Promise<User> {
    const user = await this.usersRepo.findByPhone(phone, tenantId);
    if (user) return user;

    return this.usersRepo.create({
      phone,
      tenant: { connect: { id: tenantId } },
      role: 'CUSTOMER',
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepo.findById(id);
  }
}
