// ============================================
// Users Service
// ============================================

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly usersRepo: UsersRepository) {}

  /**
   * Get or create a customer by phone number
   */
  async getOrCreateCustomer(phone: string, tenantId: string): Promise<User> {
    const user = await this.usersRepo.findByPhone(phone, tenantId);
    if (user) return user;

    const newUser = await this.usersRepo.create({
      phone,
      tenant: { connect: { id: tenantId } },
      role: 'CUSTOMER',
    });
    this.logger.log(`Created new customer: ${phone} for tenant ${tenantId}`);
    return newUser;
  }

  async createUser(dto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepo.findByPhone(dto.phone, dto.tenantId);
    if (existingUser) {
      throw new ConflictException(`User with phone ${dto.phone} already exists in this tenant.`);
    }

    // Typecast to any to satisfy Prisma input typing based on Json fields
    const user = await this.usersRepo.create(dto as any);
    this.logger.log(`Created new user: ${user.phone} with role ${user.role}`);
    return user;
  }

  async getAllUsers(tenantId: string, skip?: number, take?: number): Promise<{ data: User[]; total: number }> {
    const data = await this.usersRepo.findAll(tenantId, skip, take);
    const total = await this.usersRepo.countAll(tenantId);
    return { data, total };
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    return user;
  }

  async findByPhone(phone: string, tenantId: string): Promise<User> {
    const user = await this.usersRepo.findByPhone(phone, tenantId);
    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found in tenant.`);
    }
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    await this.findById(id);
    return this.usersRepo.update(id, dto as any);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findByEmail(email);
  }

  async deleteUser(id: string): Promise<User> {
    await this.findById(id);
    return this.usersRepo.delete(id);
  }
}
