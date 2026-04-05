import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const secure = this.configService.get<boolean>('mail.secure');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    this.from = this.configService.get<string>('mail.from') || 'no-reply@example.com';

    if (!host || !user || !pass) {
      throw new InternalServerErrorException(
        'SMTP mail settings are not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM in environment variables.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendLoginCode(email: string, code: string, userName?: string): Promise<void> {
    const subject = 'Your admin login code';
    const text = `Hello ${userName || 'Admin'},\n\nYour login code is ${code}. It will expire in 10 minutes.\n\nIf you did not request this, please contact support.`;
    const html = `<p>Hello ${userName || 'Admin'},</p><p>Your login code is <strong>${code}</strong>.</p><p>This code will expire in 10 minutes.</p>`;

    try {
      await this.transporter.sendMail({
        from: this.from,
        to: email,
        subject,
        text,
        html,
      });
      this.logger.log(`Sent login code to ${email}`);
    } catch (error) {
      this.logger.error('Failed to send login code email', error);
      throw new InternalServerErrorException('Unable to send login code email');
    }
  }
}
