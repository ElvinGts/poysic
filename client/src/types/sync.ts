/**
 * client/src/types/sync.ts
 * Tujuan: Definisi jenis data Cristian sync dan statistik latency/offset PoySic.
 */

export interface SyncStats {
  offset: number; // ms offset antara client & server
  latency: number; // ms round-trip time / 2
  drift: number; // perbezaan audio terkini dengan masa jangkaan (saat)
  lastSyncTime: number;
  status: 'synced' | 'adjusting' | 'desynced' | 'connecting';
}

export type SyncListener = (data: { offset: number; latency: number; serverTime: number }) => void;
