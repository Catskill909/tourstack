# HTML / Embed Block — Development Plan

**Status:** ✅ COMPLETE (March 25, 2026)
**Block Type:** `html`
**Priority:** High — fills the gap for 3D models, virtual tours, donation widgets, and any third-party embed

---

## Overview

A general-purpose HTML/embed block that lets curators paste iframe embed codes, raw HTML snippets, or URLs from supported providers. Supports sandboxed previews, responsive sizing, and multilingual captions.

**Use Cases:**
- Sketchfab 3D model viewers (photogrammetry scans of artifacts)
- Matterport virtual walkthroughs
- Google Arts & Culture embeds
- YouTube playlists / Spotify albums
- Donation & ticketing widgets (GoFundMe, Eventbrite)
- Interactive timelines (TimelineJS, Knight Lab)
- Social media embeds (Instagram posts, Twitter/X)
- Custom HTML for museum-specific microsites
- Google Forms / Typeform surveys
- Data visualizations (Tableau Public, Observable)

---

## Data Interface

```typescript
// app/src/types/index.ts

export interface HtmlBlockData {
  // Content modes (one active at a time)
  mode: 'embed' | 'url' | 'html';

  // Mode: 'embed' — paste full iframe/embed code
  embedCode: string;

  // Mode: 'url' — paste a URL, auto-detect provider
  url: string;
  provider?: HtmlEmbedProvider;

  // Mode: 'html' — raw HTML (admin-only, sanitized)
  htmlContent: { [lang: string]: string };

  // Display
  aspectRatio: '16:9' | '4:3' | '1:1' | '9:16' | '21:9' | 'auto';
  sizing: 'auto' | 'fill' | 'fixed';  // Fill Screen / Fixed Height / Auto
  height?: number;                    // Fixed height in px (only when sizing='fixed')
  maxWidth?: 'small' | 'medium' | 'large' | 'full'; // sm=400px, md=600px, lg=100%, full=edge-to-edge
  borderRadius?: boolean;             // Rounded corners (default false)

  // Interaction
  allowInteraction: boolean;           // Allow pointer events in preview (default true)
  lazyLoad: boolean;                   // Intersection observer loading (default true)

  // Block metadata (standard pattern)
  title?: { [lang: string]: string };
  showTitle?: boolean;
  blockImage?: StopImageData;
  showBlockImage?: boolean;
}

export type HtmlEmbedProvider =
  | 'sketchfab'
  | 'matterport'
  | 'youtube'
  | 'vimeo'
  | 'spotify'
  | 'soundcloud'
  | 'google-arts'
  | 'google-maps'
  | 'google-forms'
  | 'typeform'
  | 'tableau'
  | 'instagram'
  | 'twitter'
  | 'codepen'
  | 'observable'
  | 'custom';
```

---

## Provider Auto-Detection

When `mode: 'url'`, auto-detect the provider from the URL and generate the correct embed:

