# NFC Tag Development — TourStack Brainstorm & Roadmap

## Vision

NFC tags give TourStack the fastest possible physical-to-digital bridge: **tap and go**. A visitor touches their phone to a small tag near an exhibit and instantly sees the tour stop — no camera, no QR scanning, no app install. It works in the dark, through gloves, and for visitors who can't align a camera. Combined with our existing QR codes, NFC creates a dual-trigger system where every visitor has a way in.

Beyond visitor-facing tap-to-open, NFC enables **collectible experiences** (digital passports, scavenger hunts), **accessibility improvements** (tactile discovery for low-vision visitors), and **operational simplicity** (invisible tags that survive vandalism and weather).

---

## The Key Architectural Insight

**NFC tags with NDEF URL records are handled identically to QR codes from TourStack's server perspective.**

Both NFC and QR encode a URL. The visitor's phone opens that URL. TourStack serves the same content. This means:

1. QR codes encode: `https://tourstack.supersoul.top/visitor/tour/{slug}/stop/{slug}?t={token}`
2. NFC tags encode: the exact same URL (with `&src=nfc` for analytics)
3. The visitor's phone opens the URL the same way regardless of trigger
4. **Zero server-side changes needed for basic NFC support**

```
    ┌──────────────┐     ┌──────────────┐
    │   QR Code    │     │   NFC Tag    │
    │  (visual)    │     │  (tap)       │
    └──────┬───────┘     └──────┬───────┘
           │                     │
           └──────────┬──────────┘
                      │
                      ▼
              Same TourStack URL
              /visitor/tour/X/stop/Y
                      │
                      ▼
              Same stop content
              (audio, text, images)
```

---

## How Phones Handle NFC Tags — No App Needed

### iPhone (iOS 14+, iPhone 7 and later)

iPhones read NFC tags **natively in the background** — no app required:

1. Phone's screen is on (locked or unlocked, after first unlock since boot)
2. User taps iPhone near NFC tag
3. iOS shows a **notification banner** at the top of the screen: "Open in Safari"
4. User taps the banner → Safari opens the URL
5. TourStack stop loads

**Background reading conditions:**
- Display must be on
- Not in Airplane Mode
- Camera not in use
- Apple Pay/Wallet not active
- No Core NFC reader session in progress

**iPhone model specifics:**
- **iPhone 7, 8, X**: Require NFC reader session (app-initiated scan) — no background reading
- **iPhone XS, XR and later** (2018+): Full background tag reading — tap and go
- **iPhone 15/16**: NFC Release 15 standard, improved range

### Android (most devices with NFC hardware)

Android handles NFC tags even more directly:

1. NFC enabled in phone settings (usually on by default)
2. User taps phone near NFC tag
3. Default browser opens the URL immediately — **no notification step**
4. TourStack stop loads

**Android NFC is one tap fewer than iPhone** — the URL opens directly without a notification banner.

### Web NFC API (for reading/writing tags IN the browser)

| Browser | Platform | Support | Notes |
|---------|----------|---------|-------|
| Chrome 89+ | Android | **Yes** | Read + write NFC tags from web pages |
| Chrome | Desktop | No | No NFC hardware typically |
| Safari | iOS / macOS | **No** | Apple has not implemented Web NFC |
| Firefox | All | **No** | Mozilla has no plans |
| Edge | Android | **Yes** | Chromium-based, same as Chrome |

**Key insight for TourStack:** We do NOT need the Web NFC API for visitors. The OS handles NDEF URL tags natively on both iOS and Android. Web NFC is only useful for admin-side tag programming (Android Chrome only) or kiosk NFC reading.

### The Reality Matrix

| Scenario | NFC Works? | How | User Action |
|----------|-----------|-----|-------------|
| **iPhone XS+ (iOS 14+)** | **Yes** | Background tag reading | Tap → tap notification → Safari opens |
| **iPhone 7/8/X** | **Partial** | Needs NFC-reading app open | Less seamless, fallback to QR |
| **Android with NFC** | **Yes** | Native NFC intent | Tap → browser opens directly |
| **Android without NFC** | **No** | N/A | Fall back to QR code |
| **Any phone, no NFC** | **No** | N/A | Fall back to QR code |
| **Admin programming (Chrome Android)** | **Yes** | Web NFC API | Read/write tags in browser |
| **Admin programming (desktop)** | **Yes** | ACR122U USB reader | Desktop software |

