// ============================================
// Campaign Repository
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@database/postgres/prisma/prisma.service';
import { Prisma, Campaign, CampaignLog } from '@prisma/client';

@Injectable()
export class CampaignRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.CampaignCreateInput): Promise<Campaign> {
    return this.prisma.campaign.create({ data });
  }

  async findMany(tenantId: string): Promise<Campaign[]> {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: { logs: true },
    });
  }

  async updateStatus(id: string, status: any): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  async createLog(data: Prisma.CampaignLogCreateInput): Promise<CampaignLog> {
    return this.prisma.campaignLog.create({ data });
  }
}
