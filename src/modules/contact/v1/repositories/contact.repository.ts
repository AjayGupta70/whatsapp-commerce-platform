// ============================================
// Contact Repository
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Prisma, Contact } from '@prisma/client';

@Injectable()
export class ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ContactCreateInput): Promise<Contact> {
    return this.prisma.contact.create({ data });
  }

  async upsert(phone: string, tenantId: string, data: Partial<Prisma.ContactCreateInput>): Promise<Contact> {
    return this.prisma.contact.upsert({
      where: {
        phone_tenantId: {
          phone,
          tenantId,
        },
      },
      update: data,
      create: {
        phone,
        tenantId,
        ...data,
      } as Prisma.ContactCreateInput,
    });
  }

  async findMany(tenantId: string): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: { tenantId },
    });
  }

  async findByPhone(phone: string, tenantId: string): Promise<Contact | null> {
    return this.prisma.contact.findUnique({
      where: {
        phone_tenantId: {
          phone,
          tenantId,
        },
      },
    });
  }
}