---

## Real-World Museum NFC Deployments

### Major Deployments

**Cooper Hewitt Smithsonian Design Museum (NYC)**
- Landmark NFC deployment — every visitor receives an NFC-enabled "pen"
- Tap exhibits to save favorites to a personal digital collection
- Items accessible via personal URL after the visit
- One of the most cited successful NFC museum implementations

**The Louvre (Paris)**
- Integrated NFC into visitor experience for multimedia content access
- Visitors tap for detailed artwork information directly on smartphones

**Museum of London**
- Early adopter — NFC tags at exhibits for digital content collection
- Visitors "collect" artifacts to a digital passport
- Found significant engagement increase vs passive displays

**Cleveland Museum of Art**
- "Gallery One" and "ArtLens" experiences incorporated NFC/RFID
- Interactive exhibit engagement via tap interactions

**Mori Building Digital Art Museum (Tokyo, teamLab)**
- NFC wristbands for immersive interactive experiences
- Visitor movements and identities tracked to personalize digital art
- Full gamification layer built on NFC interactions

**MoMA (Pilot)**
- NFC pilot reduced audio guide malfunctions by 83%
- Visitor retention increased to 94%
- Average interaction: 22 minutes (vs 7 minutes for traditional audio guides)

**Smithsonian**
- NFC tours increased youth engagement by 47%
- Cut setup time for temporary exhibits by 89%

### What Worked

- Low-friction "tap to learn more" at exhibit labels
- Collecting/bookmarking exhibits for post-visit engagement
- Multilingual audio guide triggering
- Accessibility features (tap for audio description)
- Eliminating traditional audio guide hardware entirely

### What Didn't Work Well

- **Visitor awareness**: Many people don't know they can tap their phone on things — signage is critical
- **Older iPhone limitations**: iPhone 7/8/X need an app open to scan NFC
- **Tag maintenance**: Tags in high-traffic areas can get damaged or delaminated
- **"Cold start" problem**: If visitors need to download an app first, most won't bother (this is why URL-based NFC that opens in the browser is superior)

---

## NFC Tag Types — What to Buy

### Tag Chip Comparison

| Tag Type | Chip | Memory | URL Capacity | Read Range | Security | Cost (bulk) | Best For |
|----------|------|--------|-------------|------------|----------|-------------|----------|
| **NTAG213** | NXP | 144 bytes | ~132 chars | 1-4 cm | Password protect | $0.05-0.15 | **Most museum use cases** |
| **NTAG215** | NXP | 504 bytes | ~480 chars | 1-4 cm | Password protect | $0.08-0.20 | Longer URLs with params |
| **NTAG216** | NXP | 888 bytes | ~854 chars | 1-4 cm | Password protect | $0.12-0.30 | Complex data, vCards |
| **NTAG424 DNA** | NXP | 256 bytes | Shorter | 1-4 cm | **Cryptographic (SUN)** | $0.50-1.00 | Anti-cloning, paid content |
| **ICODE SLIX** | NXP | 112 bytes | Limited | Up to 10 cm | Basic | $0.15-0.25 | Longer range needs |

### Recommendation for TourStack

**NTAG213 is the sweet spot for 90%+ of museum use cases.** Here's why:

A TourStack URL like `https://tourstack.supersoul.top/visitor/tour/oslo/stop/munch?t=abc123&src=nfc` is ~85 characters — well under the 132-char NDEF URL capacity of NTAG213.

Additionally, NDEF URI records use **prefix compression** — the `https://` prefix is stored as a single byte, saving 8 characters. Common prefixes like `https://www.` are also compressed.

Use **NTAG215** only if encoding very long URLs with many query parameters.

Use **NTAG424 DNA** only for high-security scenarios: paid content gating, authenticated collectibles, or tamper verification.

### Form Factors

| Form Factor | Use Case | Anti-Metal? | Notes |
|-------------|----------|-------------|-------|
| **25-30mm round stickers** | Exhibit labels | Optional | Most common, cheap, easy to deploy |
| **Anti-metal stickers** | Metal exhibit cases/frames | **Yes (built-in)** | 2x cost but essential on metal surfaces |
| **Clear/transparent stickers** | Overlay on existing signage | Optional | Invisible integration |
| **PVC cards (credit-card size)** | Visitor passes, welcome desk | No | Custom-printed with branding |
| **Silicone wristbands** | Immersive/gamified exhibits | No | Track visitor journey |
| **Tyvek wristbands** | Temporary exhibitions, events | No | Disposable, cheap |
| **Epoxy keychains** | Gift shop collectibles | No | Souvenir + digital portal |
| **Embedded behind acrylic/wood** | Permanent installations | Sometimes | Works through non-metal up to ~3-4mm |

