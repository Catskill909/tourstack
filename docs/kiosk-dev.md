# Kiosk & Visitor Launch System - Development Guide

**Created**: January 29, 2026
**Status**: Planning
**Priority**: High - Critical for museum deployments

---

## Overview

This document tracks the development of TourStack's visitor launch system - the interface museums use to run tours on public-facing devices (tablets, phones, kiosks).

### Why This Matters

Museums need an intuitive way to:
- Launch tours for visitors from the admin interface
- Configure kiosk tablets for unattended public use
- Preview draft tours before publishing
- Set language and starting point for different contexts

---

## Current State Audit

### What Exists (Jan 29, 2026)

| Component | Status | Location |
|-----------|--------|----------|
| Visitor page | ✅ Working | `app/src/pages/VisitorStop.tsx` |
| Public API | ✅ Working | `app/server/routes/visitor.ts` |
| Display settings FAB | ✅ Working | `app/src/components/DisplaySettingsPanel.tsx` |
| Language selector | ✅ Working | Built into VisitorStop.tsx |
| Stop navigation | ✅ Working | Prev/Next buttons in VisitorStop.tsx |
| Progress indicator | ✅ Working | Dot indicators in VisitorStop.tsx |
| Staff preview mode | ✅ Working | localStorage flag `tourstack_staff` |
| Published check | ✅ Working | Blocks non-staff from draft tours |
| **Launch buttons** | ❌ Missing | No way to start from admin UI |
| **Kiosk configuration** | ❌ Missing | No settings for unattended mode |

### Visitor Route Structure

```
/visitor/tour/:tourId/stop/:stopId
/visitor/tour/:tourId/stop/:stopId?t=TOKEN    # QR code entry
```

### Test URLs

```bash
# Published tour (Timeline Gallery Testing)
http://localhost:5173/visitor/tour/cmksrs8cp0007132jzl5gjmfl/stop/cmksrsh4l0009132jjwi9bxoa

# Get your tour/stop IDs:
sqlite3 app/data/dev.db "SELECT id, title, status FROM Tour;"
sqlite3 app/data/dev.db "SELECT id, tourId FROM Stop LIMIT 10;"
```

---

## Implementation Plan

### Phase 1: Quick Launch Buttons

**Goal**: Simple "Run" / "Preview" buttons to launch visitor view from admin.

#### UI Design

**Tour Cards (Tours List Page)**
```
┌─────────────────────────────────────────┐
│  [Hero Image]                           │
│  📍 Timeline Gallery Testing            │
│  ✓ Published | 3 stops | EN, ES         │
│                                         │
│  [Edit]  [▶ Run]  [⚙️]                  │
└─────────────────────────────────────────┘

Draft tour variant:
│  [Edit]  [👁 Preview]  [⚙️]             │
```

**Tour Detail Page Header**
```
┌─────────────────────────────────────────────────────┐
│  Timeline Gallery Testing           [▶ Run Tour]   │
│  ✓ Published | 3 Stops | EN, ES, FR   [⚙️ Kiosk]   │
└─────────────────────────────────────────────────────┘
```

#### Button Behavior

| Tour Status | Button | Label | Action |
|-------------|--------|-------|--------|
| Published | Primary | ▶ Run | Opens first stop in new tab |
| Draft | Secondary | 👁 Preview | Opens first stop with staff banner |
| Any | Icon | ⚙️ | Opens Kiosk Launcher Modal |

#### Implementation Tasks

- [ ] Add "Run" / "Preview" button to `TourCard.tsx`
- [ ] Add "Run Tour" button to `TourDetail.tsx` header
- [ ] Query first stop ID when launching
- [ ] Open in new tab with `window.open()`
- [ ] Style buttons per tour status (published vs draft)

#### Files to Modify

| File | Changes |
|------|---------|
| `app/src/components/TourCard.tsx` | Add Run/Preview/Settings buttons |
| `app/src/pages/TourDetail.tsx` | Add header action buttons |
| `app/src/pages/Tours.tsx` | Pass handlers to TourCard |

---

### Phase 2: Kiosk Launcher Modal

**Goal**: Advanced configuration for museum kiosk deployments.

#### UI Design

