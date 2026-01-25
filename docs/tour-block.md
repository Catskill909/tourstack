# Tour Block (Start/Hero Block) - Implementation Complete ✅

**Created**: January 25, 2026  
**Status**: ✅ COMPLETE - Deployed  
**Author**: AI Assistant

---

## 📋 Executive Summary

The **Tour Block** serves as the introduction/landing view for museum tours. It creates an immersive, full-screen entry point using the tour's hero image, title, description, and a "Begin Tour" call-to-action.

### Design System: Architectural Information System

The Tour Block uses a clean, minimalist "Architectural Information System" aesthetic:
- **Monochrome palette** - White text, neutral-900 backgrounds, no gold accents
- **Light typography** - `font-light` with tight tracking, no drop shadows
- **Border-style badges** - Subtle `tracking-[0.2em]` uppercase with white border
- **Sharp geometry** - Minimal rounded corners, clean edges
- **Full-height layout** - `min-h-[100dvh]` fills device screens properly

---

## ✅ Implementation Complete

### Files Created/Modified

| File | Purpose |
|------|---------|
| `TourBlockEditor.tsx` | Full editor with live preview, multilingual support |
| `StopContentBlock.tsx` | Added `renderTourBlock()` function |
| `types/index.ts` | Added `TourBlockData` interface, `'tour'` to `ContentBlockType` |
| `blocks/index.ts` | Added `TourBlockEditor` export |
| `StopEditor.tsx` | Integrated Tour Block in Add Block modal |

### Features Implemented

- ✅ **3 Layout Variants**: Bottom aligned, centered, card overlay
- ✅ **Multilingual Support**: LanguageSwitcher + MagicTranslateButton for all text fields
- ✅ **CTA Customization**: Primary/secondary/outline/ghost button styles
- ✅ **CTA Actions**: Next stop, specific stop, or external URL
- ✅ **Image Controls**: Position (top/center/bottom), fit (cover/contain), overlay opacity
- ✅ **Fallback Image**: Uses `/assets/fallback.jpg` if no image selected
- ✅ **Live Preview**: Real-time preview in editor matches visitor view

---

## 🔍 Original Audit Results (Reference)

### Current Block Architecture

#### 1. Type System (`/app/src/types/index.ts`)

**Block Types Enumeration** (lines 218-230):
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
  | 'map';
```

**Each Block Type Has**:
- A corresponding `*BlockData` interface
- An entry in `ContentBlockData` discriminated union
- A renderer in `StopContentBlock.tsx`
- An editor component (`*BlockEditor.tsx`)
- Icon and label in `BLOCK_ICONS` / `BLOCK_LABELS`

#### 2. Block Component Structure (`/app/src/components/blocks/`)

| File | Purpose | Lines |
|------|---------|-------|
| `StopContentBlock.tsx` | Renders all blocks (view/edit modes) | 287 |
| `TextBlockEditor.tsx` | Rich text editing with i18n | 200 |
| `ImageBlockEditor.tsx` | Image upload with drag-drop | 150 |
| `AudioBlockEditor.tsx` | Audio + TTS + transcription | 325 |
| `GalleryBlockEditor.tsx` | Multi-image carousel/grid | 476 |
| `TimelineGalleryBlockEditor.tsx` | Audio-synced images | Complex |
| `MapBlockEditor.tsx` | OpenStreetMap/Google Maps | Medium |
| `PositioningBlockEditor.tsx` | QR/GPS/BLE configuration | Medium |
| `index.ts` | Exports all blocks | 11 |

#### 3. Block Data Pattern

Every block follows this pattern:
```typescript
export interface ExampleBlockData {
  // Multilingual fields use Record<string, string>
  title?: { [lang: string]: string };
  // Media URLs are strings
  imageUrl?: string;
  // Enums for options
  size: 'small' | 'medium' | 'large';
  // Nested objects for complex settings
  settings?: { ... };
}
```

#### 4. Block Rendering Flow

```
StopEditor.tsx
  └── Displays block list (left pane)
  └── Renders *BlockEditor based on type (right pane)
  └── Preview button → StopPreviewModal.tsx
        └── StopContentBlock.tsx (view mode)
              └── render*Block() functions per type

