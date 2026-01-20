# Advanced Timeline Gallery: The "Storyteller" Engine

## Vision
Transform the audio-synced image gallery into a powerful, cinematic storytelling tool. Empower curators to create "mini-documentaries" by synchronizing images with audio narration.

---

## 🚦 Implementation Status

### ✅ Completed - Production Ready
- [x] Full-screen modal launcher
- [x] 3-section layout (Preview, Waveform, Image Strip)
- [x] `wavesurfer.js` waveform visualization
- [x] Draggable markers for timestamp adjustment
- [x] **Numbered markers** (photo numbers on handles)
- [x] **Touch support for tablets** (Markers + Drag & Drop Image Reordering)
- [x] Basic audio controls (Play/Pause, Skip, Volume)
- [x] Image upload with drag-and-drop
- [x] Image reordering via drag-and-drop
- [x] Image edit modal (caption, alt text, credit)
- [x] Auto-distribution of timestamps
- [x] **Server-side file storage** (100MB limit)
- [x] **Database storage** for stops (no localStorage!)
- [x] **Unsaved changes warning** modal

### 📋 Phase 2 - In Progress
- [x] **Transition Types** (fade, cut, slideLeft, slideRight, zoom)
- [x] **Transition Duration** slider (0.1s - 1.5s)
- [x] **Image Preloading** with loading indicator
- [ ] Ken Burns Effect (Pan & Zoom) Editor
- [ ] Closed Captioning editor

---

## 🏭 Production Deployment

### ✅ Production Ready

| Component | Status |
|-----------|--------|
| File uploads | `/uploads/audio/` and `/uploads/images/` |
| File size limit | 100MB |
| Stop data | SQLite database via `/api/stops` |
| Data persistence | Coolify volumes |

### Coolify Volume Configuration

| Container Path | Purpose |
|---------------|---------|
| `/app/uploads` | Audio and image files |
| `/app/data` | SQLite database |

---

## 🎨 UI/UX Features

### Waveform Timeline
- Yellow numbered markers at top and bottom
- Drag markers to adjust image timing
- Tooltip shows `#N • timestamp` on hover
- Touch support for tablets

### Image Strip
- Drag to reorder images
- Click pencil to edit caption/alt/credit
- Click trash to delete
- Photo numbers match waveform markers

### Save Workflow
- **Yellow pulsing Save button** when unsaved changes
- **"Unsaved changes"** text indicator in header
- **Warning modal** when closing with unsaved changes:
  - Cancel - stay in editor
  - Discard - lose changes
  - Save - save and close

---

## Technical Details

### File Storage
```
/app/uploads/
├── audio/    ← MP3, WAV, OGG files
├── images/   ← JPG, PNG, WebP files
└── documents/ ← PDFs
```

### API Endpoints
- `POST /api/media/upload` - Quick file upload
- `GET/POST/PUT/DELETE /api/stops` - Stop CRUD
- `PUT /api/stops/reorder/:tourId` - Reorder stops

### Dependencies
- `wavesurfer.js` - Audio waveform visualization
- `multer` - File upload handling
