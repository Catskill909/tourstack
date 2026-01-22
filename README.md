# TourStack 🏛️

**Museum tour builder with modular content blocks and Swiss Army Knife positioning**

Build interactive tours with QR codes, GPS, Bluetooth beacons, NFC, and more. Support for multilingual content, audio guides, image galleries, and rich media.

## 🚀 Quick Start

> [!CAUTION]
> **ALWAYS use `npm run dev:all`** - The app requires BOTH servers!

```bash
cd app
npm install
npm run dev:all        # ⭐ REQUIRED: Frontend (5173) + API server (3000)
npm run db:studio      # Open database GUI
```

> [!WARNING]
> Running only `npm run dev` will cause errors like `Cannot POST /api/translate`  
> The Express API server (port 3000) must be running for any `/api/*` calls to work.

**Architecture**: Vite proxies `/api/*` requests to `http://localhost:3000` (Express).

## 🎯 Key Features

- **7 Positioning Technologies**: QR Code, GPS, BLE Beacon, NFC, RFID, WiFi, UWB
- **Modular Content Blocks**: Text, images, galleries, audio, timeline galleries
- **Stop Editor**: Split-pane editor with live preview mode
- **Timeline Gallery**: Audio-synced image galleries with **thumbnail markers** on waveform
- **Multilingual**: All content supports multiple languages
- **JSON Export**: Portable tour data for mobile apps and backup

## 📁 Project Structure

```
TourStack/
├── app/                    # Main application
│   ├── prisma/             # Database schema + seed
│   ├── server/             # Express API server
│   │   ├── index.ts        # Main server entry
│   │   └── routes/         # API route handlers
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── blocks/     # Block editors
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Services + utilities
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── package.json
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # Content block system
│   └── timeline-gallery.md # Timeline Gallery feature docs
├── HANDOFF.md              # Development handoff
└── tourstack.md            # Full scope document
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React 19, TypeScript |
| Styling | Tailwind CSS v4, Dark Mode |
| Backend | Express.js API server |
| Database | SQLite + Prisma 5 |
| State | Zustand |
| Audio | wavesurfer.js |
| Animation | Framer Motion |
| Icons | Lucide React |

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| [HANDOFF.md](./HANDOFF.md) | Development status & next steps |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Content block system design |
| [docs/timeline-gallery.md](./docs/timeline-gallery.md) | Timeline Gallery feature |
| [tourstack.md](./tourstack.md) | Full scope reference |

## 🔧 Commands

> [!CAUTION]
> **ALWAYS use `npm run dev:all`** for local development!

```bash
cd app
npm install           # Install dependencies
npm run dev:all       # ⭐ REQUIRED: Run both Vite + Express
npm run typecheck     # ⭐ Check TypeScript BEFORE committing
npm run build         # Build for production
npm run db:seed       # Seed templates
npm run db:studio     # Open Prisma Studio
# Debug only (not for normal development):
# npm run dev         # Vite only - API calls will FAIL
# npm run server      # Express only - no frontend
```

## 🛡️ Deployment Guardrails

> [!IMPORTANT]
> **ALWAYS run `npm run typecheck` before pushing!**  
> TypeScript errors will fail the Coolify build. A pre-commit hook catches these automatically.

```bash
cd app
npm run typecheck     # ⭐ REQUIRED before every commit
npm run build         # Verify full build works locally
```

**Pre-commit hook** (`.git/hooks/pre-commit`) automatically blocks commits with TS errors.

## 🚀 Deployment (Coolify)

### Persistent Storage Volumes

| Container Path | Host Path |
|---------------|-----------|
| `/app/uploads` | `/data/tourstack/uploads` |
| `/app/data` | `/data/tourstack/data` |

### Environment Variables

Add these in Coolify's **Environment Variables** section:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./data/dev.db` |
| `DEEPGRAM_API_KEY` | Optional | Deepgram TTS (text-to-speech) |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs premium TTS |
| `GOOGLE_MAPS_API_KEY` | Optional | Google Maps for premium maps |

**To set up Google Maps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing
3. Enable **Maps JavaScript API**
4. Create an API key under **Credentials**
5. Add the key to Coolify: `GOOGLE_MAPS_API_KEY=your_key_here`
6. Redeploy the application

> **Note:** The API key set in Coolify environment variables will override any key saved in the Settings UI.

---

**Repository**: https://github.com/Catskill909/tourstack
