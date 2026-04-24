# Modal Performance: Fast-Open Modals That Need Async Data

**Problem**: Some modals require a network fetch before they can fully render (e.g. the Tours list `Run Tour` / `Preview` modal needs the full stop list). If the click handler `await`s that fetch before calling `setShow(true)`, the modal can take several seconds to appear — users think the click didn't register.

**Anti-fix**: adding a spinner to the trigger button. That treats the symptom. The modal itself usually doesn't need the fetched data to render its chrome and choice UI — only the inner action buttons do.

---

## The Pattern

1. **Open synchronously.** Call `setShow(true)` and `setIsLoading(true)` in the click handler before touching the network.
2. **Fetch in parallel.** Kick off the fetch and update state when it resolves.
3. **Dedupe with a `useRef<Promise | null>`.** Hover-prefetch and click reuse the same in-flight promise. Clear the ref on error so retries work.
4. **Prefetch on hover/focus.** `onMouseEnter`, `onMouseDown`, and `onFocus` all call the prefetch. Typically gives a 100-300ms head start — often the data is already in hand by the time click fires.
5. **Visual feedback inside the modal.** Disable the inner action buttons while loading and swap their icons for `<Loader2 className="animate-spin" />`.
6. **Invalidate on close.** Clear the promise ref when the modal closes so the next open fetches fresh data (in case the underlying record was edited).
7. **Preserve error handling.** On fetch failure, close the modal and alert. On empty-result, close the modal and alert.

---

## Canonical Implementation

- Trigger + fetch orchestration: [app/src/components/TourCard.tsx](../app/src/components/TourCard.tsx)
- Modal with `isLoading` prop: [app/src/components/PreviewChoiceModal.tsx](../app/src/components/PreviewChoiceModal.tsx)

### Trigger side (sketch)

```tsx
const stopsPromiseRef = useRef<Promise<Stop[]> | null>(null);
const [isLoadingStops, setIsLoadingStops] = useState(false);

function fetchStopsOnce(): Promise<Stop[]> {
    if (!stopsPromiseRef.current) {
        stopsPromiseRef.current = fetch(`/api/stops/${tour.id}`)
            .then(r => {
                if (!r.ok) throw new Error('Failed to fetch stops');
                return r.json() as Promise<Stop[]>;
            })
            .catch(err => {
                stopsPromiseRef.current = null; // allow retry
                throw err;
            });
    }
    return stopsPromiseRef.current;
}

function handlePrefetchStops() {
    fetchStopsOnce().catch(() => { /* silent — real error surfaces on click */ });
}

function handlePreview(e: React.MouseEvent) {
    e.stopPropagation();
    setShowPreviewChoice(true);   // open immediately
    setIsLoadingStops(true);

    fetchStopsOnce()
        .then(stops => { /* update state, or alert + close on empty */ })
        .catch(() => { /* close + alert */ });
}

function handleClosePreview() {
    setShowPreviewChoice(false);
    stopsPromiseRef.current = null;  // invalidate for next open
}
```

Wire the prefetch to the trigger:

```tsx
<button
    onClick={handlePreview}
    onMouseEnter={handlePrefetchStops}
    onMouseDown={handlePrefetchStops}
    onFocus={handlePrefetchStops}
>
```

### Modal side (sketch)

Accept an optional `isLoading?: boolean` prop, default it to `false`, and swap icons + disable the action buttons while true:

```tsx
{isLoading ? (
    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
) : (
    <Smartphone className="w-6 h-6 text-blue-400" />
)}
```

Defaulting `isLoading` to `false` means existing callers don't need changes.

---

## When to Use

Apply this any time a modal trigger currently looks like:

```tsx
async function handleOpen() {
    const data = await fetch(...);   // ← blocking
    setData(data);
    setShow(true);
}
```

If the modal's chrome/choice UI can render without the fetched data (it usually can), flip the order.

## When Not to Use

If the trigger opens a modal that is 100% derived from the fetch result (e.g. a read-only detail view where there's nothing to show until data arrives), a loading state in the modal body is fine — but still consider hover-prefetch.
