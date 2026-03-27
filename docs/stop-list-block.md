# Stop List Block — Implementation Plan

> **Status:** Complete (all phases implemented)
> **Block Type:** `stopList`
> **Purpose:** Display a curated list of stops from the current tour, styled as visual cards. Clicking a stop in visitor/kiosk mode navigates to that stop.

---

## 1. Overview

The Stop List Block is a new content block that lets tour creators curate and display a visual list of stops from the current project. It supports multiple layout templates (cards, compact list, large cards, etc.) and adapts its grid to the device mode (phone = 1 column, tablet = 2 columns, kiosk/large screens = 3 columns).

**Key behaviors:**
- Editor allows adding/removing any stops from the current tour
- Drag-to-reorder the display order within the block
- Template selector for different visual styles
- Dark mode styling consistent with existing blocks
- Clicking a stop card in preview/visitor/kiosk mode navigates to that stop
- Responsive grid: 1-col phone → 2-col tablet → 3-col large/kiosk

---

## 2. Design Reference (from mockups)

The attached mockups show four layout variations:

| Layout | Description |
|--------|-------------|
| **Card (default)** | Dark cards with stop image thumbnail (right-aligned), stop number badge, title, subtitle, duration. "Start Tour" CTA at bottom. |
| **Large Card** | Full-width image above title/subtitle. Vertical scroll. More visual impact. |
| **Compact List** | Small circular thumbnails on the left, stop info stacked. Denser layout. |
| **Full Bleed** | Edge-to-edge images with overlaid text. Premium/cinematic feel. |

All layouts share:
- Stop number badge (e.g., "STOP 01") with accent color
- Stop title (localized)
- Stop subtitle/location (from description, localized)
- Duration indicator (clock icon + "X MINS")
- Stop thumbnail image
- Dark background with consistent theming

---

## 3. Data Model

### 3.1 New Type: `StopListBlockData`

**File:** `app/src/types/index.ts`

```typescript
export type StopListLayout = 'card' | 'large-card' | 'compact-list' | 'full-bleed';

export interface StopListBlockData {
  // Which stops to display (by ID, in display order)
  stopIds: string[];

  // Layout template
  layout: StopListLayout;

  // Header
  heading?: { [lang: string]: string };       // e.g., "Tour Stops"
  showHeading?: boolean;                        // default: true
  subheading?: { [lang: string]: string };     // e.g., "12 Stops • 45 Minutes"
  showSubheading?: boolean;                     // default: true

  // Display options
  showStopNumbers?: boolean;   // default: true — "STOP 01", "STOP 02"
  showDuration?: boolean;      // default: true — clock icon + minutes
  showDescription?: boolean;   // default: true — subtitle/location text
  showCta?: boolean;           // default: true — "Start Tour" button at bottom
  ctaText?: { [lang: string]: string }; // default: "Start Tour"

  // Block metadata (standard pattern)
  title?: { [lang: string]: string };
  showTitle?: boolean;
  blockImage?: StopImageData;
  showBlockImage?: boolean;
}
```

### 3.2 Type Registration

Add `'stopList'` to the `ContentBlockType` union:

```typescript
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
  | 'stopList';   // NEW
```

Add `StopListBlockData` to the `ContentBlockData` discriminated union.

---

## 4. Files to Create

| File | Purpose |
|------|---------|
| `app/src/components/blocks/StopListBlockEditor.tsx` | Editor component (select stops, choose template, configure display) |
| `app/src/components/blocks/StopListBlockPreview.tsx` | Visitor-facing preview renderer (all 4 layouts) |

---

## 5. Files to Modify

| File | Change |
|------|--------|
| `app/src/types/index.ts` | Add `StopListBlockData`, `StopListLayout`, update `ContentBlockType` and `ContentBlockData` unions |
| `app/src/components/blocks/StopContentBlock.tsx` | Add `stopList` to `BLOCK_ICONS`, `BLOCK_LABELS`, and `renderBlock()` switch |
| `app/src/components/StopEditor.tsx` | Import `StopListBlockEditor`, add rendering case, add to "Add Block" modal, add `createEmptyBlockData` case |

