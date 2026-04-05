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

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, isActive: true },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id: string): Promise<User> {
    // Standard Soft-Delete
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findAll(tenantId: string, skip?: number, take?: number): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countAll(tenantId: string): Promise<number> {
    return this.prisma.user.count({ where: { tenantId, isActive: true } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
