# TourStack Handoff Document 📋

**Last Updated**: January 19, 2026  
**Session Status**: Timeline Gallery Production Ready ✅ (Deployed to Coolify)

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
- [x] SQLite database with Prisma 7
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
- [x] Full-screen modal with 3-section layout
- [x] wavesurfer.js waveform visualization
- [x] Draggable markers with **photo numbers**
- [x] Touch support for tablets
- [x] Image upload/reorder/edit
- [x] **Server-side file storage** (100MB limit)
- [x] **Database API for stops** (no localStorage!)
- [x] **Unsaved changes warning** modal

---

## 📋 Next Steps (Priority Order)

### 1. 🟡 Translation Infrastructure
- Set up `i18next` for UI translations
- Implement "Magic Translate" workflow for content
- Language switcher component

### 2. 🟢 Timeline Gallery Enhancements
- Ken Burns Effect (Pan & Zoom)
- Transition configurator (Fade, Cut, Slide)
- Closed captioning editor

### 3. 🔵 JSON Export/Import
- Full export (includes media URLs)
- Import with validation
- Mobile app format

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

---

## 🔧 Commands

```bash
cd app
npm install           # Install dependencies
npm run dev           # Start Vite dev server (localhost:5173)
npm run server        # Start Express API (localhost:3000)
npm run dev:all       # Run both concurrently
```

---

## 🚀 Coolify Deployment

**Required Volume Mounts:**

| Container Path | Purpose |
|---------------|---------|
| `/app/uploads` | Audio/image files |
| `/app/data` | SQLite database |