```
┌─────────────────────────────────────────────────────┐
│  ⚙️ Launch Kiosk Mode                          [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tour                                               │
│  ┌───────────────────────────────────────────────┐ │
│  │ Timeline Gallery Testing                    ▼ │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Language                                           │
│  ┌───────────────────────────────────────────────┐ │
│  │ English                                     ▼ │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  Start From                                         │
│  ┌───────────────────────────────────────────────┐ │
│  │ Stop 1: Introduction                        ▼ │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Kiosk Options                                      │
│                                                     │
│  ☐ Full-screen mode (F11)                          │
│  ☐ Hide navigation controls                        │
│  ☐ Auto-restart when tour completes                │
│  ☐ Lock to this tour (prevent browsing)            │
│                                                     │
├─────────────────────────────────────────────────────┤
│                    [Cancel]  [🚀 Launch Kiosk]      │
└─────────────────────────────────────────────────────┘
```

#### URL Parameters

```
/visitor/tour/{id}/stop/{stopId}?lang=es&kiosk=true&autoRestart=true&hideNav=true
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `lang` | string | Override default language (en, es, fr, etc.) |
| `kiosk` | boolean | Enable kiosk mode styling |
| `autoRestart` | boolean | Return to first stop when tour completes |
| `hideNav` | boolean | Hide prev/next buttons |
| `fullscreen` | boolean | Request fullscreen on load |

#### Implementation Tasks

- [ ] Create `KioskLauncherModal.tsx` component
- [ ] Add kiosk parameter handling to `VisitorStop.tsx`
- [ ] Implement fullscreen API integration
- [ ] Add auto-restart logic (navigate to stop 1 on completion)
- [ ] Add "hide nav" conditional rendering
- [ ] Store kiosk presets in localStorage or database

#### Files to Create/Modify

| File | Changes |
|------|---------|
| `app/src/components/KioskLauncherModal.tsx` | **New** - Modal component |
| `app/src/pages/VisitorStop.tsx` | Handle kiosk URL params |
| `app/src/types/index.ts` | Add KioskSettings interface |

---

### Phase 3: Kiosk Presets & Management

**Goal**: Save and manage kiosk configurations for different devices/locations.

#### Features

- Save kiosk presets (e.g., "Main Lobby iPad", "Gift Shop Tablet")
- QR code generation for quick kiosk setup
- Remote kiosk monitoring (future)
- Usage analytics per kiosk

#### Data Model

```typescript
interface KioskPreset {
  id: string;
  name: string;              // "Main Lobby iPad"
  tourId: string;
  language: string;
  startStopId?: string;      // Optional specific start
  options: {
    fullscreen: boolean;
    hideNav: boolean;
    autoRestart: boolean;
    lockToTour: boolean;
  };
  createdAt: Date;
  lastUsed?: Date;
}
```

---

## Device-Specific Considerations

### The Three Contexts

TourStack's visitor mode serves three distinct use cases with different needs:

| Context | Device Owner | Example | Primary Concerns |
|---------|--------------|---------|------------------|
| **Personal Device** | Visitor | Their iPhone/Android | Quick access, battery, data usage |
| **Shared Tablet** | Museum | iPad on cart/stand | Easy exit, sanitization prompts, multi-user |
| **Fixed Kiosk** | Museum | Wall-mounted display | Locked down, attract mode, no exit needed |

### Phone-Specific Features

Visitors using their own phones need a lightweight, respectful experience:

```
┌─────────────────────────────────────────┐
│  📱 PHONE MODE                          │
├─────────────────────────────────────────┤
│  ✓ Quick QR scan → instant content     │
│  ✓ Minimal UI chrome                    │
│  ✓ Works in Safari/Chrome (no app)     │
│  ✓ "Add to Home Screen" prompt         │
│  ✓ Offline caching (PWA)               │
│  ✓ Battery-conscious (no background)   │
│  ✓ Easy share button                   │
│  ✓ Bookmark/save for later             │
└─────────────────────────────────────────┘
```

**Phone-specific tools:**
- [ ] **PWA install prompt** - "Add to Home Screen" for app-like experience
- [ ] **Share button** - Share current stop via native share sheet
- [ ] **Save for later** - Bookmark tour to continue at home
- [ ] **Low data mode** - Reduced image quality option
- [ ] **Audio-only mode** - Listen while walking, screen off

### Tablet-Specific Features

Tablets (museum-owned, shared among visitors) need balance between openness and control:

```
┌─────────────────────────────────────────┐
│  📱 TABLET MODE (Shared Device)         │
├─────────────────────────────────────────┤
│  ✓ Larger touch targets (44px min)     │
│  ✓ Landscape + Portrait support        │
│  ✓ Clear "End Tour" button             │
│  ✓ "Next Visitor" reset option         │
│  ✓ Staff unlock gesture/code           │
│  ✓ Guided Access integration (iOS)     │
│  ✓ Screen pinning (Android)            │
└─────────────────────────────────────────┘
```

**Tablet-specific tools:**
- [ ] **Orientation support** - Responsive layout for both orientations
- [ ] **Touch target sizing** - Minimum 44x44px for all interactive elements
- [ ] **Guided Access (iOS)** - Documentation for museum IT setup
- [ ] **Screen Pinning (Android)** - Documentation for museum IT setup
- [ ] **Sanitization reminder** - "Please sanitize before next visitor" prompt

### Fixed Kiosk Features

Wall-mounted or pedestal displays in locked enclosures:

```
┌─────────────────────────────────────────┐
│  🖥️ FIXED KIOSK MODE                    │
├─────────────────────────────────────────┤
│  ✓ No exit option for visitors         │
│  ✓ Attract mode when idle              │
│  ✓ Auto-restart on completion          │
│  ✓ Hidden staff unlock (5-tap corner)  │
│  ✓ Fullscreen, no browser chrome       │
│  ✓ Error recovery (auto-refresh)       │
│  ✓ Network status indicator            │
└─────────────────────────────────────────┘
```

**Kiosk-specific tools:**
- [ ] **Attract mode** - Animated "Touch to begin" when idle
- [ ] **Idle timeout** - Return to attract mode after X minutes
- [ ] **Error recovery** - Auto-refresh if JavaScript errors occur
- [ ] **Heartbeat ping** - Alert staff if kiosk goes offline
- [ ] **Hidden staff access** - 5-tap corner or swipe gesture

---

## Exit Strategies for Visitors

### Design Principles

1. **Discoverable** - Exit should be findable without instructions
2. **Intentional** - Prevent accidental exits mid-tour
3. **Context-aware** - Different exit flows for different device types
4. **Graceful** - Offer to save progress or provide feedback

### Exit Methods by Context

#### Personal Phone: Minimal Friction
```
┌─────────────────────────────────────────┐
│  [←]  Stop 3 of 7           [≡ Menu]   │
│                                         │
│  ... content ...                        │
│                                         │
│  [◀ Prev]              [Next ▶]        │
└─────────────────────────────────────────┘
         │                       │
         │                       │
    Browser back            Menu has:
    button works            • Exit Tour
                            • Change Language
                            • Share
                            • About
