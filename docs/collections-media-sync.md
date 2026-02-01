# Collections ↔ Media Library Sync

## Overview

Phase 23 establishes synchronization between TourStack's Collections and Media Library systems, ensuring AI-generated image analysis and translations flow from Collections to the Media Library.

## Problem Solved

Before Phase 23, TourStack had two separate systems for managing images:

| System | AI Analysis | Translations | Persistence |
|--------|-------------|--------------|-------------|
| **Media Library** | Computed on-demand | Not supported | Lost on close |
| **Collections** | Persisted in `aiMetadata` | Full multilingual | Saved in JSON |

When users analyzed and translated images in Collections, this valuable metadata was not reflected in the Media Library, leading to:
- Duplicate AI analysis work
- Lost translations
- Inconsistent metadata across systems

## Solution: Phase 23a

### Core Changes

1. **Database Schema** - Added to Media model:
   ```prisma
   model Media {
     // ... existing fields ...
     aiMetadata     String?  // JSON: AIAnalysisResult
     aiTranslations String?  // JSON: MultilingualAIAnalysis
   }
   ```

2. **Media Library Persistence** - AI analysis is now saved when clicking "Save Changes" in MediaDetailModal

3. **Auto-Sync on Collection Save** - When a collection is created or updated, image items with AI metadata are automatically synced to the Media Library

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        COLLECTIONS                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Upload    │ ──▶ │  AI Analyze │ ──▶ │    Translate    │   │
│  │   Images    │     │   (Gemini)  │     │  (LibreTranslate)│  │
│  └─────────────┘     └─────────────┘     └────────┬────────┘   │
│                                                    │             │
│                                          [Save Collection]       │
│                                                    │             │
└────────────────────────────────────────────────────┼─────────────┘
                                                     │
                                                     ▼
                                            ┌───────────────┐
                                            │  Auto-Sync    │
                                            │  (by URL)     │
                                            └───────┬───────┘
                                                    │
┌───────────────────────────────────────────────────┼─────────────┐
│                      MEDIA LIBRARY                 │             │
│                                                    ▼             │
│  ┌─────────────┐     ┌─────────────────────────────────────┐   │
│  │   Image     │ ◀── │  aiMetadata + aiTranslations saved  │   │
│  │   Record    │     │  (matches by URL: /uploads/images/) │   │
│  └─────────────┘     └─────────────────────────────────────┘   │
│                                                                  │
│  User can also analyze directly in Media Library:                │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────┐   │
│  │   Select    │ ──▶ │  AI Analyze │ ──▶ │  Save Changes   │   │
│  │   Image     │     │   (Gemini)  │     │  (persisted)    │   │
│  └─────────────┘     └─────────────┘     └─────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Media Library

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/media/:id` | PUT | Update media (now accepts `aiMetadata`, `aiTranslations`) |
| `/api/media/sync-by-url` | PUT | Sync single item by URL |
| `/api/media/sync-batch` | PUT | Batch sync multiple items |

### Sync Request Format

```typescript
// Single item sync
PUT /api/media/sync-by-url
{
  "url": "/uploads/images/abc123.jpg",
  "aiMetadata": { /* AIAnalysisResult */ },
  "aiTranslations": { /* MultilingualAIAnalysis */ }
}

// Batch sync
PUT /api/media/sync-batch
{
  "items": [
    { "url": "...", "aiMetadata": {...}, "aiTranslations": {...} },
    // ...more items
  ]
}
```

## TypeScript Types

### AIAnalysisResult (from Gemini)

```typescript
interface AIAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
  text?: string;         // OCR text
  colors: Array<{ name: string; hex: string }>;
  suggestedTitle: string;
  mood?: string;
  lighting?: string;
  artStyle?: string;
  estimatedLocation?: string;
}
```

### MultilingualAIAnalysis (Translations)

```typescript
interface MultilingualAIAnalysis {
  original: AIAnalysisResult;
  sourceLanguage: string;          // e.g., 'en'
  translatedLanguages: string[];   // e.g., ['en', 'es', 'zh']
  suggestedTitle?: { [lang: string]: string };
  description?: { [lang: string]: string };
  tags?: { [lang: string]: string[] };
  mood?: { [lang: string]: string };
  lighting?: { [lang: string]: string };
  artStyle?: { [lang: string]: string };
  estimatedLocation?: { [lang: string]: string };
}
```

## File Locations

### Backend
- Schema: `/app/prisma/schema.prisma`
- Media API: `/app/server/routes/media.ts`
- Collections API: `/app/server/routes/collections.ts`

### Frontend
- Media types: `/app/src/types/media.ts`
- Media service: `/app/src/lib/mediaService.ts`
- MediaDetailModal: `/app/src/components/media/MediaDetailModal.tsx`
- ImageAnalysisPanel: `/app/src/components/media/ImageAnalysisPanel.tsx`

## Sync Logic Details

The sync is triggered automatically when:
1. A new collection is created (`POST /api/collections`)
2. An existing collection is updated (`PUT /api/collections/:id`)

The sync function:
1. Filters items for `type: 'image'` with `aiMetadata` or `aiTranslations`
2. Only syncs local URLs starting with `/uploads/`
3. Matches Media Library records by exact URL
4. Updates `aiMetadata` and `aiTranslations` fields

```typescript
// From /app/server/routes/collections.ts
async function syncToMediaLibrary(items: unknown[]): Promise<{ synced: number; notFound: number }>
```

## Backward Compatibility

- All new fields are optional
- Existing media items work unchanged
- Collections without AI analysis continue to work
- No database migration required (SQLite handles optional fields)

## Future Enhancements (Phase 23b/c)

- Add language switcher to Media Library UI
- Add "Translate" button to Media Library
- Track mediaId in collection items for bidirectional sync
- Build sync dashboard for manual reconciliation
