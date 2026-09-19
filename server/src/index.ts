/**
 * server/src/index.ts
 * Main entry point for the PoySic backend service.
 * Configures Express HTTP server, CORS middleware, Socket.IO real-time engine,
 * Jamendo CC music proxies, and periodic clock-sync heartbeats.
 */

import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import {
  ChatMessage,
  ChatPayload,
  HealthResponse,
  JoinRoomPayload,
  PausePayload,
  PlayPayload,
  QueueAddPayload,
  QueueClearPayload,
  QueueRemovePayload,
  ReactionPayload,
  RoomResponse,
  SeekPayload,
  Track,
  TrackChangePayload,
  TracksResponse,
  UpdateProfilePayload,
} from './types';
import { getCuratedTracks, searchJamendoTracks } from './jamendo';
import { RoomManager } from './rooms';
import { addToQueue, clearQueue, removeFromQueue } from './queue';
import { handleClockPing, sanitizePosition, startHeartbeatService } from './clockSync';

/**
 * Safely extracts and normalizes a search query string from Express req.query.
 * Handles single strings, string arrays (takes first valid entry), and non-string types.
 */
export function sanitizeSearchQuery(queryParam: unknown): string {
  if (typeof queryParam === 'string') {
    return queryParam.trim();
  }
  if (Array.isArray(queryParam) && queryParam.length > 0 && typeof queryParam[0] === 'string') {
    return queryParam[0].trim();
  }
  return '';
}

/**
 * Checks if a value is a non-null, non-array object.
 */
function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates that a value is a non-empty string.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitizes an optional string, returning trimmed string or fallback.
 */
function sanitizeString(value: unknown, fallback = '', maxLength = 300): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : fallback;
}

/**
 * Validates that a candidate object satisfies the minimum Track interface.
 */
function isValidTrack(value: unknown): value is Track {
  if (!isObject(value)) return false;
  const hasId = typeof value.id === 'string' ? value.id.trim().length > 0 : typeof value.id === 'number';
  return (
    hasId &&
    typeof value.name === 'string' &&
    typeof value.duration === 'number' &&
    Number.isFinite(value.duration) &&
    typeof value.audio === 'string'
  );
}

const PORT = parseInt(process.env.PORT || '3000', 10);

export const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for independent client/dev frontends
app.use(cors());
app.use(express.json());

export const server = createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['polling', 'websocket'],
});

export const roomManager = new RoomManager();

// ==========================================
// HTTP REST Routes
// ==========================================

// Health check endpoint with room telemetry
app.get('/api/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'ok',
    service: 'PoySic MVP Sync Server',
    time: Date.now(),
    activeRooms: roomManager.size(),
  });
});

// Search Jamendo Creative Commons music
app.get('/api/tracks/search', async (req: Request, res: Response<TracksResponse>) => {
  try {
    const q = sanitizeSearchQuery(req.query.q);
    if (!q) {
      return res.json({ results: getCuratedTracks() });
    }
    const results = await searchJamendoTracks(q);
    return res.json({ results });
  } catch (err) {
    console.error('[PoySic API] Search error fallback:', err);
    return res.json({ results: getCuratedTracks() });
  }
});

// Retrieve curated offline-ready CC tracks
app.get('/api/tracks/curated', (_req: Request, res: Response<TracksResponse>) => {
  res.json({ results: getCuratedTracks() });
});

