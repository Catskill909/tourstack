# Framer Motion Implementation Audit

## Issue Summary

**Date**: January 21, 2026  
**Status**: 🔴 Critical - Needs Fix  
**Affected Components**: 
- `TimelineGalleryEditorModal.tsx` (Editor preview)
- `TimelineGalleryPreview.tsx` (Stop preview)

### Reported Problems

1. **Timing Not Respected**: Slider set to 1.5s but fade happens much faster
2. **No True Crossfade**: Image fades out exposing image underneath, no simultaneous crossfade
3. **Affects Both**: Issue present in Editor AND Preview components

---

## Current Implementation Analysis

### 1. Timeline Gallery Editor Modal

**File**: `app/src/components/blocks/TimelineGalleryEditorModal.tsx`

```typescript
// Line 76: Duration calculation
const transitionDuration = (data.crossfadeDuration || 500) / 1000; // Convert to seconds

// Lines 432-442: AnimatePresence implementation
<AnimatePresence initial={false}>
    <motion.img
        key={currentImage.id}
        src={currentImage.url}
        alt={currentImage.alt[language] || ''}
        className="absolute max-w-full max-h-full object-contain rounded-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: transitionDuration, ease: 'easeInOut' }}
    />
</AnimatePresence>
```

### 2. Timeline Gallery Preview

**File**: `app/src/components/blocks/TimelineGalleryPreview.tsx`

```typescript
// Lines 26-28: Duration calculation
const transitionDurationMs = data.crossfadeDuration || 500;
const transitionDuration = transitionDurationMs / 1000; // Convert to seconds
const transitionType: TransitionType = data.transitionType || 'fade';

// Lines 204-220: AnimatePresence implementation
<AnimatePresence initial={false}>
    {currentImage && (
        <motion.div
            key={currentImage.id || currentIndex}
            className="absolute inset-0 z-10 flex items-center justify-center"
            initial={motionProps.initial}
            animate={motionProps.animate}
            exit={motionProps.exit}
            transition={motionProps.transition}
        >
            <img ... />
        </motion.div>
    )}
</AnimatePresence>
```

---

## Root Cause Analysis

### Issue 1: AnimatePresence Default Mode

**Problem**: `AnimatePresence` by default uses `mode="sync"` which means:
- Exit animation runs first
- Then enter animation runs
- They do NOT overlap = No crossfade!

**Expected Behavior**: True crossfade requires BOTH images visible simultaneously:
- Old image fading OUT (opacity 1 → 0)
- New image fading IN (opacity 0 → 1)
- Both happen at the SAME time, overlapping

**AnimatePresence Modes**:
| Mode | Behavior |
|------|----------|
| `"sync"` (default) | Exit completes, then enter starts. NO overlap. |
| `"wait"` | Same as sync - waits for exit before enter |
| `"popLayout"` | Allows simultaneous animations but complex |

### Issue 2: Single Element in AnimatePresence

**Problem**: Only ONE `motion` element is rendered at a time inside `AnimatePresence`.

```tsx
<AnimatePresence>
    {currentImage && (
        <motion.img key={currentImage.id} ... />  // Only ONE image ever rendered
    )}
</AnimatePresence>
```

When `currentImage` changes:
1. Old image starts exit animation
2. Old image is REMOVED from DOM
3. New image is added and starts enter animation
4. Result: Sequential fade, not crossfade

### Issue 3: Duration May Be Correct But Perceived Wrong

The `transitionDuration` calculation is mathematically correct:
- Slider value: 1500ms (1.5s)
- Converted: 1500 / 1000 = 1.5 seconds
- Framer Motion receives: `{ duration: 1.5 }`

BUT because there's no true crossfade:
- Exit fade: 1.5s (image fades to nothing, exposing background)
- Enter fade: 1.5s (new image fades in from nothing)
- Total perceived: 3 seconds, but "crossfade" portion is 0 seconds

---

## Data Flow Trace

```
┌─────────────────────────────────────────────────────────────────┐
│ SLIDER (Editor)                                                  │
│ min="100" max="1500" step="100"                                 │
│ onChange → data.crossfadeDuration = parseInt(value)             │
│ Example: 1500 (milliseconds)                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STORAGE                                                          │
│ data.crossfadeDuration = 1500 (stored in ms)                    │
│ Saved via handleUpdateBlock → editedStop → onSave               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ COMPONENT (Editor/Preview)                                       │
│ const transitionDuration = (data.crossfadeDuration || 500) / 1000│
│ Result: 1.5 (seconds)                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ FRAMER MOTION                                                    │
│ transition={{ duration: 1.5, ease: 'easeInOut' }}               │
│ Applied to: initial → animate → exit                            │
└─────────────────────────────────────────────────────────────────┘
```

**✅ Data flow is CORRECT** - the issue is the AnimatePresence implementation.

---

## Solution: True Crossfade Implementation

### Approach: Render TWO Images Simultaneously

For a true crossfade, we need BOTH the old and new image rendered at the same time during the transition.

**Option A: Dual Image Layer Approach (Recommended)**

