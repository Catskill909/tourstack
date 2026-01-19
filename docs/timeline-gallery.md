# Advanced Timeline Gallery: The "Storyteller" Engine

## Vision
Transform the audio-synced image gallery into a powerful, cinematic storytelling tool. Empower curators to create "mini-documentaries" by synchronizing images with audio narration, applying dynamic "Ken Burns" effects, choosing transitions, and orchestrating the visual flow—all through a simple, intuitive drag-and-drop interface.

## Current State Audit
- **Basic Functionality:** Images change at specific timestamps during audio playback.
- **Controls:** Play/Pause, Seek, Volume, Speed.
- **Editor:** List-based timestamp editing, basic drag-and-drop reordering.
- **Preview:** Simple crossfade transition.

## Core Features to Develop

### 1. The "Director's Timeline" UI
A visual, waveform-based editor is the heart of this tool.
- **Audio Waveform:** Visual representation of the audio track for precise timing.
- **Image Tracks:** Images represented as "clips" on a track below the waveform.
- **Drag-and-Drop Sync:** Drag image clips left/right to adjust start times.
- **Duration Handles:** Drag edges of clips to set explicit duration (or have them fill space until the next image).
- **Gap Management:** Visual indication of gaps (black screen? or hold last frame?).

### 2. Cinematic Motion ("Ken Burns" Effects)
Static images are boring. Motion brings them to life.
- **Pan & Zoom Configurator:**
    - **Start Frame:** User sets the initial crop/zoom viewport.
    - **End Frame:** User sets the final crop/zoom viewport.
    - **Duration:** Automatically matches the clip duration.
    - **Easing:** Smooth start/stop (ease-in-out) by default.
- **Presets:** "Slow Zoom In", "Slow Pan Right", "Zoom Out to Reveal", "Face Focus".
- **Face Detection:** (AI Future) Automatically center focus on faces.

### 3. Transitions & Visual Effects
How images change from one to the next.
- **Crossfade:** Classic dissolve. Configurable duration (0.5s, 1s, 2s).
- **Hard Cut:** Instant change. Good for beat-synced edits.
- **Fade to Black:** Dramatic pauses.
- **Slide/Wipe:** Directional transitions.
- **Color Grading:** (Advanced) Black & White, Sepia, or "Vivid" filters per image.

### 4. Audio-Reactive Elements (The "Beat" Sync)
- **Beat Detection:** (AI Future) Auto-detect peaks in narration or music to suggest image change points.
- **Visualizer Overlay:** Optional subtle waveform overlay on the visitor view.

### 5. Accessibility & Closed Captioning (CC)
Ensuring the tour is accessible to all.

#### CC creation Workflows
- **Manual Upload:** Support standard `.vtt` or `.srt` files.
- **Micro-Editor:** Build a subtitle editor right into the timeline. Double-click a region on the waveform to add/edit text.
- **Automated Solutions:**
    - **Free/Browser-Native:** Use Web Speech API for rough client-side transcription (experimental).
    - **Paid/Quality:** Integrate OpenAI Whisper API or Google Cloud Speech-to-Text for high-accuracy generation (pennies per minute).

#### Flexible Display Options
- **Overlay:** Standard "Netflix-style" white text with black outline/bg at the bottom of the image.
- **Off-Screen (Below):** Dedicated text area below the player so no image detail is obscured.
- **Full Screen / Zen:** Image background dimmed, text centered and large.
- **Interactive Transcript:** Scrollable list of text that highlights the currently spoken sentence; clicking a sentence jumps the audio to that point.

## Implementation Roadmap

### Phase 1: Visual Waveform Editor (The Foundation)
**Goal:** Move away from number inputs for timestamps.
- Implement `wavesurfer.js` or similar library.
- Render audio waveform.
- Render "Keyframe" markers on the waveform for each image.
- Allow dragging markers to update `timestamp` in state.

### Phase 2: Enhanced Transitions & Animation Engine
**Goal:** Make the playback look professional.
- Update `TimelineGalleryBlockData` to support per-image transition settings.
- Implement CSS/framer-motion animations for the "Ken Burns" effect (transform: scale/translate).
- Add specific transition types (fade, cut, slide).

### Phase 3: The "Ken Burns" Editor UI
**Goal:** Give users granular control over motion.
- "Crop Editor" component: Show "Start" box (green) and "End" box (red) on the image.
- Preview button to play just that clip's animation.

### Phase 4: Mobile/Touch Optimization
**Goal:** Ensure the editor works on iPad (curators on the mov).
- Touch-friendly drag handles.
- Pinch-to-zoom on the timeline.

## Technical Architecture Changes

### Data Model Updates (`TimelineGalleryBlockData`)
```typescript
interface TimelineImage {
  id: string;
  url: string;
  timestamp: number;
  duration?: number; // If explicit duration needed
  effect?: {
    type: 'ken_burns' | 'static';
    start: { x: number, y: number, scale: number }; // Normalized 0-1
    end: { x: number, y: number, scale: number };
  };
  transition?: {
    type: 'fade' | 'cut' | 'slide';
    duration: number; // ms
  };
}
```

### Dependencies to Evaluate
- `wavesurfer.js`: For waveform rendering and interaction.
- `react-use-gesture`: For complex drag/pinch interactions.
- `framer-motion`: For fluid animations in the player.

## Development Tasks (Next Steps)
1.  **Prototype Waveform:** Create a POC using `wavesurfer.js` to control the existing audio player.
2.  **Schema Migration:** Update `types/index.ts` to support the new effects schema.
3.  **UI overhaul:** Replace the list-based editor with the timeline visualization.
