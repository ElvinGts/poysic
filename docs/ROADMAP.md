# PoySic — Development Roadmap & Milestone Tracker

> **Vision:** *"Dengar sama-sama, tak kira jauh"* (Listen together, no matter the distance)  
> **Philosophy:** *"Siap, ringkas, jujur, fokus. Jangan over-engineer."*  
> **Pledge:** 100% Zero Advertisements, Zero Surveillance Tracking, Privacy-First.

---

## Roadmap Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Phase 1: MVP & Core Engine           │ Phase 2: Polish & Resilience       │ Phase 3: Community & Scale         │
│ Status: [COMPLETED / VERIFIED]       │ Status: [PLANNED / NEXT]           │ Status: [FUTURE VISION]            │
│ • Modular Client/Server separation   │ • Audio Volume Normalization       │ • Multi-platform Community Tips    │
│ • Cristian's Clock Sync (8s loop)    │ • Adaptive Jitter Smoothing        │ • Password-Protected Private Rooms │
│ • SyncedAudio 450ms drift correction │ • Synced Lyrics Display (LRC)      │ • Full PWA (iOS/Android)           │
│ • Jamendo CC API & Fallback Catalog  │ • Dual-Host Shared DJ Mode         │ • WebRTC Audio Mesh Broadcast      │
│ • In-Memory Rooms with 60s Grace GC  │ • 3D Particle Audio Visualizer     │ • Self-Hosting Community Guides    │
│ • Chat, Reactions & Presence Roster  │ • IndexedDB Audio Cache            │ • Zero-Ads Community Transparency  │
└──────────────────────────────────────┴────────────────────────────────────┴────────────────────────────────────┘
```

---

## Phase 1: MVP & Core Synchronization (Status: 100% COMPLETED)

All milestone deliverables for Phase 1 are fully implemented and verified in the repository:

- [x] **Modular Architecture:** Complete separation of `client/` (React 18 + Vite) and `server/` (Node.js + Express + Socket.IO) with independent `package.json`, `tsconfig.json`, and isolated compilation scripts.
- [x] **Cristian's Clock Sync Engine:** Implementation of Cristian's algorithm in `server/src/clockSync.ts` and `client/src/lib/sync.ts` with initial burst samples (0s, 1s, 3s) and periodic 8-second sync cycles.
- [x] **Audio Drift Correction Engine:** `SyncedAudio` HTML5 Audio wrapper in `client/src/lib/audio.ts` compensating for network delay and executing hard seeks whenever drift exceeds the 450ms (`0.45s`) threshold.
- [x] **Creative Commons Music Integration:** Native HTTPS Jamendo API v3.0 proxy in `server/src/jamendo.ts` with automatic fallback to high-quality Creative Commons tracks.
- [x] **Full Synchronized Playback Deck:** Play, pause, seek, track change, volume, and mute controls synchronized across all connected room participants in real time.
- [x] **Room State & Lifecycle Management:** In-memory `RoomManager` in `server/src/rooms.ts` supporting host migration upon disconnect and a 60-second empty-room cleanup grace timer to prevent memory leaks.
- [x] **Queue Management & Auto-Advancement:** Server-side queue in `server/src/queue.ts` with deduplication, drag-and-drop / manual reorder support, and automated advancement to the next song when current track ends.
- [x] **Social Interactivity:** Live floating emoji reaction burst engine, in-room real-time chat with system announcements, and participant roster highlighting host status.
- [x] **Zero-Ads & Community Support Modal:** Clean UI with zero commercial advertising, zero tracking scripts, and a voluntary Saweria donation modal.

---

## Phase 2: Audio Polish, UX & Resilience (Status: PLANNED)

Targeted enhancements to improve audio fidelity, user experience, and network resilience:

### 1. Audio Polish & Perceptual Quality
- [ ] **Audio Volume Normalization:** Implement `DynamicsCompressorNode` via Web Audio API in `client/src/lib/audio.ts` to normalize track volumes and prevent sudden loudness disparities between songs.
- [ ] **Adaptive Jitter Filtering:** Maintain a sliding window of recent RTT samples (e.g., last 10 pings) to filter out transient network spikes using median statistical estimation.
- [ ] **Sub-Perceptual Micro-Pitches:** Investigate gentle audio playback rate modulation ($\pm 2\%$) for drifts between $100\text{ms}$ and $450\text{ms}$ to eliminate audible hard-seek clicks.

### 2. Richer Interactivity & UX
- [ ] **Synced Lyrics Display:** Integrate an LRC format parser with auto-scrolling, karaoke-style highlighted lyrics synchronized to server playback timestamps.
- [ ] **Dual-Host Mode (Partner DJ):** Allow the room host to designate a second participant with co-host permissions to play, pause, seek, and manage the queue.
- [ ] **3D Particle Audio Visualizer:** Expand `components/player/AudioVisualizer.tsx` with WebGL or layered Canvas 2D particle fields that react to low/mid/high frequency bands.
- [ ] **Custom Color Themes:** User-selectable themes stored in `localStorage` (Midnight Blue, Emerald Twilight, Sunset Glow, Classic Cyberpunk, Warm Monochrome).

### 3. Bandwidth & Offline Resilience
- [ ] **Client-Side Audio Caching (IndexedDB):** Cache downloaded MP3 blobs in browser IndexedDB to eliminate duplicate network bandwidth consumption when tracks repeat.
- [ ] **Mobile Touch Polish:** Optimize scrubber gestures and bottom sheets for seamless one-thumb operation on mobile Safari and Chrome.

---

## Phase 3: Community Sustainability & Scale (Status: FUTURE)

Long-term goals focusing on privacy preservation, decentralized deployment, and open-source sustainability:

### 1. Privacy & Room Security
- [ ] **Password-Protected Private Rooms:** Optional PIN or passphrase verification for intimate family and couple listening rooms.
- [ ] **End-to-End Ephemeral Chat:** Add optional client-side cryptographic hashing for in-room chat messages so room chatter is unreadable by intermediary proxy servers.
- [ ] **Zero-Logs Transparency Reports:** Publish automated audit attestations verifying that server memory is cleared on room closure without disk journaling.

### 2. Monetization & Community Infrastructure
- [ ] **Multi-Gateway Community Donations:** Expand donation options to include Ko-fi, Stripe Coffee Tips, and GitHub Sponsors alongside Saweria.
- [ ] **Transparent Server Cost Dashboard:** Provide a public `/api/stats` endpoint detailing live active room counts, bandwidth consumption, and server operating costs.
- [ ] **Community Self-Hosting Kit:** Provide one-click deployment templates (Docker Compose, Fly.io, Railway, Hugging Face Spaces, Render) for users desiring their own dedicated instances.

### 3. Platform Expansion
- [ ] **Progressive Web App (PWA):** Add Web App Manifest and Service Worker with `MediaSession API` integration for native lock screen audio controls on iOS and Android.
- [ ] **WebRTC Audio Peer Mesh:** Explore WebRTC DataChannels for ultra-low latency peer-to-peer audio state broadcasting in rooms with large participant counts.
