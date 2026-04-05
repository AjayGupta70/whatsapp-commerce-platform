// ============================================
// Contact Controller
// ============================================

import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  BadRequestException,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { ContactService } from '../services/contact.service';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Contacts')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post('upload/:tenantId')
  @ApiOperation({ summary: 'Upload contacts via CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadContacts(
    @Param('tenantId') tenantId: string,
    @Req() req: any,
  ) {
    const user = req.user;
    if (user.role === UserRole.ADMIN && user.tenantId !== tenantId) {
      throw new ForbiddenException('Admin can only upload contacts for their own tenant');
    }

    const file = await req.file();
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const buffer = await file.toBuffer();
    const filename = file.filename;
    const count = await this.contactService.parseAndSaveContacts(buffer, tenantId, filename);
    return {
      message: 'Contacts uploaded successfully',
      count,
    };
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all contacts for a tenant' })
  async getContacts(@Param('tenantId') tenantId: string, @Req() req: any) {
    const user = req.user;
    if (user.role === UserRole.ADMIN && user.tenantId !== tenantId) {
      throw new ForbiddenException('Admin can only view contacts for their own tenant');
    }
    return this.contactService.getContacts(tenantId);
  }
}