VisitorStop.tsx (Public visitor view)
  └── Fetches stop via API
  └── Maps contentBlocks to StopContentBlock components
  └── Each block renders via StopContentBlock (view mode)
```

#### 5. Key Insights for Tour Block

1. **Tour Data Access**: The Tour Block needs access to parent Tour data, not just Stop data
2. **Full-Screen Rendering**: No other block currently supports full-viewport display
3. **Size System Needed**: Current blocks use fixed sizes; we need a new `displayMode` system
4. **Button Actions**: No block currently has CTA buttons with navigation actions

---

## 🎯 Tour Block Specification

### Block Type Name
`tour` - Aligns with naming convention, represents Tour introduction

### Data Interface

```typescript
export interface TourBlockData {
  // Display Mode (NEW CONCEPT - future blocks can use this)
  displayMode: 'fullscreen' | 'card' | 'compact';
  
  // Layout variant (future expansion)
  layout: 'hero-bottom' | 'hero-center' | 'hero-split' | 'hero-overlay';
  
  // Content Overrides (optional - defaults to Tour data)
  titleOverride?: { [lang: string]: string };
  descriptionOverride?: { [lang: string]: string };
  imageOverride?: string;
  
  // Hero Image Settings
  imagePosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
  imageFit: 'cover' | 'contain';
  overlayOpacity: number; // 0-100, gradient darkness
  overlayColor?: string; // Default: black
  
  // Badge/Label (e.g., "FEATURED EXHIBIT")
  badge?: { [lang: string]: string };
  badgeColor?: string;
  
  // Call-to-Action Button
  ctaText?: { [lang: string]: string }; // Default: "Begin Guided Tour"
  ctaStyle: 'primary' | 'secondary' | 'outline' | 'ghost';
  ctaAction: 'next-stop' | 'specific-stop' | 'external-url';
  ctaTargetStopId?: string; // If action is 'specific-stop'
  ctaExternalUrl?: string; // If action is 'external-url'
  
