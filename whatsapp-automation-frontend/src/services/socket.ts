import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000/whatsapp';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to WhatsApp WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WhatsApp WebSocket');
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
