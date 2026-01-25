# Positioning Technology Editor - Development Plan

**Created:** January 24, 2026  
**Status:** ✅ Phase 1 Complete (Tabbed UI)  
**Component:** `PositioningEditorModal.tsx`

---

## Overview

The Stop Positioning Editor is a tabbed modal that allows curators to configure how visitors trigger each stop. TourStack supports **7 core positioning technologies**, with each stop having a **primary** method and optional **secondary/fallback** methods.

---

## 🎯 Current State

- **PositioningEditorModal.tsx** - Tabbed modal with 7 technology tabs
- **QR Code tab** - Fully implemented with URL, short code, download
- **Other tabs** - Placeholder UI with "Coming Soon" badges
- **Types defined** - All positioning configs exist in `types/index.ts`

---

## 📋 Positioning Technologies & Tab Design

### Tab 1: QR Code ✅ COMPLETE
**Icon:** `QrCode`  
**Use Case:** Zero-cost deployment, works everywhere

| Field | Type | Description |
|-------|------|-------------|
| Target URL | text | URL visitors go to when scanning |
| Short Code | text (auto-gen) | Manual entry fallback (e.g., "ABC123") |
| QR Preview | image | Live QR code preview |
| Download | button | Download high-res QR for printing |

**Signage Tips:**
- Print at least 1.5" × 1.5" for easy scanning
- Place at eye level, 3-4 feet from exhibit
- Include short code as backup

---

### Tab 2: GPS 🔜 PLACEHOLDER
**Icon:** `MapPin`  
**Use Case:** Outdoor exhibits, sculpture gardens, archaeological sites

| Field | Type | Description |
|-------|------|-------------|
| Latitude | number | GPS latitude coordinate |
| Longitude | number | GPS longitude coordinate |
| Trigger Radius | slider (5-100m) | Geofence radius in meters |
| Map Preview | map | Interactive map with marker + radius circle |
| Get Current Location | button | Capture current GPS position |

**Best For:**
- Outdoor walking tours
- Garden/nature exhibits  
- Archaeological sites
- City landmark tours

---

### Tab 3: BLE Beacon 🔜 PLACEHOLDER
**Icon:** `Radio`  
**Use Case:** Indoor positioning with Bluetooth Low Energy beacons

| Field | Type | Description |
|-------|------|-------------|
| UUID | text | Beacon UUID (usually shared per venue) |
| Major | number | Major value (typically floor/zone) |
| Minor | number | Minor value (unique per beacon) |
| TX Power | number | Transmission power for range calibration |
| Trigger Radius | slider (1-10m) | Estimated trigger distance |

**Configuration Tips:**
- UUID: One per museum (e.g., `f7826da6-4fa2-4e98-8024-bc5b71e0893e`)
- Major: Use for floor/wing grouping (1 = Ground Floor, 2 = Second Floor)
- Minor: Unique ID per beacon (1, 2, 3...)
- TX Power: -59 dBm is standard for iBeacon

**Supported Beacon Brands:**
- Estimote
- Kontakt.io
- Gimbal
- RadBeacon
- Custom hardware

---

### Tab 4: NFC 🔜 PLACEHOLDER
**Icon:** `Smartphone`  
**Use Case:** Tap-to-trigger interaction (0-4cm range)

| Field | Type | Description |
|-------|------|-------------|
| Tag ID | text (auto-gen) | Unique NFC tag identifier |
| Tag Type | select | NTAG213, NTAG215, NTAG216, MIFARE |
| Payload URL | text | URL written to NFC tag |
| Generate New ID | button | Generate unique tag ID |

**Best For:**
- Artifact labels (small, discreet)
- Interactive exhibits
- Kids' discovery zones
- Accessibility stations

**Tag Recommendations:**
- NTAG213: 144 bytes, ideal for short URLs
- NTAG215: 504 bytes, medium content
- NTAG216: 888 bytes, extended content
- MIFARE: Legacy systems, higher security

---

### Tab 5: RFID 🔜 PLACEHOLDER
**Icon:** `Scan`  
**Use Case:** Medium-range triggering (1-100ft with powered tags)

| Field | Type | Description |
|-------|------|-------------|
| Tag ID | text | RFID tag identifier |
| Tag Mode | toggle | Active (powered) / Passive |
| Frequency Band | select | LF (125kHz), HF (13.56MHz), UHF (860-960MHz) |
| Read Range | slider | Expected read distance |

**Use Cases:**
- Artifact tracking + visitor triggers
- Multi-object detection
- High-throughput areas
- Integration with existing museum systems