  // Animation (future)
  animateOnLoad?: boolean;
  parallaxEnabled?: boolean;
}
```

### Visual Design (Based on Attached Reference Image)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                     [HERO IMAGE - FULL BLEED]                  │
│                       (Tour's heroImage)                        │
│                                                                 │
│                                                                 │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│  ┌─────────────────┐                                           │
│  │ FEATURED EXHIBIT│  ← Badge (optional, accent color pill)    │
│  └─────────────────┘                                           │
│                                                                 │
│  The Veiled Lady                                               │
│  ───────────────────                                            │
│  Explore the intricate craftsmanship of 19th-                  │
│  century Italian marble sculptures.                             │
│                                                                 │
│  ┌─────────────────────────────┐                               │
│  │    Begin Guided Tour   →   │  ← CTA Button                  │
│  └─────────────────────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Implementation Plan

### Phase 1: Type System Updates

**File**: `/app/src/types/index.ts`

1. Add `'tour'` to `ContentBlockType` union
2. Create `TourBlockData` interface
3. Add to `ContentBlockData` union
4. Add `displayMode` as optional field to base `ContentBlock` interface (for future use)

### Phase 2: Block Metadata

**File**: `/app/src/components/blocks/StopContentBlock.tsx`

1. Import new icon (suggest: `Presentation` or `Play` from lucide-react)
2. Add `tour` entry to `BLOCK_ICONS`
3. Add `tour` entry to `BLOCK_LABELS` ("Tour Intro" or "Start Block")
4. Add `renderTourBlock()` function

### Phase 3: Block Renderer

**New Function in StopContentBlock.tsx**:

```typescript
function renderTourBlock(data: TourBlockData, tourData?: Tour) {
  // Access tour data passed via context or props
  const title = data.titleOverride?.[language] || tourData?.title[language] || '';
  const description = data.descriptionOverride?.[language] || tourData?.description[language] || '';
  const heroImage = data.imageOverride || tourData?.heroImage || '';
  
  // Render full-screen hero with overlay gradient
  // Badge + Title + Description + CTA button
}
```

**Key Challenge**: Tour data access
- Option A: Pass tour data through context (React Context)
- Option B: Pass tour data as prop through StopContentBlock
- Option C: Fetch tour data inside block (not recommended)

**Recommended**: Option B - Add optional `tourData?: Tour` prop to StopContentBlock

### Phase 4: Block Editor

**New File**: `/app/src/components/blocks/TourBlockEditor.tsx`

**Editor Sections**:

1. **Content Source** (collapsible)
   - Toggle: "Use Tour Data" vs "Custom Content"
   - If custom: title, description, image overrides

2. **Hero Image Settings**
   - Image position selector (5 options)
   - Image fit toggle (cover/contain)
   - Overlay opacity slider (0-100)
   - Overlay color picker

3. **Badge Settings** (collapsible)
   - Enable badge toggle
   - Badge text input (multilingual)
   - Badge color picker

4. **Call-to-Action** (collapsible)
   - CTA text input (multilingual with default)
   - Style selector (primary/secondary/outline/ghost)
   - Action type selector
   - Target stop dropdown (if specific-stop)
   - URL input (if external-url)

5. **Layout Settings** (future dev - show placeholder)
   - Layout variant preview grid

6. **Animation Settings** (future dev - show placeholder)
   - Enable animations toggle
   - Parallax toggle

### Phase 5: Export & Integration

**File**: `/app/src/components/blocks/index.ts`

Add export for `TourBlockEditor`

### Phase 6: StopEditor Integration

**File**: `/app/src/components/StopEditor.tsx`

1. Import `TourBlockEditor`
2. Add case for 'tour' type in editor rendering
3. Pass `tourData` prop when available

### Phase 7: Visitor View Support

**File**: `/app/src/pages/VisitorStop.tsx`

1. Pass tour data to StopContentBlock components
2. Handle full-screen display mode for tour blocks

### Phase 8: Preview Modal Support

**File**: `/app/src/components/StopPreviewModal.tsx`

1. Pass tour data to preview
2. Handle full-screen blocks correctly in device frames

---

## 📐 Display Mode System (Future Architecture)

### Concept

A new system allowing any block to specify its viewport behavior:

```typescript
// In ContentBlock interface
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  order: number;
  data: ContentBlockData;
  
  // NEW: Display configuration
  display?: {
    mode: 'inline' | 'fullscreen' | 'percentage';
    heightPercent?: number; // 0-100, for percentage mode
    breakpoint?: 'always' | 'mobile-only' | 'tablet-up';
  };
  
  createdAt: string;
  updatedAt: string;
}
```

### Use Cases

| Mode | Height | Use Case |
|------|--------|----------|
| `inline` | Content-driven | Default, standard blocks |
| `fullscreen` | 100vh | Tour intro, immersive galleries |
| `percentage` | X% of viewport | Split layouts, hero sections |

### Implementation Notes

- Tour Block defaults to `fullscreen` mode
- Other blocks remain `inline` by default
- CSS uses `min-height` with viewport units
- Mobile considerations for address bar height (`100dvh`)

---

## 🔄 Data Flow Architecture

### Stop Editor Context

```
TourDetail.tsx (has tour data)
  └── StopEditor (receives tour prop)
        └── TourBlockEditor (receives tour data)
              └── Preview uses tour data for rendering
