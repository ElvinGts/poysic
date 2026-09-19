/**
 * client/src/types/room.ts
 * Tujuan: Definisi jenis data bilik, peserta, sembang, dan reaksi bilik PoySic.
 */
import { Track } from './track';

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  joinedAt: number;
  isHost?: boolean;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number; // masa terkini lagu dalam saat
  lastUpdated: number; // epoch timestamp pelayan (ms)
  queue: Track[];
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ReactionEvent {
  id: string;
  senderName: string;
  emoji: string;
  timestamp: number;
}
