# TourStack - Museum Virtual Tour Platform

**Target Users:** Museum curators, tour designers, content managers, educators, visitors  
**Key Differentiator:** Multi-technology positioning + AI-powered translation and audio generation

---

## 🎯 PRODUCT VISION: The Swiss Army Knife for Museums

> **TourStack is a unified SaaS platform** - one app that serves ALL museum tour needs:
> - **Admin Mode**: Create tours, manage content, configure positioning
> - **Visitor Mode**: Public-facing tour experience via QR codes
> - **Tools Mode**: Beacon scanning, field testing, analytics

### Why One App?

Museums shouldn't need 3 different tools. TourStack combines:
1. **CMS** (Content Management) - Build and edit tours
2. **Visitor App** - What guests see when they scan QR codes
3. **Field Tools** - Beacon scanning, positioning testing, analytics

### Draft vs Published Workflow

| Status | Admin | Visitor | Description |
|--------|-------|---------|-------------|
| **Draft** | ✅ Full access | ❌ Not visible | Work in progress |
| **Testing** | ✅ Full access | 🔒 Staff only | Internal review |
| **Published** | ✅ Full access | ✅ Public | Live for visitors |
| **Archived** | ✅ Read-only | ❌ Not visible | Preserved history |

### Staff Access in Visitor Mode

When museum staff access visitor pages, they see:
- **"Back to Admin" button** - Quick return to CMS
- **Staff badge** - Indicates they're logged in
- **Draft preview** - Can view unpublished content
- **Analytics overlay** (optional) - Real-time engagement data

---

## Project Status (February 2026)

| Phase | Status |
|-------|--------|
| Phase 1: Foundation | ✅ Complete |
| Phase 2: Tours Page | ✅ Complete |
| Phase 3: Stop Manager & Collections | ✅ Complete |
| Phase 4: Content Block System | ✅ Complete |
| Phase 5: API Layer | ✅ Complete |
| Phase 6: Timeline Gallery | ✅ Complete |
| Phase 7: Framer Motion Transitions | ✅ Complete |
| Phase 8: Thumbnail Markers UI | ✅ Complete |
| Phase 9: Translation Infrastructure | ✅ Complete |
| Phase 10: Audio Player Size Variants | ✅ Complete |
| Phase 11: Map Block | ✅ Complete |
| Phase 12: Audio TTS Section | ✅ Complete |
| Phase 13: ElevenLabs Integration | ✅ Complete |
| Phase 13.5: Translate Collections | ✅ DEPLOYED |
| Phase 14: Audio UX Improvements | ✅ Complete |
| Phase 15: Positioning Editor & QR Generator | ✅ Complete |
| Phase 16: Tour Block + Visitor System | ✅ Complete |
| Phase 16.5: Kiosk Launch System | ✅ Complete |
| Phase 17: Stop Navigation & Links | 🎯 Planned |
| Phase 18: GPS Positioning Tab | 🎯 Planned |
| Phase 19: AI Object Analysis (Full) | ✅ Complete |
| Phase 20: Media Library | ✅ Complete |
| Phase 21: Collections Enhancement | ✅ Complete |
| Phase 22: Collection Translations | ✅ Complete |
| Phase 23a: Collections ↔ Media Library Sync | ✅ Complete |
| Phase 24: Translation View | ✅ Complete |
| Phase 25: Document Collections | ✅ Complete |
| Phase 26.1: AI Museum Concierge | ✅ Complete |
| Phase 27: Google Cloud TTS Integration | ✅ Complete |
| Phase 26.2: Per-Tour AI Concierge | 🎯 NEXT |

### Tour Block (Phase 16) - COMPLETE ✅

**New Content Block Type:** Full-screen hero introduction for tours.

| Feature | Description |
|---------|-------------|
| **Architectural Design** | Clean minimalist typography, monochrome palette |
| **Full-Height Image** | `min-h-[100dvh]` fills device screen properly |
| **3 Layout Variants** | Bottom aligned, centered, card overlay |
| **Multilingual** | LanguageSwitcher + MagicTranslateButton for title, description, badge, CTA |
| **CTA Customization** | Primary/secondary/outline/ghost styles |
| **CTA Actions** | Next stop, specific stop, or external URL |
| **Fallback Image** | Uses `/assets/fallback.jpg` if no image selected |

**Files:**
- `TourBlockEditor.tsx` - Full editor with live preview
- `StopContentBlock.tsx` - Renders tour block in view mode
- `types/index.ts` - `TourBlockData` interface

### AI Object Analysis (Phase 19) - COMPLETE ✅

**New AI Tool View:** A forensic-grade image analysis suite for artifacts.

| Feature | Description |
|---------|-------------|
| **Visual DNA** | Deep analysis of image mood, lighting, style, and context |
| **Object Detection** | Identifies specific objects within the frame |
| **Dominant Colors** | Full color palette extraction with HEX codes and names |
| **OCR Text Extraction** | High-precision text recognition from labels and plaques |
| **Web Detection** | "Best Guess" identification of famous works of art |
| **Interactive Tagging** | AI-generated tags with manual add/remove capability |

**Files:**
- `AIAssistance.tsx` - Main tools dashboard & analysis container
- `SmartTagGenerator.tsx` - Core analysis logic and results UI
- `vision.ts` - Server-side Google Cloud Vision API integration
- `gemini/analyze` - Backend endpoint for advanced visual DNA

**Deployment:** Coolify/Docker with persistent volumes
- Database: Prisma + SQLite (`/app/data`)
- Media: Server uploads (`/app/uploads`, 100MB limit)
- See `docs/COOLIFY-DEPLOYMENT.md` for configuration

### Kiosk Launch System (Phase 16.5) - COMPLETE ✅

**Museum Kiosk Deployment:** Launch and configure visitor tours from admin interface.

| Feature | Description |
|---------|-------------|
| **Run/Preview Buttons** | Green "Run" for published, "Preview" for draft tours |
| **Kiosk Launcher Modal** | Configure language, start stop, and display options |
| **URL Parameters** | `lang`, `fullscreen`, `hideNav`, `autoRestart`, `kiosk` |
| **Fullscreen API** | Browser fullscreen with toggle button in kiosk mode |
| **Auto-restart** | "Start Over" button returns to first stop on completion |
| **Hide Navigation** | Remove prev/next buttons for linear kiosk tours |

**Files:**
- `KioskLauncherModal.tsx` - Modal for kiosk configuration
- `TourCard.tsx` - Run/Preview/Kiosk buttons on tour cards
- `TourDetail.tsx` - Run Tour and Kiosk buttons in header
- `VisitorStop.tsx` - URL parameter handling for kiosk mode
- `types/index.ts` - `KioskSettings` and `KioskPreset` interfaces

**Documentation:** See [docs/kiosk-dev.md](docs/kiosk-dev.md) for full planning and future phases.

### Collections Enhancement (Phase 21) - COMPLETE ✅

**Image Collections with AI Analysis:** Full wizard-based collection creation with Gemini-powered analysis.

| Feature | Description |
|---------|-------------|
| **CollectionTypeModal** | Beautiful 2x2 grid for selecting collection type |
| **ImageCollectionWizard** | 4-step guided wizard: Details → Upload → AI Analysis → Review |
| **Drag & Drop Upload** | Multi-image upload via react-dropzone |
| **Batch AI Analysis** | "Analyze All" with per-image progress tracking |
| **CollectionImageCard** | Reusable card with AI metadata badges |
| **CollectionItemAnalysisModal** | Full-screen AI analysis viewer with navigation |
| **AddItemWizard** | 3-step wizard for adding to existing collections |
| **ConfirmationModal** | Beautiful modals replacing browser `alert()`/`confirm()` |

