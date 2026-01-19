# TourStack Handoff Document 📋

**Last Updated**: January 19, 2026  
**Session Status**: Timeline Gallery Production Ready ✅ (Server-Side File Storage Complete)

---

## 🏗️ Architecture Overview

TourStack uses a **modular content block system** where tours and stops are composed of reusable, typed blocks. This enables:
- **Simple stops**: Just title + description + QR code
- **Rich stops**: Galleries, audio, video, collections, timelines

### Core Principles
1. **Modular Blocks**: All content is typed blocks with consistent schemas
2. **JSON-First**: Clean export/import for backup, mobile apps, API
3. **Translation-Ready**: All text fields are `{ [lang]: value }` objects
4. **Positioning-Agnostic**: Support QR, GPS, BLE, NFC, RFID, WiFi, UWB

---

## ✅ Completed Work

### Phase 1: Foundation ✅
- [x] Git repo → [GitHub](https://github.com/Catskill909/tourstack)
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS v4, Dark Mode Material Design
- [x] SQLite database with Prisma 7
- [x] Zustand state management
- [x] Settings page with API key configuration

### Phase 2: Tours Management ✅
- [x] Tours page with CRUD operations
- [x] 3-step create wizard (Template → Info → Review)
- [x] Tour cards with status badges, action menus
- [x] Search/filter, keyboard shortcuts (⌘N)
- [x] 7 technology-based templates (QR, GPS, BLE, NFC, RFID, WiFi, UWB)

### Phase 3: Tour Editing & Images ✅
- [x] Edit Tour modal with all fields (title, description, duration)
- [x] ImageUpload component (drag-and-drop + click)
- [x] Hero images on tour cards
- [x] Duplicate and delete tour functionality

### Phase 4: Architecture Planning ✅
- [x] Deep audit of codebase and documentation
- [x] Content Block System design (9 block types)
- [x] JSON Export Schema specification
- [x] Translation Infrastructure plan (i18next + AI)

### Phase 5: Content Block System ✅
- [x] Text Block (rich text, multilingual)
- [x] Image Block (single image with caption)
- [x] Audio Block (custom player with transcript)
- [x] Gallery Block (carousel/grid/masonry layouts)
- [x] Timeline Gallery Block (audio-synced images)

### Phase 5.5: API Layer ✅
- [x] Express API server (`server/index.ts`)
- [x] Tours, Stops, Templates, Media CRUD endpoints
- [x] SQLite persistence via Prisma
- [x] Production Dockerfile (multi-stage, init scripts)
- [x] Database at `/app/data/dev.db` for proper persistence

### Phase 5.6: Timeline Gallery Editor ✅ (UI Complete)
- [x] Full-screen modal with 3-section layout
- [x] wavesurfer.js waveform visualization
- [x] Draggable markers for timestamp adjustment
- [x] Touch support for tablets
- [x] Image upload with drag-and-drop
- [x] Image reordering via drag-and-drop
- [x] Image edit modal (caption, alt text, credit)
- [x] Auto-distribution of timestamps

---

## ✅ Recently Completed: Server-Side File Storage

### What Was Done
- Added `/api/media/upload` endpoint in `server/routes/media.ts`
- Updated `TimelineGalleryEditorModal.tsx` to upload via API
- Audio files → `/uploads/audio/`
- Image files → `/uploads/images/`
- 100MB file size limit
- Vite proxy already configured for `/api` and `/uploads`

### Testing
1. Restart the API server: `npm run server`
2. Open Timeline Gallery editor
3. Upload a large audio file (>5MB)
4. Confirm it saves successfully and plays back

---

## 📋 Next Steps (Priority Order)

### 1. 🟡 Stops API Migration
Move stops from localStorage to PostgreSQL.
- `GET/POST/PUT/DELETE /api/stops`
- Update `TourDetail.tsx` to use API

### 3. 🟢 Timeline Gallery Enhancements (After Storage Fixed)
- Ken Burns effect (pan/zoom)
- Transition configurator
- Closed captioning editor

### 4. 🔵 Translation Infrastructure
- Set up i18next
- Implement "Magic Translate" workflow

---

## 📁 Key Files

| Purpose | Path |
|---------|------|
| **API Server** | |
| Express Server | `app/server/index.ts` |
| Database Client | `app/server/db.ts` |
| Tours API | `app/server/routes/tours.ts` |
| Stops API | `app/server/routes/stops.ts` |
| Templates API | `app/server/routes/templates.ts` |
| Media API | `app/server/routes/media.ts` |
| **Pages** | |
| Tours Page | `app/src/pages/Tours.tsx` |
| Tour Detail | `app/src/pages/TourDetail.tsx` |
| Dashboard | `app/src/pages/Dashboard.tsx` |
| Settings | `app/src/pages/Settings.tsx` |
| **Components** | |
| Stop Editor | `app/src/components/StopEditor.tsx` |
| QR Code Modal | `app/src/components/QRCodeEditorModal.tsx` |
| **Block Editors** | |
| Block Renderer | `app/src/components/blocks/StopContentBlock.tsx` |
| Text Block | `app/src/components/blocks/TextBlockEditor.tsx` |
| Image Block | `app/src/components/blocks/ImageBlockEditor.tsx` |
| Audio Block | `app/src/components/blocks/AudioBlockEditor.tsx` |
| Gallery Block | `app/src/components/blocks/GalleryBlockEditor.tsx` |
| **Timeline Gallery** | |
| Editor Modal | `app/src/components/blocks/TimelineGalleryEditorModal.tsx` |
| Waveform | `app/src/components/blocks/AudioWaveform.tsx` |
| Block Editor | `app/src/components/blocks/TimelineGalleryBlockEditor.tsx` |
| **Documentation** | |
| Timeline Feature | `docs/timeline-gallery.md` |
| Architecture | `docs/ARCHITECTURE.md` |

---

## 🗄️ Database Models

| Model | Purpose |
|-------|---------|
| Museum | Organization with branding |
| Template | Tour templates (7 positioning types) |
| Tour | Tours with multilingual content |
| Stop | Tour stops with content blocks |
| Collection | Reusable content galleries |
| Media | Media library assets |
| AppSettings | API keys and preferences |

---

## 🔧 Commands

```bash
cd app
npm install           # Install dependencies
npm run dev           # Start Vite dev server (localhost:5173)
npm run server        # Start Express API server (localhost:3000)
npm run dev:all       # Run both Vite + Express concurrently
npm run build         # Build for production
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed templates
npm run db:studio     # Open Prisma Studio
```

---

## 💡 Key Decisions

1. **Content Blocks over Flat Fields**: Flexible, extensible stop content
2. **File Storage Required**: Base64 in localStorage doesn't scale
3. **JSON Export**: Primary persistence and portability method
4. **Translation-First**: All text is `{ lang: value }` from day one
5. **Technology Templates**: Tours organized by positioning method
6. **wavesurfer.js**: For audio waveform visualization

---

## 🚀 Coolify Deployment

Add persistent storage volumes in Coolify:

| Container Path | Host Path |
|---------------|-----------|
| `/app/uploads` | `/data/tourstack/uploads` |
| `/app/data` | `/data/tourstack/data` |

The Dockerfile runs Express which serves both the API and React SPA.
