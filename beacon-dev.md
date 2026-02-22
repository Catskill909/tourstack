# Beacon Development — TourStack Brainstorm & Roadmap

## Vision

BLE beacons transform TourStack from a "scan to view" experience into a **proximity-aware, AI-guided platform**. Visitors walk through a space and content finds *them* — stops auto-trigger, the AI concierge knows where they are, analytics capture real movement patterns, and the entire visit becomes a living, responsive journey.

Beyond visitor-facing features, TourStack should offer a **full beacon management suite**: provisioning, programming, monitoring, fleet health, and spatial mapping — making it a one-stop tool for museums and venues deploying beacon infrastructure.

---

## Current State

### What We Have
- **Positioning type system** with `ble_beacon` config already defined (`uuid`, `major`, `minor`, `txPower`, `radius`)
- **Trigger system** with entry/exit triggers, dwell time, auto-advance, and notification settings
- **QR Code** fully implemented as reference pattern (scanner block, positioning block, short codes)
- **Kiosk mode** with auto-start capabilities and idle timeout
- **Content block architecture** — modular, composable, device-aware
- **AI Concierge** infrastructure (chat, collections, quick actions)
- **Settings placeholders** for Estimote API key, Kontakt API key, custom BLE toggle

### What's Needed
- Web Bluetooth API integration (scanning/programming)
- Beacon detection service (background scanning)
- Beacon management CRUD + fleet dashboard
- Proximity engine (RSSI → distance → trigger logic)
- Analytics pipeline (movement, dwell, heatmaps)
- AI integration (location-aware concierge)

---

## Scaled Pricing — Hardware Options by Budget

The beacon world ranges from $0 (virtual) to $50+ (enterprise). Here's everything organized by cost tier so you can start testing for almost nothing and scale up as needed.

### Tier 0: Free — Virtual Beacons (No Hardware)

Turn any phone, laptop, or Raspberry Pi into a beacon broadcaster. **Perfect for development and testing.**

#### Android — Beacon Simulator (FREE, Open Source)
- Broadcasts iBeacon, Eddystone (UID, URL, TLM, EID), and AltBeacon
- Full control over UUID, Major, Minor, TX Power
- Can broadcast Eddystone-URL (beacon broadcasts a clickable URL!)
- Save and manage multiple beacon configs
- Background broadcasting supported
- GitHub: https://github.com/vhiribarren/beacon-simulator-android
- **Our #1 recommendation for dev/testing — install on any Android phone**

#### iOS — Virtual iBeacon Broadcasting
- iOS natively supports turning an iPhone/iPad into an iBeacon via CoreBluetooth
- Apps: **Locate Beacon** (Radius Networks), **Beacon Walker**, **Quick Beacon**
- Apple docs: https://developer.apple.com/documentation/corelocation/turning-an-ios-device-into-an-ibeacon-device
- **Limitation**: Broadcasting stops when app goes to background (~10 sec)
- **Limitation**: iOS can only broadcast iBeacon format (not Eddystone-URL)
- Still great for testing — just keep the app in foreground

#### macOS / Linux — Node.js Virtual Beacons
- **bleno** (Node.js) — `startAdvertisingIBeacon(uuid, major, minor, measuredPower)`
  - Works on macOS (CoreBluetooth) and Linux (BlueZ)
  - GitHub: https://github.com/noble/bleno
- **node-eddystone-beacon** — Broadcast Eddystone-URL from any machine
- **linux-ibeacon** (Python) — Lightweight iBeacon broadcaster via hcitool
  - GitHub: https://github.com/dburr/linux-ibeacon
- **hcitool** (Linux CLI) — Part of BlueZ, raw iBeacon packets, no dependencies

#### Virtual Beacon Comparison

| Tool | Platform | iBeacon | Eddystone-URL | Custom UUID/Major/Minor | Free | Open Source |
|------|----------|---------|---------------|------------------------|------|-------------|
| Beacon Simulator | Android | Yes | Yes | Yes | Yes | Yes |
| Locate Beacon | iOS | Yes | No | Yes | Yes | No |
| Beacon Walker | iOS | Yes | No | Yes | Yes | No |
| bleno | macOS/Linux | Yes | No* | Yes | Yes | Yes |
| node-eddystone-beacon | macOS/Linux/Win | No | Yes | N/A | Yes | Yes |
| linux-ibeacon | Linux | Yes | No | Yes | Yes | Yes |
| hcitool | Linux | Yes | Manual | Yes | Yes | Yes |

*Use node-eddystone-beacon alongside bleno for Eddystone support

#### Raspberry Pi as Virtual Beacon
- Pi 3/4/5 all have built-in BLE
- Install BlueZ + hcitool or Node.js bleno
- USB-powered, runs headless, always-on
- **Cost: ~$15 for a Pi Zero 2 W** (but doubles as a gateway/kiosk)
- Can dynamically change UUID/Major/Minor via API — beacons that update themselves!

### Tier 1: Ultra-Budget — $1.50–$3/beacon (ESP32 DIY)

The cheapest physical beacons possible. Requires USB power (no coin cell battery).

