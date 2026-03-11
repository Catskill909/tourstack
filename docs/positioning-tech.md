# Positioning Technology Editor — Development Plan & Audit

**Created:** January 24, 2026  
**Updated:** March 9, 2026  
**Status:** ✅ Phase 1 (Tabbed UI) | ✅ Phase 2 (NFC + QR) | ✅ Phase 3 (GPS + Geofencing)  
**Component:** `PositioningEditorModal.tsx`  
**Last Audit:** March 9, 2026

---

## Overview

The Stop Positioning Editor is a tabbed modal that allows curators to configure how visitors trigger each stop. TourStack supports **7 core positioning technologies** in the editor UI (plus 4 additional methods defined in the type system), with each stop having a **primary** method and optional **backup/fallback** method.

**Architecture:** Positioning configs are stored as JSON strings in the Stop model (`primaryPositioning`, `backupPositioning`). The Tour model sets the default method (`primaryPositioningMethod`) that new stops inherit. The visitor-side resolves stops via slug-based URLs regardless of trigger method.

---

## 📊 Implementation Status Matrix

| Technology | Type Def | Editor Tab | Visitor Side | Server API | Database | Priority |
|-----------|---------|-----------|-------------|-----------|----------|----------|
| **NFC** | ✅ | ✅ Tab 1 | ✅ Tap→URL | ✅ URL gen | ✅ JSON | — |
| **QR Code** | ✅ | ✅ Tab 2 | ✅ Scanner Block | ✅ /visitor/s/:code | ✅ JSON | — |
| **GPS** | ✅ | ✅ Tab 3 | ✅ Geofencing | ✅ /gps-stops | ✅ GPSConfig | — |
| **BLE Beacon** | ✅ | 🔜 Placeholder | ❌ Browser can't scan | ❌ No API | ✅ BLEBeaconConfig | MEDIUM |
| **RFID** | ✅ | 🔜 Placeholder | ❌ No reader API | ❌ No API | ✅ RFIDConfig | LOW |
| **WiFi** | ✅ | 🔜 Placeholder | ❌ No scanning | ❌ No API | ✅ WiFiConfig | LOW |
| **UWB** | ✅ | 🔜 Placeholder | ❌ Native only | ❌ No API | ✅ UWBConfig | LOW |
| **Image Recog** | ✅ | ❌ No tab | ❌ No scanner | ❌ | ✅ Config | FUTURE |
| **Audio Watermark** | ✅ | ❌ No tab | ❌ No decoder | ❌ | ✅ Config | FUTURE |
| **Manual** | ✅ | ❌ No tab | ⚠️ Staff-directed | ❌ | ✅ Config | FUTURE |

---

## 🎯 Current State (Audit: March 9, 2026)

### What's Built & Working

- **PositioningEditorModal.tsx** — 7-tab modal, NFC first, QR second, 5 placeholders
- **NFC tab** — Full implementation (Web NFC write, URL copy, help modal, test button)
- **QR Code tab** — Full implementation (live preview, download PNG, short code, regenerate)
- **QR Scanner Block** — Camera-based scanner with 4 modes (navigate / checkin / scavenger / info)
- **Short code fallback** — `GET /api/visitor/s/:shortCode` resolves to stop URL
- **Type system** — All 11 positioning method configs defined in `types/index.ts`
- **Trigger settings** — `TriggerSettings` interface with entry/exit, dwell time, notifications
- **Map Block** — Full map editor with provider toggle, styles, geofence radius visualization
- **GPS admin tab** — Full map editor integration with coordinates, trigger radius, map provider
- **Geofence monitoring** — `useGeofenceMonitor` hook with Haversine distance, watchPosition, auto-navigate
- **GPS stops endpoint** — `GET /api/visitor/tour/:id/gps-stops` returns lightweight geofence targets
- **Backup fallback banner** — Visitor sees backup method prompt when primary is auto-detect
- **Geofence permission UI** — Green "Enable location" banner prompts visitor to share location
- **VisitLog analytics** — Logs stop visits with source, token, timestamp, user agent
- **Short code indexed lookup** — O(1) via `shortCode` column with unique index
- **Zod validation** — All positioning configs validated on save via discriminated union schema

### What's Missing (Critical Gaps)

1. ~~**No visitor-side position monitoring**~~ ✅ FIXED — `useGeofenceMonitor` hook with watchPosition + Haversine geofencing
2. ~~**No analytics capture**~~ ✅ FIXED — VisitLog table logs `?t=` and `?src=` params
3. ~~**Short code lookup is O(n)**~~ ✅ FIXED — Indexed `shortCode` column with `findFirst()`
4. ~~**Backup positioning untested**~~ ✅ FIXED — Fallback banner in VisitorStop.tsx
5. ~~**No positioning config validation**~~ ✅ FIXED — Zod schemas in `server/validation/positioning.ts`

---

## 📋 Positioning Technologies — Detailed Tab Specs

### Tab 1: NFC ✅ COMPLETE (March 5, 2026)
**Icon:** `Nfc` | **Default tab** | **Range:** 0–4cm (tap)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| NFC URL | text (auto-gen) | ✅ | Canonical visitor URL with `?src=nfc` |
| Copy URL | button | ✅ | Copy URL for NFC Tools app |
| Write to Tag | button | ✅ | Web NFC direct write (Chrome Android only) |
| Tag Type | select | ✅ | NTAG213 / NTAG215 / NTAG216 |
| Tag ID | text | ✅ | Optional manual entry, auto-filled on write |
| Short Code | text | ✅ | Fallback code (shared with QR) |
| Test | button | ✅ | Opens visitor URL in new tab |
| Help Modal | button | ✅ | 3 pairing methods with step-by-step instructions |

**Code Flow:**
```
PositioningEditorModal (activeTab = 'nfc')
  ├─ nfcUrl = auto-generated visitor URL + ?src=nfc
  ├─ hasWebNfc = 'NDEFReader' in window
  ├─ handleWriteNfcTag() → NDEFReader.write({records: [{recordType: 'url', data: nfcUrl}]})
  ├─ handleCopyNfcUrl() → navigator.clipboard.writeText(nfcUrl)
  └─ NFC help modal (3 pairing methods)
```

**Visitor Behavior by Device:**

| Device | Behavior |
|--------|----------|
| iPhone XS+ (iOS 14+) | Background NFC: tap tag → OS banner → tap → Safari opens URL |
| iPhone 7/8/X | Requires NFC reader app open first |
| Android (NFC-equipped) | Tap tag → browser opens URL immediately (one fewer tap than iPhone) |

