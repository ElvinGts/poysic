# PoySic — Comprehensive API & Event Specification (`API.md`)

This document defines the complete interface contract for the PoySic real-time synchronized music backend, including HTTP REST endpoints, inbound and outbound Socket.IO real-time events, JSON schemas, payload examples, and error handling mechanisms.

---

## 1. Common Data Models

All models conform to `server/src/types.ts` and `client/src/types/`.

### 1.1 `Track`
Represents an individual audio track streamed via Creative Commons.
```json
{
  "id": "jamendo-1",
  "name": "Midnight Breeze (Lo-Fi Chill)",
  "artist_name": "Chillpeach",
  "album_name": "Starlit Haven",
  "duration": 185,
  "image": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
  "audio": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  "genre": "Lo-Fi",
  "license_ccurl": "https://creativecommons.org/licenses/by/3.0/"
}
```

### 1.2 `Participant`
Represents a connected listener in an active room.
```json
{
  "id": "s_9Xk2LpQw81Az",
  "name": "Aisyah",
  "avatar": "🎧",
  "joinedAt": 1726700000000,
  "isHost": true
}
```

### 1.3 `RoomState`
Represents the comprehensive runtime state of an active room.
```json
{
  "roomId": "bilik-santai",
  "hostId": "s_9Xk2LpQw81Az",
  "currentTrack": {
    "id": "jamendo-1",
    "name": "Midnight Breeze (Lo-Fi Chill)",
    "artist_name": "Chillpeach",
    "album_name": "Starlit Haven",
    "duration": 185,
    "image": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
    "audio": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
  },
  "isPlaying": true,
  "position": 42.5,
  "lastUpdated": 1726700042500,
  "queue": [],
  "participants": [
    {
      "id": "s_9Xk2LpQw81Az",
      "name": "Aisyah",
      "avatar": "🎧",
      "joinedAt": 1726700000000,
      "isHost": true
    }
  ]
}
```

---

## 2. HTTP REST Endpoints

Base URL: `http://localhost:3000` (or reverse proxy origin).

### 2.1 Health Check & Server Telemetry
- **Route:** `GET /api/health`
- **Description:** Verifies service health, active room count, and current server epoch timestamp.
- **Success Status:** `200 OK`
- **Response Payload:**
```json
{
  "status": "ok",
  "service": "PoySic MVP Sync Server",
  "time": 1726700042500,
  "activeRooms": 3
}
```

### 2.2 Search Jamendo Creative Commons Music
- **Route:** `GET /api/tracks/search`
- **Query Parameters:**
  - `q` *(optional string)*: Search keyword (e.g., `lo-fi`, `jazz`, `acoustic`).
- **Description:** Proxies queries to Jamendo API v3.0. If `q` is omitted or Jamendo is unreachable, returns curated fallback tracks.
- **Success Status:** `200 OK`
- **Example Request:** `GET /api/tracks/search?q=chill`
- **Response Payload:**
```json
{
  "results": [
    {
      "id": "jamendo-1",
      "name": "Midnight Breeze (Lo-Fi Chill)",
      "artist_name": "Chillpeach",
      "album_name": "Starlit Haven",
      "duration": 185,
      "image": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
      "audio": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
      "genre": "Lo-Fi",
      "license_ccurl": "https://creativecommons.org/licenses/by/3.0/"
    }
  ]
}
```

### 2.3 Curated Tracks Catalog
- **Route:** `GET /api/tracks/curated`
- **Description:** Returns the bundled high-fidelity Creative Commons track catalog.
- **Success Status:** `200 OK`
- **Response Payload:** Same schema as `/api/tracks/search`.

### 2.4 Room State Inspection
- **Route:** `GET /api/rooms/:id`
- **URL Parameters:**
  - `id` *(required string)*: Unique room identifier.
- **Description:** Retrieves the in-memory state of an active room.
- **Security:** Rejects malicious parameter names (`__proto__`, `constructor`, `prototype`) with `404 Not Found`.
- **Success Status:** `200 OK`
- **Success Response:**
```json
{
  "room": {
    "roomId": "bilik-santai",
    "hostId": "s_9Xk2LpQw81Az",
    "currentTrack": { ... },
    "isPlaying": true,
    "position": 42.5,
    "lastUpdated": 1726700042500,
    "queue": [],
    "participants": [ ... ]
  }
}
```
- **Error Status:** `404 Not Found`
- **Error Response:**
```json
{
  "error": "Room not found"
}
```

