# Self-Contained Tour Packaging — Brainstorm & Audit

**Created:** March 16, 2026
**Updated:** March 16, 2026
**Status:** Phase 1 Implemented
**Problem:** Museums without WiFi need tours running on rack-mounted devices with no internet dependency

## Implementation Status

| Feature | Status | Location |
|---------|--------|----------|
| Staff Handoff Screen | **Done** | `KioskStaffScreen.tsx`, route `/kiosk/tour/:id` |
| Tour List (Kiosk) | **Done** | `KioskTourList.tsx`, route `/kiosk` |
| Language Picker + Start Tour | **Done** | Staff screen with flag buttons, auto-fullscreen |
| Inactivity Reset | **Done** | VisitorStop.tsx — 5min idle → 30s countdown → return to staff screen |
| Device Status Bar | **Done** | WiFi, battery, cache status in staff screen header |
| PIN-Protected Settings | **Done** | Staff PIN (default: 0000) for device settings |
| Export Offline ZIP | **Done** | `server/routes/export.ts`, endpoint `/api/export/:tourId` |
| Integrated Modal | **Done** | KioskLauncherModal.tsx — 3 tabs: Kiosk / Staff Handoff / Export |
| Run Button → Staff Screen | **Done** | Tour detail "Run" button opens staff handoff directly |

### How to Access (All From Admin UI)
- **Run/Preview button** on any Tour Detail page → opens Staff Handoff Screen
- **Monitor icon** on Tour Detail page → modal with 3 tabs (Kiosk Mode, Staff Handoff, Export Offline)

---

## The Scenario

A museum has a rack of tablets/devices at the entrance. A visitor grabs one, the tour is already loaded. No WiFi, no cell signal, no server. Everything runs locally on that device.

Staff need a way to **publish** a tour from TourStack and **push it to all devices** in the rack — ideally by scanning a QR code or tapping a button.

---

## Current State Audit

### What a Tour Needs at Runtime

| Asset Type | Source | Typical Size | Offline Difficulty |
|-----------|--------|-------------|-------------------|
| Tour + stop JSON | API `/api/visitor/tour/:slug` | ~50-200 KB | Easy — single JSON export |
| Images | `/uploads/images/` | ~500 KB - 5 MB each, 71 in DB | Easy — copy files |
| Audio narration | `/uploads/audio/` | ~1-10 MB each, 10 in DB | Easy — copy files |
| Video (direct) | `/uploads/` or external | 10-500 MB | Medium — large files |
| Video (YouTube/Vimeo) | External CDN | N/A | Hard — requires internet or re-encode locally |
| Map tiles | Google Maps / OSM | Varies | Hard — need tile cache or static images |
| Fonts / CSS / JS | Vite `dist/` bundle | ~2-5 MB | Easy — already built |
| Concierge AI chat | Gemini API | N/A | Hard — requires LLM server or stripped out |

### What We DON'T Need Offline
- Admin/editor UI
- Upload/transcode pipeline
- Translation API calls
- Analytics logging (could buffer locally)
- Auth (visitor routes are already public)

### Current Gaps
- **Zero offline capability** — no service worker, no PWA manifest, no IndexedDB
- **All API calls assume network** — React Query fetches on every page load
- **External video embeds** (YouTube/Vimeo) won't work offline
- **Map blocks** depend on tile servers
- **Concierge chat** requires Gemini API

---

## Packaging Strategies

### Strategy A: Static Site Export (Recommended Starting Point)

**How it works:** Export a tour as a self-contained folder with `index.html`, bundled JS/CSS, tour JSON embedded, and all media files copied in.

```
tour-package/
  index.html          ← Single entry point
  assets/
    app.js            ← React app (visitor-only build)
    app.css
  media/
    images/
      hero-abc123.jpg
      stop1-img1.jpg
    audio/
      stop1-en.mp3
      stop1-es.mp3
  data/
    tour.json         ← Full tour + stops + content blocks
```

**Publish flow:**
1. Curator clicks "Export for Offline" in TourStack admin
2. Server builds a ZIP: static HTML + JS + all referenced media
3. Tour JSON is either embedded in HTML or loaded from `data/tour.json`
4. All `/uploads/...` URLs in content blocks are rewritten to `./media/...`

**On the device:**
- Open `index.html` in a kiosk browser (Fully Kiosk, Guided Access, etc.)
- Works from `file://` or a simple local HTTP server
- Zero network dependency

**Pros:**
- Simplest to implement — it's just a build step
- Works on any device with a browser
- Small footprint (just files on disk)
- Easy to verify: open the folder, everything's there