---

### Tab 6: WiFi 🔜 PLACEHOLDER
**Icon:** `Wifi`  
**Use Case:** Leverages existing WiFi infrastructure

| Field | Type | Description |
|-------|------|-------------|
| Access Points | list | Configure nearby APs for triangulation |
| └─ BSSID | text | AP MAC address |
| └─ SSID | text | Network name (display only) |
| └─ Signal Threshold | slider (-90 to -30 dBm) | Trigger when signal exceeds |

**Configuration:**
- Minimum 3 APs for triangulation
- Signal strength thresholds for zone detection
- Works with existing infrastructure
- 5-15 meter accuracy typical

---

### Tab 7: UWB (Ultra-Wideband) 🔜 PLACEHOLDER
**Icon:** `Target`  
**Use Case:** Highest precision positioning (±10-50cm)

| Field | Type | Description |
|-------|------|-------------|
| Anchor ID | text | UWB anchor identifier |
| X Position | number | Relative X coordinate (meters) |
| Y Position | number | Relative Y coordinate (meters) |
| Z Position | number | Height/floor level (optional) |
| Trigger Radius | slider (0.1-5m) | High-precision trigger zone |

**Best For:**
- Premium installations
- AR/VR experiences
- Precise artifact positioning
- Research and analytics

**Hardware:**
- Apple U1 chip (iPhone 11+)
- Decawave/Qorvo anchors
- Samsung Galaxy UWB devices

---

## 🛠️ Implementation Plan

### Phase 1: Tabbed Modal Infrastructure ✅ COMPLETE (Jan 24, 2026)
1. ~~Rename `QRCodeEditorModal.tsx` → `PositioningEditorModal.tsx`~~ ✅
2. ~~Add tab navigation UI~~ ✅
3. ~~Keep QR Code tab fully functional~~ ✅
4. ~~Add placeholder tabs for other technologies~~ ✅

### Phase 2: GPS Tab (uses existing Map Block code) 🔜 NEXT
- Reuse Leaflet/Google Maps from MapBlockEditor
- Add geofence radius visualization
- "Get Current Location" button

### Phase 3: BLE Beacon Tab
- UUID/Major/Minor input fields
- Beacon scanning integration (future mobile app)
- Signal strength simulator

### Phase 4: NFC/RFID Tabs
- Tag ID generators
- Type selectors
- Programming instructions

### Phase 5: WiFi/UWB Tabs
- Advanced configuration
- Multi-point setup
- Professional installation guides

---

## 📦 Type Definitions (Already in `types/index.ts`)

```typescript
// All types already defined:
export type PositioningMethod =
  | 'qr_code'
  | 'gps'
  | 'ble_beacon'
  | 'ble_virtual'
  | 'nfc'
  | 'rfid'
  | 'wifi'
  | 'uwb'
  | 'image_recognition'
  | 'audio_watermark'
  | 'manual';

export interface GPSConfig {
  method: 'gps';
  latitude: number;
  longitude: number;
  radius: number;
  elevation?: number;
  mapProvider: 'google' | 'openstreetmap';
}

export interface BLEBeaconConfig {
  method: 'ble_beacon' | 'ble_virtual';
  uuid: string;
  major: number;
  minor: number;
  txPower?: number;
  radius: number;
}

// ... etc (see types/index.ts for full definitions)
```

---

## 🎨 UI Design Notes

### Tab Bar
- Horizontal scrollable tabs on mobile
- Icon + Label for each technology
- Active tab: accent color underline
- Disabled/placeholder tabs: muted with "Coming Soon" badge

### Placeholder Tab Content
Each placeholder tab shows:
1. Technology icon (large, centered)
2. Technology name and brief description
3. Key use cases as bullet points
4. "Coming Soon" badge
5. Link to documentation

### Save Behavior
- Saves ALL configured positioning methods
- Primary method stored in `stop.primaryPositioning`
- Secondary methods in `stop.secondaryPositioning[]` (future)

---

## 🔗 Related Files

| File | Purpose |
|------|---------|
| `types/index.ts` | All positioning config types |
| `PositioningEditorModal.tsx` | Multi-tab positioning editor |
| `TourDetail.tsx` | Opens modal via positioning button |
| `MapBlockEditor.tsx` | Map components to reuse for GPS |
| `tourstack.md` | Full positioning technology specs |

---

## 📝 Notes

- Tour-level setting determines PRIMARY positioning method
- Each stop can override with its own method
- QR Code always available as universal fallback
- Mobile visitor app (future) handles actual beacon detection
