# TourStack Handoff Document 📋

**Last Updated**: March 25, 2026
**Session Status**: Unified Preview System COMPLETE ✅ | iPad Orientation COMPLETE ✅ | Language Reconciliation COMPLETE ✅ | Session Management COMPLETE ✅ | UX Polish COMPLETE ✅ | Image Map Block COMPLETE ✅ | NFC Tag Pairing Phase 1 COMPLETE ✅ | GPS + Geofencing COMPLETE ✅ | Kiosk Preview COMPLETE ✅ | Database Safety COMPLETE ✅ | Translation Rework COMPLETE ✅ | Chatbot UX Unification COMPLETE ✅ | Map Block Upgrade COMPLETE ✅ | Image Block Enhancement COMPLETE ✅ | HTML/Embed Block COMPLETE ✅

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

**Phase 3 (Complete - Feb 18, 2026):**
- **Kiosk Preview Device**: Third device type in StopPreviewModal (frameless, fills available space)
- **Kiosk Chatbot**: Black circle chat button with white border in kiosk mode
- **showChatbot Toggle**: New option in KioskLauncherModal with `showChat` URL param
- **Dynamic Device Type**: VisitorStop detects `kiosk` param and adjusts width/layout
- **Tour Intro Height Fix**: Explicit height (not min-height) for CSS percentage chain resolution
- **Staff Banner Fix**: Absolute positioning when first block is Tour Intro

### Key Architecture Concept

**The Preview System IS the Visitor View** - same `StopContentBlock` components render in both:
- **Admin**: Preview modal with device frames (testing)
- **Visitor**: Full-screen pages via QR codes (production)

> ⚠️ **CRITICAL: Preview = Real Device Pixels**
>
> The preview device dimensions ARE the actual visitor screen:
> - **iPhone:** 375 × 812px (real device resolution)
> - **iPad:** 820 × 1180px portrait / 1180 × 820px landscape (real device resolution)
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
- Database: 12 Deepgram audio files, 18 ElevenLabs audio files, Google Cloud TTS files loaded

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
- URL format: `/visitor/tour/{tourSlug}/stop/{stopSlug}?t={token}`
- Short code: 6 uppercase chars (e.g., `MX4VPR`) - avoids confusing 0/O, 1/I
- **Regenerate button** creates completely new token + short code
- **PNG Download** exports 500px print-ready QR image

### API Persistence
The `primaryPositioning` field in each stop stores:
```json
{
  "method": "qr_code",
  "url": "https://tourstack.app/visitor/tour/.../stop/...?t=abc123",
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

## 📱 NFC TAG PAIRING (Phase 1 Complete - March 5, 2026)

### Overview
NFC tags allow visitors to tap their phone on a sticker/card to open tour content. The NFC tab in the Positioning Editor provides tools to pair NFC tags with tour stops.

### How It Works
- **NFC URL format:** `/visitor/tour/{tourSlug}/stop/{stopSlug}?src=nfc`
- **Same visitor routes as QR** — no server changes needed
- **`src=nfc` parameter** — tracks NFC vs QR scans for analytics

### NFC Tab Features (Positioning Editor Modal)
| Feature | Description |
|---------|-------------|
| **First Tab Position** | NFC is now the first tab in the modal |
| **Auto-generated URL** | Canonical visitor URL with `?src=nfc` |
| **Copy URL Button** | One-click copy for NFC Tools app |
| **Web NFC Write** | Direct tag writing (Chrome Android only) |
| **Help Modal** | Step-by-step pairing instructions |
| **Test Button** | Opens visitor URL to verify |

### Programming NFC Tags

**Method 1: Web NFC (Chrome Android)**
1. Open TourStack admin in Chrome on Android
2. Go to stop → Positioning Settings → NFC tab
3. Click "Write to NFC Tag"
4. Hold NFC card/sticker to back of phone
5. Wait for success confirmation

**Method 2: NFC Tools App (Any Phone)**
1. Download "NFC Tools" app (free, iOS/Android)
2. In TourStack, click "Copy URL"
3. In NFC Tools: Write → Add record → URL/URI
4. Paste URL and tap Write
5. Hold NFC tag to phone

### Testing NFC Tags
| Device | Behavior |
|--------|----------|
| iPhone XS+ | Tap tag → notification banner → tap to open Safari |
| Android | Tap tag → browser opens directly |
| iPhone 7/8/X | Requires NFC reader app to be open first |

### Key Files
- `app/src/components/PositioningEditorModal.tsx` — NFC tab UI and Web NFC write
- `app/server/routes/visitor.ts` — Visitor routes (same for NFC and QR)

### Documentation
See [docs/nfc-tag-dev.md](docs/nfc-tag-dev.md) for full NFC development roadmap and Phase 2 plans.

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

## Translation Architecture (Unified Provider System)

> [!IMPORTANT]
> TourStack supports **two translation providers**: Google Cloud Translation (195+ languages, fast cloud API) and LibreTranslate (9 languages, self-hosted). Users choose their preferred provider in **Settings > Translation**.

### Provider Configuration

| Provider | Languages | Config |
|----------|-----------|--------|
| **Google Cloud Translation** (default) | 195+ | `GOOGLE_VISION_API_KEY` env var or Settings UI |
| **LibreTranslate** (fallback) | 9 | `LIBRE_TRANSLATE_URL` env var or Settings UI |

### Architecture

All translation flows through a single shared backend service:

```
Frontend (translateText/translateBatch/magicTranslate)
  → POST /api/translate (provider-aware route)
    → app/server/services/translation.ts (shared service)
      → Google Cloud Translation API v2 OR LibreTranslate
