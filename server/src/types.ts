/**
 * server/src/types.ts
 * Shared data models, Socket.IO payload schemas, and HTTP response interfaces
 * for the PoySic real-time synchronized music backend.
 */

export interface Track {
  id: string;
  name: string;
  artist_name: string;
  album_name: string;
  duration: number; // duration in seconds
  image: string;
  audio: string;
  license_ccurl?: string;
  genre?: string;
  source?: 'jamendo' | 'audius';
}

export interface Participant {
  id: string;        // socket.id
  name: string;      // User display name
  avatar: string;    // Emoji avatar
  joinedAt: number;  // Epoch timestamp ms
  isHost?: boolean;  // True if user has host privileges
}

export interface RoomState {
  roomId: string;
  hostId: string;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;       // Current playback progress in seconds
  lastUpdated: number;    // Server epoch timestamp ms
  queue: Track[];         // Upcoming tracks in queue
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

export interface SyncStats {
  offset: number;     // ms clock offset (server - client)
  latency: number;    // ms one-way latency (RTT / 2)
  drift: number;      // drift in seconds
  lastSyncTime: number;
  status: 'synced' | 'adjusting' | 'desynced' | 'connecting';
}

// Socket.IO Inbound Payload Contracts (Client -> Server)
export interface JoinRoomPayload {
  roomId: string;
  username?: string;
  avatar?: string;
}

export interface PlayPayload {
  roomId: string;
  position: number;
  timestamp?: number;
}

export interface PausePayload {
  roomId: string;
  position: number;
}

export interface SeekPayload {
  roomId: string;
  position: number;
  timestamp?: number;
}

export interface TrackChangePayload {
  roomId: string;
  track: Track;
}

export interface QueueAddPayload {
  roomId: string;
  track: Track;
}

export interface QueueRemovePayload {
  roomId: string;
  trackId: string;
}

export interface QueueClearPayload {
  roomId: string;
}

export interface ReactionPayload {
  roomId: string;
  emoji: string;
  senderName?: string;
}

export interface ChatPayload {
  roomId: string;
  text: string;
  senderName?: string;
  senderAvatar?: string;
}

export interface UpdateProfilePayload {
  roomId: string;
  username: string;
  avatar: string;
}

// Socket.IO Outbound Payload Contracts (Server -> Client)
export interface RoomSyncStatePayload extends RoomState {
  currentServerTime: number;
}

export interface UserJoinedPayload {
  participant: Participant;
  participants: Participant[];
  message: string;
}

export interface UserLeftPayload {
  userId: string;
  userName?: string;
  participants: Participant[];
}

export interface UserUpdatedPayload {
  participant: Participant;
  participants: Participant[];
  oldName: string;
  message: string;
}

export interface PlayBroadcastPayload {
  position: number;
  timestamp: number;
  track: Track | null;
}

export interface PauseBroadcastPayload {
  position: number;
  timestamp: number;
}

export interface SeekBroadcastPayload {
  position: number;
  timestamp: number;
  isPlaying: boolean;
}

export interface TrackChangeBroadcastPayload {
  track: Track;
  position: number;
  timestamp: number;
  isPlaying: boolean;
}

export interface QueueUpdatedBroadcastPayload {
  queue: Track[];
}

export interface ReactionBroadcastPayload {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface HeartbeatPayload {
  isPlaying: boolean;
  position: number;
  timestamp: number;
  currentTrack: Track | null;
}

// HTTP REST Response Contracts
export interface HealthResponse {
  status: string;
  service: string;
  time: number;
  activeRooms: number;
}

export interface TracksResponse {
  results: Track[];
}

export interface RoomResponse {
  room?: RoomState;
  error?: string;
}
