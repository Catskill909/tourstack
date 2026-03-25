# JSON Feed Audit — 2026-03-25

## Overview

TourStack has **four** endpoints that serve tour/stop data as JSON:

| Endpoint | Auth | Purpose |
|---|---|---|
| `GET /api/tours` , `/api/tours/:id` | Admin | Internal API — full parsed data for CMS |
| `GET /api/stops/:tourId` , `/api/stops/:id` | Admin | Internal API — stop CRUD |
| `GET /api/visitor/tour/:slug/stop/:slug` | Public | Visitor-facing — full parsed data |
| `GET /api/feeds/tours` , `/feeds/tours/:id` , `/feeds/tours/:id/stops` | Admin | External JSON feed — language/format filtering |
| `GET /api/export/:tourId` | Admin | ZIP download with `data/tour.json` + media files |

The **feeds** endpoint (`/api/feeds/`) is the only one designed for external consumption. The internal/visitor APIs just JSON.parse every field and return it raw. This audit focuses primarily on the feeds, but notes issues across all endpoints.

---

## 1. Tour-Level Fields — Feed vs Actual Data

### Present in feed
| Feed field | Source |
|---|---|
| `id` | `tour.id` |
| `title` | Localized, language-filtered |
| `description` | Localized, language-filtered |
| `hero_image` | Base64 stripped, URL formatted |
| `status` | `tour.status` |
| `languages` | Parsed array |
| `estimated_duration` | `tour.duration \|\| tour.estimatedDuration` |
| `difficulty` | `tour.difficulty` |
| `created_at` / `updated_at` | ISO timestamps |
| `stops` / `stop_count` | Included in full format |

### MISSING from feed (exist in DB/internal API)
| Field | Notes | Severity |
|---|---|---|
| **`slug`** | Needed for constructing visitor URLs | **HIGH** |
| **`primaryLanguage`** | Consumers need to know which language is authoritative | **HIGH** |
| `primaryPositioningMethod` | QR, GPS, NFC, etc. — useful for consumer apps | MEDIUM |
| `backupPositioningMethod` | Secondary positioning | LOW |
| `accessibility` | Wheelchair, audio descriptions, sign language, etc. | MEDIUM |
| `publishedAt` | When tour went live | MEDIUM |
| `scheduledPublishAt` | Future publish date | LOW |
| `version` | Schema/data version | LOW |
| `conciergeEnabled` | Whether AI chatbot is active | MEDIUM |
| `conciergePersona` | Chatbot personality setting | LOW |
| `conciergeWelcome` | Localized welcome message | LOW |
| `conciergeQuickActions` | Suggested questions | LOW |
| `conciergeChatIcon/Color/BgColor` | Chat button styling | LOW |
| `museumId` / `templateId` | Internal references | LOW |

---

## 2. Stop-Level Fields — Feed vs Actual Data

### Present in feed
| Feed field | Source |
|---|---|
| `id` | `stop.id` |
| `title` | Localized, language-filtered |
| `description` | Localized, language-filtered |
| `hero_image` | Object format with `url`, `caption`, `credit` |
| `order` | Sort position |
| `content_blocks` | Raw parsed blocks (base64 cleaned, language filtered) |
| `positioning` | Legacy positioning field |
| `primary_positioning` | QR code URL, shortCode, NFC data |
| `created_at` / `updated_at` | ISO timestamps |

### MISSING from feed
| Field | Notes | Severity |
|---|---|---|
| **`slug`** | Needed for constructing visitor URLs | **HIGH** |
| **`shortCode`** | Direct QR lookup code (exists in primaryPositioning but not top-level) | **HIGH** |
| **`type`** | `mandatory` / `optional` / `bonus` / `secret` — critical for consumer apps | **HIGH** |
| **`showTitle`** | Display toggle — visitor apps need this | **HIGH** |
| **`showImage`** | Display toggle | **HIGH** |
| **`showDescription`** | Display toggle | **HIGH** |
| `links` | Associated links | MEDIUM |
| `interactive` | Interactive/gamification data | MEDIUM |
| `triggers` | Entry/exit triggers | LOW |
| `customFieldValues` | Template custom fields | LOW |
| `backupPositioning` | Secondary positioning | LOW |
| `accessibility` | Stop-level accessibility info | MEDIUM |

---

## 3. Content Block Types — Feed Awareness

The feed passes content blocks through as raw JSON after two transformations:
1. **Base64 image stripping** (`cleanContentBlocks`) — strips `data:` URIs from `image`, `src`, `url`, and `images[]` fields
2. **Language key filtering** (`filterBlockLanguages`) — filters top-level `data.*` fields to tour languages

### All 17 block types defined in code:

| Block Type | In Type System | Feed-Aware? | Notes |
|---|---|---|---|
| `text` | `TextBlockData` | Partial | `content` filtered; `title` filtered |
| `image` | `ImageBlockData` | Partial | `url` base64-cleaned; `caption`/`credit` filtered; **`altText` NOT filtered** |
| `gallery` | `GalleryBlockData` | Partial | `images[]` base64-cleaned; **nested `caption`/`credit` per image NOT filtered** |
| `timelineGallery` | `TimelineGalleryBlockData` | Partial | **`audioUrl` not resolved per-language** (see Audio section); nested image captions NOT filtered |
| `audio` | `AudioBlockData` | Partial | `audioFiles` language-filtered; `title`/`transcript` filtered; **but see Audio section** |
| `video` | `VideoBlockData` | Partial | `title`/`description` filtered; **`subtitles` NOT filtered** |
| `quote` | `QuoteBlockData` | **NO** | **`quote`, `author`, `source` NOT in filter list** |
| `timeline` | `TimelineBlockData` | **NO** | **Nested `events[].title`, `events[].description` NOT filtered** |
| `comparison` | `ComparisonBlockData` | **NO** | **`beforeImage.label`, `afterImage.label` NOT filtered** |
| `positioning` | `PositioningBlockData` | Partial | `instructions` NOT in filter list |
| `map` | `MapBlockData` | **NO** | **`markerTitle` NOT filtered; nested `markers[].title/description/infoText` NOT filtered** |
| `imageMap` | `ImageMapBlockData` | **NO** | **`imageAlt`, nested `markers[].label/infoText`, `floors[].label/imageAlt` NOT filtered** |
| `tour` | `TourBlockData` | **NO** | **`titleOverride`, `descriptionOverride`, `badge`, `ctaText` NOT filtered** |
| `stopList` | `StopListBlockData` | **NO** | **`heading`, `subheading`, `ctaText` NOT filtered** |
| `qrScanner` | `QRScannerBlockData` | **NO** | **`promptText`, `successMessage`, `wrongCodeMessage` NOT filtered** |
| `html` | `HtmlBlockData` | **NO** | **`htmlContent`, `caption`, `source` NOT filtered** |
| `accordion` | `AccordionBlockData` | **NO** | **Nested `items[].heading`, `items[].content`, `collapseLabel`, `title` NOT filtered** |

### Language filter coverage summary

`filterBlockLanguages` only handles these top-level `data.*` keys:
```
content, title, caption, credit, transcript, audioFiles, text, description, question
```

**Missing from filter** (all are multilingual `{ [lang: string]: string }` objects):
- `quote`, `author`, `source` (QuoteBlockData)
- `altText` (ImageBlockData)
- `subtitles` (VideoBlockData)
- `instructions` (PositioningBlockData)
- `markerTitle` (MapBlockData)
- `htmlContent` (HtmlBlockData)
- `badge`, `ctaText`, `titleOverride`, `descriptionOverride` (TourBlockData)
- `heading`, `subheading`, `ctaText` (StopListBlockData)
- `promptText`, `successMessage`, `wrongCodeMessage` (QRScannerBlockData)
- `collapseLabel` (AccordionBlockData)

**Nested arrays completely unhandled** (language maps inside arrays):
- `gallery.images[].caption/credit`
- `timelineGallery.images[].caption/credit`
- `timeline.events[].title/description`
- `map.markers[].title/description/infoText`
- `imageMap.markers[].label/infoText`
- `imageMap.floors[].label/imageAlt`
- `accordion.items[].heading/content`
- `comparison.beforeImage.label / afterImage.label`

---

## 4. Audio URL Handling — Critical Issues

### AudioBlockData
- `audioFiles: { [lang: string]: string }` — per-language audio URLs
- The feed's `filterBlockLanguages` correctly filters `audioFiles` to tour languages
- But when `?lang=es` is passed, the feed returns `{ es: "/uploads/audio/xyz.mp3" }` — the URL is a **relative server path**, not a full URL
- `formatImageUrl()` exists for images but **no equivalent `formatAudioUrl()` exists**
- Audio URLs are never resolved to absolute URLs in the feed

### TimelineGalleryBlockData
- Has BOTH `audioUrl: string` (single active language URL) AND `audioFiles: { [lang: string]: string }`
- The feed filters `audioFiles` by language, which is good
- But `audioUrl` (a plain string, not a language map) is **passed through unfiltered** — it contains whatever language was last active in the editor
- **Consumer apps have no way to know which language `audioUrl` corresponds to**
- This is the most confusing audio issue — the feed should either:
  - Resolve `audioUrl` from `audioFiles[requestedLang]`, OR
  - Always return `audioFiles` and let consumers pick

