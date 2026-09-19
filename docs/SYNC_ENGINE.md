# PoySic — Real-Time Synchronization Engine (`SYNC_ENGINE.md`)

The PoySic Synchronization Engine guarantees that all participants in a listening room hear the same audio track at the exact same millisecond position, regardless of physical location, device hardware, or network conditions.

---

## 1. The Challenges of Synchronized Web Audio

Synchronizing media playback across distributed browser clients introduces three distinct challenges:

1. **Clock Skew:** Every user device has an independent local hardware quartz clock. Over time, local clocks diverge from server time by tens to hundreds of milliseconds.
2. **Network Latency & Jitter:** Network packets traversing the internet experience variable round-trip delays ($RTT$). A packet sent by the host telling everyone to "play at position $10.0\text{s}$" will arrive at listeners at differing arrival times.
3. **Browser Audio Throttling:** When a browser tab is placed in the background or minimized, operating systems throttle timer loops (`setInterval`, `requestAnimationFrame`), causing audio decoding pipelines to lag behind real time.

PoySic solves these challenges through a two-stage synchronization architecture:
- **Stage 1 (Time Plane):** Cristian's Clock Synchronization Algorithm to establish a unified reference clock.
- **Stage 2 (Audio Plane):** Network Delay Compensation and a $0.45\text{s}$ (450ms) Drift Correction Threshold.

---

## 2. Cristian's Clock Synchronization Algorithm

Cristian's algorithm is a probabilistic method for client-server clock synchronization. It assumes that network transmission delays in both directions are roughly symmetric:

$$\text{Time}_{\text{req}} \approx \text{Time}_{\text{res}} \approx \frac{RTT}{2}$$

### 2.1 Mathematical Formulation

```
Client (t0) ───[ clock:ping ]───────────────► Server
                                                │
                                                ▼ Record: serverTime
Server      ◄──[ callback(serverTime) ]──────── Client (t1)
```

1. **Client Ping Timestamp ($t_0$):** The client captures its local epoch timestamp when emitting `clock:ping`:
   $$t_0 = \text{Date.now()}_{\text{client}}$$

2. **Server Arrival & Processing ($t_{\text{server}}$):** The server immediately evaluates its local timestamp and returns it via callback:
   $$t_{\text{server}} = \text{Date.now()}_{\text{server}}$$

3. **Client Pong Timestamp ($t_1$):** The client receives the callback at local time $t_1$:
   $$t_1 = \text{Date.now()}_{\text{client}}$$

4. **Round-Trip Time ($RTT$):** The total elapsed round-trip duration is:
   $$RTT = t_1 - t_0$$

5. **Estimated One-Way Latency:** Assuming symmetric transmission:
   $$\text{Latency} = \frac{RTT}{2}$$

6. **Clock Offset ($\Delta t$):** The estimated server time at the moment the client receives the response ($t_1$) is $t_{\text{server}} + \text{Latency}$. Therefore, the clock offset between server and client is:
   $$\text{Offset} = (t_{\text{server}} + \text{Latency}) - t_1 = t_{\text{server}} - (t_1 - \text{Latency})$$

7. **Synchronized Server Time Estimation ($T_{\text{server}}$):** At any subsequent point in time, the client computes the true server time using its local clock:
   $$T_{\text{server}}(t_{\text{local}}) = t_{\text{local}} + \text{Offset}$$

### 2.2 Sampling Strategy: Rapid Bursts & Periodic Maintenance

A single network packet can suffer from transient routing spikes. To achieve immediate accuracy upon joining a room without waiting minutes for convergence:
- **Initial Burst Cycle:** The client fires three rapid synchronization pings:
  - Ping 1: At $t = 0\text{s}$ (instant upon socket connection).
  - Ping 2: At $t = 1\text{s}$ (1,000ms delay).
  - Ping 3: At $t = 3\text{s}$ (3,000ms delay).
- **Periodic Maintenance Loop:** Following the initial bursts, the client executes a periodic ping every **$8000\text{ms}$ ($8\text{s}$)** to continuously adjust for ambient temperature fluctuations and local hardware quartz drift.

---

## 3. Audio Drift Correction Engine (`SyncedAudio`)

Once client and server share an accurate time plane, playback alignment is governed by `SyncedAudio`.

### 3.1 Network Delay Compensation

When the server broadcasts a playback state update (via `room:play`, `room:seek`, or periodic `sync:heartbeat`), the payload contains:
- `position`: The track playback position in seconds recorded at `timestamp`.
- `timestamp`: The server epoch timestamp (ms) when `position` was valid.

Upon receiving the payload, the client calculates the transit elapsed time:

$$\Delta t_{\text{network}} = \max\left(0, \frac{T_{\text{server}}(\text{now}) - \text{timestamp}}{1000}\right)$$

The expected audio position at the current instant is:

$$\text{expectedPosition} = \text{position} + \Delta t_{\text{network}}$$

The client measures its current local audio playback progress:

$$\text{currentPosition} = \text{audioElement.currentTime}$$

The drift magnitude is calculated as:

$$\text{Drift} = \left| \text{currentPosition} - \text{expectedPosition} \right|$$

### 3.2 The 450ms ($0.45\text{s}$ / $\sim 500\text{ms}$) Threshold

$$\begin{cases}
\text{Smooth Playback (No Action)}, & \text{if } \text{Drift} \le 0.45\text{s} \\
\text{Hard Seek to } \text{expectedPosition}, & \text{if } \text{Drift} > 0.45\text{s}
\end{cases}$$

