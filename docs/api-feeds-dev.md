# TourStack API & Feeds - Development Planning Document

## Overview

The **API & Feeds** section is a full-featured management interface for TourStack's API endpoints and JSON feeds. This section enables tour creators to manage, test, and configure the data feeds that power mobile apps and external integrations.

**Target Users:** Tour developers, mobile app integrators, museum IT teams  
**Primary Goal:** Provide a comprehensive interface for managing and testing tour data exports

---

## ✅ Implementation Status (January 22, 2026)

| Phase | Status |
|-------|--------|
| Phase 1: API Dashboard & Feeds | ✅ Complete |
| Phase 2: Query Parameters | ✅ Complete |
| Phase 3: API Keys | 🔜 Coming Soon |
| Phase 4: Webhooks | 🔜 Coming Soon |
| Phase 5: Testing Interface | 🔜 Coming Soon |

### Implemented Features

**API & Feeds Page:**
- ✅ Tabbed interface (Overview, Feeds, API Keys, Webhooks, Testing)
- ✅ Overview tab with API status, stats, quick actions
- ✅ Feeds tab with feed listing and JSON preview modal
- ✅ Copy URL and download functionality

**Feed Endpoints:**
- ✅ `GET /api/feeds/tours` - All tours feed
- ✅ `GET /api/feeds/tours/:id` - Single tour feed
- ✅ `GET /api/feeds/tours/:id/stops` - Tour stops only

**Query Parameters:**
- ✅ `?lang=es` - Filter content to specific language
- ✅ `?format=full|compact|minimal` - Control output verbosity
- ✅ `?status=published` - Filter by tour status
- ✅ `?include_stops=false` - Exclude stops from response

---

## Current State Audit

### API Structure

```
app/server/routes/
├── audio.ts          # Deepgram TTS generation
├── elevenlabs.ts     # ElevenLabs TTS generation
├── feeds.ts          # Tour JSON feeds (NEW)
├── media.ts          # File uploads (images, audio)
├── settings.ts       # App settings CRUD
├── stops.ts          # Stop CRUD operations
├── templates.ts      # Tour templates
├── tours.ts          # Tour CRUD operations
├── translate.ts      # LibreTranslate integration
└── index.ts          # Route aggregator
```

### Current API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tours` | GET, POST | List/create tours |
| `/api/tours/:id` | GET, PUT, DELETE | Tour CRUD |
| `/api/tours/:id/stops` | GET, POST | Tour stops |
| `/api/stops/:id` | GET, PUT, DELETE | Stop CRUD |
| `/api/templates` | GET | Tour templates |
| `/api/media/upload` | POST | File uploads |
| `/api/settings` | GET, PUT | App settings |
| `/api/audio/*` | Various | Deepgram TTS |
| `/api/elevenlabs/*` | Various | ElevenLabs TTS |
| `/api/translate` | POST | Text translation |
| `/api/feeds/tours` | GET | All tours JSON feed |
| `/api/feeds/tours/:id` | GET | Single tour JSON feed |
| `/api/feeds/tours/:id/stops` | GET | Tour stops JSON feed |

### Remaining Features (Coming Soon)

- API key authentication
- Rate limiting
- Webhook support
- API testing interface

---

## Feature Brainstorm

### Phase 1: API Dashboard (Essential - MVP)

#### 1.1 API Overview Page
- [ ] API status indicators (healthy/degraded/down)
- [ ] Request count metrics (today, this week, this month)
- [ ] Error rate display
- [ ] Quick links to documentation

#### 1.2 Feed Management
- [ ] List all available feeds (tours, stops, media)
- [ ] Feed preview with JSON viewer
- [ ] Copy feed URL button
- [ ] Feed refresh/regenerate button
- [ ] Last updated timestamp

#### 1.3 Tour JSON Feeds
- [ ] `/api/feeds/tours` - All published tours
- [ ] `/api/feeds/tours/:id` - Single tour with all stops
- [ ] `/api/feeds/tours/:id/stops` - Tour stops only
- [ ] `/api/feeds/tours/:id/media` - Tour media manifest

#### 1.4 Feed Formats
- [ ] JSON (default)
- [ ] JSON with media URLs resolved
- [ ] Compressed JSON (minified)
- [ ] JSON with embedded base64 media (optional)

### Phase 2: API Authentication

#### 2.1 API Keys
- [ ] Generate API keys
- [ ] Key naming/labeling
- [ ] Key permissions (read-only, read-write)
- [ ] Key expiration dates
- [ ] Revoke/regenerate keys
- [ ] Usage tracking per key

#### 2.2 Authentication Methods
- [ ] API key in header (`X-API-Key`)
- [ ] API key in query param (`?api_key=`)
- [ ] Bearer token support (future)

### Phase 3: API Testing Interface

