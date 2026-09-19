/**
 * client/src/types/socket.ts
 * Tujuan: Definisi jenis acara (events) dan payload Socket.IO antara klien dan pelayan PoySic.
 */
import { Track } from './track';
import { Participant, RoomState, ChatMessage, ReactionEvent } from './room';

export interface ServerToClientEvents {
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'room:sync_state': (state: RoomState & { currentServerTime?: number }) => void;
  'room:play': (data: { position: number; timestamp: number; track?: Track }) => void;
  'room:pause': (data: { position: number }) => void;
  'room:seek': (data: { position: number; timestamp: number }) => void;
  'room:track_change': (data: { track: Track; position: number; timestamp?: number }) => void;
  'room:queue_updated': (data: { queue: Track[] }) => void;
  'room:user_joined': (data: { participant: Participant; participants: Participant[]; message?: string }) => void;
  'room:user_left': (data: { userId?: string; userName?: string; participants: Participant[] }) => void;
  'room:user_updated': (data: { participant: Participant; participants: Participant[]; oldName?: string; message?: string }) => void;
  'room:reaction': (reaction: ReactionEvent) => void;
  'room:chat': (message: ChatMessage) => void;
  'sync:heartbeat': (data: { isPlaying: boolean; position: number; timestamp: number; currentTrack?: Track }) => void;
}

export interface ClientToServerEvents {
  'clock:ping': (t0: number, callback: (serverTime: number) => void) => void;
  'tracks:search': (query: string, callback: (tracks: Track[]) => void) => void;
  'room:join': (data: { roomId: string; username: string; avatar: string }) => void;
  'room:leave': (roomId: string) => void;
  'host:play': (data: { roomId: string; position: number; timestamp?: number }) => void;
  'host:pause': (data: { roomId: string; position: number }) => void;
  'host:seek': (data: { roomId: string; position: number; timestamp?: number }) => void;
  'host:track_change': (data: { roomId: string; track: Track }) => void;
  'host:queue_add': (data: { roomId: string; track: Track }) => void;
  'host:queue_remove': (data: { roomId: string; trackId: string }) => void;
  'host:queue_clear': (data: { roomId: string }) => void;
  'room:reaction': (data: { roomId: string; emoji: string; senderName: string }) => void;
  'room:chat': (data: { roomId: string; text: string; senderName: string; senderAvatar: string }) => void;
  'user:update_profile': (data: { roomId: string; username: string; avatar: string }) => void;
}
