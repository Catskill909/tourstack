# TourStack 🏛️

**Museum tour builder with modular content blocks and Swiss Army Knife positioning**

Build interactive tours with QR codes, GPS, Bluetooth beacons, NFC, and more. Support for multilingual content, audio guides, image galleries, and rich media.

---

## ⛔️ CRITICAL: APP DIRECTORY + SERVER STARTUP ⛔️

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 THE ONLY WAY TO START TOURSTACK 🚨🚨🚨                   │
│                                                                 │
│    cd /Users/paulhenshaw/Desktop/TourStack/app                  │
│    npm run start                                                │
│                                                                 │
│  This command:                                                  │
│    ✅ Kills zombie processes on ports 3000 & 5173               │
│    ✅ Waits for ports to free up                                │
│    ✅ Starts BOTH Vite (5173) AND Express API (3000)            │
│                                                                 │
│  ❌ NEVER use: npm run dev      (Vite only - API will FAIL)     │
│  ❌ NEVER use: npm run server   (Express only - no frontend)    │
│  ❌ NEVER use: npm run dev:all  (doesn't kill zombies first)    │
│  ❌ NEVER run from TourStack root (no package.json there!)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npm install
npm run start          # ⭐ THE ONLY COMMAND YOU NEED
```

**That's it.** `npm run start` handles everything:
1. Kills any zombie processes
2. Frees up ports 3000 and 5173
3. Starts both Vite frontend AND Express API

**Verify it's working:**
```bash
lsof -i :3000 -i :5173 | grep LISTEN
# Should show TWO node processes
```

## 🔊 ElevenLabs Voice Limitation (CRITICAL!)

> [!CAUTION]
> **Before modifying ANY ElevenLabs code:**
> - We use **PREMADE VOICES ONLY** (21 voices, work for ALL 32 languages)
> - **DO NOT** try to add native language voices via `/shared-voices` API
> - Using shared voices for generation AUTO-ADDS them to account (10 slot limit)
> - After 10 slots: "voice_limit_reached" - ALL GENERATION FAILS
>
> **We wasted 8 hours learning this on January 24, 2026. Don't repeat our mistake.**
>
> 📖 Full details: [docs/ELEVENLABS-VOICES-ISSUE.md](docs/ELEVENLABS-VOICES-ISSUE.md)

## 🔥 Server Not Working?

**Symptom**: API errors, `Cannot POST /api/*`, changes not showing

**Fix**: Just run start again - it kills zombies automatically:
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npm run start
```

**If you see port 5174 instead of 5173** in the terminal output, a zombie process is still running. Run `npm run start` again - it will kill it.

## 🎯 Key Features

> **Preview = Real Device:** The admin device preview renders at actual device pixels (375×812 iPhone, 820×1180 iPad). What you see IS what visitors see. The same React components power both admin preview and live visitor pages.

- **7 Positioning Technologies**: QR Code, GPS, BLE Beacon, NFC, RFID, WiFi, UWB
- **Positioning Editor**: Tabbed modal with QR generator, placeholder tabs for all technologies
- **Native QR Generator**: `qrcode.react` with regeneration, unique tokens, PNG download
- **Tour Block**: Full-screen hero intro with architectural design system aesthetic
- **12 Content Blocks**: Text, Image, Gallery, Timeline Gallery, Audio, Video, Quote, Timeline, Comparison, Positioning, Map, Tour
- **Stop Editor**: Split-pane editor with live preview mode
- **Timeline Gallery**: Audio-synced image galleries with **thumbnail markers** on waveform
- **Multilingual**: All content supports multiple languages with Magic Translate AI
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

```bash
cd /Users/paulhenshaw/Desktop/TourStack/app

# ⭐ DEVELOPMENT - Use this ONE command:
npm run start         # Kills zombies + starts BOTH servers

# Other useful commands:
npm run typecheck     # Check TypeScript BEFORE committing
npm run build         # Build for production
npm run db:seed       # Seed templates
npm run db:studio     # Open Prisma Studio

# ❌ NEVER USE THESE FOR DEVELOPMENT:
# npm run dev         # Vite only - API will FAIL
# npm run server      # Express only - no frontend
# npm run dev:all     # Doesn't kill zombies - use 'start' instead
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
| `ADMIN_PASSWORD` | **Yes** | Admin login password (defaults to "admin" if not set - NOT SECURE) |
| `SESSION_SECRET` | **Yes** | Random 32+ char string for session encryption |
| `DEEPGRAM_API_KEY` | Optional | Deepgram Aura-2 TTS (7 languages, 40+ voices) |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs premium TTS (32+ languages, 3000+ voices) |
| `GOOGLE_MAPS_API_KEY` | Optional | Google Maps for premium maps |
| `LT_LOAD_ONLY` | Optional | LibreTranslate languages (default: en,es,fr,de,ja,it,ko,zh,pt) |
| `GOOGLE_VISION_API_KEY` | Optional | Enable AI features (Image to Text, Smart Cataloging, Captions) |

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