---

## 6. Editor Design (`StopListBlockEditor.tsx`)

### 6.1 Props (follows standard block editor pattern)

```typescript
interface StopListBlockEditorProps {
  data: StopListBlockData;
  language: string;
  availableLanguages?: string[];
  translationProvider?: TranslationProvider;
  tourData?: Tour;
  allStops?: Stop[];
  onChange: (data: StopListBlockData) => void;
}
```

**Note:** `allStops` is already passed through `StopEditor` → used by `TourBlockEditor`. The same prop pipeline works for us.

### 6.2 Editor Sections

```
┌─────────────────────────────────────────────┐
│  TEMPLATE SELECTOR                          │
│  [Card] [Large Card] [Compact] [Full Bleed] │
│  (visual thumbnails for each template)      │
├─────────────────────────────────────────────┤
│  STOP SELECTOR                              │
│  ┌─────────────────────────────────┐        │
│  │ ☑ 1. The Starry Night          │        │
│  │ ☑ 2. Self-Portrait             │        │
│  │ ☐ 3. Almond Blossoms           │        │
│  │ ☑ 4. Wheatfield with Crows     │        │
│  │ ...                             │        │
│  └─────────────────────────────────┘        │
│  [Select All] [Deselect All]                │
├─────────────────────────────────────────────┤
│  SELECTED STOPS (drag to reorder)           │
│  ≡ 1. The Starry Night            [✕]      │
│  ≡ 2. Self-Portrait               [✕]      │
│  ≡ 4. Wheatfield with Crows       [✕]      │
├─────────────────────────────────────────────┤
│  HEADING & SUBHEADING                       │
│  [Language Switcher] [Magic Translate]      │
│  Heading: [ Tour Stops          ]           │
│  Subheading: [ 12 Stops • 45 Min ]         │
├─────────────────────────────────────────────┤
│  DISPLAY OPTIONS                            │
│  ☑ Show stop numbers                        │
│  ☑ Show duration                            │
│  ☑ Show description                         │
│  ☑ Show CTA button                          │
│  CTA Text: [ Start Tour ]                  │
└─────────────────────────────────────────────┘
```

### 6.3 Key Implementation Details

**Template Selector:**
- Grid of 4 buttons with visual thumbnails (similar to `TourBlockEditor` layout selector)
- Each shows a small icon/preview of the layout style
- Active state uses `border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10`

**Stop Selector:**
- Checkbox list of all stops in the tour (from `allStops` prop)
- Shows stop order number, title (localized), and thumbnail
- "Select All" / "Deselect All" convenience buttons

**Selected Stops Reorder:**
- Drag handle (GripVertical icon) + stop title + remove button
- Uses the same drag pattern as the stop list in `TourDetail.tsx`
- The order in this list is the display order in the block (independent of tour stop order)

**Heading/Subheading:**
- Multilingual with `LanguageSwitcher` + `MagicTranslateButton` (same pattern as `TourBlockEditor`)
- Auto-generate subheading from selected stop count + total duration

---

## 7. Preview Design (`StopListBlockPreview.tsx`)

### 7.1 Props

```typescript
interface StopListBlockPreviewProps {
  data: StopListBlockData;
  language: string;
  deviceType?: 'phone' | 'tablet';
  allStops?: Stop[];
  tourData?: Tour;
  onNavigateToStop?: (stopId: string) => void;
}
```

### 7.2 Layout: Card (Default)

