/**
 * client/src/lib/socket.ts
 * Tujuan: Singleton untuk sambungan klien Socket.IO dengan fallback automatik dan pengesanan status.
 */
import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket;

  private constructor() {
    // Sambung ke origin semasa secara automatik (sesuai untuk port 3000, Vite dev proxy, dan Cloud Run reverse proxy)
    const isBrowser = typeof window !== 'undefined';
    const serverUrl = isBrowser ? window.location.origin : 'http://localhost:3000';

    this.socket = io(serverUrl, {
      autoConnect: true,
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[PoySic Socket] Connected with ID:', this.socket.id);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[PoySic Socket] Connection warning:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[PoySic Socket] Disconnected:', reason);
    });
  }

  public static getInstance(): SocketClient {
    if (!SocketClient.instance) {
      SocketClient.instance = new SocketClient();
    }
    return SocketClient.instance;
  }
}

export const socket = SocketClient.getInstance().socket;
