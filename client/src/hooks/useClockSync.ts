/**
 * client/src/hooks/useClockSync.ts
 * Tujuan: Hook tersuai untuk menguruskan kitaran hidup ClockSync (Cristian's algorithm) dan statistik latensi/offset.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { ClockSync } from '../lib/sync';
import { SyncStats } from '../types';

export function useClockSync(socket: Socket) {
  const [syncStats, setSyncStats] = useState<SyncStats>({
    offset: 0,
    latency: 18,
    drift: 0,
    lastSyncTime: Date.now(),
    status: 'synced',
  });

  const clockSyncRef = useRef<ClockSync | null>(null);

  useEffect(() => {
    const clockSync = new ClockSync(socket);
    clockSyncRef.current = clockSync;

    const unregisterSync = clockSync.onSync(({ offset, latency }) => {
      setSyncStats((prev) => ({
        ...prev,
        offset,
        latency,
        lastSyncTime: Date.now(),
        status: 'synced',
      }));
    });

    return () => {
      unregisterSync();
      clockSync.stopSync();
    };
  }, [socket]);

  const forceSync = useCallback(() => {
    clockSyncRef.current?.forceSync();
  }, []);

  const startSync = useCallback((intervalMs?: number) => {
    clockSyncRef.current?.startSync(intervalMs);
  }, []);

  const stopSync = useCallback(() => {
    clockSyncRef.current?.stopSync();
  }, []);

  const getServerTime = useCallback((): number => {
    return clockSyncRef.current ? clockSyncRef.current.getServerTime() : Date.now();
  }, []);

  return {
    syncStats,
    setSyncStats,
    clockSyncRef,
    forceSync,
    startSync,
    stopSync,
    getServerTime,
  };
}