```

### Key Files

| File | Purpose |
|------|---------|
| `app/server/services/translation.ts` | Shared backend translation service (all routes import from here) |
| `app/server/routes/translate.ts` | Provider-aware translation API route |
| `app/src/services/translationService.ts` | Frontend translation service |
| `app/src/constants/languages.ts` | Centralized language constants + native names |
| `app/src/hooks/useTranslationLanguages.ts` | React hook for dynamic language list from active provider |

### How Provider Selection Works

1. User sets default provider in **Settings > Translation > Default Translation Provider**
2. Backend reads `settings.json` + env var overrides via `getTranslationConfig()`
3. Frontend sends translation requests without specifying provider (backend uses Settings default)
4. Frontend can override provider per-request if needed (e.g., force `google_cloud`)

### Language Lists

- **Dynamic**: `useTranslationLanguages()` hook fetches `/api/translate/languages` from the active provider
- **Static fallback**: `LIBRE_TRANSLATE_LANGUAGES` in `constants/languages.ts` (9 languages, used when API unavailable)
- Tour modals (Create/Edit Tour) use the dynamic hook to show all available languages

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

### Phase 11: Map Block ✅ (Jan 21, 2026 — Upgraded March 23, 2026)
- [x] **OpenStreetMap Integration** - Leaflet-based maps (free, no API key)
- [x] **Google Maps Integration** - Premium maps with API key support
- [x] **Full-Screen Map Editor** - Click to place markers, address search, current location
- [x] **Provider Toggle** - Switch between OpenStreetMap and Google Maps
- [x] **Map Styles** - Standard, Satellite, Terrain, Hybrid
- [x] **Size Options** - Small (150px), Medium (250px), Large (full height)
- [x] **Trigger Zones** - Configurable radius for geofencing
- [x] **Settings API** - Persistent settings storage with env var overrides
- [x] **Coolify Ready** - `GOOGLE_MAPS_API_KEY` env var support for production

**March 23 Upgrade — Multi-Marker Parity with Image Map Block:**
- [x] **Multi-Marker Support** - Unlimited markers with click-to-place, 16 icon types, color picker
- [x] **Inline Marker Editing** - Editor expands in-place below clicked marker (no scroll-to-top)
- [x] **Translation Integration** - LanguageSwitcher + batch Translate All for marker titles & info text
- [x] **Source-Hash Dirty Tracking** - `_sourceHash` pattern for translation freshness
- [x] **Leaflet CSS Overrides** - Fixed Tailwind preflight breaking tile/marker rendering
- [x] **allowInteraction Toggle** - Pinch/zoom control per map block
- [x] **Custom Popup Styling** - Dark neutral theme (#1f2937 bg), compact auto-sizing, styled stop links
- [x] **Google Maps Full Parity** - InfoWindow stop links, auto-close previous, custom close button, dark theme
- [x] **XSS Prevention** - `escapeHtml()` for all user text in Leaflet and Google Maps popups
- [x] **Preview Button Fix** - `createPortal(document.body)` escapes Leaflet z-index stacking context
- [x] **Fit Bounds** - Auto-viewport to show all markers with padding
- [x] **Route Lines** - Dashed connecting lines between markers (toggleable)

### Image Block Enhancement ✅ (March 24, 2026)
- [x] **Format Picker** - Landscape (16:9), Square (1:1), Portrait (3:4), Full (edge-to-edge) with visual icons
- [x] **Focal Point + Crop** - Draggable crosshair on source image, crop preview with aspect ratio applied
- [x] **Full-Bleed Display** - Full format fills simulator screen using `calc()` width (not negative margins, which get clipped by `overflow-y-auto`)
- [x] **Lightbox** - Tap-to-zoom with pinch, pan, double-tap, swipe-down dismiss. Renders in-tree (NO portal) so it fills simulator screen, not browser
- [x] **Alt Text** - Per-language accessibility field with MagicTranslateButton
- [x] **Caption + Credit** - Per-language with MagicTranslateButton, credit shown in lightbox only
- [x] **Image Hotspots** - Full-screen editor with icon picker (16 types), color picker, tooltip/navigate/URL actions
- [x] **Hotspot Editor UX** - Always-visible hotspot list + edit panel, click between points, Save button, language pills, Translate All
- [x] **Comparison Block** - Before/after image slider with `clip-path: inset()`, horizontal/vertical orientation
- [x] **Translation** - LanguageSwitcher pills + MagicTranslateButton on all text fields (caption, credit, alt text, hotspot labels)
- [x] **Save Button** - All block editors now have Save dropdown (Save & Continue Editing / Save & Exit) via `onSave` callback chain from StopEditor
- [x] **2-Column Layout** - Image editor uses wide modal with image+format on left, text fields+hotspots on right

**Key files:**
- `app/src/components/blocks/ImageBlockEditor.tsx` — 2-column editor
- `app/src/components/blocks/StopContentBlock.tsx` — `ImageBlockView` preview rendering
- `app/src/components/ui/ImageLightbox.tsx` — Fullscreen lightbox (no portal)
- `app/src/components/blocks/ImageHotspotEditor.tsx` — Hotspot editor with save + language pills
- `app/src/components/blocks/BlockEditorModal.tsx` — Generic block editor wrapper with Save button
- `app/src/components/blocks/ComparisonBlockEditor.tsx` + `ComparisonPreview.tsx` — Before/after comparison

### Phase 32: HTML / Embed Block ✅ (March 25, 2026)
- [x] **New Block Type** - `html` content block for embeds, URLs, and raw HTML/CSS/JS
- [x] **3 Content Modes** - Embed Code (paste iframes), URL (auto-detect provider), Raw HTML (multilingual with JS)
- [x] **14 Embed Providers** - Auto-detection for Sketchfab, Matterport, YouTube, Vimeo, Spotify, SoundCloud, Google Arts/Maps/Forms, Typeform, Instagram, Twitter, CodePen, custom
- [x] **Sandboxed iframe Rendering** - Raw HTML renders via `<iframe srcdoc>` with `sandbox="allow-scripts allow-same-origin allow-popups"` — JavaScript executes safely
- [x] **Google Fonts + CSS** - `<link>` and `<style>` tags allowed in sanitizer, fonts load inside sandboxed iframe
- [x] **3 Sizing Modes** - Fill Screen (follows Tour Block pattern), Fixed Height (200-800px slider), Auto (aspect ratio or content)
- [x] **Full-Screen Preview** - Fill mode chains height through VisitorStop → StopPreviewModal → StopContentBlock → renderHtmlBlock
- [x] **Responsive Font Scaling** - Demo content uses CSS `clamp()` for fluid typography across iPhone/iPad/Kiosk
- [x] **Translation Integration** - Raw HTML mode has LanguageSwitcher + MagicTranslateButton (same pattern as TextBlockEditor)
- [x] **DOMPurify Sanitization** - 3-tier system: default (standard HTML), allowIframes (embed mode), sandboxed (scripts + SVG + forms for srcdoc)
- [x] **Pre-filled Demo Content** - New blocks start with museum-themed HTML demo featuring Playfair Display + Inter fonts, stat cards, blockquote, and JS tabbed widget
- [x] **Display Settings** - Max width pills (Small/Medium/Large/Full), rounded corners toggle (default off), lazy load, allow interaction
- [x] **Wide Editor Modal** - HTML block uses wide modal layout like Image block

**Key files:**
- `app/src/components/blocks/HtmlBlockEditor.tsx` — 3-mode editor with live preview
- `app/src/components/blocks/StopContentBlock.tsx` — `renderHtmlBlock()` with 3 sizing modes
- `app/src/lib/embedProviders.ts` — Provider auto-detection for 14 services
- `app/src/lib/htmlSanitizer.ts` — DOMPurify with 3-tier sanitization (default/iframe/sandboxed)
- `app/src/types/index.ts` — `HtmlBlockData`, `HtmlEmbedProvider` types
- `docs/html-block-dev.md` — Full development documentation

### Phase 28: Image Map Block ✅ (March 10, 2026)
- [x] **New Block Type** - `imageMap` content block for indoor floor plans
- [x] **Image Upload** - Upload floor plan images via existing media system
- [x] **Click-to-Place Markers** - Percentage-based coordinates, drag to reposition
- [x] **5 Marker Icons** - Pin, dot, number, star, info with 7+ color options
- [x] **Stop Linking** - Link markers to tour stops for visitor navigation
- [x] **Full-Screen Editor Modal** - `ImageMapEditorModal.tsx` with large canvas + sidebar
- [x] **Info Text Popups** - Glass-morphism popup overlays on visitor tap
- [x] **Multi-Floor Support** - `ImageMapFloor` type with floor switcher pills
- [x] **Pinch-to-Zoom** - Touch gestures for mobile visitors
- [x] **Translation Integration** - LanguageSwitcher + global Translate All via `magicTranslate()`
- [x] **Responsive Preview** - Width-based sizing, `w-full` on tablet/kiosk devices
- [x] **Dev Guide** - `docs/image-map-block-dev.md`

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

### Phase 26.1: AI Museum Concierge ✅ (Feb 2, 2026)
- [x] **Admin Configuration Page** - `/concierge` route with full configuration UI
- [x] **Persona Selection** - Friendly, Professional, Fun, Scholarly, Custom personas
- [x] **Welcome Message** - Multilingual JSON storage with per-language messages
- [x] **Language Configuration** - EN, ES, FR, DE toggles with primary language
- [x] **Knowledge Sources** - Import from document collections with extracted text
- [x] **Quick Actions** - Add, delete, drag-reorder buttons with multilingual labels
- [x] **Translate All** - Google Translate API for bulk translation
- [x] **Test Concierge** - Preview chat responses with configured knowledge
- [x] **ChatDrawer Integration** - Fetches dynamic config for visitor-facing chat

> **Database Tables:**
> - `ConciergeConfig` - Main configuration (persona, languages, welcome message)
> - `ConciergeKnowledge` - Knowledge sources (document imports, priority)
> - `ConciergeQuickAction` - Quick action buttons (question JSON, category, order)

> **Key Files:**
> - `app/src/pages/Concierge.tsx` - Admin configuration page
> - `app/src/lib/conciergeService.ts` - API client for concierge endpoints
> - `app/server/routes/concierge.ts` - API routes for config, knowledge, quick actions
> - `app/src/components/chat/ChatDrawer.tsx` - Visitor-facing chat integration

> **Bug Fixes Applied:**
> - 500 error: Database tables didn't exist, created via SQL
> - Import modal empty: Filter was `'documents'` but type is `'document_collection'`
> - Quick action text missing: JSON `question` field wasn't being parsed

> **Documentation:** See [docs/ai-chatbot-documents-dev.md](docs/ai-chatbot-documents-dev.md)

### Phase 27: Google Cloud TTS Integration ✅ (Feb 6, 2026)
- [x] **Google Cloud TTS** - Third TTS provider using Google Cloud Text-to-Speech API
- [x] **REST API Integration** - Uses `texttospeech.googleapis.com/v1` REST endpoints (no SDK needed)
- [x] **Shared API Key** - Reuses `GOOGLE_VISION_API_KEY` (same key for Vision, Google Translate, and TTS)
- [x] **Voice Types** - Neural2 + Standard voices filtered from 400+ available
- [x] **10 Languages** - en, es, fr, de, it, ja, nl, ko, pt, zh with BCP-47 code mapping
- [x] **Voice Preview** - Listen to any voice before generating
- [x] **3 Output Formats** - MP3, WAV (LINEAR16), OGG Opus
- [x] **4 Sample Rates** - 16kHz, 24kHz (default), 44.1kHz, 48kHz
- [x] **Speaking Rate & Pitch** - Adjustable speaking rate (0.25-4.0) and pitch (-20 to 20)
- [x] **Voice Caching** - Server-side voice list cache (1 hour) to reduce API calls
- [x] **Batch Collection Generation** - Multi-language batch generation with auto-translation
- [x] **Audio Page Tab** - Full Google Cloud tab with voice gallery, format selection, and generation
- [x] **Collection Integration** - AudioCollectionModal supports `google_cloud` provider
- [x] **Generated Files Tracking** - Files appear in Generated Files list with metadata
- [x] **CollectionDetail Display** - Shows "Google Cloud" provider badge for google_cloud collections

> **Key Files:**
> - `app/server/routes/google-tts.ts` - Backend Express route (~950 lines)
> - `app/src/services/googleTtsService.ts` - Frontend service layer
> - `app/src/pages/Audio.tsx` - GoogleCloudTab component
> - `app/src/components/AudioCollectionModal.tsx` - google_cloud provider support
> - `app/src/pages/CollectionDetail.tsx` - Google Cloud provider display

> **API Key:** Uses `GOOGLE_VISION_API_KEY` with HTTP Referer restriction. Requires `Referer: http://localhost:3000` header.