```
┌────────────────────────────────────┐
│  Tour Stops                        │
│  12 Stops • 45 Minutes             │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ STOP 01          ┌────────┐ │  │
│  │ The Starry Night │  img   │ │  │
│  │ Vincent van Gogh │        │ │  │
│  │ ⏱ 3 MINS        └────────┘ │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ STOP 02          ┌────────┐ │  │
│  │ Self-Portrait    │  img   │ │  │
│  │ Vincent van Gogh │        │ │  │
│  │ ⏱ 4 MINS        └────────┘ │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │        Start Tour            │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

- Phone: 1-column stack
- Tablet: 2-column grid (`grid grid-cols-1 md:grid-cols-2 gap-4` — but in preview, use `deviceType === 'tablet'` to switch to 2 cols)
- Card styling: `bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]`
- Stop number badge: `text-[var(--color-accent-primary)] text-[10px] font-semibold tracking-[0.15em] uppercase`
- Duration: `text-[var(--color-text-muted)] text-xs` with Clock icon

### 7.3 Layout: Large Card

```
┌────────────────────────────────────┐
│  Tour Stops                        │
│  12 Stops • 45 Minutes             │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ ┌──────────────────────────┐ │  │
│  │ │        (full image)       │ │  │
│  │ └──────────────────────────┘ │  │
│  │ STOP 01                      │  │
│  │ The Starry Night             │  │
│  │ Vincent van Gogh  ⏱ 3M      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ┌──────────────────────────┐ │  │
│  │ │        (full image)       │ │  │
│  │ └──────────────────────────┘ │  │
│  │ STOP 02                      │  │
│  │ Self-Portrait                │  │
│  │ Vincent van Gogh  ⏱ 4M      │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

- Phone: 1-column, full-width images
- Tablet: 2-column grid
- Image: `aspect-[16/10]` with `object-cover rounded-t-xl`
- Text below image in card body

### 7.4 Layout: Compact List

```
┌────────────────────────────────────┐
│  Tour Stops                        │
│  12 Stops • 45 Minutes             │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ (●) STOP 01                  │  │
│  │     The Starry Night         │  │
│  │     Vincent van Gogh ⏱ 3 MIN│  │
│  ├──────────────────────────────┤  │
│  │ (●) STOP 02                  │  │
│  │     Self-Portrait            │  │
│  │     Vincent van Gogh ⏱ 4 MIN│  │
│  ├──────────────────────────────┤  │
│  │ (●) STOP 03                  │  │
│  │     Almond Blossoms          │  │
│  │     Saint-Rémy  ⏱ 5 MIN     │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │        Start Tour            │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

- Phone: 1 column (list is inherently vertical), Tablet: 2-column grid
- Circular thumbnail: `w-12 h-12 rounded-full object-cover`
- Dividers between items: `border-b border-[var(--color-border-default)]`
- On tablet: items may show additional info or larger thumbnails

### 7.5 Layout: Full Bleed

```
┌────────────────────────────────────┐
│  Tour Stops                        │
│  12 Stops • 45 Minutes             │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  ████████████████████████████│  │
│  │  ████████ FULL IMAGE ███████│  │
│  │  ████████████████████████████│  │
│  │         STOP 01              │  │
│  │    The Starry Night          │  │
│  │    Vincent van Gogh ⏱ 3 MINS│  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │  ████████████████████████████│  │
│  │  ████ FULL IMAGE ███████████│  │
│  │  ████████████████████████████│  │
│  │         STOP 02              │  │
│  │    Self-Portrait             │  │
│  │    Vincent van Gogh  ⏱ 4 MIN│  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

- Edge-to-edge images (no border-radius on image, rounded on card)
- Gradient overlay at bottom of image for text legibility
- Phone: 1 column, Tablet: 2 columns
- `aspect-[3/4]` image ratio for cinematic feel

### 7.6 Navigation Behavior & Mode Guardrails

The Stop List Block behaves differently across three rendering contexts. **This is critical to understand for future development.**

#### Three Rendering Modes

| Mode | Where | Click Behavior | Grid Logic | deviceType |
|------|-------|---------------|------------|------------|
| **Admin Preview** | `StopPreviewModal` | Navigates within simulator (loads clicked stop in-frame, with back button) | `isTablet` prop | Explicit: `'phone'` or `'tablet'` |
| **Visitor Page** | `VisitorStop.tsx` | Navigates inline to stop | `isTablet` prop (hardcoded `'phone'`) | Always `'phone'` |
| **Kiosk Mode** | `VisitorStop.tsx` with `?kiosk=true` | Navigates inline to stop | `isTablet` prop (hardcoded `'phone'`) | Always `'phone'` |

#### How Each Mode Works

