# Advanced Timeline Gallery: The "Storyteller" Engine

## Vision
Transform the audio-synced image gallery into a powerful, cinematic storytelling tool. Empower curators to create "mini-documentaries" by synchronizing images with audio narration.

---

> [!CAUTION]
> **Local Development**: ALWAYS use `npm run start` from the `/app` directory!
> This kills zombie processes and starts BOTH Vite + Express servers.

---

## 🚦 Implementation Status

### ✅ Completed - Production Ready
- [x] Full-screen modal launcher
- [x] 2-section layout (Preview, Waveform with Thumbnails)
- [x] `wavesurfer.js` waveform visualization
- [x] **Thumbnail markers** on timeline (click to edit, drag to move)
- [x] **Touch support for tablets**
- [x] Basic audio controls (Play/Pause, Skip, Volume)
- [x] Image upload via + button
- [x] Image edit modal (caption, alt text, credit, delete)
- [x] Auto-distribution of timestamps
- [x] **Server-side file storage** (100MB limit)
- [x] **Database storage** for stops (no localStorage!)
- [x] **Unsaved changes warning** modal

### ✅ Phase 2 - Framer Motion Integration (Jan 19, 2026)
- [x] **Framer Motion** added for professional animations
- [x] **True Crossfade** - simultaneous opacity transitions
- [x] **Transition Duration** slider (0.1s - 1.5s)
- [x] **AnimatePresence** for smooth enter/exit animations

### ✅ Phase 3 - Thumbnail Markers UI (Jan 20, 2026)
- [x] **Thumbnail markers** replace numbered circles + image strip
- [x] **64px thumbnails** on waveform timeline
- [x] **Click to edit** - opens caption/alt/credit modal
- [x] **Drag to move** - changes timestamp
- [x] **Delete in modal** - cleaner UX
- [x] **Drag vs click detection** - `hasDraggedRef` prevents false clicks

### ✅ Phase 4 - Transcription & Closed Captions (Jan 21, 2026)
- [x] **Transcribe button** in Timeline Gallery Editor header
- [x] **Deepgram integration** for word-level timestamps
- [x] **ClosedCaptions component** with real-time word highlighting
- [x] **CC toggle** in Editor and Preview player
- [x] Word-level sync - current word highlighted in yellow

### 📋 Next Phase
- [ ] Ken Burns Effect (Pan & Zoom) Editor
- [ ] Slide Left/Right transitions (using Framer Motion variants)
- [ ] Zoom transitions

---

## 🖼️ Thumbnail Markers UI

### Why Thumbnail Markers?
The old UI had:
- Numbered circles on waveform
- Separate image strip at bottom
- Confusion about which number matches which image

The new UI has:
- **Thumbnails directly on the timeline**
- Images ARE the markers
- Visual clarity - you SEE what plays when

### Interactions
| Action | Result |
|--------|--------|
| **Drag thumbnail** | Changes timestamp |
| **Click thumbnail** | Opens edit modal |
| **Edit modal Delete** | Removes image |
| **+ button** | Add new image |

### Technical Implementation
```tsx
// Drag vs click detection
const hasDraggedRef = useRef(false);

// In handleMouseMove:
hasDraggedRef.current = true;

// In handleMouseUp:
setTimeout(() => { hasDraggedRef.current = false; }, 50);

// In onClick:
if (!hasDraggedRef.current) {
    onMarkerClick?.(marker.id);
}
```

---

## 🎬 Framer Motion Integration

### Why Framer Motion?
- **React-first** - Declarative API designed for React
- **AnimatePresence** - Handles exit animations gracefully
- **Gesture Support** - Built-in drag, hover, tap (for Ken Burns editor)
- **Layout Animations** - Smooth size/position changes

### Current Implementation
```tsx
<AnimatePresence initial={false}>
  <motion.img
    key={currentImage.id}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: transitionDuration, ease: 'easeInOut' }}
  />
</AnimatePresence>
```

### Available Features for Future Development

| Feature | Description | Use Case |
|---------|-------------|----------|
| **Variants** | Define animation states | Slide/Zoom transitions |
| **useScroll** | Scroll-linked animations | Parallax Ken Burns |
| **useDrag** | Draggable elements | Ken Burns editor handles |
| **layoutId** | Shared element transitions | Gallery → Fullscreen |
| **AnimatePresence** | Exit animations | Current crossfade |
| **Stagger** | Cascading animations | Multi-image reveals |
| **Spring** | Physics-based motion | Natural movements |

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

### Waveform Timeline with Thumbnails
- 64px thumbnail images positioned above waveform
- Drag thumbnails to adjust image timing
- Click thumbnail to open edit modal
- Connecting lines from thumbnail to waveform
- Timestamp tooltip shown while dragging

### Edit Modal
- Caption field (multilingual)
- Alt text field (accessibility)
- Credit/Attribution field
- **Delete button** (red, with confirmation)
- Done button to close

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
- `framer-motion` - Professional animations (~32KB)
- `multer` - File upload handling