#### Why 450ms?
1. **Psychoacoustic Comfort:** Minor micro-drifts under 300–400ms are barely noticeable across headphones or room speakers and are frequently caused by normal HTML5 audio buffer jitter. Hard seeking on tiny differences causes annoying audio stutter and clicks.
2. **Tab Throttling Recovery:** When a user switches tabs or unlocks a smartphone screen, browser execution pauses, and the local audio clock drifts behind by several seconds. The 450ms threshold immediately detects this condition and snaps the audio back into synchronization.

---

## 4. Server 5-Second Heartbeat & Auto-Advancement

In addition to event-driven broadcasts (`host:play`, `host:pause`, `host:seek`), the server operates a continuous background heartbeat service:

```
[ Every 5000ms Loop ]
1. For each active room in memory:
   a. If room.isPlaying is true:
      - elapsed = (now - room.lastUpdated) / 1000
      - room.position = room.position + elapsed
      - room.lastUpdated = now
      - If room.position >= room.currentTrack.duration:
           * advanceTrack(room)
           * If nextTrack exists: broadcast room:track_change
           * If queue empty: room.isPlaying = false, broadcast room:pause
   b. Broadcast sync:heartbeat(position, timestamp, isPlaying, currentTrack)
```

This guarantees that:
- Clients with temporary network disconnections immediately snap back into sync upon packet reception.
- Long songs progress seamlessly across all participants even if no user touches the controls.
- Playlist queues automatically progress to the next song when the current track finishes.

---

## 5. Complete Algorithmic Pseudocode

### 5.1 Server-Side Sync Handlers (`server/src/clockSync.ts`)

```typescript
// 1. Immediate Clock Ping Response
function handleClockPing(clientTimestamp: number, callback: (serverTime: number) => void): void {
  if (typeof callback === 'function') {
    callback(Date.now());
  }
}

// 2. Periodic 5-Second Heartbeat Loop
function startHeartbeatService(io: Server, rooms: Map<string, RoomState>, intervalMs = 5000): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (room.isPlaying) {
        const elapsed = Math.max(0, (now - room.lastUpdated) / 1000);
        room.position = sanitizePosition(room.position) + elapsed;
        room.lastUpdated = now;

        // Auto-advance when track reaches completion
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

      // Broadcast periodic telemetry pulse
      io.to(roomId).emit('sync:heartbeat', {
        isPlaying: room.isPlaying,
        position: sanitizePosition(room.position),
        timestamp: room.lastUpdated,
        currentTrack: room.currentTrack,
      });
    }
  }, intervalMs);
}
```

### 5.2 Client-Side Clock Synchronization (`client/src/lib/sync.ts`)

```typescript
class ClockSync {
  private socket: Socket;
  private offset: number = 0;
  private latency: number = 0;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  public startSync(intervalMs = 8000): void {
    // 1. Initial rapid burst samples
    this.pingServer();
    setTimeout(() => this.pingServer(), 1000);
    setTimeout(() => this.pingServer(), 3000);

    // 2. Periodic maintenance loop
    setInterval(() => this.pingServer(), intervalMs);
  }

  public pingServer(): void {
    if (!this.socket.connected) return;

    const t0 = Date.now();
    this.socket.emit('clock:ping', t0, (serverTime: number) => {
      const t1 = Date.now();
      const roundTrip = t1 - t0;
      this.latency = roundTrip / 2;

      // Cristian's offset calculation
      this.offset = serverTime - (t1 - this.latency);
      this.notifyListeners({ offset: this.offset, latency: this.latency, serverTime: this.getServerTime() });
    });
  }

  public getServerTime(): number {
    return Date.now() + this.offset;
  }
}
```

### 5.3 Client-Side Audio Drift Alignment (`client/src/lib/audio.ts`)

```typescript
class SyncedAudio {
  private audioElement: HTMLAudioElement;
  private driftThreshold: number = 0.45; // 450 milliseconds

  public syncWith(serverPosition: number, serverTimestamp: number, currentServerTime: number): number {
    if (!this.audioElement.src) return 0;

    // 1. Compute transit delay
    const networkDelay = Math.max(0, (currentServerTime - serverTimestamp) / 1000);

    // 2. Determine target position
    const expectedPosition = serverPosition + networkDelay;
    const currentPosition = this.audioElement.currentTime;

    // 3. Compute absolute drift
    const drift = Math.abs(currentPosition - expectedPosition);

    // 4. Align if threshold exceeded
    if (drift > this.driftThreshold) {
      this.audioElement.currentTime = expectedPosition;
    }

    return drift;
  }
}
```

---

## 6. Browser Autoplay & AudioContext Unlocking

Modern browsers (Chrome, Safari, Firefox) prohibit audio playback without prior direct user interaction. 

### Implementation Handling:
1. `SyncedAudio.play()` invokes `this.audioElement.play()`.
2. If rejected with `NotAllowedError`:
   - `SyncedAudio` catches the exception without crashing.
   - It fires `onAutoplayBlocked(true)`.
   - The UI presents a prominent "Sambung Audio" (Resume Audio) banner.
3. When the user taps the button, `useSyncedAudio.resumeAudio()` resumes the underlying `AudioContext` and triggers `audioElement.play()`, restoring perfect synchronized playback.