```

**Phone exit options:**
- Browser back button (standard behavior)
- Menu → "Exit Tour"
- Complete tour → End screen with "Done" button
- Just close the tab (no penalty)

#### Shared Tablet: Clear but Confirmed
```
┌─────────────────────────────────────────┐
│  Ancient Egypt Tour        [End Tour]  │
│  Stop 3 of 7                            │
│                                         │
│  ... content ...                        │
│                                         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  End your tour?                         │
│                                         │
│  Your progress won't be saved.          │
│                                         │
│  [Continue Tour]  [Yes, End Tour]       │
│                                         │
│  ─────────────────────────────────────  │
│  Staff? Enter code to access settings   │
│  [____]                                 │
└─────────────────────────────────────────┘
```

**Tablet exit flow:**
1. Tap "End Tour" button (always visible in header)
2. Confirmation modal prevents accidental exit
3. Optional: Staff code field for settings access
4. Returns to tour start or attract screen

#### Fixed Kiosk: Tour Completion Only
```
┌─────────────────────────────────────────┐
│  Tour Complete! 🎉                       │
│                                         │
│  Thanks for exploring Ancient Egypt.    │
│                                         │
│  [Start Over]  [Explore Another Tour]  │
│                                         │
│  This screen will reset in 30 seconds   │
│  ████████████░░░░░░░░                   │
└─────────────────────────────────────────┘
```

**Kiosk exit behavior:**
- No "exit" button - visitors complete or abandon
- Auto-restart after completion (30s countdown)
- Auto-restart after idle timeout (5 min default)
- Staff exit: Hidden gesture (e.g., 5-tap top-left corner)

### Staff Exit / Unlock Methods

For museum-owned devices, staff need a way to exit kiosk mode:

| Method | Security | Ease | Best For |
|--------|----------|------|----------|
| **5-tap corner** | Low | Easy | Trusted environments |
| **Swipe pattern** | Medium | Medium | Shared spaces |
| **PIN code** | High | Medium | Public areas |
| **QR code scan** | High | Easy | Staff with phones |
| **Bluetooth beacon** | High | Easy | Large deployments |

#### Recommended: 5-Tap + PIN Combo
```
Staff taps top-left corner 5 times rapidly
         │
         ▼
