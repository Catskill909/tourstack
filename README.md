# TourStack 🏛️

**AI-powered museum tour builder with modular content blocks, multilingual support, and Swiss Army Knife positioning**

Build interactive tours with QR codes, GPS, Bluetooth beacons, NFC, and more. AI translation, text-to-speech narration, image analysis, document intelligence, and a per-tour visitor chatbot — all built in.

---

## 🤖 AI-Powered Features

| Feature | What it does | Powered by |
|---------|-------------|------------|
| **Magic Translate** | One-click translation for all content fields — titles, descriptions, text blocks, quick actions, welcome messages | Google Cloud Translation, LibreTranslate (fallback) |
| **Text-to-Speech** | Generate narration audio for any stop in 32+ languages with 3000+ voice options | ElevenLabs, Deepgram Aura-2, Google Cloud TTS |
| **Image OCR & Analysis** | Extract text from images, auto-generate alt text, identify artwork and objects | Google Vision AI |
| **AI Concierge Chatbot** | Per-tour visitor chatbot with custom persona, quick actions, and knowledge sourced from tour content + uploaded documents | Google Gemini |
| **Document Intelligence** | Upload PDFs/DOCX — extract text, generate summaries, key facts, and FAQ for chatbot knowledge | Google Gemini |
| **Image Map Editor** | Place interactive hotspots on images with AI-assisted floorplan analysis to auto-suggest marker placements | Google Gemini |

> All AI features are optional — TourStack works fully offline with no API keys configured. Add keys to unlock each capability.

---

## ⛔️ APP DIRECTORY + SERVER STARTUP ⛔️

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

## 🔥 Server Not Working?

**Symptom**: API errors, `Cannot POST /api/*`, changes not showing

**Fix**: Just run start again - it kills zombies automatically:
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npm run start
```

**If you see port 5174 instead of 5173** in the terminal output, a zombie process is still running. Run `npm run start` again - it will kill it.

## 🎯 Key Features

> **Preview = Real Device:** The admin device preview renders at actual device pixels (375×812 iPhone, 820×1180 iPad portrait/landscape). What you see IS what visitors see. The same React components power both admin preview and live visitor pages.

- **7 Positioning Technologies**: QR Code, GPS, BLE Beacon, NFC, RFID, WiFi, UWB
- **Positioning Editor**: Tabbed modal with NFC pairing, QR generator, GPS geofencing (3 tabs live, 4 placeholder)
- **GPS Geofencing**: Map editor with trigger radius, "Use My Location", address search, auto-navigate between stops
- **NFC Tag Pairing**: Copy URL for NFC Tools app, Web NFC direct write (Chrome Android), help modal
- **Native QR Generator**: `qrcode.react` with regeneration, unique tokens, PNG download
- **Visit Analytics**: VisitLog table tracks stop visits with source, token, timestamp, and user agent
- **Tour Block**: Full-screen hero intro with architectural design system aesthetic
- **Language Reconciliation**: Smart import detects language mismatches, prompts to expand tour or filter import
- **14 Content Blocks**: Text, Image, Gallery, Timeline Gallery, Audio, Video, Quote, Timeline, Comparison, Positioning, Map (multi-marker, dark popups, OpenStreetMap + Google Maps), Image Map, HTML/Embed, Tour
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
| Validation | Zod |
| Maps | Leaflet + Google Maps API (full parity) |
| Icons | Lucide React |

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| [HANDOFF.md](./HANDOFF.md) | Development status & next steps |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Content block system design |
| [docs/timeline-gallery.md](./docs/timeline-gallery.md) | Timeline Gallery feature |
| [docs/image-map-block-dev.md](./docs/image-map-block-dev.md) | Image Map block feature |
| [docs/language-collection-import-audit.md](./docs/language-collection-import-audit.md) | Language import reconciliation audit |
| [docs/ai-chatbot-documents-dev.md](./docs/ai-chatbot-documents-dev.md) | AI Chatbot & Documents development |
| [docs/html-block-dev.md](./docs/html-block-dev.md) | HTML / Embed block development |
| [docs/ELEVENLABS-VOICES-ISSUE.md](./docs/ELEVENLABS-VOICES-ISSUE.md) | ElevenLabs voice API limitations |
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

> [!IMPORTANT]
> **Coolify: Set these as Runtime Environment Variables, NOT Build Arguments.**
> Secrets are only needed when the container *runs*, not when it *builds*.
> In Coolify, ensure all API keys are in the **Environment Variables** section (not Build Variables)
> to avoid `SecretsUsedInArgOrEnv` Docker warnings and prevent secrets from leaking into image layers.

Add these in Coolify's **Environment Variables** section:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./data/dev.db` |
| `ADMIN_PASSWORD` | **Yes** | Admin login password (defaults to "admin" if not set - NOT SECURE) |
| `SESSION_SECRET` | **Yes** | Random 32+ char string for session encryption |
| `DEEPGRAM_API_KEY` | Optional | Deepgram Aura-2 TTS (7 languages, 40+ voices) |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs premium TTS (32+ languages, 3000+ voices) |
| `GOOGLE_VISION_API_KEY` | Optional | Google Vision, Google Cloud Translation (195+ languages), and Google Cloud TTS |
| `GEMINI_API_KEY` | Optional | Gemini AI for document analysis and concierge |
| `GOOGLE_MAPS_API_KEY` | Optional | Google Maps for premium maps |
| `LIBRE_TRANSLATE_URL` | Optional | LibreTranslate server URL (default: https://translate.supersoul.top/translate) |
| `LIBRE_TRANSLATE_API_KEY` | Optional | LibreTranslate API key (if required by instance) |

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