**Tag Recommendations:**
- **NTAG213** (recommended): 144 bytes, fits TourStack URLs, ~$0.15–0.30/tag
- NTAG215: 504 bytes, longer URLs if needed
- NTAG216: 888 bytes, complex data / vCards

**DB Storage:** `Stop.primaryPositioning` → `{"method": "nfc", "tagId": "", "tagType": "NTAG213"}`
**Visitor URLs:** Generated dynamically by client, not stored in DB.

---

### Tab 2: QR Code ✅ COMPLETE
**Icon:** `QrCode` | **Range:** Camera line-of-sight | **Cost:** $0

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| Target URL | text | ✅ | Visitor URL with tracking token `?t={token}` |
| Short Code | text (auto-gen) | ✅ | 6-char code (A-Z, 2-9, no 0/O/1/I) |
| QR Preview | SVG | ✅ | Live QR via `qrcode.react` |
| Download | button | ✅ | SVG→Canvas→PNG with white background |
| Regenerate | button | ✅ | New token + new short code + visual feedback |
| Copy URL | button | ✅ | Copy visitor URL to clipboard |
| Test | button | ✅ | Opens URL in new tab |

**Three QR Systems in TourStack:**

| System | File | Purpose |
|--------|------|---------|
| PositioningEditorModal | `PositioningEditorModal.tsx` | Stop-level QR config, download, short code |
| PositioningBlockEditor | `blocks/PositioningBlockEditor.tsx` | QR as a content block within stop layout |
| QR Scanner Block | `blocks/QRScannerBlockEditor.tsx` + `QRScannerBlockPreview.tsx` | Camera scanner for visitors |

**QR Scanner Block Modes:**
- `navigate` — Scan → redirect to another stop/tour
- `checkin` — Scan → mark stop as visited
- `scavenger` — Scan → validate specific code for scavenger hunt
- `info` — Scan → show info popup (lightweight API call)

**Short Code Resolution:**
```
GET /api/visitor/s/:shortCode
→ Scans all stops for matching primaryPositioning.shortCode (⚠️ O(n) — needs index)
→ Returns { redirectUrl, tourSlug, stopSlug }
```

**Signage Tips:**
- Print at least 1.5" × 1.5" for easy scanning
- Place at eye level, 3–4 feet from exhibit
- Always include short code as fallback text below QR

---

### Tab 3: GPS ✅ COMPLETE (March 9, 2026)
**Icon:** `MapPin` | **Range:** 5–200m geofence | **Cost:** $0 (uses device GPS)

| Field | Type | Status | Description |
|-------|------|--------|-------------|
| Latitude | number | ✅ | GPS latitude coordinate (6 decimal precision) |
| Longitude | number | ✅ | GPS longitude coordinate (6 decimal precision) |
| Trigger Radius | slider (5–200m) | ✅ | Geofence radius in meters with radiusToZoom auto-sync |
| Map Preview | interactive map | ✅ | MapPreview component with marker + purple radius circle |
| Get Current Location | button | ✅ | `navigator.geolocation.getCurrentPosition()` with loading state |
| Open Map Editor | button | ✅ | Launches MapEditorModal as sub-modal |
| Map Provider | toggle | ✅ | Google Maps ↔ OpenStreetMap (with tile switching) |
| Map Style | select | ✅ | Google: Roadmap/Satellite/Terrain/Hybrid — OSM: Standard/Satellite/Terrain |

**Existing Assets to Reuse:**
- `MapBlockEditor.tsx` — Full map editor already built with:
  - Provider toggle (Google Maps / OpenStreetMap)
  - Style selector (standard / satellite / terrain / hybrid)
  - Zoom control
  - **Trigger zone visualization** (circle radius overlay — already implemented!)
  - Marker customization
  - Full-screen editor mode
- `MapBlockData` interface — Has `triggerRadius`, `showTriggerZone`, `latitude`, `longitude`

**What Needs Building (Admin Side):**
1. Wire MapBlockEditor components into GPS tab
2. "Get Current Location" button → prefill lat/lng
3. Save GPS config to `stop.primaryPositioning` as GPSConfig JSON
4. Validate coordinates (lat: -90 to 90, lng: -180 to 180)

**What Needs Building (Visitor Side):**
1. `navigator.geolocation.watchPosition()` for continuous monitoring
2. Haversine distance calculation (visitor pos → stop GPS coords)
3. Geofence enter/exit event firing
4. Permission request UI ("Allow location access for automatic tour guidance")
5. Battery-conscious polling strategy (reduce frequency when stationary)

**What Needs Building (Server Side):**
1. Endpoint to return all GPS-enabled stops for a tour (for batch geofencing)
2. Optional: server-side proximity logging for analytics

**Best For:**
- Outdoor walking tours, sculpture gardens
- Archaeological sites, nature trails
- City landmark tours
- Cemetery / memorial tours

**Type Definition (exists):**
```typescript
interface GPSConfig {
  method: 'gps';
  latitude: number;
  longitude: number;
  radius: number;         // meters
  elevation?: number;
  mapProvider: 'google' | 'openstreetmap';
}
```

---

### Tab 4: BLE Beacon 🔜 PLACEHOLDER
**Icon:** `Radio` | **Range:** 1–30m | **Cost:** $5–50/beacon

| Field | Type | Planned | Description |
|-------|------|---------|-------------|
| UUID | text | 🔜 | Beacon UUID (one per venue) |
| Major | number (1–65535) | 🔜 | Floor/zone grouping |
| Minor | number (1–65535) | 🔜 | Unique per beacon |
| TX Power | number | 🔜 | dBm for range calibration (-59 standard) |
| Trigger Radius | slider (1–10m) | 🔜 | Estimated trigger distance |
| Beacon Brand | select | 🔜 | Estimote / Kontakt.io / Custom / DIY |

**⚠️ Critical Browser Limitation:**
Web Bluetooth API **cannot passively scan** for iBeacon advertisements. This is a fundamental platform restriction:
- **iOS Safari:** Zero Web Bluetooth support
- **Chrome Android:** Experimental Web Bluetooth exists but cannot detect iBeacon (Apple blocks manufacturer data access)
- **Chrome Desktop:** Can connect to specific devices but cannot scan for beacons

**Three Implementation Paths (from beacon-dev.md):**

| Path | Approach | Effort | User Experience |
|------|----------|--------|-----------------|
| **1. Capacitor App** | Native iOS/Android wrapper with CoreBluetooth/Android BLE | HIGH | Seamless auto-trigger |
| **2. Beacon-Triggered Kiosk** | ESP32/Pi at exhibit → shows QR on approach | MEDIUM | Semi-automatic |
| **3. Eddystone-URL** | Beacons broadcast URL → Android notification | LOW | Android-only, deprecated |

