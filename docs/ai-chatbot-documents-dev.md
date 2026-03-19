# AI Chatbot & Documents Collection Development Plan

> **Phase 25 COMPLETE | Phase 26.1 COMPLETE | Phase 26.2 COMPLETE | Phase 26.3 COMPLETE ✅**
> Museum-wide concierge + Per-tour concierge + Chatbot UX Unification
> **Last Updated:** March 19, 2026

---

# ✅ PHASE 26.2 COMPLETE - Per-Tour AI Concierge

## What Was Built

Each tour now has its own **full-featured AI Chatbot** tab with:

| Feature | Status | Description |
|---------|--------|-------------|
| Enable/Disable | ✅ | Toggle AI for this tour |
| Persona | ✅ | 6 options including "Inherit Museum Default" |
| Welcome Message | ✅ | Per-tour customizable |
| **Quick Actions** | ✅ | Add, delete, drag-reorder |
| **Knowledge Sources** | ✅ | Import modal + list with delete |
| **Translate All** | ✅ | Translates to tour's languages |
| **Test Chatbot** | ✅ | Full test panel with response |

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tour AI Chatbot Knowledge                     │
├─────────────────────────────────────────────────────────────────┤
│  1. Tour Content (automatic)                                     │
│     - Tour title & description                                   │
│     - All stop content (titles, descriptions, text blocks)       │
│                                                                  │
│  2. Linked Document Collections (user selects)                   │
│     - Museum info (hours, services, contact)                     │
│     - Artist biographies                                         │
│     - Exhibit deep-dives                                         │
│     - Any uploaded PDFs/documents with extracted text            │
└─────────────────────────────────────────────────────────────────┘
```

## Files Modified

| File | Changes |
|------|---------|
| `app/prisma/schema.prisma` | Added `conciergeQuickActions` field |
| `app/src/types/index.ts` | Added `TourQuickAction` interface |
| `app/server/routes/tours.ts` | Parse/save conciergeQuickActions JSON |
| `app/src/components/TourConciergeTab.tsx` | **Complete rebuild** with all features |

## Database Schema (Tour Concierge Fields)

```sql
-- Tour table concierge columns:
conciergeEnabled      INTEGER NOT NULL DEFAULT 1   -- Enable/disable
conciergePersona      TEXT                         -- null = inherit museum
conciergeWelcome      TEXT                         -- JSON multilingual
conciergeCollections  TEXT                         -- JSON array of collection IDs
conciergeQuickActions TEXT                         -- JSON array of quick actions
```

## Quick Actions JSON Structure

```typescript
interface TourQuickAction {
  id: string;
  question: { [lang: string]: string }; // Multilingual
  category: 'hours' | 'accessibility' | 'services' | 'exhibitions' | 'general';
  order: number;
  enabled: boolean;
}
```

## Usage Workflow

### Step 1: Create Document Collections
1. Go to **Collections** page
2. Create "Documents" type collections:
   - "Museum Info" (hours, services, contact)
   - "Artist Biographies"
   - "Exhibit Research"

### Step 2: Configure Tour AI
1. Open a tour → **AI Chatbot** tab
2. Set persona (or inherit museum default)
3. Add custom welcome message
4. Click **Import** to link document collections
5. Add tour-specific **Quick Actions**
6. **Click "Save Changes"**

### Step 3: Test
Use the Test Chatbot panel to ask questions - the AI will know:
- Everything about the tour's stops
- Everything in linked document collections

---

# 🗄️ DEEP DATABASE & PRISMA AUDIT

## Database Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TourStack Database                           │
├─────────────────────────────────────────────────────────────────────┤
│  Location:  /Users/paulhenshaw/Desktop/TourStack/app/data/dev.db   │
│  Type:      SQLite                                                  │
│  ORM:       Prisma 5.21.1                                          │
│  Client:    Generated to src/generated/prisma/                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `app/.env` | DATABASE_URL="file:./data/dev.db" |
| `app/prisma/schema.prisma` | Database schema definition |
| `app/server/db.ts` | Prisma client singleton |
| `app/src/generated/prisma/` | Auto-generated Prisma client |

## Current Schema (13 Tables)

### Core Tables
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Museum` | Single museum owner | id, name, branding (JSON) |
| `Template` | Tour templates | customFields (JSON) |
| `Tour` | Tours | title (JSON), languages (JSON), concierge fields |
| `Stop` | Tour stops | content (JSON), triggers (JSON) |
| `AppSettings` | Global settings | maps (JSON), positioning (JSON) |

