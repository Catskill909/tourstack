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
