# TourStack Handoff Document 📋

**Last Updated**: January 25, 2026  
**Session Status**: Phase 16 Visitor Experience IN PROGRESS 🔄 | Tour Block COMPLETE ✅ | QR System COMPLETE ✅

---

## ⛔️ CRITICAL: APP DIRECTORY ⛔️

```
┌──────────────────────────────────────────────────────────────┐
│  🚨 ALL CODE & COMMANDS ARE IN THE /app SUBDIRECTORY! 🚨     │
│                                                              │
│  WORKSPACE ROOT:  /Users/paulhenshaw/Desktop/TourStack       │
│  APP DIRECTORY:   /Users/paulhenshaw/Desktop/TourStack/app   │
│                                                              │
│  To start dev servers:                                       │
│    cd /Users/paulhenshaw/Desktop/TourStack/app               │
│    npm run dev:all                                           │
│                                                              │
│  ❌ NEVER run npm from TourStack root - no package.json!     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🎯 PRODUCT VISION: One App For Everything

> **TourStack is a unified SaaS platform** - Admin CMS + Visitor App + Field Tools in ONE application.

| Mode | Routes | Purpose |
|------|--------|---------|
| **Admin** | `/tours/*`, `/stops/*` | Create & manage tour content |
| **Visitor** | `/visitor/*` | Public-facing tour experience

### 🔄 IN PROGRESS: AI Tools (Phase 2)
> Next Up: Caption Generator using Generative AI (Gemini).

- **Caption Writer**: Use Gemini to generate natural language descriptions of artifacts.
- **Smart Cataloging**: Integrate tagging into the main Media Library upload flow.

### ⏸ PAUSED: Visitor Experience System (production)

### Key Architecture Concept

**The Preview System IS the Visitor View** - same `StopContentBlock` components render in both:
- **Admin**: Preview modal with device frames (testing)
- **Visitor**: Full-screen pages via QR codes (production)

> ⚠️ **CRITICAL: Preview = Real Device Pixels**
>
> The preview device dimensions ARE the actual visitor screen:
> - **iPhone:** 375 × 812px (real device resolution)
> - **iPad:** 820 × 1180px (real device resolution)
>
> The admin UI scales it down to fit, but content renders at true pixel dimensions.
> **NEVER use `100vh` or `100dvh`** - these refer to browser viewport, not device screen.
> Always pass explicit pixel heights from `DEVICE_CONFIGS` through the component chain.

### Draft vs Published

| Status | Admin Access | Visitor Access |
|--------|--------------|----------------|
| **Draft** | ✅ Full edit | ❌ Not visible |
| **Published** | ✅ Full edit | ✅ Public |

Staff viewing visitor pages see a **"Back to Admin"** button.

---

## 🚀 Quick Start

```bash
cd app
npm run dev:all       # ⭐ REQUIRED: Runs both Vite (5173) + Express API (3000)
```

**Current Status:** Both servers running ✅  
**Local Testing:** Fully tested ✅ - QR codes auto-generate with unique URLs & short codes!
- Frontend: http://localhost:5173
- API Server: http://localhost:3000
- Database: 12 Deepgram audio files, 18 ElevenLabs audio files loaded

---

## 📍 QR CODE & POSITIONING SYSTEM

### How It Works
- **New stops automatically get** a unique QR code URL and 6-char short code
- URL format: `/visitor/tour/{tourId}/stop/{stopId}?t={token}`
- Short code: 6 uppercase chars (e.g., `MX4VPR`) - avoids confusing 0/O, 1/I
- **Regenerate button** creates completely new token + short code
- **PNG Download** exports 500px print-ready QR image

### API Persistence
The `primaryPositioning` field in each stop stores:
```json
{
  "method": "qr_code",
  "url": "http://localhost:3000/visitor/tour/.../stop/...?t=abc123",
  "shortCode": "MX4VPR"
}
```

### Feeds API
The `/api/feeds/tours/:id` endpoint includes `primary_positioning` for each stop:
```json
{
  "stops": [{
    "id": "...",
    "title": { "en": "Stop Name" },
    "primary_positioning": {
      "method": "qr_code",
      "shortCode": "MX4VPR",
      "url": "/visitor/tour/.../stop/...?t=abc123"
    }
  }]
}
```

---

## 🚧 ELEVENLABS CRITICAL GUARDRAILS (DO NOT SKIP!)

> [!CAUTION]
> **READ THIS BEFORE TOUCHING ANY ELEVENLABS CODE!**
> We wasted an ENTIRE DAY debugging this. Don't repeat our mistake.

### The Hard Truth About ElevenLabs Voice Slots

| Action | Uses Slot? | Safe? |
|--------|------------|-------|
| Browse premade voices (`/voices`) | ❌ No | ✅ YES |
| Generate with premade voice | ❌ No | ✅ YES |
| Browse shared voices (`/shared-voices`) | ❌ No | ✅ YES |
| **Generate with shared voice** | **✅ YES** | ❌ **DANGER!** |

**Starter tier = 10 voice slots. When full, ALL shared voice generation FAILS.**

### ⛔ NEVER DO THIS
```typescript
// ❌ WRONG - shared-voices API auto-adds voices when you GENERATE
fetch(`/shared-voices?language=${lang}`)  // Looks harmless but ISN'T
```

### ✅ ALWAYS DO THIS
```typescript
// ✅ CORRECT - premade voices NEVER use slots
fetch(`/voices`).filter(v => v.category === 'premade')
```

### Why Premade Voices Are Fine
- **21 high-quality voices** included FREE
- **Work with ALL 32 languages** via Multilingual v2 model
- Roger speaking Italian = Italian pronunciation (just English name)
- Sarah speaking Chinese = Chinese pronunciation (just English name)
- **ZERO slot usage, ZERO additional cost**

### If You See "voice_limit_reached" Error
1. Someone used shared-voices API for GENERATION
2. Voice was auto-added to account
3. Slots filled up (10 max on Starter)
4. **Fix:** Delete voices via ElevenLabs dashboard or API

📖 **Full details:** [docs/ELEVENLABS-VOICES-ISSUE.md](docs/ELEVENLABS-VOICES-ISSUE.md)

---

## �🔥 Server Troubleshooting (READ FIRST!)

> [!CAUTION]
> **If you get `net::ERR_CONNECTION_REFUSED` or API errors, the server is down!**

### Quick Fix (Copy & Paste)
```bash
# Kill all existing processes and restart
pkill -f "node.*vite"; pkill -f "tsx.*server"; sleep 1
cd /Users/paulhenshaw/Desktop/TourStack/app && npm run dev:all
```

### Verify Servers Are Running
```bash
# Check ports 3000 and 5173
lsof -i :3000 -i :5173 | grep LISTEN
```

**Expected output:**
```
node    12345  user   TCP *:5173 (LISTEN)
node    12346  user   TCP *:3000 (LISTEN)
```

### Common Symptoms & Solutions

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Cannot POST /api/...` | Express not running | Run `npm run dev:all` |
| `net::ERR_CONNECTION_REFUSED` | Server crashed/stopped | Kill & restart (see above) |
| `ENOENT: package.json` | Wrong directory | Must be in `/app` folder |
| Vite running but API fails | Only ran `npm run dev` | Use `npm run dev:all` instead |
| Port already in use | Zombie process | `pkill -f node` then restart |

### ⚠️ NEVER DO THIS
```bash
npm run dev          # ❌ WRONG - Only starts Vite, API will fail!
cd TourStack && npm  # ❌ WRONG - Must be in /app folder!
```

### ✅ ALWAYS DO THIS
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npm run dev:all      # ✅ CORRECT - Starts BOTH servers
```

---

## � LibreTranslate Server Configuration

> [!IMPORTANT]
> We run a **self-hosted LibreTranslate server** at `translate.supersoul.top` with limited languages to reduce memory usage.

### Supported Languages (LT_LOAD_ONLY)

```
en,es,fr,de,ja,it,ko,zh,pt
```

| Code | Language | Status |
|------|----------|--------|
| en | English | ✅ Primary |
| es | Spanish | ✅ |
| fr | French | ✅ |
| de | German | ✅ |
| it | Italian | ✅ |
| pt | Portuguese | ✅ |
| ja | Japanese | ✅ |
| ko | Korean | ✅ |
| zh | Chinese (zh-Hans) | ✅ |

### Where Languages Are Defined

All language lists must stay in sync with `LT_LOAD_ONLY`:

| File | Constant |
|------|----------|
| `Audio.tsx` | `TRANSLATION_LANGUAGE_MAP` |
| `CreateTourModal.tsx` | `languages` |
| `EditTourModal.tsx` | `languages` |
| `translationService.ts` | `SUPPORTED_LANGUAGES` |
| `AudioCollectionModal.tsx` | `TRANSLATION_AVAILABLE`, `ELEVENLABS_LANGUAGES` |
| `CollectionPickerModal.tsx` | `LANGUAGE_NAMES` |

### Adding a New Language

1. Update `LT_LOAD_ONLY` env var on LibreTranslate server
2. Update ALL files listed above
3. Test translation end-to-end

---

## �🏗️ Architecture Overview

TourStack uses a **modular content block system** where tours and stops are composed of reusable, typed blocks.

### Core Principles
1. **Modular Blocks**: All content is typed blocks with consistent schemas
2. **JSON-First**: Clean export/import for backup, mobile apps, API
3. **Translation-Ready**: All text fields are `{ [lang]: value }` objects
4. **Server-Side Storage**: Files uploaded to `/uploads/`, data in SQLite

---

## ✅ Completed Work

### Phase 1: Foundation ✅
- [x] Git repo → [GitHub](https://github.com/Catskill909/tourstack)
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS v4, Dark Mode Material Design
- [x] SQLite database with Prisma 5.21.1 (pinned for stability)
- [x] Zustand state management

### Phase 2: Tours Management ✅
- [x] Tours page with CRUD operations
- [x] 3-step create wizard (Template → Info → Review)
- [x] 7 technology-based templates (QR, GPS, BLE, NFC, RFID, WiFi, UWB)

### Phase 3: Tour Editing ✅
- [x] Edit Tour modal with all fields
- [x] ImageUpload component (drag-and-drop)
- [x] Hero images on tour cards

### Phase 4: Content Block System ✅
- [x] Text Block (rich text, multilingual)
- [x] Image Block (single image with caption)
- [x] Audio Block (custom player with transcript)
- [x] Gallery Block (carousel/grid/masonry layouts)
- [x] Timeline Gallery Block (audio-synced images)

### Phase 5: API Layer ✅
- [x] Express API server (`server/index.ts`)
- [x] Tours, Stops, Templates, Media CRUD endpoints
- [x] SQLite persistence via Prisma
- [x] Production Dockerfile (multi-stage, init scripts)

### Phase 6: Timeline Gallery Editor ✅ PRODUCTION READY
- [x] Full-screen modal with 2-section layout
- [x] wavesurfer.js waveform visualization
- [x] Touch support for tablets
- [x] Image upload/edit
- [x] **Server-side file storage** (100MB limit)
- [x] **Database API for stops** (no localStorage!)
- [x] **Unsaved changes warning** modal

### Phase 7: Framer Motion Integration ✅ (Jan 19, 2026)
- [x] **framer-motion** package added (~32KB)
- [x] **True Crossfade** - simultaneous opacity transitions
- [x] **Transition Duration** slider (0.1s - 1.5s)
- [x] **AnimatePresence** for smooth enter/exit animations

### Phase 8: Thumbnail Markers UI ✅ (Jan 20, 2026)
- [x] **Thumbnail markers** replace numbered circles + image strip
- [x] **64px thumbnails** on waveform timeline
- [x] **Click to edit** - opens caption/alt/credit modal
- [x] **Drag to move** - changes timestamp with `hasDraggedRef`
- [x] **Delete in modal** - cleaner UX than inline delete

---

### Phase 9: Translation Infrastructure ✅ (Jan 20, 2026)
- [x] **i18next** - UI translations with language switcher
- [x] **Magic Translate** - AI content translation via LibeTranslate
- [x] **Server Proxy** - Secure API handling with CORS support
- [x] **Stop Preview** - Multilingual preview support

### Phase 10: Audio Player Size Variants ✅ (Jan 21, 2026)
- [x] **3 Size Variants** - Large, Medium, Small players
- [x] **Material Design Size Selector** - Segmented buttons with icons
- [x] **Show Title Toggle** - Only visible for large size, defaults to true
- [x] **Tablet Scaling** - Larger buttons/padding for medium/small on tablets
- [x] **Editor Layout Fix** - Small player displays on its own line below upload
- [x] **Removed Duration Field** - Simplified interface, not needed

### Phase 11: Map Block ✅ (Jan 21, 2026)
- [x] **OpenStreetMap Integration** - Leaflet-based maps (free, no API key)
- [x] **Google Maps Integration** - Premium maps with API key support
- [x] **Full-Screen Map Editor** - Click to place markers, address search, current location
- [x] **Provider Toggle** - Switch between OpenStreetMap and Google Maps
- [x] **Map Styles** - Standard, Satellite, Terrain, Hybrid
- [x] **Size Options** - Small (150px), Medium (250px), Large (full height)
- [x] **Trigger Zones** - Configurable radius for geofencing
- [x] **Settings API** - Persistent settings storage with env var overrides
- [x] **Coolify Ready** - `GOOGLE_MAPS_API_KEY` env var support for production

### Phase 12: Audio TTS Section ✅ (Jan 22, 2026)
- [x] **Deepgram Aura-2 TTS** - Full text-to-speech integration
- [x] **7 Languages** - English, Spanish, German, French, Dutch, Italian, Japanese
- [x] **40+ Voices** - Featured and standard voices per language
- [x] **Auto-Translate** - Automatic translation via LibreTranslate before TTS generation
- [x] **Voice Gallery** - Visual voice selector with gender indicators and preview
- [x] **Voice Preview** - Listen to any voice before generating
- [x] **Multiple Formats** - MP3, WAV, OGG, FLAC output options
- [x] **Sample Rates** - 8kHz, 16kHz, 24kHz, 48kHz options
- [x] **Success Modal** - Post-generation modal with settings summary
- [x] **File Metadata** - Language badges, format, sample rate, file size display
- [x] **Auto-Scroll** - Scrolls to generated files after creation
- [x] **Persistent Storage** - Files saved to `/app/uploads/audio/generated/`

### Phase 13: ElevenLabs Integration ✅ (Jan 22, 2026)
- [x] **ElevenLabs TTS** - Premium multilingual text-to-speech
- [x] **32+ Languages** - Full ElevenLabs language support
- [x] **Native Language Voices** - Italian voices for Italian, Chinese for Chinese, etc.
- [x] **Shared Voice Library** - Access to 3,000+ community voices
- [x] **Voice Preview** - Pre-hosted preview URLs (no API auth needed)
- [x] **Auto-Translate** - English → target language via LibreTranslate
- [x] **Language Availability Modal** - Explains which languages have translation configured
- [x] **Availability Indicators** - ✓ badge on supported languages in dropdown
- [x] **Voice Settings** - Stability and similarity boost sliders
- [x] **Model Selection** - Multilingual v2, Flash v2.5, Turbo v2.5
- [x] **Format Options** - MP3 (44.1kHz), PCM, Opus
- [x] **UI Matching** - Generated audio styling matches Deepgram (badges, text preview)

### Phase 13.5: Translate Collections ✅ PRODUCTION DEPLOYED (Jan 22-24, 2026)
- [x] **Collections API** - Full CRUD via `server/routes/collections.ts`
- [x] **Collection Service** - Migrated from localStorage to API calls
- [x] **Audio Collection Type** - New `audio_collection` type with metadata
- [x] **Deepgram Batch Generation** - `POST /api/audio/generate-batch` endpoint
- [x] **ElevenLabs Batch Generation** - `POST /api/elevenlabs/generate-batch` endpoint
- [x] **AudioCollectionModal** - UI for multi-language batch generation
- [x] **Provider Routing** - Modal routes to correct endpoint based on provider
- [x] **ElevenLabs Voice Selection** - Single voice for all languages (Multilingual v2)
- [x] **ElevenLabs Audio Quality** - Format selector (MP3 22-192kbps, PCM, μ-law)
- [x] **Deepgram Voice Dropdowns** - Always visible for all languages (not just when checked)
- [x] **Collections View** - Volume2 icon for audio collections (purple styling)
- [x] **CollectionDetail Audio UI** - Playback, language badges, voice info, file size
- [x] **Text Preview** - Show source text and translated text per language
- [x] **Success Modal** - Detailed metadata display after batch generation with "Stay & Continue" / "View Collection" options
- [x] **PRODUCTION DEPLOYED** - Coolify deployment successful ✅

### Phase 14: Audio UX Improvements ✅ (Jan 24, 2026)
- [x] **TextPreviewModal** - Click truncated text in audio lists to see full content
- [x] **Copy to Clipboard** - One-click copy of full text from modal
- [x] **Character Count** - Shows text length in preview modal
- [x] **Voice & Language Display** - Context badges in preview modal
- [x] **Both Tabs Support** - Works in Deepgram and ElevenLabs tabs
- [x] **ElevenLabs Guardrails** - Extensive documentation preventing voice slot issues

### Phase 15: Positioning Editor & QR Generator ✅ (Jan 24, 2026)
- [x] **PositioningEditorModal** - New tabbed modal replacing QRCodeEditorModal
- [x] **7 Technology Tabs** - QR Code, GPS, BLE Beacon, NFC, RFID, WiFi, UWB
- [x] **Tab Icons** - QrCode, MapPin, Radio, Smartphone, Scan, Wifi, Target
- [x] **Placeholder Tabs** - "Coming Soon" badges with use cases for each technology
- [x] **Technology Hints** - Color-coded hints specific to each positioning method
- [x] **qrcode.react Package** - Native SVG QR generation (8.7M weekly downloads)
- [x] **Regenerate Button** - Creates NEW QR with unique URL token + short code
- [x] **URL Tokens** - Each QR has unique `?t=xxxxxxxx` for tracking
- [x] **PNG Download** - High-quality 500px PNG with white background
- [x] **Short Code Backup** - Manual entry fallback for accessibility
- [x] **Signage Tips** - Print size, placement, and backup code guidance
- [x] **Docs** - `docs/positioning-tech.md` with full implementation plan

### 🔄 Phase 4: Block Import Integration ✅ COMPLETE (Jan 24, 2026)
- [x] **Audio Block Import** - Import collection into `audioFiles` + `transcript`
- [x] **Timeline Gallery Import** - Import collection audio (single language mode)
- [x] **Collection Picker Modal** - `CollectionPickerModal.tsx` with search, preview, multi/single modes
- [x] **Auto-populate Languages** - Map collection items to block language fields
- [x] **Audio Block Multi-Language Switch** - Switching languages changes BOTH audio AND text! 🎊

> **Known Limitation:** Timeline Gallery uses single `audioUrl` (not `audioFiles`), so audio doesn't switch on language change. Transcript text DOES switch. This is by design for timeline sync.

### � Phase 16: Visitor Experience System (IN PROGRESS - Jan 25, 2026)- [x] **Tour Block** - Hero intro block with full-screen image, title, description, CTA button
- [x] **Architectural Design System** - Clean minimalist typography, monochrome palette, border-style badges
- [x] **Multilingual Support** - LanguageSwitcher + MagicTranslateButton for all text fields
- [x] **Responsive Full-Height** - `min-h-[100dvh]` fills tablet/phone screens properly
- [x] **3 Layout Variants** - Bottom aligned, centered, card overlay
- [x] **CTA Customization** - Primary/secondary/outline/ghost styles, next-stop/specific-stop/external actions- [ ] **Visitor Routes** - `/visitor/tour/:tourId/stop/:stopId` pages
- [ ] **Reuse StopContentBlock** - Same rendering as admin preview
- [ ] **"Back to Admin" Button** - For staff viewing visitor pages
- [ ] **Token Validation** - Verify `?t=TOKEN` from QR codes
- [ ] **Published Check** - Only show published tours to visitors
- [ ] **Language Selector** - Visitor-friendly language switching

### Phase 19: AI Tools Integration (Part 1) ✅ (Jan 27, 2026)
- [x] **AI Dashboard** - `/ai-assistance` portal for all AI tools
- [x] **Smart Tag Generator** - Logic for Image-to-Text extraction
- [x] **Visual Tagging** - Google Vision API integration for label detection
- [x] **Manual Tag Editing** - Add/Remove tags with interactive UI
- [x] **Smart Titles** - Web entity detection for "Best Guess" titles
- [x] **Production Ready** - API Key security + Coolify env var support

### 🎯 Phase 17: Stop Navigation & Links (Planned)
- [ ] **Next/Previous Buttons** - Navigate between stops
- [ ] **Stop List View** - See all stops in tour
- [ ] **Related Stops** - Curator-defined links between stops
- [ ] **Tour Progress** - Visual completion indicator
- [ ] **Tour Map View** - Interactive map with all stops

### 🎯 Phase 18: GPS Positioning Tab (Planned)
- [ ] Reuse Map Block components (Leaflet/Google Maps)
- [ ] Geofence radius visualization with circle overlay
- [ ] "Get Current Location" button
- [ ] Lat/Long input with map click selection

### 🔄 Phase 3: Collections View Enhancement (Lower Priority)
- [ ] **Collection Filtering** - Filter tabs (All | Images | Audio)
- [ ] **Bulk Download** - Download all languages as ZIP

> **Architecture Note:** ElevenLabs uses a SINGLE voice for ALL languages via the Multilingual v2 model. The model handles pronunciation/accent automatically. Deepgram uses per-language voice selection.

---

## 📋 Next Steps (Priority Order)

### 🔄 IN PROGRESS: AI Tools (Phase 2)
> Next Up: Caption Generator using Generative AI (Gemini).

- **Caption Writer**: Use Gemini to generate natural language descriptions of artifacts.
- **Smart Cataloging**: Integrate tagging into the main Media Library upload flow.

### ⏸ PAUSED: Visitor Experience System

### ✅ COMPLETED: Import Collections into Blocks
> Phase 4 is complete! Both Audio Block and Timeline Gallery now support importing from collections.

**What Works:**
- **Audio Block**: Full multi-language import - switches BOTH audio AND text on language change! 🎊
- **Timeline Gallery**: Single-language import - audio stays fixed, transcript switches languages
- **CollectionPickerModal**: Reusable picker with search, preview, multi/single modes

### 1. 🟢 Timeline Gallery Multi-Language Audio (Optional Enhancement)
> Currently uses single `audioUrl`. Could add `audioFiles` for full multi-lang support.

**Current Limitation:**
- Timeline Gallery has `audioUrl: string` (single audio)
- Transcript text switches on language change ✅
- Audio does NOT switch (by design for timeline sync)

**Future Enhancement (if needed):**
```typescript
// Add to TimelineGalleryBlockData:
audioFiles?: { [lang: string]: string }; // Per-language audio URLs
```

### 2. 🟡 Timeline Gallery Enhancements
- Ken Burns Effect (Pan & Zoom) - use Framer Motion `useDrag` for editor
- Additional transitions (Slide, Zoom) - use Framer Motion variants
- Closed captioning editor

### 3. 🔵 JSON Export/Import
- Full export (includes media URLs)
- Import with validation
- Mobile app format

### 4. 🟡 Audio Player Enhancements
- Playlist support (multiple audio files)
- Chapter markers/sections
- Download option for audio files

---

## 📁 Key Files

| Purpose | Path |
|---------|------|
| **Tour Block** | |
| Tour Block Editor | `app/src/components/blocks/TourBlockEditor.tsx` |
| Stop Content Block | `app/src/components/blocks/StopContentBlock.tsx` |
| Tour Block Types | `app/src/types/index.ts` (TourBlockData) |
| **API Server** | |
| Express Server | `app/server/index.ts` |
| Media Upload | `app/server/routes/media.ts` |
| Stops API | `app/server/routes/stops.ts` |
| **Timeline Gallery** | |
| Editor Modal | `app/src/components/blocks/TimelineGalleryEditorModal.tsx` |
| Waveform | `app/src/components/blocks/AudioWaveform.tsx` |
| **Stop Editor** | |
| Stop Editor | `app/src/components/StopEditor.tsx` |
| Tour Detail | `app/src/pages/TourDetail.tsx` |
| **Map Block** | |
| Map Preview | `app/src/components/blocks/MapPreview.tsx` |
| Map Editor Modal | `app/src/components/blocks/MapEditorModal.tsx` |
| Map Block Editor | `app/src/components/blocks/MapBlockEditor.tsx` |
| Settings API | `app/server/routes/settings.ts` |
| **Audio TTS** | |
| Audio Page | `app/src/pages/Audio.tsx` |
| TextPreviewModal | `app/src/components/TextPreviewModal.tsx` |
| Deepgram API Routes | `app/server/routes/audio.ts` |
| Deepgram Service | `app/src/services/audioService.ts` |
| **ElevenLabs TTS** | |
| ElevenLabs API Routes | `app/server/routes/elevenlabs.ts` |
| ElevenLabs Service | `app/src/services/elevenlabsService.ts` |
| ElevenLabs Voice Issue | `docs/ELEVENLABS-VOICES-ISSUE.md` |
| Translation API | `app/server/routes/translate.ts` |
| Translation Service | `app/src/services/translationService.ts` |
| **Collections (Audio & Images)** | |
| Collections API | `app/server/routes/collections.ts` |
| Collection Service | `app/src/lib/collectionService.ts` |
| AudioCollectionModal | `app/src/components/AudioCollectionModal.tsx` |
| Collections Page | `app/src/pages/Collections.tsx` |
| Collection Detail | `app/src/pages/CollectionDetail.tsx` |

---

## 🔧 Commands

> [!CAUTION]
> **ALWAYS use `npm run dev:all`** to start development!  
> Running only `npm run dev` (Vite) will cause API errors like `Cannot POST /api/...`  
> The app requires BOTH the Vite frontend AND the Express API server.

```bash
cd app
npm install           # Install dependencies
npm run dev:all       # ⭐ REQUIRED: Run both Vite + Express concurrently
# Individual commands (for debugging only):
# npm run dev         # Vite dev server only (localhost:5173)
# npm run server      # Express API only (localhost:3000)
```

---

## 🛡️ Deployment Guardrails (CRITICAL!)

> [!IMPORTANT]
> **ALWAYS run `npm run typecheck` before committing!**  
> TypeScript errors will fail the Coolify build. Catch them locally first.

### Pre-Commit Hook (Automatic)
A Git pre-commit hook automatically runs TypeScript checks before every commit:
- Located at `.git/hooks/pre-commit`
- Blocks commits if TypeScript errors exist
- To bypass (NOT RECOMMENDED): `git commit --no-verify`

### Available Scripts
```bash
cd app
npm run typecheck     # ⭐ Run TypeScript check (no emit)
npm run precommit     # TypeScript + ESLint check
npm run build         # Full build (includes typecheck via prebuild)
```

### Before Every Deployment
1. **Run `npm run typecheck`** - Catches TS errors
2. **Run `npm run build`** - Verifies full build works
3. **Commit and push** - Pre-commit hook provides safety net

### Common TypeScript Errors
| Error | Fix |
|-------|-----|
| `TS6133: declared but never read` | Remove unused variable or prefix with `_` |
| `TS2304: Cannot find name` | Add missing import |
| `TS2345: Argument type mismatch` | Fix type or add type assertion |

---

## 🚀 Coolify Deployment

> ⚠️ **CRITICAL**: Read [docs/COOLIFY-DEPLOYMENT.md](docs/COOLIFY-DEPLOYMENT.md) before deploying!

### Required Volume Mounts (MUST BE CORRECT!)

| Container Path | Purpose |
|---------------|---------|
| `/app/uploads` | Audio/image files |
| `/app/data` | SQLite database |

> 🚨 **NEVER mount to `/app/dev.db`** - Docker volumes create DIRECTORIES, not files!

### Deployment Verification

After deploying, check logs for:
```
✅ GOOD: "⏭ Template already exists: QR Code"
❌ BAD:  "✓ Created template: QR Code"  ← Data was lost!
```

### Database Architecture

- **Engine:** Prisma 5.21.1 (pinned version)
- **File:** `/app/data/dev.db`
- **Init:** `prisma db push` (safe, non-destructive)
- **Seed:** Idempotent (skips existing data)
