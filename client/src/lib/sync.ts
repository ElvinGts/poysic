/**
 * client/src/lib/sync.ts
 * Tujuan: Kelas ClockSync untuk mengira perbezaan masa (offset) antara klien dan pelayan menggunakan Algoritma Cristian.
 */
import { Socket } from 'socket.io-client';
import { SyncListener } from '../types';

export class ClockSync {
  private socket: Socket;
  private offset: number = 0;
  private latency: number = 0;
  private isSyncing: boolean = false;
  private intervalId: any = null;
  private listeners: Set<SyncListener> = new Set();

  constructor(socket: Socket) {
    this.socket = socket;
  }

  public startSync(intervalMs: number = 8000) {
    if (this.isSyncing) return;
    this.isSyncing = true;

    // Lakukan ping permulaan dengan pantas (0s, 1s, 3s)
    this.pingServer();
    setTimeout(() => this.pingServer(), 1000);
    setTimeout(() => this.pingServer(), 3000);

    this.intervalId = setInterval(() => {
      this.pingServer();
    }, intervalMs);
  }

  public stopSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isSyncing = false;
  }

  public forceSync() {
    this.pingServer();
  }

  public pingServer() {
    if (!this.socket.connected) {
      return;
    }

    const t0 = Date.now();
    this.socket.emit('clock:ping', t0, (serverTime: number) => {
      const t1 = Date.now();
      const roundTrip = t1 - t0;
      this.latency = roundTrip / 2;
      // Cristian's Algorithm:
      // Waktu pelayan yang dianggarkan pada masa t1 ialah serverTime + latency
      // Offset = (serverTime + latency) - t1 = serverTime - (t1 - latency)
      this.offset = serverTime - (t1 - this.latency);

      // Maklumkan pemerhati UI
      const currentServerTime = this.getServerTime();
      this.listeners.forEach((listener) => {
        listener({
          offset: this.offset,
          latency: this.latency,
          serverTime: currentServerTime,
        });
      });
    });
  }

  public onSync(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getServerTime(): number {
    return Date.now() + this.offset;
  }

  public getOffset(): number {
    return this.offset;
  }

  public getLatency(): number {
    return this.latency;
  }
}
