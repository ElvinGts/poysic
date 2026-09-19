# AGENTS.md — PoySic Multi-Agent Engineering & Governance Guide

> **Tagline:** *"Dengar sama-sama, tak kira jauh"* (Listen together, no matter how far)  
> **Motto:** *"Siap, ringkas, jujur, fokus. Jangan over-engineer."* (Ready, simple, honest, focused. Do not over-engineer.)

---

## 1. Project Identity & Ethos

**PoySic** is a real-time synchronized music player web application designed for couples, friends, and families to listen together simultaneously across any distance.

### Core Philosophy: Zero-Ads & Privacy-First
- **No KYC / No Tracking:** PoySic does not collect personal identities, email addresses, phone numbers, or passwords. Users join rooms using temporary alias handles and emoji avatars.
- **No Surveillance Analytics:** No third-party tracking scripts, advertising beacons, or telemetry spyware are permitted in the client or server.
- **In-Memory Ephemeral Lifecycles:** Rooms and active participant states exist purely in memory (`Map<string, RoomState>`). When all listeners vacate a room, a 60-second grace timer is initiated, after which the room is permanently purged from memory.
- **Privacy-First Media Proxying:** All track searches and metadata queries run through Creative Commons APIs (Jamendo v3.0) and local fallback catalogs. Media streams are directly accessed without storing listener habits on disk.
- **Voluntary Community Support:** PoySic is 100% free and ad-free. Operational hosting is sustained strictly via community tips and micro-donations (e.g., Saweria).

---

## 2. Multi-Agent Team Architecture & Role Boundaries

To ensure rapid, clean, and conflict-free engineering, development is partitioned across specialized autonomous agent roles:

```
                               ┌─────────────────────────────┐
                               │   Agent D (Orchestrator)    │
                               │  - Dispatch & Gatekeeper    │
                               │  - Git Staging & Commits    │
                               └──────────────┬──────────────┘
                                              │
               ┌──────────────────────────────┼──────────────────────────────┐
               │                              │                              │
┌──────────────▼─────────────┐ ┌──────────────▼─────────────┐ ┌──────────────▼─────────────┐
│  Agent A (Frontend Lead)   │ │   Agent B (Backend Lead)   │ │ Agent C (Docs & Integration)│
│  - Directory: client/      │ │  - Directory: server/      │ │  - Directory: docs/, root  │
│  - React 19, Vite, UI      │ │  - Express, Socket.IO      │ │  - ARCHITECTURE.md, API.md │
│  - SyncedAudio & ClockSync │ │  - Rooms, Queue, Jamendo   │ │  - ROADMAP.md, SYNC_ENGINE │
│  - Hooks & Audio Visualizer│ │  - Cristian Clock Engine   │ │  - AGENTS.md, README.md    │
└────────────────────────────┘ └────────────────────────────┘ └────────────────────────────┘
```

### 2.1 Role Assignments & Write Ownership

| Agent | Role Designation | Ownership Scope | Permitted Operations | Prohibited Operations |
|---|---|---|---|---|
| **Agent A** | Frontend Specialist | `client/` | React components (`components/`), hooks (`hooks/`), audio engine (`lib/audio.ts`, `lib/sync.ts`, `lib/socket.ts`), types (`types/`), Vite config, client tests | Modifying `server/` or editing root technical documentation |
| **Agent B** | Backend Specialist | `server/` | Express app, Socket.IO handlers, room lifecycle (`rooms.ts`), clock synchronization (`clockSync.ts`), queue management (`queue.ts`), Jamendo client (`jamendo.ts`), server tests | Modifying `client/` or editing root technical documentation |
| **Agent C** | Documentation Specialist | `docs/`, `AGENTS.md`, `README.md` | Technical documentation (`ARCHITECTURE.md`, `ROADMAP.md`, `SYNC_ENGINE.md`, `API.md`), root README, AGENTS governance, interface contract audits | Modifying source code in `client/src` or `server/src` |
| **Agent D** | Lead Orchestrator | `.agents/`, root configs, Git | Cross-agent dispatch, dependency sequencing, verification gates, build verification, Git staging and commits | Bypassing pre-commit verification gates |

---

## 3. Code & Architecture Conventions

All agents must adhere strictly to the following implementation standards:

### 3.1 Language & Naming Conventions
- **Source Code Identifiers:** All TypeScript variables, functions, interfaces, types, class names, and file names must be written in clear, descriptive English (e.g., `calculateExpectedPosition`, `handleClockPing`, `RoomState`).
- **User Interface Copy:** UI text, user notifications, and toasts support friendly bilingual presentation (predominantly Bahasa Melayu for localized Malaysian/Indonesian warmth with universal English fallbacks).
- **File Header Comments:** Every source file must begin with a concise block comment stating:
  1. The relative file path.
  2. The module's primary purpose.
  3. Key interfaces and exported functions.

### 3.2 Error Handling & Defensive Programming
- **Zero Crashes:** Network failures, corrupted payloads, missing query parameters, or third-party API downtime must never crash the server or freeze the client UI.
- **Input Sanitization:** All incoming WebSocket payloads and Express query parameters must be validated using type guards (`isObject`, `isNonEmptyString`, `sanitizePosition`, `sanitizeSearchQuery`).
- **Prototype Pollution Prevention:** Room IDs matching `__proto__`, `constructor`, or `prototype` must be rejected with HTTP 404 / socket drop.
- **Safe Fallbacks:** If the Jamendo API fails, times out, or rate limits, the system must seamlessly fall back to `FALLBACK_TRACKS` without interrupting the room session.

