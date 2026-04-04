// ============================================
// Baileys Client — WhatsApp Web connection
// Handles QR login, session, reconnection, media
// ============================================

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  Browsers,
  fetchLatestBaileysVersion,
  WAMessage,
  WASocket,
  DEFAULT_CONNECTION_CONFIG,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import * as qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';
import { WhatsappGateway } from './whatsapp.gateway';

@Injectable()
export class BaileysClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BaileysClient.name);
  private sock: WASocket | null = null;
  private sessionPath: string;
  private qrCode: string | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;
  private messageCallbacks: ((msg: any) => Promise<void>)[] = [];
  private store: any;
  private readonly sendTimeoutMs: number = 30000;

  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly whatsappGateway: WhatsappGateway,
  ) {
    this.sessionPath = path.join(process.cwd(), 'sessions', 'whatsapp');
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing Baileys WhatsApp client...');
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Connect to WhatsApp using Baileys
   */
  async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      this.logger.log('Already connecting or connected; skipping duplicate connect attempt');
      return;
    }

    this.isConnecting = true;
    try {
      this.logger.log('Connecting to WhatsApp...');

      // Ensure session directory exists
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      // Get latest Baileys version
      const { version } = await fetchLatestBaileysVersion();

      // Load or create auth state
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);

      // Create WhatsApp socket with optimized config for authentication
      this.sock = makeWASocket({
        version,
        logger: DEFAULT_CONNECTION_CONFIG.logger,
        printQRInTerminal: false,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        generateHighQualityLinkPreview: true,
        // Add these settings for better authentication compatibility
        qrTimeout: 120000, // 120 seconds for QR timeout (increased for scanning)
        defaultQueryTimeoutMs: 60000,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        retryRequestDelayMs: 5000,
        maxMsgRetryCount: 3,
        emitOwnEvents: false,
        markOnlineOnConnect: true,
      });

      // Save credentials on authentication
      this.sock.ev.on('creds.update', saveCreds);

      // Bind event handlers
      this.bindEventHandlers();

      this.logger.log('WhatsApp client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Bind all event handlers
   */
  private bindEventHandlers(): void {
    if (!this.sock) return;

    // Connection updates
    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.qrCode = qr;
        this.logger.log('✅ QR Code generated! Scan from the web dashboard:');
        this.logger.log('🌐 Open: http://localhost:3000/');
        this.logger.log('⏱️ QR Code expires in 120 seconds - Scan quickly!');

        // Emit QR code to WebSocket clients
        this.whatsappGateway.emitQrCode(qr);
      }

      if (connection === 'close') {
        this.isConnected = false;
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        this.logger.warn('WhatsApp connection closed:', lastDisconnect?.error);
        this.whatsappGateway.emitConnectionStatus('disconnected', false);

        if (shouldReconnect) {
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts += 1;
            this.logger.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.whatsappGateway.emitConnectionStatus('reconnecting', false);
            setTimeout(() => this.connect(), 5000);
          } else {
            this.logger.error('Max reconnect attempts reached, stopping retries');
            this.whatsappGateway.emitConnectionStatus('failed', false);
          }
        } else {
          this.logger.error('Logged out, clearing session and requesting new QR login');
          this.whatsappGateway.emitConnectionStatus('logged_out', false);

          await this.disconnect();
          try {
            if (fs.existsSync(this.sessionPath)) {
              fs.rmSync(this.sessionPath, { recursive: true, force: true });
            }
          } catch (cleanupError) {
            this.logger.error('Error clearing WhatsApp session after logout:', cleanupError);
          }

          this.reconnectAttempts = 0;
          setTimeout(() => this.connect(), 5000);
        }
      } else if (connection === 'open') {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.qrCode = null;
        this.logger.log('✅ WhatsApp connected successfully!');
        this.whatsappGateway.emitConnectionStatus('connected', true, this.sock?.user);
      }
    });

    // Messages
    this.sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === 'notify') {
        await this.handleIncomingMessage(msg);
      }
    });

    // Message status updates
    this.sock.ev.on('messages.update', (updates) => {
      this.logger.debug('Message status updates:', updates);
    });

    // Send message receipts
    this.sock.ev.on('message-receipt.update', (updates) => {
      this.logger.debug('Message receipts:', updates);
    });
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(msg: WAMessage): Promise<void> {
    try {
      const payload = this.parseIncomingMessage(msg);

      // Call all registered callbacks
      for (const callback of this.messageCallbacks) {
        await callback(payload);
      }
    } catch (error) {
      this.logger.error('Error handling incoming message:', error);
    }
  }

  private formatPhoneToJid(phone: string): string {
    if (phone.includes('@')) {
      return phone;
    }

    const cleaned = phone
      .trim()
      .replace(/^\+/, '')
      .replace(/\D/g, '');

    if (!cleaned) {
      throw new Error('Invalid WhatsApp phone number');
    }

    return `${cleaned}@s.whatsapp.net`;
  }

  /**
   * Parse incoming WhatsApp message
   */
  private parseIncomingMessage(msg: WAMessage): any {
    const from = msg.key.remoteJid!;
    const messageId = msg.key.id!;

    let text = '';
    let media: any = null;
    let messageType = 'text';

    if (msg.message?.conversation) {
      text = msg.message.conversation;
    } else if (msg.message?.extendedTextMessage) {
      text = msg.message.extendedTextMessage.text || '';
    } else if (msg.message?.imageMessage) {
      messageType = 'image';
      media = msg.message.imageMessage;
      text = msg.message.imageMessage.caption || '';
    } else if (msg.message?.videoMessage) {
      messageType = 'video';
      media = msg.message.videoMessage;
      text = msg.message.videoMessage.caption || '';
    } else if (msg.message?.documentMessage) {
      messageType = 'document';
      media = msg.message.documentMessage;
    } else if (msg.message?.audioMessage) {
      messageType = 'audio';
      media = msg.message.audioMessage;
    }

    return {
      from: from.replace('@s.whatsapp.net', ''),
      to: this.sock?.user?.id?.replace('@s.whatsapp.net', ''),
      messageId,
      text,
      media,
      messageType,
      timestamp: msg.messageTimestamp,
      originalMessage: msg,
    };
  }

  /**
   * Send a text message
   */
  async sendTextMessage(phone: string, message: string): Promise<string | null> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const jid = this.formatPhoneToJid(phone);
      const socketState = (this.sock as any)?.ws?.readyState ?? 'unknown';

      this.logger.log(`Sending WhatsApp text message to ${jid}. socket.readyState=${socketState}, user=${JSON.stringify(this.sock?.user)}`);
      const result = await this.executeWithTimeout(
        this.sock.sendMessage(jid, { text: message }),
        this.sendTimeoutMs,
        `WhatsApp send timed out after ${this.sendTimeoutMs / 1000}s`,
      );
      this.logger.log(`✅ Message sent to ${phone}: ${message.substring(0, 50)}...`);

      return result?.key?.id || null;
    } catch (error) {
      this.logger.error(`❌ Failed to send message to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Send an image message
   */
  async sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<string | null> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const jid = this.formatPhoneToJid(phone);

      this.logger.log(`Sending WhatsApp image message to ${jid}`);
      const result = await this.executeWithTimeout(
        this.sock.sendMessage(jid, {
          image: { url: imageUrl },
          caption: caption || '',
        }),
        this.sendTimeoutMs,
        `WhatsApp image send timed out after ${this.sendTimeoutMs / 1000}s`,
      );

      this.logger.log(`✅ Image sent to ${phone}`);
      return result?.key?.id || null;
    } catch (error) {
      this.logger.error(`❌ Failed to send image to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Send a document message
   */
  async sendDocumentMessage(phone: string, documentUrl: string, fileName: string, caption?: string): Promise<string | null> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const jid = this.formatPhoneToJid(phone);

      this.logger.log(`Sending WhatsApp document message to ${jid}`);
      const result = await this.executeWithTimeout(
        this.sock.sendMessage(jid, {
          text: caption || fileName,
        }),
        this.sendTimeoutMs,
        `WhatsApp document send timed out after ${this.sendTimeoutMs / 1000}s`,
      );

      this.logger.log(`✅ Document sent to ${phone}: ${fileName}`);
      return result?.key?.id || null;
    } catch (error) {
      this.logger.error(`❌ Failed to send document to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Send interactive buttons message
   */
  async sendButtonsMessage(phone: string, text: string, buttons: any[]): Promise<string | null> {
    if (!this.sock || !this.isConnected) {
      throw new Error('WhatsApp not connected');
    }

    try {
      const jid = this.formatPhoneToJid(phone);

      const result = await this.sock.sendMessage(jid, {
        text: text,
      });

      this.logger.log(`✅ Buttons message sent to ${phone}`);
      return result?.key?.id || null;
    } catch (error) {
      this.logger.error(`❌ Failed to send buttons message to ${phone}:`, error);
      throw error;
    }
  }

  /**
   * Register a callback for incoming messages
   */
  onMessage(callback: (msg: any) => Promise<void>): void {
    this.messageCallbacks.push(callback);
    this.logger.log(`Registered message callback (${this.messageCallbacks.length} total)`);
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; qrCode?: string; user?: any; socketState?: string; sessionFiles?: string[] } {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode || undefined,
      user: this.sock?.user,
      socketState: (this.sock as any)?.ws?.readyState?.toString() ?? 'unknown',
      sessionFiles: fs.existsSync(this.sessionPath) ? fs.readdirSync(this.sessionPath) : [],
    };
  }

  getDiagnostics(): any {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode,
      user: this.sock?.user,
      socketState: (this.sock as any)?.ws?.readyState ?? 'unknown',
      socketType: this.sock?.type || 'unknown',
      messageCallbackCount: this.messageCallbacks.length,
      authFolder: this.sessionPath,
      authFiles: fs.existsSync(this.sessionPath) ? fs.readdirSync(this.sessionPath) : [],
    };
  }

  /**
   * Disconnect from WhatsApp
   */
  async disconnect(): Promise<void> {
    if (this.sock) {
      this.logger.log('Disconnecting from WhatsApp...');
      this.sock.end(undefined);
      this.sock = null;
      this.isConnected = false;
    }
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    if (this.sock) {
      await this.sock.logout();
      this.disconnect();

      // Clear session files
      try {
        if (fs.existsSync(this.sessionPath)) {
          fs.rmSync(this.sessionPath, { recursive: true, force: true });
        }
      } catch (error) {
        this.logger.error('Error clearing session:', error);
      }
    }
  }
}