┌─────────────────────────────────────────┐
│  🔐 Staff Access                        │
│                                         │
│  Enter PIN:                             │
│  [●] [●] [●] [●]                       │
│                                         │
│  [1] [2] [3]                           │
│  [4] [5] [6]                           │
│  [7] [8] [9]                           │
│      [0]                                │
│                                         │
│  [Cancel]                               │
└─────────────────────────────────────────┘
         │
         ▼ (correct PIN)
┌─────────────────────────────────────────┐
│  Staff Menu                             │
│                                         │
│  [Exit Kiosk Mode]                     │
│  [Change Tour]                          │
│  [Restart Device]                       │
│  [View Diagnostics]                     │
│                                         │
│  [Return to Tour]                       │
└─────────────────────────────────────────┘
```

### Implementation Tasks

- [ ] Add "End Tour" button to tablet/shared mode
- [ ] Create exit confirmation modal
- [ ] Implement 5-tap hidden gesture detection
- [ ] Create staff PIN entry component
- [ ] Add staff menu with device controls
- [ ] Create tour completion screen with auto-restart
- [ ] Add idle timeout detection
- [ ] Implement attract mode component

---

## Future Development Ideas

### Visitor Experience Enhancements

- [ ] **Tour completion screen** - Summary, feedback prompt, restart option
- [ ] **Idle timeout** - Return to start after X minutes of inactivity
- [ ] **Attract mode** - Animated "Touch to start" screen for unattended kiosks
- [ ] **Accessibility mode toggle** - Large text, high contrast, screen reader
- [ ] **Kid mode** - Simplified UI, gamification elements
- [ ] **Audio tour mode** - Auto-advance with audio cues

### Kiosk Hardware Integration

- [ ] **Screen orientation lock** - Force portrait/landscape
- [ ] **Battery/charging indicator** - Alert staff when device needs charging
- [ ] **Network status** - Offline mode with cached content
- [ ] **Device identification** - Track which physical device is which kiosk

### Analytics & Monitoring

- [ ] **Kiosk dashboard** - See all active kiosks, their status, current visitors
- [ ] **Engagement metrics** - Time per stop, completion rates, language usage
- [ ] **Alert system** - Notify staff if kiosk goes offline or has errors
- [ ] **Heatmaps** - Which stops get the most engagement

### Multi-Tour Scenarios

- [ ] **Tour selector landing page** - For kiosks that offer multiple tours
- [ ] **Tour bundles** - Combine related tours into packages
- [ ] **Suggested next tour** - At completion, recommend related content

---

## Code Audit Notes

### VisitorStop.tsx Analysis

**Strengths:**
- Clean separation of concerns
- Good error handling
- Staff preview mode works well
- Language switching is smooth

**Areas for Improvement:**
- Display settings not persisted (in-memory only)
- No kiosk mode support yet
- No fullscreen API integration
- No idle timeout handling

### visitor.ts API Analysis

**Endpoints:**
- `GET /api/visitor/tour/:tourSlugOrId` - Fetch tour by slug or ID
- `GET /api/visitor/tour/:tourSlugOrId/stop/:stopSlugOrId` - Fetch specific stop
- `GET /api/visitor/s/:shortCode` - QR code redirect

**Notes:**
- Supports both slug and ID lookups (good for SEO-friendly URLs)
- Returns full tour with all stops for navigation
- No authentication required for published tours

---

## Testing Checklist

### Phase 1 Testing

- [ ] Run button appears only on published tours
- [ ] Preview button appears on draft tours
- [ ] Clicking Run opens correct first stop in new tab
- [ ] Staff see admin banner in preview mode
- [ ] Non-staff cannot access draft tours via direct URL

### Phase 2 Testing

- [ ] Kiosk modal opens with correct tour pre-selected
- [ ] Language dropdown shows tour's available languages
- [ ] Start stop dropdown shows all stops in order
- [ ] Fullscreen mode activates on launch
- [ ] Auto-restart returns to first stop on completion
- [ ] Hide nav removes prev/next buttons
- [ ] URL parameters work when shared/bookmarked

---

## Related Documentation

- [HANDOFF.md](../HANDOFF.md) - Project status and phase tracking
- [tourstack.md](../tourstack.md) - Product vision and feature specs
- [COOLIFY-DEPLOYMENT.md](./COOLIFY-DEPLOYMENT.md) - Production deployment guide

---

## Changelog

### January 29, 2026
- Created initial document
- Documented current visitor view state
- Defined Phase 1 & 2 implementation plans
- Added future development ideas
- Added device-specific considerations (phone, tablet, fixed kiosk)
- Added exit strategies section with staff unlock methods