> **Bug Fixes Applied:**
> - Voice wrapper type mismatch: `gglVoices` is `{ voices: Record<...>, language }` wrapper, modal expected flat `Record<...>`. Fixed by passing `gglVoices?.voices ?? null`.
> - Batch files not appearing: Added `generatedAudioFiles.set()` and `saveMetadata()` calls in batch endpoint.
> - Collection showing wrong provider: Root cause was the voice wrapper type mismatch causing empty voice IDs.

### Phase 27: Unified Translation Provider System (Feb 7, 2026)
- [x] **Shared Backend Service** - `app/server/services/translation.ts` centralizes all translation logic
- [x] **Google Cloud Translation** - 195+ languages via Cloud Translation API v2
- [x] **Provider Selection** - Users choose Google Cloud or LibreTranslate in Settings
- [x] **Settings UI** - Google Cloud API key field, enable/disable toggle, provider selector
- [x] **Eliminated Duplication** - Removed ~200 lines of duplicate `translateText()` from 5 backend route files
- [x] **Dynamic Language Lists** - `useTranslationLanguages()` hook fetches languages from active provider
- [x] **Frontend Provider Routing** - All translation calls respect Settings default (no hardcoded provider override)
- [x] **Tour Language Selection** - Create/Edit Tour modals show all languages from active provider
- [x] **Updated Consumers** - 15+ files updated to use shared service and dynamic language lists