**Files:**
- `src/components/collections/CollectionTypeModal.tsx` - Type selection modal
- `src/components/collections/ImageCollectionWizard.tsx` - 4-step creation wizard
- `src/components/collections/CollectionImageCard.tsx` - Image display card
- `src/components/collections/CollectionItemAnalysisModal.tsx` - AI analysis viewer
- `src/components/collections/AddItemWizard.tsx` - Add items wizard
- `src/components/ui/ConfirmationModal.tsx` - Reusable confirmation modal

**Documentation:** See [docs/collections-dev.md](docs/collections-dev.md) for full guide.

### Collection Translations (Phase 22) - COMPLETE ✅

**AI Analysis Translation:** Translate all AI-generated content to 9 supported languages.

| Feature | Description |
|---------|-------------|
| **Batch Translation API** | 10-15x faster using LibreTranslate's array support |
| **Language Tabs** | Switch languages in analysis modal with visual status |
| **Batch Wizard Translation** | "Translate All X Images" in Step 4 with progress |
| **Translation Badges** | Blue Languages icon on translated items |
| **Language Picker** | Switch languages while browsing collection detail |

**Files:**
- `src/services/translationService.ts` - `translateBatch()`, `translateAnalysis()`
- `src/components/collections/CollectionItemAnalysisModal.tsx` - Language tabs
- `server/routes/translate.ts` - `/api/translate/batch` endpoint

### Collections ↔ Media Library Sync (Phase 23a) - COMPLETE ✅

**Unified Metadata:** AI analysis and translations now flow from Collections to Media Library.

| Feature | Description |
|---------|-------------|
| **Database Fields** | `aiMetadata` and `aiTranslations` added to Media model |
| **Sync Endpoints** | `/api/media/sync-by-url` and `/api/media/sync-batch` |
| **Auto-Sync** | Collections automatically sync to Media Library on save |
| **Media Library Persistence** | AI analysis saved when clicking "Save Changes" |
| **Initial Analysis** | ImageAnalysisPanel loads existing analysis from database |

**Data Flow:**
```
Collections → AI Analyze → Translate → Save → Auto-Sync → Media Library
                                              ↓
                                    (matches by URL: /uploads/images/)
```

**Files:**
- `app/prisma/schema.prisma` - Media model with new fields
- `app/server/routes/media.ts` - Sync endpoints
- `app/server/routes/collections.ts` - Auto-sync on create/update
- `app/src/components/media/ImageAnalysisPanel.tsx` - Load/save analysis
- `app/src/components/media/MediaDetailModal.tsx` - Tracks aiMetadata state

**Documentation:** See [docs/collections-media-sync.md](docs/collections-media-sync.md) for full guide.

### Translation View (Phase 24) - COMPLETE ✅

**New View:** Standalone `/languages` Translation Tools page with tabbed provider interface.

| Feature | Description |
|---------|-------------|
| **Provider Tabs** | LibreTranslate (active) + 8 placeholders |
| **Two-Panel UI** | Source → Target with language swapping |
| **9 Languages** | en, es, fr, de, it, pt, ja, ko, zh |
| **File Translation** | txt, docx, pdf, odt, epub, srt, html |
| **Quick Phrases** | Museum-specific (Wayfinding, Safety, Audio Guide, Accessibility) |
| **Translation History** | Session-based with recall |

**Cloud APIs (Coming Soon):** DeepL, Google Cloud Translation, Microsoft Azure, Amazon Translate

**Self-Hosted (Coming Soon):** Argos Translate, OpenNMT, Bergamot, Marian NMT

**Files:**
- `app/src/pages/Languages.tsx` - Main translation view
- `app/server/routes/translate.ts` - Existing LibreTranslate backend

### Document Collections (Phase 25) - COMPLETE ✅

**New Feature:** Upload and analyze documents (PDF, DOCX, RTF, etc.) with AI-powered tools.

| Feature | Description |
|---------|-------------|
| **Multi-Format Extraction** | PDF, DOCX, DOC, RTF, ODT, PPTX via `officeparser` |
| **Text Extraction API** | `POST /api/documents/extract-text-base64` endpoint |
| **AI Tools Panel** | Full-width panel with Single/Batch modes |
| **4 AI Tools** | Summarize, Extract Facts, Generate FAQ, Auto-Tag |
| **Batch Selection** | Checkbox UI for selecting specific documents |
| **Batch Results** | Success/failure status per document processed |
| **Auto-Save** | AI analysis results persist to database immediately |
| **Compact Grid** | 4-column responsive document layout |

**AI Tools:**
- **Summarize** - 2-3 sentence museum-style summary
- **Extract Facts** - Key facts, dates, names as bullet points
- **Generate FAQ** - 5 visitor Q&A questions
- **Auto-Tag** - 8-12 keyword tags for cataloging

**Files:**
- `app/src/components/collections/DocumentCollectionWizard.tsx` - 3-step upload wizard
- `app/src/components/collections/DocumentAIToolsPanel.tsx` - AI tools with fullWidth prop
- `app/server/routes/documents.ts` - Text extraction via officeparser
- `docs/ai-chatbot-documents-dev.md` - Full documentation

### AI Museum Concierge (Phase 26.1) - COMPLETE ✅

**New Feature:** Museum-wide AI chatbot with configurable persona, knowledge sources, and quick actions.

| Feature | Description |
|---------|-------------|
| **Admin Page** | `/concierge` route with full configuration UI |
| **Persona Selection** | Friendly, Professional, Fun, Scholarly, Custom |
| **Welcome Message** | Multilingual JSON storage |
| **Language Config** | EN, ES, FR, DE toggles with primary language |
| **Knowledge Sources** | Import from document collections |
| **Quick Actions** | Add, delete, drag-reorder with multilingual labels |
| **Translate All** | Google Translate API integration |
| **Test Concierge** | Preview chat responses |
| **ChatDrawer** | Visitor-facing chat with dynamic config |

**Database Tables:**
- `ConciergeConfig` - Main configuration (persona, languages, welcome)
- `ConciergeKnowledge` - Knowledge sources from documents
- `ConciergeQuickAction` - Quick action buttons

**Files:**
- `app/src/pages/Concierge.tsx` - Admin configuration page
- `app/src/lib/conciergeService.ts` - API client
- `app/server/routes/concierge.ts` - API routes
- `docs/ai-chatbot-documents-dev.md` - Full documentation

### Google Cloud TTS Integration (Phase 27) - COMPLETE ✅

**New Feature:** Third TTS provider using Google Cloud Text-to-Speech REST API.

| Feature | Description |
|---------|-------------|
| **Neural2 + Standard Voices** | Filtered from 400+ voices, 10 languages |
| **3 Output Formats** | MP3, WAV (LINEAR16), OGG Opus |
| **Voice Preview** | Listen to any voice before generating |
| **Speaking Rate & Pitch** | Adjustable rate (0.25-4.0) and pitch (-20 to 20) |
| **Batch Collections** | Multi-language batch generation with auto-translation |
| **Shared API Key** | Reuses `GOOGLE_VISION_API_KEY` (Vision + Translate + TTS) |
| **Voice Caching** | Server-side 1-hour cache for voice list |

**Files:**
- `app/server/routes/google-tts.ts` - Backend Express route
- `app/src/services/googleTtsService.ts` - Frontend service layer
- `app/src/pages/Audio.tsx` - GoogleCloudTab component

### Per-Tour AI Concierge (Phase 26.2) - NEXT 🎯

**Vision:** Each tour gets its own AI chatbot that knows specifically about THAT tour.

**Planned Features:**
- Concierge fields on Tour model (enabled, persona, welcome, collections)
- Tour concierge settings UI (new tab in Tour Editor)
- Tour-specific knowledge context (title, description, stops, text blocks)
- Linked document collections per tour
- Future: Location-aware responses using positioning tech