#### ESP32-C3 Super Mini
- **AliExpress: ~$1.50–2.50 each** (search "ESP32-C3 Super Mini")
- **Amazon 5-pack: ~$15–20** ($3–4/unit, Prime shipping)
- **Amazon 10-pack: ~$20–30** ($2–3/unit)
- WiFi + BLE 5.0, USB-C, tiny form factor (thumb-sized)
- Flash with beacon firmware in minutes

#### ESP32 Beacon Firmware Options
1. **ESPHome** — Simple YAML config, `esp32_ble_beacon` component
   - Docs: https://esphome.io/components/esp32_ble_beacon/
   - Best for Home Assistant users, zero code needed
2. **Arduino IDE** — Built-in ESP32 BLE library, iBeacon example included
   - Tutorial: https://circuitdigest.com/microcontroller-projects/esp32-based-bluetooth-ibeacon
3. **green-beacon-esp32** — Dedicated beacon library
   - GitHub: https://github.com/ukkz/green-beacon-esp32

#### ESP32 Pros & Cons
- **Pro**: Cheapest option, fully programmable, WiFi + BLE, can dynamically change UUID/Major/Minor via WiFi API
- **Pro**: Can also serve as a beacon scanner/gateway (two-way!)
- **Con**: Requires USB power (no coin cell) — needs USB cable + adapter at each location
- **Con**: Larger than dedicated beacons, higher power draw than nRF-based
- **Best for**: Dev testing, USB-powered kiosk installations, prototyping

### Tier 2: Budget Standalone — $4–8/beacon (Battery Powered)

Real standalone beacons with coin cell batteries. No wires. Stick them anywhere.

#### AliExpress nRF51822 Beacons — $4–6 each
- iBeacon + Eddystone, CR2032 battery, 2–3 year life
- Waterproof cases available
- Various form factors (disc, keychain, card)
- Links:
  - nRF51822 Beacon Tag ~$5.70: https://www.aliexpress.com/item/32845366171.html
  - Holyiot nRF51822 ~$5.80: https://www.aliexpress.com/item/32790922059.html
  - iBeacon with case ~$4.45: https://www.aliexpress.com/item/32963269175.html
- **Shipping: 2–4 weeks from China**

#### Feasycom FSC-BP106 — ~$8–12 each (Amazon)
- Bluetooth 5.1, Dialog DA14531 chip
- IP67 waterproof
- iBeacon + Eddystone (URL, UID, TLM) + AltBeacon *simultaneously*
- Up to 10 advertising slots, 450m range
- Configurable via app
- Amazon: https://www.amazon.com/FSC-BP106-Programmable-Bluetooth-Waterproof-Positioning/dp/B0G2M14LTM

#### Minew E7 — Starting at ~$1/unit at massive scale
- IP67 waterproof, BLE 5.0
- Retail ~$8–12 each; bulk 10,000+ gets to $7.50/unit
- Product page: https://www.minew.com/product/e7-plus-beacon/

#### HoneyComm Low-Cost Beacon
- nRF52-based, BLE 5, IP68 waterproof, 5-year battery, 100m range
- https://www.honeycomm.net/product/low-cost-small-size-waterproof-ip68-5years-ble-ibeacon-eddystone-bluetooth-beacon/

### Tier 3: Reliable / Amazon Prime — $10–15/beacon

For production deployments where you want reliability and fast shipping.

#### Blue Charm BC011 MultiBeacon
- BLE 5.0, CR2032, iBeacon + Eddystone + AltBeacon
- Battery level in broadcast
- **10-pack on Amazon: ~$100 ($10/unit), Prime shipping**
- Single: ~$13–15
- Bulk discounts: 8% off for 30+, 15% off for 100+
- Amazon: https://www.amazon.com/Blue-Charm-Beacons-Bluetooth-BC011-MultiBeacon/dp/B079QW31BP
- Official site: https://bluecharmbeacons.com/

#### Blue Charm BC-U1-USB MultiBeacon
- **USB-powered** (no battery concerns ever!)
- Same features as BC011 but plugs into any USB port
- 5-pack on Amazon: https://www.amazon.com/Blue-Charm-Beacons-Bluetooth-MultiBeacon/dp/B0G28543XZ
- **Great for kiosks and fixed installations**

#### Blue Charm BC021 MultiBeacon
- Includes **motion sensor** (accelerometer)
- Detect if beacon is moved/tampered with
- 4-pack on Amazon: https://www.amazon.com/Blue-Charm-Beacons-Bluetooth-BC021-MultiBeacon/dp/B0G4HTNS53

#### RF-Star RF-B-AR1 (3-pack)
- BLE 5.0, iBeacon + Eddystone, up to 10-year battery
- https://ozrobotics.com/shop/bluetooth-beacon-with-low-power-consumption-and-ibeacon-eddystone-tag/

### Tier 4: Enterprise — $20–50/beacon

For production museum/venue deployments with vendor cloud management.

