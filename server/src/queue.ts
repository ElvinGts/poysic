/**
 * server/src/queue.ts
 * Room playback queue management: deduplication, queue mutation,
 * and track auto-advance sequencing.
 */

import { RoomState, Track } from './types';

/**
 * Adds a track to the room queue if not already present.
 * Returns true if added, false if duplicate.
 */
export function addToQueue(room: RoomState, track: Track): boolean {
  if (!room || !Array.isArray(room.queue) || !track || !track.id) {
    return false;
  }
  const exists = room.queue.some((t) => t.id === track.id);
  if (!exists) {
    room.queue.push(track);
    return true;
  }
  return false;
}

/**
 * Removes a track from the room queue by ID.
 * Returns true if a track was removed, false otherwise.
 */
export function removeFromQueue(room: RoomState, trackId: string): boolean {
  if (!room || !Array.isArray(room.queue) || typeof trackId !== 'string') {
    return false;
  }
  const initialLength = room.queue.length;
  room.queue = room.queue.filter((t) => t.id !== trackId);
  return room.queue.length < initialLength;
}

/**
 * Empties all tracks from the room queue.
 */
export function clearQueue(room: RoomState): void {
  room.queue = [];
}

/**
 * Advances to the next track in the queue when the current song completes.
 * If queue is empty, stops playback and caps position at song duration.
 */
export function advanceTrack(room: RoomState): { nextTrack: Track | null; finished: boolean } {
  if (room.queue.length > 0) {
    const nextTrack = room.queue.shift()!;
    room.currentTrack = nextTrack;
    room.position = 0;
    room.lastUpdated = Date.now();
    room.isPlaying = true;
    return { nextTrack, finished: false };
  }

  room.isPlaying = false;
  if (room.currentTrack) {
    room.position = room.currentTrack.duration;
  }
  room.lastUpdated = Date.now();
  return { nextTrack: null, finished: true };
}