### Media & Collections
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Media` | Media library | aiMetadata (JSON), aiTranslations (JSON) |
| `Collection` | Galleries/datasets | items (JSON), texts (JSON) |

### AI Concierge (Phase 26)
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `ConciergeConfig` | Museum-wide AI settings | welcomeMessage (JSON), enabledLanguages (JSON) |
| `ConciergeKnowledge` | Imported knowledge | content, characterCount |
| `ConciergeQuickAction` | Quick action buttons | question (JSON), category |

---

## 🚨 CRITICAL: Prisma vs SQLite Sync Issues

### The Problem We Hit
```
❌ prisma db push said "already in sync"
❌ But columns weren't actually in SQLite!
❌ Used --force-reset which WIPED the database!
```

### Why This Happened
1. **Migration table is OUT OF SYNC** - Only 2 migrations recorded:
   - `20260117154655_init`
   - `20260117224757_add_collections`
   
2. **But 4 migration folders exist!**
   - `20260117154655_init/`
   - `20260117224757_add_collections/`
   - `20260125052857_add_slugs_for_readable_urls/` ← NOT IN DB!
   - `20260130001213_add_media_dimensions/` ← NOT IN DB!

3. **Columns were added via `db push` or manual SQL** without proper migrations

### Current State (MESSY)
```sql
-- Tour table has columns added multiple ways:
"defaultTranslationProvider" -- via migration or db push?
"slug"                       -- via migration (but not recorded!)
"conciergeEnabled"           -- via manual ALTER TABLE
"conciergePersona"           -- via manual ALTER TABLE
"conciergeWelcome"           -- via manual ALTER TABLE
"conciergeCollections"       -- via manual ALTER TABLE
```

---

## ✅ SAFE DATABASE CHANGE PROCEDURES

### For Development (RECOMMENDED)

**Option A: `prisma db push` (Quick, No Migration)**
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npx prisma db push
```
- ✅ Fast, no migration files
- ✅ Good for dev/prototyping
- ⚠️ Can't rollback
- ⚠️ May lose data if columns removed
- ❌ NEVER use `--force-reset` (wipes database!)

**Option B: Manual SQL (Direct Control)**
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
sqlite3 data/dev.db "ALTER TABLE Tour ADD COLUMN newField TEXT;"
```
- ✅ Full control
- ✅ No Prisma sync issues
- ⚠️ Must regenerate Prisma client: `npx prisma generate`
- ⚠️ Schema must match what you add

### For Production (PROPER MIGRATIONS)

**Create a Migration:**
```bash
cd /Users/paulhenshaw/Desktop/TourStack/app
npx prisma migrate dev --name your_migration_name
```
- ✅ Creates SQL file in migrations/
- ✅ Recorded in _prisma_migrations
- ✅ Can be applied to production
- ⚠️ Takes longer

**Apply Migration to Production:**
```bash
npx prisma migrate deploy
```

---

## 📋 JSON Field Patterns

TourStack uses **JSON strings** in SQLite for flexible multilingual content.

### Common JSON Patterns

```typescript
// Multilingual text
{
  "en": "Welcome!",
  "es": "¡Bienvenido!",
  "fr": "Bienvenue!"
}

// Array of IDs
["coll_123", "coll_456"]

// Complex nested
{
  "wheelchairAccessible": true,
  "audioDescriptions": true,
  "signLanguage": false
}
```

### Parsing in Routes
```typescript
// Reading JSON from DB
const collections = tour.conciergeCollections 
  ? JSON.parse(tour.conciergeCollections) 
  : [];

// Writing JSON to DB
await prisma.tour.update({
  where: { id },
  data: {
    conciergeCollections: JSON.stringify(collectionIds)
  }
});
```

---

## 🔧 Quick Reference Commands

```bash
# Navigate to app directory FIRST (critical!)
cd /Users/paulhenshaw/Desktop/TourStack/app