**Recommended Path:** Capacitor wrapper (Path 1) for native BLE scanning — this is the only way to get reliable beacon detection on both iOS and Android.

**Admin Tab Can Still Be Built Now:**
Even without visitor-side scanning, the admin config tab is useful for:
- Recording beacon assignments (which UUID/Major/Minor at which stop)
- Generating beacon programming instructions
- Planning beacon fleet before hardware purchase
- Exporting config for third-party beacon management tools

**Supported Beacon Brands:**
- Estimote (cloud-managed, ~$20/beacon)
- Kontakt.io (enterprise, ~$15/beacon)
- Gimbal (retail-focused)
- RadBeacon (USB-powered desktop beacons)
- ESP32 DIY ($3–5/unit, open firmware)

**AppSettings fields (already defined):**
- `estimoteApiKey` — For Estimote Cloud API
- `kontaktApiKey` — For Kontakt.io API
- `customBleEnabled` — Toggle for DIY beacons

**Type Definition (exists):**
```typescript
interface BLEBeaconConfig {
  method: 'ble_beacon' | 'ble_virtual';
  uuid: string;
  major: number;
  minor: number;
  txPower?: number;
  radius: number;
}
```

---

### Tab 5: RFID 🔜 PLACEHOLDER
**Icon:** `Scan` | **Range:** 1–100ft (active) / inches (passive) | **Cost:** $0.10–50/tag

| Field | Type | Planned | Description |
|-------|------|---------|-------------|
| Tag ID | text | 🔜 | RFID tag identifier |
| Tag Mode | toggle | 🔜 | Active (powered, long range) / Passive (short range) |
| Frequency Band | select | 🔜 | LF (125kHz) / HF (13.56MHz) / UHF (860–960MHz) |
| Read Range | slider | 🔜 | Expected read distance |

**Browser Limitation:** No Web RFID API exists. Requires dedicated reader hardware + server integration or native app.

**Realistic Use Cases (enterprise/institutional):**
- Artifact tracking + visitor triggers (museums with existing RFID infrastructure)
- Multi-object detection in a single read zone
- High-throughput areas (gift shop, entrance/exit gates)
- Integration with existing museum collection management systems

**Implementation Strategy:**
- Admin tab: Record tag IDs and associate with stops (config-only, no hardware integration)
- Visitor side: Would require fixed RFID readers connected to a server that pushes events to TourStack API
- Most practical as a complement to other methods, not standalone

**Type Definition (exists):**
```typescript
interface RFIDConfig {
  method: 'rfid';
  tagId: string;
  isActive: boolean;
  frequency?: 'LF' | 'HF' | 'UHF';
}
```

---

### Tab 6: WiFi 🔜 PLACEHOLDER
**Icon:** `Wifi` | **Range:** 5–15m accuracy | **Cost:** $0 (uses existing APs)

| Field | Type | Planned | Description |
|-------|------|---------|-------------|
| Access Points | list | 🔜 | Configure nearby APs for triangulation |
| └─ BSSID | text | 🔜 | AP MAC address |
| └─ SSID | text | 🔜 | Network name (display only) |
| └─ Signal Threshold | slider (-90 to -30 dBm) | 🔜 | Trigger when signal exceeds |

**Browser Limitation:** No Web WiFi scanning API. `navigator.connection` provides network info but not BSSID/signal strength. Requires native app (Capacitor) or server-side integration with WiFi infrastructure (Cisco Meraki, Aruba, etc.).

**Implementation Strategy:**
- Admin tab: Record AP BSSIDs and signal thresholds per stop
- Visitor side: Only viable via Capacitor native app or venue-managed WiFi analytics platform
- Minimum 3 APs needed for triangulation; 5–15m accuracy typical

**Type Definition (exists):**
```typescript
interface WiFiConfig {
  method: 'wifi';
  accessPoints: Array<{
    bssid: string;
    ssid: string;
    signalThreshold: number;
  }>;
}
```

---

### Tab 7: UWB (Ultra-Wideband) 🔜 PLACEHOLDER
**Icon:** `Target` | **Range:** ±10–50cm precision | **Cost:** $50–200/anchor

| Field | Type | Planned | Description |
|-------|------|---------|-------------|
| Anchor ID | text | 🔜 | UWB anchor identifier |
| X Position | number | 🔜 | Relative X coordinate (meters) |
| Y Position | number | 🔜 | Relative Y coordinate (meters) |
| Z Position | number | 🔜 | Height/floor level (optional) |
| Trigger Radius | slider (0.1–5m) | 🔜 | High-precision trigger zone |

**Browser Limitation:** No Web UWB API. Requires native app with Apple Nearby Interaction framework (iPhone 11+ U1 chip) or Android UWB API (Pixel 6 Pro+, Samsung S21+).

**Hardware:**
- Apple U1 chip (iPhone 11+)
- Decawave/Qorvo DW1000/DW3000 anchors
- Samsung Galaxy UWB devices (S21 Ultra+)

**Best For:**
- Premium installations with centimeter-level precision
- AR/VR overlay experiences
- Precise artifact proximity
- Research / visitor movement analytics

**Type Definition (exists):**
```typescript
interface UWBConfig {
  method: 'uwb';
  anchorId: string;
  x: number;
  y: number;
  z?: number;
  radius: number;
}
```

---

## 📦 Full Type Definitions (from `types/index.ts`)

### Positioning Method Union
```typescript
export type PositioningMethod =
  | 'qr_code'           // ✅ Implemented
  | 'gps'               // 🔜 Phase 3
  | 'ble_beacon'        // 🔜 Phase 4
  | 'ble_virtual'       // 🔜 Phase 4
  | 'nfc'               // ✅ Implemented
  | 'rfid'              // 🔜 Phase 5
  | 'wifi'              // 🔜 Phase 6
  | 'uwb'               // 🔜 Phase 6
  | 'image_recognition' // Future
  | 'audio_watermark'   // Future
  | 'manual';           // Future
```

### All Config Interfaces

