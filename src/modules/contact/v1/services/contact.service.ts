// ============================================
// Contact Service
// ============================================

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
const csv = require('csv-parser');
const XLSX = require('xlsx');
import { ContactRepository } from '../repositories/contact.repository';
import { Contact } from '@prisma/client';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly contactRepository: ContactRepository) {}

  async parseAndSaveContacts(fileBuffer: Buffer, tenantId: string, filename: string): Promise<number> {
    const fileExtension = filename.split('.').pop()?.toLowerCase();

    let results: any[] = [];

    if (fileExtension === 'csv') {
      results = await this.parseCSV(fileBuffer);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      results = await this.parseExcel(fileBuffer);
    } else {
      throw new BadRequestException('Unsupported file format. Please upload CSV or Excel files.');
    }

    let count = 0;
    for (const row of results) {
      const name = row.name || row.Name || '';
      const phone = row.phone || row.Phone || row.number || row.Number || '';

      if (phone) {
        // Ensure phone has proper format (simple cleaning for now)
        const cleanPhone = phone.toString().replace(/\D/g, '');
        
        if (cleanPhone.length >= 10) { // Basic validation
          await this.contactRepository.upsert(cleanPhone, tenantId, {
            name: name || undefined,
            metadata: row.metadata ? JSON.parse(row.metadata) : row,
          });
          count++;
        }
      }
    }

    this.logger.log(`Successfully processed ${count} contacts for tenant ${tenantId}`);
    return count;
  }

  private async parseCSV(fileBuffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error: Error) => reject(error));
    });
  }

  private async parseExcel(fileBuffer: Buffer): Promise<any[]> {
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      return jsonData;
    } catch (error) {
      throw new BadRequestException('Error parsing Excel file. Please ensure it has valid format.');
    }
  }

  async getContacts(tenantId: string): Promise<Contact[]> {
    return this.contactRepository.findMany(tenantId);
  }
}