#### 3.1 Request Builder
- [ ] Endpoint selector dropdown
- [ ] Method selector (GET, POST, PUT, DELETE)
- [ ] Headers editor
- [ ] Request body editor (JSON)
- [ ] Send request button
- [ ] Response viewer with syntax highlighting

#### 3.2 Response Inspector
- [ ] Status code display
- [ ] Response headers
- [ ] Response body (formatted JSON)
- [ ] Response time
- [ ] Copy response button
- [ ] Download response as file

#### 3.3 Saved Requests
- [ ] Save request configurations
- [ ] Request history
- [ ] Request collections/folders

### Phase 4: Webhooks

#### 4.1 Webhook Management
- [ ] Create webhook endpoints
- [ ] Event type selection:
  - Tour published
  - Tour updated
  - Stop added/updated/deleted
  - Media uploaded
  - Audio generated
- [ ] Webhook URL configuration
- [ ] Secret key for signature verification
- [ ] Enable/disable toggle

#### 4.2 Webhook Testing
- [ ] Test webhook delivery
- [ ] View delivery history
- [ ] Retry failed deliveries
- [ ] Webhook logs

### Phase 5: Mobile App Integration

#### 5.1 Mobile SDK Support
- [ ] iOS Swift code snippets
- [ ] Android Kotlin code snippets
- [ ] React Native examples
- [ ] Flutter examples

#### 5.2 Offline Support
- [ ] Generate offline bundle (tour + media)
- [ ] Bundle versioning
- [ ] Delta updates (changed content only)
- [ ] Bundle size estimation

#### 5.3 QR Code Integration
- [ ] Generate tour entry QR codes
- [ ] Deep link configuration
- [ ] QR code styling options
- [ ] Batch QR generation

### Phase 6: Analytics API

#### 6.1 Analytics Endpoints
- [ ] `/api/analytics/tours/:id` - Tour analytics
- [ ] `/api/analytics/stops/:id` - Stop analytics
- [ ] `/api/analytics/visitors` - Visitor metrics
- [ ] Date range filtering
- [ ] Aggregation options (hourly, daily, weekly)

#### 6.2 Real-time Events
- [ ] WebSocket endpoint for live updates
- [ ] Server-sent events (SSE) alternative
- [ ] Event types: visitor_entered, stop_viewed, audio_played

---

## Technical Architecture

### Feed Generation Strategy

```typescript
// Feed types
interface TourFeed {
  version: string;           // Feed schema version
  generated_at: string;      // ISO timestamp
  tour: {
    id: string;
    title: LocalizedText;
    description: LocalizedText;
    languages: string[];
    stops: StopFeed[];
    media: MediaManifest;
  };
}

interface StopFeed {
  id: string;
  order: number;
  title: LocalizedText;
  content: ContentBlock[];
  positioning: PositioningConfig;
  media: MediaReference[];
}

interface LocalizedText {
  [languageCode: string]: string;
}
```

### API Key Schema (Prisma)

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  name        String
  key         String    @unique
  keyHash     String    // SHA-256 hash for secure storage
  permissions String[]  // ['read', 'write', 'admin']
  expiresAt   DateTime?
  lastUsedAt  DateTime?
  usageCount  Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  revokedAt   DateTime?
  
  // Relations
  createdBy   String?
}

model Webhook {
  id          String    @id @default(cuid())
  name        String
  url         String
  secret      String
  events      String[]  // ['tour.published', 'stop.updated', etc.]
  enabled     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  deliveries  WebhookDelivery[]
}

model WebhookDelivery {
  id          String    @id @default(cuid())
  webhookId   String
  event       String
  payload     String    @db.Text
  statusCode  Int?
  response    String?   @db.Text
  deliveredAt DateTime?
  createdAt   DateTime  @default(now())
  
  webhook     Webhook   @relation(fields: [webhookId], references: [id])
}
```

### New API Routes

```typescript
// Feed routes
GET  /api/feeds/tours                    // All published tours
GET  /api/feeds/tours/:id                // Single tour feed
GET  /api/feeds/tours/:id/bundle         // Offline bundle (ZIP)

// API key management
GET  /api/keys                           // List API keys
POST /api/keys                           // Create API key
DELETE /api/keys/:id                     // Revoke API key

// Webhooks
GET  /api/webhooks                       // List webhooks
POST /api/webhooks                       // Create webhook
PUT  /api/webhooks/:id                   // Update webhook
DELETE /api/webhooks/:id                 // Delete webhook
POST /api/webhooks/:id/test              // Test webhook