```typescript
// app/src/lib/embedProviders.ts

interface EmbedProviderConfig {
  name: string;
  icon: LucideIcon;
  urlPatterns: RegExp[];
  toEmbedUrl: (url: string) => string;
  defaultAspectRatio: string;
  defaultSandbox: string[];
  oEmbedEndpoint?: string; // For fetching rich metadata
}

const EMBED_PROVIDERS: Record<HtmlEmbedProvider, EmbedProviderConfig> = {
  sketchfab: {
    name: 'Sketchfab',
    icon: Box,
    urlPatterns: [/sketchfab\.com\/3d-models\/([\w-]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/sketchfab\.com\/3d-models\/([\w-]+)/);
      const id = match?.[1]?.split('-').pop();
      return `https://sketchfab.com/models/${id}/embed`;
    },
    defaultAspectRatio: '16:9',
    defaultSandbox: ['allow-scripts', 'allow-same-origin', 'allow-popups'],
  },
  matterport: {
    name: 'Matterport',
    icon: Globe,
    urlPatterns: [/my\.matterport\.com\/show\/\?m=([\w]+)/],
    toEmbedUrl: (url) => {
      const match = url.match(/m=([\w]+)/);
      return `https://my.matterport.com/show/?m=${match?.[1]}&play=1`;
    },
    defaultAspectRatio: '16:9',
    defaultSandbox: ['allow-scripts', 'allow-same-origin'],
  },
  youtube: {
    name: 'YouTube',
    icon: Play,
    urlPatterns: [
      /youtube\.com\/watch\?v=([\w-]+)/,
      /youtu\.be\/([\w-]+)/,
      /youtube\.com\/playlist\?list=([\w-]+)/,
    ],
    toEmbedUrl: (url) => {
      // Handle playlists
      const playlist = url.match(/list=([\w-]+)/);
      if (playlist) return `https://www.youtube.com/embed/videoseries?list=${playlist[1]}`;
      // Handle single videos
      const match = url.match(/(?:v=|youtu\.be\/)([\w-]+)/);
      return `https://www.youtube.com/embed/${match?.[1]}`;
    },
    defaultAspectRatio: '16:9',
    defaultSandbox: ['allow-scripts', 'allow-same-origin', 'allow-popups'],
  },
  // ... remaining providers follow same pattern
};

export function detectProvider(url: string): HtmlEmbedProvider {
  for (const [key, config] of Object.entries(EMBED_PROVIDERS)) {
    if (config.urlPatterns.some(p => p.test(url))) {
      return key as HtmlEmbedProvider;
    }
  }
  return 'custom';
}