| Beacon | Price | Battery | Range | Cloud Management | Notes |
|--------|-------|---------|-------|------------------|-------|
| Estimote Proximity | ~$20 | 3–5 yrs | 70m | Estimote Cloud | Industry standard |
| Kontakt.io Smart Beacon | ~$25 | 4 yrs | 70m | Kontakt Cloud | Best fleet management |
| Kontakt.io Tough | ~$35 | 4 yrs | 70m | Kontakt Cloud | IP67 outdoor |
| Estimote LTE | ~$50 | Rechargeable | 70m | Estimote Cloud | Cellular + BLE |

### Price Summary — All Tiers

| Tier | Option | Per-Unit | Power | Best For |
|------|--------|----------|-------|----------|
| **Free** | Android phone + Beacon Simulator app | $0 | Phone battery | Dev testing |
| **Free** | iPhone + Locate Beacon | $0 | Phone battery | Dev testing |
| **Free** | Mac/Linux + bleno (Node.js) | $0 | Wall power | Dev testing |
| **$1.50** | ESP32-C3 Super Mini (AliExpress) | $1.50–2.50 | USB only | Prototyping |
| **$3** | ESP32-C3 Super Mini (Amazon 10pk) | $2–3 | USB only | Quick prototyping |
| **$4** | nRF51822 beacon (AliExpress) | $4–6 | CR2032 (2yr) | Budget deployment |
| **$8** | Feasycom FSC-BP106 | $8–12 | CR2032 (3yr) | Mid-range, waterproof |
| **$10** | Blue Charm BC011 (10-pack) | $10 | CR2032 (3yr) | Reliable, Prime shipping |
| **$10** | Blue Charm BC-U1-USB | ~$10 | USB powered | Kiosks, permanent |
| **$20** | Estimote Proximity | $20 | CR2032 (5yr) | Enterprise, cloud managed |
| **$25** | Kontakt.io Smart Beacon | $25 | CR2032 (4yr) | Enterprise, fleet mgmt |

### Our Dev Testing Plan
1. **Start free**: Install Beacon Simulator on an Android phone → instant virtual beacon
2. **First hardware**: Order ESP32-C3 Super Mini 5-pack from Amazon (~$15) → flash with ESPHome
3. **Battery-powered test**: Order 3-pack nRF51822 from AliExpress (~$15) → stick anywhere
4. **Production pilot**: Blue Charm BC011 10-pack from Amazon (~$100) → real deployment

**Total to get started with real hardware testing: ~$15**

---

## Virtual Beacon Deep Dive

Virtual beacons are a key part of our strategy — not just for testing, but as a production feature.

### Use Cases for Virtual Beacons in TourStack
1. **Development & Testing** — No hardware needed, simulate any beacon configuration
2. **Kiosk Broadcasting** — Kiosk tablet/Pi broadcasts as a beacon, visitors' phones detect it
3. **Phone-as-Beacon** — Tour guide's phone acts as a moving beacon for group tours
4. **Demo Mode** — Show clients how beacon features work without shipping hardware
5. **Temporary Installations** — Pop-up exhibits, temporary tours, events
6. **Fallback** — If a physical beacon dies, any spare phone can replace it

### Eddystone-URL — The "No App Needed" Beacon
- Eddystone-URL beacons broadcast a URL directly
- Android devices with Chrome nearby notifications can detect these *without any app*
- The beacon literally pushes a web link to nearby phones
- Perfect for: "Scan this beacon to open the tour stop page"
- Our tour stop URLs (`/visitor/tour/{slug}/stop/{slug}`) could be broadcast directly!
- **Limitation**: Google deprecated the Physical Web / Nearby Notifications in 2018, but the protocol still works for apps that scan for it
- We could build Eddystone-URL scanning into our visitor experience

### Virtual Beacon Feature in TourStack (Admin)
- "Create Virtual Beacon" button in stop positioning settings
- Generates beacon config (UUID, Major, Minor)
- Shows QR code to configure Beacon Simulator app quickly
- Or: "Broadcast from this device" button (if kiosk/tablet has BLE peripheral support)
- Toggle between physical and virtual beacon for any stop

---

## Device & Browser Requirements

### The Big Picture

| Capability | Web (Chrome Android) | Web (Safari iOS) | Capacitor Hybrid | Native App |
|-----------|---------------------|-------------------|-----------------|------------|
| Scan for beacons | Experimental* | **NO** | Full support | Full support |
| Detect iBeacon | **NO** (privacy) | **NO** | Full support | Full support |
| Background scanning | **NO** | **NO** | Limited (iOS), Yes (Android) | Full support |
| Broadcast as beacon | **NO** | **NO** | Yes (both platforms) | Full support |
| Connect to beacon (GATT) | Yes (user gesture) | **NO** | Yes | Yes |
| Program beacon config | Yes (Chrome only) | **NO** | Yes | Yes |

*Web Bluetooth Scanning API is behind `chrome://flags/#enable-experimental-web-platform-features`

**Key insight**: Pure web cannot do beacon scanning on iOS at all, and even on Android it's experimental. For visitor-facing beacon detection, we need either:
- **Capacitor hybrid app** (wraps our existing React app, adds native BLE) — recommended
- **Native companion app**
- **Or**: lean on QR codes as primary, beacons as enhancement for supported devices