---

## 3. Inbound Socket.IO Events (Client $\rightarrow$ Server)

The server listens for 15 inbound events:

| # | Event Name | Payload Type | Description |
|---|---|---|---|
| 1 | `clock:ping` | `(clientTime: number, callback)` | Cristian's algorithm latency measurement ping. Callback delivers `serverTime`. |
| 2 | `tracks:search` | `(query: string, callback)` | Direct WebSocket track search querying Jamendo. |
| 3 | `room:join` | `JoinRoomPayload` | Enters a room, adds participant, and returns full state. |
| 4 | `room:leave` | `string \| { roomId: string }` | Exits a room, triggers host migration if host departs. |
| 5 | `host:play` | `PlayPayload` | Requests room playback resume at given position. |
| 6 | `host:pause` | `PausePayload` | Requests room playback pause at given position. |
| 7 | `host:seek` | `SeekPayload` | Requests audio seek to specific timestamp in seconds. |
| 8 | `host:track_change` | `TrackChangePayload` | Switches current track and resets position to 0. |
| 9 | `host:queue_add` | `QueueAddPayload` | Appends a track to the room queue (deduplicated). |
| 10 | `host:queue_remove` | `QueueRemovePayload` | Removes a specific track ID from the queue. |
| 11 | `host:queue_clear` | `QueueClearPayload` | Purges all tracks from the room queue. |
| 12 | `room:reaction` | `ReactionPayload` | Broadcasts an animated floating emoji reaction. |
| 13 | `room:chat` | `ChatPayload` | Sends an in-room text message to all listeners. |
| 14 | `user:update_profile`| `UpdateProfilePayload` | Updates listener display name and emoji avatar. |
| 15 | `disconnect` | *Native socket event* | Fired when connection drops; triggers room cleanup if empty. |

### Inbound Event Payload Examples

#### `clock:ping`
```typescript
socket.emit('clock:ping', Date.now(), (serverTime: number) => {
  // serverTime: 1726700042500
});
```

#### `room:join`
```json
{
  "roomId": "cinta-lofi",
  "username": "Hafiz",
  "avatar": "🎧"
}
```

#### `host:play`
```json
{
  "roomId": "cinta-lofi",
  "position": 14.5
}
```

#### `host:seek`
```json
{
  "roomId": "cinta-lofi",
  "position": 62.0
}
```

#### `host:track_change`
```json
{
  "roomId": "cinta-lofi",
  "track": {
    "id": "jamendo-2",
    "name": "Acoustic Morning Glow",
    "artist_name": "Benjamin Tissot",
    "album_name": "Coffee & Sun",
    "duration": 142,
    "image": "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&auto=format&fit=crop&q=80",
    "audio": "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=acoustic-guitars-ambient-10656.mp3"
  }
}
```

#### `room:reaction`
```json
{
  "roomId": "cinta-lofi",
  "emoji": "💖",
  "senderName": "Aisyah"
}
```

#### `room:chat`
```json
{
  "roomId": "cinta-lofi",
  "text": "Lagu ni sedap sangat!",
  "senderName": "Aisyah",
  "senderAvatar": "🌸"
}
```

---

## 4. Outbound Socket.IO Broadcast Events (Server $\rightarrow$ Client)

The server emits the following real-time events to connected clients:

### 4.1 `room:sync_state`
- **Target:** Emitted exclusively to the newly joining socket.
- **Payload:** Complete `RoomState` supplemented with `currentServerTime`.
```json
{
  "roomId": "cinta-lofi",
  "hostId": "s_host123",
  "currentTrack": { ... },
  "isPlaying": true,
  "position": 28.4,
  "lastUpdated": 1726700028400,
  "queue": [ ... ],
  "participants": [ ... ],
  "currentServerTime": 1726700028450
}
```