**Critical note:** Metal blocks NFC signals. If mounting tags on or near metal surfaces (exhibit cases, metal frames, steel walls), you **must** use anti-metal tags with a ferrite layer. Standard stickers on metal will not work.

---

## Pricing — What It Actually Costs

### NTAG213 Sticker Pricing (2025)

| Quantity | Standard 25mm Round | Anti-Metal 30mm | PVC Card | Source |
|----------|-------------------|----------------|----------|--------|
| 10 | $0.50-0.80 ea | $0.80-1.20 ea | $1.50-2.00 ea | Amazon small packs |
| 50 | $0.30-0.50 ea | $0.50-0.80 ea | $1.00-1.50 ea | Amazon/GoToTags |
| 100 | $0.20-0.35 ea | $0.40-0.60 ea | $0.80-1.20 ea | GoToTags/Seritag |
| 500 | $0.12-0.20 ea | $0.25-0.40 ea | $0.50-0.80 ea | Bulk suppliers |
| 1,000 | $0.08-0.15 ea | $0.18-0.30 ea | $0.35-0.60 ea | Bulk suppliers |
| 2,000+ (reel) | $0.05-0.10 ea | $0.12-0.20 ea | $0.25-0.40 ea | Direct/Alibaba |

### Suppliers

| Supplier | Location | Strength | URL |
|----------|----------|----------|-----|
| **GoToTags** | USA | Tags + encoding software, all-in-one | gototags.com |
| **Seritag** | UK | Custom-printed tags, excellent museum docs | seritag.com |
| **Tagstand** | USA | Anti-metal specialty, guard tour tags | tagstand.com |
| **NFC Direct** | EU | Competitive bulk pricing | nfcdirect.com |
| **Amazon** | Various | Quick test batches (TimesKey, THONSEN) | Search "NTAG213 NFC stickers" |
| **Alibaba** | China | Cheapest bulk ($0.03-0.05 at 10k+) | Verify quality first |

### Programming Hardware

| Device | Price | Use Case |
|--------|-------|----------|
| **ACR122U USB NFC Reader/Writer** | ~$30-40 | Standard desktop programming |
| **ACR1252U** | ~$50-60 | Faster, more reliable for bulk |
| **Android phone** | (already own) | Quick programming via NFC Tools app |

**Important:** Avoid cheap ACR122U clones from Amazon/AliExpress — the genuine ACS unit is worth the price for reliability.

### Total Cost for a Museum Deployment

**Small museum (25 stops):**
- 25x NTAG213 anti-metal stickers: ~$15-20
- 1x ACR122U reader: ~$35
- Signage labels (printed in-house): ~$10
- **Total: ~$60-65**

**Medium museum (50 stops):**
- 50x NTAG213 anti-metal stickers + 20 spares: ~$35-45
- 1x ACR122U reader: ~$35
- Signage labels: ~$20
- **Total: ~$90-100**

**Large venue (200 stops):**
- 200x NTAG213 anti-metal stickers + 50 spares: ~$75-100
- 1x ACR122U reader: ~$35
- **Total: ~$110-135**

This is remarkably cheap compared to proprietary audio guide hardware ($50-200 per handset).

---

## NFC vs QR — Why Use Both

| Factor | NFC | QR Code | Winner |
|--------|-----|---------|--------|
| **Speed** | ~1 second tap | 2-5 sec (open camera, aim, tap) | NFC |
| **Works in dark** | Yes | No (needs camera + light) | NFC |
| **Device support** | iPhone 7+ / most Android | All smartphones | QR |
| **Visitor familiarity** | Low-medium | High (post-COVID) | QR |
| **Visual presence** | Invisible or small icon | Visible square code | Tie |
| **Durability** | Very high (behind surface) | Can be damaged/obscured | NFC |
| **Cost per point** | $0.15-0.50 per tag | Free (printed) | QR |
| **Vandalism resistance** | High (can be hidden) | Moderate (can be defaced) | NFC |
| **Accessibility** | Better (tactile, low-vision) | Worse (visual alignment) | NFC |
| **URL flexibility** | Harder to change (reprogram) | Easy to reprint | QR |
| **Multiple simultaneous users** | One at a time (must be close) | Multiple (visual) | QR |
| **Outdoor use** | Any lighting/weather | Glare/rain can interfere | NFC |
| **Group tours** | One person taps, rest watch | Everyone can scan at once | QR |

