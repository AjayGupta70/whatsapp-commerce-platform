import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const secure = this.configService.get<boolean>('mail.secure');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    this.from = this.configService.get<string>('mail.from') || 'no-reply@example.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
      this.logger.log('Mail transporter initialized.');
    } else {
      this.logger.warn('SMTP not configured — email sending is disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.');
    }
  }

  private async send(to: string, subject: string, text: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[MAIL SKIP] Would send to ${to}: ${subject}`);
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }

  /** Send a login/signup OTP */
  async sendLoginCode(email: string, code: string, userName?: string): Promise<void> {
    const name = userName || 'User';
    await this.send(
      email,
      'Your verification code',
      `Hello ${name},\n\nYour verification code is ${code}.\nIt expires in 5 minutes.\n\nIf you did not request this, please ignore this email.`,
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#1a1a1a">Your Verification Code</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Use the code below to complete your login:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#4f46e5;margin:24px 0;text-align:center">${code}</div>
          <p style="color:#888;font-size:13px">This code expires in <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
      `,
    );
  }

  /** Send a password reset OTP */
  async sendPasswordResetCode(email: string, code: string, userName?: string): Promise<void> {
    const name = userName || 'User';
    await this.send(
      email,
      'Password Reset Code',
      `Hello ${name},\n\nYour password reset code is ${code}.\nIt expires in 5 minutes.\n\nIf you did not request a password reset, please ignore this email.`,
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#1a1a1a">Password Reset</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Use the code below to reset your password:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#ef4444;margin:24px 0;text-align:center">${code}</div>
          <p style="color:#888;font-size:13px">This code expires in <strong>5 minutes</strong>. If you did not request a reset, you can safely ignore this.</p>
        </div>
      `,
    );
  }

  /** Send a welcome email after account creation */
  async sendWelcomeEmail(email: string, userName?: string): Promise<void> {
    const name = userName || 'there';
    await this.send(
      email,
      'Welcome! Your account is ready',
      `Hello ${name},\n\nYour account has been successfully created. You can now log in using your phone or email.\n\nWelcome aboard!`,
      `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:8px">
          <h2 style="color:#1a1a1a">🎉 Welcome, ${name}!</h2>
          <p>Your account has been <strong>successfully created</strong>.</p>
          <p>You can now log in using your phone number or email address.</p>
          <p style="color:#888;font-size:13px;margin-top:24px">If you have any questions, feel free to reach out to our support team.</p>
        </div>
      `,
    );
  }
}