```typescript
// ✅ IMPLEMENTED
interface QRCodeConfig {
  method: 'qr_code';
  url: string;          // Full visitor URL with tracking token
  shortCode: string;    // 6-char fallback code
}

interface NFCConfig {
  method: 'nfc';
  tagId: string;
  tagType?: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'MIFARE';
}

// ✅ IMPLEMENTED (Phase 3B — March 9, 2026)
interface GPSConfig {
  method: 'gps';
  latitude: number;
  longitude: number;
  radius: number;
  elevation?: number;
  mapProvider: 'google' | 'openstreetmap';
}

interface BLEBeaconConfig {
  method: 'ble_beacon' | 'ble_virtual';
  uuid: string;
  major: number;
  minor: number;
  txPower?: number;
  radius: number;
}

interface RFIDConfig {
  method: 'rfid';
  tagId: string;
  isActive: boolean;
  frequency?: 'LF' | 'HF' | 'UHF';
}

interface WiFiConfig {
  method: 'wifi';
  accessPoints: Array<{
    bssid: string;
    ssid: string;
    signalThreshold: number;
  }>;
}

interface UWBConfig {
  method: 'uwb';
  anchorId: string;
  x: number;
  y: number;
  z?: number;
  radius: number;
}

interface ImageRecognitionConfig {
  method: 'image_recognition';
  referenceImageUrl: string;
  confidence: number;    // 0-1
}

interface AudioWatermarkConfig {
  method: 'audio_watermark';
  watermarkId: string;
  frequency: number;     // Hz
}

interface ManualConfig {
  method: 'manual';
  instructions?: string;
}
```

### Trigger Settings
```typescript
export interface TriggerSettings {
  entryTrigger: boolean;
  exitTrigger: boolean;
  dwellTimeMs?: number;      // Time before triggering
  autoAdvanceMs?: number;    // Auto-advance to next stop
  notification: {
    sound: 'none' | 'chime' | 'ding' | 'bell';
    vibration: 'none' | 'short' | 'long' | 'pattern';
    visual: 'none' | 'banner' | 'modal' | 'subtle';
  };
}
```

---

## 🗄️ Database Architecture

### Prisma Schema (positioning-relevant fields)

```prisma
model Tour {
  primaryPositioningMethod   String    // 'qr_code', 'nfc', 'gps', etc.
  backupPositioningMethod    String?   // Fallback method
}

model Stop {
  primaryPositioning  String    // JSON string: {method, url, shortCode, ...}
  backupPositioning   String?   // JSON string: fallback config
  triggers            String    // JSON string: TriggerSettings
}

model AppSettings {
  positioning  String    // JSON: {estimoteApiKey, kontaktApiKey, customBleEnabled}
}
```

### Data Flow

```
Admin saves positioning config
  → JSON.stringify(config)
  → PUT /api/stops/:id { primaryPositioning: "{...}" }
  → Stored as string in SQLite

Visitor loads stop
  → GET /api/visitor/tour/:slug/stop/:slug
  → Server parses JSON: JSON.parse(stop.primaryPositioning)
  → Returns typed config to visitor client
  → Client renders stop content (positioning config available but not used for auto-trigger)
```

### URL Generation

```
Base URL: /visitor/tour/{tourSlug}/stop/{stopSlug}
QR Code:  + ?t={6-char-token}           (tracking)
NFC:      + ?src=nfc                     (source tracking)
Kiosk:    + ?kiosk=true&fullscreen=true  (kiosk mode)
Language: + ?lang=es                     (force language)
```

---

## 🛠️ Implementation Plan — Phased Ground Plan

### Phase 1: Tabbed Modal Infrastructure ✅ COMPLETE (Jan 24, 2026)
1. ~~Rename `QRCodeEditorModal.tsx` → `PositioningEditorModal.tsx`~~ ✅
2. ~~Add tab navigation UI with 7 tabs~~ ✅
3. ~~Keep QR Code tab fully functional~~ ✅
4. ~~Add placeholder tabs for other technologies~~ ✅

### Phase 2: NFC + QR ✅ COMPLETE (Mar 5, 2026)
1. ~~Move NFC to first tab position~~ ✅
2. ~~Auto-generate canonical visitor URL with `?src=nfc`~~ ✅
3. ~~Copy URL button for NFC Tools app~~ ✅
4. ~~Web NFC direct write (Chrome Android)~~ ✅
5. ~~Help modal with 3 pairing methods~~ ✅
6. ~~Test button to verify URL~~ ✅
7. ~~Tag details section (type, ID, short code)~~ ✅
8. ~~QR Code tab with live preview, download, regenerate~~ ✅

---

### Phase 3: Foundation Hardening + GPS ✅ COMPLETE (March 9, 2026)

GPS is the only auto-trigger method achievable in the browser (via `navigator.geolocation`). It also required building the visitor-side positioning infrastructure that every future method (BLE, WiFi, UWB) will need.

**All sub-phases (3A, 3B, 3C) completed March 9, 2026.**

---

#### Phase 3A: Positioning Infrastructure Fixes ✅ COMPLETE
**Goal:** Harden the data layer before adding GPS complexity  
**Completed:** March 9, 2026

##### 3A-1: Short Code O(1) Lookup

**Problem (found in `server/routes/visitor.ts` L167–195):**
```typescript
// CURRENT — O(n), parses JSON for every stop in the entire database
const stops = await prisma.stop.findMany();
for (const stop of stops) {
  const positioning = JSON.parse(stop.primaryPositioning);
  if (positioning.shortCode === shortCode) { ... }
}
```

**Fix — Add indexed `shortCode` column:**

Step 1: Add column via raw SQL (safe, no `prisma migrate`):
```sql
-- Run against BOTH databases:
ALTER TABLE Stop ADD COLUMN shortCode TEXT;
CREATE UNIQUE INDEX Stop_shortCode_key ON Stop(shortCode);
```

Step 2: Backfill from existing JSON:
```typescript
// One-time migration script (scripts/backfill-shortcodes.ts)
const stops = await prisma.stop.findMany();
for (const stop of stops) {
  const config = JSON.parse(stop.primaryPositioning);
  if (config.shortCode) {
    await prisma.$executeRaw`UPDATE Stop SET shortCode = ${config.shortCode} WHERE id = ${stop.id}`;
  }
}
```

Step 3: Update schema.prisma (types only, then `npx prisma generate`):
```prisma
model Stop {
  shortCode  String?  @unique
}
```

Step 4: Replace the lookup handler:
```typescript
// NEW — O(1) indexed lookup
router.get('/s/:shortCode', async (req, res) => {
  const stop = await prisma.stop.findFirst({
    where: { shortCode: req.params.shortCode },
    include: { tour: true },
  });
  if (!stop || !stop.tour) return res.status(404).json({ error: 'Short code not found' });
  res.json({
    redirectUrl: `/visitor/tour/${stop.tour.slug}/stop/${stop.slug}`,
    tourSlug: stop.tour.slug,
    stopSlug: stop.slug,
  });
});
```

