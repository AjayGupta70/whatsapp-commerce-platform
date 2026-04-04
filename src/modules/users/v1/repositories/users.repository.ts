// ============================================
// Users Repository — Prisma PostgreSQL
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPhone(phone: string, tenantId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { phone_tenantId: { phone, tenantId } },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