### Web Bluetooth API — Browser Support

| Browser | Platform | GATT Connect | BLE Scanning | Status |
|---------|----------|-------------|-------------|--------|
| Chrome 56+ | Android 6+ | Yes | Experimental (flag) | Best web BLE support |
| Chrome 56+ | Windows 10+ | Yes | Experimental (flag) | Good for admin/programming |
| Chrome 56+ | macOS 10.10+ | Yes | Experimental (flag) | Good for admin/programming |
| Chrome 56+ | Linux (BlueZ 5.41+) | Yes | Experimental (flag) | Flaky in practice |
| Edge | Windows/macOS | Yes | Experimental (flag) | Same as Chrome (Chromium) |
| Samsung Internet 6.2+ | Android | Yes | Experimental | Same as Chrome engine |
| Opera 43+ | Desktop/Android | Yes | Experimental | Same as Chrome engine |
| **Safari** | **iOS / macOS** | **NO** | **NO** | **WebKit team explicitly rejected it** |
| **Firefox** | **All platforms** | **NO** | **NO** | **Mozilla has no plans** |
| **Any browser on iOS** | **iOS** | **NO** | **NO** | **All iOS browsers use WebKit** |

Safari/Firefox will likely **never** support Web Bluetooth — both teams cite security/privacy concerns.

### What This Means for TourStack

#### Admin Side (Beacon Programming) — Web Bluetooth is Fine
- Admin users use Chrome on desktop → Web Bluetooth GATT works
- Can connect to beacons, read/write configuration
- Scan for nearby beacons to program them
- This is a user-initiated action (click button → pick beacon) — fits Web Bluetooth's model

#### Visitor Side (Beacon Detection) — Need Hybrid or Native
Three strategies, can implement in parallel:

**Strategy A: Capacitor Hybrid App (Recommended for full beacon support)**
- Wrap our existing React app with Capacitor
- Add `@capacitor-community/bluetooth-le` plugin
- Supports both iOS and Android BLE scanning
- Supports iBeacon detection, background monitoring
- Our entire React codebase stays the same — just add native BLE bridge
- One codebase → web + iOS app + Android app

**Strategy B: Progressive Enhancement (Recommended for MVP)**
- QR codes work everywhere (already built!)
- On Chrome Android: offer beacon-enhanced experience via Web Bluetooth
- On iOS: QR-only (or Capacitor app later)
- Beacons are a *bonus*, never required

**Strategy C: Eddystone-URL Broadcast (No app needed, limited)**
- Beacons broadcast tour stop URLs
- Some Android devices show these as notifications
- Very limited reach but zero friction for visitors

### Capacitor BLE Plugins

| Plugin | Maturity | Central (Scan) | Peripheral (Broadcast) | iOS | Android |
|--------|----------|---------------|----------------------|-----|---------|
| `@capacitor-community/bluetooth-le` | High, ~500+ GitHub stars | Yes | Yes | Yes | Yes |
| `@capawesome-team/capacitor-bluetooth-low-energy` | Newer | Yes | Yes | Yes | Yes |

### Hardware Requirements for Visitors

#### Minimum Device Requirements
- **Bluetooth 4.0 (BLE)** is the minimum — introduced in 2010, virtually universal now
- **iPhone**: 4S or later (2011+). Practical minimum: iPhone 6S+ (iOS 15+ required for modern apps)
- **iPad**: 3rd gen or later (2012+). All current iPads support BLE
- **Android**: API 23+ (Android 6.0 Marshmallow, 2015) for Web Bluetooth. API 21+ (Android 5.0) for native BLE. Practically: any phone from 2015 or later
- **Tablets**: All modern tablets (iPad, Galaxy Tab, Surface) support BLE scanning

#### Kiosk Hardware
- Any device with Bluetooth 4.0+ can scan for beacons
- Raspberry Pi 3/4/5 (built-in BLE) — can scan AND broadcast
- Android tablets in kiosk mode — full BLE support
- iPads in Guided Access mode — BLE works normally
- Intel NUC / mini PC + USB BLE dongle — for non-Bluetooth kiosk hardware
- **If kiosk is the beacon**: Pi Zero W ($15) or ESP32 ($2) is cheapest

### Permissions Required

#### iOS (via Capacitor/Native)
- `NSBluetoothAlwaysUsageDescription` — required for any Bluetooth access (iOS 13+)
- `NSLocationWhenInUseUsageDescription` — required specifically for iBeacon ranging
- `NSLocationAlwaysAndWhenInUseUsageDescription` — required for background iBeacon monitoring
- User sees: "App wants to use Bluetooth" popup + "App wants your location" popup
- **Note**: CoreBluetooth scanning (non-iBeacon) does NOT need location permission on iOS 13+

#### Android
**Android 12+ (API 31):**
- `BLUETOOTH_SCAN` — for scanning (can add `neverForLocation` flag if not using for positioning)
- `BLUETOOTH_CONNECT` — for connecting to beacons (programming)
- `BLUETOOTH_ADVERTISE` — for broadcasting as virtual beacon
- If not using location: no location permission needed!

