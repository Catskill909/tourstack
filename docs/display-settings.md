# Display Settings Feature

## Overview

The Display Settings feature allows staff and administrators to toggle the visibility of titles and descriptions across all blocks in preview and visitor tour views. This provides a clean, modern way to customize the visitor experience without generic checkboxes.

## UI Components

### ModernToggle Component

**Location:** `app/src/components/ui/ModernToggle.tsx`

A Material Design 3 inspired animated toggle switch with:

- **Smooth spring animations** via Framer Motion
- **Three sizes:** `sm` (36px), `md` (48px), `lg` (56px)
- **Animated thumb** with check icon that appears when toggled on
- **Accessibility support** with ARIA attributes
- **Dark mode optimized** styling

```tsx
<ModernToggle
    checked={isEnabled}
    onChange={(checked) => setIsEnabled(checked)}
    label="Enable Feature"
    description="Optional helper text"
    size="md"
/>
```

### DisplaySettingsPanel Component

**Location:** `app/src/components/DisplaySettingsPanel.tsx`

A floating action button (FAB) with slide-up panel containing display toggles:

- **Floating Action Button (FAB)** - Circular button with settings icon
- **Animated slide-up panel** - Opens on tap with smooth spring animation
- **Backdrop blur** - Subtle blur effect when panel is open
- **Badge indicator** - Shows count of hidden elements when not all visible
- **Position options:** `bottom-right`, `bottom-left`, `top-right`, `top-left`

```tsx
<DisplaySettingsPanel
    settings={displaySettings}
    onChange={setDisplaySettings}
    position="bottom-right"
    showLabel={true}
/>
```

## Data Model

### DisplaySettings Interface

```typescript
interface DisplaySettings {
    showTitles: boolean;      // Show stop/block titles
    showDescriptions: boolean; // Show stop/block descriptions
}
```

### Tour Type Extension

Added to `Tour` interface in `types/index.ts`:

```typescript
// Display settings for visitor/preview views
displaySettings?: {
    showTitles: boolean;
    showDescriptions: boolean;
};
```

## Integration Points

### 1. StopPreviewModal

**File:** `app/src/components/StopPreviewModal.tsx`

- Adds DisplaySettingsPanel FAB at bottom-right
- Manages local displaySettings state
- Passes displaySettings to StopContentBlock
- Conditionally renders stop header title/description

### 2. VisitorStop Page

**File:** `app/src/pages/VisitorStop.tsx`

- Adds DisplaySettingsPanel FAB (visible to staff only)
- Initializes displaySettings from tour data
- Passes displaySettings to StopContentBlock
- Conditionally renders stop title/description

### 3. StopContentBlock

**File:** `app/src/components/blocks/StopContentBlock.tsx`

- Accepts optional `displaySettings` prop
- Conditionally renders based on settings:
  - **Audio Block:** Title visibility respects both block setting and displaySettings
  - **Video Block:** Title section hidden when showTitles is false
  - **Tour Block (Hero):** Title and description conditional in both layouts

## User Experience

### Staff/Admin View

1. Open any stop preview or visitor page as staff
2. See golden FAB with settings icon in corner
3. Tap FAB to open settings panel
4. Toggle "Show Titles" or "Show Descriptions"
5. See changes reflected immediately in preview
6. Badge shows count when items are hidden

### Panel Design

```
┌─────────────────────────────────┐
│  ⚙️ Display Settings          X │
│     2/2 visible                  │
├─────────────────────────────────┤
│                                  │
│  [T] Show Titles                 │
│      Stop & block titles    ━━● │
│                                  │
│  [≡] Show Descriptions           │
│      Stop & block descriptions━●│
│                                  │
│  ─────────────────────────────── │
│  Controls how content appears    │
│  to visitors                     │
└─────────────────────────────────┘
```

## Styling

### Color Variables Used

- `--color-accent-primary` - Toggle on state, FAB background
- `--color-bg-surface` - Panel background
- `--color-bg-elevated` - Panel header, toggle off state
- `--color-bg-hover` - Hover states
- `--color-border-default` - Borders
- `--color-text-primary` - Main text
- `--color-text-muted` - Secondary text

### Animation Details

- **FAB rotation:** 45° on open (X icon transition)
- **Panel slide:** Spring animation (stiffness: 400, damping: 25)
- **Toggle thumb:** Spring animation (stiffness: 500, damping: 30)
- **Backdrop:** Fade in/out with blur effect

## Files Modified

| File | Changes |
|------|---------|
| `types/index.ts` | Added `displaySettings` to Tour interface |
| `StopPreviewModal.tsx` | Import DisplaySettingsPanel, add state and FAB |
| `VisitorStop.tsx` | Import DisplaySettingsPanel, add state and FAB (staff only) |
| `StopContentBlock.tsx` | Accept displaySettings prop, conditional rendering |

## Files Created

| File | Description |
|------|-------------|
| `components/ui/ModernToggle.tsx` | Animated toggle switch component |
| `components/DisplaySettingsPanel.tsx` | FAB with settings panel |
| `docs/display-settings.md` | This documentation |

## Future Enhancements

- [ ] Persist display settings to tour model in database
- [ ] Add display settings to Tour Settings modal
- [ ] Per-block override option
- [ ] More display options (show captions, show badges, etc.)
- [ ] Keyboard shortcuts for toggling

---

*Implemented: January 25, 2026*