### 3.3 Audio Synchronization Guarantees
- **Cristian's Algorithm:** All clients compute round-trip latency ($RTT$) and clock offset against server time ($t_{server}$).
- **Drift Threshold ($0.45\text{s}$ / $450\text{ms}$):**
  - If drift $\le 0.45\text{s}$, the audio is allowed to continue playing smoothly to avoid micro-stutters.
  - If drift $> 0.45\text{s}$, the player performs an immediate hard seek to `expectedPosition`.
- **Autoplay Policy Handling:** The client must gracefully catch `NotAllowedError` and prompt the user to tap "Sambung Audio" to unlock the browser `AudioContext`.

---

## 4. Scope & Phase Boundaries

To prevent scope creep and maintain architectural purity, all agents must operate within explicit phase boundaries:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Phase 1: MVP & Core Synchronization (CURRENT - FULLY IMPLEMENTED)         │
│ - Modular client/server architecture with isolated builds                 │
│ - Cristian's clock sync (bursts at 0/1/3s, periodic at 8s)                │
│ - SyncedAudio HTML5 wrapper with 450ms drift correction threshold         │
│ - Jamendo CC MP3 search & offline-capable fallback catalog                │
│ - Synchronized playback (Play, Pause, Seek, Track Change, Auto-advance)   │
│ - In-memory Room State Manager with 60s empty cleanup grace period        │
│ - Floating emoji reactions, system notifications, in-room chat            │
│ - Saweria donation modal & zero-ads pledge                                │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Audio Polish, UX & Resilience (PLANNED)                          │
│ - Synced lyrics display (LRC parser and synchronized line highlighter)    │
│ - Dual-Host Mode (shared DJ permissions between designated partners)     │
│ - 3D Web Audio API frequency visualizers (WebGL/Canvas particles)         │
│ - Client-side IndexedDB audio caching to eliminate repeated bandwidth     │
│ - Custom UI themes (Midnight Blue, Emerald Twilight, Sunset Glow)         │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ Phase 3: Community & Scale (FUTURE)                                       │
│ - Password-protected private rooms for intimate family/couples sessions   │
│ - Progressive Web App (PWA) installation for iOS and Android              │
│ - Decentralized WebRTC peer mesh fallback for high-bandwidth rooms        │
│ - Multi-provider community tips (Ko-fi, Stripe, Saweria)                  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Pre-Commit Verification Checklist

Before any code is staged, committed, or merged into the main repository, the following gates must pass:

- [ ] **1. Clean Working Tree:** No untracked build artifacts (`client/dist/`, `server/dist/`, `node_modules/`), scratch scripts, or OS clutter (`.DS_Store`, `Thumbs.db`).
- [ ] **2. No Secrets or Environment Leaks:** Verify that `.env` files containing private credentials or keys are excluded by `.gitignore`. Only `.env.example` may be committed.
- [ ] **3. Server Standalone Verification:**
  - `cd server && npm run build` (or `npx tsc --noEmit`) passes with zero errors.
  - `cd server && npm test` passes all room manager, clock sync, and queue integration tests.
- [ ] **4. Client Standalone Verification:**
  - `cd client && npm run build` (or `npx tsc --noEmit`) passes with zero type errors.
  - Client bundle builds cleanly via Vite.
- [ ] **5. Documentation Alignment:**
  - Any API route changes or Socket.IO event modifications must be reflected immediately in `docs/API.md`.
  - Architecture modifications must be reflected in `docs/ARCHITECTURE.md`.
  - Algorithm adjustments must be documented in `docs/SYNC_ENGINE.md`.
- [ ] **6. Git Commit Protocol:** Commits must use Conventional Commits format:
  - `feat(...)`: New user-facing feature
  - `fix(...)`: Bug fix (e.g., memory leak, sync calculation)
  - `docs(...)`: Documentation updates
  - `refactor(...)`: Code restructuring without functional changes
  - `chore(...)`: Tooling, configs, dependencies

---

## 6. Integrity & Forensic Audit Mandate

PoySic adheres to a strict anti-cheating policy:
1. **Real Logic Only:** No dummy mocks, hardcoded test results, fake delay timers, or fabricated attestations.
2. **Deterministic State:** Every component must maintain real state machines and produce verifiable runtime outcomes.
3. **Auditing:** Independent verification routines inspect builds, types, and git histories against these specifications.

---

## 7. Tech Stack & Governance Decisions (STRICT LOCK)

### 7.1 Locked Technology Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons, Socket.IO Client.
- **Backend:** Node.js, Express, Socket.IO, TypeScript.
- **Enjin Audio:** HTML5 Audio API dengan lapisan `SyncedAudio` drift correction (Cristian's algorithm).
- **Muzik CC:** Jamendo API v3.0 (Creative Commons) dengan fallback tempatan.

> [!CAUTION]
> **Larangan Pengubahan Tech Stack:**
> Tech stack PoySic dikunci secara mutlak kepada **React 19 + Vite** (Bukan Next.js). Semua ejen dilarang sama sekali daripada mengubah tech stack atau menambah kebergantungan baru tanpa kebenaran bertulis daripada pemilik projek (*owner*).

### 7.2 Governance Changelog
- **2026-09-19 (Owner Decision):** Pengesahan rasmi oleh pemilik projek bahawa PoySic menggunakan **React 19 + Vite** untuk frontend dan **Express + Socket.IO** untuk backend. Sebarang cadangan migrasi ke Next.js dibatalkan dan dilarang.