> **Files Created:**
> - `app/server/services/translation.ts` - Shared backend translation service
> - `app/src/constants/languages.ts` - Centralized language constants
> - `app/src/hooks/useTranslationLanguages.ts` - React hook for dynamic language list
>
> **Files Modified (backend):** settings.ts, translate.ts, google-translate.ts, audio.ts, elevenlabs.ts, google-tts.ts, concierge.ts, chat.ts
> **Files Modified (frontend):** translationService.ts, Settings.tsx, Audio.tsx, AudioCollectionModal.tsx, EditTourModal.tsx, CreateTourModal.tsx, Languages.tsx, StopEditor.tsx, TourDetail.tsx, BlockMetadataEditor.tsx, ImageBlockEditor.tsx, GalleryBlockEditor.tsx, TimelineGalleryBlockEditor.tsx, MagicTranslateButton.tsx, types/index.ts

### Phase 16.5.3: Kiosk Preview Mode ✅ (Feb 18, 2026)
- [x] **Kiosk Device Type** - Third device option in StopPreviewModal (phone/tablet/kiosk)
- [x] **Frameless Preview** - Kiosk fills available space without device frame borders
- [x] **Kiosk Chatbot Button** - Black circle with white border, positioned bottom-right
- [x] **showChatbot Toggle** - New option in KioskLauncherModal with `showChat` URL parameter
- [x] **Dynamic Device Detection** - VisitorStop reads `kiosk` URL param and adjusts layout
- [x] **Tour Intro Height Fix** - Replaced min-height with explicit height for CSS percentage chain
- [x] **Staff Banner Fix** - Absolute positioning when first block is Tour Intro (prevents push-down)
- [x] **Block Component Propagation** - `deviceType` prop added to 6 block components