**1. Admin Preview (`StopPreviewModal`)**
- Rendered inside a scaled device frame (`transform: scale()`) at exact device pixels (375x812 iPhone, 820x1180 iPad)
- `deviceType` is explicitly set by the device selector (phone/tablet toggle)
- `onNavigateToStop` IS passed — clicking a stop card **loads that stop inside the simulator frame**
- `StopPreviewModal` manages a `currentStop` state + `stopHistory` stack for back navigation
- A "Back" bar appears at the top of the simulator when viewing a navigated stop
- This mirrors real device behavior so the admin sees exactly what visitors see

**2. Visitor Page (`VisitorStop.tsx`)**
- Rendered at `/visitor/tour/:slug/stop/:slug`
- `deviceType` is hardcoded to `'phone'` (does not detect actual device)
- `onNavigateToStop` IS passed — clicking a stop card navigates via `react-router`
- Navigation preserves URL search params (language, kiosk flags, etc.)
- URL pattern: `/visitor/tour/${tour.slug}/stop/${target.slug}?${searchParams}`

**3. Kiosk Mode (Visitor + URL params)**
- Same component as visitor, with URL params: `?kiosk=true&hideNav=true&autoRestart=true&fullscreen=true`
- `kiosk=true` — shows fullscreen toggle button
- `hideNav=true` — hides prev/next navigation buttons
- `autoRestart=true` — loops back to first stop after last
- `fullscreen=true` — auto-requests fullscreen on load
- Stop list click behavior is identical to visitor mode

#### Guardrails for Future Development

1. **NEVER use `window.open()` for navigation in preview mode** — Use `navigateToStop()` to load stops inside the simulator frame. The preview manages its own stop state and history stack.
2. **NEVER use CSS media query breakpoints (`md:`, `lg:`) for grid layout** — The preview uses `transform: scale()` inside a desktop viewport, so CSS breakpoints always fire as if on desktop. Use the `isTablet` prop instead.
3. **Always check `onNavigateToStop` before making cards clickable** — If `onNavigateToStop` is undefined, cards render as non-interactive `<div>` elements. If defined, they render as `<button>` elements with click handlers.
4. **Visitor page hardcodes `deviceType="phone"`** — Multi-column grids on real tablets require a future enhancement (CSS container queries or actual device detection).
5. **Preserve URL params on navigation** — When navigating between stops, always forward `searchParams` to maintain kiosk settings, language choice, etc.

#### Preview In-Frame Navigation (Implemented)
Clicking a stop in admin preview loads that stop inside the simulator frame:
- `StopPreviewModal` manages `currentStop` state (initialized from `stop` prop) and a `stopHistory` stack
- `navigateToStop(stopId)` pushes current stop to history and loads the target
- `navigateBack()` pops from history stack
- A back navigation bar appears inside the simulator when history is non-empty

### 7.7 Responsive Grid Logic

```typescript
// Uses isTablet prop only — CSS breakpoints don't work in scaled preview frames
const getGridClass = () => {
  if (isTablet) return 'grid grid-cols-2 gap-3';
  if (data.layout === 'compact-list') return 'grid grid-cols-1 gap-0';
  return 'grid grid-cols-1 gap-3';
};
```

**Why no CSS breakpoints?** The admin preview renders inside a `transform: scale()` container. The browser viewport is always desktop-sized, so `md:` and `lg:` breakpoints always trigger — even when previewing a 375px phone frame. The `isTablet` prop is the only reliable way to switch between 1-column and 2-column layouts.

---

## 8. StopContentBlock Integration

### 8.1 Icons & Labels (`StopContentBlock.tsx`)

```typescript
import { List } from 'lucide-react';  // or LayoutList

BLOCK_ICONS['stopList'] = List;
BLOCK_LABELS['stopList'] = 'Stop List';
```

### 8.2 Render Function

Add to the `renderBlock()` switch:

```typescript
case 'stopList':
  return (
    <StopListBlockPreview
      data={block.data as StopListBlockData}
      language={language}
      deviceType={deviceType}
      allStops={allStops}   // Need to thread allStops through
      tourData={tourData}
      onNavigateToStop={mode === 'view' ? handleNavigateToStop : undefined}
    />
  );
```