```tsx
// Keep track of previous image for crossfade
const [displayImages, setDisplayImages] = useState<{
    current: ImageType;
    previous: ImageType | null;
}>({ current: images[0], previous: null });

// When image changes, set up crossfade
useEffect(() => {
    if (currentImage !== displayImages.current) {
        setDisplayImages({
            current: currentImage,
            previous: displayImages.current
        });
        
        // Clear previous after transition completes
        const timer = setTimeout(() => {
            setDisplayImages(prev => ({ ...prev, previous: null }));
        }, transitionDuration * 1000);
        
        return () => clearTimeout(timer);
    }
}, [currentImage]);

// Render
<div className="relative">
    {/* Previous image - fading OUT */}
    {displayImages.previous && (
        <motion.img
            key={`prev-${displayImages.previous.id}`}
            src={displayImages.previous.url}
            className="absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: transitionDuration }}
        />
    )}
    
    {/* Current image - fading IN */}
    <motion.img
        key={`curr-${displayImages.current.id}`}
        src={displayImages.current.url}
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: transitionDuration }}
    />
</div>
```

**Option B: CSS-Only Crossfade (Simpler but less flexible)**

```tsx
// Stack both images, animate opacity with CSS
<div className="relative">
    {images.map((img, idx) => (
        <motion.img
            key={img.id}
            src={img.url}
            className="absolute inset-0"
            animate={{ 
                opacity: idx === currentIndex ? 1 : 0,
                zIndex: idx === currentIndex ? 10 : 0 
            }}
            transition={{ duration: transitionDuration }}
        />
    ))}
</div>
```

**Option C: AnimatePresence with Custom Exit Delay**

Not recommended - AnimatePresence isn't designed for true crossfade.

---

## Implementation Plan

### Phase 1: Fix Editor Preview (TimelineGalleryEditorModal)

1. Add state to track previous image
2. Render both current and previous images
3. Animate opacity independently
4. Clean up previous image after transition

### Phase 2: Fix Stop Preview (TimelineGalleryPreview)

1. Apply same dual-image approach
2. Ensure `transitionType` variants work with new approach
3. Test with different transition types (fade, slide, zoom)

### Phase 3: Testing & Verification

1. Test slider at different values (0.1s, 0.5s, 1.5s)
2. Verify true crossfade (both images visible during transition)
3. Verify timing matches slider value
4. Test audio sync still works correctly

---

## Files to Modify

| File | Changes Required |
|------|------------------|
| `TimelineGalleryEditorModal.tsx` | Replace AnimatePresence with dual-image crossfade |
| `TimelineGalleryPreview.tsx` | Replace AnimatePresence with dual-image crossfade |

---

## Debug Logging (Currently Added)

```typescript
// In TimelineGalleryPreview.tsx
console.log('[TimelineGalleryPreview] Transition settings:', {
    crossfadeDuration: data.crossfadeDuration,
    transitionDurationMs,
    transitionDuration,
    transitionType
});
```

This confirms whether the correct value is being received from the data store.

---

## References

- [Framer Motion AnimatePresence](https://www.framer.com/motion/animate-presence/)
- [Framer Motion Transition](https://www.framer.com/motion/transition/)
- [True Crossfade Discussion](https://github.com/framer/motion/issues/1424)

---

## Status Updates

| Date | Update |
|------|--------|
| 2026-01-21 | Initial audit created, root cause identified |
| 2026-01-21 | **FIXED**: Implemented dual-image crossfade solution |

---

## Fix Implementation Details

### Changes Made

**1. TimelineGalleryEditorModal.tsx**
- Added `previousIndex` state to track the outgoing image
- Added `useEffect` to clear `previousIndex` after transition completes
- Replaced `AnimatePresence` with dual-image rendering:
  - Previous image: `opacity: 1 → 0` (fading OUT)
  - Current image: `opacity: 0 → 1` (fading IN)
  - Both render simultaneously = true crossfade

**2. TimelineGalleryPreview.tsx**
- Same pattern as Editor
- Added `previousIndex` state tracking
- Updated `triggerTransition()` to store previous index before changing
- Added cleanup `useEffect` to clear previous after transition
- Replaced `AnimatePresence` with dual-image rendering

### Key Code Pattern

```tsx
// State for tracking previous image
const [previousIndex, setPreviousIndex] = useState<number | null>(null);

// When image changes, store previous
function triggerTransition(newIndex: number) {
    if (newIndex !== currentIndex) {
        setPreviousIndex(currentIndex);
    }
    setCurrentIndex(newIndex);
}

// Clear previous after transition duration
useEffect(() => {
    if (previousIndex !== null) {
        const timer = setTimeout(() => {
            setPreviousIndex(null);
        }, transitionDuration * 1000);
        return () => clearTimeout(timer);
    }
}, [previousIndex, transitionDuration]);

// Render both images during transition
<>
    {/* Previous - fading out */}
    {previousIndex !== null && images[previousIndex] && (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: transitionDuration, ease: 'easeInOut' }}
        >
            <img src={images[previousIndex].url} />
        </motion.div>
    )}
    {/* Current - fading in */}
    <motion.div
        initial={{ opacity: previousIndex !== null ? 0 : 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: transitionDuration, ease: 'easeInOut' }}
    >
        <img src={currentImage.url} />
    </motion.div>
</>
```

### Why This Works

1. **Both images visible during transition**: Previous and current render at the same time
2. **Synchronized timing**: Both animations use the same `transitionDuration`
3. **True crossfade**: As one fades out, the other fades in - they overlap
4. **Clean state management**: Previous is cleared after transition completes