Step 5: Keep `shortCode` in sync — when stops.ts creates/regenerates a short code, also write to the indexed column.

**Files:**
- `prisma/schema.prisma` — Add `shortCode` column
- `server/routes/visitor.ts` — Replace O(n) handler
- `server/routes/stops.ts` — Write shortCode column on create/update
- New: `scripts/backfill-shortcodes.ts` — One-time migration

##### 3A-2: Positioning Config Validation (Zod)

**Problem:** `primaryPositioning` and `backupPositioning` are stringified JSON saved/loaded without any shape validation. A malformed save silently corrupts; a bad parse crashes the visitor page.

**Fix — Zod schemas matching the TypeScript interfaces:**

```typescript
// New file: server/validation/positioning.ts
import { z } from 'zod';

const QRCodeConfigSchema = z.object({
  method: z.literal('qr_code'),
  url: z.string().url(),
  shortCode: z.string().length(6),
});

const NFCConfigSchema = z.object({
  method: z.literal('nfc'),
  tagId: z.string(),
  tagType: z.enum(['NTAG213', 'NTAG215', 'NTAG216', 'MIFARE']).optional(),
});

const GPSConfigSchema = z.object({
  method: z.literal('gps'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radius: z.number().min(1).max(1000),
  elevation: z.number().optional(),
  mapProvider: z.enum(['google', 'openstreetmap']),
});

const BLEBeaconConfigSchema = z.object({
  method: z.enum(['ble_beacon', 'ble_virtual']),
  uuid: z.string().uuid(),
  major: z.number().int().min(0).max(65535),
  minor: z.number().int().min(0).max(65535),
  txPower: z.number().optional(),
  radius: z.number().min(0),
});

// Union discriminated by `method` field
export const PositioningConfigSchema = z.discriminatedUnion('method', [
  QRCodeConfigSchema,
  NFCConfigSchema,
  GPSConfigSchema,
  BLEBeaconConfigSchema,
  // Add others as tabs get implemented
]);
```

**Usage in stops.ts PUT handler:**
```typescript
if (data.primaryPositioning) {
  const result = PositioningConfigSchema.safeParse(data.primaryPositioning);
  if (!result.success) return res.status(400).json({ error: 'Invalid positioning config', details: result.error.issues });
  updateData.primaryPositioning = JSON.stringify(result.data);
}
```

**Usage in visitor.ts (safe parse on read):**
```typescript
const parsed = PositioningConfigSchema.safeParse(JSON.parse(stop.primaryPositioning));
// If invalid, fall back gracefully instead of crashing
```

**Files:**
- New: `server/validation/positioning.ts` — Zod schemas
- `server/routes/stops.ts` — Validate on write
- `server/routes/visitor.ts` — Safe parse on read

##### 3A-3: URL Param Analytics Capture

**Problem:** `?t={token}` (QR tracking) and `?src=nfc|qr` (source) are in every visitor URL but never logged server-side.

**Fix — Lightweight logging middleware in visitor routes:**

```typescript
// In server/routes/visitor.ts — add to GET /tour/:slug/stop/:slug
const trackingToken = req.query.t as string | undefined;
const source = req.query.src as string | undefined;

if (trackingToken || source) {
  // Non-blocking fire-and-forget log
  prisma.visitLog.create({
    data: {
      id: crypto.randomUUID(),
      stopId: stop.id,
      tourId: tour.id,
      token: trackingToken || null,
      source: source || null,       // 'nfc', 'qr', 'gps', etc.
      timestamp: new Date(),
      userAgent: req.headers['user-agent'] || null,
    },
  }).catch(() => {}); // Don't fail the request on analytics error
}
```

**Schema addition (raw SQL):**
```sql
CREATE TABLE VisitLog (
  id TEXT PRIMARY KEY,
  stopId TEXT NOT NULL,
  tourId TEXT NOT NULL,
  token TEXT,
  source TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  userAgent TEXT,
  FOREIGN KEY (stopId) REFERENCES Stop(id),
  FOREIGN KEY (tourId) REFERENCES Tour(id)
);
CREATE INDEX VisitLog_stopId_idx ON VisitLog(stopId);
CREATE INDEX VisitLog_tourId_idx ON VisitLog(tourId);
CREATE INDEX VisitLog_timestamp_idx ON VisitLog(timestamp);
```

**Files:**
- `prisma/schema.prisma` — Add VisitLog model
- `server/routes/visitor.ts` — Insert log on stop view
- Future: analytics dashboard to query VisitLog

##### 3A-4: Backup Positioning Fallback Logic

**Problem:** `backupPositioning` exists in schema, API, and admin save — but the visitor client never uses it. Field is returned but ignored.

**Fix — Define fallback behavior, implement on visitor side:**

**Fallback rules:**
1. GPS configured but location permission denied → fall back to backup (QR/NFC)
2. GPS configured but device has no GPS (desktop) → show backup
3. BLE configured but no beacon detected within timeout → show backup
4. Any method fails → if backup exists, show "Try scanning the QR code instead" prompt

**Implementation in VisitorStop.tsx:**
```typescript
// After positioning method fails or is unavailable:
const backup = stop.backupPositioning;
if (backup) {
  // Show non-intrusive banner: "Can't detect your position automatically.
  //   Scan the QR code or tap the NFC tag at this exhibit."
  setFallbackMode(true);
}
```

This is lightweight now (just UI affordance) and becomes critical when GPS auto-trigger lands in 3C.

**Files:**
- `src/pages/VisitorStop.tsx` — Fallback banner UI
- `src/components/PositioningEditorModal.tsx` — Make backup method selectable per stop (future, not blocking)

---

#### Phase 3B: GPS Admin Tab — Map Integration ✅ COMPLETE
**Goal:** Curators can set a GPS pin + geofence radius per stop, using the existing map infrastructure  
**Completed:** March 9, 2026

##### Existing Map Assets (Audit Summary)

The map system is mature with two parallel rendering paths:

| Component | File | What It Does | Reusable For GPS? |
|-----------|------|-------------|-------------------|
| **MapEditorModal** | `blocks/MapEditorModal.tsx` (950 lines) | Full-screen map editor with 8 sidebar panels | ✅ Core — embed directly or extract |
| **MapPreview** | `blocks/MapPreview.tsx` (330 lines) | Visitor-side map with OSM + Google | ✅ Preview in GPS tab |
| **MapBlockEditor** | `blocks/MapBlockEditor.tsx` (130 lines) | Wrapper that opens MapEditorModal | ✅ Pattern to follow |
| **MapBlockData type** | `types/index.ts` L416–466 | Full map config including triggerRadius | ✅ Already has geofence fields |

