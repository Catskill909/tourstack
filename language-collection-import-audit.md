# Language + Collection Import Audit

## Problem Statement

When a TTS audio collection is generated with languages `[en, es, fr, de]` and then imported into a block that belongs to a tour with languages `[en, es]`, the extra languages (`fr`, `de`) are **silently merged into the block data** but:

1. The tour's language list is NOT updated to include the new languages
2. The block editor UI only shows the tour's languages — extra languages are invisible
3. The visitor/preview interface only offers the tour's languages — extra audio is unreachable
4. The JSON feed exports ALL languages (including extras the tour doesn't declare)

The reverse is also true: if a tour has `[en, es, fr]` but the imported collection only has `[en]`, the user gets no warning that `es` and `fr` audio slots are empty.

---

## Architecture Overview

### Language Hierarchy (Source of Truth)

```
AppSettings.supportedLanguages   (museum-wide defaults)
      ↓
Tour.languages[]                 (per-tour language list — THE authority)
Tour.primaryLanguage             (default editing language)
      ↓
StopEditor                       (receives availableLanguages = tour.languages)
      ↓
Block Editors                    (receive availableLanguages, render LanguageSwitcher)
      ↓
Block Data                       (stores content as { [lang: string]: value })
```

### Key: Tour.languages is the authority, but nothing enforces it downward.

---

## The Import Flow (Where It Breaks)

### Step-by-step: TTS Collection → Block Import

1. **User generates a TTS collection** via `AudioCollectionModal`
   - Selects languages: `[en, es, fr, de]`
   - System translates text, generates audio per language
   - Collection saved with:
     - `items[].language` per audio file
     - `texts: { en, es, fr, de }` (all translations)
     - `sourceLanguage: 'en'`

2. **User opens a stop in a tour** with `tour.languages = ['en', 'es']`
   - `StopEditor` receives `availableLanguages = ['en', 'es']`
   - `AudioBlockEditor` receives same `availableLanguages`

3. **User clicks "Import from Collection"** in AudioBlockEditor
   - Opens `CollectionPickerModal` with `mode='multi'`
   - Modal shows the collection with all 4 languages
   - User clicks Import

4. **CollectionPickerModal.handleImport()** — [CollectionPickerModal.tsx:123-154](app/src/components/CollectionPickerModal.tsx#L123-L154)
   ```ts
   // Builds importData with ALL collection languages
   audioItems.forEach(item => {
       audioFiles[item.language] = item.url;    // en, es, fr, de
       transcript[item.language] = item.text;   // en, es, fr, de
   });
   onImport({ audioFiles, transcript, voiceInfo });
   ```
   **No filtering against tour languages happens here.**

5. **AudioBlockEditor.handleImportFromCollection()** — [AudioBlockEditor.tsx:103-109](app/src/components/blocks/AudioBlockEditor.tsx#L103-L109)
   ```ts
   onChange({
       ...data,
       audioFiles: { ...data.audioFiles, ...importData.audioFiles },   // blind merge
       transcript: { ...data.transcript, ...importData.transcript },   // blind merge
   });
   ```
   **No filtering against availableLanguages happens here.**

6. **Block data now contains 4 languages, tour only declares 2.**
   - Editor UI shows LanguageSwitcher with only `[en, es]` (from `availableLanguages`)
   - `fr` and `de` audio files are stored but invisible
   - Saved to DB as-is via `JSON.stringify(contentBlocks)`

### Result: Orphaned Language Data

| Layer | What it shows | Languages |
|-------|--------------|-----------|
| Database (block data) | All imported audio | en, es, fr, de |
| Block Editor UI | Only tour languages | en, es |
| Visitor Preview | Only tour languages | en, es |
| JSON Feed Export | All block data unfiltered | en, es, fr, de |

---

## All the Places Language Validation is Missing

### 1. CollectionPickerModal (import trigger)
- **File:** [CollectionPickerModal.tsx:130-139](app/src/components/CollectionPickerModal.tsx#L130-L139)
- **Issue:** `mode='multi'` imports ALL collection languages blindly
- **Missing:** No awareness of `tour.languages` at all — it doesn't receive this prop

### 2. AudioBlockEditor (import receiver)
- **File:** [AudioBlockEditor.tsx:103-109](app/src/components/blocks/AudioBlockEditor.tsx#L103-L109)
- **Issue:** Merges imported data without checking `availableLanguages`
- **Missing:** No filtering, no warning, no prompt to update tour languages

### 3. StopEditor (save path)
- **File:** [StopEditor.tsx](app/src/components/StopEditor.tsx) — save handler
- **Issue:** Saves contentBlocks as-is, no language validation
- **Missing:** No check that block languages match tour languages

### 4. Server stops route (persistence)
- **File:** [stops.ts:178-180](app/server/routes/stops.ts#L178-L180)
- **Issue:** `JSON.stringify(data.contentBlocks)` with no validation
- **Missing:** No server-side language validation

### 5. JSON Feed export
- **File:** [feeds.ts:283-355](app/server/routes/feeds.ts#L283-L355)
- **Issue:** `cleanContentBlocks()` only strips base64, not extra languages
- **Missing:** No filtering of block languages against `tour.languages`

### 6. Visitor route
- **File:** [visitor.ts](app/server/routes/visitor.ts)
- **Issue:** Returns full block data with all languages
- **Missing:** No filtering to tour.languages before sending to client

---

## Proposed Solution: Language Reconciliation on Import

The smartest fix is to **reconcile languages at the moment of import** rather than trying to filter everywhere downstream. This gives the user control and keeps the data clean.

### Strategy: "Reconcile & Prompt" Pattern

When importing a collection into a block, compare collection languages against tour languages and present the user with a choice:

```
Collection has languages: en, es, fr, de
Tour currently supports:  en, es

Options:
  [x] Add fr, de to tour languages    ← Expand tour to match collection
  [ ] Only import en, es              ← Filter collection to match tour
```

### Implementation Plan

#### A. Pass `tourLanguages` to CollectionPickerModal

**File:** [AudioBlockEditor.tsx](app/src/components/blocks/AudioBlockEditor.tsx)

The AudioBlockEditor already receives `availableLanguages`. Pass it through to the CollectionPickerModal:

```tsx
<CollectionPickerModal
    isOpen={showCollectionPicker}
    onClose={() => setShowCollectionPicker(false)}
    onImport={handleImportFromCollection}
    mode="multi"
    tourLanguages={availableLanguages}     // NEW PROP
/>
```

#### B. Add language reconciliation UI in CollectionPickerModal

**File:** [CollectionPickerModal.tsx](app/src/components/CollectionPickerModal.tsx)

Before importing, show a language mismatch warning when the collection has languages not in the tour:

```tsx
// New prop
tourLanguages?: string[];

// Compute mismatch
const collectionLanguages = [...new Set(audioItems.map(i => i.language))];
const extraLanguages = collectionLanguages.filter(l => !tourLanguages?.includes(l));
const missingLanguages = tourLanguages?.filter(l => !collectionLanguages.includes(l));

// If mismatch exists, show reconciliation UI before import
```

The modal should show:
- **Extra languages in collection** (not in tour): offer to add them to tour or skip them
- **Missing languages** (in tour but not in collection): warn that these will have empty audio slots

#### C. New callback: `onLanguagesChanged`

Add an optional callback prop to propagate language additions up to the tour level:

```tsx
interface CollectionPickerModalProps {
    // ... existing props
    tourLanguages?: string[];
    onLanguagesChanged?: (newLanguages: string[]) => void;  // NEW
}
```

When the user chooses to add extra languages, fire this callback. The parent (StopEditor → TourDetail) updates the tour's language list via the API.

#### D. Filter imported data to final language set

In `handleImport()`, only include languages that were approved:

```tsx
function handleImport() {
    const approvedLanguages = [...tourLanguages, ...userApprovedExtras];

    audioItems
        .filter(item => approvedLanguages.includes(item.language))
        .forEach(item => {
            audioFiles[item.language] = item.url;
            transcript[item.language] = item.text;
        });

    onImport({ audioFiles, transcript, voiceInfo });

    if (userApprovedExtras.length > 0) {
        onLanguagesChanged?.(approvedLanguages);
    }
}
```

---

## Secondary Fixes (Defense in Depth)

These are lower priority but would make the system more robust:

### 1. Feed language filtering
**File:** [feeds.ts](app/server/routes/feeds.ts)

When exporting block content, filter language keys to `tour.languages`:

```ts
function filterBlockLanguages(block: ContentBlock, tourLanguages: string[]) {
    // For each multilingual field, only include tour languages
    if (block.data.audioFiles) {
        block.data.audioFiles = pick(block.data.audioFiles, tourLanguages);
    }
    // same for transcript, content, title, caption, etc.
}
```

### 2. Block editor initialization
**File:** [StopEditor.tsx](app/src/components/StopEditor.tsx)

When creating a new block, initialize all tour languages (not just `en`):

```ts
case 'text': return {
    content: Object.fromEntries(availableLanguages.map(l => [l, ''])),
    // instead of: content: { en: '' }
};
```

### 3. Language audit indicator
Add a visual indicator in the StopEditor showing language completeness per block — which blocks have content for which languages. This gives editors visibility into gaps.

---

## Files That Need Changes (Priority Order)

| Priority | File | Change |
|----------|------|--------|
| P0 | [CollectionPickerModal.tsx](app/src/components/CollectionPickerModal.tsx) | Add `tourLanguages` prop, reconciliation UI, language filtering |
| P0 | [AudioBlockEditor.tsx](app/src/components/blocks/AudioBlockEditor.tsx) | Pass `availableLanguages` to CollectionPickerModal |
| P0 | [StopEditor.tsx](app/src/components/StopEditor.tsx) | Wire up `onLanguagesChanged` callback to update tour |
| P0 | [TourDetail.tsx](app/src/pages/TourDetail.tsx) | Handle `onLanguagesChanged` — update tour languages via API |
| P1 | [feeds.ts](app/server/routes/feeds.ts) | Filter block language keys to tour.languages in export |
| P2 | [StopEditor.tsx](app/src/components/StopEditor.tsx) | Initialize new blocks with all tour languages |
| P2 | [stops.ts](app/server/routes/stops.ts) | Optional server-side language validation on save |

---

## Summary

The root cause is simple: **collection import is language-unaware**. The `CollectionPickerModal` doesn't know what languages the tour supports, and the `AudioBlockEditor` doesn't filter what it receives. Languages flow in but never get reconciled with the tour's declared language list.

The fix is a **reconciliation step at import time** that:
1. Detects the mismatch
2. Asks the user what to do (expand tour or filter import)
3. Updates both the block data AND the tour language list accordingly

This is better than filtering everywhere downstream because it keeps the data clean at the source and gives the user explicit control over their tour's language configuration.