# View current database schema
sqlite3 data/dev.db ".schema"

# View specific table
sqlite3 data/dev.db "PRAGMA table_info(Tour);"

# Count records
sqlite3 data/dev.db "SELECT COUNT(*) FROM Tour;"

# Regenerate Prisma client (after schema changes)
npx prisma generate

# Push schema changes (dev only)
npx prisma db push

# Reset database and seed (DESTRUCTIVE!)
npx prisma db push --force-reset && npx tsx prisma/seed.ts

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## 🎯 Phase 26.2 Database Requirements

### Current Tour Concierge Fields (DONE)
```prisma
// In Tour model - already added
conciergeEnabled     Boolean @default(true)
conciergePersona     String?
conciergeWelcome     String? // JSON multilingual
conciergeCollections String? // JSON array of collection IDs
```

### NEEDED: Tour Quick Actions

**Option 1: JSON field on Tour (SIMPLER)**
```prisma
// Add to Tour model
conciergeQuickActions String? // JSON array of quick actions
```

JSON structure:
```json
[
  {
    "id": "qa_123",
    "question": { "en": "Where's the gift shop?", "es": "¿Dónde está la tienda?" },
    "category": "services",
    "order": 0,
    "enabled": true
  }
]
```

**Option 2: Separate table (MORE RELATIONAL)**
```prisma
model TourQuickAction {
  id       String @id @default(cuid())
  tourId   String
  tour     Tour   @relation(fields: [tourId], references: [id], onDelete: Cascade)
  question String // JSON multilingual
  category String
  order    Int    @default(0)
  enabled  Boolean @default(true)
  createdAt DateTime @default(now())
  
  @@index([tourId])
}
```

**RECOMMENDATION: Option 1 (JSON field)**
- Matches existing pattern (conciergeCollections is JSON)
- Simpler API - just update Tour
- No new migration table drama
- Can always migrate to table later if needed

---

## 🚨 DEEP AUDIT: Phase 26.2 Status (Feb 2, 2026)

### What We Have Working at `/concierge` (Museum-Wide)

| Feature | Component | Status |
|---------|-----------|--------|
| Enable/Disable toggle | ✅ | Working |
| Persona selection | ✅ | 5 presets + custom |
| Welcome Message (multilingual) | ✅ | JSON storage |
| Language config (EN/ES/FR/DE) | ✅ | Toggle buttons |
| Auto-translate responses | ✅ | Checkbox |
| **Quick Actions** | ✅ | Add, delete, drag-reorder |
| **Translate All** button | ✅ | Bulk translate quick actions |
| **Knowledge Sources** | ✅ | Import document collections |
| **Test Concierge** | ✅ | Live preview with response |
| **Import Collection Modal** | ✅ | Select & import docs |

### What TourConciergeTab Has (COMPLETE — Updated March 19, 2026)

| Feature | Status | Notes |
|---------|--------|-------|
| Enable/Disable toggle | ✅ | Working |
| Persona selection | ✅ | 6 options including "Inherit Museum Default" |
| Welcome Message | ✅ | Multilingual with LanguageSwitcher + MagicTranslateButton |
| Link Document Collections | ✅ | Import modal + list with delete |
| Test Chat | ✅ | Full preview panel |
| **Quick Actions** | ✅ | Add/delete/drag-reorder with per-language editing |
| **Per-Action Translate** | ✅ | LanguageSwitcher + MagicTranslateButton per action row |
| **Knowledge Sources list** | ✅ | Visual list of linked collections |
| **Import Modal** | ✅ | Select & import document collections |

---

## 🎯 IMPLEMENTED: Full Feature Parity ✅

**TourStack is a SWISS ARMY KNIFE platform!**

Each tour can be completely different:
- Different museum floors
- Indoor vs outdoor tours
- Different subject matter (art, history, nature)
- Different audiences (kids, scholars, general)
- Different technologies and contexts

**ONE SIZE FITS ALL IS WRONG** - Each tour NEEDS its own:
- ✅ Quick Actions (tour-specific questions)
- ✅ Knowledge Sources (tour-specific documents)  
- ✅ Persona (different tone per tour)
- ✅ Translate All (tour-specific translations)