```

### Visitor Context

```
VisitorStop.tsx
  └── Fetches /api/visitor/tour/:id/stop/:id
        └── Response includes { tour, stop, allStops }
              └── StopContentBlock receives tourData prop
                    └── TourBlock renders with tour info
```

### API Enhancement Needed

The visitor API already returns tour data - no backend changes required!

---

## 🎨 UI/UX Considerations

### For Museum Curators (Admin)

1. **Quick Start**: Default to "Use Tour Data" so curators don't need to re-enter info
2. **Live Preview**: Show real-time preview of hero layout
3. **Mobile Preview**: Device frame shows exactly what visitors see
4. **Accessibility**: Ensure sufficient contrast with overlay settings

### For Museum Visitors

1. **Immersive First Impression**: Full-screen hero creates "wow" moment
2. **Clear CTA**: Obvious "Begin Tour" button for engagement
3. **Fast Loading**: Image optimization, lazy loading for hero
4. **Scroll Hint**: Subtle animation indicating content below (if not fullscreen)

---

## 📁 File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `app/src/types/index.ts` | MODIFY | Add TourBlockData, update unions |
| `app/src/components/blocks/StopContentBlock.tsx` | MODIFY | Add tour renderer, icons, labels |
| `app/src/components/blocks/TourBlockEditor.tsx` | CREATE | New editor component |
| `app/src/components/blocks/index.ts` | MODIFY | Export TourBlockEditor |
| `app/src/components/StopEditor.tsx` | MODIFY | Import editor, add case, pass tour |
| `app/src/components/StopPreviewModal.tsx` | MODIFY | Pass tour data |
| `app/src/pages/VisitorStop.tsx` | MODIFY | Pass tour to StopContentBlock |

---

## 🧪 Testing Checklist

### Unit Tests
- [ ] TourBlockData interface validation
- [ ] Default values handling
- [ ] Override vs tour data logic

### Integration Tests
- [ ] Block creation in StopEditor
- [ ] Block editing and saving
- [ ] Preview modal rendering
- [ ] Visitor page rendering

### Visual/Manual Tests
- [ ] Full-screen display on phone device frame
- [ ] Full-screen display on tablet device frame
- [ ] Overlay opacity variations (0, 25, 50, 75, 100)
- [ ] All layout variants (when implemented)
- [ ] CTA button navigation
- [ ] Multilingual content switching
- [ ] Badge visibility and styling

### Accessibility Tests
- [ ] Color contrast with overlay
- [ ] Focus states on CTA button
- [ ] Screen reader support for hero image
- [ ] Keyboard navigation

---

## 🚀 Future Development Roadmap

### Phase 2: Layout Variants
- `hero-center`: Centered content over image
- `hero-split`: 50/50 image and content
- `hero-overlay`: Blurred image with card overlay

### Phase 3: Block Linking System
- Link blocks to other blocks within a stop
- Create "Related Stops" navigation
- Branch navigation for choose-your-path tours

### Phase 4: Display Mode System
- Implement for all blocks
- Admin UI for percentage heights
- Responsive breakpoint controls

### Phase 5: Animation System
- Entrance animations
- Parallax scrolling
- Transition effects between blocks

---

## 📝 Implementation Priority

1. **MVP (This Session)**:
   - Type definitions
   - Basic renderer (fullscreen hero)
   - Simple editor (image settings, CTA)
   - Integration with StopEditor

2. **Polish (Next Session)**:
   - Badge support
   - All CTA action types
   - Overlay color picker
   - Layout selector UI (placeholder)

3. **Future**:
   - Layout variants
   - Display mode system
   - Animation system

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Content block system design
- [timeline-gallery.md](./timeline-gallery.md) - Complex block reference
- [tourstack.md](../tourstack.md) - Full product scope
- [HANDOFF.md](../HANDOFF.md) - Development status

---

**Ready for Implementation**: ✅

This document provides the complete blueprint for implementing the Tour Block. The MVP can be built in a single development session, with future enhancements clearly scoped.
