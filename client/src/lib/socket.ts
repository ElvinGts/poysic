/**
 * client/src/lib/socket.ts
 * Tujuan: Singleton untuk sambungan klien Socket.IO dengan fallback automatik dan pengesanan status.
 */
import { io, Socket } from 'socket.io-client';

class SocketClient {
  private static instance: SocketClient;
  public socket: Socket;

  private constructor() {
    // Sokong override VITE_SOCKET_URL untuk persekitaran pengeluaran (Vercel + Railway/Render)
    const envSocketUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCKET_URL;
    const isBrowser = typeof window !== 'undefined';
    const serverUrl = envSocketUrl || (isBrowser ? window.location.origin : 'http://localhost:3000');

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