---

## ✅ Phase 26.2 Implementation (COMPLETED Feb 2, 2026)

### Step 1: Database ✅ DONE
- [x] Add `conciergeEnabled`, `conciergePersona`, `conciergeWelcome`, `conciergeCollections` to Tour model
- [x] Add `conciergeQuickActions` JSON field on Tour (simpler than new table)

### Step 2: API ✅ DONE
- [x] Update `/api/chat` to accept `tourId`
- [x] Build tour-specific knowledge from stops + linked collections
- [x] Parse/save quick actions in tours.ts routes (JSON field approach)

### Step 3: UI ✅ DONE
- [x] Rebuild `TourConciergeTab` with FULL features:
  - Quick Actions (add/delete/drag-reorder)
  - Knowledge Sources (import modal + list)
  - Test Chat panel
  - Translate All button
  - Persona selector with "Inherit Museum Default"
  - Welcome message editor

### Step 4: ChatDrawer Integration ✅ DONE
- [x] Accept `tourId` prop
- [x] Pass to `/api/chat`

---

## 🔧 Final Implementation Details

### Database: JSON Field Approach (Simpler)
```prisma
// Tour model - concierge fields:
conciergeEnabled      Boolean @default(true)
conciergePersona      String?
conciergeWelcome      String? // JSON multilingual
conciergeCollections  String? // JSON array of collection IDs
conciergeQuickActions String? // JSON array of TourQuickAction
```

### TourConciergeTab.tsx - Complete Rebuild
- Uses `conciergeService.PERSONAS` for consistency
- Uses `conciergeService.QUICK_ACTION_CATEGORIES` for consistency
- Local state management (not API calls for each action)
- Single "Save Changes" button for all changes
- Full drag-and-drop reordering
- Import modal for linking collections

### Chat API Knowledge Building
```typescript
// In chat.ts - buildTourKnowledge():
1. Load tour title + description
2. Load all stop content (titles, descriptions, text blocks)
3. Load linked collections (conciergeCollections)
   - Extract text from documents
   - Include AI analysis summaries
4. Return combined context for Gemini
```
- Left column: Persona, Welcome, Languages
- Right column: Quick Actions, Knowledge Sources, Test Chat

---

## Phase Summary

| Phase | Feature | Status |
|-------|---------|--------|
| **Phase 25** | Documents Collection (Staff Tools) | COMPLETE ✅ |
| **Phase 26.1** | Museum-Wide AI Concierge | COMPLETE ✅ |
| **Phase 26.2** | Per-Tour AI Concierge | COMPLETE ✅ |
| **Phase 26.3** | Chatbot UX Unification | COMPLETE ✅ |
| **Phase 26.4** | AI Analysis Integration | PLANNED |
| **Phase 27** | Location-Aware AI Responses | FUTURE VISION |

---

## PHASE 25: Documents Collection (COMPLETE)

### What's Implemented

| Feature | Status |
|---------|--------|
| DocumentCollectionWizard | 3-step upload wizard |
| Multi-format extraction | PDF, DOCX, DOC, RTF, ODT, PPTX |
| DocumentAIToolsPanel | Full-width with Single/Batch modes |
| AI Tools (Summarize/Facts/FAQ/Tags) | Working |
| Batch document selection | Checkbox UI |
| Auto-save persistence | Immediate DB save |

### Key Files

| Component | Path |
|-----------|------|
| Document Wizard | `app/src/components/collections/DocumentCollectionWizard.tsx` |
| AI Tools Panel | `app/src/components/collections/DocumentAIToolsPanel.tsx` |
| Documents API | `app/server/routes/documents.ts` |
| Gemini Analysis | `app/server/routes/gemini.ts` |

---

## PHASE 26.1: Museum-Wide AI Concierge (COMPLETE)

### What's Working

