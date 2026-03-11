# Image Map Block — Development Guide

**Created:** March 9, 2026 | **Phase 28**
**Status:** Phase 1 + Phase 1+ COMPLETE ✅
**Next up:** Phase 2 editor polish, then Phase 3 AI & Accessibility

---

## Table of Contents

1. [Overview](#overview)
2. [Status Dashboard](#status-dashboard)
3. [Architecture](#architecture)
4. [What's Built](#whats-built-implemented)
5. [Data Model](#data-model-actual-types)
6. [File Reference](#file-reference)
7. [Technical Notes](#technical-notes)
8. [Roadmap](#roadmap-whats-next)
9. [Design Reference](#design-reference)

---

## Overview

TourStack has two map providers (OpenStreetMap + Google Maps) for **outdoor/geographic** maps. But most museums operate **indoors** where GPS is unreliable and geographic maps are meaningless.

> **A curator uploads a floor plan image, places markers on it, and visitors tap those markers to navigate the tour.**

Why this matters:
- **80%+ of museum tours are indoors** — geographic maps don't help inside a building
- **Floor plans are universally available** — every museum has them
- **No API keys or GPS required** — works offline, zero cost, zero hardware
- **Positioning-agnostic** — markers can link to stops triggered by ANY method (NFC, QR, GPS, manual)

**This is NOT:**
- A replacement for the geographic Map block (Leaflet/Google Maps stays for outdoor tours)
- An indoor positioning system (no triangulation, no floor detection)
- Dependent on any positioning technology (markers are visual links, not auto-triggers)

---

## Status Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| **Block type registration** | ✅ Done | `imageMap` in ContentBlockType, StopEditor, StopContentBlock |
| **Image upload + display** | ✅ Done | Reuses existing ImageUpload + `/api/media` endpoint |
| **Click-to-place markers** | ✅ Done | Percentage-based coordinates (0-100 x/y) |
| **Drag-to-reposition markers** | ✅ Done | Mouse + touch drag in editor modal |
| **5 marker icon styles** | ✅ Done | Pin, dot, number, star, info |
| **7+ marker colors** | ✅ Done | Predefined palette in editor |
| **Stop linking** | ✅ Done | Dropdown populated from tour stops |
| **Info text popups** | ✅ Done | Glass-morphism popup on visitor tap |
| **Full-screen editor modal** | ✅ Done | `ImageMapEditorModal.tsx` — canvas + sidebar |
| **Multi-floor support** | ✅ Done | `ImageMapFloor` type, floor tab bar, per-floor images/markers |
| **Legend** | ✅ Done | Toggle-able legend grid below map |
| **Pinch-to-zoom** | ✅ Done | CSS transform-based touch zoom |
| **Translation integration** | ✅ Done | LanguageSwitcher + global Translate All via `magicTranslate()` |
| **Responsive preview sizing** | ✅ Done | Width-based (`max-w-*` phone, `w-full` tablet/kiosk) |
| **Marker list sidebar** | ✅ Done | Select, edit, delete markers from list |
| **TypeScript clean** | ✅ Done | Zero errors, production build passes |
| Marker drag-to-reorder in list | 🔜 Next | GripVertical icon shown but reorder not wired |
| Marker categories & filters | 🔜 Next | Group by exhibits/facilities/exits |
| "Where Am I?" button | 🔜 Future | Uses last-visited-stop + GPS + QR/NFC |
| AI Auto-Marker Placement | 🔜 Next | Gemini/GPT-4V detects rooms on floor plans |
| AI Description Generator | 🔜 Next | Auto-generate info text from stop content |
| Accessibility Annotations | 🔜 Next | Wheelchair routes, tactile paths, elevators |
| Walk-and-assign field mode | 🔜 Future | GPS → image coordinate mapping |
| Custom marker icons | 🔜 Future | Upload custom PNG/SVG per marker |
| Animated route paths | 🔜 Future | SVG polyline overlay between markers |

---

## Architecture

### Decision: New Block Type (not a mode of `map`)

1. The existing `map` block is built on Leaflet/Google Maps — geographic tile rendering with lat/lng coordinates
2. Image Map uses **pixel coordinates on an uploaded image** — fundamentally different rendering
3. Mixing them would create a franken-component with two incompatible coordinate systems
4. Separate block = cleaner code, independent iteration, no risk to working map block

### Image Map vs Geographic Map

| | Geographic Map (`map`) | Image Map (`imageMap`) |
|---|---|---|
| **Rendering** | Leaflet/Google Maps tiles | Uploaded image (PNG/JPG/SVG) |
| **Coordinates** | Latitude/longitude | Percentage (0-100 x/y) |
| **Best for** | Outdoor tours, city walks | Indoor exhibits, floor plans |
| **Positioning** | GPS geofencing auto-trigger | Visual navigation (tap to go) |
| **Dependencies** | Leaflet, Google Maps API | None (just HTML/CSS) |
| **Cost** | Free (OSM) or API key (Google) | Free |

**Future convergence:** The geographic Map block could eventually support floor plan overlays (Leaflet's `L.imageOverlay`) with geo-calibrated bounds. That's complex — the Image Map block provides 90% of the value with 10% of the complexity.

---

## What's Built (Implemented)

### Phase 1: Core Image Map Block ✅

Everything needed for a curator to create and publish an Image Map:

- **Block registration** — `imageMap` in ContentBlockType union, StopEditor "Add Block" menu, StopContentBlock switch case
- **Image upload** — Reuses existing `ImageUpload` component and `/api/media` endpoint
- **Click-to-place markers** — Click anywhere on the floor plan image to add a marker at percentage-based coordinates
- **Marker configuration** — Label (multilingual), icon style (5 types), color (7+ options), stop link, info text
- **Visitor preview** — Floor plan with tappable markers, linked markers navigate to stops, unlinked show info popups
- **Size options** — Small, medium, large, full display sizes
- **Settings toggles** — Show labels, label position, zoomable, show legend

**Default block data:**
```typescript
{ imageUrl: '', markers: [], size: 'large', showLabels: true, zoomable: true, showLegend: false }
```

### Phase 1+ Enhancements ✅

Built on top of Phase 1 in the same session:

#### Full-Screen Editor Modal
- `ImageMapEditorModal.tsx` (~806 lines) — Full-screen modal matching Map and Timeline Gallery editors
- Left: large canvas area for marker placement + drag
- Right sidebar: **Markers tab** (selected marker editor + scrollable marker list) and **Settings tab** (size, labels, zoom, legend toggles)
- Floor tab bar at top for multi-floor navigation
- Translation header with LanguageSwitcher + coverage counter + "Translate All" button

#### Info Text Popups
- `infoText` field on `ImageMapMarker` — multilingual rich text
- Visitor tap triggers glass-morphism popup overlay (backdrop blur, rounded corners, smooth animations)
- Popup shows: marker label, description text, optional "Go to stop" CTA button
- Works for both info-only and linked markers

#### Multi-Floor Support
- `ImageMapFloor` type with `id`, `imageUrl`, `imageAlt`, `label`, `order`, `markers[]`
- Floor switcher pill buttons in both editor and visitor view
- Each floor has its own uploaded image and independent marker set
- Backward-compatible: single-image blocks work in flat `imageUrl`/`markers` format
- `getFloors()` helper auto-synthesizes a "default" floor from legacy data
- `syncToData()` maintains backward compat (1 floor → flat format, 2+ → `floors[]`)

#### Legend
- Toggle via `showLegend` in settings
- Renders clickable marker grid below the floor plan
- Shows color dot, number prefix, and label for each marker
- Click legend item → triggers marker info popup

#### Translation
- `LanguageSwitcher` component in modal header
- Single "Translate All" button using `magicTranslate()` via `Promise.all()` for parallel batch translation
- Translates: floor labels, marker labels, marker info text
- Coverage counter: "X/Y translated" badge in header
- Supports `forceRetranslate` for overwriting existing translations

#### Responsive Preview
- Width-based sizing (not fixed heights — avoids clipping)
- Phone: `max-w-xs` / `max-w-md` / `max-w-2xl` / `w-full` based on `size`
- Tablet/Kiosk: always `w-full` to fill available width
- Image uses `className="w-full block"` — fills container naturally

---

## Data Model (Actual Types)

These are the **actual implemented types** from `app/src/types/index.ts`:

```typescript
export type ImageMapIcon = 'pin' | 'dot' | 'number' | 'star' | 'info';

export interface ImageMapMarker {
  id: string;
  x: number;                              // 0-100 (percentage from left)
  y: number;                              // 0-100 (percentage from top)
  label: { [lang: string]: string };      // Multilingual label
  stopId?: string;                        // Link to a stop (tap → navigate)
  infoText?: { [lang: string]: string };  // Rich info text shown in popup
  icon?: ImageMapIcon;                    // Visual style
  color?: string;                         // Marker color (hex)
  number?: number;                        // Optional tour order number
}

export interface ImageMapFloor {
  id: string;
  imageUrl: string;
  imageAlt?: { [lang: string]: string };
  label: { [lang: string]: string };      // e.g. "Ground Floor", "Level 2"
  order: number;
  markers: ImageMapMarker[];
}

export interface ImageMapBlockData {
  // Single-floor (backward compatible)
  imageUrl: string;
  imageAlt?: { [lang: string]: string };
  markers: ImageMapMarker[];

  // Multi-floor support
  floors?: ImageMapFloor[];
  activeFloorId?: string;

  // Display
  size?: 'small' | 'medium' | 'large' | 'full';
  showLabels?: boolean;
  labelsPosition?: 'above' | 'below' | 'right';
  zoomable?: boolean;
  showLegend?: boolean;

  // Block metadata
  title?: { [lang: string]: string };
  showTitle?: boolean;
  blockImage?: StopImageData;
  showBlockImage?: boolean;
}
```

### Why Percentage Coordinates (0-100)?

- **Resolution-independent** — works at any display size, any device
- **Image replacement safe** — updated floor plan at different resolution → markers stay correct
- **Simple math** — `(clientX - imageLeft) / imageWidth * 100`
- **CSS trivial** — `left: {x}%; top: {y}%` with `position: absolute`

---

## File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `app/src/components/blocks/ImageMapEditorModal.tsx` | ~806 | Full-screen editor: floor tabs, canvas, marker sidebar, settings, translation |
| `app/src/components/blocks/ImageMapBlockEditor.tsx` | ~133 | Inline summary card: thumbnail, stats, "Open Full Editor" button |
| `app/src/components/blocks/ImageMapBlockPreview.tsx` | ~305 | Visitor view: floor plan, markers, zoom, popups, floor switcher, legend |
| `app/src/components/blocks/ImageMapMarkerPin.tsx` | ~91 | Reusable marker pin: 5 icons, 7+ colors, selection/drag states |
| `app/src/types/index.ts` | — | `ImageMapBlockData`, `ImageMapMarker`, `ImageMapFloor`, `ImageMapIcon` |
| `app/src/components/StopEditor.tsx` | — | Block registration: add menu, empty block data, modal state |
| `app/src/components/blocks/StopContentBlock.tsx` | — | Preview rendering: icon (`LayoutGrid`), label, size logic |

### Registration Points (3 + 3 pattern)

**StopEditor.tsx** (admin editing):
1. `createEmptyBlockData('imageMap')` — default block shape
2. `showImageMapEditorId` state + `<ImageMapEditorModal>` rendering
3. `'imageMap'` in the Add Block menu array

**StopContentBlock.tsx** (preview rendering):
1. Icon: `LayoutGrid` / Label: `'Image Map'`
2. Size → CSS width class mapping (with tablet override to `w-full`)
3. `<ImageMapBlockPreview>` rendering with all props

---

## Technical Notes

### No New Dependencies

Everything uses existing infrastructure:
- Image upload: `ImageUpload` + `/api/media`
- Click detection: standard React mouse/touch events
- Positioning: CSS `position: absolute` with percentage values
- Drag: `mousedown/mousemove/mouseup` (no drag library)
- Navigation: existing React Router patterns

### Performance

- Markers are lightweight DOM elements (not canvas/WebGL) — 50+ markers fine
- No network requests on visitor side after initial block data load
- Pinch-to-zoom uses CSS `transform: scale()` — GPU-accelerated
- Floor plan images optimized on upload (existing media endpoint)

### Mobile-First

- Touch targets: markers minimum 44×44px tap area (Apple HIG)
- Pinch-to-zoom: `touch-action: manipulation` on image container
- Labels: truncate on small screens, full on tap
- Scroll containment: prevent map zoom from scrolling the page

---

## Roadmap (What's Next)

### Phase 2: Editor Polish 🔜

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Marker drag-to-reorder** | Wire up the existing GripVertical handles in marker sidebar list | Low |
| **Bulk select + delete** | Multi-select markers for batch operations | Low |
| **Duplicate marker** | Clone a marker (same config, slightly offset position) | Low |
| **Auto-number** | Button to assign sequential numbers based on list order | Low |
| **Marker categories** | Group by type (exhibits, facilities, exits) + visitor filter toggles | Medium |
| **Snap-to-grid** | Optional alignment grid for precise marker placement | Medium |

### Phase 3: AI & Accessibility 🔜

| Feature | Description | Complexity |
|---------|-------------|------------|
| **AI Auto-Marker Placement** | Gemini/GPT-4V detects rooms and exhibits on uploaded floor plans, suggests marker positions | Medium |
| **AI Description Generator** | Generates visitor-friendly info text from marker label + stop content | Medium |
| **Accessibility Annotations** | Wheelchair routes, tactile paths, elevator markers with standardized icons | Medium |

### Phase 4: "Where Am I?" Button 🔜

Leverages existing positioning infrastructure — **zero new dependencies needed**.

The Image Map is positioning-**agnostic**. Every marker links to a stop, and stops already have positioning configs. When any method resolves a stop, the Image Map highlights the matching marker.

```
Visitor triggers any positioning method
  → Stop resolved (by any method)
  → Image Map finds marker where marker.stopId === resolved stopId
  → Highlights that marker with "You Are Here" pulse
```

**Resolution priority:**

| Priority | Method | Accuracy | Status |
|----------|--------|----------|--------|
| 1 | Last visited stop | Exact | ✅ Available now |
| 2 | QR/NFC scan | Exact | ✅ Available now |
| 3 | GPS nearest | ±5-30m | ✅ Available now |
| 4 | BLE Beacon | ±1-5m | 🔜 Positioning Phase 4 |
| 5 | WiFi fingerprint | ±5-15m | 🔜 Positioning Phase 6 |
| 6 | Manual ("I'm near...") | Exact (self-reported) | ✅ Available now |

**Implementation sketch:**
```typescript
async function handleWhereAmI() {
  if (lastVisitedStopId) { highlightMarker(lastVisitedStopId); return; }

  if ('geolocation' in navigator) {
    const pos = await getCurrentPosition();
    const nearest = findNearestGPSStop(pos, markers);
    if (nearest && nearest.distance < 50) { highlightMarker(nearest.stopId); return; }
  }

  showPrompt("Scan a nearby QR code or NFC tag to find your location");
}
```

### Phase 5: Walk-and-Assign (Field Mode) 🔜

Curator walks through the museum, taps "Mark This Spot" at each exhibit. Device captures GPS, maps it to image coordinates via calibration points.

**Requires:** Floor plan image + 2-4 geo-calibration reference points (affine transformation).

```typescript
interface CalibrationPoint {
  imageX: number;    // % on image
  imageY: number;    // % on image
  latitude: number;  // GPS coordinate
  longitude: number; // GPS coordinate
  label: string;     // "Main entrance", "Back stairs"
}
```

**Reality check:** Indoor GPS is ±5-15m. This is a **convenience starter** — curator places markers roughly, then fine-tunes by dragging. The click-to-place method is the primary workflow.

### Phase 6: Advanced Features (Future)

| Feature | Priority |
|---------|----------|
| Animated walking route paths (SVG polyline between markers) | Medium |
| "You Are Here" blue dot (live position via BLE/WiFi) | Medium |
| Heatmap overlay (popular markers from VisitLog data) | Low |
| Custom marker icons (upload PNG/SVG per marker) | Low |
| Time-based markers (show/hide by schedule) | Low |
| Polygon clickable zones (instead of pin markers) | Low |

---

## Design Reference

> Reference material for future development. Not implementation plans — just context and ideas.

### Positioning Technology Integration Details

Each positioning tech integrates the same way — resolve a stop, highlight the marker:

```
┌──────────────────────────────────────────────────────┐
│                   Image Map Block                    │
│                                                      │
│  Markers ──→ linked to Stops ──→ Stops have          │
│                                   positioning        │
│                                   configs            │
│                                                      │
│  ANY method that resolves a Stop automatically       │
│  resolves a Marker on the Image Map.                 │
│                                                      │
│  The Image Map is positioning-AGNOSTIC.              │
│  It just asks: "which stop was resolved?"            │
│  Then highlights the matching marker.                │
└──────────────────────────────────────────────────────┘
```

| Method | Resolves Stop? | Image Map Highlight? | Build Status |
|--------|---------------|---------------------|-------------|
| QR Code | ✅ Scan → stop | ✅ Automatic | Available now |
| NFC | ✅ Tap → stop | ✅ Automatic | Available now |
| GPS | ✅ Geofence → stop | ✅ Automatic + nearest | Available now |
| BLE Beacon | 🔜 Detect → stop | ✅ Automatic (when BLE built) | Future |
| WiFi | 🔜 Fingerprint → zone | ⚠️ Zone highlight (when WiFi built) | Future |
| UWB | 🔜 Precise → stop | ✅ Automatic + blue dot (when UWB built) | Future |
| Manual | ✅ Self-report | ✅ Visitor taps "I'm here" | Available now |
| Last visited | ✅ Navigation history | ✅ Automatic | Available now |

**Per-technology notes:**

- **QR Code (✅ Built):** Scan → stop resolved → marker highlighted. Future: printable floor plan with QR codes at marker positions.
- **NFC (✅ Built):** Same as QR. NFC tags at exact exhibit locations = inherent "Where Am I?" confirmation.
- **GPS (✅ Built):** `useGeofenceMonitor` tracks nearby stops → highlight markers. Future: live blue dot with calibration.
- **BLE Beacon (🔜 Future):** Best indoor accuracy (±1-5m). Gold standard for "Where Am I?" on image maps.
- **WiFi (🔜 Future):** Zone-level accuracy (±5-15m). Good for "you're in the East Wing" but not specific exhibits.

### AI & Museum Features Brainstorm

**Ideas:**
1. **Guided Route Lines** — AI-generated optimal walking paths between selected stops
2. **AI Floor Plan Digitizer** — photo of paper floor plan → clean annotated SVG
3. **Multi-Marker Clusters** — nearby markers collapse when zoomed out
4. **Scavenger Hunt Mode** — checkpoint markers with progress tracking
5. **Time-Based Content** — markers change based on event schedule

**Long-term / visionary:**
6. **AI Docent Narration** — tap marker → AI-spoken explanation (ElevenLabs TTS + LLM)
7. **3D Floor Model** — three.js walkthrough with clickable hotspots
8. **Collaborative Annotations** — teachers pin lesson guides for student groups
9. **Dynamic Exhibit Linking** — AI auto-updates markers when exhibits move
