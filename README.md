# PoySic

> *"Listen together, no matter the distance."*

PoySic is a real-time synchronized music player web application designed for long-distance couples (LDR), best friends, and families to listen to music at the exact same millisecond — with zero commercial ads, zero surveillance tracking, and no required registration.

---

## Key Features

- **Zero Ads & Privacy-First** — No commercial ads, no tracking scripts, no mandatory sign-up.
- **High-Precision Clock Synchronization** — Cristian's algorithm with millisecond round-trip latency measurements.
- **Intelligent Drift Correction** — Automatically corrects audio lag (450ms threshold) via seamless hard seeks.
- **Multi-Language Support (i18n)** — Available in 5 languages: English (default), Bahasa Melayu, Indonesian, Spanish, and Mandarin, with auto-detection and manual navbar toggle.
- **Legal Music Catalogs** — Jamendo CC API and Audius decentralized streaming with zero paid API keys.
- **Synchronized Queue** — Add tracks, reorder queue, and automatic cross-client auto-play for the next song.
- **Live Room Chat & Emoji Reactions** — Real-time interactive messaging and floating emoji reactions.
- **Voluntary Community Model** — 100% free and open, supported voluntarily via Saweria.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, i18next |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Audio Engine** | HTML5 Audio API + `SyncedAudio` drift correction layer |
| **Music Sources** | Jamendo API v3.0 (Creative Commons) & Audius Decentralized API |

---

## Project Structure

```
poysic/
├── client/                 # React/Vite frontend
│   ├── src/
│   │   ├── components/     # UI components (player, queue, room, ui)
│   │   ├── hooks/          # React hooks (useRoom, useClockSync, useSyncedAudio)
│   │   ├── i18n/           # Multi-language configuration & 5 locale dictionaries (EN, MS, ID, ES, ZH)
│   │   ├── lib/            # Core libraries (audio, socket, sync)
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main application component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express + Socket.IO backend
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── rooms.ts        # Room lifecycle management & 60s grace GC
│   │   ├── clockSync.ts    # Cristian's clock sync algorithm
│   │   ├── queue.ts        # Shared queue logic & auto-advance
│   │   ├── jamendo.ts      # Jamendo API client & fallback catalog
│   │   └── types.ts        # Shared type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # Technical documentation
│   ├── ARCHITECTURE.md     # System architecture & sequence diagrams
│   ├── ROADMAP.md          # Project roadmap & milestones
│   ├── SYNC_ENGINE.md      # Synchronization engine mathematical specification
│   ├── TESTING.md          # Step-by-step 2-tab sync testing guide
│   └── API.md              # Socket.IO event catalog
│
├── AGENTS.md               # Multi-agent governance guide
├── README.md
├── LICENSE                 # MIT License
└── .gitignore
```

---

## Running Locally (Development Mode)

### Prerequisites
- Node.js 18+ and npm
- Jamendo Client ID (optional, default fallback catalog included in `.env.example`)

### 1. Start Backend Server (Terminal 1)
```bash
cd server
npm install
npm run dev
```

### 2. Start Frontend Client (Terminal 2)
```bash
cd client
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173` with backend services on `http://localhost:3000`.

---

## Deployment Guide (Production)

### 1. Backend Deployment (Render / Railway / Docker / VPS)
- **Render:** Create a new *Web Service*, connect repository, set Root Directory to `server/`, or import `server/render.yaml`.
- **Railway:** Connect repository and set Root Directory to `server/` (via `server/railway.json`).
- **Docker / VPS:**
  ```bash
  cd server
  docker build -t poysic-server .
  docker run -d -p 3000:3000 --env-file .env poysic-server
  ```
- **Backend Environment Variables:**
  - `PORT=3000`
  - `NODE_ENV=production`
  - `JAMENDO_CLIENT_ID=your_key`
  - `CLIENT_ORIGIN=https://poysic.vercel.app` (your frontend URL)

### 2. Frontend Deployment (Vercel / Netlify)
- **Vercel:** Import Git repository, set Root Directory to `client/` (via `client/vercel.json`).
- **Netlify:** Set Base directory to `client/`, Build command `npm run build`, and Publish directory `dist/` (via `client/netlify.toml`).
- **Frontend Environment Variables:**
  - `VITE_SOCKET_URL=https://poysic-api.onrender.com` (your backend URL)

---

## Detailed Documentation

| Document | Description |
|---|---|
| [TESTING.md](docs/TESTING.md) | Step-by-step 2-tab synchronization and console test instructions |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System topology, data flow, component interactions |
| [ROADMAP.md](docs/ROADMAP.md) | Project milestones & feature development plan |
| [SYNC_ENGINE.md](docs/SYNC_ENGINE.md) | In-depth specification of Cristian's clock sync & drift correction |
| [API.md](docs/API.md) | Complete Socket.IO event reference |
| [AGENTS.md](AGENTS.md) | Multi-agent conventions, guidelines, and tech stack boundaries |

---

## Community & Support

PoySic is 100% free and open-source. If you enjoy the project, you can help cover our server and WebSocket relay costs on [Saweria](https://saweria.co).

---

## License

Licensed under the [MIT License](./LICENSE).