### The Winning Strategy: Dual-Trigger Signage

Deploy NFC tags alongside QR codes at every stop. Both point to the same URL.

```
┌─────────────────────────────────────┐
│                                     │
│   The Starry Night                  │
│   Vincent van Gogh, 1889            │
│                                     │
│   ┌─────────┐                       │
│   │ ▄▄▄▄▄▄▄ │  Tap 📱 or Scan      │
│   │ █ QR  █ │  for audio guide      │
│   │ ▀▀▀▀▀▀▀ │                       │
│   └─────────┘  Short code: U3XMBW  │
│                                     │
│   [NFC icon ◎]  ← hidden tag here  │
│                                     │
└─────────────────────────────────────┘
```

- QR for universal compatibility and familiarity
- NFC for speed, accessibility, and the "magic" factor
- Short code as final fallback for any edge case
- **All three point to the same TourStack URL**

---

## What We Already Have (Current State)

### Type System — Ready

From [app/src/types/index.ts](app/src/types/index.ts):

```typescript
export type PositioningMethod = 'qr_code' | 'gps' | 'ble_beacon' | 'nfc' | ... ;

export interface NFCConfig {
  method: 'nfc';
  tagId: string;
  tagType?: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'MIFARE';
}
```

### Positioning Modal — Tab Exists

From [app/src/components/PositioningEditorModal.tsx](app/src/components/PositioningEditorModal.tsx):

The NFC tab is already in the tab bar with a "Coming Soon" badge, icon (Smartphone), and placeholder hint text:

> "NFC tags require physical tap (0-4cm range). Great for artifact labels and interactive exhibits."

### QR Code Architecture — The Template

The QR code implementation is the blueprint for NFC:
- URL generation with tour/stop slugs + token
- Short code generation (6-char alphanumeric, avoids 0/O/1/I)
- Save/load via `Stop.primaryPositioning` JSON field
- Visitor-side URL parsing and routing
- Short code lookup API at `/api/visitor/s/:shortCode`
- Scan history tracking in localStorage

### What Needs Building

The NFC implementation can lean heavily on existing QR infrastructure:

| Component | QR Status | NFC Equivalent |
|-----------|-----------|---------------|
| URL generation | Done | **Reuse** — same URLs, add `&src=nfc` |
| Short code | Done | **Reuse** — same fallback |
| Admin config UI | Done (QR tab) | **New** — NFC tab in positioning modal |
| Visitor URL routing | Done | **Reuse** — identical server handling |
| Tag programming | N/A | **New** — Web NFC API or export for desktop tool |
| Tag registry/tracking | N/A | **New** — which tag is at which stop |
| Analytics differentiation | Partial | **Enhance** — track `src=nfc` parameter |
| Signage generation | QR download | **Enhance** — combined QR + NFC label template |

---

## Feature Areas

### 1. NFC Tab in Positioning Settings (Admin)

Implement the NFC tab in the existing PositioningEditorModal. Mirror the QR tab structure:

**NFC Configuration Panel:**
- **NFC URL** — Auto-generated, same as QR URL but with `&src=nfc`
- **Tag Type** — Dropdown: NTAG213 (default), NTAG215, NTAG216, NTAG424 DNA
- **Tag ID** — Manual entry or scan-to-read (Web NFC on Chrome Android)
- **Tag Status** — Unassigned / Programmed / Verified / Failed
- **Lock Tag** — Checkbox to write-protect after programming
- **Copy URL** button — For manual programming with NFC Tools app
- **Export for bulk programming** — Download tag data for GoToTags/ACR122U

**Programming Panel (Chrome Android admin):**
- "Write to Tag" button using Web NFC API
- Pre-fills NDEF URL record with the stop's URL
- Shows write confirmation with tag UID
- Stores tag UID in config for verification