**MapEditorModal sidebar features already built:**

| Feature | Status | GPS Tab Needs It? |
|---------|--------|-------------------|
| Address search (Nominatim geocoder) | ✅ Built | ✅ Yes — search by address |
| Get Current Location button | ✅ Built | ✅ Yes — one-tap GPS capture |
| Manual lat/lng entry | ✅ Built | ✅ Yes — precise coordinates |
| Click-to-place marker (draggable) | ✅ Built | ✅ Yes — map pin placement |
| Trigger radius slider (5–200m) | ✅ Built | ✅ Yes — geofence visualization |
| Purple circle overlay (Leaflet L.circle) | ✅ Built | ✅ Yes — visual radius |
| Map provider toggle (OSM/Google) | ✅ Built | ✅ Yes — provider preference |
| Style selector (standard/sat/terrain/hybrid) | ✅ Built | ✅ Yes — curator preference |
| Zoom slider (1–20) | ✅ Built | ✅ Yes |
| Display size selector | ✅ Built | ❌ Not needed for GPS config |
| Marker title (multilingual) | ✅ Built | ❌ Not needed |

**Key insight:** MapEditorModal already does ~90% of what the GPS tab needs. The GPS tab should embed/reuse MapEditorModal rather than rebuild map editing.

##### GPS Tab Implementation Steps

**Step 1: Extract reusable map editor from MapEditorModal**

Two approaches (recommend Option A):

**Option A — Inline GPS map editor in the tab:**
- Open MapEditorModal as sub-modal from GPS tab (same pattern as MapBlockEditor)
- GPS tab shows a static map preview + summary of configured location
- "Edit Location" button opens the full map editor
- On save, extract lat/lng/radius/provider → write to GPSConfig

**Option B — Embed map components inline:**
- Copy Leaflet map initialization + marker + circle into GPS tab directly
- More integrated UX but significant code duplication

**Step 2: GPS tab UI layout**

```
┌─────────────────────────────────────────┐
│ GPS Positioning                         │
├─────────────────────────────────────────┤
│                                         │
│  [Map Preview — 300px height]           │
│  ┌─────────────────────────────────┐    │
│  │  📍 Marker + purple radius     │    │
│  │     circle on map              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📍 40.7128°N, 74.0060°W              │
│  Radius: 25m | Provider: OpenStreetMap  │
│                                         │
│  [📍 Get Current Location]             │
│  [🗺️ Open Map Editor]                 │
│                                         │
│  ─── Geofence Settings ───             │
│  Trigger Radius: [====●====] 25m       │
│  Provider: [OSM] [Google]               │
│                                         │
│  ─── Coordinates ───                   │
│  Lat: [40.712800  ] Lng: [-74.006000]  │
│                                         │
│  ─── Address Search ───                │
│  [Search by address...        ] [🔍]   │
│                                         │
└─────────────────────────────────────────┘
```

**Step 3: Data flow**

```
GPS Tab UI
  ├─ State: gpsConfig: GPSConfig (local)
  ├─ "Get Current Location" → navigator.geolocation → update lat/lng
  ├─ "Open Map Editor" → MapEditorModal → returns {lat, lng, radius, provider, style}
  ├─ Address search → Nominatim API → update lat/lng
  ├─ Manual coordinate inputs → update lat/lng
  ├─ Radius slider → update radius
  ├─ Provider toggle → update mapProvider
  └─ On parent save → JSON.stringify(gpsConfig) → stop.primaryPositioning
```

**Step 4: Save to positioning config**

```typescript
// GPS tab produces:
const gpsConfig: GPSConfig = {
  method: 'gps',
  latitude: 40.7128,
  longitude: -74.006,
  radius: 25,
  mapProvider: 'openstreetmap',
};
// Saved as: stop.primaryPositioning = JSON.stringify(gpsConfig)
```

**Step 5: Validate with Zod (from 3A-2)**

```typescript
// GPS-specific validation (in PositioningConfigSchema)
GPSConfigSchema.parse(gpsConfig);
// Catches: lat outside -90..90, lng outside -180..180, negative radius
```

##### Dependencies (npm — already installed)

| Package | Version | Status |
|---------|---------|--------|
| `leaflet` | ^1.9.4 | ✅ Installed |
| `react-leaflet` | ^5.0.0 | ✅ Installed |
| `@react-google-maps/api` | ^2.20.8 | ✅ Installed |

No new dependencies needed.

##### Files to Create/Modify

| File | Action | What Changes |
|------|--------|-------------|
| `PositioningEditorModal.tsx` | Modify | Replace GPS placeholder with map-based editor, import MapEditorModal |
| `server/routes/stops.ts` | Modify | Handle GPS method in create/update (validate GPSConfig) |
| `types/index.ts` | No change | GPSConfig already defined |

---

#### Phase 3C: Visitor-Side GPS Geofencing ✅ COMPLETE
**Goal:** Visitor's browser monitors GPS position and auto-triggers stops within geofence radius  
**Completed:** March 9, 2026

##### Architecture: Geolocation Service

```
VisitorTour / VisitorStop page
  └─ useGeofenceMonitor(tour) hook
       ├─ Fetches all GPS-enabled stops for tour (new API endpoint)
       ├─ Calls navigator.geolocation.watchPosition()
       ├─ On each position update:
       │   ├─ Calculate distance to each stop (Haversine formula)
       │   ├─ Check if within any stop's triggerRadius
       │   ├─ Fire enter/exit events on state change
       │   └─ Debounce to avoid jitter (±5m hysteresis)
       ├─ On enter event:
       │   ├─ Apply trigger settings (notification sound/vibration/visual)
       │   ├─ Auto-navigate to stop (if configured)
       │   └─ Log event to VisitLog (fire-and-forget)
       └─ On error/denied:
            └─ Show fallback banner (from 3A-4)
```

##### Step 1: Server endpoint — GPS stops batch

```typescript
// server/routes/visitor.ts
// GET /api/visitor/tour/:slug/stops/gps
// Returns all stops with GPS positioning for batch geofence setup
router.get('/tour/:tourSlugOrId/stops/gps', async (req, res) => {
  const tour = await findTourBySlugOrId(req.params.tourSlugOrId);
  if (!tour) return res.status(404).json({ error: 'Tour not found' });

  const stops = await prisma.stop.findMany({
    where: { tourId: tour.id },
    orderBy: { order: 'asc' },
  });

  const gpsStops = stops
    .map(s => ({ ...s, positioning: JSON.parse(s.primaryPositioning) }))
    .filter(s => s.positioning.method === 'gps')
    .map(s => ({
      id: s.id,
      slug: s.slug,
      title: s.title,
      order: s.order,
      latitude: s.positioning.latitude,
      longitude: s.positioning.longitude,
      radius: s.positioning.radius,
    }));

  res.json({ tourSlug: tour.slug, stops: gpsStops });
});
```

