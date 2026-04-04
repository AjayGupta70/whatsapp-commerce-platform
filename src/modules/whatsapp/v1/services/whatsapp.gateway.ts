// ============================================
// WhatsApp WebSocket Gateway
// Real-time QR code & status updates
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/whatsapp',
})
export class WhatsappGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WhatsappGateway.name);
  private connectedClients: Map<string, Socket> = new Map();
  private latestStatus: any = {
    connected: false,
    status: 'initializing',
    message: 'Initializing WhatsApp connection...',
    timestamp: new Date().toISOString(),
  };

  afterInit(server: Server) {
    this.logger.log('WhatsApp WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Send current status to new client
    client.emit('status', this.latestStatus);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Emit QR code to all connected clients
   */
  emitQrCode(qrCode: string): void {
    this.logger.log('Emitting QR code to clients');
    this.server.emit('qr', { qrCode });
  }

  /**
   * Emit connection status change
   */
  emitConnectionStatus(status: string, connected: boolean = false, user?: any): void {
    this.logger.log(`Emitting connection status: ${status}`);
    this.latestStatus = {
      connected,
      status,
      user,
      timestamp: new Date().toISOString(),
    };

    this.server.emit('status', this.latestStatus);
  }

  /**
   * Emit incoming message to dashboard
   */
  emitIncomingMessage(message: any): void {
    this.server.emit('message:incoming', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit outgoing message to dashboard
   */
  emitOutgoingMessage(message: any): void {
    this.server.emit('message:outgoing', {
      ...message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client subscription to specific tenant
   */
  @SubscribeMessage('subscribe:tenant')
  handleTenantSubscription(client: Socket, tenantId: string): void {
    client.join(`tenant:${tenantId}`);
    this.logger.log(`Client ${client.id} subscribed to tenant ${tenantId}`);
  }

  /**
   * Handle client unsubscription from tenant
   */
  @SubscribeMessage('unsubscribe:tenant')
  handleTenantUnsubscription(client: Socket, tenantId: string): void {
    client.leave(`tenant:${tenantId}`);
    this.logger.log(`Client ${client.id} unsubscribed from tenant ${tenantId}`);
  }

  /**
   * Send message to specific tenant room
   */
  emitToTenant(tenantId: string, event: string, data: any): void {
    this.server.to(`tenant:${tenantId}`).emit(event, {
      ...data,
      tenantId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connection stats
   */
  getStats(): { connectedClients: number } {
    return {
      connectedClients: this.connectedClients.size,
    };
  }
}