// Analytics
GET  /api/analytics/overview             // Dashboard metrics
GET  /api/analytics/tours/:id            // Tour-specific analytics
```

---

## UI/UX Design

### Navigation

Add "API & Feeds" to sidebar between "Analytics" and "Tools":

```
Dashboard
Tours
Collections
Templates
Media Library
Languages
Audio
Analytics
🔌 API & Feeds (NEW)    <-- Insert here
Tools
---
Settings
Help
```

### Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔌 API & Feeds                                              │
├─────────────────────────────────────────────────────────────┤
│  [Overview]  [Feeds]  [API Keys]  [Webhooks]  [Testing]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  API Status: ● Healthy                              │    │
│  │                                                     │    │
│  │  Requests Today: 1,247                              │    │
│  │  Error Rate: 0.02%                                  │    │
│  │  Avg Response Time: 45ms                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Quick Actions                                      │    │
│  │                                                     │    │
│  │  [📋 Copy Feed URL]  [🔑 New API Key]  [📤 Export] │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Available Feeds                          [Refresh] │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │ 📦 All Tours Feed                           │    │    │
│  │  │    /api/feeds/tours                         │    │    │
│  │  │    Last updated: 2 hours ago    [Copy] [View]│    │    │
│  │  ├─────────────────────────────────────────────┤    │    │
│  │  │ 📦 Ancient Egypt Tour                       │    │    │
│  │  │    /api/feeds/tours/tour_001                │    │    │
│  │  │    12 stops • 3 languages    [Copy] [View]  │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Feed Viewer Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Feed Preview: Ancient Egypt Tour              [×]          │
├─────────────────────────────────────────────────────────────┤
│  URL: https://tourstack.app/api/feeds/tours/tour_001       │
│  Format: [JSON ▼]  Language: [All ▼]  [Copy URL] [Download] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   "version": "1.0",                                │    │
│  │   "generated_at": "2026-01-22T19:00:00Z",         │    │
│  │   "tour": {                                        │    │
│  │     "id": "tour_001",                              │    │
│  │     "title": {                                     │    │
│  │       "en": "Ancient Egypt: Journey Through Time", │    │
│  │       "es": "Antiguo Egipto: Viaje en el Tiempo"  │    │
│  │     },                                             │    │
│  │     ...                                            │    │
│  │   }                                                │    │
│  │ }                                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Size: 45.2 KB • 12 stops • 3 languages • 24 media files   │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Sprint 1: Foundation (Week 1-2)
1. [ ] Add API & Feeds route to sidebar
2. [ ] Create page with tab structure
3. [ ] Build Overview tab with status display
4. [ ] Create basic feed listing

### Sprint 2: Feed Management (Week 3-4)
5. [ ] Implement `/api/feeds/tours` endpoint
6. [ ] Implement `/api/feeds/tours/:id` endpoint
7. [ ] Build feed preview modal with JSON viewer
8. [ ] Add copy URL and download functionality

### Sprint 3: API Keys (Week 5-6)
9. [ ] Add ApiKey model to Prisma schema
10. [ ] Implement key generation/revocation
11. [ ] Build API Keys management UI
12. [ ] Add authentication middleware

### Sprint 4: Testing Interface (Week 7-8)
13. [ ] Build request builder component
14. [ ] Implement response viewer
15. [ ] Add request history
16. [ ] Create saved requests feature

### Sprint 5: Webhooks (Week 9-10)
17. [ ] Add Webhook models to schema
18. [ ] Implement webhook CRUD endpoints
19. [ ] Build webhook management UI
20. [ ] Add webhook delivery system

---

## Future Considerations

### GraphQL API
- Consider adding GraphQL endpoint for flexible queries
- Useful for mobile apps that need specific data shapes
- Could coexist with REST API

### Rate Limiting
- Implement per-key rate limits
- Configurable limits per tier
- Rate limit headers in responses

### Caching
- Redis caching for feed responses
- Cache invalidation on content changes
- ETags for conditional requests

### Versioning
- API versioning strategy (URL vs header)
- Deprecation policy
- Migration guides

### Documentation
- OpenAPI/Swagger spec generation
- Interactive API documentation
- Code examples in multiple languages

---

## Questions to Resolve

1. **Authentication Strategy**: API keys only, or also support OAuth2?
2. **Rate Limits**: What limits are appropriate for free vs paid tiers?
3. **Feed Caching**: How long should feeds be cached?
4. **Webhook Retries**: How many retries, with what backoff?
5. **Offline Bundles**: What's the max bundle size?
6. **Analytics Granularity**: How detailed should analytics be?

---

## Dependencies

```json
{
  "nanoid": "^5.x",           // API key generation
  "rate-limiter-flexible": "^4.x",  // Rate limiting
  "node-fetch": "^3.x",       // Webhook delivery
  "archiver": "^6.x"          // ZIP bundle generation
}
```

---

*Document created: January 22, 2026*  
*Status: Planning Phase*  
*Next: Review with stakeholders, prioritize MVP features*
