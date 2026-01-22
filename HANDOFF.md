# TourStack Handoff Document 📋

**Last Updated**: January 22, 2026  
**Session Status**: Audio TTS Section Complete ✅

---

## 🏗️ Architecture Overview

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

---

## 📋 Next Steps (Priority Order)

### 1. 🟢 Timeline Gallery Enhancements
- Ken Burns Effect (Pan & Zoom) - use Framer Motion `useDrag` for editor
- Additional transitions (Slide, Zoom) - use Framer Motion variants
- Closed captioning editor

### 2. 🔵 JSON Export/Import
- Full export (includes media URLs)
- Import with validation
- Mobile app format

### 3. 🟡 Audio Player Enhancements
- Playlist support (multiple audio files)
- Chapter markers/sections
- Download option for audio files

---

## 📁 Key Files

| Purpose | Path |
|---------|------|
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
| Audio API Routes | `app/server/routes/audio.ts` |
| Audio Service | `app/src/services/audioService.ts` |

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