> **Key Files Modified:**
> - `app/src/components/StopPreviewModal.tsx` - Added kiosk device type with frameless rendering
> - `app/src/components/KioskLauncherModal.tsx` - Added showChatbot toggle
> - `app/src/components/chat/ChatDrawer.tsx` - KioskChatButton component
> - `app/src/pages/VisitorStop.tsx` - Dynamic device type, kiosk widths, chat support
> - `app/src/components/blocks/StopContentBlock.tsx` - deviceType prop propagation
> - `app/src/types/index.ts` - Added `showChat` to KioskSettings

### Database Safety Infrastructure ✅ (Feb 18, 2026)
- [x] **Backup Script** - `app/scripts/backup-db.sh` creates timestamped backups before schema changes
- [x] **CLAUDE.md** - Project-level database safety rules (never use `prisma db push`)
- [x] **Dual Database Sync** - Backup script syncs `app/data/dev.db` and `app/prisma/data/dev.db`
- [x] **Auto-Cleanup** - Retains only last 10 backups in `app/prisma/data/backups/`
- [x] **Schema Cleanup** - Prisma schema reformatted for consistency (no structural changes)

> **Key Files:**
> - `CLAUDE.md` - Database safety rules for AI assistants
> - `app/scripts/backup-db.sh` - Database backup + sync script
> - `app/prisma/schema.prisma` - Cleaned up formatting

### Translation Rework (Image Map Phase 1.5) ✅ (March 18, 2026)

**Root cause fix:** Google Cloud Translation daily character quota was set to 5,000 — raised to 500,000.

**Server-side resilience:**
- [x] **Rate limiter** — Sliding window tracking (80K chars per 100s) prevents Google API "User Rate Limit Exceeded" errors
- [x] **Retry with backoff** — Exponential backoff (2 retries with jitter) on rate limit/quota errors
- [x] **Auto-fallback** — When Google rate-limits after retries, automatically falls back to LibreTranslate

**Frontend (Image Map editor):**
- [x] **Dirty tracking** — `_sourceHash` (djb2 hash) stored in multilingual field objects detects which fields changed since last translation — only changed fields are retranslated
- [x] **UI consolidation** — Removed scattered translate button from floor tab bar; added consolidated translate section in sidebar with context-aware labels ("Translate 3 changed fields" / "All current")
- [x] **Status indicators** — Per-floor dots (green/yellow) on floor tabs, per-marker dots in marker list
- [x] **Error handling** — Error/success banners replace silent failures; failed translation count shown to user

> **Key Files:**
> - `app/server/services/translation.ts` — Rate limiter, retry, auto-fallback to LibreTranslate
> - `app/src/components/blocks/ImageMapEditorModal.tsx` — Dirty tracking, consolidated translate UI, status indicators
> - `docs/image-map-block-dev.md` — Updated Phase 1.5 docs

### Phase 29: Language Reconciliation & UX Polish ✅ (March 16, 2026)

**Language Reconciliation on Import:**
- [x] **Language Mismatch Detection** — CollectionPickerModal detects when collection languages differ from tour languages
- [x] **Reconciliation UI** — Modal prompts user to expand tour languages or filter import to match tour
- [x] **Tour Language Update** — `onLanguagesChanged` callback propagates new languages up to TourDetail
- [x] **Feed Language Filtering** — `cleanContentBlocks()` in feeds.ts now filters block languages to `tour.languages`
- [x] **Audit Document** — Full audit in `docs/language-collection-import-audit.md`

**Session Management:**
- [x] **better-sqlite3 Session Store** — Replaced in-memory sessions with persistent SQLite-backed sessions
- [x] **TypeScript Definitions** — Added `better-sqlite3-session-store.d.ts` type declarations

**Positioning Validation:**
- [x] **Stop Update Validation** — Improved validation handling for primary and backup positioning in stop updates

