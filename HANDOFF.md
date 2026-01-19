 # TourStack Handoff Document 📋

**Last Updated**: January 19, 2026  
**Session Status**: API Layer Complete ✅

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

### Phase 1: Foundation
- [x] Git repo → [GitHub](https://github.com/Catskill909/tourstack)
- [x] Vite + React 19 + TypeScript
- [x] Tailwind CSS v4, Dark Mode Material Design
- [x] SQLite database with Prisma 7
- [x] Zustand state management
- [x] Settings page with API key configuration

### Phase 2: Tours Management
- [x] Tours page with CRUD operations
- [x] 3-step create wizard (Template → Info → Review)
- [x] Tour cards with status badges, action menus
- [x] Search/filter, keyboard shortcuts (⌘N)
- [x] 7 technology-based templates (QR, GPS, BLE, NFC, RFID, WiFi, UWB)

### Phase 3: Tour Editing & Images
- [x] Edit Tour modal with all fields (title, description, duration)
- [x] ImageUpload component (drag-and-drop + click)
- [x] Hero images on tour cards
- [x] Duplicate and delete tour functionality

### Phase 4: Architecture Planning
- [x] Deep audit of codebase and documentation
- [x] Content Block System design (9 block types)
- [x] JSON Export Schema specification
- [x] Translation Infrastructure plan (i18next + AI)
- [x] Phased development roadmap

### Phase 5.5: API Layer & Deployment (COMPLETE ✅)
- [x] Express API server (`server/index.ts`)
- [x] Tours, Stops, Templates, Media CRUD endpoints
- [x] SQLite persistence via Prisma (replaces localStorage)
- [x] Production Dockerfile optimized (multi-stage, init scripts)
- [x] **CRITICAL**: Fixed Docker/SQLite volume mounting issue (see `docs/DB-DEBUG.md`)
- [x] Database now resides at `/app/data/dev.db` for proper persistence

---

## 🔜 Next Steps for Next Session

**Recommended Focus**: Phase 6 (Translation) or Phase 5 (Advanced Content Blocks)

1. **Verify Production Persistence**: Upload some images and create tours in production, then restart the container to ensure data persists.
2. **Translation Infrastructure**: Set up `i18next` effectively, as the data structure is already `{"en": "val", "es": "val"}` ready.
3. **Advanced Blocks**: Implement the Video or Collection blocks.

### Phase 5: Content Block System (CORE COMPLETE ✅)
**Goal**: Build modular stop editor with content blocks

1. **Update Types** (`types/index.ts`) ✅
   - Added `ContentBlock` discriminated union
   - Added block-specific data types (TextBlock, ImageBlock, etc.)
   
2. **Build Block Renderer** (`StopContentBlock.tsx`) ✅
   - Renders blocks based on type
   - Supports edit/view modes with clickable preview
   
3. **Build Stop Editor** (`StopEditor.tsx`) ✅
   - Basic info section (title, description)
   - Content blocks: add/edit/delete/reorder
   - Preview mode toggle
   
4. **Build Stop List** (`TourDetail.tsx`) ✅
   - Display stops with actions
   - Edit button opens StopEditor
   - QR icon opens QR Code Editor Modal

5. **QR Code Editor** (`QRCodeEditorModal.tsx`) ✅
   - Editable target URL and short code
   - QR regeneration and download
   - Stop-level config (not content block)

**Content Blocks implemented**:
- [x] Text Block (rich text, multilingual)
- [x] Image Block (single image with caption)
- [x] Audio Block (player with transcript)
- [x] Gallery Block (multiple images, carousel/grid/masonry, timeline mode)

**Remaining for Phase 5**:
- [ ] Video Block (embed or upload)
- [ ] Collection Block (link to collections)

---

### Phase 6: Translation Infrastructure
**Goal**: Multilingual support from the ground up

1. **i18next Setup**
   - Install react-i18next
   - Create locale files (en, es, fr)
   - Language switcher component
   
2. **Content Translation**
   - "Magic Translate" button in stop editor
   - Translation service abstraction (LibreTranslate/OpenAI)
   - Manual override for AI translations
   
3. **Audio Generation**
   - TTS service integration (Google Cloud TTS)
   - Per-language audio file generation
   - Batch generation for entire tour

---

### Phase 7: JSON Export/Import
**Goal**: Portable tour data

1. **Export Service**
   - Full export (includes base64 images)
   - Lightweight export (media as URLs)
   - Mobile app format
   
2. **Import Service**
   - Validate JSON schema
   - Handle version migrations
   - Conflict resolution

---

### Phase 8: Polish & Advanced Features
- Interactive elements (quiz, poll)
- Analytics dashboard
- Beacon testing tools
- Multi-museum support

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
| Dashboard | `app/src/pages/Dashboard.tsx` |
| Settings | `app/src/pages/Settings.tsx` |
| **Components** | |
| Tour Card | `app/src/components/TourCard.tsx` |
| Create Tour Modal | `app/src/components/CreateTourModal.tsx` |
| Edit Tour Modal | `app/src/components/EditTourModal.tsx` |
| Image Upload | `app/src/components/ImageUpload.tsx` |
| Stop Editor | `app/src/components/StopEditor.tsx` |
| QR Code Modal | `app/src/components/QRCodeEditorModal.tsx` |
| **Block Editors** | |
| Block Renderer | `app/src/components/blocks/StopContentBlock.tsx` |
| Text Block | `app/src/components/blocks/TextBlockEditor.tsx` |
| Image Block | `app/src/components/blocks/ImageBlockEditor.tsx` |
| Audio Block | `app/src/components/blocks/AudioBlockEditor.tsx` |
| Gallery Block | `app/src/components/blocks/GalleryBlockEditor.tsx` |
| **Services** | |
| Tour Service | `app/src/lib/tourService.ts` |
| **Schema** | |
| Prisma Schema | `app/prisma/schema.prisma` |
| TypeScript Types | `app/src/types/index.ts` |
| **Stores** | |
| Tours Store | `app/src/stores/useToursStore.ts` |

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

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | Quick start and overview |
| `HANDOFF.md` | This file - dev handoff |
| `tourstack.md` | Full scope document (reference) |
| `docs/ARCHITECTURE.md` | Content block system design |

---

## 💡 Key Decisions

1. **Content Blocks over Flat Fields**: Flexible, extensible stop content
2. **File Storage over Base64**: Files saved to `/uploads`, URLs in database
3. **JSON Export**: Primary persistence and portability method
4. **Translation-First**: All text is `{ lang: value }` from day one
5. **Technology Templates**: Tours organized by positioning method
6. **Express API**: Backend for SQLite persistence and file uploads

---

## 🚀 Coolify Deployment

Add persistent storage volumes in Coolify:

| Container Path | Host Path |
|---------------|-----------|
| `/app/uploads` | `/data/tourstack/uploads` |
| `/app/dev.db` | `/data/tourstack/dev.db` |

The Dockerfile runs Express which serves both the API and React SPA.
