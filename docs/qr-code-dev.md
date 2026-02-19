# QR Code Scanner Block — Development Plan

**Created**: February 19, 2026
**Status**: PLANNING
**Phase**: New Content Block — QR Code Scanner

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current QR Infrastructure Audit](#current-qr-infrastructure-audit)
3. [New Block: QR Code Scanner](#new-block-qr-code-scanner)
4. [Feature Specification](#feature-specification)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Plan](#implementation-plan)
7. [File Changes](#file-changes)
8. [Museum-Specific Features](#museum-specific-features)

---

## Executive Summary

TourStack currently has robust **QR code generation** — every stop gets a unique QR code with short code fallback, viewable in the Positioning Editor modal. However, there is **no in-app QR scanning capability**. Visitors rely on their phone's native camera app to scan codes.

This plan adds a new **QR Code Block** content type that embeds a live camera-based QR scanner directly into stop pages. This is invaluable for museum scenarios like:
- **Scavenger hunts** — scan codes at exhibits to complete challenges
- **Multi-stop navigation** — scan the next exhibit's code to jump there
- **Object identification** — scan artifact QR codes for detailed information
- **Check-in systems** — visitors scan to log they've visited a stop
- **Linked exhibits** — scan a related exhibit's QR to explore connections

---

## Current QR Infrastructure Audit

### What Exists Today

| Component | File | Purpose |
|-----------|------|---------|
| **QR Generation (SVG)** | `src/components/PositioningEditorModal.tsx` | `qrcode.react` SVG preview in admin |
| **QR Generation (API)** | `src/components/blocks/PositioningBlockEditor.tsx` | External API fallback |
| **Legacy QR Editor** | `src/components/QRCodeEditorModal.tsx` | Re-exports PositioningEditorModal |
| **Positioning Block** | `src/components/blocks/PositioningBlockEditor.tsx` | Admin editor for positioning config |
| **Positioning Preview** | `src/components/blocks/StopContentBlock.tsx:266-291` | Renders QR image in preview/visitor |
| **Short Code Lookup** | `server/routes/visitor.ts:124-150` | `GET /api/visitor/s/:shortCode` redirect |
| **Stop QR Auto-Gen** | `server/routes/stops.ts:127-134` | Creates QR on stop creation |
| **Visitor Page** | `src/pages/VisitorStop.tsx` | Handles scanned QR URL routing |
| **Type Definitions** | `src/types/index.ts:63-158` | `QRCodeConfig`, `PositioningBlockData`, etc. |

### Database Schema (Stop Model)

```prisma
model Stop {
  primaryPositioning String    // JSON: { method: "qr_code", url: "...", shortCode: "ABC123" }
  backupPositioning  String?   // Optional backup positioning config
}
```

### URL Flow (Current)

```
QR Code Scan → /visitor/tour/{slug}/stop/{slug}?t={token}
                         ↓
              VisitorStop.tsx fetches content
                         ↓
              Renders stop with StopContentBlock components
```

### Short Code Flow (Current)

```
Manual Entry → GET /api/visitor/s/{shortCode}
                         ↓
              Server searches all stops for matching shortCode
                         ↓
              Returns { redirectUrl, tourSlug, stopSlug }
```

### Key Package

- **`qrcode.react` v4.2.0** — Generation only (SVG/Canvas). Does NOT scan.

### What's Missing

- **No in-app QR scanner** — visitors rely on native camera
- **No short code entry UI** — the `/api/visitor/s/:shortCode` endpoint exists but no visitor-facing input
- **No scan history tracking** — no record of what visitors have scanned
- **No scavenger hunt / challenge integration** — no gamification
- **No linked-stop scanning** — can't scan from one stop to navigate to another

---

## New Block: QR Code Scanner

### Block Identity

| Property | Value |
|----------|-------|
| **Block Type** | `'qrScanner'` |
| **Label** | "QR Scanner" |
| **Icon** | `ScanLine` (from lucide-react) |
| **Category** | Interactive |
| **Use Case** | Embed a live QR scanner on visitor stop pages |

### What It Does

The QR Scanner Block adds a camera-powered QR code reader directly into a stop page. When a visitor views the stop, they see a scanner viewfinder that activates their camera. When they scan a valid TourStack QR code, the app navigates them to that stop or triggers a custom action.

### Modes

| Mode | Description |
|------|-------------|
| **Navigate** | Scans QR → navigates to the linked stop (default) |
| **Check-in** | Scans QR → marks current stop as "visited" with visual feedback |
| **Scavenger Hunt** | Scans QR → validates against expected code, shows success/fail |
| **Info Popup** | Scans QR → shows a modal with the target stop's info without navigating |
| **Short Code Entry** | Shows a text input for manual short code entry (accessibility fallback) |

---

## Feature Specification

### Admin Editor (QRScannerBlockEditor)

The admin sees a configuration panel (NOT a live scanner — that's visitor-only):

```
┌─────────────────────────────────────────────────────┐
│  Block Title (optional, multilingual)               │
│  Block Image (optional)                             │
│                                                     │
│  Scanner Mode:  [Navigate] [Check-in] [Scavenger]   │
│                 [Info]                               │
│                                                     │
│  ── Mode-Specific Settings ──                       │
│                                                     │
│  [Navigate Mode]                                    │
│    ☑ Restrict to this tour only                     │
│    ☑ Show confirmation before navigating            │
│                                                     │
│  [Scavenger Hunt Mode]                              │
│    Expected Stop: [dropdown of tour stops]          │
│    Success Message: [multilingual text]             │
│    Wrong Code Message: [multilingual text]          │
│                                                     │
│  ── Common Settings ──                              │
│                                                     │
│  Prompt Text: "Scan the QR code at the next..."    │
│  ☑ Show short code entry fallback                   │
│  ☑ Show scan history (visited stops)                │
│  Camera Facing: [Rear (default)] [Front]            │
│                                                     │
│  ── Styling ──                                      │
│  Scanner Size: [Small] [Medium] [Large]             │
│  Viewfinder Style: [Rounded] [Square] [Minimal]     │
└─────────────────────────────────────────────────────┘
```

### Visitor View (QRScannerBlockPreview)

The visitor sees the live scanner embedded in the stop:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  "Scan the QR code at the next exhibit"             │
│                                                     │
│  ┌───────────────────────────────────────────┐      │
│  │                                           │      │
│  │     ╔═══════════════════════╗             │      │
│  │     ║   Camera viewfinder   ║             │      │
│  │     ║   with corner markers ║             │      │
│  │     ╚═══════════════════════╝             │      │
│  │                                           │      │
│  └───────────────────────────────────────────┘      │
│                                                     │
│  [📷 Tap to scan]  or  [⌨️ Enter code manually]    │
│                                                     │
│  ── Scan History ──                                 │
│  ✅ Stop 1: Rosetta Stone                           │
│  ✅ Stop 3: Egyptian Mummy                          │
│  ⬜ Stop 2: (not yet scanned)                       │
│                                                     │
│  Progress: 2 of 5 stops visited                     │
└─────────────────────────────────────────────────────┘
```

### Short Code Entry (Fallback)

```
┌─────────────────────────────────────────────────────┐
│  Enter Short Code                                   │
│                                                     │
│  ┌───────────────┐  ┌─────────┐                     │
│  │  B 2 5 K K G  │  │  Go →   │                    │
│  └───────────────┘  └─────────┘                     │
│                                                     │
│  Look for the 6-letter code on the exhibit label    │
└─────────────────────────────────────────────────────┘
```

---

## Technical Architecture

### NPM Package: `html5-qrcode`

**Recommended library:** [`html5-qrcode`](https://www.npmjs.com/package/html5-qrcode)
- 1.5M+ weekly downloads
- Camera-based QR/barcode scanner
- No native dependencies (pure JS + WebRTC)
- Works on all modern mobile browsers
- Supports rear/front camera selection
- MIT license
- ~40KB gzipped

**Alternative considered:** `@yudiel/react-qr-scanner` (React wrapper, but less maintained)

### Data Type

```typescript
// New type in src/types/index.ts

export interface QRScannerBlockData {
  // Scanner behavior
  mode: 'navigate' | 'checkin' | 'scavenger' | 'info';

  // Navigate mode
  restrictToTour?: boolean;        // Only allow scanning stops from this tour
  showConfirmation?: boolean;      // Show "Navigate to X?" dialog before jumping

  // Scavenger hunt mode
  expectedStopId?: string;         // The stop the visitor should scan
  successMessage?: { [lang: string]: string };
  wrongCodeMessage?: { [lang: string]: string };

  // Common settings
  promptText?: { [lang: string]: string };  // "Scan the QR code at..."
  showShortCodeEntry?: boolean;    // Show manual entry fallback
  showScanHistory?: boolean;       // Show visited stops list
  cameraFacing?: 'environment' | 'user';  // Rear vs front camera

  // Styling
  scannerSize?: 'small' | 'medium' | 'large';
  viewfinderStyle?: 'rounded' | 'square' | 'minimal';

  // Block metadata (standard)
  title?: { [lang: string]: string };
  showTitle?: boolean;
  blockImage?: StopImageData;
  showBlockImage?: boolean;
}
```

### Component Architecture

```
QRScannerBlockEditor.tsx     (Admin: configuration UI)
    ↓ saves QRScannerBlockData
StopContentBlock.tsx         (Router: edit vs view mode)
    ↓ view mode
QRScannerBlockPreview.tsx    (Visitor: live camera scanner)
    ↓ scans code
    ↓ parses URL or short code
    ↓ calls /api/visitor/s/:shortCode or navigates directly
    ↓ triggers mode-specific action (navigate, check-in, etc.)
```

### Scan Result Processing

When a QR code is scanned, the app needs to:

1. **Parse the URL** — extract tour slug, stop slug, token
2. **Validate** — is this a TourStack URL? Is it from the same tour (if restricted)?
3. **Execute action** based on mode:
   - **Navigate**: redirect to `/visitor/tour/{slug}/stop/{slug}`
   - **Check-in**: mark stop visited in local state, show success animation
   - **Scavenger**: compare scanned stop ID with expected, show result
   - **Info**: fetch stop data via API, show modal preview

```typescript
// URL parsing utility
function parseTourStackUrl(url: string): { tourSlug: string; stopSlug: string; token?: string } | null {
  const match = url.match(/\/visitor\/tour\/([^/]+)\/stop\/([^/?]+)/);
  if (!match) return null;
  const params = new URL(url).searchParams;
  return { tourSlug: match[1], stopSlug: match[2], token: params.get('t') || undefined };
}
```

### Scan History (Local Storage)

Scan history is stored per-tour in localStorage:

```typescript
interface ScanHistory {
  tourId: string;
  scannedStops: {
    stopId: string;
    stopTitle: string;
    scannedAt: string;  // ISO timestamp
  }[];
}

// Key: `tourstack-scan-history-{tourId}`
```

### API Additions

#### `GET /api/visitor/tour/:tourSlugOrId/stop/:stopSlugOrId/info`

New lightweight endpoint that returns stop title + description + image without full content blocks (for "Info Popup" mode):

```json
{
  "id": "...",
  "title": { "en": "Rosetta Stone" },
  "description": { "en": "Ancient Egyptian artifact..." },
  "image": "/uploads/rosetta-stone.jpg",
  "order": 3
}
```

---

## Implementation Plan

### Phase 1: Foundation (Core Scanner)

1. **Install `html5-qrcode`** package
2. **Add `qrScanner` to `ContentBlockType`** union in `types/index.ts`
3. **Add `QRScannerBlockData` interface** to `types/index.ts`
4. **Create `QRScannerBlockEditor.tsx`** — admin configuration panel
5. **Create `QRScannerBlockPreview.tsx`** — visitor-facing live scanner
6. **Register in `StopEditor.tsx`** — add to block picker grid + `createEmptyBlockData`
7. **Register in `StopContentBlock.tsx`** — add icon, label, and render case
8. **Add `parseTourStackUrl` utility** — URL parsing for scanned codes

### Phase 2: Scanner Modes

9. **Navigate mode** — scan → parse URL → navigate to stop
10. **Short code entry** — manual input → `/api/visitor/s/:shortCode` lookup → navigate
11. **Confirmation dialog** — optional "Navigate to X?" before jumping
12. **Tour restriction** — validate scanned stop belongs to current tour

### Phase 3: Enhanced Features

13. **Check-in mode** — scan → mark visited → success animation
14. **Scan history** — localStorage tracking of visited stops
15. **Progress indicator** — "3 of 7 stops visited" bar
16. **Scavenger hunt mode** — expected stop validation with success/wrong messages
17. **Info popup mode** — scan → fetch stop info → show modal

### Phase 4: Polish

18. **Camera permission handling** — graceful permission denied states
19. **Error states** — invalid QR, non-TourStack codes, network errors
20. **Styling variants** — small/medium/large scanner sizes
21. **Viewfinder styles** — rounded/square/minimal corner markers
22. **Dark mode** — ensure scanner overlay works in both themes
23. **Accessibility** — screen reader announcements for scan results
24. **Device testing** — iOS Safari, Android Chrome, tablets

---

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/components/blocks/QRScannerBlockEditor.tsx` | Admin editor for scanner configuration |
| `src/components/blocks/QRScannerBlockPreview.tsx` | Visitor-facing live QR scanner |
| `src/lib/qrScannerUtils.ts` | URL parsing, scan history, validation utilities |

### Modified Files

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `'qrScanner'` to `ContentBlockType`, add `QRScannerBlockData` interface |
| `src/components/blocks/StopContentBlock.tsx` | Add icon, label, import, and render case for `qrScanner` |
| `src/components/StopEditor.tsx` | Add to block picker grid, `createEmptyBlockData`, import editor |
| `package.json` | Add `html5-qrcode` dependency |
| `server/routes/visitor.ts` | Add `/tour/:id/stop/:id/info` lightweight endpoint |

### Type Additions (src/types/index.ts)

```typescript
// Add to ContentBlockType union:
export type ContentBlockType =
  | 'text'
  | 'image'
  | 'gallery'
  | 'timelineGallery'
  | 'audio'
  | 'video'
  | 'quote'
  | 'timeline'
  | 'comparison'
  | 'positioning'
  | 'map'
  | 'tour'
  | 'stopList'
  | 'qrScanner';    // NEW

// Add to ContentBlockData union:
export type ContentBlockData =
  | TextBlockData
  | ImageBlockData
  // ...existing...
  | QRScannerBlockData;  // NEW
```

---

## Museum-Specific Features

These features are designed specifically for museum tour use cases:

### 1. Scavenger Hunt Mode
**Use case:** Children's museum programs, school groups
- Curator sets an "expected" stop QR code
- When visitor scans the correct one → celebration animation + success message
- Wrong code → encouraging "keep looking!" message
- Progress tracking across all scavenger hunt stops in the tour

### 2. Scan History & Progress
**Use case:** Multi-day visits, completionist visitors
- Persists in localStorage per tour
- Shows which stops have been visited with timestamps
- Progress bar: "You've visited 5 of 12 stops!"
- Encourages exploration of unvisited stops

### 3. Info Popup Mode
**Use case:** Quick reference, related exhibit browsing
- Scan a QR without leaving current stop
- Modal shows title, image, and description of scanned stop
- "Go there" button for full navigation
- Great for exhibits that reference other objects in the collection

### 4. Short Code Fallback
**Use case:** Accessibility, older devices
- Visitors who can't use camera can type the 6-character code
- Uses existing `/api/visitor/s/:shortCode` endpoint
- Large, accessible input with auto-uppercase
- Clear instructions near physical QR codes

### 5. Tour-Restricted Scanning
**Use case:** Guided tours, ticketed experiences
- Scanner only accepts QR codes from the current tour
- Prevents visitors from wandering to other tours accidentally
- Shows "This code is for a different tour" message with option to proceed

### 6. Check-in System
**Use case:** Timed tours, guided groups, attendance tracking
- Visitor scans to "check in" at each stop
- Visual confirmation (checkmark animation)
- Could be expanded for analytics (which stops are most visited)
- Works offline — stores check-ins locally, syncs later (future)

---

## UI/UX Considerations

### Camera Permission Flow

```
1. Block loads → Show "Tap to activate scanner" button
2. User taps → Request camera permission
3. Permission granted → Show live camera feed with viewfinder
4. Permission denied → Show short code entry as primary fallback
5. No camera (desktop) → Show short code entry only
```

### Scanner Viewfinder Design

```
┌────────────────────────┐
│                        │
│    ┌──┐        ┌──┐    │
│    │  │        │  │    │
│    └──┘        └──┘    │  Corner markers (animated)
│                        │
│       Align QR code    │  Helper text
│       within frame     │
│                        │
│    ┌──┐        ┌──┐    │
│    │  │        │  │    │
│    └──┘        └──┘    │
│                        │
│  [🔦 Torch]  [📷 Flip] │  Controls
└────────────────────────┘
```

### Success States (per mode)

| Mode | Success UI |
|------|------------|
| **Navigate** | Brief toast "Going to: Rosetta Stone" → page transition |
| **Check-in** | Green checkmark animation + haptic feedback |
| **Scavenger** | Confetti animation + success message |
| **Info** | Slide-up modal with stop preview card |

### Error States

| Error | UI |
|-------|-----|
| Non-TourStack QR | "This QR code isn't part of this tour system" |
| Wrong tour (restricted) | "This stop is from a different tour. Switch tours?" |
| Invalid/damaged QR | "Couldn't read QR code. Try again or enter code manually" |
| Camera permission denied | "Camera access needed. You can also enter the code manually below" |
| Network error | "Can't reach server. Check your connection" |
| Already checked in | "You've already visited this stop!" (with timestamp) |

---

## Block Picker Integration

The QR Scanner block appears in the "Add Content Block" modal:

```
┌─────────────────────────────────────────┐
│  Add Content Block                      │
│                                         │
│  [▷ Tour    ] [T  Text  ] [🖼 Image  ] │
│  [  Intro   ]            [           ] │
│                                         │
│  [📷 Gallery] [♫ Timeline] [♫ Audio  ] │
│  [          ] [  Gallery ] [         ] │
│                                         │
│  [📍 Map   ] [≡ Stop   ] [⊟ QR      ] │  ← NEW
│  [         ] [  List   ] [ Scanner  ] │
│                                         │
│  [ Cancel ]                             │
└─────────────────────────────────────────┘
```

---

## Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| `html5-qrcode` | ^2.3.8 | ~40KB gzip | Camera-based QR scanning |

No other new dependencies needed. `qrcode.react` (already installed) handles any QR display needs.

---

## Testing Checklist

- [ ] Scanner opens camera on mobile (iOS Safari, Android Chrome)
- [ ] Scanner reads TourStack QR codes correctly
- [ ] Scanner reads external QR codes and shows appropriate error
- [ ] Short code entry works as fallback
- [ ] Navigate mode jumps to correct stop
- [ ] Check-in mode records visit
- [ ] Scavenger mode validates correct/incorrect
- [ ] Info mode shows stop preview modal
- [ ] Camera permission denied shows fallback gracefully
- [ ] Desktop shows short code entry (no camera)
- [ ] Dark mode styling works
- [ ] Tablet/phone/kiosk device types render correctly
- [ ] Admin editor saves and loads all settings
- [ ] Preview mode shows static placeholder (not live camera)
- [ ] Scan history persists across page refreshes

---

## Future Enhancements (Out of Scope)

- **Server-side scan analytics** — track which stops are scanned most
- **Barcode scanning** — support ISBN, UPC for library/shop integration
- **AR marker scanning** — connect to augmented reality overlays
- **Offline mode** — queue scans when offline, sync when connected
- **Group scanning** — share scan progress with tour group
- **Timed challenges** — scan X stops in Y minutes