##### Step 2: Haversine distance utility

```typescript
// src/lib/geo.ts
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

##### Step 3: Geofence monitor hook

```typescript
// src/hooks/useGeofenceMonitor.ts
// Core logic:
// 1. watchPosition with enableHighAccuracy: true
// 2. On each update → haversineDistance to each GPS stop
// 3. Track entered/exited state per stop (Set<stopId>)
// 4. Hysteresis: enter at radius, exit at radius + 5m buffer
// 5. Fire callbacks: onEnter(stop), onExit(stop)
// 6. Battery strategy: if speed < 0.5m/s for 30s → reduce to low accuracy
// 7. Cleanup: clearWatch on unmount
```

##### Step 4: Permission request UI

```tsx
// Show before activating geofencing:
<GeofencePermissionBanner
  onAllow={() => startMonitoring()}
  onDeny={() => setFallbackMode(true)}
>
  "This tour uses GPS to automatically guide you to each stop.
   Allow location access for the best experience."
</GeofencePermissionBanner>
```

##### Step 5: Trigger settings integration

When a geofence enter fires, apply the stop's `TriggerSettings`:
- `notification.sound` → play chime/ding/bell
- `notification.vibration` → `navigator.vibrate()`
- `notification.visual` → banner/modal/subtle indicator
- `entryTrigger: true` → auto-navigate to stop
- `dwellTimeMs` → delay trigger until visitor has been in zone for X ms

##### Step 6: Visual tracking indicator

Show a persistent but non-intrusive indicator when GPS monitoring is active:
```
┌──────────────────────────────────┐
│ 📍 GPS active • 3 stops nearby  │
└──────────────────────────────────┘
```

##### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| New: `src/lib/geo.ts` | Create | Haversine formula + geo utilities |
| New: `src/hooks/useGeofenceMonitor.ts` | Create | watchPosition + geofence engine |
| `src/pages/VisitorStop.tsx` | Modify | Integrate geofence hook, permission UI, fallback |
| `src/pages/VisitorTour.tsx` | Modify | Tour-level geofence for multi-stop monitoring |
| `server/routes/visitor.ts` | Modify | Add `/stops/gps` batch endpoint |

---

### Phase 4: BLE Beacon Tab
**Goal:** Admin config UI for beacon assignments (visitor scanning requires native app)  
**Effort:** ~2 days  
**Depends on:** Phase 3A (Zod validation)

**Admin Side (Editor Tab) — what we can build now:**
1. UUID input with per-venue default (seeded from AppSettings `estimoteApiKey`/`kontaktApiKey`)
2. Major/Minor number inputs with validation (0–65535)
3. TX Power selector with explanation (-59 dBm standard)
4. Trigger radius slider (1–10m) with visual indicator
5. Beacon brand selector (Estimote / Kontakt.io / Custom / DIY ESP32)
6. "Generate Programming Instructions" — Exportable setup guide per beacon brand
7. Beacon assignment summary: which Minor → which Stop across the tour

**Future (Requires Capacitor App — separate project):**
1. Native BLE scanning (CoreBluetooth on iOS, Android BLE)
2. iBeacon region monitoring (background detection)
3. Proximity zones: immediate (<1m), near (1–3m), far (3–10m)
4. Push notification on beacon detection
5. Fleet health monitoring dashboard

**Files:**
- `PositioningEditorModal.tsx` — Replace BLE placeholder with config form
- `server/routes/stops.ts` — Validate BLEBeaconConfig on save
- Future: `BeaconAssignmentView.tsx` — Tour-wide beacon map

### Phase 5: RFID Tab
**Goal:** Config-only tab for recording RFID tag assignments  
**Effort:** ~1 day

1. Tag ID input with format validation per frequency band
2. Active/Passive toggle with range explanation
3. Frequency band selector (LF / HF / UHF)
4. Integration notes field (for linking to external RFID system)
5. Export tag assignment list (CSV for RFID management systems)

### Phase 6: WiFi + UWB Tabs
**Goal:** Professional installation config for enterprise venues  
**Effort:** ~2 days

**WiFi:**
1. Access Point list editor (BSSID, SSID, signal threshold)
2. Minimum 3 APs warning
3. Floor plan upload for AP placement visualization (future)

**UWB:**
1. Anchor ID + XYZ coordinate inputs
2. Trigger radius slider (0.1–5m)
3. Relative coordinate system setup
4. Floor plan overlay for anchor placement (future)

---

## 📅 Phase 3 Execution — Completed March 9, 2026

### Phase 3 Acceptance Criteria (All Met ✅)

**3A-1 ✅:** Short code lookup uses indexed `shortCode` column, O(1) via `findFirst()`  
**3A-2 ✅:** Zod discriminated union validates all positioning configs on save — invalid returns 400  
**3A-3 ✅:** VisitLog table logs `?t=` and `?src=` params with stopId, tourId, timestamp, userAgent  
**3A-4 ✅:** Visitor sees contextual fallback banner when primary positioning unavailable  
**3B ✅:** Curator can open GPS tab, set location via map/geolocation/address, set radius, save — config persists on reload  
**3C ✅:** Visitor on GPS tour gets auto-navigated when walking within a stop's trigger radius

---

## 🐛 Known Issues & Technical Debt

### Phase 3A Issues — All Resolved ✅

| ID | Issue | Resolution |
|----|-------|-----------|
| 3A-1 | Short code O(n) lookup | ✅ Indexed `shortCode` column with `findFirst()` — O(1) |
| 3A-2 | No positioning config validation | ✅ Zod discriminated union in `server/validation/positioning.ts` |
| 3A-3 | URL params not captured | ✅ VisitLog table captures `?t=` and `?src=` params |
| 3A-4 | Backup positioning unused | ✅ Fallback banner in VisitorStop.tsx |

### Remaining After Phase 3

| Issue | Severity | Description | Resolution Timeline |
|-------|----------|-------------|---------------------|
| No visitor position monitoring (BLE/WiFi/UWB) | — | Requires Capacitor native app wrapper | Phase 4+ / separate project |
| QR Scanner Block mode testing | LOW | 4 modes defined (navigate/checkin/scavenger/info) — unclear if all work | Verify during Phase 3 testing |
| Google Maps API key management | LOW | Key fetched from localStorage or `/api/settings` — no validation or expiry | Settings improvement sprint |
| Leaflet marker icon bundler workaround | LOW | CDN URLs hardcoded for marker icons (MapPreview.tsx) | Bundle icons locally |
| No marker clustering | LOW | `leaflet.markercluster` mentioned in spec but not installed | When tours have 50+ GPS stops |

---

## 🎨 UI Design Notes

### Tab Bar
- Horizontal scrollable tabs on mobile
- Icon + Label for each technology
- Active tab: accent color underline
- Disabled/placeholder tabs: muted with "Coming Soon" badge
- Tab order: NFC → QR Code → GPS → BLE → RFID → WiFi → UWB

### Placeholder Tab Content
Each placeholder tab shows:
1. Technology icon (large, centered)
2. Technology name and brief description
3. Key use cases as pills/badges
4. "Coming Soon" amber badge
5. Technology-specific hint (e.g., GPS mentions Map Block integration)

### Save Behavior
- Primary method stored in `stop.primaryPositioning` (JSON string)
- Backup method in `stop.backupPositioning` (JSON string, optional)
- Trigger settings in `stop.triggers` (JSON string)
- Tour-level default in `tour.primaryPositioningMethod`

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| **Types & Validation** | |
| `src/types/index.ts` | All positioning config types, MapBlockData, TriggerSettings |
| `server/validation/positioning.ts` | ✅ Zod schemas for positioning config validation |
| **Admin Components** | |
| `src/components/PositioningEditorModal.tsx` | 7-tab positioning editor modal (NFC + QR + GPS built, 4 placeholder) |
| `src/components/blocks/MapBlockEditor.tsx` | Map block wrapper — opens MapEditorModal |
| `src/components/blocks/MapEditorModal.tsx` | Full-screen map editor (950 lines — address search, click-to-place, trigger radius, provider toggle) |
| `src/components/blocks/MapPreview.tsx` | Map renderer — dual OSM/Google path (330 lines) |
| `src/components/blocks/PositioningBlockEditor.tsx` | QR/positioning as content block |
| `src/components/blocks/QRScannerBlockEditor.tsx` | Camera QR scanner config (4 modes) |
| `src/components/blocks/QRScannerBlockPreview.tsx` | Visitor-side QR scanner |
| **Visitor Pages** | |
| `src/pages/VisitorStop.tsx` | Visitor stop page — geofence integration, permission UI, fallback banner |
| `src/pages/VisitorTour.tsx` | Visitor tour page — tour-level geofence monitoring |
| `src/pages/TourDetail.tsx` | Admin — opens PositioningEditorModal |
| **Files Added (Phase 3)** | |
| `src/lib/geo.ts` | ✅ Haversine distance + `isInsideGeofence()` utility |
| `src/hooks/useGeofenceMonitor.ts` | ✅ GPS watchPosition + geofence engine + auto-navigate |
| `server/validation/positioning.ts` | ✅ Zod schemas — discriminated union for all positioning configs |
| **Server** | |
| `server/routes/visitor.ts` | Visitor API + short code resolution (O(1) indexed) + VisitLog + GPS stops endpoint |
| `server/routes/stops.ts` | Stop CRUD with positioning save/load |
| `server/routes/tours.ts` | Tour-level positioning method config |
| **Database** | |
| `prisma/schema.prisma` | Stop.primaryPositioning, Tour.primaryPositioningMethod, Stop.shortCode, VisitLog |
| **Documentation** | |
| `tourstack.md` | Full product spec with positioning phases |
| `docs/map-block-spec.md` | Comprehensive map block specification (1470 lines) |
| `beacon-dev.md` | BLE beacon development roadmap (664 lines) |
| `nfc-tag-dev.md` | NFC tag implementation details (800 lines) |

---

## 📝 Architecture Notes

### Positioning Data Model
- Tour-level `primaryPositioningMethod` sets the default for new stops
- Each stop can override with its own method via the Positioning Editor
- QR Code is always available as universal fallback (every stop gets a URL + short code)
- NFC and QR share the same short code (one code per stop, method-agnostic)
- Visitor URLs are slug-based and method-agnostic: `/visitor/tour/{slug}/stop/{slug}`
- Source tracking via URL params (`?src=nfc`, `?t=token`) — capture in VisitLog (Phase 3A-3)
- Mobile visitor app (future Capacitor wrapper) required for BLE/WiFi/UWB auto-trigger
- GPS is the only auto-trigger method achievable in browser (via Geolocation API)

### Map System Architecture
- **Dual rendering:** OpenStreetMap (Leaflet) and Google Maps supported in parallel
- **MapEditorModal** (~600 lines) is the fully-featured map editor — address search, click-to-place, draggable markers, trigger radius circles, provider toggle, style selector, zoom control
- **Floating map controls:** Provider toggle (OSM/Google) and style selector float as a semi-transparent overlay at top-center of the map (z-1000), separated from the Done button in the header for cleaner UX
- **MapPreview** (330 lines) renders maps visitor-side with identical dual-path rendering
- **Trigger zone visualization** already built: purple `L.circle()` overlay with configurable radius (5–200m)
- **radiusToZoom auto-sync:** `radiusToZoom()` in PositioningEditorModal maps trigger radius to appropriate zoom level (≤10m→18, ≤25m→17, ≤50m→16, ≤100m→15, ≤200m→14, else→13) — replaces hardcoded zoom
- **Leaflet tiles:** Standard (OSM), Satellite (Esri), Terrain (OpenTopoMap)
- **Google Maps tiles:** Roadmap, Satellite, Terrain, Hybrid — loaded via `mt0-mt3.google.com` tile servers in Leaflet
- **Google Maps API key** loaded from localStorage or `/api/settings`
- **No new npm dependencies needed** for GPS tab — leaflet, react-leaflet, @react-google-maps/api all installed
- **Help Center:** GPS Geofencing page added to Docs.tsx (`/docs/gps-geofencing`) with setup guide, settings reference, and best practices

### Browser API Availability Matrix

| API | iOS Safari | Chrome Android | Chrome Desktop | Use Case |
|-----|-----------|---------------|---------------|----------|
| Geolocation | ✅ | ✅ | ✅ | GPS positioning |
| Web NFC (NDEFReader) | ❌ | ✅ | ❌ | NFC tag writing |
| Web Bluetooth | ❌ | ⚠️ Partial | ⚠️ Partial | BLE — can't scan beacons |
| Vibration | ❌ | ✅ | ❌ | Trigger notifications |
| Fullscreen | ✅ | ✅ | ✅ | Kiosk mode |
