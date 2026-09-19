/**
 * server/src/clockSync.ts
 * Cristian's clock synchronization algorithm and periodic room heartbeat loop.
 * Provides high-precision time reference for sub-second audio sync across clients.
 */

import { Server as SocketIOServer } from 'socket.io';
import { RoomState } from './types';
import { advanceTrack } from './queue';

/**
 * Handles incoming Cristian's algorithm clock ping from clients.
 * Responds immediately with high-resolution server epoch timestamp.
 */
export function handleClockPing(
  _clientTimestamp: number,
  callback: (serverTime: number) => void
): void {
  if (typeof callback === 'function') {
    callback(Date.now());
  }
}

/**
 * Calculates the expected playback position in seconds given the last recorded
 * position, the last update timestamp, and the target server timestamp.
 */
export function calculateExpectedPosition(
  lastPosition: number,
  lastUpdated: number,
  currentServerTime: number
): number {
  const elapsed = Math.max(0, (currentServerTime - lastUpdated) / 1000);
  return lastPosition + elapsed;
}

/**
 * Sanitizes a playback position value in seconds.
 * Guarantees a non-negative, finite numeric value.
 * Safely defaults to 0 if the input is NaN, null, undefined, infinite, or not a number.
 * Optionally clamps to track duration upper bound.
 */
export function sanitizePosition(position: unknown, maxDuration?: number): number {
  if (typeof position !== 'number' || !Number.isFinite(position) || Number.isNaN(position)) {
    return 0;
  }
  const nonNegative = Math.max(0, position);
  if (typeof maxDuration === 'number' && Number.isFinite(maxDuration) && maxDuration > 0) {
    return Math.min(nonNegative, maxDuration);
  }
  return nonNegative;
}

/**
 * Starts the periodic 5000ms heartbeat and position advancement loop across all active rooms.
 * Broadcasts sync:heartbeat pulses, advances playback elapsed time, and automatically triggers
 * track transitions when songs end.
 */
export function startHeartbeatService(
  io: SocketIOServer,
  rooms: Map<string, RoomState>,
  intervalMs = 5000
): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();

    rooms.forEach((room, roomId) => {
      if (room.isPlaying) {
        const elapsed = Math.max(0, (now - room.lastUpdated) / 1000);
        const currentPos = sanitizePosition(room.position);
        room.position = currentPos + elapsed;
        room.lastUpdated = now;

        // Check if track ended
        if (room.currentTrack && room.position >= room.currentTrack.duration) {
          const { nextTrack, finished } = advanceTrack(room);

          if (nextTrack) {
            io.to(roomId).emit('room:track_change', {
              track: nextTrack,
              position: 0,
              timestamp: room.lastUpdated,
              isPlaying: true,
            });
            io.to(roomId).emit('room:queue_updated', { queue: room.queue });
          } else if (finished) {
            io.to(roomId).emit('room:pause', {
              position: room.position,
              timestamp: room.lastUpdated,
            });
          }
        }
      }

      // Broadcast periodic heartbeat to maintain client synchronization
      io.to(roomId).emit('sync:heartbeat', {
        isPlaying: room.isPlaying,
        position: sanitizePosition(room.position),
        timestamp: room.lastUpdated,
        currentTrack: room.currentTrack,
      });
    });
  }, intervalMs);
}
