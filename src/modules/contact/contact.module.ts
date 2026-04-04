// ============================================
// Contact Module
// ============================================

import { Module } from '@nestjs/common';
import { ContactController } from './v1/controllers/contact.controller';
import { ContactService } from './v1/services/contact.service';
import { ContactRepository } from './v1/repositories/contact.repository';

@Module({
  controllers: [ContactController],
  providers: [ContactService, ContactRepository],
  exports: [ContactService],
})
export class ContactModule {}