**Knowledge Sources Per Tour:**
1. Tour content (title, description, stop titles, text blocks)
2. Linked document collections (PDFs, extracted text)
3. AI analysis results (summary, facts, FAQ, tags)

**Documentation:** See [docs/ai-chatbot-documents-dev.md](docs/ai-chatbot-documents-dev.md)

---

## 📱 VISITOR EXPERIENCE SYSTEM (Phase 16)

> **The Preview System IS the Visitor View** - same components, different context.
> Admin sees preview in a modal; Visitors see it as full-screen pages.

### Architecture Overview

> ⚠️ **CRITICAL DESIGN RULE: Preview = Real Device**
>
> The device preview in admin IS the real visitor screen. Dimensions are actual device pixels:
> - **iPhone:** 375 × 812px - exactly what visitors see on real iPhones
> - **iPad:** 820 × 1180px - exactly what visitors see on real iPads
>
> The `scale(0.55)` transform only shrinks it to fit the admin UI - content renders at true device resolution.
> **NEVER use browser viewport units (vh/dvh) for content sizing** - use the device's pixel height.

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOURSTACK UNIFIED APP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   ADMIN MODE    │  │  VISITOR MODE   │  │   TOOLS MODE    │ │
│  │   /tours/*      │  │   /visitor/*    │  │   /tools/*      │ │
│  │   /stops/*      │  │   /tour/*       │  │   /scanner      │ │
│  │   /collections  │  │                 │  │   /analytics    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│          │                    │                    │            │
│          └────────────────────┼────────────────────┘            │
│                               │                                 │
│                    ┌──────────▼──────────┐                      │
│                    │  SHARED COMPONENTS  │                      │
│                    │  StopContentBlock   │                      │
│                    │  AudioPlayer        │                      │
│                    │  GalleryPreview     │                      │
│                    │  MapPreview         │                      │
│                    │  TimelineGallery    │                      │
│                    └─────────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

### Visitor Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/visitor/tour/:tourId` | Tour overview page | Published only |
| `/visitor/tour/:tourId/stop/:stopId` | Stop content page | Published only |
| `/visitor/tour/:tourId/stop/:stopId?t=TOKEN` | QR code entry | Token validated |
| `/visitor/tour/:tourId/map` | Interactive tour map | Published only |

### Visitor Features (Current & Planned)

#### ✅ Available Now
- [ ] Stop content rendering (all block types)
- [ ] Language switching
- [ ] Audio playback with captions
- [ ] Image galleries with transitions
- [ ] Maps with current location

#### 🔄 In Development
- [ ] QR code URL routing (`/visitor/tour/:id/stop/:id`)
- [ ] Token validation for tracking
- [ ] "Back to Admin" button for staff
- [ ] Tour overview page

#### 🎯 Planned Features
- [ ] **Stop Navigation** - Next/Previous buttons, stop list
- [ ] **Links to Other Stops** - "Related stops" or curator-defined links
- [ ] **Tour Progress** - Visual indicator of completion
- [ ] **Offline Mode** - PWA with cached content
- [ ] **Accessibility Mode** - Large text, high contrast, screen reader
- [ ] **Kid Mode** - Simplified UI, gamification elements
- [ ] **Audio Tour Mode** - Auto-advance with audio cues
- [ ] **Scavenger Hunt** - Gamified stop discovery

### Staff vs Visitor Experience

| Feature | Staff | Visitor |
|---------|-------|---------|
| View draft tours | ✅ Yes | ❌ No |
| View published tours | ✅ Yes | ✅ Yes |
| "Back to Admin" button | ✅ Yes | ❌ No |
| Analytics overlay | ✅ Optional | ❌ No |
| Edit content | ❌ No (use admin) | ❌ No |
| Language switch | ✅ Yes | ✅ Yes |
| Device frame (phone/tablet) | ✅ Preview only | ❌ No |

### QR Code Flow

```
1. Visitor scans QR code on signage
   ↓
2. URL: /visitor/tour/{tourId}/stop/{stopId}?t={token}
   ↓
3. App validates token (prevents URL sharing/guessing)
   ↓
4. If valid & tour is PUBLISHED → Show stop content
   If invalid or DRAFT → Show error/redirect
   ↓
5. Visitor views content, switches languages, navigates
   ↓
6. Analytics recorded (scan time, dwell time, interactions)
```

### Future: Stop Navigation System

Museums need visitors to flow between stops:

```
┌─────────────────────────────────────────────────────────────┐
│  Stop: The Rosetta Stone                    [1/12] ▶ Next  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Stop Content - Audio, Images, Text, etc.]                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Related Stops:                                             │
│  • Egyptian Hieroglyphics (Stop 3)                         │
│  • Ancient Writing Systems (Stop 7)                        │
│                                                             │
│  [◀ Previous: Entrance]  [Map 🗺️]  [Next: Mummies ▶]       │
└─────────────────────────────────────────────────────────────┘
```

---

## UI/UX IMPROVEMENTS (v1.1)

### Translation Workflow Enhancements

#### 1. Translation Complete Notification
- Added a clean, non-intrusive modal that appears after successful translation
- Clearly indicates the number of languages translated
- Reminds users to save changes for translations to appear in preview
- Features a green checkmark icon and clear action button
- Implemented in both Timeline Gallery and Audio Block editors

#### 2. Flexible Save Options
- Redesigned save flow with a confirmation modal
- **Save & Continue Editing**: Saves changes and keeps editor open with fresh data
- **Save & Exit**: Saves changes and returns to stop list
- Clear visual distinction between save options (color-coded buttons with icons)
- Maintains unsaved changes indicator in the UI

#### 3. Improved Closed Captions
- Fixed language switching in preview mode
- Ensures captions show correct translated text for each language
- Falls back to English word-level timestamps only when no translation exists
- Consistent behavior across all media types (audio, video, timeline gallery)

---

## CORE POSITIONING TECHNOLOGIES
When creating a new tour, museums must select their positioning method:

1. BLE Beacon Triangulation/Trilateration

Uses 2+ Bluetooth Low Energy beacons per zone
RSSI (Received Signal Strength Indicator) based positioning
Accuracy: ±1.5-3 meters
Configuration: UUID, Major, Minor values
Typical setup: 2-4 beacons per room (entrance/exit + center positions)
2. GPS (Lat/Long) Coordinates

For outdoor exhibits, sculpture gardens, archaeological sites
Standard latitude/longitude coordinates
Configurable geofence radius (5-100 meters)
Works with device GPS
3. NFC (Near Field Communication)

Ultra-short range (0-4cm proximity required)
Physical tap-to-trigger interaction
Generate unique NFC tag IDs for each beacon
No battery required, extremely cost-effective
4. RFID (Radio Frequency Identification)

Short to medium range (up to 100ft with powered tags)
Active or Passive RFID options
Unique tag identification
Good for artifact tracking + visitor triggers
5. QR Code Scanning

Visitor scans codes with camera
Zero hardware cost, easy deployment
Generate unique QR codes per beacon
Backup method for any positioning system
6. WiFi Triangulation

Uses existing WiFi infrastructure
Access point RSSI triangulation
5-15 meter accuracy
Lower cost if WiFi already installed
7. Ultra-Wideband (UWB)

Highest accuracy: ±10-50cm
Real-time positioning
Higher cost, best for premium installations
Excellent for precise indoor tracking
8. Hybrid/Multi-Modal

Combine multiple technologies (BLE + QR, GPS + NFC, etc.)
Fallback options if primary fails
Best for complex venues
TOUR BUILDER INTERFACE
Tour Configuration Wizard:

Basic Information
Tour title, description, language(s)
Estimated duration (15, 30, 45, 60+ minutes)
Difficulty level (accessible, family, advanced)
Age recommendations
Accessibility features (wheelchair accessible, audio descriptions, etc.)
Positioning Technology Selection
Choose primary positioning method
Configure secondary/backup methods
Set global trigger settings (proximity radius, dwell time thresholds)
Test mode for positioning accuracy
Beacon/Stop Management
Visual map interface for beacon placement
Drag-and-drop beacon positioning
Numbered sequence with reordering
Beacon types: mandatory, optional, bonus content
Branch points for choose-your-own-path tours
BEACON/STOP CONFIGURATION
Each beacon should include:

Trigger Settings:

Proximity radius (1-100m for BLE/GPS)
Entry/exit triggers
Dwell time requirements (optional: "spend 30s here to unlock")
Time-based auto-advance
Trigger notifications (sound, vibration, push notification)
Content Types:

Rich text editor with formatting
Image Gallery & Timeline:
 - Multiple images per beacon
 - Grid, Masonry, and Carousel layouts
 - **Advanced Timeline Mode**: 
   - Drag-and-drop ordering
   - Custom transitions (fade, slide, zoom)
   - Pan/Zoom effects (Ken Burns) for immersive storytelling
   - Interactive scrubbing
**Map Block** (Phase 11):
 - OpenStreetMap integration (free, no API key)
 - Google Maps integration (premium, API key required)
 - Click-to-place markers with address search
 - Size options: Small (150px), Medium (250px), Large (full height)
 - Trigger zones with configurable radius for geofencing
 - Provider toggle (OpenStreetMap/Google Maps)
 - Map styles: Standard, Satellite, Terrain, Hybrid
Audio guide (MP3 upload with **3 size variants**):
 - **Large**: Full player with title, progress, time, speed, skip ±10s, volume
 - **Medium**: Compact inline - play + scrubber + time + volume
 - **Small**: Icon-only play/pause button (44px phone, 56px tablet)
 - **Show Title toggle** for large player (editor-only for large size)
 - **Tablet scaling** - larger buttons/padding for medium/small sizes
**Audio TTS Section** (Phase 12-13):
 - **Deepgram Aura-2** text-to-speech integration
   - 7 languages: English, Spanish, German, French, Dutch, Italian, Japanese
   - 40+ voices with gender indicators and preview
   - Multiple output formats: MP3, WAV, OGG, FLAC
   - Sample rates: 8kHz, 16kHz, 24kHz, 48kHz
 - **ElevenLabs** premium multilingual TTS
   - 32+ languages with native voice support
   - 3,000+ community voices via shared voice library
   - Native language voices (Italian voices for Italian, etc.)
   - Models: Multilingual v2, Flash v2.5, Turbo v2.5
   - Voice settings: Stability and similarity boost sliders
 - **Google Cloud TTS** neural text-to-speech
   - 10 languages: en, es, fr, de, it, ja, nl, ko, pt, zh
   - Neural2 + Standard voice types (filtered from 400+)
   - Output formats: MP3, WAV (LINEAR16), OGG Opus
   - Sample rates: 16kHz, 24kHz, 44.1kHz, 48kHz
   - Speaking rate (0.25-4.0) and pitch (-20 to 20) controls
   - Reuses existing `GOOGLE_VISION_API_KEY`
 - **Auto-Translation** (LibreTranslate)
   - Supported: en, es, fr, de, it, pt, ja, ko, zh
   - Language availability indicators (✓) in dropdowns
   - Styled modal for unavailable languages
 - Success modal with generation settings summary
 - File metadata display: language badges, format, sample rate, file size
 - Persistent storage in `/app/uploads/audio/generated/`
Video embeds (YouTube, Vimeo, or direct upload)
3D model viewers (for photogrammetry/museum artifacts)
AR content markers (placeholder for WebAR integration)
External links with custom labels
PDF documents (exhibition catalogs, detailed info)
Interactive Elements:

Quiz questions (multiple choice, true/false)
Polls and surveys
Scavenger hunt challenges
Photo upload prompts ("Take a photo inspired by this artwork")
Social media share prompts
"Fun Facts" expandable sections
Multilingual Support:

Add content in multiple languages per beacon
Language selector for visitors
Auto-translate suggestions (with manual override)
Accessibility Features:

Audio descriptions for visually impaired
Text transcripts for audio content
High contrast mode compatibility
Screen reader optimization
ANALYTICS & INSIGHTS DASHBOARD
Museums need data-driven insights:

Visitor Analytics:

Real-time visitor count per tour
Heatmaps showing popular stops
Dwell time per beacon (average/median)
Completion rates (% who finish tour)
Drop-off analysis (where visitors abandon)
Path visualization (most common routes)
Peak visiting hours/days
Engagement Metrics:

Content interaction rates (audio plays, video views, link clicks)
Quiz completion and scores
Social media shares
Photo uploads
Feedback ratings per beacon
Comparative Reports:

Tour-to-tour comparisons
Time period comparisons (this month vs last)
Demographic breakdowns (if collected)
Export to CSV/PDF for presentations
Visualizations:

Interactive heatmaps overlaid on floor plans
Flow diagrams showing visitor paths
Engagement charts (bar, line, scatter plots)
Real-time dashboard for live monitoring
BEACON SCANNING & TESTING TOOLS
Beacon Scanner Interface:

Scan for nearby BLE beacons (show UUID, Major, Minor, RSSI)
NFC reader testing
QR code generator and tester
GPS coordinate capture tool
Signal strength meter for positioning accuracy
Test trigger activation simulation
Field Testing Mode:

Walk-through simulation
Trigger logging and debugging
False positive/negative detection
Positioning accuracy visualization
Generate test reports
CONTENT MANAGEMENT FEATURES
Media Library:

Upload and organize images (JPG, PNG, WebP)
Audio files (MP3, AAC) with waveform preview
Video files (MP4) or embed links
PDF documents
Tag and categorize media
Bulk upload and batch operations
Storage quota tracking
Template Library:

Pre-built beacon templates:
Artwork description
Historical artifact
Interactive science exhibit
Outdoor landmark
Kids' discovery zone
Accessibility stop
Duplicate and customize templates
Save custom templates
Content Scheduling:

Temporary exhibits with start/end dates
Seasonal content variations
Event-based tour modifications
TOUR DEPLOYMENT & PUBLISHING
Status Management:

Draft (editing, not visible to visitors)
Testing (visible to staff only)
Published (live for visitors)
Archived (preserved but inactive)
Version Control:

Save version history
Rollback to previous versions
Compare versions side-by-side
Branch tours for A/B testing
Export/Import:

Export tours as JSON
Import tours from JSON
Bulk beacon updates via CSV
Backup entire tour database
QR Code Generation:

Generate tour entry QR codes
Printable beacon QR sheets
NFC tag programming data export
MUSEUM-SPECIFIC FEATURES
Multi-Museum Support:

Museum profile management
Different buildings/wings
Floor plan upload and mapping
Custom branding per museum
Visitor App Preview:

Mobile-optimized preview mode
Simulate visitor experience
Test on different screen sizes
Accessibility testing mode
Collaboration Tools:

Multi-user roles (Admin, Curator, Editor, Viewer)
Comments and review system
Task assignments
Change notifications
Integration Readiness:

API endpoints for visitor apps
Webhook support for analytics
CMS integration placeholders
Social media API connections
TECHNICAL SPECIFICATIONS
React Stack:

React with Hooks (useState, useEffect, useReducer, useContext)
Tailwind CSS (core utilities only, no custom config)
Lucide React icons
React Router for navigation
Data Management:

In-memory state management (NO localStorage/sessionStorage)
Form validation with error messaging
Auto-save drafts every 30 seconds to memory
Export to JSON for persistence
UI/UX Requirements:

Modern dark mode (primary) with light mode toggle
Glassmorphism effects and subtle animations
Micro-interactions (hover states, loading spinners)
Toast notifications (success, error, warning, info)
Responsive design (desktop-first, mobile-compatible)
Keyboard shortcuts for power users (list in help menu)
Empty states with onboarding guidance
Loading skeletons for async operations
Accessibility:

WCAG 2.1 AA compliance
Keyboard navigation throughout
ARIA labels and semantic HTML
Focus indicators
Color contrast ratios >4.5:1
SAMPLE DATA STRUCTURE
json
{
  "tours": [
    {
      "id": "tour_001",
      "museumId": "museum_abc",
      "title": "Ancient Egypt: Journey Through Time",
      "description": "Explore 3000 years of pharaohs, pyramids, and daily life",
      "status": "published",
      "positioningMethod": "ble_triangulation",
      "backupMethod": "qr_code",
      "duration": 45,
      "difficulty": "family",
      "languages": ["en", "es", "fr"],
      "accessibility": {
        "wheelchairAccessible": true,
        "audioDescriptions": true,
        "signLanguage": false
      },
      "createdAt": "2025-01-10T10:30:00Z",
      "updatedAt": "2025-01-15T14:22:00Z",
      "analytics": {
        "totalVisitors": 1247,
        "avgDuration": 42,
        "completionRate": 87.3
      },
      "beacons": [
        {
          "id": "beacon_001",
          "order": 1,
          "title": "The Rosetta Stone",
          "type": "mandatory",
          "positioning": {
            "method": "ble_triangulation",
            "config": {
              "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
              "major": 100,
              "minor": 1,
              "radius": 5
            },
            "backupQR": "qr_beacon_001"
          },
          "content": {
            "en": {
              "description": "Discovered in 1799, this granodiorite stele...",
              "audioUrl": "/media/audio/rosetta_en.mp3",
              "images": ["/media/img/rosetta_01.jpg"],
              "videoUrl": "https://youtube.com/watch?v=..."
            }
          },
          "interactive": {
            "quiz": {
              "question": "In how many languages is the Rosetta Stone inscribed?",
              "options": ["Two", "Three", "Four", "Five"],
              "correct": 1
            }
          },
          "links": [
            {
              "label": "British Museum Collection",
              "url": "https://britishmuseum.org/..."
            }
          ],
          "analytics": {
            "avgDwellTime": 127,
            "audioPlays": 892,
            "quizCompletions": 743
          }
        }
      ]
    }
  ]
}
DELIVERABLES
Build a fully functional prototype with:

At least 2 complete example tours
5-7 beacons per tour demonstrating different content types
All positioning technology configurations available
Working analytics dashboard with sample data
Beacon scanner/testing tools
Media library with sample assets
Responsive, production-ready UI
The app should feel like a professional SaaS platform that museums would actually pay for and use daily.

---

## MULTILINGUAL CONTENT SYSTEM

This document outlines the scope, features, and technical requirements for a modern museum virtual beacons tour management platform. The system enables museums to create, manage, and deploy location-based audio tours using multiple positioning technologies with affordable multilingual support powered by AI.

**Target Users:** Museum curators, tour designers, content managers, educators  
**Primary Goal:** Democratize museum tour creation with enterprise-grade features at accessible price points  
**Key Differentiator:** Multi-technology beacon support + AI-powered multilingual content generation

### PROJECT STATUS (Jan 20, 2026)
    - **Phase 1 (Foundation)**: COMPLETE ✅
    - **Phase 2 (Tours Page)**: COMPLETE ✅
    - **Phase 3 (Stop Manager & Collections)**: COMPLETE ✅
    - **Phase 4 (Content Block System)**: COMPLETE ✅
    - **Phase 5 (API Layer)**: COMPLETE ✅
    - **Phase 6 (Timeline Gallery)**: COMPLETE ✅ PRODUCTION READY
        - Full-screen editor modal with waveform
        - Server-side file storage (100MB limit)
        - Database API for stops (no localStorage)
        - Unsaved changes warning modal
    - **Phase 7 (Framer Motion)**: COMPLETE ✅
        - True crossfade transitions
        - Transition duration slider (0.1s - 1.5s)
        - AnimatePresence for smooth animations
    - **Phase 8 (Thumbnail Markers UI)**: COMPLETE ✅
        - Thumbnail markers replace numbered circles + image strip
        - 64px thumbnails on waveform timeline
        - Click to edit, drag to move
        - Delete in modal (cleaner UX)
    - **Deployment**: Coolify/Docker with persistent volumes
        - Database: Prisma 5.21.1 (pinned for stability)
        - Volumes: `/app/data` (SQLite), `/app/uploads` (media)
        - See `docs/COOLIFY-DEPLOYMENT.md` for configuration
    - **NEXT PHASE**: Translation Infrastructure (i18next, Magic Translate)

---

1. POSITIONING TECHNOLOGY INFRASTRUCTURE
1.1 Tour Creation - Technology Selection
When creating a new tour, museums select their primary positioning method based on:

Budget constraints
Venue characteristics (indoor/outdoor)
Desired accuracy
Existing infrastructure
Visitor device compatibility
Supported Technologies:

Technology	Range	Accuracy	Cost	Best For
BLE Beacon Triangulation	0-50m	±1.5-3m	Low-Medium	Indoor museums with multiple rooms
GPS Coordinates	5-100m	±5-15m	Free	Outdoor exhibits, sculpture gardens
NFC Tags	0-4cm	Contact-based	Very Low	High-security, zero-battery solution
RFID	0-30m	±1-5m	Medium	Artifact tracking + visitor triggers
QR Codes	Visual scan	N/A	Free	Universal backup, zero hardware
WiFi Triangulation	5-50m	±5-15m	Low (if existing)	Buildings with WiFi infrastructure
Ultra-Wideband (UWB)	0-50m	±0.1-0.5m	High	Premium installations, precise tracking
Hybrid/Multi-Modal	Varies	Best available	Varies	Maximum reliability + fallback options
1.2 Technology Configuration Interface
BLE Beacon Setup:

UUID generator/validator
Major/Minor number assignment
RSSI calibration tools
Signal strength visualization
Triangulation zone mapper (2-4 beacons per zone)
Beacon battery life estimator
GPS Configuration:

Interactive map with pin placement
Geofence radius slider (5-100m)
Elevation support for multi-story buildings
Coordinate import from CSV/KML
Test mode with simulated device location
NFC/RFID Setup:

Tag ID generation
Write instructions for physical tags
Tag testing interface
Bulk tag programming data export
QR Code Generator:

Auto-generate unique codes per beacon
Customizable design (colors, logos)
Printable sheets (multiple codes per page)
Tracking analytics per code
Backup QR for all positioning methods
Hybrid Configuration:

Primary + secondary method selection
Fallback priority order
Cross-validation rules (e.g., "trigger only if both BLE AND GPS confirm")
2. MULTILINGUAL CONTENT SYSTEM
2.1 Language Management Architecture
Supported Content Types:

Text (descriptions, labels, instructions)
Audio (narrated tours, ambient sounds)
Media (images, videos with captions/subtitles)
Interactive (quizzes, polls in multiple languages)
Translation Workflows:

Approach	Cost (10k words)	Speed	Quality	Best For
AI Translation (Primary)	~$200-500	Minutes	85-92%	Initial drafts, 20+ languages
Human Review	$1,800+	Days-Weeks	95-99%	Final polish, legal accuracy
Hybrid (AI + Human)	$800-1,200	3-7 days	92-97%	Balanced quality/cost
Community Translation	Free	Variable	70-90%	Budget projects, volunteer networks
2.2 AI Translation Integration
**"Magic Translate" Strategy:**
To simplify the workflow for curators, the system provides a one-click translation experience.

- **Infrastructure**: React-i18next for UI labels and routing.
- **Workflow**: 
    1. Curator writes in Primary Language (e.g., English).
    2. Curator clicks "✨ Magic Translate".
    3. Backend calls AI Service (LibreTranslate/OpenAI).
    4. All selected target languages are populated instantly.
- **Verification**: Curators can manually override AI suggestions in the localized editor.
2.3 Audio Generation System
Text-to-Speech (TTS) Services:

Budget Tier - Standard Quality:

Service	Cost/1M Chars	Quality	Languages	Best For
Google Cloud TTS	$16 (Neural)	8/10	40+	Reliable, affordable
Azure TTS	$16 (Neural)	8.5/10	140+	Most languages
Amazon Polly	$16 (Neural)	7.5/10	30+	AWS integration
OpenAI TTS	$15	8.5/10	25+	Consistent quality
Premium Tier - Studio Quality:

Service	Cost/1M Chars	Quality	Languages	Best For
ElevenLabs	$220-1,320/mo	9.5/10	29+	Premium visitor experience
Play.ht	$150-400/mo	9/10	40+	Voice cloning, emotion
Resemble AI	$180-600/mo	9/10	30+	60% cheaper than ElevenLabs
Specialized Options:

Service	Cost/1M Chars	Quality	Languages	Best For
Speechmatics	$11	8/10	English (expanding)	27x cheaper, good quality
Cartesia Sonic	$50	8.5/10	Multiple	Ultra-low latency (75ms)
Cost Analysis Example:

Small Museum (50 beacons, 200 words each = 10k words/70k chars):
Google/Azure TTS: ~$1.12 for all audio
ElevenLabs: ~$15-20 (monthly subscription)
Human voice actors: $500-2,000+ (one-time, per language)
Large Museum (200 beacons, 300 words = 60k words/420k chars):
Google/Azure TTS: ~$6.72 per language
For 10 languages: ~$67 total
Human narration: $20,000-40,000+ for 10 languages
Audio Generation Features:

Voice selection library (dozens of voices per language)
Emotion/tone controls (enthusiastic, calm, professional)
Speed adjustment (0.75x to 1.5x)
SSML support (pauses, emphasis, pronunciation)
Pronunciation dictionary (custom phonetic spellings)
Audio preview before committing
Batch generation (entire tour in one click)
Waveform editor for fine-tuning
Background music mixing
Audio normalization (consistent volume)
2.4 Speech-to-Text (Transcription)
For museums wanting to transcribe existing recorded tours:

Transcription Services:

Service	Cost	Accuracy	Languages	Features
Amazon Transcribe	$1.44/hr	90-95%	100+	Speaker ID, custom vocab
Google Speech-to-Text	$1.44/hr	92-96%	125+	Video captioning
Azure Speech	$1.00/hr	92-95%	140+	Real-time + batch
Deepgram	$1.00-2.00/hr	93-97%	30+	Fastest, best for voice agents
Rev	$1.50/min ($90/hr)	99% (human)	English+	Human-verified option
Temi	$0.25/min ($15/hr)	85-90%	English	Budget option
Sonix	$10/hr	95-99%	40+	Editor included, timestamps
Transcription Features:

Upload existing audio tours (MP3, WAV, M4A)
Auto-detect language or specify
Speaker diarization (who said what)
Timestamp generation
Punctuation and formatting
Export to DOCX/TXT/SRT/VTT
Edit transcripts in-browser
Re-sync edited text to audio
2.5 Media Localization
Image Localization:

Overlay translated text on images
Multi-language caption system
Alt-text for accessibility (per language)
Image descriptions for screen readers
Video Localization:

Subtitle generation (SRT/VTT format)
Multi-language subtitle tracks
AI-powered dubbing (ElevenLabs, Papercup)
Captions with speaker identification
Burn-in subtitles vs. soft subs
Document Localization:

PDF translation with layout preservation
Multilingual downloadable guides
QR codes linking to language-specific PDFs
3. TOUR BUILDER INTERFACE
3.1 Tour Creation Wizard
Step 1: Basic Information

Tour title (multilingual)
Description (rich text, multilingual)
Featured image/hero banner
Estimated duration (15, 30, 45, 60, 90+ minutes)
Difficulty level: Family-Friendly, General, Academic, Children (5-12), Accessible
Age recommendations
Physical requirements (walking distance, stairs, etc.)
Accessibility features checklist:
 Wheelchair accessible
 Audio descriptions for visually impaired
 Sign language interpretation
 Tactile elements
 Quiet space friendly (autism/sensory)
Category tags (Art, History, Science, Nature, etc.)
Step 2: Positioning Technology

Select primary method (visual cards with pros/cons)
Configure secondary/backup method
Global trigger settings:
Proximity radius (1-100m)
Dwell time threshold (optional)
Entry vs. exit triggers
Auto-advance timer
Test mode activation
Step 3: Language Configuration

Select primary language (for content creation)
Select target languages (checkboxes for 20+ languages)
Choose translation method:
 AI Translation (Google/Amazon/DeepL)
 Human translation (upload later)
 Hybrid (AI first, human review)
Choose audio generation method:
 AI TTS (select service tier)
 Upload recorded audio
 Mix (AI for some languages, human for others)
Step 4: Beacon/Stop Addition

Add beacons via visual map or list
Drag-and-drop reordering
Branching logic (choose-your-own-path tours)
3.2 Beacon/Stop Configuration
Each beacon includes:

Identification:

Beacon ID (auto-generated)
Order number (reorderable)
Stop title (multilingual)
Stop type: Mandatory, Optional, Bonus, Secret
Icon selection (artwork, artifact, photo spot, restroom, exit, etc.)
Positioning Settings:

Technology-specific config (UUID/Major/Minor for BLE, lat/lng for GPS, etc.)
Trigger radius visualization
Entry/exit/dwell trigger options
Time-based auto-advance
Visitor notification settings:
Sound (ding, chime, none)
Vibration (short, long, pattern, none)
Visual alert (banner, modal, subtle)
Content Editor (Per Language):

Rich text editor with formatting
Character/word counter
Reading time estimator
AI writing assistant (expand, summarize, simplify)
Template insertion (from template library)
Media Library:

Image gallery (multiple images per beacon)
Primary image + thumbnails
Image cropping tool
Alt-text editor (per language)
Audio player with upload
Audio trimming tool
Background music option
Video embed (YouTube, Vimeo) or upload
3D model viewer (GLB/GLTF support)
AR marker placement (future integration)
PDF attachment (guides, maps)
Interactive Elements:

Quiz builder:
Question type: Multiple choice, True/False, Open-ended
Correct answer marking
Explanations for answers
Points/scoring
Poll creator (live results visible to curators)
Scavenger hunt challenges
"Take a photo" prompts with upload
Social media share buttons (pre-filled text)
"Fun Facts" expandable cards
"Did You Know?" trivia
Related beacons (suggested next stops)
External Links:

Add multiple links with custom labels
Link type (website, donation, shop, booking)
Open in app vs. external browser
Track click analytics
Accessibility:

Audio description upload (separate from main audio)
Transcript editor (auto-generated from TTS, editable)
Large-print text option
High-contrast mode compatibility
Screen reader optimization tags
3.3 Visual Tour Map
Interactive Map View:

Floor plan upload (PNG/SVG)
Multi-floor support
Beacon placement via drag-and-drop
Connecting lines showing tour path
Branching visualization for choose-your-own-path
Heatmap overlay (popular routes, dwell time)
GPS coordinates display (for outdoor exhibits)
Zoom/pan controls
Beacon clustering (for dense areas)
Visitor flow simulation
List View:

Table with all beacons
Sortable columns (order, title, status, completion rate)
Bulk actions (delete, duplicate, reorder)
Quick filters (by type, language, status)
Search beacons by title/content
Flowchart View:

Node-based tour visualization
Branching logic display
Conditional paths (e.g., "if quiz score > 80%, unlock bonus beacon")
Prerequisites (e.g., "must visit beacon 3 before accessing beacon 7")
4. CONTENT MANAGEMENT FEATURES
4.1 Media Library
Organization:

Folder structure (by tour, by type, by date)
Tagging system (artwork, artifact, people, places, etc.)
Search and filter
Smart collections (auto-group by metadata)
Favorites/starred items
Upload & Processing:

Drag-and-drop bulk upload
Supported formats:
Images: JPG, PNG, WebP, GIF, SVG
Audio: MP3, AAC, WAV, OGG
Video: MP4, WebM, MOV
Documents: PDF
3D: GLB, GLTF
Auto-compression/optimization
Duplicate detection
Metadata extraction (EXIF, ID3)
Storage quota tracking (e.g., 10GB free, upgrades available)
Editing Tools:

Image cropper/rotator
Basic filters (brightness, contrast, saturation)
Audio trimmer
Waveform visualization
Volume normalization
Background noise reduction
AI Features:

Auto-tagging (object recognition)
Auto-captioning (image descriptions)
Content moderation (flag inappropriate content)
Similar image finder
4.2 Template Library
Pre-Built Beacon Templates:

Artwork Description
Artist name, year created
Medium, dimensions
Art movement/style
Interpretation/meaning
"Look closely" details
Historical Artifact
Origin (culture, time period, location)
Material and creation method
Historical context
Discovery/acquisition story
Significance/impact
Interactive Science Exhibit
How it works
Try it yourself instructions
Science behind it
Real-world applications
Fun experiments to try at home
Outdoor Landmark
Historical background
Architectural details
Notable events
Photo opportunities
Seasonal variations
Kids' Discovery Zone
Simple language explanation
Hands-on activity
"Can you find...?" challenge
Coloring/drawing prompt
Accessibility Stop
Tactile description
Audio-only content
Seating area info
Restroom/facilities nearby
Custom Templates:

Save your own beacon configs as templates
Share templates with team
Template marketplace (future: share with other museums)
4.3 Version Control & Collaboration
Version History:

Auto-save every 30 seconds (in-memory)
Manual save points with notes
View version timeline
Compare versions side-by-side (text diff)
Rollback to any previous version
Branch tours for A/B testing
Team Collaboration:

Multi-user roles:
Admin: Full access, user management
Curator: Create/edit tours, manage content
Editor: Edit existing tours, cannot delete
Translator: Edit language versions only
Viewer: Read-only access, analytics
Comments & annotations on beacons
Task assignments ("Please review this translation")
Change notifications (email/in-app)
Activity log (who changed what, when)
Lock mechanism (prevent simultaneous edits)
5. ANALYTICS & INSIGHTS DASHBOARD
5.1 Visitor Analytics
Real-Time Monitoring:

Active tours (live count)
Current visitors per beacon
Heatmap (where visitors are right now)
Live path visualization
Historical Data:

Total visitors (daily, weekly, monthly, yearly)
Unique vs. returning visitors
Completion rate (% who finish tour)
Average tour duration vs. estimated
Drop-off analysis:
Where visitors abandon tours
Which beacons are skipped most
Exit points (where they leave)
Dwell Time Analysis:

Time spent per beacon (average, median, distribution)
Fastest/slowest beacons
Optimal vs. actual dwell time
Engagement correlation (dwell time vs. interaction)
Path Analysis:

Most common routes
Deviation from recommended path
Backtracking (revisit) patterns
Branch selection (for choose-your-own-path)
Entry points (where tours start)
Sequential vs. exploratory behavior
Peak Times:

Busiest hours/days/months
Seasonal trends
Special event impact
Capacity planning data
5.2 Engagement Metrics
Content Interaction:

Audio plays (how many, completion rate)
Video views (start, 25%, 50%, 75%, 100%)
Image gallery swipes
Link clicks (which external links are popular)
PDF downloads
3D model interactions
Interactive Element Performance:

Quiz participation rate
Quiz scores (average, distribution)
Poll responses (real-time results)
Photo uploads (count, quality)
Social media shares (which beacons are shared most)
Scavenger hunt completions
Language Usage:

Most popular languages
Language switching behavior
Translation quality feedback
Feedback & Ratings:

Per-beacon ratings (1-5 stars)
Written reviews
Thumbs up/down quick feedback
Sentiment analysis (AI-powered)
5.3 Technology Performance
Positioning Accuracy:

Trigger success rate (true positives)
False positives (triggered when shouldn't)
False negatives (didn't trigger when should)
GPS drift analysis
BLE signal strength logs
Trigger latency (time from proximity to notification)
System Health:

API response times
Error rates
Audio/video loading times
Battery impact (visitor devices)
Bandwidth usage
5.4 Comparative Reports
Tour-to-Tour Comparison:

Side-by-side metrics
Engagement ranking
Revenue attribution (if tours are paid)
Time Period Comparison:

This month vs. last month
Year-over-year growth
Before/after exhibit changes
Demographic Breakdowns (if collected):

Age groups
Visitor type (local, tourist, student, etc.)
Group vs. solo visitors
Device types (iOS vs. Android)
5.5 Export & Reporting
Export Formats:

CSV (raw data)
PDF (formatted reports with charts)
Excel/Google Sheets (pivot tables ready)
JSON (API integration)
Scheduled Reports:

Daily digest (email)
Weekly summary
Monthly executive report
Custom schedules
Data Visualization:

Interactive charts (bar, line, pie, scatter, area)
Funnel charts (visitor journey)
Heatmaps (spatial, temporal)
Network graphs (path relationships)
Dashboard widgets (drag-and-drop customization)
6. BEACON SCANNING & TESTING TOOLS
6.1 Beacon Scanner Interface
BLE Scanner:

Scan for nearby beacons (list view)
Display: UUID, Major, Minor, RSSI, distance estimate
Signal strength meter (visual bars)
Beacon identification (match to configured beacons)
Range testing (walk-test mode)
Interference detection (competing signals)
Battery level (if beacon broadcasts it)
GPS Tester:

Current GPS coordinates display
Accuracy indicator (meters)
Altitude (for multi-story buildings)
Geofence visualization (am I inside?)
Satellite count (signal quality)
Mock location for testing
NFC/RFID Reader:

Scan NFC tag
Display tag ID and type
Write test data to tag
Tag health check (read/write errors)
QR Code Scanner:

Camera-based scanner
Display decoded data
Validate QR code format
Generate test QR codes on-the-fly
6.2 Field Testing Mode
Walk-Through Simulation:

Start test session
Log all triggers automatically
Timestamp each beacon activation
GPS breadcrumb trail
Record RSSI values over time
Screenshot capture at each beacon
Trigger Debugging:

See why a beacon triggered (or didn't)
Distance from beacon (real-time)
Signal quality
Conditions met/not met
False positive detection
Missed trigger alerts
Test Reports:

Summary of walk-through
Beacon hit rate (which were triggered)
Timing analysis (gaps between beacons)
Issues found (list with severity)
Recommendations (e.g., "move beacon 3 closer to exhibit")
Export as PDF for team review
6.3 Positioning Accuracy Tools
Heatmap Overlay:

Real-time signal strength visualization
Coverage gaps (dead zones)
Optimal placement suggestions
Before/after comparisons
Multi-Device Testing:

Test with different phone models
iOS vs. Android comparison
Bluetooth version impact
Device capability checklist
7. TOUR DEPLOYMENT & PUBLISHING
7.1 Status Management
Tour Status Workflow:

Draft (default)
Editing mode, not visible to visitors
Can have incomplete beacons
Shareable preview link for team
In Review
Submitted for approval
Assigned reviewers notified
Comment/feedback mode
Cannot publish until approved
Testing
Visible to staff only (via test mode QR)
Field testing enabled
Analytics tracking (separate from live)
Bug reporting interface
Scheduled
Set publish date/time
Auto-publish at specified time
Countdown timer
Pre-launch checklist
Published (Live)
Visible to all visitors
QR codes active
Analytics tracking
Limited editing (create new version instead)
Paused
Temporarily unavailable
Reason field (e.g., "exhibit closed for maintenance")
Visitor message (alternative tour suggestions)
Can resume quickly
Archived
No longer active
Preserved for historical record
Can be cloned/restored
Analytics remain accessible
7.2 Publishing Checklist
Pre-Launch Validation:

 All mandatory beacons configured
 All languages have content
 Audio generated/uploaded for all languages
 Images have alt-text
 Positioning tested and working
 No broken links
 Accessibility review completed
 Legal review (if required)
 Marketing materials ready
 Staff training completed
Automated Checks:

Missing content warnings
Untranslated beacons flagged
Audio generation failures
Image optimization suggestions
SEO/metadata completeness
7.3 Visitor-Facing Tour Entry
QR Code Generation:

Tour entry QR code (primary)
Individual beacon QR codes (backup)
Custom QR design (add logo, colors)
High-resolution export (print-ready)
Printable sheets:
Single large QR (entrance poster)
Beacon grid (all beacons on one page)
Individual cards (per beacon)
Web URL:

Shareable tour URL (e.g., museum.com/tours/ancient-egypt)
Short URL generation
Social media preview cards (Open Graph)
SEO optimization
Visitor App Preview:

Mobile-optimized preview
Simulate visitor experience
Test on different screen sizes (phone, tablet)
Accessibility testing mode (screen reader, high contrast)
Performance testing (loading speed)
8. TECHNICAL SPECIFICATIONS
8.1 Frontend Stack
Core Technologies:

React 18+ with Hooks
useState (local state)
useEffect (lifecycle, side effects)
useReducer (complex state logic)
useContext (global state)
useMemo/useCallback (performance)
Custom hooks (reusable logic)
React Router v6 for navigation
Tailwind CSS (core utilities only, NO custom config)
Dark mode default
Light mode toggle
Responsive breakpoints
Accessibility utilities
Component Library:

Lucide React (icons)
Recharts (analytics charts)
React DnD or dnd-kit (drag-and-drop)
React Leaflet (maps for GPS)
State Management:

React Context for global state
NO localStorage or sessionStorage (not supported in artifacts)
In-memory state management
Export to JSON for persistence
Form Management:

Controlled components
Validation rules (required, min/max length, regex)
Error messages (inline, clear)
Auto-save drafts (every 30s)
8.2 Data Architecture
Core Data Models:

json
{
  "museums": [{
    "id": "museum_001",
    "name": "Natural History Museum",
    "location": "New York, NY",
    "buildings": [{
      "id": "building_a",
      "name": "Main Hall",
      "floors": 3,
      "floorPlan": "/uploads/floorplan.png"
    }]
  }],
  
  "tours": [{
    "id": "tour_001",
    "museumId": "museum_001",
    "title": {"en": "Dinosaurs: Age of Giants", "es": "Dinosaurios: Era de Gigantes"},
    "description": {"en": "Journey through...", "es": "Viaje a través..."},
    "status": "published",
    "primaryPositioning": "ble_triangulation",
    "backupPositioning": "qr_code",
    "languages": ["en", "es", "fr", "de", "zh"],
    "duration": 45,
    "difficulty": "family",
    "accessibility": {
      "wheelchair": true,
      "audioDescriptions": true,
      "signLanguage": false,
      "tactile": true
    },
    "createdAt": "2025-01-01T10:00:00Z",
    "publishedAt": "2025-01-15T09:00:00Z",
    "version": 3,
    "analytics": {
      "totalVisitors": 5432,
      "completionRate": 78.3,
      "avgDuration": 43.5,
      "rating": 4.7
    },
    "beacons": ["beacon_001", "beacon_002", ...]
  }],
  
  "beacons": [{
    "id": "beacon_001",
    "tourId": "tour_001",
    "order": 1,
    "title": {"en": "T-Rex: King of Dinosaurs", "es": "T-Rex: Rey de los Dinosaurios"},
    "type": "mandatory",
    "positioning": {
      "ble": {
        "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
        "major": 100,
        "minor": 1,
        "radius": 5
      },
      "gps": {
        "lat": 40.7812,
        "lng": -73.9736,
        "radius": 10
      },
      "qrCode": "qr_beacon_001",
      "nfc": "nfc_tag_001"
    },
    "triggers": {
      "entry": true,
      "exit": false,
      "dwellTime": 20,
      "autoAdvance": 300,
      "notification": {
        "sound": "chime",
        "vibration": "short",
        "visual": "banner"
      }
    },
    "content": {
      "en": {
        "text": "The Tyrannosaurus Rex, meaning 'tyrant lizard king'...",
        "audioUrl": "/media/audio/en/beacon_001.mp3",
        "audioDuration": 127,
        "audioScript": "Welcome to the T-Rex exhibit...",
        "images": [
          {"url": "/media/img/trex_01.jpg", "alt": "Full T-Rex skeleton", "caption": "66 million years old"}
        ],
        "videoUrl": "https://youtube.com/watch?v=xyz",
        "transcript": "Full audio transcript here..."
      },
      "es": {
        "text": "El Tyrannosaurus Rex, que significa 'rey lagarto tirano'...",
        "audioUrl": "/media/audio/es/beacon_001.mp3",
        ...
      }
    },
    "interactive": {
      "quiz": {
        "question": {"en": "How long was an adult T-Rex?", "es": "¿Cuánto medía un T-Rex adulto?"},
        "options": {"en": ["20 feet", "30 feet", "40 feet", "50 feet"], "es": [...]},
        "correct": 2,
        "explanation": {"en": "Adult T-Rex were about 40 feet long!", "es": "..."}
      },
      "poll": {
        "question": {"en": "Would you want to see a living T-Rex?"},
        "options": {"en": ["Yes!", "No way!", "From a distance..."]},
        "results": {"0": 847, "1": 223, "2": 512}
      }
    },
    "links": []
  }
}

---

## FUTURE DEVELOPMENT: Custom Layout, Fonts & Colors

### Overview
Future versions will allow museums to customize the visitor-facing tour experience with their own branding, typography, and color schemes. Currently, tablet devices display larger font sizes than phones (automatic scaling), but full customization is planned.

### Planned Features

#### 1. Device-Specific Typography
| Device | Current | Future Customizable |
|--------|---------|---------------------|
| Phone | Base: 16px, Headers: 24px | Configurable per tour |
| Tablet | Base: 20px, Headers: 40px | Configurable per tour |

#### 2. Custom Font Families
- Primary font (headers): Google Fonts or custom upload
- Secondary font (body text): Google Fonts or custom upload
- Monospace font (captions, metadata): Optional override

#### 3. Color Theme Customization
```typescript
interface TourTheme {
  // Background colors
  bgPrimary: string;      // Main background
  bgSecondary: string;    // Cards, elevated surfaces
  bgAccent: string;       // Highlighted areas
  
  // Text colors
  textPrimary: string;    // Main text
  textSecondary: string;  // Muted text
  textAccent: string;     // Links, highlights
  
  // Accent colors
  accentPrimary: string;  // Buttons, active states
  accentSecondary: string;// Secondary actions
  
  // Borders
  borderDefault: string;
  borderHover: string;
}
```

#### 4. Layout Options
- Content width: narrow / medium / wide / full
- Image sizing: constrained / full-bleed
- Block spacing: compact / comfortable / spacious
- Header alignment: left / center

#### 5. Per-Tour Overrides
Each tour can optionally override the museum's default theme:
- Special exhibition themes
- Seasonal variations
- Accessibility high-contrast mode

### Implementation Notes
- Theme settings stored in Tour model
- CSS custom properties for runtime theming
- Preview mode shows theme changes in real-time
- Export includes theme for offline apps