**Language Selector UX:**
- [x] **Common Museum Languages** — 12 most common museum languages sorted to top in Create/Edit Tour modals and Audio Collection modal
- [x] **Language Sorting Utility** — `sortLanguagesMuseumFirst()` function in `constants/languages.ts`
- [x] **Google TTS Language Sorting** — Server-side language sorting for Google Cloud TTS voice endpoint

**Voice Gallery Enhancement:**
- [x] **Language Names** — Voice gallery now displays full language names alongside voice info
- [x] **Additional Voice Info** — Enhanced voice metadata display in Audio TTS page

**TourCard UX:**
- [x] **"Unpublish" Label** — Changed "Archive" button to "Unpublish" for clearer status semantics
- [x] **Status Handling** — Adjusted status transitions for unpublish action

> **Key Files Created/Modified:**
> - `app/src/components/CollectionPickerModal.tsx` — Language reconciliation UI + filtering
> - `app/src/components/blocks/AudioBlockEditor.tsx` — Passes `availableLanguages` to picker
> - `app/src/components/StopEditor.tsx` — Wires `onLanguagesChanged` callback
> - `app/src/pages/TourDetail.tsx` — Handles language update from import
> - `app/server/routes/feeds.ts` — Feed language filtering
> - `app/server/middleware/auth.ts` — SQLite session store integration
> - `app/src/constants/languages.ts` — `COMMON_MUSEUM_LANGUAGES`, `sortLanguagesMuseumFirst()`
> - `app/src/components/CreateTourModal.tsx` — Sorted language selector
> - `app/src/components/EditTourModal.tsx` — Sorted language selector
> - `app/src/components/AudioCollectionModal.tsx` — Sorted language selector
> - `app/src/components/TourCard.tsx` — Unpublish button rename
> - `docs/language-collection-import-audit.md` — Full language import audit

### Phase 30: Unified Preview System & iPad Orientation ✅ (March 18, 2026)

**Unified Preview Choice Modal:**
- [x] **PreviewChoiceModal** — New unified entry point replaces separate "Run Tour" + "Kiosk" buttons
- [x] **Two preview paths** — Simulator (in-app device frame) or Tour Device (opens in new tab via KioskLauncherModal)
- [x] **Consistent access** — Same modal from TourCard, TourDetail header, StopEditor, StopListEditorModal, and TimelineGalleryEditorModal
- [x] **Simplified TourCard** — Single "Run/Preview" button instead of two buttons

**iPad Portrait/Landscape Toggle:**
- [x] **Orientation toggle** — `RotateCw` icon button appears only when iPad device is selected
- [x] **Dimension swapping** — Swaps 820×1180 ↔ 1180×820 (no CSS rotate hacks)
- [x] **Auto-scale adjustment** — Portrait defaults to 0.55, landscape to 0.45
- [x] **Dimensions badge** — Updates to show effective orientation dimensions
- [x] **Side buttons** — Hidden in landscape mode (cosmetic simplification)
- [x] **Inner bezel fix** — Fixed hardcoded `rounded-[43px]` to use `device.bezelRadius - 1`
- [x] **Smooth animation** — Existing CSS transitions animate the orientation change

**Bug Fixes & UX Improvements:**
- [x] **Edit Tour translation preservation** — Title/description edits no longer overwrite other language translations
- [x] **Tour API fix** — `defaultTranslationProvider` now saveable via PUT `/api/tours/:id`
- [x] **Visitor language default** — Uses `primaryLanguage` instead of first language in array
- [x] **iOS safe area support** — Added `viewport-fit=cover` meta tag and `env(safe-area-inset-top)` header padding
- [x] **Removed ExternalLink icons** — Cleaner button styling on TourCard and TourDetail

> **Key Files Created:**
> - `app/src/components/PreviewChoiceModal.tsx` — Unified preview entry point modal
>
> **Key Files Modified:**
> - `app/src/components/StopPreviewModal.tsx` — iPad orientation toggle (portrait/landscape)
> - `app/src/components/TourCard.tsx` — Simplified to single preview button using PreviewChoiceModal
> - `app/src/pages/TourDetail.tsx` — Replaced KioskLauncherModal with PreviewChoiceModal
> - `app/src/components/StopEditor.tsx` — Uses PreviewChoiceModal instead of StopPreviewModal directly
> - `app/src/components/blocks/StopListEditorModal.tsx` — Uses PreviewChoiceModal
> - `app/src/components/blocks/TimelineGalleryEditorModal.tsx` — Uses PreviewChoiceModal
> - `app/src/components/EditTourModal.tsx` — Preserves existing translations on save
> - `app/server/routes/tours.ts` — Accepts `defaultTranslationProvider` in PUT
> - `app/src/pages/VisitorStop.tsx` — Primary language default + safe area padding
> - `app/index.html` — `viewport-fit=cover` for iOS notch support

### ✅ Phase 26.2: Per-Tour AI Concierge (Complete - February 2, 2026)
- [x] Add concierge fields to Tour model (conciergeEnabled, conciergePersona, conciergeWelcome, conciergeCollections, conciergeQuickActions)
- [x] Create tour concierge settings UI (AI Chatbot tab in Tour Editor)
- [x] Update chat API for tour-specific context
- [x] Auto-build knowledge from tour content (title, description, stops, text blocks)
- [x] Link document collections to specific tours

