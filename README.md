# PoySic

> *"Dengar sama-sama, tak kira jauh."*

PoySic ialah aplikasi web pemain muzik tersinkron (*synchronized music player*) masa nyata yang direka khas untuk pasangan (LDR), sahabat, dan keluarga agar dapat mendengar muzik kegemaran pada saat yang sama — tanpa sebarang iklan, tanpa penjejak.

---

## Ciri Utama

- **Zero Ads & Privasi** — Tiada iklan, tiada tracking, tiada pendaftaran wajib.
- **Clock Sync Berketepatan Tinggi** — Algoritma Cristian dengan pengukuran latensi milisaat.
- **Drift Correction Pintar** — Membetulkan kelewatan audio secara automatik (threshold 450ms).
- **Katalog Muzik Jamendo CC** — Ribuan lagu percuma berlesen Creative Commons.
- **Senarai Giliran (Queue)** — Tambah lagu, susun giliran, auto-play ke lagu seterusnya.
- **Sembang Bilik & Reaksi Emoji** — Interaksi masa nyata bersama orang tersayang.
- **Model Sumbangan Sukarela** — 100% percuma, disokong melalui Saweria.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons, Socket.IO Client |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Audio Engine** | HTML5 Audio API + lapisan `SyncedAudio` drift correction |
| **Music API** | Jamendo API v3.0 (Creative Commons) |

---

## Struktur Projek

```
poysic/
├── client/                 # React/Vite frontend
│   ├── src/
│   │   ├── components/     # UI components (player, queue, room, ui)
│   │   ├── hooks/          # React hooks (useRoom, useClockSync, useSyncedAudio)
│   │   ├── lib/            # Core libraries (audio, socket, sync)
│   │   ├── types/          # TypeScript interfaces
│   │   └── App.tsx         # Main application component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                 # Express + Socket.IO backend
│   ├── src/
│   │   ├── index.ts        # Server entry point
│   │   ├── rooms.ts        # Room lifecycle management
│   │   ├── clockSync.ts    # Cristian's clock sync algorithm
│   │   ├── queue.ts        # Shared queue logic
│   │   ├── jamendo.ts      # Jamendo API client
│   │   └── types.ts        # Shared type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── docs/                   # Technical documentation
│   ├── ARCHITECTURE.md     # System architecture & diagrams
│   ├── ROADMAP.md          # Project roadmap & phases
│   ├── SYNC_ENGINE.md      # Sync engine specification
│   └── API.md              # Socket.IO event catalog
│
├── AGENTS.md               # Multi-agent governance guide
├── README.md
├── LICENSE                 # MIT License
└── .gitignore
```

---

## Cara Run (Development Mode)

### Prasyarat
- Node.js 18+ dan npm
- Kunci API Jamendo (letak dalam `.env` — rujuk `.env.example`)

### Jalankan Server (Terminal 1)
```bash
cd server
npm install
npm run dev
```

### Jalankan Client (Terminal 2)
```bash
cd client
npm install
npm run dev
```

Aplikasi akan sedia pada `http://localhost:5173` (client) dengan backend pada `http://localhost:3000`.

---

## Panduan Deployment (Production)

### 1. Backend Deployment (Render / Railway / Docker / VPS)
- **Render:** Cipta *Web Service* baru, hubungkan repositori, tetapkan Root Directory ke `server/`, atau import `server/render.yaml`.
- **Railway:** Hubungkan repositori dan tetapkan Root Directory ke `server/` (menggunakan `server/railway.json`).
- **Docker / VPS:**
  ```bash
  cd server
  docker build -t poysic-server .
  docker run -d -p 3000:3000 --env-file .env poysic-server
  ```
- **Environment Variables Backend:**
  - `PORT=3000`
  - `NODE_ENV=production`
  - `JAMENDO_CLIENT_ID=kunci_anda`
  - `CLIENT_ORIGIN=https://poysic.vercel.app` (URL frontend anda)

### 2. Frontend Deployment (Vercel / Netlify)
- **Vercel:** Import repositori Git, pilih folder `client/` sebagai Root Directory (menggunakan `client/vercel.json`).
- **Netlify:** Tetapkan Base directory ke `client/`, Build command `npm run build`, dan Publish directory `dist/` (menggunakan `client/netlify.toml`).
- **Environment Variables Frontend:**
  - `VITE_SOCKET_URL=https://poysic-api.onrender.com` (URL backend anda)

---

## Dokumentasi Lanjut

| Dokumen | Penerangan |
|---|---|
| [TESTING.md](docs/TESTING.md) | Panduan langkah demi langkah ujian sync 2-tab & console |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagram sistem, aliran data, komponen |
| [ROADMAP.md](docs/ROADMAP.md) | Pelan pembangunan Fasa 1–3 |
| [SYNC_ENGINE.md](docs/SYNC_ENGINE.md) | Spesifikasi enjin sinkronisasi audio |
| [API.md](docs/API.md) | Katalog lengkap Socket.IO events |
| [AGENTS.md](AGENTS.md) | Panduan pasukan agent, konvensyen & sekatan tech stack |

---

## Sumbangan & Sokongan

PoySic adalah 100% percuma dan terbuka. Sekiranya anda menyukai projek ini, anda boleh menyokong kos pelayan kami di [Saweria](https://saweria.co).

---

## Lesen

Dilesenkan di bawah [Lesen MIT](./LICENSE).