| Feature | Status | Notes |
|---------|--------|-------|
| `/concierge` admin page | Working | Full configuration UI |
| Persona selection | Working | Friendly, Professional, Fun, Scholarly, Custom |
| Welcome message | Working | Multilingual JSON storage |
| Language configuration | Working | EN, ES, FR, DE toggles |
| Knowledge Sources | Working | Import from document collections |
| Quick Actions | Working | Add, delete, drag-reorder |
| Translate All | Working | Google Translate API |
| Test Concierge | Working | Preview chat responses |
| ChatDrawer integration | Working | Fetches dynamic config |

### Database Tables

```sql
ConciergeConfig       -- Main configuration
ConciergeKnowledge    -- Knowledge sources (document imports)
ConciergeQuickAction  -- Quick action buttons
```

### Key Files

| Component | Path |
|-----------|------|
| Admin Page | `app/src/pages/Concierge.tsx` |
| Service Client | `app/src/lib/conciergeService.ts` |
| API Routes | `app/server/routes/concierge.ts` |
| Chat Drawer | `app/src/components/chat/ChatDrawer.tsx` |

### Bug Fixes Applied (See ai-concierge-bug.md)

1. **500 Error** - Database tables didn't exist, created manually with SQL
2. **Import modal empty** - Filter was `'documents'` but type is `'document_collection'`
3. **Quick action text missing** - JSON `question` field wasn't being parsed

---

## PHASE 26.2: Per-Tour AI Concierge (COMPLETE ✅)

### Vision

Each tour gets its own AI chatbot that knows specifically about THAT tour. Visitors on "Ancient Egypt" get an Egypt expert. Visitors on "Modern Art" get an art critic.

**This is the TourStack SWISS ARMY KNIFE approach** - one platform, infinite configurations per tour!

### What Was Built (Feb 2, 2026)

| Feature | Component | Status |
|---------|-----------|--------|
| Quick Actions | Add/delete/drag-reorder per-tour | ✅ COMPLETE |
| Knowledge Sources | Import collections + list + delete | ✅ COMPLETE |
| Persona Selector | Inherit default or override | ✅ COMPLETE |
| Welcome Message | Multilingual per-tour | ✅ COMPLETE |
| Test Chat | Full preview panel | ✅ COMPLETE |
| Translate All | Uses tour's languages | ✅ COMPLETE |

### Files Modified

| File | Change |
|------|--------|
| `schema.prisma` | Added `conciergeQuickActions String?` |
| `types/index.ts` | Added `TourQuickAction` interface |
| `routes/tours.ts` | Parse/save quick actions JSON |
| `components/TourConciergeTab.tsx` | Complete rebuild |

### Knowledge Sources Per Tour

The tour-specific AI will automatically pull knowledge from:

1. **Tour Content**
   - Tour title, description
   - All stop titles and descriptions
   - Text content blocks from each stop

2. **Linked Document Collections**
   - PDFs uploaded for that tour
   - Extracted text from documents

3. **AI Analysis Results** (NEW!)
   - Summary generated by Gemini
   - Key facts extracted
   - FAQ Q&A pairs
   - Auto-generated tags

### Database Changes (APPLIED)

```prisma
model Tour {
  // ... existing fields ...

  // Concierge Settings
  conciergeEnabled      Boolean @default(true)
  conciergePersona      String? // null = inherit museum default
  conciergeWelcome      String? // JSON: { en: "...", es: "..." }
  conciergeCollections  String? // JSON: string[] of linked collection IDs
  conciergeQuickActions String? // JSON: TourQuickAction[]
}
```

### UI Implementation

**Tab in Tour Editor** (User-approved approach)
```
Tour Editor Tabs:
[Overview] [Stops] [Settings] [AI Chatbot]
                                    ^
                                    IMPLEMENTED
```

### Implementation (ALL COMPLETE ✅)

1. ✅ Add concierge fields to Tour model in schema.prisma
2. ✅ Manually add columns via SQL (Prisma migration issues)
3. ✅ Create `TourConciergeTab` component with full features
4. ✅ Add "AI Chatbot" tab to tour editor
5. ✅ Update `/api/chat` to accept `tourId` parameter
6. ✅ Build knowledge context from tour + linked collections
7. ✅ Update ChatDrawer to pass current `tourId`

---

## ✅ PHASE 26.3: Chatbot UX Unification (COMPLETE - March 19, 2026)

