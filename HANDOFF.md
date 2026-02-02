# TourStack Handoff Document 📋

**Last Updated**: February 1, 2026
**Session Status**: Phase 25 Document Collections COMPLETE ✅ | Phase 24 Translation View COMPLETE ✅ | Phase 23a Collections ↔ Media Library Sync COMPLETE ✅

---

## ⛔️ CRITICAL: APP DIRECTORY ⛔️

```
┌──────────────────────────────────────────────────────────────┐
│  🚨 ALL CODE & COMMANDS ARE IN THE /app SUBDIRECTORY! 🚨     │
│                                                              │
│  WORKSPACE ROOT:  /Users/paulhenshaw/Desktop/TourStack       │
│  APP DIRECTORY:   /Users/paulhenshaw/Desktop/TourStack/app   │
│                                                              │
│  ❌ NEVER run npm from TourStack root - no package.json!     │
└──────────────────────────────────────────────────────────────┘
```

---

## ⛔️ CRITICAL: SERVER STARTUP - READ THIS FIRST ⛔️

```
┌────────────────────────────────────────────────────────────────────────┐
│  🚨🚨🚨 THE ONLY WAY TO START THE APP 🚨🚨🚨                            │
│                                                                        │
│  cd /Users/paulhenshaw/Desktop/TourStack/app                           │
│  npm run start                                                         │
│                                                                        │
│  ✅ This is the ONLY correct way to start TourStack!                   │
│  ✅ Kills zombie processes on ports 3000 and 5173                      │
│  ✅ Waits 2 seconds for ports to free up                               │
│  ✅ Starts BOTH Vite (5173) AND Express (3000) servers                 │
│                                                                        │
│  ❌ NEVER use: npm run dev                (Vite only - API will FAIL)  │
│  ❌ NEVER use: npm run server             (Express only - no frontend) │
│  ❌ NEVER use: npm run dev:all directly   (doesn't kill zombies)       │
│  ❌ NEVER just run typecheck and assume app works                      │
│                                                                        │
│  TWO SERVERS MUST BE RUNNING:                                          │
│  • Port 5173 = Vite (frontend)                                         │
│  • Port 3000 = Express (API server)                                    │
│                                                                        │
│  VERIFY with: lsof -i :3000 -i :5173 | grep LISTEN                     │
│  Should show TWO node processes!                                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 PRODUCT VISION: One App For Everything

> **TourStack is a unified SaaS platform** - Admin CMS + Visitor App + Field Tools in ONE application.

| Mode | Routes | Purpose |
|------|--------|---------|
| **Admin** | `/tours/*`, `/stops/*` | Create & manage tour content |
| **Visitor** | `/visitor/*` | Public-facing tour experience

### ✅ COMPLETE: Visitor Experience System (production)
> The public-facing tour view is fully operational with navigation, language switching, and staff preview mode.

- **Visitor Routes**: `/visitor/tour/:tourId/stop/:stopId` ✅
- **Route Validation**: QR code `?t=TOKEN` parameter support ✅
- **Published Check**: Only shows published tours to visitors ✅
- **Test URL**: `http://localhost:5173/visitor/tour/[tourId]/stop/[stopId]`

### ✅ NEW: Kiosk Launch System (Phase 2 Complete)
> Advanced kiosk configuration for museum deployments. See [docs/kiosk-dev.md](docs/kiosk-dev.md) for full planning.

**Phase 1 (Complete):**
- **Run Tour Button**: Green button on published tours (TourCard + TourDetail)
- **Preview Button**: Secondary button on draft tours (staff-only viewing)
- **Auto First Stop**: Queries first stop and opens visitor view in new tab

**Phase 2 (Complete):**
- **Kiosk Launcher Modal**: Configure language, start stop, and kiosk options
- **URL Parameters**: `lang`, `fullscreen`, `hideNav`, `autoRestart`, `kiosk`
- **Fullscreen API**: Toggle button in kiosk mode, auto-request on launch
- **Auto-restart**: "Start Over" button at tour completion
- **Hide Navigation**: Conditionally hide prev/next for linear tours
- **Kiosk Button**: Monitor icon button on TourCard and TourDetail

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
cd /Users/paulhenshaw/Desktop/TourStack/app
npm run start         # ⭐ THE ONLY WAY: Kills zombies + starts BOTH servers
```

> ⚠️ **CRITICAL**: See "SERVER STARTUP" section above. NEVER use `npm run dev:all` directly!

**Current Status:** Both servers running ✅
**Local Testing:** Fully tested ✅ - QR codes auto-generate with unique URLs & short codes!
- Frontend: http://localhost:5173
- API Server: http://localhost:3000
- Database: 12 Deepgram audio files, 18 ElevenLabs audio files loaded

---

## 🔐 LOGIN SYSTEM

### Overview
TourStack uses session-based authentication to protect the admin panel.

**Default Login:** Password is `admin` (when `ADMIN_PASSWORD` not set)

### Route Protection

| Route | Auth Required | Notes |
|-------|---------------|-------|
| `/login` | No | Login page |
| `/visitor/*` | No | Public visitor pages |
| `/docs/*` | No | Documentation |
| `/api/auth/*` | No | Auth endpoints |
| `/api/visitor/*` | No | Visitor API |
| `/api/health` | No | Health check |
| `/*` (all other) | **Yes** | Admin panel |
| `/api/*` (all other) | **Yes** | Admin APIs |

### Environment Variables (Coolify Production)

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_PASSWORD` | **Yes** | Admin password (defaults to "admin" if not set) |
| `SESSION_SECRET` | **Yes** | Random 32+ char string for session encryption |

### Key Files
- `app/server/middleware/auth.ts` - Session middleware
- `app/server/routes/auth.ts` - Login/logout/check endpoints
- `app/src/pages/Login.tsx` - Login page component
- `app/src/stores/useAuthStore.ts` - Auth state (Zustand)

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

## 🔥 Server Troubleshooting

**Symptom**: API errors, `Cannot POST /api/*`, `net::ERR_CONNECTION_REFUSED`

**Fix**: Just run start again - it kills zombies automatically:
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npm run start
```

**Verify both servers running:**
```bash
lsof -i :3000 -i :5173 | grep LISTEN
# Should show TWO node processes - one on 3000, one on 5173
```

**If you see port 5174 instead of 5173**, a zombie is still running. Run `npm run start` again.

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

### ✅ Phase 16: Visitor Experience System (COMPLETE - Jan 29, 2026)
- [x] **Tour Block** - Hero intro block with full-screen image, title, description, CTA button
- [x] **Architectural Design System** - Clean minimalist typography, monochrome palette, border-style badges
- [x] **Multilingual Support** - LanguageSwitcher + MagicTranslateButton for all text fields
- [x] **Responsive Full-Height** - `min-h-[100dvh]` fills tablet/phone screens properly
- [x] **3 Layout Variants** - Bottom aligned, centered, card overlay
- [x] **CTA Customization** - Primary/secondary/outline/ghost styles, next-stop/specific-stop/external actions
- [x] **Visitor Routes** - `/visitor/tour/:tourId/stop/:stopId` pages (VisitorStop.tsx)
- [x] **Reuse StopContentBlock** - Same rendering as admin preview with mode="view"
- [x] **"Back to Admin" Button** - Staff preview mode with admin banner
- [x] **Token Validation** - QR code `?t=TOKEN` parameter support
- [x] **Published Check** - Only shows published tours (staff can preview drafts)
- [x] **Language Selector** - Dropdown language switcher in visitor view
- [x] **Stop Navigation** - Previous/Next buttons with full tour navigation
- [x] **Progress Indicator** - Visual dots showing position in tour sequence
- [x] **Display Settings FAB** - Staff-only toggle for titles/descriptions visibility
- [x] **Public API Endpoints** - `/api/visitor/tour/:slug`, `/api/visitor/s/:shortCode`

> **Test URL:** `http://localhost:5173/visitor/tour/[tourId]/stop/[stopId]`
> **Components:** VisitorStop.tsx, DisplaySettingsPanel.tsx, StopContentBlock.tsx
> **API Routes:** server/routes/visitor.ts

**Known Limitations:**
- Display settings (show titles/descriptions) not persisted to database
- No public tour gallery/discovery page
- Interactive blocks (quiz, poll, challenges) rendering not implemented

### Phase 19: AI Object Analysis ✅ (Jan 28, 2026)
- [x] **AI Dashboard** - `/ai-assistance` portal for all AI tools
- [x] **AI Object Analysis** - Forensic-grade artifact analysis suite
- [x] **Visual DNA** - Mood, lighting, style, and context analysis
- [x] **Dominant Colors** - Color palette extraction with HEX and names
- [x] **Object Detection** - Identifies artifacts within images
- [x] **OCR Text Extraction** - Transcribes labels and plaques with high precision
- [x] **Web Detection** - "Best Guess" identification of famous works
- [x] **Interactive Tagging** - AI-generated tags with manual add/remove
- [x] **Sticky Header Fix** - Geometry fix (`-top-6`) for flush viewport positioning
- [x] **Production Ready** - API Key security + Coolify env var support

### Phase 20: Media Library ✅ (Jan 29, 2026)
- [x] **Media Library Page** - `/media` with responsive grid (1-5 columns)
- [x] **Smart Search** - Filter by filename, alt text, caption, or tags
- [x] **Type Filtering** - All / Images / Audio / Video / Documents tabs
- [x] **Sort Options** - By date, name, or size (asc/desc)
- [x] **Bulk Operations** - Multi-select, bulk delete, bulk tagging
- [x] **Media Detail Modal** - Two-column layout with preview + metadata
- [x] **Image Preview** - Full preview with click-to-expand fullscreen
- [x] **Audio Preview** - wavesurfer.js waveform with play/pause controls
- [x] **Video Preview** - HTML5 video player with native controls
- [x] **Metadata Editing** - Alt text, caption, tags with save functionality
- [x] **Where Used Tracking** - Shows Tours/Stops using each media item
- [x] **AI Image Analysis** - Gemini integration with Apply Tags/Description buttons
- [x] **Sync Feature** - Scans `/uploads` folders, populates database for existing files
- [x] **Schema Enhancement** - Added `width`, `height`, `duration` fields to Media model
- [x] **API Endpoints** - GET/PUT/DELETE single, bulk operations, usage tracking, sync
- [x] **Production Ready** - Persistent `/app/uploads` volume for Coolify

### Phase 21: Collections Enhancement ✅ (Jan 31, 2026)
- [x] **CollectionTypeModal** - Beautiful 2x2 grid for selecting collection type (Images/Audio/Video/Documents)
- [x] **ImageCollectionWizard** - 4-step guided wizard: Details → Upload → AI Analysis → Review
- [x] **Drag & Drop Upload** - Multi-image upload via react-dropzone
- [x] **Batch AI Analysis** - "Analyze All" button with per-image progress tracking
- [x] **CollectionImageCard** - Reusable card with AI metadata badges (pending/analyzing/complete)
- [x] **CollectionItemAnalysisModal** - Full-screen AI analysis viewer with navigation between items
- [x] **AddItemWizard** - 3-step wizard for adding items to existing collections (same UX as creation)
- [x] **ConfirmationModal** - Reusable modal replacing browser `alert()` and `confirm()` dialogs
- [x] **Save Success Modal** - Beautiful green success confirmation for collection saves
- [x] **Delete Confirmation** - Red danger modal with cancel/confirm for destructive actions
- [x] **Edit Collection Modal** - Update name and description for existing collections
- [x] **Placeholder Modals** - "Coming Soon" for Video and Document collections
- [x] **Documentation** - Comprehensive `docs/collections-dev.md` guide

> **Key Components:**
> - `src/components/collections/` - CollectionTypeModal, ImageCollectionWizard, CollectionImageCard, CollectionItemAnalysisModal, AddItemWizard
> - `src/components/ui/ConfirmationModal.tsx` - Reusable confirmation modal with variants
> - `src/pages/Collections.tsx` - Updated with type selection and wizard flow
> - `src/pages/CollectionDetail.tsx` - Updated with AddItemWizard and confirmation modals

### Phase 22: Collection Translations ✅ (Jan 31, 2026)
- [x] **MultilingualAIAnalysis Type** - New wrapper type for AI analysis translations in `types/media.ts`
- [x] **Batch Translation API** - Server-side `/api/translate/batch` endpoint for 10-15x faster translations
- [x] **translateAnalysis()** - Optimized function using parallel batch requests per language
- [x] **Language Tabs in Modal** - LanguageSwitcher in CollectionItemAnalysisModal header
- [x] **Per-Image Translation** - Click "Translate" button to generate translations for single image
- [x] **Batch Translation in Wizard** - Step 4 "Translate All X Images" with progress tracking
- [x] **Translation Status Badges** - Blue Languages icon on translated images
- [x] **Language Picker in Detail View** - Switch languages while browsing collection
- [x] **Delete Confirmation Modal** - Custom ConfirmationModal replaces browser confirm() for collection deletion

> **Key Components:**
> - `src/services/translationService.ts` - `translateBatch()`, `translateAnalysis()` optimized
> - `src/components/collections/CollectionItemAnalysisModal.tsx` - Language tabs + translate button
> - `src/components/collections/CollectionImageCard.tsx` - Translation status badges
> - `src/pages/CollectionDetail.tsx` - Language switcher in header
> - `server/routes/translate.ts` - New `/batch` endpoint

> **Performance:** Before: 112 sequential API calls (~15-20s). After: 8 parallel batch calls (~1-2s)

### Phase 23a: Collections ↔ Media Library Sync ✅ (Feb 1, 2026)
- [x] **Database Schema** - Added `aiMetadata` and `aiTranslations` fields to Media model
- [x] **TypeScript Types** - Updated Media interface with AI analysis fields
- [x] **Media API Enhancement** - PUT endpoint now accepts AI metadata
- [x] **Sync Endpoints** - New `/api/media/sync-by-url` and `/api/media/sync-batch` endpoints
- [x] **Media Library Persistence** - AI analysis now saved when clicking "Save Changes"
- [x] **Initial Analysis Support** - ImageAnalysisPanel loads existing analysis from database
- [x] **Auto-Sync on Collection Save** - Collections automatically sync AI metadata to Media Library
- [x] **Documentation** - Comprehensive `docs/collections-media-sync.md` guide

> **Key Components:**
> - `app/prisma/schema.prisma` - Media model with aiMetadata, aiTranslations fields
> - `app/src/types/media.ts` - Updated Media interface
> - `app/server/routes/media.ts` - Sync endpoints
> - `app/server/routes/collections.ts` - Auto-sync on create/update
> - `app/src/components/media/ImageAnalysisPanel.tsx` - initialAnalysis + onAnalysisComplete
> - `app/src/components/media/MediaDetailModal.tsx` - Tracks and saves aiMetadata
> - `docs/collections-media-sync.md` - Full documentation

> **Data Flow:** When a collection with AI-analyzed images is saved, the analysis automatically syncs to corresponding Media Library records (matched by URL).

### Phase 24: Translation View ✅ (Feb 1, 2026)
- [x] **Languages.tsx** - New standalone Translation Tools page
- [x] **Tabbed Provider Interface** - Following Audio.tsx pattern
- [x] **LibreTranslate Active** - Using existing translate.ts backend
- [x] **9 Languages** - en, es, fr, de, it, pt, ja, ko, zh
- [x] **Two-Panel Translation** - Source → Target with swap button
- [x] **File Translation** - Support for txt, docx, pdf, etc.
- [x] **Quick Phrases** - Museum-specific phrases (Wayfinding, Safety, Audio Guide, Accessibility)
- [x] **Translation History** - Session-based history with recall
- [x] **8 Provider Placeholders** - DeepL, Google, Azure, Amazon, Argos, OpenNMT, Bergamot, Marian

> **Key Files:**
> - `app/src/pages/Languages.tsx` - Main translation view (1,266 lines)
> - `app/src/App.tsx` - Updated route from ComingSoon to Languages

> **Provider Categories:**
> - **Cloud APIs**: DeepL (best quality), Google Cloud, Microsoft Azure, Amazon Translate
> - **Self-Hosted**: LibreTranslate (active), Argos, OpenNMT, Bergamot, Marian NMT

### Phase 25: Document Collections ✅ (Feb 1, 2026)
- [x] **DocumentCollectionWizard** - Simplified 3-step wizard: Details → Upload → Review
- [x] **Multi-Format Text Extraction** - PDF, DOCX, DOC, RTF, ODT, PPTX via `officeparser`
- [x] **Server-Side Extraction API** - `POST /api/documents/extract-text-base64` endpoint
- [x] **AI Analysis Tools** - Summarize, Extract Facts, Generate FAQ, Auto-Tag
- [x] **DocumentAIToolsPanel** - Full-width panel with Single/Batch modes
- [x] **Batch Document Selection** - Checkbox UI for selecting specific documents
- [x] **Batch Results Display** - Success/failure status per document processed
- [x] **Auto-Save Persistence** - AI analysis results save to database immediately
- [x] **Compact Document Grid** - 4-column responsive layout on collection detail

> **Key Components:**
> - `src/components/collections/DocumentCollectionWizard.tsx` - 3-step upload wizard
> - `src/components/collections/DocumentAIToolsPanel.tsx` - AI tools with fullWidth support
> - `src/pages/CollectionDetail.tsx` - Integrated document view with AI panel
> - `server/routes/documents.ts` - Text extraction API using officeparser
> - `server/routes/gemini.ts` - `POST /api/gemini/analyze-text` for AI tools

> **Supported Document Formats:**
> | Format | Extension | Method |
> |--------|-----------|--------|
> | PDF | `.pdf` | officeparser |
> | Word | `.docx`, `.doc` | officeparser |
> | Rich Text | `.rtf` | officeparser |
> | OpenDocument | `.odt` | officeparser |
> | PowerPoint | `.pptx` | officeparser |
> | Plain Text | `.txt` | Browser (client-side) |

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

### ✅ Phase 3: Collections View Enhancement (Complete via Phase 21)
- [x] **Collection Type Selection** - Modal with Images/Audio/Video/Documents options
- [x] **Image Collection Wizard** - Guided creation with AI analysis
- [x] **Add Items Wizard** - Same UX for adding to existing collections
- [ ] **Collection Filtering** - Filter tabs (All | Images | Audio) - Lower priority
- [ ] **Bulk Download** - Download all languages as ZIP - Lower priority

> **Architecture Note:** ElevenLabs uses a SINGLE voice for ALL languages via the Multilingual v2 model. The model handles pronunciation/accent automatically. Deepgram uses per-language voice selection.

---

## 📋 Next Steps (Priority Order)

### 🎯 PLANNED: AI Tools (Phase 2)
- **Caption Generator**: Use Gemini to generate natural language descriptions of artifacts.
- **Smart Cataloging**: Integrate AI analysis into the main Media Library upload flow.
- **Bulk Analysis**: Run analysis on entire collections.

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
| **Visitor Experience** | |
| Visitor Stop Page | `app/src/pages/VisitorStop.tsx` |
| Display Settings Panel | `app/src/components/DisplaySettingsPanel.tsx` |
| Visitor API Routes | `app/server/routes/visitor.ts` |
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
| CollectionTypeModal | `app/src/components/collections/CollectionTypeModal.tsx` |
| ImageCollectionWizard | `app/src/components/collections/ImageCollectionWizard.tsx` |
| CollectionImageCard | `app/src/components/collections/CollectionImageCard.tsx` |
| CollectionItemAnalysisModal | `app/src/components/collections/CollectionItemAnalysisModal.tsx` |
| AddItemWizard | `app/src/components/collections/AddItemWizard.tsx` |
| ConfirmationModal | `app/src/components/ui/ConfirmationModal.tsx` |
| Collections Dev Guide | `docs/collections-dev.md` |
| **Document Collections** | |
| Document Wizard | `app/src/components/collections/DocumentCollectionWizard.tsx` |
| AI Tools Panel | `app/src/components/collections/DocumentAIToolsPanel.tsx` |
| Documents API | `app/server/routes/documents.ts` |
| Documents Dev Guide | `docs/ai-chatbot-documents-dev.md` |
| **Media Library** | |
| Media Page | `app/src/pages/Media.tsx` |
| Media Service | `app/src/lib/mediaService.ts` |
| Media Types | `app/src/types/media.ts` |
| Media Card | `app/src/components/media/MediaCard.tsx` |
| Media Detail Modal | `app/src/components/media/MediaDetailModal.tsx` |
| Media Usage List | `app/src/components/media/MediaUsageList.tsx` |
| Image Analysis Panel | `app/src/components/media/ImageAnalysisPanel.tsx` |
| Audio Preview | `app/src/components/media/AudioPreview.tsx` |
| Video Preview | `app/src/components/media/VideoPreview.tsx` |
| Bulk Actions | `app/src/components/media/MediaBulkActions.tsx` |
| Media API Routes | `app/server/routes/media.ts` |
| Media Docs | `docs/media-view.md` |
| Collections ↔ Media Sync | `docs/collections-media-sync.md` |
| **Kiosk & Visitor Launch** | |
| Kiosk Dev Guide | `docs/kiosk-dev.md` |
| Tour Card (Run button) | `app/src/components/TourCard.tsx` |
| Tour Detail (Run button) | `app/src/pages/TourDetail.tsx` |

---

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