### 4.2 `room:user_joined`
- **Target:** Broadcast to all sockets in the room (`io.to(roomId)`).
- **Payload:**
```json
{
  "participant": {
    "id": "s_new456",
    "name": "Hafiz",
    "avatar": "🎧",
    "joinedAt": 1726700030000,
    "isHost": false
  },
  "participants": [ ... ],
  "message": "Hafiz telah menyertai bilik."
}
```

### 4.3 `room:user_left`
- **Target:** Broadcast to remaining room members when a user departs or disconnects.
- **Payload:**
```json
{
  "userId": "s_new456",
  "userName": "Hafiz",
  "participants": [ ... ]
}
```

### 4.4 `room:user_updated`
- **Target:** Broadcast to room when a participant changes name or avatar.
- **Payload:**
```json
{
  "participant": {
    "id": "s_host123",
    "name": "Aisyah Cantik",
    "avatar": "✨",
    "joinedAt": 1726700000000,
    "isHost": true
  },
  "participants": [ ... ],
  "oldName": "Aisyah",
  "message": "Aisyah telah menukar nama kepada Aisyah Cantik."
}
```

### 4.5 `room:play`
- **Target:** Broadcast to room when host starts playback.
- **Payload:**
```json
{
  "position": 14.5,
  "timestamp": 1726700014500,
  "track": { ... }
}
```

### 4.6 `room:pause`
- **Target:** Broadcast to room when host pauses playback.
- **Payload:**
```json
{
  "position": 14.5,
  "timestamp": 1726700014500
}
```

### 4.7 `room:seek`
- **Target:** Broadcast to room when host scrubs progress bar.
- **Payload:**
```json
{
  "position": 62.0,
  "timestamp": 1726700062000,
  "isPlaying": true
}
```

### 4.8 `room:track_change`
- **Target:** Broadcast to room on track switch or auto-advance.
- **Payload:**
```json
{
  "track": { ... },
  "position": 0,
  "timestamp": 1726700100000,
  "isPlaying": true
}
```

### 4.9 `room:queue_updated`
- **Target:** Broadcast to room when tracks are added, removed, or cleared.
- **Payload:**
```json
{
  "queue": [
    {
      "id": "jamendo-3",
      "name": "Subtle Tokyo Rain",
      "artist_name": "Kudasai Moments",
      "album_name": "Rainy Cafe Dreams",
      "duration": 210,
      "image": "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
      "audio": "https://cdn.pixabay.com/download/audio/2022/11/06/audio_03d63b27b4.mp3?filename=chill-abstract-intention-12099.mp3"
    }
  ]
}
```

### 4.10 `room:reaction`
- **Target:** Broadcast to room to trigger floating emoji animation.
- **Payload:**
```json
{
  "id": "rx_m1k3",
  "emoji": "💖",
  "senderName": "Aisyah",
  "timestamp": 1726700045000
}
```

### 4.11 `room:chat`
- **Target:** Broadcast to room for text chat feed.
- **Payload:**
```json
{
  "id": "ch_7v9p",
  "senderId": "s_host123",
  "senderName": "Aisyah",
  "senderAvatar": "🌸",
  "text": "Lagu ni sedap sangat!",
  "timestamp": 1726700046000
}
```

### 4.12 `sync:heartbeat`
- **Target:** Broadcast every 5000ms to all active rooms for drift correction.
- **Payload:**
```json
{
  "isPlaying": true,
  "position": 35.0,
  "timestamp": 1726700035000,
  "currentTrack": { ... }
}
```

---

## 5. Error Handling, Validation & Sanitization

1. **Defensive Validation:**
   - All inbound payloads are checked with runtime type guards (`isObject`, `isNonEmptyString`).
   - Malformed payloads (e.g., non-object data, missing `roomId`) are silently discarded without throwing exceptions or crashing the Socket.IO listener.
2. **Position Sanitization (`sanitizePosition`):**
   - Inputs for `position` are coerced to positive finite numbers $\ge 0$.
   - Positions exceeding `track.duration` are clamped to avoid negative or out-of-bounds seeks.
3. **String Bounding & XSS Prevention:**
   - Chat messages are truncated at 300 characters.
   - User display names are truncated at 24 characters.
   - HTML markup is rendered safely by React's standard JSX escaping mechanisms.