**Important:** `StopContentBlock` currently receives `tourData` but NOT `allStops`. We need to add `allStops` as a prop to `StopContentBlock` (or resolve stop data inside the preview component via the block's `stopIds` array + stops from tourData).

**Resolution approach:** Since `tourData` already includes stops when fetched via the API (`include: { stops: true }`), the preview component can resolve stops from `tourData.stops` if the tour object includes them. If not, we should pass `allStops` through.

Looking at the existing code:
- `VisitorStop.tsx` fetches `allStops` from the visitor API response and has access to them
- `StopPreviewModal.tsx` doesn't pass `allStops` to `StopContentBlock`
- `StopEditor.tsx` has `allStops` and passes it only to `TourBlockEditor`

**Best approach:** Add `allStops?: Stop[]` prop to `StopContentBlock` and thread it through from both:
1. `StopEditor.tsx` preview rendering
2. `VisitorStop.tsx` visitor rendering
3. `StopPreviewModal.tsx` device preview

---

## 9. StopEditor Integration

### 9.1 Import & Empty Data

```typescript
import { StopListBlockEditor } from './blocks/StopListBlockEditor';
import type { StopListBlockData } from '../types';

// In createEmptyBlockData():
case 'stopList':
  return {
    stopIds: [],
    layout: 'card',
    heading: { en: 'Tour Stops' },
    showHeading: true,
    subheading: { en: '' },
    showSubheading: true,
    showStopNumbers: true,
    showDuration: true,
    showDescription: true,
    showCta: true,
    ctaText: { en: 'Start Tour' },
  } as StopListBlockData;
```

### 9.2 Editor Rendering

```typescript
{editingBlock.type === 'stopList' && (
  <StopListBlockEditor
    data={editingBlock.data as StopListBlockData}
    language={language}
    availableLanguages={availableLanguages}
    translationProvider={translationProvider}
    tourData={tourData}
    allStops={allStops}
    onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
  />
)}
```

### 9.3 Add Block Modal

Add `'stopList'` to the block type array:
```typescript
{(['tour', 'text', 'image', 'gallery', 'timelineGallery', 'audio', 'map', 'stopList'] as ContentBlockType[]).map(...)}
```

---

## 10. Styling Patterns (Dark Mode)

All styling uses CSS variables from `index.css`:

| Element | Classes |
|---------|---------|
| Card background | `bg-[var(--color-bg-elevated)]` |
| Card border | `border border-[var(--color-border-default)]` |
| Card hover | `hover:border-[var(--color-accent-primary)]/50 hover:bg-[var(--color-bg-hover)]` |
| Stop number | `text-[var(--color-accent-primary)] text-[10px] font-semibold tracking-[0.15em] uppercase` |
| Title | `text-[var(--color-text-primary)] font-medium` |
| Subtitle/Description | `text-[var(--color-text-secondary)] text-sm` |
| Duration | `text-[var(--color-text-muted)] text-xs` |
| CTA button | `bg-[var(--color-accent-primary)] text-white` or `bg-blue-600 text-white` (matching mockup) |
| Section heading | `text-[var(--color-text-primary)] text-2xl font-bold` |
| Section subheading | `text-[var(--color-text-secondary)] text-sm` |
| Rounded corners | `rounded-xl` (cards), `rounded-lg` (images within cards) |

### Font Scaling (deviceType-aware)

```typescript
const isTablet = deviceType === 'tablet';

// Heading
className={isTablet ? 'text-3xl' : 'text-2xl'}

// Stop title
className={isTablet ? 'text-lg' : 'text-base'}

// Stop number badge
className={isTablet ? 'text-xs' : 'text-[10px]'}

// Duration
className={isTablet ? 'text-sm' : 'text-xs'}
```

---

## 11. Implementation Order

### Phase 1: Core (MVP)
1. **Types** — Add `StopListBlockData`, `StopListLayout` to `types/index.ts`
2. **Registration** — Update `ContentBlockType` union, `ContentBlockData` union
3. **StopListBlockEditor.tsx** — Create editor with template selector + stop picker + reorder
4. **StopListBlockPreview.tsx** — Create preview with "card" layout only (MVP)
5. **StopContentBlock.tsx** — Add icons, labels, render case
6. **StopEditor.tsx** — Add import, empty data, editor rendering, add-block modal entry
7. **Thread `allStops`** — Ensure `allStops` reaches `StopContentBlock` → `StopListBlockPreview`

### Phase 2: All Layouts
8. Add "large-card" layout to preview
9. Add "compact-list" layout to preview
10. Add "full-bleed" layout to preview

### Phase 3: Polish & Navigation
11. Wire up click-to-navigate in visitor mode
12. Add responsive grid for visitor pages (CSS breakpoints)
13. Test in StopPreviewModal (phone + tablet device frames)

### Phase 4: Future Templates & Enhancements
14. Implement new template variants (see §16 Brainstorm below)
15. Filtering/search within stop list
16. Animated transitions between states

---

## 12. Key Architectural Decisions

### Why a content block (not a page-level component)?
- Blocks are composable — a stop can have a Stop List alongside text, images, audio
- Follows existing architecture — no new concepts needed
- Reusable — could be used in an "intro" stop, a "conclusion" stop, or a standalone overview stop

### Why store `stopIds` instead of embedding stop data?
- Stops already exist in the database — no duplication
- Stop data stays in sync (title changes, image changes propagate automatically)
- Smaller block data payload
- `allStops` is already available in the component tree

### Why `allStops` prop threading instead of fetching inside the component?
- Follows existing patterns (TourBlockEditor already receives `allStops`)
- Avoids duplicate API calls
- Keeps components pure (data flows down)
- The data is already fetched at the page level

### Template system for future extensibility
- `layout` field allows adding new templates without schema changes
- Each template is a separate render function within the preview component
- Editor template selector is easily extensible with new visual options

---

## 13. Stop Data Resolution Pattern

The preview component needs to resolve `stopIds` → full `Stop` objects:

```typescript
// Inside StopListBlockPreview
const resolvedStops = useMemo(() => {
  if (!allStops || !data.stopIds) return [];
  return data.stopIds
    .map(id => allStops.find(s => s.id === id))
    .filter(Boolean) as Stop[];
}, [allStops, data.stopIds]);
```

**Helper to get stop image URL:**
```typescript
function getStopImageUrl(stop: Stop): string {
  if (typeof stop.image === 'object' && stop.image?.url) return stop.image.url;
  if (typeof stop.image === 'string' && stop.image) return stop.image;
  return fallbackImage;
}
```

**Helper to estimate stop duration:**
```typescript
function getStopDuration(stop: Stop): number | null {
  // Check audio blocks for duration
  const audioBlocks = (stop.contentBlocks || []).filter(b =>
    b.type === 'audio' || b.type === 'timelineGallery'
  );
  if (audioBlocks.length > 0) {
    // Sum audio durations
    return audioBlocks.reduce((total, block) => {
      if (block.type === 'timelineGallery') {
        return total + ((block.data as TimelineGalleryBlockData).audioDuration || 0);
      }
      return total;
    }, 0);
  }
  return null; // Unknown duration
}
```

---

## 14. Visitor Mode Navigation

In `VisitorStop.tsx`, the stop list block needs to trigger navigation:

```typescript
// In VisitorStop.tsx, when rendering StopContentBlock:
<StopContentBlock
  block={block}
  mode="view"
  language={language}
  deviceType={deviceType}
  tourData={tourData}
  allStops={allStops}
  displaySettings={displaySettings}
  onNavigateToStop={(stopId) => {
    const targetStop = allStops.find(s => s.id === stopId);
    if (targetStop) {
      navigate(`/visitor/tour/${tour.slug}/stop/${targetStop.slug || targetStop.id}`);
    }
  }}
/>
```

---

## 15. Testing Checklist

- [x] Block appears in "Add Block" modal with correct icon
- [x] Editor loads with empty state, shows all tour stops for selection
- [x] Selecting stops populates the selected list
- [x] Drag-to-reorder works in the selected stops list
- [x] All 4 layout templates render correctly
- [x] Phone preview shows 1-column layout
- [x] Tablet preview shows 2-column grid (except compact-list)
- [x] Stop images render (handles both object and string formats)
- [x] Localized titles and descriptions display correctly
- [x] Dark mode styling matches existing blocks
- [x] Stop number badges show correct sequential numbers
- [x] Duration displays when audio blocks exist
- [x] CTA button renders with correct text
- [x] Clicking stop card in visitor mode navigates to stop
- [x] Clicking stop card in admin preview navigates within simulator frame
- [x] Back navigation bar sticky below status bar in simulator
- [x] Block saves and loads correctly (JSON round-trip)
- [x] TypeScript compiles without errors (`npm run typecheck`)
- [x] Block renders in StopPreviewModal (both phone and tablet frames)

---

## 16. All Templates Reference (9 total)

> **Status:** All 9 templates implemented. Template selector uses a 3×3 grid.

### Template Catalog

| # | Layout Key | Name | Image | Grid (phone) | Grid (tablet) | Notes |
|---|-----------|------|-------|-------------|--------------|-------|
| 1 | `card` | Card | Thumbnail right | 1-col, gap-3 | 2-col | Default — text left, image right |
| 2 | `card-left` | Card Left | Thumbnail left | 1-col, gap-3 | 2-col | Mirror of Card — image left, text right |
| 3 | `large-card` | Large Card | Full-width above | 1-col, gap-3 | 2-col | Vertical scroll, high visual impact |
| 4 | `compact-list` | Compact | Small thumb left | 1-col, gap-0 | 2-col | Dense list rows with border dividers |
| 5 | `full-bleed` | Full Bleed | Edge-to-edge bg | 1-col, gap-3 | 2-col | `aspect-[3/4]`, gradient overlay, cinematic |
| 6 | `overlay` | Overlay | Text over image | 1-col, gap-3 | 2-col | `aspect-[16/10]`, rounded cards, gradient overlay |
| 7 | `numbered` | Numbered | None | 1-col, gap-0 | 2-col | Large accent-colored number, no image, typographic |
| 8 | `minimal` | Minimal | None | 1-col, gap-0 | 2-col | Text only, table-of-contents style, subtle dividers |
| 9 | `timeline` | Timeline | Small thumb right | 1-col, gap-0 | **1-col** (always) | Vertical rail with accent dots + connecting line |

### Template Groups

**Card Variants** (image + text in bordered cards):
- `card` — image right
- `card-left` — image left

**Visual / Image-Forward** (large images as primary element):
- `large-card` — image above text, separate sections
- `full-bleed` — tall cinematic images, text overlaid at bottom
- `overlay` — shorter landscape images, text overlaid, rounded corners

**List / Text-Forward** (dense, scannable, minimal visuals):
- `compact-list` — small thumbnails, dense rows
- `numbered` — large stop numbers, no images
- `minimal` — text only, table of contents

**Structural** (unique layout pattern):
- `timeline` — vertical connecting line with nodes, always 1-col

### Grid Logic

```typescript
const getGridClass = () => {
  if (data.layout === 'timeline') return 'grid grid-cols-1 gap-0';  // always 1-col
  if (isTablet) return 'grid grid-cols-2 gap-3';                     // all others: 2-col on tablet
  if (data.layout === 'compact-list' || data.layout === 'numbered' || data.layout === 'minimal')
    return 'grid grid-cols-1 gap-0';                                  // list-style: no gap on phone
  return 'grid grid-cols-1 gap-3';                                    // card-style: gap on phone
};
```

**Why timeline is always 1-col:** The vertical rail (accent dot + connecting line) runs between items. Splitting into 2 columns would break the visual continuity.

### Editor UI

Template selector uses a **3×3 grid** (previously 2×2) with compact button sizing:
- Icon + label on first line
- Description text below in `text-[10px]`
- Active state: accent border + accent bg/10

### Future Candidates (not implemented)

#### Hero Spotlight (`hero`)
First stop gets a large hero card (full-width image, prominent title). Remaining stops render in a smaller grid below. **Deferred** — the Tour Block and block image already provide hero functionality at the stop level.