**Android 11 and below:**
- `BLUETOOTH`, `BLUETOOTH_ADMIN` — basic BLE access
- `ACCESS_FINE_LOCATION` — **required for BLE scanning** (Google considers scan results as location data)
- Location services must be **enabled** on device (not just permission granted)

### Background Scanning Limitations

#### iOS (via Capacitor/Native)
- Background CoreBluetooth scanning is **heavily throttled**
- Scan intervals increase, duplicate filtering mandatory
- **iBeacon region monitoring** is the killer feature: works even when app is *killed*
  - iOS wakes the app for ~10 seconds on beacon region enter/exit
  - Up to 20 monitored regions simultaneously
  - Very low power — Apple optimized this specifically
- iBeacon ranging (distance estimation) only works in foreground

#### Android
- Background scanning increasingly restricted since Android 8+
- Android 8: ~4 scans per 30-second window in background
- Android 10+: Need foreground service to scan from background
- Android 12+: Foreground service with `connectedDevice` type required
- **Warning**: Huawei, Xiaomi, Oppo, Vivo aggressively kill background services
- Android Beacon Library (AltBeacon) provides the most robust background scanning solution

### Battery Impact
- **Continuous scanning**: 5–15% battery per hour (too aggressive)
- **Low-power scanning** (1s scan every 5s): 1–3% per hour (acceptable)
- **iBeacon region monitoring** (iOS): negligible battery impact (OS-level optimization)
- **Best practice**: Use region monitoring to detect "near a tour" → activate detailed scanning only when inside tour venue

### Broadcasting from Devices (for Virtual Beacons)

| Device | Can Broadcast? | Background? | Notes |
|--------|---------------|------------|-------|
| iPhone (4S+) | Yes (iBeacon only) | No (~10s then stops) | Keep app in foreground |
| Android (5.0+, ~80% of devices) | Yes (any format) | Yes (with foreground service) | Check `isMultipleAdvertisementSupported()` |
| Mac (2012+) | Yes | Yes | Via CoreBluetooth or bleno |
| Linux + BlueZ | Yes | Yes | hcitool or bleno |
| Raspberry Pi 3/4/5 | Yes | Yes (always on) | Best dedicated virtual beacon |
| Windows 10+ | Yes | Yes | UWP API or third-party |

---

## Scanner & Testing Apps

### For Scanning / Detecting Beacons

| App | Platform | Features | Cost |
|-----|----------|----------|------|
| **Beacon Simulator** | Android | Scan + Broadcast, all formats, open source | Free |
| **BLE Scanner 4.0** | iOS | General BLE + iBeacon + Eddystone analysis | Free |
| **Locate Beacon** | iOS | iBeacon scan + broadcast | Free |
| **LightBlue** | iOS + macOS | General BLE exploration | Free |
| **nRF Connect** | iOS + Android + Desktop | Nordic's official BLE tool, very detailed | Free |
| **NanoBeacon Scanner** | iOS + Android | Wake-on-beacon, background notifications | Free |
| **Thingsup BLE Scanner** | Android | iBeacon + Eddystone, MQTT, CSV export | Free |

### For Development (SDKs & Libraries)

| Library | Platform | Detects iBeacon | Detects Eddystone | Background | Notes |
|---------|----------|----------------|-------------------|------------|-------|
| Core Location | iOS (native) | Yes | No | Yes (region monitoring) | Apple's built-in, no SDK needed |
| CoreBluetooth | iOS (native) | Raw BLE only | Yes | Throttled | Lower-level, more flexible |
| Android Beacon Library | Android | Yes | Yes | Yes (robust) | AltBeacon project, industry standard |
| `@capacitor-community/bluetooth-le` | iOS + Android (hybrid) | Via CoreBluetooth/Android BLE | Yes | Platform-dependent | Best for our React + Capacitor stack |
| Web Bluetooth | Chrome (Android) | No (privacy block) | Experimental | No | Admin programming only |
| node-beacon-scanner | Node.js (server) | Yes | Yes | N/A (server) | For kiosk/gateway scanning |
| noble | Node.js (server) | Raw BLE | Raw BLE | N/A (server) | Low-level, pair with bleno |

### Curated Resource
The **awesome-beacon** GitHub repo maintains a comprehensive list of beacon tools, SDKs, and hardware:
https://github.com/rabschi/awesome-beacon

---

## Feature Areas

### 1. Beacon Detection & Stop Triggering

**Core flow:** Phone detects beacon → matches to stop → triggers content

#### Beacon Scanner Service
- Background Web Bluetooth scanning (where supported)
- Fallback: Capacitor native BLE bridge for iOS/Android
- RSSI smoothing (rolling average, Kalman filter) to reduce jitter
- Configurable scan interval (battery vs responsiveness tradeoff)
- Multiple beacon protocol support:
  - **iBeacon** (UUID / Major / Minor)
  - **Eddystone-UID** (Namespace / Instance)
  - **Eddystone-URL** (Physical Web — broadcast a URL directly)
  - **AltBeacon** (open standard)

