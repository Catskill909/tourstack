# Map Block Specification
## TourStack Museum Tour Platform

**Version:** 1.0 Draft  
**Date:** January 21, 2026  
**Status:** Brainstorm & Specification

---

## Overview

This document outlines the comprehensive specification for map functionality in TourStack, designed to serve museum tour operators with a range of needs from simple location display to advanced field positioning and location-aware triggers.

### Current State
- **OpenStreetMap**: Enabled (free, no API key required)
- **Google Maps**: Available (premium, requires API key)
- **Default Provider**: OpenStreetMap

### Design Decision: Single vs. Multiple Map Blocks

**Recommendation: Single Unified Map Block with Multiple Modes**

Rather than separate blocks for each function, a single `MapBlock` with configurable modes provides:
- Simpler content management
- Consistent UI/UX
- Easier maintenance
- Flexible feature combinations

```typescript
interface MapBlock {
  id: string;
  type: 'map';
  mode: 'display' | 'interactive' | 'navigation' | 'overview';
  provider: 'openstreetmap' | 'google';
  config: MapConfig;
  markers: MapMarker[];
  routes: MapRoute[];
  zones: MapZone[];
}
```

---

## Part 1: Basic Map Features

### 1.1 Map Display Block
**Purpose:** Show location context for any stop or tour

#### Core Features
- **Static Map View**
  - Center point (lat/long)
  - Zoom level (1-20)
  - Map style (standard, satellite, terrain, hybrid)
  - Dimensions (responsive, fixed aspect ratio options)

- **Single Marker Display**
  - "You are here" indicator
  - Custom marker icons (numbered, categorized)
  - Marker clustering for dense areas

- **Provider Toggle**
  - Respect global default from Settings
  - Per-block override option
  - Graceful fallback if Google API fails

#### Data Entry Methods
| Method | Use Case | Accuracy |
|--------|----------|----------|
| Manual Lat/Long | Known coordinates from survey | Precise |
| Address Search | General location lookup | ~10-50m |
| Click on Map | Quick visual placement | Visual |
| Current Location | Field staff with device | Device GPS |

### 1.2 Manual Coordinate Entry

```typescript
interface CoordinateInput {
  latitude: number;      // -90 to 90
  longitude: number;     // -180 to 180
  altitude?: number;     // meters (for multi-floor)
  accuracy?: number;     // confidence radius in meters
  source: 'manual' | 'gps' | 'address' | 'click';
}
```