**Verification:**
- "Verify Tag" button — reads tag and confirms URL matches expected
- Shows last-verified date
- Alerts if tag content doesn't match (tampered/replaced?)

### 2. NFC Tag Registry & Fleet Management

Similar concept to beacon fleet management, but simpler since NFC tags are passive.

**Tag Registry Database (extension of positioning config):**
```
NFCTagRecord {
  tagUid: string          // Hardware UID (read from tag)
  tagType: string         // NTAG213, NTAG215, etc.
  encodedUrl: string      // URL written to tag
  stopId: string          // Assigned stop
  tourId: string          // Assigned tour
  status: 'unassigned' | 'programmed' | 'verified' | 'damaged' | 'retired'
  location: string        // "Left wall, next to painting frame"
  surface: string         // 'glass' | 'metal' | 'wood' | 'plastic' | 'wall'
  antiMetal: boolean      // Using anti-metal tag?
  programmedAt: Date
  verifiedAt: Date | null
  programmedBy: string    // Admin user
  notes: string
}
```

**Fleet Dashboard:**
- List all NFC tags with status indicators
- Filter by tour, status, tag type
- Bulk actions: export URLs, mark as retired
- Health monitoring: if a stop gets QR scans but zero NFC taps, flag the tag as possibly damaged

### 3. Signage Generator

**Combined QR + NFC label templates:**

Generate downloadable/printable signage that includes:
- QR code (existing)
- NFC tap instruction icon
- Short code for manual entry
- Multilingual instructions
- Museum branding area

**Template options:**
- **Minimal** — Small label: QR + "Tap or Scan" + short code
- **Standard** — Medium label with exhibit title and instructions
- **Accessible** — Large label with high-contrast, braille-ready, tactile NFC zone
- **Outdoor** — Weather-resistant design notes

**Export formats:**
- PDF (print-ready, with crop marks)
- SVG (for professional printing)
- PNG (for quick printing)

### 4. NFC-Enhanced Visitor Features

#### Digital Passport / Collectibles
- Visitor taps NFC tag → stop loads + stop is "collected" to their digital passport
- Progress tracker shows visited/unvisited stops
- Post-visit: shareable summary page with everything they collected
- We already have scan history tracking in localStorage — extend it