#### Proximity Zones
- **Immediate** (< 0.5m) — auto-trigger, no confirmation needed
- **Near** (0.5m – 3m) — show banner/notification, tap to open
- **Far** (3m – 10m+) — subtle indicator, "nearby" list
- Per-stop configurable thresholds (override defaults)
- Hysteresis to prevent flapping (require sustained signal before trigger/exit)

#### Trigger Behavior
- Leverage existing `TriggerSettings` (entryTrigger, exitTrigger, dwellTimeMs, autoAdvanceMs)
- Add beacon-specific settings:
  - `rssiThreshold`: minimum signal strength to trigger (-70 dBm default)
  - `hysteresisMs`: debounce time before state change (3000ms default)
  - `multiBeaconMode`: 'nearest' | 'first' | 'strongest' | 'all'
- Notification options already defined (sound, vibration, visual banner/modal)

#### Multi-Beacon Triangulation
- When 3+ beacons visible, estimate position on floor plan
- Enable "You Are Here" dot on venue map
- More accurate zone detection than single-beacon proximity

---

### 2. Beacon Programming & Provisioning

**Goal:** Program and configure beacons directly from TourStack's admin UI.

#### Web Bluetooth Programming (Admin — Chrome Desktop)
- Connect to beacon via Web Bluetooth GATT
- Read current configuration (UUID, Major, Minor, TX Power, advertising interval)
- Write new configuration values
- Support major beacon chipsets:
  - **Nordic nRF52** (most common)
  - **Dialog DA14xxx** (Feasycom, some budget beacons)
  - **ESP32** (DIY/budget option — can also program via WiFi!)

#### Programming Workflow
1. Admin opens "Program Beacon" panel in stop's positioning settings
2. Click "Scan for Beacons" — lists nearby unprogrammed/programmable beacons
3. Select beacon → read current config
4. Auto-suggest values based on tour/stop (UUID from tour, Major from stop group, Minor from stop order)
5. Write config → verify → save to TourStack database
6. Print/export label with beacon ID and stop assignment

#### ESP32-Specific: WiFi Programming
- ESP32 beacons can also be configured via WiFi (REST API on the beacon itself)
- No GATT needed — send HTTP request to change UUID/Major/Minor
- Could build a "TourStack Beacon Firmware" that self-registers with our server
- Admin changes stop assignment → beacon auto-updates via WiFi
- This is a unique advantage of ESP32 over dumb commercial beacons

#### Beacon Templates / Naming Schemes
- **Per-tour UUID**: All beacons in a tour share one UUID, differentiated by Major/Minor
- **Major = Floor/Zone**, Minor = Stop number (museum convention)
- Auto-generate values or manual entry
- Bulk programming mode for provisioning many beacons at once

#### Factory Reset / Reclaim
- Reset beacon to default state
- Reassign to different stop/tour
- Transfer ownership between tours

---

### 3. Beacon Fleet Management

**Dashboard for managing all beacons across all tours.**

#### Beacon Registry (Database)
```
Beacon {
  id: string
  name: string                    // "Gallery A - Beacon 3"
  hardwareId: string              // MAC address or serial
  type: 'physical' | 'virtual'   // hardware or software beacon
  vendor: string                  // Estimote, Kontakt, ESP32, Virtual...
  model: string                   // "BC011", "ESP32-C3", "Android Phone"
  firmwareVersion: string

  // iBeacon config
  uuid: string
  major: number
  minor: number
  txPower: number                 // dBm
  advertisingInterval: number     // ms (default 350)

  // Assignment
  tourId: string | null
  stopId: string | null
  zoneId: string | null           // for area beacons (not stop-specific)

  // Physical location
  floorPlanX: number | null
  floorPlanY: number | null
  floorId: string | null
  physicalDescription: string     // "Mounted under bench near entrance"

  // Health
  batteryLevel: number | null
  lastSeen: Date | null
  lastProgrammed: Date | null
  status: 'active' | 'low_battery' | 'offline' | 'unassigned' | 'retired'

  // Metadata
  installedDate: Date
  notes: string
}
```

#### Fleet Dashboard Views
- **List view** — sortable/filterable table of all beacons
- **Map view** — beacons plotted on uploaded floor plan
- **Health view** — battery levels, offline alerts, signal strength heatmap
- **Tour view** — beacons grouped by tour assignment

#### Alerts & Monitoring
- Low battery warnings (configurable threshold)
- Beacon offline (not detected by any device in X hours)
- Signal strength anomalies (beacon moved or obstructed?)
- Crowdsourced health: visitor devices report beacon sightings back to server

---

### 4. Beacon Content Block

**New content block type: `beacon`** — analogous to the existing `positioning` and `qrScanner` blocks.

#### BeaconBlockEditor (Admin)
- Assign beacon to stop (pick from registry or scan nearby)
- Configure proximity zones and trigger behavior
- Set notification style per zone
- Preview signal strength (live RSSI meter while editing)
- Show beacon health status inline