### What Was Done

Unified chatbot behavior between Simulator preview and visitor device views. Added consistent translation UX across all chatbot configuration fields.

### Changes

| Change | Description |
|--------|-------------|
| **Simulator Chatbot** | ChatDrawer + floating button now render inside phone/tablet/kiosk simulator frames via `contained` prop (absolute vs fixed positioning) |
| **Quick Actions Translation** | Replaced bulk "Translate All" button with per-action LanguageSwitcher + MagicTranslateButton — same pattern as TextBlockEditor, StopEditor |
| **Quick Actions Editing** | Each action is now an editable mini-card: category badge, inline text editing, per-language switching, translate button |
| **Welcome Message Translation** | Added LanguageSwitcher + MagicTranslateButton above the welcome textarea — matches Quick Actions pattern |
| **ChatDrawer Restyle** | Monochrome black/white/gray aesthetic replacing orange/amber gradient theme |
| **Chat Reset on Close** | Closing the drawer resets messages so reopening shows the quick actions start screen |
| **Removed hardcoded text** | Removed "How can I help you today?" — only the editable/translatable welcome message is shown |

### Files Modified

| File | Changes |
|------|---------|
| `app/src/components/chat/ChatDrawer.tsx` | Added `contained` prop to all 3 exports (ChatDrawer, ChatFloatingButton, KioskChatButton); monochrome restyle; chat reset on close; removed hardcoded welcome text |
| `app/src/components/StopPreviewModal.tsx` | Integrated ChatDrawer + ChatFloatingButton (phone/tablet) and KioskChatButton (kiosk) with `contained` prop; passes tour concierge data |
| `app/src/components/TourConciergeTab.tsx` | Added LanguageSwitcher + MagicTranslateButton imports; rebuilt Quick Actions as editable cards with per-language translation; converted Welcome Message to multilingual `Record<string, string>` with LanguageSwitcher |

### Technical Details

**`contained` prop pattern:**
- When `contained={true}`, chat components use `absolute` instead of `fixed` CSS positioning
- This makes them render relative to the nearest positioned ancestor (the simulator device frame) instead of the browser viewport
- The simulator's Screen Area div has `relative` class to establish the positioning context

**Translation pattern consistency:**
- LanguageSwitcher pills: green checkmark (✓) for languages with content, empty circle (○) for missing
- MagicTranslateButton: sparkle → spinner → green check → red alert state transitions
- Same `magicTranslate()` → `batchTranslate()` → `POST /api/translate/batch` service chain used app-wide

---

## PHASE 26.4: AI Analysis Integration (PLANNED)

### Current Problem

Document import only pulls `extractedText`. The rich AI analysis is being ignored!

### Solution: Enhanced Knowledge Import

```typescript
async function buildKnowledgeFromCollection(collection) {
  const parts = [];

  for (const doc of collection.items) {
    const analysis = doc.metadata?.aiAnalysis;

    parts.push(`
## ${doc.metadata.fileName}

### Summary
${analysis?.summary || 'No summary available'}

### Key Facts
${analysis?.facts?.map(f => `- ${f}`).join('\n') || 'No facts extracted'}

### Frequently Asked Questions
${analysis?.faq?.map(q => `Q: ${q.question}\nA: ${q.answer}`).join('\n\n') || 'No FAQ generated'}

### Full Document Text
${doc.metadata.extractedText || ''}
    `);
  }

  return parts.join('\n\n---\n\n');
}
```

### Benefits

- **Smarter responses**: AI has structured Q&A, not just raw text
- **Better context**: Summary gives quick overview
- **Factual accuracy**: Key facts are pre-validated
- **FAQ matching**: Common questions already answered

---

## PHASE 27: Location-Aware AI Responses (FUTURE VISION)

### The Dream

Visitor asks: *"Where is the cafeteria?"*

**Without positioning:**
> "The cafeteria is on the third floor near the main elevator."

**With positioning:**
> "You're currently on the first floor near the Egyptian Gallery. Head toward the main lobby, take the elevator to the third floor, and the cafeteria will be on your right. It's about a 2-minute walk."