export function generateEmbedUrl(url: string, provider: HtmlEmbedProvider): string {
  return EMBED_PROVIDERS[provider]?.toEmbedUrl(url) ?? url;
}
```

---

## Security Model

### HTML Sanitization (As Built)

DOMPurify with three sanitization tiers based on rendering context:

```typescript
// app/src/lib/htmlSanitizer.ts
sanitizeHtml(html, allowIframes = false, sandboxed = false)
```

| Mode | Tags Allowed | Rendering | Use Case |
|------|-------------|-----------|----------|
| **Default** | Standard HTML (div, p, h1-h6, lists, tables, etc.) + `<link>` + `<style>` | N/A | General sanitization |
| **allowIframes** | Default + `<iframe>` | Direct iframe | Embed code mode |
| **sandboxed** | Default + `<script>`, `<canvas>`, `<svg>`, form elements | `<iframe srcdoc>` | Raw HTML mode — JS runs safely in sandboxed iframe |

**Key design decision:** Raw HTML content renders via `<iframe srcdoc>` instead of `dangerouslySetInnerHTML`. This means:
- JavaScript works (scripts execute inside the sandboxed iframe)
- Google Fonts `<link>` tags load correctly
- CSS `<style>` blocks are scoped to the iframe
- Content is fully isolated from the parent app

### iframe Sandbox Defaults

All embeds run inside sandboxed iframes:

```
sandbox="allow-scripts allow-same-origin allow-popups"
```

---

## Editor Component

### File: `app/src/components/blocks/HtmlBlockEditor.tsx`

```
┌─────────────────────────────────────────────────────────────────────┐
│  HTML / Embed Block Editor                            [Save ▾] [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─── Mode ────────────────────────────────────────────────────┐    │
│  │  [  Embed Code  ] [  URL  ] [  Raw HTML  ]                 │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ── Embed Code Mode ──────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ <iframe src="https://sketchfab.com/models/abc/embed"       │    │
│  │   width="100%" height="400" frameborder="0"                │    │
│  │   allowfullscreen></iframe>                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ℹ️ Paste the embed code from Sketchfab, Matterport, etc.          │
│                                                                     │
│  ── URL Mode ─────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ https://sketchfab.com/3d-models/egyptian-bust-abc123       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ✅ Detected: Sketchfab 3D Model                                    │
│                                                                     │
│  ── Raw HTML Mode ────────────────────────────────────────────────  │
│  [ en ▪ ] [ es ○ ] [ fr ○ ]        [🌐 Translate All]             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ <div class="museum-widget">                                │    │
│  │   <h2>Opening Hours</h2>                                   │    │
│  │   <p>Mon-Fri: 10am - 5pm</p>                              │    │
│  │ </div>                                                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ℹ️ Supports HTML, CSS, Google Fonts, and JavaScript (sandboxed)     │
│                                                                     │
│  ── Display Settings ─────────────────────────────────────────────  │
│  Height: [ Fill Screen ] [ Fixed Height ] [ Auto ]                  │
│  (Fixed shows height slider, Auto shows aspect ratio pills)         │
│  Max Width:    [ Small ] [ Medium ] [ Large ] [ Full ]             │
│  □ Rounded corners   ☑ Lazy load   ☑ Allow interaction             │
│                                                                     │
│  ── Live Preview ─────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                                                             │    │
│  │           [ Embedded content preview here ]                │    │
│  │                                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Editor Features (As Built)

1. **Mode Tabs** — Three input modes with segmented button selector (Embed Code / URL / Raw HTML)
2. **Embed Code** — Textarea with monospace font, auto-extracts `src` from pasted iframes
3. **URL Mode** — Text input with auto-detection badge showing provider name (14 providers)
4. **Raw HTML** — Textarea with LanguageSwitcher + MagicTranslateButton (follows TextBlockEditor pattern). New blocks start pre-filled with a museum demo showcasing Google Fonts, styled typography, stat cards, and a JS tabbed widget
5. **Display Settings** — 3 sizing modes (Fill Screen / Fixed Height / Auto), conditional height slider (constrained width), aspect ratio pills (auto only), max-width pills, toggles
6. **Live Preview** — Sandboxed `<iframe srcdoc>` render below settings (toggleable) — JS executes in preview
7. **BlockMetadataEditor** — Standard block title + image (imported from shared component)
8. **Responsive Demo Content** — Default HTML uses `clamp()` font sizing to scale across iPhone/iPad/Kiosk

---

## Rendering (StopContentBlock.tsx) — As Built

### Three Sizing Modes

| Mode | Behavior | Height Source |
|------|----------|-------------|
| **Fill Screen** | Fills all available space below header | `effectiveHeight - 60` in simulator, `calc(100dvh - 60px)` in visitor view |
| **Fixed Height** | Explicit pixel height (200-800px slider) | `data.height` |
| **Auto** | Content or aspect ratio determines height | Aspect ratio class or natural content height |

### Fill Screen Pattern (follows Tour Block)

The "Fill Screen" sizing mode chains height through the full render stack:

```
VisitorStop.tsx    → height: calc(100dvh - 60px), minHeight: 400px
StopPreviewModal   → height: ${effectiveHeight - 60}px (device pixel height)
StopContentBlock   → wrapper: h-full, flex, minHeight: 100%
renderHtmlBlock    → containerClass: w-full h-full, flex: 1, minHeight: inherit
```

### Raw HTML Rendering (iframe srcdoc)

Raw HTML renders via `<iframe srcdoc>` instead of `dangerouslySetInnerHTML`:

```tsx
<iframe
  srcDoc={`<!DOCTYPE html><html><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>*{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;min-height:100%}
    body{font-family:system-ui;color:#e5e5e5;background:#111}</style>
  </head><body>${sanitizedHtml}</body></html>`}
  sandbox="allow-scripts allow-same-origin allow-popups"
/>
```

This enables JavaScript execution, Google Fonts loading, and CSS scoping — all safely sandboxed.

---

## Integration with Existing Features

### 1. Video Block Consolidation

The existing `VideoBlockData` handles YouTube/Vimeo embeds. The HTML block can subsume this for playlist embeds and other video providers, but the dedicated Video block should remain for its specific features (subtitles, autoplay, direct upload). No conflict — they serve different purposes.

### 2. Map Block Relationship

Google Maps embeds could technically go in the HTML block, but the dedicated Map block has marker editing, geofencing, and stop linking. The HTML block would only be used for Google Maps embeds that need features the Map block doesn't support (custom My Maps, Street View embeds).

### 3. AI Concierge Integration

The concierge chatbot could reference HTML block content when answering visitor questions about embedded 3D models or virtual tours. The `caption` and `source` fields provide context for the AI.

### 4. Kiosk Mode

In kiosk mode, `allowInteraction` should default to `true` so visitors can interact with 3D models and virtual tours. The `lazyLoad` flag should be `false` in kiosk mode for instant loading.

### 5. Translation (Full Integration with Existing System)

The HTML block's Raw HTML mode uses the **exact same translation pattern** as the existing Text block (`TextBlockEditor.tsx`). The `htmlContent` field is a `{ [lang: string]: string }` map — identical to `TextBlockData.content`.

**How it connects:**

```
htmlContent: { en: '<h2>Hours</h2><p>Mon-Fri 10-5</p>' }
                              ↓
              LanguageSwitcher (switch active editing language)
                              ↓
              MagicTranslateButton (translate en → es, fr, de...)
                              ↓
              translateText() → POST /api/translate
                              ↓
              translation.ts backend service (Google Cloud / LibreTranslate)
                              ↓
htmlContent: { en: '<h2>Hours</h2>...', es: '<h2>Horario</h2>...', fr: '<h2>Horaires</h2>...' }
```

**What gets translated per mode:**

| Mode | Translatable fields | How |
|------|-------------------|-----|
| **URL** | `caption`, `source` | LanguageSwitcher + MagicTranslateButton on each field |
| **Embed Code** | `caption`, `source` | Same as URL mode |
| **Raw HTML** | `htmlContent`, `caption`, `source` | Full content textarea is per-language, LanguageSwitcher switches which language's HTML you're editing, MagicTranslateButton translates the HTML text content (preserving tags) |

**Raw HTML translation detail:**

The translation service receives the full HTML string. HTML tags pass through translation APIs as-is (Google Cloud Translation and LibreTranslate both preserve HTML markup). The translated output keeps the same structure:

```
Input:  <h2>Opening Hours</h2><p>Monday to Friday, 10am to 5pm</p>
Output: <h2>Horario de apertura</h2><p>De lunes a viernes, de 10 a 17 horas</p>
```

This works because:
- Google Cloud Translation API v2 has a `format: 'html'` parameter that preserves tags
- LibreTranslate also preserves inline HTML

**Editor code pattern** (mirrors `TextBlockEditor.tsx`):

```tsx
// Inside HtmlBlockEditor — Raw HTML mode
const [activeLanguage, setActiveLanguage] = useState(language);

// Language switcher + translate button (same as TextBlockEditor)
<LanguageSwitcher
  availableLanguages={availableLanguages}
  activeLanguage={activeLanguage}
  onChange={setActiveLanguage}
  contentMap={data.htmlContent}
/>
<MagicTranslateButton
  sourceText={data.htmlContent[primaryLang] || ''}
  sourceLang={primaryLang}
  targetLangs={availableLanguages.filter(l => l !== primaryLang)}
  onTranslate={(translations) => {
    onChange({
      ...data,
      htmlContent: { ...data.htmlContent, ...translations },
    });
  }}
  provider={translationProvider}
  disabled={!data.htmlContent[primaryLang]?.trim()}
/>

// Textarea shows/edits the active language
<textarea
  value={data.htmlContent[activeLanguage] || ''}
  onChange={(e) => {
    onChange({
      ...data,
      htmlContent: {
        ...data.htmlContent,
        [activeLanguage]: e.target.value,
      },
    });
  }}
/>
```

No new translation infrastructure needed — it's the same `LanguageSwitcher` → `MagicTranslateButton` → `translateText()`/`translateBatch()` → `/api/translate` pipeline used by every other block.

### 6. JSON Feed Export

The feeds API should export HTML block data with sanitized content:

```json
{
  "type": "html",
  "data": {
    "mode": "url",
    "url": "https://sketchfab.com/3d-models/...",
    "provider": "sketchfab",
    "caption": { "en": "3D scan of ceremonial mask" },
    "aspectRatio": "16:9"
  }
}
```

---

## Implementation Steps — ALL COMPLETE ✅

### Step 1: Types & Data ✅
- [x] Added `HtmlBlockData` and `HtmlEmbedProvider` to `app/src/types/index.ts`
- [x] Added `'html'` to `ContentBlockType` union

### Step 2: Provider Detection ✅
- [x] Created `app/src/lib/embedProviders.ts`
- [x] URL pattern matching + embed URL generation for 14 providers
- [x] Functions: `detectProvider()`, `generateEmbedUrl()`, `getProviderName()`, `getDefaultAspectRatio()`

### Step 3: HTML Sanitizer ✅
- [x] Installed `dompurify` + `@types/dompurify`
- [x] Created `app/src/lib/htmlSanitizer.ts`
- [x] Three tiers: default, allowIframes, sandboxed (with script/SVG/form support)
- [x] `<link>` and `<style>` tags allowed for Google Fonts

### Step 4: Block Editor ✅
- [x] Created `app/src/components/blocks/HtmlBlockEditor.tsx`
- [x] Three mode tabs (Embed Code / URL / Raw HTML)
- [x] Display settings: 3 sizing modes, height slider (constrained width), aspect ratio, max-width pills, toggles
- [x] Raw HTML: LanguageSwitcher + MagicTranslateButton (same pattern as TextBlockEditor)
- [x] Live preview via `<iframe srcdoc>` (supports JS)
- [x] Pre-filled museum demo with Google Fonts, responsive `clamp()` sizing, JS tabbed widget

### Step 5: Block Rendering ✅
- [x] Added `renderHtmlBlock()` to `StopContentBlock.tsx`
- [x] Added `Code` icon and "HTML / Embed" label
- [x] Three sizing modes: Fill Screen, Fixed Height, Auto
- [x] Fill Screen follows Tour Block pattern through full render chain
- [x] Raw HTML renders via `<iframe srcdoc>` for JS support
- [x] Full-bleed support via `calc()` width pattern

### Step 6: Block Registration ✅
- [x] Added to `createEmptyBlockData()` in `StopEditor.tsx` (defaults to Raw HTML mode with demo content)
- [x] Added to add-block grid UI
- [x] Added editor routing + wide modal condition

### Step 7: Full-Height Preview Integration ✅
- [x] `VisitorStop.tsx` — HTML fill blocks get `height: calc(100dvh - 60px)` with `minHeight: 400px`
- [x] `StopPreviewModal.tsx` — Both kiosk and phone/tablet render paths handle HTML fill blocks with `effectiveHeight - 60`
- [x] `StopContentBlock.tsx` — View wrapper applies `h-full flex flex-col` + `minHeight: 100%` for fill blocks

---

## Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `dompurify` | HTML sanitization | ~15KB gzipped |
| `@types/dompurify` | TypeScript types | dev only |

No other new dependencies required.

---

## Offline Snapshot Mode (No-WiFi Venues)

Many museums have dead zones — basements, thick stone walls, rural sites. Embeds that require live internet will show blank iframes. The HTML block needs a **snapshot fallback** system.

### Strategy: Capture & Cache at Edit Time

When a curator adds an embed, the system captures a static fallback **before** the tour goes live. At visitor time, if the embed fails to load, the snapshot is shown instead.

### Architecture

```
┌── Admin (online) ──────────────────────────────────────┐
│                                                         │
│  Curator pastes URL → Auto-detect provider              │
│         ↓                                               │
│  "Capture Snapshot" button                              │
│         ↓                                               │
│  Server-side capture → saves to /uploads/snapshots/     │
│         ↓                                               │
│  Snapshot stored in block data as fallback               │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌── Visitor (offline or slow) ───────────────────────────┐
│                                                         │
│  iframe loads → timeout after 5s                        │
│         ↓                                               │
│  Show snapshot image + "Content requires internet" msg  │
│         ↓                                               │
│  If online later → swap to live embed                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Updated Data Interface (additions)

```typescript
// Added to HtmlBlockData
export interface HtmlBlockData {
  // ... existing fields ...

  // Offline snapshot
  snapshot?: {
    imageUrl: string;          // /uploads/snapshots/{hash}.png
    capturedAt: string;        // ISO timestamp
    sourceUrl: string;         // URL that was captured
    width: number;
    height: number;
  };
  offlineFallback: 'snapshot' | 'message' | 'hide'; // What to show offline
  loadTimeout: number;         // ms before showing fallback (default 5000)
}
```

### Server-Side Capture Options

| Package | Approach | Pros | Cons |
|---------|----------|------|------|
| **Puppeteer** (`puppeteer`) | Headless Chrome screenshot | Best quality, renders JS-heavy pages, most accurate | Large (~300MB Chrome download), heavy for server |
| **Playwright** (`playwright`) | Multi-browser headless | Same quality as Puppeteer, slightly newer API | Same size issue |
| **puppeteer-core** + system Chrome | Uses existing Chrome install | No extra download if Chrome exists on server | Needs Chrome installed in Docker |
| **Pageres** (`pageres`) | Wrapper around Puppeteer | Simpler API, built for screenshots | Still needs Puppeteer underneath |
| **capture-website** (`capture-website`) | Puppeteer wrapper | Very clean API, one-liner captures | Same Puppeteer dependency |
| **Website Screenshot API** (external) | Cloud service | No server deps, fast | Costs money, requires internet to capture |

### Recommended Approach: `puppeteer-core` + System Chrome

For a self-hosted app like TourStack, using `puppeteer-core` with the Chrome already in the Docker container is the best balance:

```typescript
// app/server/routes/snapshot.ts
import puppeteer from 'puppeteer-core';

router.post('/api/snapshot/capture', async (req, res) => {
  const { url, width = 1200, height = 800 } = req.body;

  // Validate URL (whitelist known embed domains)
  if (!isAllowedDomain(url)) {
    return res.status(400).json({ error: 'Domain not allowed for capture' });
  }

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  const filename = `snapshot-${hash}.png`;
  const filepath = path.join(UPLOADS_DIR, 'snapshots', filename);

  await page.screenshot({ path: filepath, type: 'png' });
  await browser.close();

  res.json({
    imageUrl: `/uploads/snapshots/${filename}`,
    capturedAt: new Date().toISOString(),
    sourceUrl: url,
    width,
    height,
  });
});
```

### Lightweight Alternative: No-Capture Fallback

If Puppeteer is too heavy for the deployment, a simpler approach works well for most cases:

1. **Provider thumbnails** — Most embed providers (YouTube, Sketchfab, Vimeo) have thumbnail APIs. Fetch the thumbnail image at edit time and store it as the offline fallback.
2. **Manual screenshot upload** — Let the curator upload their own screenshot as the fallback image.
3. **Styled placeholder** — Show a branded "This content requires internet" card with the provider icon and caption.

```typescript
// Thumbnail APIs by provider (no Puppeteer needed)
const THUMBNAIL_APIS: Record<string, (url: string) => string> = {
  youtube: (url) => {
    const id = url.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1];
    return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  },
  vimeo: async (url) => {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    const data = await fetch(`https://vimeo.com/api/oembed.json?url=${url}`);
    return (await data.json()).thumbnail_url;
  },
  sketchfab: async (url) => {
    const data = await fetch(`https://sketchfab.com/oembed?url=${url}`);
    return (await data.json()).thumbnail_url;
  },
};
```

### Visitor-Side Loading Detection

```typescript
// In renderHtmlBlock() — detect load failure
function EmbedWithFallback({ src, snapshot, fallbackMode, timeout = 5000 }) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, timeout);
    return () => clearTimeout(timer);
  }, [loaded, timeout]);

  return (
    <div className="relative">
      {/* Always render iframe (loads if online) */}
      <iframe
        ref={iframeRef}
        src={src}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'opacity-100' : 'opacity-0'}
        style={{ transition: 'opacity 0.3s' }}
      />

      {/* Show fallback if timed out */}
      {timedOut && !loaded && (
        <>
          {fallbackMode === 'snapshot' && snapshot?.imageUrl && (
            <div className="absolute inset-0">
              <img src={snapshot.imageUrl} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 right-2 bg-black/70 text-white text-xs px-3 py-1.5 rounded">
                Static preview — connect to WiFi for interactive content
              </div>
            </div>
          )}
          {fallbackMode === 'message' && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-800">
              <div className="text-center text-neutral-400">
                <WifiOff className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">This content requires an internet connection</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

### Full Page Archive (Interactive Offline — Like Chrome "Save As")

Screenshots are static. For content that should remain **interactive** offline (3D models, scrollable pages, interactive timelines), a full page archive preserves the actual HTML/CSS/JS as a self-contained file.

**This is the "Chrome Save Page As" approach** — the entire page bundled into a single file that can be served locally with no internet.

#### Package Options

| Package | Format | What it does | Size |
|---------|--------|-------------|------|
| **`single-file-cli`** | Single `.html` | Inlines ALL resources (CSS, images, fonts, JS) as base64 into one self-contained HTML file. Same tech as the popular SingleFile browser extension. | Needs Chromium |
| **`monolith`** | Single `.html` | Rust CLI that packs page into one HTML file. Very fast. | System binary (~5MB) |
| **Puppeteer MHTML** | `.mhtml` | Chrome's native "Save As" format via CDP `Page.captureSnapshot`. Single file with MIME-encoded resources. | Already have Puppeteer |
| **`website-scraper`** | Directory | Downloads page + all assets to a folder. Rewrites URLs to local paths. | ~50KB, no Chromium |
| **`node-fetch` + manual** | Directory | Fetch HTML, parse, download linked CSS/images/JS manually. | No deps |

#### Recommended: Puppeteer MHTML (if already using Puppeteer for screenshots)

MHTML is Chrome's native page archive format — same thing as Ctrl+S → "Webpage, Single File" in Chrome. Since we may already have Puppeteer for screenshots, this is essentially free:

```typescript
// app/server/routes/snapshot.ts — add to existing route

router.post('/api/snapshot/archive', async (req, res) => {
  const { url } = req.body;

  if (!isAllowedDomain(url)) {
    return res.status(400).json({ error: 'Domain not allowed' });
  }

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });

  // Use Chrome DevTools Protocol to capture MHTML
  const cdp = await page.createCDPSession();
  const { data: mhtmlContent } = await cdp.send('Page.captureSnapshot', {
    format: 'mhtml',
  });

  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  const filename = `archive-${hash}.mhtml`;
  const filepath = path.join(UPLOADS_DIR, 'archives', filename);

  await fs.writeFile(filepath, mhtmlContent);
  await browser.close();

  res.json({
    archiveUrl: `/uploads/archives/${filename}`,
    capturedAt: new Date().toISOString(),
    sourceUrl: url,
    format: 'mhtml',
    sizeBytes: Buffer.byteLength(mhtmlContent),
  });
});
```

#### Alternative: `website-scraper` (No Chromium Required)

For deployments where Chromium is too heavy, `website-scraper` downloads the page and all its assets to a local directory. Lighter weight, but won't capture JS-rendered content:

```typescript
// npm install website-scraper
import scrape from 'website-scraper';

router.post('/api/snapshot/scrape', async (req, res) => {
  const { url } = req.body;
  const hash = createHash('md5').update(url).digest('hex').slice(0, 12);
  const outputDir = path.join(UPLOADS_DIR, 'archives', hash);

  await scrape({
    urls: [url],
    directory: outputDir,
    sources: [
      { selector: 'img', attr: 'src' },
      { selector: 'link[rel="stylesheet"]', attr: 'href' },
      { selector: 'script', attr: 'src' },
    ],
    maxDepth: 1,
  });

  res.json({
    archiveUrl: `/uploads/archives/${hash}/index.html`,
    capturedAt: new Date().toISOString(),
    sourceUrl: url,
    format: 'directory',
  });
});
```

#### Updated Data Interface

```typescript
// Added to HtmlBlockData snapshot field
snapshot?: {
  imageUrl: string;            // /uploads/snapshots/{hash}.png (static screenshot)
  archiveUrl?: string;         // /uploads/archives/{hash}.mhtml (interactive archive)
  archiveFormat?: 'mhtml' | 'directory';
  capturedAt: string;
  sourceUrl: string;
  width: number;
  height: number;
  sizeBytes?: number;
};
offlineFallback: 'archive' | 'snapshot' | 'message' | 'hide';
```

#### Visitor-Side Fallback Priority

```
1. Try live embed (iframe src = original URL)
2. If timeout → try archive (iframe src = local .mhtml or directory/index.html)
3. If no archive → show snapshot image
4. If no snapshot → show "requires internet" message
```

```typescript
// Updated EmbedWithFallback component
function EmbedWithFallback({ src, snapshot, fallbackMode, timeout = 5000 }) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, timeout);
    return () => clearTimeout(timer);
  }, [loaded, timeout]);

  // If timed out and we have an archive, swap iframe src to local archive
  const activeSrc = (timedOut && !loaded && snapshot?.archiveUrl)
    ? snapshot.archiveUrl
    : src;

  return (
    <div className="relative">
      <iframe
        src={activeSrc}
        onLoad={() => setLoaded(true)}
        className={loaded || (timedOut && snapshot?.archiveUrl) ? 'opacity-100' : 'opacity-0'}
        style={{ transition: 'opacity 0.3s' }}
      />

      {timedOut && !loaded && !snapshot?.archiveUrl && (
        /* fall through to snapshot image or message */
      )}
    </div>
  );
}
```

#### Editor UX for Offline Capture

```
┌── Offline Fallback ─────────────────────────────────────────────┐
│                                                                  │
│  [📸 Capture Screenshot]  [📦 Save Page Archive]  [📤 Upload]   │
│                                                                  │
│  ✅ Screenshot captured: 2026-03-24 (1.2 MB)                    │
│  ✅ Page archive saved: 2026-03-24 (4.8 MB, MHTML)             │
│                                                                  │
│  Fallback mode: ( ) Archive  (•) Screenshot  ( ) Message        │
│                                                                  │
│  ⚠️ Archives can be large. Use screenshots for simple embeds,   │
│     archives for interactive content (3D models, virtual tours). │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Docker Consideration

If using Puppeteer (for either screenshots or MHTML archives), add Chromium to the Dockerfile:

```dockerfile
# In app/Dockerfile — only needed if using server-side capture
RUN apk add --no-cache chromium
ENV CHROME_PATH=/usr/bin/chromium-browser
```

This adds ~60MB to the container. **Only add this if curators actively use the snapshot/archive feature.** The thumbnail API + manual upload approach requires zero Docker changes.

---

## Future Enhancements

- **Link to Stop** — Add a "Link to Stop" action option in the HTML block editor. When a curator associates an HTML block with a tour stop, the block renders a tappable overlay or button that navigates the visitor to that stop. This would reuse the existing `onNavigateToStop` callback pattern from Map/ImageMap blocks and the `allStops` prop. Could also support linking to an external URL or a specific stop within the tour — same CTA action pattern as TourBlockData (`ctaAction: 'next-stop' | 'specific-stop' | 'external-url'`).
- **oEmbed support** — Fetch rich metadata (title, thumbnail) from oEmbed endpoints
- **Provider gallery** — Visual picker with provider logos instead of typing URLs
- **Responsive embed** — Different embeds per device type (3D on desktop, static image on phone)
- **Analytics** — Track embed interactions (Sketchfab loads, play counts)
- ~~**CSS injection**~~ ✅ DONE — `<style>` blocks and Google Fonts `<link>` tags supported, scoped via iframe srcdoc
- **PWA cache** — Service worker pre-caches snapshots for full offline tour support
- **Caption & Attribution** — Optional caption and source fields with multilingual translation support (removed from v1 to keep UI clean, can be re-added if curators request it)