#### BeaconBlockPreview (Visitor)
- **Passive mode**: No visible UI — beacon triggers happen silently in background
- **Active mode**: Show proximity indicator
  - Pulsing rings that grow/shrink with distance
  - "Getting warmer/colder" guidance for scavenger hunts
  - Distance estimate badge
- **Debug mode** (staff): Show raw RSSI, beacon ID, battery level

#### Beacon-Triggered Actions
- Navigate to stop (same as QR navigate mode)
- Auto-play audio narration on arrival
- Show welcome modal with stop preview
- Trigger animation/transition in content
- Start timed experience (e.g., "You have 2 minutes at this station")
- Chain triggers: beacon A activates → unlocks content at beacon B

---

### 5. Spatial & Navigation Features

#### Indoor Floor Plan / Map
- Upload venue floor plan image (SVG or high-res image)
- Place beacons on floor plan (drag & drop in admin)
- Place stops on floor plan
- Define zones/rooms as polygons
- Multiple floors support

#### Wayfinding / Turn-by-Turn
- "Navigate to Stop X" — show path on floor plan
- Beacon triangulation updates position in real-time
- Directional arrows: "Turn left", "Go up one floor"
- Accessibility routes (elevator instead of stairs)
- Distance/time estimates

#### "You Are Here" Kiosk
- Kiosk displays floor plan with visitor's current area highlighted
- Nearby stops glow/pulse
- Touch a stop on map to get directions
- Integrates with kiosk idle timeout (reset map after inactivity)

#### Geofencing Zones
- Define areas beyond individual stops (e.g., "Gift Shop", "Cafe", "Exit")
- Zone entry/exit triggers (welcome message, "Don't miss X before you leave!")
- Restricted zones (staff only — beacon detects unauthorized entry)

---

### 6. Analytics & Insights

#### Movement Analytics
- **Flow paths**: Visualize common visitor routes through the venue
- **Dwell time per stop**: How long visitors stay (beacon enter → exit timestamps)
- **Stop sequence**: Order visitors experience stops (vs intended order)
- **Completion rates**: What % of visitors hit all mandatory stops
- **Bottleneck detection**: Where do visitors cluster/queue
- **Skip patterns**: Which stops are most commonly skipped

#### Heatmaps
- Overlay on floor plan showing traffic density
- Time-based: morning vs afternoon patterns
- Filter by: tour type, day of week, visitor segment

#### Real-Time Dashboard
- Current visitor count per zone
- Active beacons and their detection counts
- Live flow visualization (dots moving on floor plan)
- Capacity alerts (zone over threshold)

#### Privacy-First Design
- All analytics aggregated, never individual tracking
- No PII stored — anonymous session IDs only
- Visitor opt-in for enhanced tracking
- Data retention policies (auto-purge after N days)
- GDPR/CCPA compliant by default
- Local-first option: all processing on-device, only aggregates sent to server

---

### 7. AI Concierge Integration

#### Location-Aware Chat
- Concierge knows visitor's current position (from beacon proximity)
- "Tell me about what I'm looking at" → AI uses current stop context
- "What should I see next?" → AI suggests nearest unvisited stop
- "How do I get to the cafe?" → wayfinding response with directions
- "I have 20 minutes left" → AI creates optimized mini-tour of remaining highlights

#### Smart Routing
- AI generates personalized tour paths based on:
  - Visitor interests (from chat history or initial preference quiz)
  - Current crowd levels (from real-time analytics)
  - Time budget
  - Accessibility needs
  - Previously visited stops
- Dynamic re-routing: "Gallery B just got crowded, visit Gallery C first"

#### Scavenger Hunt / Gamification AI
- AI-generated scavenger hunts based on beacon-equipped stops
- Dynamic difficulty: easier hints if visitor struggles, harder if they're fast
- Location verification: beacon confirms visitor is actually at the stop
- Leaderboards (opt-in) for competitive groups

---

### 8. Advanced Beacon Features (Long-Term)

#### Virtual Beacons as Production Feature
- "Create Virtual Beacon" in admin UI
- Kiosk broadcasts beacon signal (no hardware needed for fixed installations)
- Phone-to-phone: group leader's device acts as beacon for the group
- Useful for temporary exhibits, events, pop-ups

#### Conditional Content
- Show different content based on:
  - Visit count (first time vs returning visitor)
  - Time spent at previous stops (rushed vs leisurely)
  - Path taken (came from Room A vs Room B)
  - Group size (detected by multiple devices near same beacon)
  - Time of day / season

#### Accessibility Beacon Features
- Audio description auto-plays for users with screen readers
- Haptic patterns for navigation (distinct vibrations for "turn left" vs "arrived")
- High-contrast mode triggers automatically near specific beacons
- Emergency beacon: broadcast evacuation instructions

#### Offline Mode
- Pre-download tour content + beacon map
- All proximity detection works offline (Bluetooth is local)
- Sync analytics when back online
- Critical for venues with poor WiFi (historic buildings, outdoor sites)

#### Beacon Mesh Networking (Future)
- Beacons relay messages to each other
- Extend range in large venues
- Backbone network for real-time data (Nordic Mesh)

---

## Technical Implementation Plan