### No audio URL resolution
- All audio URLs in the feed are relative paths like `/uploads/audio/abc123.mp3`
- The feed's `formatImageUrl` helper handles image URL normalization but **audio URLs get no equivalent treatment**
- Consumer apps receiving the feed have no base URL to resolve these against

---

## 5. Image URL Handling

- `formatImageUrl()` correctly strips base64, passes through full URLs, and can prepend a base URL
- But **the base URL is never actually passed** — `formatImageUrl(tour.heroImage)` is called without a `baseUrl` argument
- So relative paths like `/uploads/images/abc.jpg` are returned as-is
- Same issue as audio: consumer apps need absolute URLs or a documented base URL

---

## 6. Export ZIP (`/api/export/:tourId`)

The export endpoint creates a ZIP with `data/tour.json` + `media/` folder. It:
- Rewrites `/uploads/...` paths to `./media/...` (good)
- Includes a `manifest.json` with metadata (good)
- Scans all tour and stop fields recursively for media URLs (good)

**Issues:**
- Uses the internal `parseTour`/`parseStop` format, not the feed format — field names differ (camelCase vs snake_case)
- No language filtering — exports everything (probably intentional, but should be documented)
- No content block type validation

---

## 7. Visitor API vs Feed API Inconsistencies

| Aspect | Visitor API (`/api/visitor/`) | Feed API (`/api/feeds/`) |
|---|---|---|
| Field naming | camelCase (`contentBlocks`, `primaryPositioning`) | snake_case (`content_blocks`, `primary_positioning`) |
| Language filtering | None — returns all languages | Supports `?lang=` param |
| Base64 handling | Returns base64 images as-is | Strips base64 images |
| Stop display flags | Returns `showTitle`, `showImage`, `showDescription` | Does NOT include these |
| Stop `type` | Returns `type` field | Does NOT include `type` |
| Stop `slug` | Returns `slug` | Does NOT include `slug` |
| Image format | Raw parsed (string or object) | Normalized to `{ url, caption?, credit? }` |
| Concierge data | Returns concierge fields | Does NOT include concierge data |

---

## 8. Recommendations (Priority Order)

### P0 — Must Fix
1. **Add `slug` to tour and stop feed output** — without this, consumers can't construct visitor URLs
2. **Add `type` to stop feed output** — consumers need to know mandatory/optional/bonus/secret
3. **Add `showTitle`/`showImage`/`showDescription` to stop feed output** — display flags are essential
4. **Add `primaryLanguage` to tour feed output** — consumers need the authoritative language
5. **Fix audio URL handling** — either resolve to absolute URLs or document the base URL convention
6. **Resolve `audioUrl` vs `audioFiles` in TimelineGallery** — pick one strategy

### P1 — Should Fix
7. **Expand `filterBlockLanguages` field list** to cover all multilingual fields (`quote`, `author`, `source`, `altText`, `subtitles`, `instructions`, `markerTitle`, `htmlContent`, `badge`, `ctaText`, etc.)
8. **Add recursive language filtering for nested arrays** (gallery images, accordion items, map markers, timeline events, etc.)
9. **Add `shortCode` as top-level stop field** in feed
10. **Resolve image URLs to absolute** — pass base URL to `formatImageUrl`
11. **Add `accessibility` to tour and stop feed output**

### P2 — Nice to Have
12. Add concierge-related fields to feed (at least `conciergeEnabled`)
13. Add `links` to stop feed output
14. Add `interactive` data to stop feed output
15. Standardize field naming between visitor API and feed API
16. Add feed version bumping when schema changes
17. Add block type validation/documentation to feed output

---

## 9. Block Type Coverage Matrix

Quick reference: which block types were added AFTER the feed was written, and thus have zero feed-specific handling:

| Block Type | Approximate Phase | Feed Has Specific Handling? |
|---|---|---|
| `text` | Original | Partial (language filter) |
| `image` | Original | Partial (base64 clean + language filter) |
| `gallery` | Original | Partial (base64 clean for images array) |
| `audio` | Original | Partial (language filter on audioFiles) |
| `video` | Original | Partial (language filter on title/desc) |
| `quote` | Early | **None** |
| `timeline` | Early | **None** |
| `comparison` | Phase ~20 | **None** |
| `positioning` | Phase ~20 | **None** |
| `map` | Phase ~22 | **None** |
| `imageMap` | Phase ~24 | **None** |
| `tour` | Phase ~25 | **None** |
| `stopList` | Phase ~26 | **None** |
| `qrScanner` | Phase ~28 | **None** |
| `html` | Phase ~30 | **None** |
| `timelineGallery` | Phase ~31 | **None** (uses generic gallery base64 clean) |
| `accordion` | Phase ~33 | **None** |

**Bottom line:** The feed was written early and has not been updated as new block types were added. 11 of 17 block types have zero feed-specific handling. Language filtering and audio URL resolution are the biggest gaps.