// Inspect room state by room ID
app.get('/api/rooms/:id', (req: Request, res: Response<RoomResponse>) => {
  const roomId = req.params.id;
  if (!roomId || typeof roomId !== 'string' || roomId === '__proto__' || roomId === 'constructor' || roomId === 'prototype') {
    return res.status(404).json({ error: 'Room not found' });
  }
  const room = roomManager.get(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  return res.json({ room });
});

// Production client static file fallback (if client/dist exists)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// ==========================================
// Socket.IO Real-time Connection Handling
// ==========================================

io.on('connection', (socket: Socket) => {
  // 1. Clock Synchronization (Cristian's algorithm)
  socket.on('clock:ping', (clientTimestamp: number, callback: (serverTime: number) => void) => {
    handleClockPing(clientTimestamp, callback);
  });

  // 2. Track Search via WebSocket
  socket.on('tracks:search', async (query: unknown, callback: (tracks: Track[]) => void) => {
    try {
      const q = typeof query === 'string' ? query : '';
      const results = await searchJamendoTracks(q);
      if (typeof callback === 'function') {
        callback(results);
      }
    } catch (err) {
      if (typeof callback === 'function') {
        callback(getCuratedTracks());
      }
    }
  });

  // 3. Room Management: Join room
  socket.on('room:join', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId)) return;
    const roomId = payload.roomId.trim();
    const username = typeof payload.username === 'string' ? payload.username : undefined;
    const avatar = typeof payload.avatar === 'string' ? payload.avatar : undefined;

    socket.join(roomId);

    const { room, participant } = roomManager.join(roomId, socket.id, username, avatar);

    // Send initial full room state with server timestamp to joining client
    socket.emit('room:sync_state', {
      ...room,
      currentServerTime: Date.now(),
    });

    // Notify all participants in room of new joiner
    io.to(roomId).emit('room:user_joined', {
      participant,
      participants: room.participants,
      message: `${participant.name} telah menyertai bilik.`,
    });

    console.log(
      `[PoySic Socket] ${participant.name} (${socket.id}) joined room ${roomId}. Total: ${room.participants.length}`
    );
  });

  // 4. Room Management: Leave room
  socket.on('room:leave', (payload: unknown) => {
    const roomId =
      typeof payload === 'string'
        ? payload.trim()
        : isObject(payload) && isNonEmptyString(payload.roomId)
          ? payload.roomId.trim()
          : null;

    if (!roomId) return;

    socket.leave(roomId);
    const { room, leftParticipant } = roomManager.leave(roomId, socket.id);
    if (room) {
      io.to(roomId).emit('room:user_left', {
        userId: socket.id,
        userName: leftParticipant?.name || 'Pengguna',
        participants: room.participants,
      });
      console.log(
        `[PoySic Socket] User ${socket.id} left room ${roomId}. Remaining: ${room.participants.length}`
      );
    }
  });

  // 5. Playback: Play
  socket.on('host:play', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId)) return;
    const roomId = payload.roomId.trim();

    const room = roomManager.get(roomId);
    if (room) {
      room.isPlaying = true;
      room.position = sanitizePosition(payload.position, room.currentTrack?.duration);
      room.lastUpdated = Date.now();

      io.to(roomId).emit('room:play', {
        position: room.position,
        timestamp: room.lastUpdated,
        track: room.currentTrack,
      });
    }
  });

  // 6. Playback: Pause
  socket.on('host:pause', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId)) return;
    const roomId = payload.roomId.trim();

    const room = roomManager.get(roomId);
    if (room) {
      room.isPlaying = false;
      room.position = sanitizePosition(payload.position, room.currentTrack?.duration);
      room.lastUpdated = Date.now();

      io.to(roomId).emit('room:pause', {
        position: room.position,
        timestamp: room.lastUpdated,
      });
    }
  });

  // 7. Playback: Seek
  socket.on('host:seek', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId)) return;
    const roomId = payload.roomId.trim();

    const room = roomManager.get(roomId);
    if (room) {
      room.position = sanitizePosition(payload.position, room.currentTrack?.duration);
      room.lastUpdated = Date.now();

      io.to(roomId).emit('room:seek', {
        position: room.position,
        timestamp: room.lastUpdated,
        isPlaying: room.isPlaying,
      });
    }
  });

  // 8. Track Change
  socket.on('host:track_change', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isValidTrack(payload.track)) return;
    const roomId = payload.roomId.trim();
    const track = payload.track;

    const room = roomManager.get(roomId);
    if (room) {
      room.currentTrack = track;
      room.isPlaying = true;
      room.position = 0;
      room.lastUpdated = Date.now();

      io.to(roomId).emit('room:track_change', {
        track: room.currentTrack,
        position: 0,
        timestamp: room.lastUpdated,
        isPlaying: true,
      });
    }
  });

  // 9. Queue Management: Add track
  socket.on('host:queue_add', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isValidTrack(payload.track)) return;
    const roomId = payload.roomId.trim();
    const track = payload.track;

    const room = roomManager.get(roomId);
    if (room) {
      addToQueue(room, track);
      io.to(roomId).emit('room:queue_updated', { queue: room.queue });
    }
  });

  // 10. Queue Management: Remove track
  socket.on('host:queue_remove', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.trackId)) return;
    const roomId = payload.roomId.trim();
    const trackId = payload.trackId.trim();

    const room = roomManager.get(roomId);
    if (room) {
      removeFromQueue(room, trackId);
      io.to(roomId).emit('room:queue_updated', { queue: room.queue });
    }
  });

  // 11. Queue Management: Clear queue
  socket.on('host:queue_clear', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId)) return;
    const roomId = payload.roomId.trim();

    const room = roomManager.get(roomId);
    if (room) {
      clearQueue(room);
      io.to(roomId).emit('room:queue_updated', { queue: room.queue });
    }
  });

  // 12. Social: Floating Reaction
  socket.on('room:reaction', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.emoji)) return;
    const roomId = payload.roomId.trim();
    const emoji = payload.emoji.trim();
    const senderName = sanitizeString(payload.senderName, 'Rakan', 24);

    io.to(roomId).emit('room:reaction', {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      senderName,
      timestamp: Date.now(),
    });
  });

  // 13. Social: In-Room Chat Message
  socket.on('room:chat', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.text)) return;
    const roomId = payload.roomId.trim();
    const text = payload.text.trim().slice(0, 300);
    const senderName = sanitizeString(payload.senderName, 'Rakan', 24);
    const senderAvatar = sanitizeString(payload.senderAvatar, '🎧', 10);

    const message: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: socket.id,
      senderName,
      senderAvatar,
      text,
      timestamp: Date.now(),
    };
    io.to(roomId).emit('room:chat', message);
  });

  // 14. Profile Update: Username and Avatar
  socket.on('user:update_profile', (payload: unknown) => {
    if (!isObject(payload) || !isNonEmptyString(payload.roomId) || !isNonEmptyString(payload.username)) return;
    const roomId = payload.roomId.trim();
    const username = payload.username.trim().slice(0, 24);
    const avatar = sanitizeString(payload.avatar, '🎧', 10);

    const updated = roomManager.updateProfile(roomId, socket.id, username, avatar);
    if (updated) {
      const room = roomManager.get(roomId);
      if (room) {
        io.to(roomId).emit('room:user_updated', {
          participant: updated.participant,
          participants: room.participants,
          oldName: updated.oldName,
          message: `${updated.oldName} telah menukar nama kepada ${updated.participant.name}.`,
        });
        console.log(
          `[PoySic Socket] ${updated.oldName} (${socket.id}) updated profile to ${updated.participant.name} in room ${roomId}`
        );
      }
    }
  });

  // 15. Socket Disconnect Handling (with garbage collection leak fix)
  socket.on('disconnect', () => {
    const affectedRooms = roomManager.handleDisconnect(socket.id);
    for (const item of affectedRooms) {
      io.to(item.roomId).emit('room:user_left', {
        userId: socket.id,
        userName: item.leftParticipant?.name || 'Pengguna',
        participants: item.room.participants,
      });
      console.log(
        `[PoySic Socket] Client ${socket.id} disconnected from room ${item.roomId}. Remaining: ${item.room.participants.length}`
      );
    }
  });
});

// Periodic heartbeat every 5 seconds for audio drift correction
const heartbeatTimer = startHeartbeatService(io, roomManager.getAll(), 5000);

// Start HTTP & WebSocket listener
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[PoySic Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`[PoySic Server] Received ${signal}. Closing server gracefully...`);
  clearInterval(heartbeatTimer);
  roomManager.clear();
  io.close(() => {
    server.close(() => {
      console.log('[PoySic Server] Server closed.');
      process.exit(0);
    });
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