**Cons:**
- No hot-reload when tour changes (must re-export and re-deploy)
- Video embeds (YouTube/Vimeo) won't work — need direct video files
- Map blocks need a fallback (static image or stripped)
- No concierge chat

**Implementation effort:** Medium — need a visitor-only Vite build + export endpoint + URL rewriter

---

### Strategy B: PWA with Pre-cached Tour

**How it works:** Add a service worker to the existing web app that pre-downloads and caches an entire tour (data + assets) for offline use.

**Publish flow:**
1. Device connects to WiFi once (setup time)
2. Opens TourStack URL → PWA installs to home screen
3. Service worker caches: app shell + tour JSON + all media
4. WiFi disconnected — tour runs from cache

**Update flow:**
- Reconnect to WiFi periodically → SW checks for updates → re-caches
- Or: connect to a local "update station" (laptop running TourStack)

**Pros:**
- Leverages existing web app — no separate build
- Standard web tech (Workbox, Cache API)
- Incremental updates (only changed assets re-downloaded)
- Add-to-homescreen gives native-app feel

**Cons:**
- Initial setup requires network
- Browser cache limits vary (some browsers cap at ~50-100 MB)
- Cache eviction risk on low-storage devices
- More complex than static files
- Still a "web app" — some kiosk software prefers local files

**Implementation effort:** Medium — add Workbox, service worker, cache manifest generation

---

### Strategy C: Android/iOS Kiosk App (Capacitor or Electron)

**How it works:** Wrap TourStack visitor in a native shell. Tour data + assets bundled into the APK/IPA or downloaded on first launch.

**Publish flow:**
1. Build a generic "TourStack Player" app
2. Tour package (JSON + media) sideloaded via USB, ADB, or MDM
3. App reads local tour package, renders in embedded WebView

**Pros:**
- Full native control (lock to app, disable notifications, etc.)
- No browser cache limits — assets stored in app storage
- MDM integration for fleet management (Jamf, Google Workspace)
- Could add BLE beacon scanning (native API access)

**Cons:**
- Separate build pipeline per platform
- App store approval if distributing publicly
- Heavier development investment
- Update cycle slower (re-deploy APK vs refresh web page)

**Implementation effort:** High — Capacitor integration, native kiosk mode, sideloading pipeline

---

### Strategy D: Local Server Appliance

**How it works:** A Raspberry Pi or mini PC runs TourStack server locally on the museum's LAN. Devices connect to it via local WiFi (no internet needed).

```
[Raspberry Pi running TourStack]
         |
    [Local WiFi AP]
     /    |    \
  iPad  iPad  iPad  (tablets on rack)
```

**Publish flow:**
1. Curator exports tour from cloud TourStack
2. Imports into local Pi server (USB stick, or brief internet connection)
3. Devices on local WiFi hit `http://tourstack.local/visitor/...`

**Pros:**
- **Existing app works as-is** — zero code changes to visitor experience
- Local WiFi is fast and reliable
- Central update point (update Pi, all devices get new content)
- Concierge chat could work with a local LLM (Ollama + small model)
- Analytics still collected locally

**Cons:**
- Hardware to manage (Pi, access point, power)
- WiFi still needed (just local, not internet)
- Single point of failure (Pi dies = all devices down)
- Slightly more complex setup for non-technical staff

**Implementation effort:** Low-Medium — mostly DevOps/packaging, minimal code changes

---

## Strategy E: Staff Handoff Mode (Loading Screen → Language → Save → Hand Off)

**This is the museum-friendly UX option.** Instead of expecting visitors to configure anything, staff prep each device before handing it out.

### The Flow

```
┌─────────────────────────────────────┐
│          STAFF LOADING SCREEN       │
│                                     │
│   ┌─────────┐  ┌─────────────────┐  │
│   │ 🏛️      │  │  Civil War Tour  │  │
│   │ Museum   │  │  12 stops · 45m  │  │
│   │ Logo     │  │                 │  │
│   └─────────┘  └─────────────────┘  │
│                                     │
│   Choose language for this visitor: │
│                                     │
│   ┌──────────┐  ┌──────────┐       │
│   │ English  │  │ Español  │       │
│   └──────────┘  └──────────┘       │
│   ┌──────────┐  ┌──────────┐       │
│   │ Français │  │ 中文      │       │
│   └──────────┘  └──────────┘       │
│                                     │
│         [ ▶ Start Tour ]            │
│                                     │
│   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│   🔋 100%  📦 Tour cached  ✅ Ready │
│   Staff PIN: ····  [⚙ Settings]    │
│                                     │
└─────────────────────────────────────┘
```

### How It Works