> **Vision:** Each tour gets its own AI chatbot that knows specifically about THAT tour. Visitors on "Ancient Egypt" get an Egypt expert.
>
> **Key Files Created/Modified:**
> - `app/src/components/TourConciergeTab.tsx` — Complete per-tour AI chatbot configuration tab
> - `app/prisma/schema.prisma` — Added `conciergeQuickActions` field to Tour model
> - `app/src/types/index.ts` — Added `TourQuickAction` interface
> - `app/server/routes/tours.ts` — Parse/save conciergeQuickActions JSON

### ✅ Phase 26.3: Chatbot UX Unification (Complete - March 19, 2026)
- [x] Add chatbot to Simulator preview (phone, tablet, kiosk modes) with `contained` prop
- [x] Rework Quick Actions translation — LanguageSwitcher + MagicTranslateButton per action row
- [x] Add per-language editing for existing quick action prompts
- [x] Add LanguageSwitcher + MagicTranslateButton to Welcome Message field
- [x] Remove hardcoded "How can I help you today?" from ChatDrawer
- [x] Restyle ChatDrawer from orange/amber to black/white/gray monochrome aesthetic
- [x] Reset chat conversation on drawer close (reopening shows quick actions start screen)

> **What changed:** The chatbot now appears identically in the Simulator preview and on visitor devices. Quick Actions and Welcome Message use the same LanguageSwitcher + MagicTranslateButton translation pattern as the rest of the app (stop editors, text blocks, etc.). ChatDrawer visual style unified to monochrome.
>
> **Key technical detail:** Added `contained?: boolean` prop to ChatDrawer, ChatFloatingButton, and KioskChatButton. When `contained`, components use `absolute` instead of `fixed` positioning so they render inside the simulator's scaled device frame.
>
> **Key Files Modified:**
> - `app/src/components/chat/ChatDrawer.tsx` — `contained` prop, monochrome restyle, chat reset on close
> - `app/src/components/StopPreviewModal.tsx` — Integrated chatbot in phone/tablet/kiosk simulator frames
> - `app/src/components/TourConciergeTab.tsx` — LanguageSwitcher + MagicTranslateButton for Quick Actions and Welcome Message

### 🎯 Phase 17: Stop Navigation & Links (Planned)
- [ ] **Next/Previous Buttons** - Navigate between stops
- [ ] **Stop List View** - See all stops in tour
- [ ] **Related Stops** - Curator-defined links between stops
- [ ] **Tour Progress** - Visual completion indicator
- [ ] **Tour Map View** - Interactive map with all stops

### ✅ Phase 18: GPS Positioning & Geofencing (Complete - March 9, 2026)

**Phase 3A — Foundation Hardening:**
- [x] **Indexed `shortCode` column** — Added `shortCode` column with unique index to Stop table, O(1) lookup
- [x] **Zod validation schemas** — Discriminated union for all 10 positioning method configs (`server/validation/positioning.ts`)
- [x] **VisitLog analytics table** — Logs stop visits with stopId, tourId, token, source, timestamp, userAgent + 3 indexes
- [x] **Backup positioning fallback banner** — Visitor sees contextual fallback message (QR/NFC/manual) when primary is auto-detect

**Phase 3B — GPS Admin Tab:**
- [x] **GPS tab in PositioningEditorModal** — Replaced placeholder with full GPS configuration UI
- [x] **Map preview** — Shows current coordinates with trigger zone circle via MapPreview component
- [x] **"Use My Location" button** — Geolocation API with loading state
- [x] **"Open Map Editor" button** — Launches MapEditorModal as sub-modal (search, click-to-place, radius slider)
- [x] **Coordinate inputs** — Manual lat/lng entry with 6 decimal precision
- [x] **Trigger radius slider** — 5–200m range with live label
- [x] **Map provider toggle** — OpenStreetMap or Google Maps
- [x] **Radius-to-zoom auto-sync** — `radiusToZoom()` maps trigger radius to appropriate zoom level (removed hardcoded gpsZoom)
- [x] **Save as GPSConfig** — Saves lat, lng, radius, mapProvider to `primaryPositioning`

**Phase 3C — Visitor-Side Geofencing:**
- [x] **Haversine distance utility** — `src/lib/geo.ts` with `haversineDistance()` and `isInsideGeofence()`
- [x] **useGeofenceMonitor hook** — Full geofence engine: permission management, `watchPosition`, enter/exit detection, auto-navigate
- [x] **GPS stops batch endpoint** — `GET /api/visitor/tour/:id/gps-stops` returns lightweight geofence targets
- [x] **Geofence permission UI** — Green "Enable location" banner prompts visitor to share location
- [x] **Auto-navigate on entry** — When visitor enters a geofenced stop's radius, auto-navigates to that stop