#### Scavenger Hunt Mode
- "Find and tap all 10 hidden NFC tags" for kids/groups
- Progress tracked in browser (localStorage or session)
- Completion unlocks reward: digital badge, gift shop discount code
- NFC taps verify physical presence (can't just browse URLs)
- We already have `qrScanner` block with `scavenger` mode — NFC version of same

#### Accessibility Enhancements
- Tactile NFC markers for blind/low-vision visitors
- Tap triggers audio description auto-play
- Raised NFC tag placement provides physical wayfinding
- Can serve different content based on accessibility preferences in session

#### Language Selection
- NFC URL can include language parameter: `&lang=es`
- Option: Multiple NFC tags per stop, one per language (with flag icons)
- Or: Single NFC tag, TourStack detects browser language preference
- Recommendation: Single tag + browser detection (simpler, cheaper)

### 5. Analytics & Insights

#### NFC-Specific Analytics
- **NFC vs QR usage ratio** — Track via `src=nfc` vs `src=qr` parameter
- **Tap frequency by stop** — Which exhibits get the most NFC engagement?
- **Time-of-day patterns** — When are NFC taps highest?
- **Device breakdown** — iPhone vs Android NFC usage
- **Failed taps** — If tag UID verification fails, count as potential tamper

#### Cross-Referencing with QR Data
- If a stop gets 100 QR scans and 3 NFC taps → tag might be damaged or poorly placed
- If a stop gets many NFC taps and few QR scans → QR code might be obscured
- This cross-referencing provides physical-world maintenance signals

### 6. Kiosk Integration

#### Kiosk as NFC Reader (Android kiosks with Web NFC)
- Kiosk tablet reads visitor's NFC wristband/card
- Identifies returning visitor → shows personalized content
- "Tap your wristband to see your collected items"
- Uses Web NFC API (Chrome Android) — works for admin/kiosk context

#### Kiosk as NFC Writer
- Program visitor NFC cards/wristbands at welcome desk
- Write visitor session ID to tag
- Each exhibit's kiosk reads the tag → personalized experience

### 7. Security

#### Threat Assessment for Museums

| Threat | Risk Level | Mitigation |
|--------|-----------|------------|
| Tag cloning (copy URL to new tag) | **Low** | URL leads to same content — no harm |
| Tag replacement (swap with malicious URL) | **Medium** | Lock tags read-only + periodic verification |
| Tag removal/vandalism | **Low** | Tags are small, can be hidden behind surfaces |
| Replay attacks | **Very Low** | No sensitive data on tags |
| Data harvesting from tags | **Very Low** | Tags only contain public URLs |

#### Recommended Security Measures

1. **Lock all tags as read-only** after programming (prevents URL modification)
2. **Use HTTPS URLs** only (already standard for TourStack)
3. **Record tag UIDs** — periodically verify tag UID matches expected (detect replacements)
4. **Opaque short codes** in URLs — not sequential or guessable
5. **Rate limiting** on stop endpoints — detect scanning attacks
6. **For paid content**: Consider NTAG424 DNA with SUN (Secure Unique NFC) — each tap generates a unique cryptographic signature in the URL that the server verifies

---

## NFC Tag Programming & Management Tools

### Mobile Apps (For Quick Programming)

| App | Platform | Features | Cost |
|-----|----------|----------|------|
| **NFC Tools** (wakdev) | Android + iOS | Read/write NDEF, URL, text, WiFi | Free / Pro $2.49 |
| **NXP TagWriter** | Android | Write NDEF records, NXP official | Free |
| **NFC TagInfo** (NXP) | Android + iOS | Diagnostics, tag type, memory, UID | Free |

### Desktop Software (For Bulk Programming)

| Tool | Platform | Features | Cost |
|------|----------|----------|------|
| **GoToTags Desktop** | Windows | Bulk encoding from CSV, variable data | ~$20/mo subscription |
| **NFC Tools Desktop** | Windows/Mac/Linux | Basic read/write | Free |
| **nfc-pcsc** (Node.js) | Any (with ACR122U) | Scriptable, automatable | Free (open source) |

### TourStack-Integrated Programming (Build This)

**Option A: Web NFC Programming (Chrome Android)**
- Admin opens stop's NFC tab on Chrome Android
- Clicks "Write to Tag" → places tag on phone → URL written
- Web NFC API handles the write operation
- No extra hardware or software needed
- **Limitation: Android Chrome only**

**Option B: Bulk Export for Desktop Programming**
- Admin clicks "Export NFC Data" → downloads CSV
- CSV format: `stop_title, stop_url, tag_type, tag_uid`
- Import into GoToTags or custom script with ACR122U
- Program tags assembly-line style

**Option C: Custom TourStack CLI Tool (Future)**
```bash
tourstack nfc program --tour oslo --stop munch
# Places tag on ACR122U → writes URL → records UID → updates database
```
Using `nfc-pcsc` npm package for Node.js integration.

### Recommended Programming Workflow

1. **Admin creates/configures stops** in TourStack (URLs auto-generated)
2. **Export NFC data** as CSV from admin panel
3. **Program tags** using NFC Tools app (phone) or GoToTags (desktop bulk)
4. **Lock tags** as read-only
5. **Record tag UIDs** back in TourStack (manual entry or scan-to-verify)
6. **Deploy tags** at exhibit locations
7. **Verify deployment** — scan each tag to confirm it opens correct stop

---

## Creative & Innovative NFC Ideas

### Museum Shop Integration
- NFC tags on merchandise link to related exhibit content
- "You bought this Egyptian cat figurine — tap to explore the Egyptian gallery online"
- Extends engagement beyond the museum visit
- Revenue opportunity: premium digital content with physical purchases

### Souvenir NFC Cards / Postcards
- Sell NFC-enabled postcards in gift shop
- Each card links to a curated digital experience
- Visitor taps at home months later → re-engages with museum content
- Acts as both physical souvenir and digital portal
- Can be updated server-side without changing the card

### Social Sharing Points
- NFC tags at photogenic spots → "Tap to share this moment"
- Pre-formatted social media post with exhibit image and museum hashtag
- Redirect to share sheet or social platform

### "Tap to Donate" Points
- NFC tags near impactful exhibits → "Tap to support this collection"
- Opens donation page with exhibit context pre-filled
- Frictionless micro-donations

### Multi-Experience Zones
- Different NFC tags at different heights at same exhibit
- Eye-level: full experience
- Lower (kids' height): kid-friendly content
- Braille label height: audio description
- Each tag encodes different URL parameters for content variants

### Temporary Exhibition Fast-Deploy
- NFC stickers are cheap and quick to deploy
- Perfect for rotating exhibitions, pop-up events, art fairs
- Peel off and redeploy for next exhibition
- No permanent installation needed

### NFC + AI Concierge
- Tap NFC tag → TourStack opens with AI concierge pre-loaded with exhibit context
- "You're looking at The Starry Night. Ask me anything about this painting."
- AI knows exactly where the visitor is and what they're looking at
- Can suggest related works nearby

---

## Technical Implementation Plan

### Phase 1: URL Enhancement (No New UI, Works Today)

**Zero code changes needed — just program tags with existing URLs:**

- [ ] Buy test pack: 20x NTAG213 stickers + ACR122U reader (~$50)
- [ ] Program tags with existing stop URLs (same as QR codes) using NFC Tools app
- [ ] Add `&src=nfc` parameter to NFC URLs for analytics differentiation
- [ ] Test on iPhone XS+ and Android devices
- [ ] Deploy alongside QR codes with "Tap or Scan" instruction
- [ ] Verify iOS notification banner behavior and Android direct-open behavior
- [ ] Document deployment guidelines for museum clients

### Phase 2: NFC Admin UI

- [ ] Implement NFC tab in PositioningEditorModal (replace "Coming Soon" placeholder)
- [ ] Auto-generate NFC URL (same as QR URL + `&src=nfc`)
- [ ] Tag type selector (NTAG213/215/216/424)
- [ ] Tag UID field (manual entry)
- [ ] Copy URL button for manual programming
- [ ] "Write to Tag" via Web NFC API (Chrome Android admin)
- [ ] Tag status tracking (unassigned/programmed/verified)
- [ ] Save NFC config to `primaryPositioning` or `backupPositioning`

### Phase 3: Dual-Trigger Signage

- [ ] Combined QR + NFC signage template generator
- [ ] Multiple template styles (minimal, standard, accessible)
- [ ] Export as PDF/SVG/PNG
- [ ] Include NFC tap instruction icon
- [ ] Include short code fallback
- [ ] Multilingual instruction support

### Phase 4: Tag Fleet Management

- [ ] NFC tag registry (extend positioning data or new table)
- [ ] Bulk URL export (CSV) for desktop programming
- [ ] Tag verification workflow (scan to confirm)
- [ ] Tag health monitoring (cross-reference QR vs NFC analytics)
- [ ] Alert system for potentially damaged/missing tags

### Phase 5: Enhanced Visitor Features

- [ ] Digital passport / collectibles (extend scan history)
- [ ] Scavenger hunt with NFC verification
- [ ] Accessibility-optimized NFC flows
- [ ] Post-visit email/summary with collected exhibits
- [ ] Language parameter in NFC URLs

### Phase 6: Kiosk & Advanced

- [ ] Kiosk NFC reader mode (Web NFC API on Android tablets)
- [ ] NFC wristband programming at welcome desk
- [ ] AI concierge location-awareness via NFC tap
- [ ] NTAG424 DNA authenticated taps for premium content

---

## NFCConfig Type Enhancement

The existing type is minimal. Proposed enhancement:

```typescript
export interface NFCConfig {
  method: 'nfc';
  // Tag identity
  tagId: string;                                          // Tag UID (hardware)
  tagType: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA' | 'MIFARE';

  // URL (same as QR, with source parameter)
  url: string;                                            // Full visitor URL with &src=nfc
  shortCode: string;                                      // Same short code as QR (shared)

  // Deployment info
  status: 'unassigned' | 'programmed' | 'verified' | 'damaged' | 'retired';
  surface: 'glass' | 'metal' | 'wood' | 'plastic' | 'wall' | 'other';
  antiMetal: boolean;
  locationDescription?: string;                           // "Left wall, below painting"

  // Tracking
  programmedAt?: string;                                  // ISO date
  verifiedAt?: string;                                    // ISO date
  programmedBy?: string;                                  // Admin user ID

  // Security
  locked: boolean;                                        // Read-only after programming
  ntag424Auth?: {                                         // Only for NTAG424 DNA
    sdmEnabled: boolean;
    sdmMeta?: string;
  };
}
```

---

## API Design Sketch

```
# NFC Tag Management (Admin)
GET    /api/nfc-tags                        # List all NFC tags (filterable)
POST   /api/nfc-tags                        # Register new tag
GET    /api/nfc-tags/:id                    # Get tag details
PUT    /api/nfc-tags/:id                    # Update tag config
DELETE /api/nfc-tags/:id                    # Retire tag
POST   /api/nfc-tags/:id/verify            # Record verification scan
POST   /api/nfc-tags/bulk-export           # Export CSV for bulk programming
GET    /api/nfc-tags/health                 # Fleet health summary
GET    /api/nfc-tags/tour/:tourId           # Tags for a specific tour

# Visitor (public — existing endpoints work!)
GET    /api/visitor/tour/:slug/stop/:slug   # Same endpoint as QR — no changes needed
GET    /api/visitor/s/:shortCode            # Same short code lookup — no changes needed

# Analytics
GET    /api/analytics/nfc-vs-qr/:tourId    # NFC vs QR usage comparison
GET    /api/analytics/nfc-health/:tourId    # Tag health report
```

---

## Fallback Chain — NFC Never Gates the Experience

```
1. iPhone XS+ or Android with NFC     → Tap NFC tag → URL opens
2. iPhone 7/8/X                       → Fall back to QR code scanning
3. Any phone with camera              → QR code scanning (already built!)
4. No camera                          → Manual short code entry (already built!)
5. No phone at all                    → Kiosk at exhibit (already built!)
```

**The QR system we already built is the perfect fallback. NFC enhances the experience but never gates it.**

---

## Open Questions

- Should NFC config share the same `primaryPositioning` field as QR, or should we support dual positioning (QR as primary, NFC as backup/secondary)?
- Do we want a TourStack CLI tool for tag programming, or is export-to-CSV + NFC Tools app sufficient?
- Should the signage generator be its own admin page or integrated into the stop editor?
- NFC wristband/card features for kiosk — how deep do we go in v1?
- Should we store NFC tag registry in the Stop's JSON or create a separate database table?
- How to handle tag replacement (physical tag dies, need to program a new one for same stop)?
- Should the analytics `src` parameter be `nfc`, `nfc_tag`, or something else?
- Custom TourStack NFC sticker designs? (Branded with logo + tap icon)

---

## Research Sources

- [Web NFC — Can I Use](https://caniuse.com/webnfc)
- [Web NFC API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_NFC_API)
- [Web NFC Browser Support — WebNFC.org](https://www.webnfc.org/documentation/browser-support)
- [iOS Background NFC Tag Reading — GoToTags](https://gototags.com/help/ios/nfc/reading/background)
- [How to Use NFC Tags with iPhone — GoToTags](https://gototags.com/articles/how-to-use-nfc-tags-with-an-iphone-ios)
- [How to Read NFC Tags with iPhone — Seritag](https://seritag.com/learn/using-nfc/how-to-read-nfc-tags-with-an-iphone)
- [Apple Background Tag Reading — Apple Developer Docs](https://developer.apple.com/documentation/corenfc/adding-support-for-background-tag-reading)
- [NFC in Museums — NFCW Shop](https://nfcw-shop.com/nfc-branches/museums/)
- [NFC for Museum Audio Tours — TJ NFC Tag](https://www.tjnfctag.com/nfc-tag-for-museum-and-gallery-audio-tours/)
- [Enhancing Exhibits with NFC — Nearfield Advisors](https://nearfieldadvisors.com/uncategorized/enhancing-exhibits-with-nfc-technology-a-new-era-of-visitor-engagement/)
- [What Can NFC Do for Museums — MuseumNext](https://www.museumnext.com/article/what-can-near-field-communications-do-for-museums/)
- [NFC in Smart Museums — ENC Store](https://www.encstore.com/blog/7934-nfc-in-smart-museums-automated-ticketing-immersive-experience-art-insights)
- [NTAG213 Pricing — TJ RFID](https://www.tjnfctag.com/what-is-the-price-of-ntag213/)
- [GoToTags NFC Store](https://store.gototags.com/nfc-tags/)
- [ACR122U NFC Reader — GoToTags](https://gototags.com/help/nfc/hardware/desktop/acr122u)
- [GoToTags Desktop Encode — GoToTags](https://gototags.com/desktop-app/operations/nfc/encode)

---

*Created: 2026-02-22*
*Status: Brainstorm / Pre-development*