1. **Device boots into Staff Loading Screen** (locked kiosk mode)
2. Tour data + all media already cached on device (via any strategy: A, B, C, or D)
3. Staff member selects the **language** for this visitor
4. Taps **"Start Tour"**
5. Device switches to **visitor mode** — locked to that tour, that language
6. Visitor navigates stops, listens to audio, views images — all offline, all in their language
7. **Visitor returns device** → device auto-resets to Staff Loading Screen
   - Could detect: inactivity timeout, re-dock to charging rack, or staff enters PIN

### Why This UX Is Better for Museums

- **Visitors don't configure anything** — they get a device that "just works" in their language
- **Staff stay in control** — they see device status (battery, cache, readiness) at a glance
- **Single-language mode is simpler** — UI doesn't need language switcher, smaller download (only one set of audio files), less confusing for visitors
- **Return-to-dock auto-reset** — no manual cleanup between visitors
- **Staff PIN prevents visitors from accessing settings** — tamper-proof

### What the Staff Screen Shows

| Element | Purpose |
|---------|---------|
| Museum logo + tour name | Confirm correct tour is loaded |
| Language buttons | One tap to set visitor language |
| "Start Tour" button | Locks device into visitor mode |
| Battery indicator | Staff knows if device needs charging |
| Cache status | "Tour cached ✅" or "Syncing... 73%" |
| Last synced time | "Updated 2 hours ago" |
| Settings (PIN-protected) | WiFi, tour selection, diagnostics |
| Device number | "Device #7 of 20" — helps track fleet |

### Single-Language Optimization

When staff picks a language, the visitor experience can be streamlined:

- **Audio:** Only buffer/preload audio for the selected language (saves bandwidth if streaming, saves memory if playing)
- **Text:** Render only the selected language — no language toggle in the UI
- **Images:** Same across languages (usually), but any language-specific images (e.g., translated signage photos) only load the selected set
- **UI chrome:** All buttons, labels, navigation in the selected language
- **Simpler visitor UI:** No settings, no language picker, no distractions — just the tour content

### Return & Reset Behavior

Several ways to detect "visitor is done":

| Trigger | How | Reliability |
|---------|-----|-------------|
| **Dock detection** | Device detects power/charging → reset | High (if rack has smart charging) |
| **Inactivity timeout** | No touch for 5 min → "Return device" screen → 2 min → reset | Medium (visitor might just be reading slowly) |
| **Staff PIN reset** | Staff enters 4-digit PIN to return to loading screen | High (manual but reliable) |
| **NFC tap** | Staff taps NFC tag on rack to reset device | High (fast, no typing) |
| **"End Tour" button** | Visitor taps at last stop → "Please return device" → reset | Medium (visitor might not tap it) |

Recommended: **dock detection + inactivity timeout + staff PIN** as fallback layers.

### Combining with Other Strategies

This staff handoff UX is a **layer on top of** the packaging strategies:

- **Strategy A (Static Export) + Staff Handoff:** Static files on device, staff screen is part of the bundle, language selection filters what's shown
- **Strategy B (PWA) + Staff Handoff:** PWA with a "staff mode" entry point, language cached for session
- **Strategy C (Native App) + Staff Handoff:** Most natural fit — native app handles kiosk lock, dock detection, staff PIN
- **Strategy D (Local Server) + Staff Handoff:** Server serves a staff-mode URL, language passed as query param

### Implementation Sketch

The Staff Loading Screen could be a separate route in the existing visitor app:

```
/kiosk                     → Staff Loading Screen (PIN-protected settings)
/kiosk/tour/:id            → Staff selects language for this tour
/kiosk/tour/:id/go?lang=es → Visitor mode (locked, single-language)
```

**Key components needed:**
1. `KioskStaffScreen.tsx` — tour selector + language picker + device status
2. `KioskVisitorShell.tsx` — wraps existing VisitorStop with no escape (no URL bar, no back, no settings)
3. `KioskResetDetector.tsx` — watches for dock/inactivity/PIN to reset
4. Session storage for current language selection (no localStorage pollution between visitors)
5. Staff PIN stored in device settings (not in tour data)

---

## Device Fleet Management

### How to Get Tours Onto Devices

| Method | Works With | Complexity | Best For |
|--------|-----------|-----------|---------|
| **QR code scan** | Strategy A, B | Low | Staff scans QR on each device → downloads tour package from local server or USB |
| **MDM push** (Jamf, Workspace) | Strategy C | Medium | Large museums with IT staff, push app + config remotely |
| **USB sideload** | Strategy A, C | Low | Small museums, plug in and copy files |
| **Local WiFi sync** | Strategy B, D | Medium | Devices auto-update when placed on charging rack (rack has WiFi AP) |
| **ADB over USB** | Strategy C (Android) | Low | Android tablets, script pushes package via USB hub |
| **Bluetooth/AirDrop** | Strategy A | Low | Small fleet, manual transfer |