#### UI Components
- **Lat/Long Input Fields**
  - Decimal degrees (41.8781, -87.6298)
  - DMS format support (41°52'41.2"N 87°37'47.3"W)
  - Format toggle with auto-conversion
  - Validation with error messaging

- **Address Geocoder**
  - Search box with autocomplete
  - Provider: OpenStreetMap Nominatim (free) or Google Geocoding API
  - Result confirmation before saving
  - Reverse geocode to get address from coordinates

- **Interactive Map Picker**
  - Click to place marker
  - Drag to adjust position
  - Coordinates update in real-time
  - Zoom controls for precision

### 1.3 Basic Map Styles

| Style | Provider | Best For |
|-------|----------|----------|
| Standard | Both | General navigation |
| Satellite | Both | Outdoor exhibits, gardens |
| Terrain | Both | Sculpture parks, trails |
| Dark Mode | Both | Match app dark theme |
| Custom | Google only | Museum branding |

---

## Part 2: Museum Tour Map Tools

### 2.1 Tour Overview Map
**Purpose:** Show complete tour route with all stops

#### Features
- **All Stops Displayed**
  - Numbered markers in tour order
  - Stop type icons (mandatory, optional, bonus)
  - Completion status (visited/not visited)
  - Current position highlight

- **Route Visualization**
  - Connecting lines between stops
  - Suggested walking path
  - Distance between stops
  - Estimated walking time

- **Tour Statistics Overlay**
  - Total distance: X meters/miles
  - Estimated duration: X minutes
  - Stops remaining: X of Y
  - Progress percentage

#### Use Cases by Museum Type

| Museum Type | Map Features Needed |
|-------------|---------------------|
| **Art Museum (Indoor)** | Floor plan overlay, room-by-room navigation |
| **Natural History** | Multi-floor support, wing navigation |
| **Sculpture Garden** | Outdoor GPS, walking paths, shade/rest areas |
| **Historic Site** | Large grounds, building clusters, parking |
| **Zoo/Aquarium** | Animal locations, feeding times, shows |
| **Botanical Garden** | Trail maps, seasonal highlights, terrain |
| **Archaeological Site** | Dig areas, restricted zones, elevation |
| **City Walking Tour** | Street navigation, crossing points, landmarks |
| **Campus Tour** | Building identification, accessibility routes |

### 2.2 Indoor Mapping (Floor Plans)

#### Floor Plan Integration
- **Upload Floor Plan Image** (PNG, SVG, PDF)
- **Calibration Points**
  - Mark 3+ known positions on floor plan
  - Tie to real-world coordinates OR
  - Relative positioning within building

- **Multi-Floor Support**
  - Floor selector UI
  - Elevator/stair indicators
  - Cross-floor navigation cues

- **Room/Zone Boundaries**
  - Define named areas
  - Gallery boundaries
  - Restricted areas (staff only)

```typescript
interface FloorPlan {
  id: string;
  buildingId: string;
  floor: number;
  name: string;           // "Level 2 - European Art"
  imageUrl: string;
  bounds: {
    topLeft: Coordinate;
    bottomRight: Coordinate;
  };
  calibrationPoints: CalibrationPoint[];
  zones: Zone[];
}
```

### 2.3 Accessibility Mapping

#### Accessibility Features
- **Wheelchair Routes**
  - Ramps, elevators, wide paths
  - Avoid stairs, narrow passages
  - Accessible restroom locations
  - Seating/rest areas

- **Visual Accessibility**
  - High-contrast map mode
  - Large text labels
  - Audio descriptions of map areas
  - Screen reader compatible markers

- **Hearing Accessibility**
  - Visual-only navigation cues
  - No audio-dependent features
  - Text-based directions

- **Sensory Considerations**
  - Quiet zones marked
  - Bright/dim lighting areas
  - Tactile exhibit locations

---

## Part 3: Mobile Field Positioning

### 3.1 Field Marker Placement Mode
**Purpose:** Allow staff with phone/tablet to place markers on-location

#### Field Collection Workflow
1. **Start Field Session**
   - Select tour to update
   - Enable high-accuracy GPS
   - Calibrate device (optional compass)

2. **At Each Stop Location**
   - Tap "Mark This Spot"
   - Device captures: GPS, timestamp, accuracy
   - Take reference photo (optional)
   - Add notes/observations

3. **Position Refinement**
   - Drag marker to exact spot
   - Multiple readings for accuracy
   - Indoor: mark on floor plan instead

4. **Sync to Server**
   - Upload positions when online
   - Conflict resolution if edited elsewhere

#### Field Mode UI
```
┌─────────────────────────────────┐
│  📍 Field Positioning Mode      │
│  Tour: Ancient Egypt Gallery    │
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │      [MAP VIEW]         │    │
│  │         📍              │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  GPS: 41.8781, -87.6298        │
│  Accuracy: ±3.2m               │
│  Signal: ████████░░ Strong     │
│                                 │
│  ┌─────────────────────────┐    │
│  │   📍 MARK THIS SPOT     │    │
│  └─────────────────────────┘    │
│                                 │
│  Stops Placed: 5 of 12         │
│  [View All] [Next Stop →]      │
└─────────────────────────────────┘
```

#### GPS Enhancement Options
- **Multi-reading Average**
  - Take 5-10 readings over 30 seconds
  - Calculate centroid
  - Report confidence interval

- **Reference Point Correction**
  - Mark a known reference point first
  - Apply offset to all readings
  - Compensate for systematic GPS drift

- **Photo Correlation**
  - Take photo at marker location
  - Use for verification later
  - Optional EXIF GPS extraction

### 3.2 Beacon Position Recording

For BLE/NFC/RFID positioning, record installation locations:

```typescript
interface BeaconPlacement {
  beaconId: string;
  physicalLocation: {
    coordinates: Coordinate;      // GPS if outdoor
    floorPlanPosition?: {         // If indoor
      floorPlanId: string;
      x: number;                  // Percentage from left
      y: number;                  // Percentage from top
    };
    mounting: 'ceiling' | 'wall' | 'floor' | 'pedestal' | 'hidden';
    height: number;               // Height from floor in cm
    orientation?: number;         // Degrees from north
  };
  installationPhoto?: string;
  installationDate: Date;
  installedBy: string;
  notes: string;
}
```

---

## Part 4: Location Triggers & Geofencing

### 4.1 Geofence Configuration

#### Trigger Zone Types
| Zone Type | Shape | Use Case |
|-----------|-------|----------|
| **Circle** | Radius from center | Simple stop proximity |
| **Polygon** | Custom shape | Irregular gallery rooms |
| **Corridor** | Path buffer | Walking routes |
| **Multi-zone** | Multiple shapes | Complex exhibits |

#### Trigger Settings
```typescript
interface LocationTrigger {
  id: string;
  stopId: string;
  zone: GeofenceZone;
  
  // Trigger conditions
  triggerOn: {
    entry: boolean;           // Fire when entering zone
    exit: boolean;            // Fire when leaving zone
    dwell: {                  // Fire after staying in zone
      enabled: boolean;
      duration: number;       // Seconds before trigger
    };
  };
  
  // Distance settings
  proximity: {
    radius: number;           // Primary trigger radius (meters)
    bufferZone: number;       // Hysteresis buffer to prevent rapid on/off
    minAccuracy: number;      // Ignore if GPS accuracy > this value
  };
  
  // Timing
  cooldown: number;           // Seconds before can re-trigger
  activeHours?: {             // Time-based activation
    start: string;            // "09:00"
    end: string;              // "17:00"
    days: number[];           // 0-6 (Sun-Sat)
  };
  
  // Actions
  actions: TriggerAction[];
}

interface TriggerAction {
  type: 'notification' | 'audio' | 'content' | 'unlock' | 'log';
  config: {
    // Notification
    title?: string;
    body?: string;
    sound?: 'chime' | 'ding' | 'bell' | 'silent';
    vibration?: 'short' | 'long' | 'pattern' | 'none';
    
    // Audio
    autoPlay?: boolean;
    volume?: number;
    
    // Content
    showModal?: boolean;
    highlightStop?: boolean;
    
    // Unlock
    unlockStopIds?: string[];  // Unlock other stops
    awardBadge?: string;
    
    // Analytics
    logEvent?: string;
  };
}
```

### 4.2 Distance Calculations

#### Display Options
- **Distance to Stop**
  - Real-time updating
  - Units: meters/feet (user preference)
  - "Arriving" threshold indicator

- **Distance Matrix**
  - Show distances between all stops
  - Nearest stop suggestion
  - Walking time estimates (@ 1.4 m/s average)

- **Progress Along Route**
  - Percentage complete
  - Distance remaining
  - ETA to finish

#### Accuracy Considerations
| GPS Accuracy | Recommended Min Radius | Notes |
|--------------|------------------------|-------|
| < 5m | 10m | Excellent conditions |
| 5-15m | 20m | Typical outdoor |
| 15-30m | 40m | Urban canyon, tree cover |
| > 30m | 50m+ | Poor conditions, use backup |

### 4.3 Trigger Debugging Tools

#### Field Testing Mode
- **Trigger Visualization**
  - Show geofence boundaries on map
  - Current position dot
  - Distance to trigger edge
  - Inside/outside status

- **Trigger Log**
  - Real-time event logging
  - Timestamp, trigger ID, action taken
  - GPS coordinates at trigger time
  - Accuracy at trigger time

- **Simulation Mode**
  - Drag simulated position
  - Test triggers without walking
  - Verify zone boundaries

---

## Part 5: Advanced Map Features

### 5.1 Route Planning & Navigation

#### Turn-by-Turn Directions
- **Outdoor Navigation**
  - Walking directions between stops
  - Street crossing warnings
  - Landmark callouts
  - Rerouting if off-path

- **Indoor Navigation**
  - Step-by-step within building
  - "Turn left at the Egyptian gallery"
  - Elevator/stairs guidance
  - Estimated steps/distance

#### Route Optimization
- **Suggested Order**
  - Shortest path algorithm
  - Respect mandatory stop order
  - Account for one-way paths
  - Include rest/restroom breaks

- **Custom Route Modes**
  - "Highlights Only" (top 5 stops)
  - "Complete Tour" (all stops)
  - "Accessible Route" (wheelchair-friendly)
  - "Quick Visit" (30 min max)
  - "Deep Dive" (extended content)

### 5.2 Real-Time Features

#### Live Location Tracking (Visitor App)
- **Current Position Display**
  - Blue dot on map
  - Accuracy circle
  - Heading indicator (compass)

- **Nearest Stop Finder**
  - "What's nearby?" feature
  - Distance and direction
  - Content preview

- **"I'm Lost" Helper**
  - Detect if visitor seems lost
  - Offer navigation assistance
  - Staff notification option

#### Crowd Management (Staff Tools)
- **Visitor Density Heatmap**
  - Anonymous position aggregation
  - Identify crowded areas
  - Suggest less busy times

- **Flow Optimization**
  - One-way traffic suggestions
  - Queue time estimates
  - Timed entry recommendations

### 5.3 Offline Map Support

#### Offline Capabilities
- **Map Tile Caching**
  - Pre-download area tiles
  - Multiple zoom levels
  - Storage estimate before download

- **Offline Positioning**
  - GPS works without internet
  - Cached geocode data
  - Pre-loaded floor plans

- **Sync on Reconnect**
  - Queue analytics events
  - Sync when online
  - Conflict resolution

```typescript
interface OfflineMapPackage {
  tourId: string;
  bounds: BoundingBox;
  zoomLevels: number[];       // e.g., [14, 15, 16, 17, 18]
  provider: 'openstreetmap';  // Google requires online
  estimatedSize: number;      // bytes
  downloadedAt?: Date;
  expiresAt?: Date;
}
```

### 5.4 Map Annotations & Markup

#### Annotation Types
- **Points of Interest**
  - Restrooms, exits, elevators
  - Gift shop, café, coat check
  - First aid, security
  - Photo spots, seating areas

- **Informational Overlays**
  - Historical boundaries
  - Construction/closure areas
  - Event locations
  - Temporary exhibits

- **Custom Markers**
  - Museum-branded icons
  - Category-based colors
  - Numbered sequences
  - Status indicators

---

## Part 5B: Map-Stop Integration & Marker Types

### 5B.1 Marker Interaction Paradigm

**Core Principle:** Every marker on a map can trigger one of two visitor experiences:

| Marker Type | Visitor Experience | Use Case |
|-------------|-------------------|----------|
| **Info Popup** | Inline popup with title, description, image | Quick facts, POIs, amenities |
| **Stop Link** | Navigate to full stop content | Main tour stops, detailed content |

#### Info Popup Marker
When tapped, displays a popup overlay directly on the map:
```
┌─────────────────────────────┐
│ 🖼 [Image]                  │
│ ─────────────────────────── │
│ Rosetta Stone               │
│ Discovered 1799 in Egypt.   │
│ Key to deciphering...       │
│                    [Dismiss]│
└─────────────────────────────┘
```

#### Stop Link Marker
When tapped, navigates to the full stop view:
```
┌─────────────────────────────┐
│  📍 Gallery 4               │
│  "The Rosetta Stone"        │
│                             │
│  [View Stop →]  [Directions]│
└─────────────────────────────┘
```

### 5B.2 Marker Data Model

```typescript
interface MapMarker {
  id: string;
  position: {
    latitude: number;
    longitude: number;
    floor?: number;           // For indoor multi-floor
  };
  
  // Marker appearance
  icon: MarkerIconType;       // 'default' | 'stop' | 'poi' | 'amenity' | 'custom'
  customIconUrl?: string;
  color?: string;
  number?: number;            // For numbered tour stops
  
  // Interaction type - THE KEY DECISION
  interactionType: 'popup' | 'stop' | 'external';
  
  // For popup type
  popup?: {
    title: { [lang: string]: string };
    description?: { [lang: string]: string };
    imageUrl?: string;
    audioUrl?: string;        // Optional audio snippet
  };
  
  // For stop type - links to existing stop
  linkedStopId?: string;
  
  // For external type - opens URL
  externalUrl?: string;
  
  // Trigger zone (optional)
  triggerRadius?: number;     // meters
  triggerEnabled?: boolean;
}

type MarkerIconType = 
  | 'default'      // Standard pin
  | 'stop'         // Tour stop (numbered)
  | 'start'        // Tour start point
  | 'end'          // Tour end point
  | 'poi'          // Point of interest
  | 'restroom'     // Amenity icons
  | 'elevator'
  | 'exit'
  | 'cafe'
  | 'gift-shop'
  | 'info'
  | 'photo-spot'
  | 'custom';
```

### 5B.3 Marker Placement Modal

When user clicks on the map to place a marker, show a modal with options:

```
┌─────────────────────────────────────────────────────┐
│  📍 New Marker at 41.8781, -87.6298                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  What should this marker do?                        │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 💬 Show Info Popup                           │   │
│  │    Display title, description, and image     │   │
│  │    directly on the map.                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📄 Link to Existing Stop                     │   │
│  │    Navigate visitor to a stop you've         │   │
│  │    already created in this tour.             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ➕ Create New Stop Here                      │   │
│  │    Create a new stop at this location        │   │
│  │    and link the marker to it.                │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🏪 Add Amenity Marker                        │   │
│  │    Restroom, elevator, cafe, gift shop,      │   │
│  │    exit, or other facility.                  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                              [Cancel]               │
└─────────────────────────────────────────────────────┘
```

### 5B.4 Stop Linking Flow

When "Link to Existing Stop" is selected:

```
┌─────────────────────────────────────────────────────┐
│  🔗 Link Marker to Stop                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Select a stop from this tour:                      │
│                                                     │
│  🔍 [Search stops...                           ]   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ ① The Rosetta Stone                          │   │
│  │    Gallery 4 • 3 content blocks              │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ ② Egyptian Mummies                           │   │
│  │    Gallery 5 • 5 content blocks              │   │
│  └─────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────┐   │
│  │ ③ Book of the Dead                           │   │
│  │    Gallery 6 • 2 content blocks              │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ☐ Update stop's coordinates to this location      │
│  ☐ Show stop preview card before navigating        │
│                                                     │
│                     [Cancel]  [Link Stop]           │
└─────────────────────────────────────────────────────┘
```

### 5B.5 Tour Overview Map Mode

A special map mode showing all tour stops:

```typescript
interface TourOverviewMapConfig {
  tourId: string;
  displayMode: 'all-stops' | 'remaining' | 'visited' | 'nearby';
  
  // Visual options
  showRouteLines: boolean;
  showStopNumbers: boolean;
  showCompletionStatus: boolean;
  autoFitBounds: boolean;
  
  // Interaction
  onStopTap: 'preview' | 'navigate' | 'popup';
  showCurrentLocation: boolean;
  showDistanceToStops: boolean;
}
```

**Visitor Experience:**
1. Open tour → See map with all numbered stops
2. Tap any stop marker → See preview card
3. Tap "Go to Stop" → Navigate to full stop content
4. Current location shown if GPS available
5. Completed stops marked with checkmark

### 5B.6 Field Marker Creation Tool

**For curators walking the tour area with a device:**

```
┌─────────────────────────────────────────────────────┐
│  📍 Field Mode                    [End Session]     │
│  Tour: Ancient Egypt Gallery                        │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │                                             │   │
│  │              [Full Screen Map]              │   │
│  │                                             │   │
│  │                  🔵 ← You are here          │   │
│  │                                             │
│  │  GPS: ±3m  📶 Excellent                     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │       🎯 MARK THIS SPOT                      │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Recent markers:                                    │
│  • Stop 1: Entrance (±2m) ✓                        │
│  • Stop 2: First Gallery (±4m) ✓                   │
│  • Stop 3: [Current] ...                           │
│                                                     │
│  [📷 Take Photo]  [📝 Add Notes]  [⏪ Undo Last]   │
└─────────────────────────────────────────────────────┘
```

**Field Workflow:**
1. Curator opens Field Mode for a tour
2. Walks to each stop location
3. Taps "Mark This Spot" → captures GPS + timestamp
4. Optional: take reference photo, add notes
5. Choose: create new stop OR link to existing stop
6. Continue to next location
7. All positions sync to server when complete

### 5B.7 Marker Trigger Zones

Each marker can optionally have a trigger zone:

```typescript
interface MarkerTrigger {
  enabled: boolean;
  radius: number;              // meters (5-500)
  triggerOn: 'enter' | 'exit' | 'dwell';
  dwellTime?: number;          // seconds for dwell trigger
  
  actions: TriggerAction[];
  
  cooldown: number;            // seconds before re-triggering
  activeHours?: {
    start: string;             // "09:00"
    end: string;               // "17:00"
  };
}

type TriggerAction = 
  | { type: 'notification'; title: string; body: string }
  | { type: 'audio'; audioUrl: string; autoPlay: boolean }
  | { type: 'popup'; showPopup: true }
  | { type: 'navigate'; toStopId: string }
  | { type: 'reveal'; revealStopId: string }  // Unlock hidden stop
  | { type: 'analytics'; eventName: string };
```

### 5B.8 Integration with Stop Creation

**Stops can be created from the map:**

1. **From Map Editor:**
   - Click to place marker
   - Select "Create New Stop Here"
   - Minimal stop creation modal appears
   - Enter title, description
   - Stop is created with coordinates pre-filled
   - Return to map with marker linked

2. **From Stop Editor:**
   - Stop has optional GPS coordinates
   - "Add to Map" button if coordinates set
   - Opens Map Editor with marker at stop's location

3. **Sync Behavior:**
   - If stop coordinates change, offer to update linked markers
   - If marker position changes, offer to update stop coordinates
   - Markers can exist without stops (info-only markers)

### 5B.9 Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐
│    Tour         │────→│   Tour Map      │
│   (has stops)   │     │   (overview)    │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│     Stop        │◄───→│   Map Marker    │
│  (content)      │     │  (position +    │
│                 │     │   interaction)  │
└─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Content Blocks │
│  (incl. Map     │
│   Block)        │
└─────────────────┘
```

**Key Relationships:**
- **Tour** → has many **Stops**
- **Tour** → has one optional **Tour Overview Map**
- **Stop** → has optional GPS coordinates
- **Stop** → can have **Map Block** in content (contextual map)
- **Map Marker** → links to **Stop** OR shows popup
- **Trigger Zone** → attached to marker OR stop

---

## Part 6: Integration & APIs

### 6.1 Map Provider APIs

#### OpenStreetMap (Default - Free)
- **Tile Server**: Standard OSM tiles
- **Geocoding**: Nominatim API (rate limited)
- **Routing**: OSRM or GraphHopper
- **Offline**: Tiles can be cached
- **Cost**: Free (follow usage policies)

#### Google Maps (Premium)
- **Required APIs**:
  - Maps JavaScript API
  - Geocoding API
  - Directions API
  - Places API (optional)
- **Features**: Street View, custom styling, traffic
- **Cost**: Pay-per-use after free tier
- **API Key**: Stored in Settings

#### API Key Management
```typescript
interface MapProviderConfig {
  provider: 'openstreetmap' | 'google';
  apiKey?: string;            // Required for Google
  defaultZoom: number;
  defaultCenter?: Coordinate;
  style?: string;             // Custom style JSON
  restrictions?: {
    countries?: string[];     // Limit to countries
    bounds?: BoundingBox;     // Limit to area
  };
}
```

### 6.2 External Integrations

#### What3Words Integration
- **3-word addresses** for precise locations
- Easier to communicate than coordinates
- "tour.museum.gallery" → 41.8781, -87.6298

#### AR Foundation
- **AR Wayfinding** (future)
  - Camera overlay with directions
  - AR markers at stops
  - Virtual guide character

#### Accessibility Services
- **Be My Eyes API** (future)
  - Live volunteer assistance
  - Navigation help for blind visitors

---

## Part 7: Specialized Museum Tours

### 7.1 Outdoor Exhibition Tours

#### Sculpture Garden Features
- **Terrain awareness**
  - Elevation changes
  - Paved vs. unpaved paths
  - Shade/sun exposure

- **Environmental factors**
  - Weather-dependent routing
  - Seasonal highlights
  - Sunrise/sunset considerations

- **Photo opportunities**
  - Best angles marked
  - Time-of-day lighting tips
  - Instagram spots

### 7.2 Historic Site Tours

#### Large Ground Navigation
- **Building cluster maps**
  - Multiple structures
  - Grounds overview
  - Parking/entrance guidance

- **Historical overlays**
  - "Then vs. Now" slider
  - Historical photos geolocated
  - Timeline-based views

- **Guided path modes**
  - Chronological order
  - Thematic groupings
  - Architect's tour

### 7.3 City Walking Tours

#### Urban Tour Features
- **Street-level navigation**
  - Crosswalk locations
  - Traffic considerations
  - Sidewalk conditions

- **Safety features**
  - Well-lit routes for evening tours
  - Busy vs. quiet streets
  - Emergency services locations

- **Urban context**
  - Public transit connections
  - Nearby food/drink
  - Restroom availability

### 7.4 Archaeological Site Tours

#### Dig Site Features
- **Restricted area marking**
  - Active excavation zones
  - Fragile areas
  - Staff-only sections

- **Stratigraphy visualization**
  - Depth layers
  - Discovery locations
  - Time period zones

- **Grid reference system**
  - Archaeological grid overlay
  - Square/unit identification
  - Find spot logging

### 7.5 Botanical Garden Tours

#### Garden Features
- **Seasonal content**
  - What's blooming now
  - Best time to visit areas
  - Migration patterns (butterflies, birds)

- **Trail mapping**
  - Difficulty ratings
  - Distance markers
  - Bench/rest locations

- **Collection mapping**
  - Plant locations by species
  - Themed garden areas
  - Specimen trees marked

---

## Part 8: Analytics & Insights

### 8.1 Map-Specific Analytics

#### Visitor Movement Data
- **Path Analysis**
  - Most common routes taken
  - Deviation from suggested path
  - Backtracking patterns
  - Skip patterns

- **Dwell Time by Location**
  - Time spent at each stop
  - Popular spots vs. overlooked
  - Optimal stop duration data

- **Heatmap Generation**
  - Visitor density over time
  - Peak hour patterns
  - Seasonal variations

#### Positioning Performance
- **Trigger Accuracy**
  - True positive rate
  - False positive rate
  - Trigger latency

- **GPS Quality Metrics**
  - Average accuracy by area
  - Problem zones identification
  - Device type comparisons

### 8.2 Curator Insights Dashboard

#### Map Health Overview
- All geofence zones visualized
- Trigger success rates per zone
- Recommended adjustments
- Coverage gap warnings

---

## Part 9: Implementation Phases

### Phase 1: Foundation (MVP) - 4 weeks
**Goal:** Basic map display and manual positioning

- [ ] **Map Display Component**
  - OpenStreetMap integration via Leaflet
  - Google Maps integration (API key required)
  - Provider toggle respecting Settings
  - Responsive map container

- [ ] **Coordinate Entry**
  - Manual lat/long input fields
  - Format toggle (decimal/DMS)
  - Click-on-map placement
  - Address search (Nominatim)

- [ ] **Single Marker Display**
  - Stop location marker
  - Custom marker icons
  - Basic info popup

- [ ] **Map Block in Stop Editor**
  - Add Map Block to content types
  - Configure coordinates
  - Preview in stop view

**Deliverables:**
- MapBlock component
- CoordinateInput component
- MapPicker component (click to place)
- Settings integration for provider selection

---

### Phase 2: Tour Mapping - 3 weeks
**Goal:** Tour overview and multi-stop maps

- [ ] **Tour Overview Map**
  - Display all stops on single map
  - Auto-fit bounds to show all markers
  - Numbered markers in tour order

- [ ] **Route Visualization**
  - Connecting lines between stops
  - Distance calculations
  - Walking time estimates

- [ ] **Marker Clustering**
  - Group nearby markers at low zoom
  - Expand on zoom/click
  - Count badge on cluster

- [ ] **Map in Tour Detail Page**
  - Overview map component
  - Interactive stop selection
  - Current/visited state indicators

**Deliverables:**
- TourOverviewMap component
- RouteVisualization component
- MarkerCluster integration
- Distance/time calculation utilities

---

### Phase 3: Mobile Field Positioning - 4 weeks
**Goal:** Staff can place markers on-location with device

- [ ] **Field Mode UI**
  - Full-screen map mode
  - "Mark This Spot" button
  - GPS accuracy indicator
  - Multiple reading averaging

- [ ] **Device GPS Integration**
  - Geolocation API wrapper
  - High-accuracy mode
  - Error handling (permission denied, unavailable)

- [ ] **Position Refinement**
  - Drag marker to adjust
  - Coordinate fine-tuning
  - Undo/reset options

- [ ] **Session Management**
  - Track field session progress
  - Save/resume sessions
  - Offline queue for upload

- [ ] **Photo at Marker**
  - Capture reference photo
  - EXIF GPS extraction option
  - Photo storage and linking

**Deliverables:**
- FieldPositioningMode component
- useGeolocation hook
- PositionCapture service
- FieldSession management

---

### Phase 4: Geofencing & Triggers - 4 weeks
**Goal:** Location-based content triggers

- [ ] **Geofence Zone Editor**
  - Circle radius tool
  - Polygon drawing tool
  - Zone preview on map

- [ ] **Trigger Configuration UI**
  - Entry/exit/dwell options
  - Radius and buffer settings
  - Cooldown configuration

- [ ] **Trigger Actions**
  - Notification dispatch
  - Content reveal
  - Audio autoplay trigger

- [ ] **Visitor App Integration**
  - Background geofence monitoring
  - Battery-efficient polling
  - Trigger event handling

- [ ] **Debug/Test Mode**
  - Visualize all zones
  - Trigger log viewer
  - Simulated position testing

**Deliverables:**
- GeofenceEditor component
- TriggerConfig component
- GeofenceMonitor service (visitor app)
- TriggerDebugger component

---

### Phase 5: Indoor Mapping - 4 weeks
**Goal:** Floor plan support for indoor navigation

- [ ] **Floor Plan Upload**
  - Image upload and preview
  - Multi-floor support
  - Floor selector UI

- [ ] **Calibration System**
  - Mark reference points
  - Scale and rotation adjustment
  - Coordinate binding

- [ ] **Zone Definition**
  - Gallery/room boundaries
  - Named areas
  - Restricted zones

- [ ] **Indoor Positioning Display**
  - Floor plan as map layer
  - Stop markers on floor plan
  - Room-based navigation

**Deliverables:**
- FloorPlanUpload component
- FloorPlanCalibrator component
- IndoorMap component
- Zone definition tools

---

### Phase 6: Advanced Navigation - 3 weeks
**Goal:** Turn-by-turn directions and route optimization

- [ ] **Walking Directions**
  - Outdoor: OSRM/Google Directions
  - Indoor: Custom pathfinding
  - Step-by-step instructions

- [ ] **Route Optimization**
  - Shortest path calculation
  - Time-based optimization
  - Accessibility-aware routing

- [ ] **Navigation UI**
  - Current instruction display
  - Next step preview
  - Progress indicator

- [ ] **"I'm Lost" Feature**
  - Detect off-path visitors
  - Recalculate route
  - Optional staff alert

**Deliverables:**
- NavigationService
- TurnByTurnUI component
- RouteOptimizer utility
- OffPathDetector

---

### Phase 7: Offline & Performance - 2 weeks
**Goal:** Work without internet connection

- [ ] **Tile Caching**
  - Pre-download map tiles
  - Storage management
  - Cache invalidation

- [ ] **Offline Positioning**
  - GPS without internet
  - Cached geocode data
  - Pre-loaded assets

- [ ] **Sync Strategy**
  - Queue events offline
  - Sync on reconnect
  - Conflict resolution

**Deliverables:**
- TileCacheManager
- OfflineStorage service
- SyncQueue implementation

---

### Phase 8: Analytics & Polish - 2 weeks
**Goal:** Insights and refinements

- [ ] **Movement Analytics**
  - Path tracking (privacy-compliant)
  - Dwell time calculation
  - Heatmap generation

- [ ] **Curator Dashboard**
  - Map health overview
  - Trigger performance metrics
  - Coverage analysis

- [ ] **Performance Optimization**
  - Lazy load map components
  - Efficient marker rendering
  - Memory management

**Deliverables:**
- MapAnalytics service
- CuratorMapDashboard component
- Performance optimizations

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 4 weeks | 4 weeks |
| Phase 2: Tour Mapping | 3 weeks | 7 weeks |
| Phase 3: Field Positioning | 4 weeks | 11 weeks |
| Phase 4: Geofencing | 4 weeks | 15 weeks |
| Phase 5: Indoor Mapping | 4 weeks | 19 weeks |
| Phase 6: Navigation | 3 weeks | 22 weeks |
| Phase 7: Offline | 2 weeks | 24 weeks |
| Phase 8: Analytics | 2 weeks | **26 weeks** |

**Total Estimated Timeline:** ~6 months for full implementation

---

## Technical Dependencies

### Required Packages
```json
{
  "leaflet": "^1.9.x",           // OSM map rendering
  "react-leaflet": "^4.x",       // React wrapper
  "@react-google-maps/api": "^2.x", // Google Maps (optional)
  "leaflet.markercluster": "^1.x",  // Marker clustering
  "leaflet-draw": "^1.x",        // Drawing tools for zones
  "turf": "^6.x"                 // Geospatial calculations
}
```

### Database Schema Additions
```prisma
model MapBlock {
  id          String   @id @default(cuid())
  stopId      String
  stop        Stop     @relation(fields: [stopId], references: [id])
  
  mode        String   // display, interactive, navigation, overview
  provider    String   // openstreetmap, google
  
  center      Json     // { lat, lng }
  zoom        Int      @default(15)
  style       String?  // satellite, terrain, etc.
  
  markers     Json     // Array of markers
  zones       Json?    // Geofence zones
  route       Json?    // Route data
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FloorPlan {
  id          String   @id @default(cuid())
  buildingId  String
  floor       Int
  name        String
  imageUrl    String
  bounds      Json     // Calibration bounds
  zones       Json?    // Named zones/rooms
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model LocationTrigger {
  id          String   @id @default(cuid())
  stopId      String
  stop        Stop     @relation(fields: [stopId], references: [id])
  
  zone        Json     // Geofence definition
  triggerOn   Json     // entry, exit, dwell config
  actions     Json     // What to do when triggered
  
  enabled     Boolean  @default(true)
  cooldown    Int      @default(300) // seconds
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## Open Questions

1. **Single map provider or always offer choice?**
   - Recommendation: Default to OSM, allow Google upgrade

2. **How to handle indoor positioning without beacons?**
   - Floor plan + manual positioning
   - QR codes at room entrances
   - WiFi fingerprinting (complex)

3. **Privacy implications of location tracking?**
   - Anonymous aggregation only
   - Clear opt-in consent
   - No individual path storage

4. **Offline map storage limits?**
   - Device storage varies
   - Recommend per-tour downloads
   - Warn before large downloads

5. **What3Words worth the cost?**
   - Nice-to-have, not essential
   - Defer to later phase

---

## Appendix: UI Mockups (Conceptual)

### Map Block in Stop Editor
```
┌────────────────────────────────────────────────┐
│ 📍 Map Block                           [⋮] [×] │
├────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐   │
│  │                                        │   │
│  │           [Interactive Map]            │   │
│  │               📍                        │   │
│  │                                        │   │
│  │                        [-] [+]         │   │
│  └────────────────────────────────────────┘   │
│                                               │
│  Latitude:  [41.8781________] °              │
│  Longitude: [-87.6298_______] °              │
│                                               │
│  [📍 Use Current Location] [🔍 Search Address]│
│                                               │
│  ── Trigger Zone ──                          │
│  Radius: [●━━━━━━━━━━] 25m                   │
│  Trigger on: [✓] Entry  [ ] Exit  [ ] Dwell  │
└────────────────────────────────────────────────┘
```

### Tour Overview Map
```
┌────────────────────────────────────────────────┐
│ 🗺 Tour Map: Ancient Egypt                     │
├────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐   │
│  │    ①━━━━━━②                            │   │
│  │            ╲                           │   │
│  │             ③━━④                       │   │
│  │                 ╲                      │   │
│  │                  ⑤━━━⑥                │   │
│  │                       ╲               │   │
│  │                        ⑦ ✓ Current    │   │
│  │                           [-] [+]     │   │
│  └────────────────────────────────────────┘   │
│                                               │
│  Stops: 7 | Distance: 450m | Time: ~45 min   │
│                                               │
│  [🚶 Start Navigation] [📋 List View]         │
└────────────────────────────────────────────────┘
```

---

## References

- [Leaflet Documentation](https://leafletjs.com/reference.html)
- [OpenStreetMap Usage Policies](https://operations.osmfoundation.org/policies/tiles/)
- [Google Maps Platform Pricing](https://cloud.google.com/maps-platform/pricing)
- [Turf.js Geospatial Library](https://turfjs.org/)
- [Geofencing Best Practices](https://developer.apple.com/documentation/corelocation/monitoring_the_user_s_proximity_to_geographic_regions)

---

## Part 10: Map Block Upgrade — Implementation Plan

**Date:** March 23, 2026  
**Status:** IN PROGRESS  
**Goal:** Bring the geographic Map Block to feature parity with the Image Map Block (minus AI features)

### Current State vs. Target

| Capability | Map Block (now) | Image Map Block | Target |
|---|---|---|---|
| **Markers** | Single center marker | Unlimited per floor | **Unlimited markers** |
| **Marker icons** | 5 basic (`default/stop/start/end/poi`) | 16 museum-specific | **16 icons** (shared set) |
| **Marker colors** | None (default blue) | 7+ presets + custom | **Full color picker** |
| **Stop linking** | None | Tap → navigate to stop | **Tap → stop navigation** |
| **Info popups** | None | Glass-morphism popup | **Info popups on visitor tap** |
| **Marker descriptions** | Type exists, not in editor | Rich info text | **Multilingual rich text** |
| **Marker list/sidebar** | None | Select, edit, delete list | **Full marker sidebar** |
| **Translation** | None | LanguageSwitcher + Translate All | **Full translation UI** |
| **Legend** | None | Toggle-able grid below map | **Legend toggle** |
| **Bulk operations** | None | Apply icon/color to all | **Bulk icon/color** |
| **Drag to reposition** | Single marker drag | Per-marker drag | **Per-marker drag** |

### Design Decisions

1. **Reuse existing components:** `ColorPicker`, `LanguageSwitcher`, `PreviewChoiceModal`, `magicTranslate()`
2. **Shared icon type with ImageMap:** `MapMarkerIcon` = same 16 icons (pin, dot, number, star, info, accessibility, restroom, stairs, elevator, exit, cafe, gift-shop, ticket, camera, audio-guide, parking)
3. **Custom Leaflet markers via `L.divIcon`:** Render colored markers with icon SVGs — no image files needed per combo
4. **Backward-compatible data model:** Existing single-marker blocks continue working; `markers[]` array extends the block
5. **Two-tab sidebar:** "Markers" tab (list + selected marker editor) + "Settings" tab (provider, style, size, trigger zone)
6. **Museum-first UX:** Click map → marker placed → sidebar highlights it for naming → staff labels exhibits, amenities, stops

### Phase 1: Data Model & Multi-Marker Foundation ✅
- [x] Expand `MapMarker` type with `color`, `stopId`, `infoText`, shared icon type
- [x] Editor: click-to-place adds new markers (not replaces)
- [x] Marker list sidebar with select/edit/delete
- [x] Selected marker editing (label, icon, color, description, stop link)
- [x] Tabbed sidebar: Markers tab + Settings tab

### Phase 2: Marker Customization (Icons, Colors, Stop Links) ✅
- [x] 16 icon types (reuse ImageMap icon set)
- [x] `ColorPicker` component integration
- [x] Stop linking dropdown (from `allStops` prop)
- [x] Info text multilingual textarea
- [x] Custom Leaflet `L.divIcon` markers with color + icon rendering
- [x] Numbered markers when icon is `number`

### Phase 3: Visitor Experience (Preview) ✅
- [x] Custom colored marker rendering in MapPreview (Leaflet + Google)
- [x] Info popup on marker tap (glassmorphism, matching Image Map style)
- [x] "Go to stop" button in popups for linked markers
- [x] Legend below map (toggleable)
- [x] Marker labels as tooltips

### Phase 4: Translation Integration ✅
- [x] LanguageSwitcher in editor header
- [x] "Translate All" button with `magicTranslate()` batch
- [x] Translation coverage counter ("X/Y translated")
- [x] Source-hash dirty tracking (same `_sourceHash` pattern)

### Phase 5: Polish & Bulk Operations ✅
- [x] Bulk icon/color apply ("Apply to all markers" toolbar)
- [x] Fit bounds auto-zoom for multiple markers
- [x] Show route lines toggle (connecting lines between markers)
- [x] Show labels toggle

### Phase 6: Bug Fixes & Polish ✅
- [x] **Translation bug fix:** `handleTranslateAll()` used `result.translations` which was always `undefined` — `magicTranslate()` returns a flat `{ [lang]: string }` object directly, not wrapped in `.translations`. Fixed to spread result directly: `{ ...marker.title, ...translations }` (matches ImageMapEditorModal pattern)
- [x] **Translation applies to both fields:** marker title AND info text are now both translated and stamped with `_sourceHash`
- [x] **Translated text visible in editor:** After translation, switching languages via LanguageSwitcher shows translated text in the sidebar inputs (was already wired, just never received data due to the bug above)
- [x] **Preview button added:** Uses `PreviewChoiceModal` (same component as ImageMap) — conditionally shown when `stop` and `tourData` props are available
- [x] **"Done" renamed to "Save & Close"** for clarity
- [x] **StopEditor prop wiring:** `stop={editedStop}` and `tourData={tourData}` now passed to MapEditorModal so Preview works

### Phase 7: Visitor UX & Interaction Controls ✅
- [x] **Leaflet CSS overrides for Tailwind** — Tailwind's preflight (`img { display: block; max-width: 100% }`) broke Leaflet tile/marker rendering. Added global CSS overrides in `index.css` for `.leaflet-container img`, `.leaflet-container svg`, `.map-custom-marker`, and popup styling
- [x] **`allowInteraction` toggle** — New `MapBlockData.allowInteraction` field (defaults to `true`). Toggle in Settings tab: "Allow Pinch/Zoom — Let visitors drag, pinch, and zoom the map". `StopContentBlock.renderMapBlock` now reads `data.allowInteraction` to set `interactive` prop
- [x] **Fixed `interactive` in renderMapBlock** — Was hardcoded `false`; now `mode === 'view' && data.allowInteraction !== false`
- [x] **Fixed `onStopNavigate` in renderMapBlock** — Was not passed to MapPreview; now wired so marker stop links work in preview and published tours
- [x] **Google Maps missing deps** — `GoogleMapView` useEffect was missing `data.markers`, `data.showRouteLines`, `language` in dependency array; markers wouldn't update when data changed
- [x] **Fit bounds for multi-markers** — Both OpenStreetMap and Google Maps auto-fit viewport to show all markers with padding when >1 marker exists
- [x] **XSS prevention in popups** — Added `escapeHtml()` for all user-supplied text rendered as HTML in Leaflet popups
- [x] **Stop link click delegation** — Popup "Go to stop" links now handled via Leaflet `popupopen` event delegation instead of relying on inline handlers
- [x] **Leaflet `tap: true`** — Ensures marker tap/click works even when map dragging is disabled (non-interactive mode)
- [x] **Popup styling** — Global CSS for `.leaflet-popup-content-wrapper` (rounded corners) and `.map-stop-link` (styled navigation link)

### Phase 8: Preview Button Fix (Stacking Context) ✅
- [x] **Root cause: CSS stacking context + Leaflet z-indices** — MapEditorModal's root div (`fixed inset-0 z-[100]`) creates a stacking context. Inside it, Leaflet injects z-[1000] elements (map controls, overlays). PreviewChoiceModal rendered inside this DOM tree was trapped beneath Leaflet's high z-index elements regardless of its own z-index value.
- [x] **Failed attempt 1 (Session 3):** Added PreviewChoiceModal inside MapEditorModal DOM — appeared as black box, never visible
- [x] **Failed attempt 2 (Session 5):** Built synthetic previewStop — data correct but rendering still broken
- [x] **Failed attempt 3 (Session 6):** Bumped z-index from z-50 → z-[110] on PreviewChoiceModal/StopPreviewModal/KioskLauncherModal — still trapped in stacking context
- [x] **Fix: React `createPortal(document.body)`** — Renders PreviewChoiceModal outside MapEditorModal's DOM tree entirely, escaping the stacking context. Only MapEditorModal.tsx changed.
- [x] **Key lesson:** z-index bumps cannot escape CSS stacking contexts when sibling elements (Leaflet) use z-1000+. The only reliable fix is `createPortal` to render on `document.body`.

### Phase 9: Marker Popup Styling ✅
- [x] **Enhanced popup design** — Styled `.leaflet-popup-content-wrapper` with subtle shadow, clean border, larger border-radius for modern look
- [x] **Close button styling** — Custom styled close button matching app design language
- [x] **Popup title styling** — Bold title with proper color and spacing
- [x] **Info text styling** — Muted color, proper margins
- [x] **Stop link styling** — Emerald accent color, arrow indicator, hover underline
- [x] **Popup tip (pointer arrow)** — Styled to match popup wrapper background

---

*Document prepared for TourStack development team*  
*Last updated: March 23, 2026*
