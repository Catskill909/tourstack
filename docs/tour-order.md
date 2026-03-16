# Tour Stop Ordering — Audit & Clean Path Forward

**Date:** 2026-03-16
**Status:** Audit complete, fixes proposed

---

## How Ordering Works Today

- **Single source of truth:** `Stop.order` (integer field in `schema.prisma`)
- **New stops:** auto-assigned `MAX(order) + 1` (appended to end)
- **Drag-drop:** calls `PUT /api/stops/reorder/:tourId` with `{ stopIds: [...] }` → sets `order = index` for each stop
- **All backend queries** return stops with `orderBy: { order: 'asc' }`

**Separate concept:** Stop-list blocks (the content block that shows a curated list of stops) use their own `data.stopIds[]` array for ordering. This is intentional — block-level ordering is independent of tour stop ordering.

---

## Audit Results

### Backend Endpoints — All Correctly Sorted

| Endpoint | File | Sorts? |
|----------|------|--------|
| `GET /api/stops/:tourId` | `server/routes/stops.ts:90` | `orderBy: {order: 'asc'}` ✓ |
| `POST /api/stops` | `server/routes/stops.ts:105` | Auto-assigns `max + 1` ✓ |
| `PUT /api/stops/reorder/:tourId` | `server/routes/stops.ts:243` | Batch-sets `order = index` ✓ |
| `GET /api/tours` | `server/routes/tours.ts:74` | `orderBy: {order: 'asc'}` ✓ |
| `GET /api/tours/:id` | `server/routes/tours.ts:89` | `orderBy: {order: 'asc'}` ✓ |
| `POST /api/tours/:id/duplicate` | `server/routes/tours.ts:259` | Preserves `stop.order` ✓ |
| `GET /api/visitor/tour/:id` | `server/routes/visitor.ts:48` | `orderBy: {order: 'asc'}` ✓ |
| `GET /api/visitor/tour/:id/stop/:id` | `server/routes/visitor.ts:79` | `orderBy: {order: 'asc'}` ✓ |
| `GET /api/visitor/.../info` | `server/routes/visitor.ts:143` | `orderBy: {order: 'asc'}` ✓ |
| `GET /api/visitor/.../gps-stops` | `server/routes/visitor.ts:186` | `orderBy: {order: 'asc'}` ✓ |

### Frontend — Issues Found

| Component | File | Status | Issue |
|-----------|------|--------|-------|
| TourDetail (editor) | `src/pages/TourDetail.tsx` | ⚠️ | Displays stops in array order from API — works because API sorts, but no defensive sort |
| TourDetail drag-drop | `src/pages/TourDetail.tsx:285-307` | ✓ | Correctly reorders + persists via API |
| KioskLauncherModal | `src/components/KioskLauncherModal.tsx:43` | ✓ | Explicitly sorts: `.sort((a,b) => a.order - b.order)` |
| **VisitorStop** | **`src/pages/VisitorStop.tsx:213,227`** | **BUG** | **Uses `allStops[0]` and array indices for prev/next without sorting** |
| StopListBlockPreview | `src/components/blocks/StopListBlockPreview.tsx` | ✓ | Uses own `data.stopIds[]` order (correct) |
| StopListBlockEditor | `src/components/blocks/StopListBlockEditor.tsx` | ✓ | Block-level ordering only (correct) |

---

## Issues to Fix (Priority Order)

### 1. VisitorStop.tsx — No defensive sort (MEDIUM priority)

**Problem:** `VisitorStop.tsx` uses `allStops[0]` for "restart tour" and array indices for prev/next navigation. It relies entirely on the backend returning stops sorted — if that contract ever breaks, visitors get wrong navigation.

**Location:** `src/pages/VisitorStop.tsx` lines 213, 227-229

**Current code:**
```typescript
// Line 213 — restart tour
const firstStop = allStops[0];

// Lines 227-229 — prev/next navigation
const stopIndex = allStops.findIndex((s) => s.id === stop?.id) ?? -1;
const prevStop = stopIndex > 0 ? allStops[stopIndex - 1] : null;
const nextStop = stopIndex >= 0 && stopIndex < allStops.length - 1 ? allStops[stopIndex + 1] : null;
```

**Fix:** Sort `allStops` before using it:
```typescript
const sortedStops = useMemo(
    () => [...allStops].sort((a, b) => a.order - b.order),
    [allStops]
);
// Then use sortedStops everywhere instead of allStops
```

### 2. TourDetail.tsx — No defensive sort on fetch (LOW priority)

**Problem:** After fetching stops, they're stored in state in whatever order the API returns them. Works today but fragile.

**Fix:** Sort after fetch:
```typescript
setStops(fetchedStops.sort((a, b) => a.order - b.order));
```

### 3. Delete endpoint leaves order gaps (LOW priority)

**Problem:** `DELETE /api/stops/:id` (`server/routes/stops.ts:230`) removes the stop but doesn't reindex remaining stops. After deleting stop with order=2 from [0,1,2,3], you get [0,1,3].

**Impact:** Functionally harmless — `ORDER BY order ASC` still works with gaps. But messy data.

**Fix (optional):** After deleting, reindex remaining stops:
```typescript
// After delete, compact order values
const remaining = await prisma.stop.findMany({
    where: { tourId: deletedStop.tourId },
    orderBy: { order: 'asc' },
});
await Promise.all(
    remaining.map((s, i) => prisma.stop.update({
        where: { id: s.id },
        data: { order: i },
    }))
);
```

---

## Clean Path Forward

### Principle: **Sort defensively on the frontend, authoritatively on the backend**

The backend already sorts correctly everywhere. The gap is that some frontend code trusts the array order without verifying. The fix is simple — add a `useMemo` sort in the two components that don't have one.

### Implementation Steps

1. **Fix VisitorStop.tsx** — Add `sortedStops` memo, replace `allStops` usage in navigation logic
2. **Fix TourDetail.tsx** — Sort stops after every fetch/set
3. **Optional: Fix delete cleanup** — Compact order values after stop deletion
4. **No schema changes needed** — `Stop.order` integer field is the correct design
5. **No new endpoints needed** — reorder API works correctly

### What's NOT broken

- Drag-drop reordering saves correctly
- All backend queries sort by `order` field
- New stop creation assigns correct order
- Tour duplication preserves order
- Stop-list blocks have their own independent ordering (by design)
- Kiosk mode already sorts defensively

### Estimated scope

- 2 files to edit (VisitorStop.tsx, TourDetail.tsx)
- ~10 lines of code total
- No database changes
- No API changes
