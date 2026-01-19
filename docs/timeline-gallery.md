# Advanced Timeline Gallery: The "Storyteller" Engine

## Vision
Transform the audio-synced image gallery into a powerful, cinematic storytelling tool. Empower curators to create "mini-documentaries" by synchronizing images with audio narration, applying dynamic "Ken Burns" effects, choosing transitions, and orchestrating the visual flow—all through a simple, intuitive drag-and-drop interface.

---

## 🚦 Implementation Status

### ✅ Completed
- [x] Full-screen modal launcher (button in StopEditor)
- [x] Modern 3-section layout (Preview, Waveform, Image Strip)
- [x] `wavesurfer.js` integration for waveform visualization
- [x] Draggable markers on waveform for timestamp adjustment
- [x] Touch support for marker dragging (tablets)
- [x] Basic audio controls (Play/Pause, Skip, Volume)
- [x] Image upload with drag-and-drop
- [x] Image reordering via drag-and-drop
- [x] Image edit modal (caption, alt text, credit)
- [x] Auto-distribution of new images across timeline
- [x] Marker clamping to audio duration
- [x] **Server-side file storage** (audio/images uploaded to `/uploads/`)

### 🚧 Current Status: Production Ready ✅
The Timeline Gallery now supports large audio files by uploading to the server instead of using base64.

### 📋 Planned Features
- [ ] Ken Burns Effect (Pan & Zoom) Editor
- [ ] Transition configurator (Fade, Cut, Slide)
- [ ] Closed Captioning editor
- [ ] Pinch-to-zoom on timeline

---

## 🏭 Production Readiness Audit

### ❌ NOT Ready for Production

The Timeline Gallery is currently suitable for **development and demonstration** only.

| Issue | Current State | Production Fix |
|-------|--------------|----------------|
| **File Storage** | Base64 in localStorage (~5MB limit) | Server-side file uploads to disk/S3 |
| **Data Persistence** | localStorage (browser only) | PostgreSQL via Prisma + Express API |
| **Audio Files** | Inline base64 | CDN-hosted audio files |
| **Image Files** | Inline base64 | CDN-hosted images with thumbnails |

### Migration Path to Production

#### Phase A: Server-Side File Storage
1. Create `/api/upload` endpoint in Express server
2. Store files to `./uploads/` directory (or S3 bucket)
3. Return URL instead of base64
4. Update components to use URLs

```typescript
// Example: Express file upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});
```

#### Phase B: Database Storage
1. Move stops from localStorage to PostgreSQL
2. API endpoints: `GET/POST/PUT/DELETE /api/stops`
3. Update `TourDetail.tsx` to use API calls

#### Phase C: Production Deployment
1. Configure Coolify for file persistence
2. Set up CDN for media delivery
3. Add proper CORS and authentication

---

## 🎨 UI/UX Design Specification

### Screen Layout (Full-Screen Modal)

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER                                                           │
│ [🎵 Timeline Gallery Editor]              [3 images] [Done] [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     PREVIEW CANVAS (40%)                         │
│                                                                  │
│     ┌─────────────────────────────────────────────────┐         │
│     │            Current Image (16:9 aspect)           │         │
│     │  [⏱️ 1:23]                               [2/5]   │         │
│     └─────────────────────────────────────────────────┘         │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ WAVEFORM TIMELINE (30%)                                          │
│                                                                  │
│  0:00 ────────────●────────●─────────●─────────── 4:15          │
│        [Play] [Skip-10] [Skip+10] [Volume]                       │
│                                                                  │
│  ● Drag YELLOW markers to adjust image timing                    │
├─────────────────────────────────────────────────────────────────┤
│ IMAGE STRIP (30%)                                                │
│                                                                  │
│  [+ Add] [🖼️] [🖼️] [🖼️] [🖼️] [🖼️]  →                         │
│           ↑                                                      │
│        Tap to select, drag to reorder                           │
│        Pencil = edit, Trash = delete                            │
└─────────────────────────────────────────────────────────────────┘
```

### Marker Interaction
- **Yellow dots** at top and bottom of waveform = image timestamps
- **Click and drag** markers left/right to adjust timing
- **Touch and drag** works on tablets
- **Tooltip** shows timestamp while hovering/dragging

---

## Technical Architecture

### Data Model (`TimelineGalleryBlockData`)
```typescript
interface TimelineGalleryBlockData {
  images: Array<{
    id: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
    timestamp: number;  // Seconds into audio
  }>;
  audioUrl: string;
  audioDuration: number;
  crossfadeDuration?: number;
}
```

### Dependencies
- `wavesurfer.js` ✅ Installed
- `framer-motion` (future: for smooth animations)

---

## Testing Workarounds

### Storage Quota Issue
For local testing with large audio files:

1. **Use smaller audio files** - Under 2MB works reliably
2. **Clear browser storage** - DevTools > Application > Storage > Clear site data
3. **Use the "Clear All Data" button** in the Storage Full modal

### Recommended Test Audio
- Short narration clips (30-60 seconds)
- Compress MP3 to 64kbps mono
- Total file size under 2MB

---

## Development Phases

### Phase 0: UI/UX Foundation ✅ COMPLETE
- Full-screen modal
- 3-section layout
- Touch-friendly controls

### Phase 1: Waveform Timeline ✅ COMPLETE
- wavesurfer.js integration
- Draggable markers
- Touch support

### Phase 2: Ken Burns Effect Editor 📋 PLANNED
- Start/End crop selector
- Effect presets
- Per-image preview

### Phase 3: Transitions 📋 PLANNED
- Transition type selector
- Duration controls
- Preview transitions

### Phase 4: Closed Captioning 📋 PLANNED
- VTT/SRT import
- Manual caption editor
- Display mode selector

### Phase 5: Server-Side Storage 📋 REQUIRED FOR PRODUCTION
- File upload API
- PostgreSQL persistence
- CDN integration
