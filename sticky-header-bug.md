# Forensic Audit: Sticky Header Implementation Failure
**Incident Duration**: ~2 Hours
**Total Failed Attempts**: 12
**Status**: RESOLVED
**File Location**: `TourStack/sticky-header-bug.md`

## Overview
This document serves as a complete forensic record of the persistent failures encountered while attempting to make the "AI Object Analysis" header sticky and flush with the viewport top. It documents the "loop" of errors, the files modified, and the systematic breakdown of why each attempt failed.

## Files Modified & Audited
1.  **`app/src/pages/AIAssistance.tsx`** (Primary Failure Site)
    *   *Role*: Component containing the header and layout logic.
    *   *Changes*: Multiple layout refactors, CSS injections, and animation wrapper adjustments.
2.  **`app/src/index.css`**
    *   *Role*: Global styles.
    *   *Issue*: Missing CSS variable `--color-bg-app` caused the initial transparency bug.
3.  **`app/src/layouts/MainLayout.tsx`**
    *   *Role*: App shell.
    *   *Constraint*: Defines the `p-6` padding on the main scroll view which conflicted with `position: sticky`.

---

## Chronology of Failure (The 12 Attempts)

### Phase 1: The Styling & Precision Failures
*   **Attempt 1: Initial Implementation**
    *   **Code**: `bg-[var(--color-bg-app)]`
    *   **Result**: **FAILURE**. Header was transparent.
    *   **Cause**: `var(--color-bg-app)` was undefined in `index.css`.
*   **Attempt 2: High Contrast Fix**
    *   **Code**: Standard button styles.
    *   **Result**: **FAILURE**. Back button invisible against dark background.
    *   **Fix**: Hardcoded `bg-neutral-800` / `text-white`.

### Phase 2: The Geometry Loop ("The Gaps")
*   **Attempt 3: Negative Top Margin**
    *   **Code**: `-mt-6` on header.
    *   **Result**: **FAILURE**. Header visually moved up but `sticky` positioning anchors to the parent's *content box*, creating a rigid offset gap of 24px because of `MainLayout`'s `p-6`.
*   **Attempt 4: Negative Side Margins**
    *   **Code**: `-mx-6` on header.
    *   **Result**: **FAILURE**. Header did not touch screen edges.
    *   **Cause**: The parent container had `max-w-6xl mx-auto`. The negative margin only expanded relative to *that* constrained 1152px width, not the full viewport.
*   **Attempt 5: The "Calc Hack"**
    *   **Code**: `w-[calc(100%+3rem)]`.
    *   **Result**: **FAILURE**. Visual misalignment and horizontal scrollbars.

### Phase 3: The Animation Conflict (Critical Stacking Bug)
*   **Attempt 6: The "Flush" Container**
    *   **Code**: Applied `-m-6` to the root container to negate padding universally.
    *   **Math**: Correct.
    *   **Result**: **CATASTROPHIC FAILURE**. The header scrolled away plain and simple. It would not stick.
    *   **Root Cause Analysis**:
        *   The Layout was wrapped in `<AnimatePresence>` -> `<motion.div>`.
        *   **Framer Motion** applies `transform: none` or specific transforms during animations.
        *   **CSS Spec**: `position: sticky` anchors to the *nearest scrolling ancestor*. HOWEVER, if an ancestor has a `transform` property, it creates a new **Containing Block**.
        *   The sticky header was "sticking" to the top of the `motion.div` (which was moving), not the Viewport.

*   **Attempt 7 - 9: The "Z-Index" Wars**
    *   **Code**: `z-50`, `top-0`, `!important`.
    *   **Result**: **FAILURE**. CSS Properties cannot override Stacking Context physics.

### Phase 4: The Refactor Loop (Syntax Hell)
*   **Attempt 10: Simplification Layout**
    *   **Action**: Tried to move the header out.
    *   **Result**: **FAILURE**. Introduced duplicate props in JSX. Build Crash.
*   **Attempt 11: Syntax Cleanup**
    *   **Action**: Deleted duplicates.
    *   **Result**: **FAILURE**. Accidentally deleted closing `</div>` tag. Build Crash.
*   **Attempt 12: Requesting User Patience**
    *   **Action**: Asking to "Simplify".
    *   **Result**: **REJECTED**. User demanded animations remain.

---

## Final Resolution Architecture (The Fix)

**Strategy**: **Negative Sticky Offset**.
We kept the decoupled architecture but fixed the "stuck" anchor point.

1.  **Page Root**: Remains at `-m-6` to pull the page content into the layout padding zone.
2.  **Header Styling**: Changed from `sticky top-0` to **`sticky -top-6`** (`top: -1.5rem`).
3.  **Result**: The header now "sticks" 24px above its parent's content-box boundary, making it perfectly flush with the viewport top/search bar.

**Final Code (AIAssistance.tsx):**
```tsx
<div className="min-h-full -m-6 flex flex-col">
  <div className="sticky -top-6 z-40 bg-[var(--color-bg-primary)] ...">
    {/* Header is now flush! */}
  </div>
  ...
</div>
```