### Positioning Infrastructure (Already In Schema!)

```prisma
// Tour level
primaryPositioningMethod String  // qr_code, gps, ble_beacon, wifi, nfc
backupPositioningMethod  String?

// Stop level
primaryPositioning String   // JSON: { type, coordinates, beaconId, qrCode }
backupPositioning  String?

// Settings
positioning String  // JSON: { estimoteApiKey, kontaktApiKey, customBleEnabled }
```

### Supported Positioning Methods

| Method | Indoor | Outdoor | Accuracy | Setup Effort |
|--------|--------|---------|----------|--------------|
| **QR Code** | Yes | Yes | Exact (scan location) | Low |
| **GPS** | No | Yes | 5-10m | None |
| **BLE Beacons** | Yes | No | 1-3m | Medium |
| **WiFi Triangulation** | Yes | No | 3-5m | Medium |
| **NFC Tags** | Yes | Yes | Exact (tap location) | Low |

### Location-Aware Chat API

```typescript
POST /api/chat
{
  "message": "Where is the cafeteria?",
  "tourId": "tour-123",
  "language": "en",
  "position": {
    "method": "ble_beacon",
    "stopId": "stop-456",
    "floor": 1,
    "zone": "egyptian-gallery",
    "coordinates": { "lat": 40.7, "lng": -74.0 }
  }
}
```

### Future Venue Data Model

```prisma
model VenueFloor {
  id          String @id
  museumId    String
  floorNumber Int
  name        String        // "Ground Floor", "Second Floor"
  mapImage    String?       // Floor plan image
  zones       VenueZone[]
  pois        VenuePOI[]    // Points of Interest
}

model VenuePOI {
  id          String @id
  floorId     String
  name        String        // "Main Cafeteria", "Gift Shop"
  type        String        // cafeteria, restroom, elevator, exit
  coordinates String        // JSON: { x, y } on floor map
  description String?
}
```

### AI Directions Prompt

```
You are a museum concierge with knowledge of the venue layout.

VISITOR LOCATION:
- Floor: ${position.floor}
- Zone: ${position.zone}
- Near: ${nearestStop.title}

When giving directions:
1. Reference the visitor's current location
2. Use landmarks they can see
3. Give step-by-step walking directions
4. Estimate walking time
5. Mention accessibility options if relevant
```

---

## Implementation Roadmap

### DONE (Phase 26.2) ✅
- [x] Add concierge fields to Tour model
- [x] Create tour concierge settings UI
- [x] Update chat API for tour-specific context
- [x] Auto-build knowledge from tour content

### DONE (Phase 26.3) ✅
- [x] Chatbot in Simulator preview (phone/tablet/kiosk)
- [x] Quick Actions per-language translation with LanguageSwitcher + MagicTranslateButton
- [x] Welcome Message multilingual editing with LanguageSwitcher + MagicTranslateButton
- [x] ChatDrawer monochrome restyle + chat reset on close

### NEXT (Phase 26.4)
- [ ] Enhance document import with AI analysis
- [ ] Include FAQ, facts, summary in knowledge
- [ ] Re-import existing collections with enhanced data

### FUTURE (Phase 27)
- [ ] Venue floor/POI data models
- [ ] Position detection integration
- [ ] Location-aware chat prompts
- [ ] Walking directions generation
- [ ] Indoor navigation UI

---

## TourStack Vision

### For Museum Staff
- Modern, cutting-edge tour creation tools
- AI-assisted content generation & translation
- Document analysis & knowledge extraction
- Easy chatbot configuration per tour
- Analytics and visitor insights

### For Museum Visitors
- Engaging, personalized tour experiences
- Instant AI help in any language
- Context-aware assistance based on location
- Quick answers to common questions
- Seamless multilingual support

**The Swiss Army Knife for Museums** - everything needed to create, manage, and deliver world-class visitor experiences.

---

## Related Documentation

- [Bug Audit](./ai-concierge-bug.md) - Phase 26.1 debugging log
- [Collections Development](./collections-dev.md)
- [Translation Services](./translations-dev.md)
- [HANDOFF](../HANDOFF.md)

---

*This document is self-contained for AI handoff between conversations.*