### Recommended: "Charging Rack = Update Station"

Many museums already have charging racks. The rack could include:
- A small WiFi access point (no internet, just LAN)
- A Raspberry Pi running TourStack or a simple file server
- When a device is docked and charging, it connects to rack WiFi
- PWA service worker (Strategy B) or sync app (Strategy C) pulls latest tour
- Indicator LED or notification confirms sync complete
- Staff undock device, hand to visitor — fully offline and up to date

---

## Handling Offline-Incompatible Features

| Feature | Offline Fallback |
|---------|-----------------|
| YouTube/Vimeo video | Require direct video upload for offline tours; show "video unavailable offline" badge in editor |
| Map blocks (Google/OSM) | Pre-render static map image at export time; or cache tile region |
| Concierge AI chat | Disable for offline packages; or run local Ollama on Pi (Strategy D) |
| GPS geofencing | Still works (device GPS is local); but no map display without tiles |
| QR scanner | Still works (camera is local); resolves against local stop data |
| Analytics | Buffer in localStorage/IndexedDB → flush when back online |
| NFC | Still works (hardware is local) |
| BLE beacons | Still works (hardware is local) |

---

## Recommended Phased Approach

### Phase 1: Static Export + Staff Handoff Screen (Strategy A + E)
**Goal:** "Export as ZIP" button in admin → self-contained tour with staff loading screen

1. Add "Export for Offline" button to tour detail page
2. Build a visitor-only Vite entry point (no admin, no React Query fetching)
3. **Build the Staff Loading Screen** — language picker, device status, "Start Tour"
4. Server endpoint collects: tour JSON + all referenced media files
5. Rewrites all `/uploads/...` URLs to relative `./media/...` paths
6. Embeds tour data as `window.__TOUR_DATA__` in HTML
7. Packages as ZIP for download
8. Staff copies ZIP contents to device, opens in kiosk browser

**Why start here:** The staff handoff screen is the simplest meaningful UX — it's just a React page with language buttons, and it immediately makes the device feel purpose-built for museum use.

**Estimate:** New endpoint + visitor-only build variant + URL rewriter + KioskStaffScreen component

### Phase 2: PWA + Local Sync (Strategy B)
**Goal:** Devices auto-cache tours and sync on charging rack

1. Add PWA manifest + service worker (Workbox)
2. "Pin tour for offline" action in visitor UI
3. SW pre-caches: app shell + tour JSON + all media for pinned tour
4. Charging rack WiFi AP + simple sync server
5. Background sync checks for tour updates

### Phase 3: Fleet Management
**Goal:** Centralized control of device fleet

1. Simple admin dashboard showing connected devices + sync status
2. "Publish to fleet" button → pushes to all docked devices
3. Device health monitoring (battery, storage, last sync time)
4. Optional: MDM integration for larger deployments

### Phase 4: Local Server Appliance (Strategy D)
**Goal:** Turnkey hardware solution for museums

1. Raspberry Pi image with TourStack pre-installed
2. Import/export tour packages
3. Local WiFi AP configuration
4. Optional: local LLM for concierge chat
5. Monitoring dashboard accessible from museum's main network

---

## Open Questions

1. **What devices are museums using?** iPads? Android tablets? Dedicated audio guides? This shapes which strategy to prioritize.
2. **How often do tours change?** If rarely, USB sideloading is fine. If weekly, need automated sync.
3. **How many devices per rack?** 10? 50? Affects fleet management complexity.
4. **Do museums want analytics?** If yes, need buffered-upload mechanism.
5. **Video-heavy tours?** Storage per device becomes a concern (32GB iPad vs 128GB).
6. **Multi-tour devices?** Does one device serve one tour or a menu of tours?
7. **Accessibility hardware?** Some museums have accessible devices (switch controls, screen readers) — does the offline package need to support these?
8. **What kiosk software do museums typically use?** Fully Kiosk Browser (Android)? Guided Access (iOS)? This affects packaging format.

---

## Quick Wins (No Architecture Changes)

Even before building any of the above, we could:

1. **Add `rel="preload"` hints** for audio/images on visitor pages — faster load on slow WiFi
2. **Add a PWA manifest** — zero-effort "add to home screen" on museum tablets
3. **Add a basic service worker** that caches the app shell — at least the UI loads offline even if data doesn't
4. **Add an "Export Tour JSON" button** — curators can at least back up tour data
5. **Flag external dependencies in editor** — warn when a stop uses YouTube/maps that won't work offline
