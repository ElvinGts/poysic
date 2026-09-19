/**
 * server/src/rooms.ts
 * In-memory room manager for PoySic.
 * Handles room lifecycle, host migration, participant tracking,
 * and fixes the empty-room garbage collection leak on socket disconnect.
 */

import { Participant, RoomState } from './types';
import { FALLBACK_TRACKS } from './jamendo';

export interface DisconnectResult {
  roomId: string;
  room: RoomState;
  leftParticipant?: Participant;
  newHostId?: string;
  isNowEmpty: boolean;
}

export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Retrieves an existing room by its ID.
   */
  get(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Returns the underlying rooms Map.
   */
  getAll(): Map<string, RoomState> {
    return this.rooms;
  }

  /**
   * Returns the count of active rooms currently managed in memory.
   */
  size(): number {
    return this.rooms.size;
  }

  /**
   * Retrieves an existing room or creates a new one with default starter tracks.
   */
  getOrCreate(roomId: string, hostSocketId: string): { room: RoomState; isNew: boolean } {
    let room = this.rooms.get(roomId);
    let isNew = false;

    if (!room) {
      isNew = true;
      room = {
        roomId,
        hostId: hostSocketId,
        currentTrack: FALLBACK_TRACKS[0], // Starter track
        isPlaying: false,
        position: 0,
        lastUpdated: Date.now(),
        queue: FALLBACK_TRACKS.slice(1, 4), // Next 3 tracks
        participants: [],
      };
      this.rooms.set(roomId, room);
    }

    return { room, isNew };
  }

  /**
   * Adds or updates a participant in a room.
   * Cancels any pending cleanup timer for the room if a user joins.
   */
  join(
    roomId: string,
    socketId: string,
    username?: string,
    avatar?: string
  ): { room: RoomState; participant: Participant; isNew: boolean } {
    // If room was queued for cleanup, cancel it because someone joined
    this.cancelCleanup(roomId);

    const { room, isNew } = this.getOrCreate(roomId, socketId);

    const participantName =
      typeof username === 'string' && username.trim().length > 0
        ? username.trim().slice(0, 24)
        : `Peminat #${socketId.slice(-4)}`;
    const participantAvatar =
      typeof avatar === 'string' && avatar.trim().length > 0 ? avatar : '🎧';

    const existingIndex = room.participants.findIndex((p) => p.id === socketId);

    // If the room currently has no active host (e.g. empty room rejoined during grace period,
    // or previous host disconnected while empty), designate this participant as the host.
    const hasActiveHost = room.participants.some(
      (p) => p.id === room.hostId && p.id !== socketId
    );
    const isHost = room.participants.length === 0 || !hasActiveHost || room.hostId === socketId;

    if (isHost) {
      room.hostId = socketId;
    }

    const participant: Participant = {
      id: socketId,
      name: participantName,
      avatar: participantAvatar,
      joinedAt: Date.now(),
      isHost,
    };

    if (existingIndex >= 0) {
      room.participants[existingIndex] = participant;
    } else {
      room.participants.push(participant);
    }

    return { room, participant, isNew };
  }

  /**
   * Handles explicit participant departure from a room.
   * Promotes the next participant if the host departs.
   * Schedules a 60-second cleanup timer if the room becomes empty.
   */
  leave(
    roomId: string,
    socketId: string
  ): { room?: RoomState; leftParticipant?: Participant; newHostId?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return {};
    }

    const leftParticipant = room.participants.find((p) => p.id === socketId);
    room.participants = room.participants.filter((p) => p.id !== socketId);

    let newHostId: string | undefined;
    if (room.hostId === socketId && room.participants.length > 0) {
      room.hostId = room.participants[0].id;
      room.participants[0].isHost = true;
      newHostId = room.hostId;
    }

    if (room.participants.length === 0) {
      room.hostId = '';
      this.scheduleCleanup(roomId);
    }

    return { room, leftParticipant, newHostId };
  }

  /**
   * Handles abrupt socket disconnection across all active rooms.
   * Fixes the previous memory leak by scheduling room cleanup whenever a room becomes empty.
   */
  handleDisconnect(socketId: string): DisconnectResult[] {
    const affected: DisconnectResult[] = [];

    this.rooms.forEach((room, roomId) => {
      const participantIndex = room.participants.findIndex((p) => p.id === socketId);
      if (participantIndex !== -1) {
        const leftParticipant = room.participants[participantIndex];
        room.participants.splice(participantIndex, 1);

        let newHostId: string | undefined;
        if (room.hostId === socketId && room.participants.length > 0) {
          room.hostId = room.participants[0].id;
          room.participants[0].isHost = true;
          newHostId = room.hostId;
        }

        const isNowEmpty = room.participants.length === 0;
        if (isNowEmpty) {
          room.hostId = '';
          // FIX: Schedule garbage collection timer on disconnect as well
          this.scheduleCleanup(roomId);
        }

        affected.push({
          roomId,
          room,
          leftParticipant,
          newHostId,
          isNowEmpty,
        });
      }
    });

    return affected;
  }

  /**
   * Updates display name and avatar for a participant in a room.
   */
  updateProfile(
    roomId: string,
    socketId: string,
    username: string,
    avatar: string
  ): { participant: Participant; oldName: string } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.find((p) => p.id === socketId);
    if (!participant) return null;

    const oldName = participant.name;
    const cleanName =
      typeof username === 'string' && username.trim().length > 0
        ? username.trim().slice(0, 24)
        : participant.name;
    participant.name = cleanName;
    if (typeof avatar === 'string' && avatar.trim().length > 0) {
      participant.avatar = avatar;
    }

    return { participant, oldName };
  }

  /**
   * Schedules a delayed cleanup (default 60s) to delete an empty room.
   */
  scheduleCleanup(roomId: string, delayMs = 60000): void {
    this.cancelCleanup(roomId);

    const timer = setTimeout(() => {
      const current = this.rooms.get(roomId);
      if (current && current.participants.length === 0) {
        this.rooms.delete(roomId);
        this.cleanupTimers.delete(roomId);
        console.log(`[PoySic Room] Cleaned up empty room ${roomId} after ${delayMs}ms grace period.`);
      }
    }, delayMs);

    this.cleanupTimers.set(roomId, timer);
  }

  /**
   * Cancels any pending cleanup timer for a room (e.g. if a user rejoins before grace expiry).
   */
  cancelCleanup(roomId: string): void {
    const existing = this.cleanupTimers.get(roomId);
    if (existing) {
      clearTimeout(existing);
      this.cleanupTimers.delete(roomId);
    }
  }

  /**
   * Clears all rooms and timers (used for clean testing or server shutdown).
   */
  clear(): void {
    this.cleanupTimers.forEach((timer) => clearTimeout(timer));
    this.cleanupTimers.clear();
    this.rooms.clear();
  }
}