### Phase 0: Virtual Beacon Testing (No Hardware!) — Start Here
- [ ] Install Beacon Simulator on Android test phone
- [ ] Create test beacon configs matching our tour stops
- [ ] Build beacon scanner service prototype (`app/src/services/beaconService.ts`)
- [ ] Test RSSI → distance calculation with phone-to-phone
- [ ] Validate proximity zone logic (immediate/near/far)

### Phase 1: Foundation (Beacon Detection)
- [ ] Beacon scanner service with Web Bluetooth (Chrome Android) + Capacitor bridge (iOS)
- [ ] RSSI smoothing (rolling average, Kalman filter)
- [ ] Beacon ↔ Stop matching logic
- [ ] Proximity zone engine with hysteresis
- [ ] Integration with existing TriggerSettings
- [ ] Beacon detection toggle in visitor UI
- [ ] Graceful fallback to QR when BLE unavailable

### Phase 2: Beacon Management
- [ ] Beacon database model (Prisma schema + safe migration)
- [ ] Beacon CRUD API routes (`app/server/routes/beacons.ts`)
- [ ] Beacon registry UI (list, search, filter)
- [ ] Beacon ↔ Stop assignment in PositioningEditorModal
- [ ] Virtual beacon creation + management
- [ ] Beacon status monitoring (last seen, battery)

### Phase 3: Programming & Provisioning
- [ ] Web Bluetooth GATT write service (Chrome admin)
- [ ] "Program Beacon" UI in admin
- [ ] Auto-suggest UUID/Major/Minor values
- [ ] ESP32 WiFi programming API
- [ ] Bulk programming workflow

### Phase 4: Beacon Content Block
- [ ] `BeaconBlockEditor` component
- [ ] `BeaconBlockPreview` component (passive + active + debug modes)
- [ ] Beacon-triggered actions (auto-play, navigate, unlock)
- [ ] Add `beacon` to ContentBlockType union

### Phase 5: Spatial Features
- [ ] Floor plan upload and management
- [ ] Beacon placement on floor plan (drag & drop)
- [ ] Multi-beacon triangulation
- [ ] "You Are Here" display
- [ ] Basic wayfinding

### Phase 6: Analytics
- [ ] Beacon event logging (enter, exit, dwell)
- [ ] Movement flow aggregation
- [ ] Heatmap generation
- [ ] Real-time dashboard

### Phase 7: AI Integration
- [ ] Pass current beacon/location context to concierge
- [ ] Smart routing suggestions
- [ ] Scavenger hunt with beacon verification
- [ ] Dynamic content based on visit history

---

## API Design Sketch

```
# Beacon Management
GET    /api/beacons                    # List all beacons (filterable)
POST   /api/beacons                    # Register new beacon
GET    /api/beacons/:id                # Get beacon details
PUT    /api/beacons/:id                # Update beacon config
DELETE /api/beacons/:id                # Retire/remove beacon
POST   /api/beacons/:id/assign        # Assign to stop/zone
POST   /api/beacons/:id/program       # Record programming event
GET    /api/beacons/health             # Fleet health summary
GET    /api/beacons/tour/:tourId       # Beacons for a specific tour

# Virtual Beacons
POST   /api/beacons/virtual            # Create virtual beacon config
GET    /api/beacons/virtual/:id/config # Get config for Beacon Simulator app

# Beacon Events (from visitor devices)
POST   /api/beacon-events             # Report beacon sighting (batch)
  Body: { sessionId, events: [{ beaconId, rssi, timestamp }] }

# Analytics
GET    /api/analytics/flow/:tourId              # Movement flow data
GET    /api/analytics/heatmap/:tourId           # Traffic heatmap
GET    /api/analytics/dwell/:tourId             # Dwell times per stop
GET    /api/analytics/realtime/:tourId          # Current visitor positions

# Visitor (public)
GET    /api/visitor/tour/:tourId/beacons        # Beacon map for a tour
POST   /api/visitor/beacon-checkin              # Verify presence at beacon
```

---

## Fallback Chain — Beacons Never Gate the Experience

```
1. Capacitor app + BLE available     → Full beacon proximity detection
2. Chrome Android + Web Bluetooth    → Limited beacon detection (experimental)
3. Neither available                 → Fall back to QR code scanning (already built!)
4. No camera                        → Manual short code entry (already built!)
```

**The QR system we already built is the perfect fallback. Beacons enhance the experience but never gate it.**

---

## Open Questions

- Should we build custom ESP32 firmware ("TourStack Beacon") with WiFi self-registration?
- Do we want Eddystone-URL support (beacon broadcasts URL directly, no app needed)?
- Capacitor vs React Native for the hybrid app shell?
- Should beacon events go to SQLite or a separate time-series store for analytics?
- WebSocket vs polling for real-time analytics dashboard?
- How much Estimote/Kontakt cloud API to integrate vs our own fleet management?
- Should floor plan system be its own feature or coupled with beacons?
- GDPR consent flow before enabling beacon scanning?

---

*Created: 2026-02-22*
*Status: Brainstorm / Pre-development*