> **Key Files Created:**
> - `app/src/lib/geo.ts` — Haversine distance + geofence check
> - `app/src/hooks/useGeofenceMonitor.ts` — Geofence monitoring hook
> - `app/server/validation/positioning.ts` — Zod schemas for all positioning configs
>
> **Key Files Modified:**
> - `app/src/components/PositioningEditorModal.tsx` — GPS tab, save logic, radiusToZoom(), imports
> - `app/src/components/blocks/MapEditorModal.tsx` — Google/OSM tile switching, floating controls overlay, style options
> - `app/src/pages/Docs.tsx` — Added GPS Geofencing Help Center page
> - `app/src/pages/VisitorStop.tsx` — Fallback banner, geofence integration, permission UI
> - `app/server/routes/visitor.ts` — VisitLog analytics, GPS stops endpoint
> - `app/server/routes/stops.ts` — Zod validation, shortCode sync
> - `app/prisma/schema.prisma` — shortCode on Stop, VisitLog model
>
> **Database Changes:**
> - Stop table: Added `shortCode TEXT` with unique index
> - VisitLog table: New table with 3 indexes (stopId, tourId, timestamp)
>
> **New npm dependency:** `zod` (runtime validation)

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
| Geofence Monitor Hook | `app/src/hooks/useGeofenceMonitor.ts` |
| Geo Utilities | `app/src/lib/geo.ts` |
| Positioning Validation | `app/server/validation/positioning.ts` |
| **Map Block** | |
| Map Preview | `app/src/components/blocks/MapPreview.tsx` |
| Map Editor Modal | `app/src/components/blocks/MapEditorModal.tsx` |
| Map Block Editor | `app/src/components/blocks/MapBlockEditor.tsx` |
| Map Block Spec | `docs/map-block-spec.md` |
| Settings API | `app/server/routes/settings.ts` |
| **Image Block Enhancement** | |
| Image Block Editor | `app/src/components/blocks/ImageBlockEditor.tsx` |
| Image Lightbox | `app/src/components/ui/ImageLightbox.tsx` |
| Image Hotspot Editor | `app/src/components/blocks/ImageHotspotEditor.tsx` |
| Block Editor Modal | `app/src/components/blocks/BlockEditorModal.tsx` |
| Comparison Block Editor | `app/src/components/blocks/ComparisonBlockEditor.tsx` |
| Comparison Preview | `app/src/components/blocks/ComparisonPreview.tsx` |
| **HTML / Embed Block** | |
| HTML Block Editor | `app/src/components/blocks/HtmlBlockEditor.tsx` |
| Embed Providers | `app/src/lib/embedProviders.ts` |
| HTML Sanitizer | `app/src/lib/htmlSanitizer.ts` |
| HTML Block Dev Guide | `docs/html-block-dev.md` |
| **Image Map Block** | |
| Image Map Editor Modal | `app/src/components/blocks/ImageMapEditorModal.tsx` |
| Image Map Block Editor | `app/src/components/blocks/ImageMapBlockEditor.tsx` |
| Image Map Block Preview | `app/src/components/blocks/ImageMapBlockPreview.tsx` |
| Image Map Marker Pin | `app/src/components/blocks/ImageMapMarkerPin.tsx` |
| Image Map Dev Guide | `docs/image-map-block-dev.md` |
| **Audio TTS** | |
| Audio Page | `app/src/pages/Audio.tsx` |
| TextPreviewModal | `app/src/components/TextPreviewModal.tsx` |
| Deepgram API Routes | `app/server/routes/audio.ts` |
| Deepgram Service | `app/src/services/audioService.ts` |
| **ElevenLabs TTS** | |
| ElevenLabs API Routes | `app/server/routes/elevenlabs.ts` |
| ElevenLabs Service | `app/src/services/elevenlabsService.ts` |
| ElevenLabs Voice Issue | `docs/ELEVENLABS-VOICES-ISSUE.md` |
| **Google Cloud TTS** | |
| Google TTS API Routes | `app/server/routes/google-tts.ts` |
| Google TTS Service | `app/src/services/googleTtsService.ts` |
| **Translation** | |
| Translation Shared Service | `app/server/services/translation.ts` |
| Translation API Route | `app/server/routes/translate.ts` |
| Google Translate Route | `app/server/routes/google-translate.ts` |
| Frontend Translation Service | `app/src/services/translationService.ts` |
| Language Constants | `app/src/constants/languages.ts` |
| Translation Languages Hook | `app/src/hooks/useTranslationLanguages.ts` |
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
| **AI Concierge** | |
| Concierge Admin Page | `app/src/pages/Concierge.tsx` |
| Concierge Service | `app/src/lib/conciergeService.ts` |
| Concierge API Routes | `app/server/routes/concierge.ts` |
| Chat Drawer | `app/src/components/chat/ChatDrawer.tsx` |
| Concierge Dev Guide | `docs/ai-chatbot-documents-dev.md` |
| Concierge Bug Audit | `docs/ai-concierge-bug.md` |
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
| **Language Reconciliation** | |
| Collection Picker Modal | `app/src/components/CollectionPickerModal.tsx` |
| Language Constants | `app/src/constants/languages.ts` |
| Language Import Audit | `docs/language-collection-import-audit.md` |

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
