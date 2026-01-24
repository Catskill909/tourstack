# Translate Collections Feature - Development Plan

**Created**: January 24, 2026  
**Status**: Planning Phase  
**Feature**: Multi-language TTS Audio Collection Generation

---

## Executive Summary

This document outlines the phased development plan for the **Translate Collections** feature, which enables batch generation of TTS audio files in multiple languages from the `/audio` view, packaging them as reusable **Collections** that can be imported into Audio Blocks and Timeline Gallery Blocks.

### User Story

> *As a museum curator, I want to generate audio narrations in multiple languages from a single piece of text, save them as a collection with metadata, and reuse that collection across different tour stops.*

---

## 1. Current State Audit

### 1.1 Audio Page (`/audio`)

**Files:**
- `app/src/pages/Audio.tsx` (1879 lines)
- `app/server/routes/audio.ts` (Deepgram TTS API)
- `app/server/routes/elevenlabs.ts` (ElevenLabs TTS API)
- `app/src/services/audioService.ts`
- `app/src/services/elevenlabsService.ts`

**Current Capabilities:**
| Feature | Deepgram | ElevenLabs |
|---------|----------|------------|
| Languages | 7 (en, es, de, fr, nl, it, ja) | 32+ |
| Voices | 40+ | 3,000+ (community) |
| Auto-Translate | ✅ via LibreTranslate | ✅ via LibreTranslate |
| Voice Preview | ✅ | ✅ |
| Output Formats | MP3, WAV, OGG, FLAC | MP3, PCM, Opus |
| Sample Rates | 8-48 kHz | 16-44 kHz |
| File Storage | `/uploads/audio/generated/` | `/uploads/audio/generated/` |

**Translation Support (LibreTranslate):**
```typescript
const TRANSLATION_LANGUAGE_MAP: Record<string, string> = {
    'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de',
    'it': 'it', 'ja': 'ja', 'ko': 'ko', 'pt': 'pt',
    'zh': 'zh-Hans',
};
```

**Current Flow:**
1. User enters text in English
2. Selects language + voice + format + sample rate
3. If auto-translate enabled, text is translated via LibreTranslate
4. TTS API generates audio
5. Audio saved to `/uploads/audio/generated/`
6. Success modal shows, file appears in list
7. **Files are standalone - not grouped or packaged**

---

### 1.2 Collections System

**Files:**
- `app/src/pages/Collections.tsx` (189 lines)
- `app/src/pages/CollectionDetail.tsx` (181 lines)
- `app/src/lib/collectionService.ts` (104 lines)
- `app/prisma/schema.prisma` (Collection model)

**Current Collection Schema:**
```typescript
// Frontend Type (collectionService.ts)
export interface CollectionItem {
    id: string;
    type: 'image' | 'audio' | 'video' | 'model';
    url: string;
    caption?: string;
    order: number;
}

export interface Collection {
    id: string;
    museumId?: string;
    name: string;
    description?: string;
    type: 'gallery' | 'dataset';
    items: CollectionItem[];
    createdAt: string;
    updatedAt: string;
}
```

**Database Schema (Prisma):**
```prisma
model Collection {
  id          String   @id @default(cuid())
  museumId    String?
  museum      Museum?  @relation(fields: [museumId], references: [id])
  name        String
  description String?
  type        String   @default("gallery") // gallery, dataset
  items       String   // JSON: CollectionItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Current Limitations:**
- Collection service uses **localStorage** (not database API)
- `CollectionItem.caption` is single-language (not multilingual)
- No metadata for TTS settings (voice, provider, sample rate)
- No concept of "audio collection" vs "image gallery"
- Items are generic - no language association

---

### 1.3 Block System (Audio Block / Timeline Gallery Block)

**Audio Block (`AudioBlockEditor.tsx`):**
```typescript
export interface AudioBlockData {
  audioFiles: { [lang: string]: string }; // Per-language audio URLs
  title: { [lang: string]: string };
  size: 'large' | 'medium' | 'small';
  showTitle: boolean;
  transcript?: { [lang: string]: string };
  transcriptWords?: Array<{ word: string; start: number; end: number; confidence: number; }>;
  autoplay: boolean;
  showTranscript: boolean;
  showCaptions?: boolean;
}
```

**Current Audio Block Features:**
- Manual audio file upload per language
- Transcription via Deepgram (fills `transcriptWords`)
- Translation of transcript to other languages
- 3 size variants (large, medium, small)
- Closed captions with word-level sync

**Timeline Gallery Block (`TimelineGalleryBlockEditor.tsx`):**
```typescript
export interface TimelineGalleryBlockData {
  images: Array<{
    id?: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
    timestamp: number; // Seconds into audio
  }>;
  audioUrl: string;
  audioDuration: number;
  crossfadeDuration?: number;
  transitionType?: TransitionType;
  transcript?: { [lang: string]: string };
  transcriptWords?: Array<...>;
  showCaptions?: boolean;
}
```

**Current Timeline Gallery Features:**
- Single audio URL (not per-language)
- Images synced to audio timestamps
- Waveform visualization with draggable markers
- Crossfade transitions (Framer Motion)
- Closed captions

**Gap:** Timeline Gallery has `audioUrl` (single), not `audioFiles` (per-language)

---

## 2. Feature Requirements

### 2.1 Generate Audio Collection Modal

When user clicks **"Generate Audio"** in `/audio`:

```
┌─────────────────────────────────────────────────────────────────────┐
│  🎵 Generate Audio Collection                              [X]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  📋 Collection Details                                              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Title: [Bethel Woods Introduction                        ]  │  │
│  │  Description: [Introduction narration for the Bethel...   ]  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  🎛️ Generation Settings                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Provider: [● Deepgram] [○ ElevenLabs]                      │  │
│  │  Format: [MP3 ▼]  Sample Rate: [24 kHz ▼]                   │  │
│  │  ☑ Auto-translate from English                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  🌐 Languages to Generate                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  ☑ English    Voice: [Thalia (female) ▼]                    │  │
│  │  ☑ Spanish ✓  Voice: [Celeste (female) ▼]                   │  │
│  │  ☑ French ✓   Voice: [Agathe (female) ▼]                    │  │
│  │  ☑ German ✓   Voice: [Viktoria (female) ▼]                  │  │
│  │  ☐ Italian ✓  Voice: [Livia (female) ▼]                     │  │
│  │  ☐ Japanese ✓ Voice: [Izanami (female) ▼]                   │  │
│  │  ☐ Dutch      Voice: [Rhea (female) ▼]  ⚠ No translation    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ✓ = Auto-translation available                                    │
│                                                                     │
│  📊 Estimated: 4 audio files • ~2.5 MB • ~30 seconds               │
│                                                                     │
│  ┌──────────────────────┐ ┌─────────────────────────────────────┐  │
│  │      Cancel          │ │  🎵 Generate 4 Audio Files          │  │
│  └──────────────────────┘ └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 New Collection Type: `audio_collection`

```typescript
export type CollectionType = 'gallery' | 'dataset' | 'audio_collection';

export interface AudioCollectionItem extends CollectionItem {
    type: 'audio';
    language: string;           // 'en', 'es', 'fr', etc.
    voice: string;              // Voice ID
    voiceName: string;          // Display name
    provider: 'deepgram' | 'elevenlabs';
    format: string;             // 'mp3', 'wav', etc.
    sampleRate?: number;
    fileSize: number;
    duration?: number;
    originalText: string;       // Source English text
    translatedText?: string;    // Translated text (if applicable)
}

export interface AudioCollection extends Collection {
    type: 'audio_collection';
    sourceText: string;         // Original English text
    ttsSettings: {
        provider: 'deepgram' | 'elevenlabs';
        format: string;
        sampleRate?: number;
        autoTranslate: boolean;
    };
    items: AudioCollectionItem[];
}
```

### 2.3 Collection Import in Blocks

**Audio Block Import:**
```
┌─────────────────────────────────────────────────────────────────┐
│  Audio File (EN)                                                │
│  ┌────────────────────────────────────────────┐                │
│  │  [Choose Audio File]  OR  [📁 From Collection]  │                │
│  └────────────────────────────────────────────┘                │
│                                                                 │
│  ┌─ Import from Collection ─────────────────────────────────┐  │
│  │  🎵 Bethel Woods Introduction                             │  │
│  │     4 languages • Created Jan 24, 2026                   │  │
│  │     [Import All Languages]                               │  │
│  │                                                          │  │
│  │  🎵 Museum History Narration                             │  │
│  │     6 languages • Created Jan 20, 2026                   │  │
│  │     [Import All Languages]                               │  │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Timeline Gallery Import:**
```
┌─────────────────────────────────────────────────────────────────┐
│  🎵 Audio Narration                                             │
│  ┌────────────────────────────────────────────┐                │
│  │  [Upload Audio]  OR  [📁 From Collection]  │                │
│  └────────────────────────────────────────────┘                │
│                                                                 │
│  ┌─ Import from Collection ─────────────────────────────────┐  │
│  │  Select language for this block:                         │  │
│  │  [● English] [○ Spanish] [○ French] [○ German]          │  │
│  │                                                          │  │
│  │  🎵 Bethel Woods Introduction                            │  │
│  │     English • Thalia • 45s • 78 KB                      │  │
│  │     [Import Selected]                                    │  │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technical Architecture

### 3.1 Data Flow Diagram

```
┌──────────────────┐
│   /audio Page    │
│   (Text Input)   │
└────────┬─────────┘
         │ Click "Generate Audio"
         ▼
┌──────────────────────────────────────┐
│  AudioCollectionModal                │
│  - Title, Description                │
│  - Language checkboxes               │
│  - Voice selection per language      │
│  - Provider/format settings          │
└────────┬─────────────────────────────┘
         │ Click "Generate"
         ▼
┌──────────────────────────────────────┐
│  Batch Generation Service            │
│  For each selected language:         │
│  1. Translate text (if needed)       │
│  2. Call TTS API                     │
│  3. Save audio file                  │
│  4. Record metadata                  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Create AudioCollection              │
│  - POST /api/collections             │
│  - Type: 'audio_collection'          │
│  - Items: AudioCollectionItem[]      │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  /collections Page                   │
│  - Shows audio collection card       │
│  - Play preview, download, delete    │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Audio Block / Timeline Gallery      │
│  - "Import from Collection" button   │
│  - Populates audioFiles per language │
└──────────────────────────────────────┘
```

### 3.2 API Endpoints

**New Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/audio/generate-batch` | Generate multiple audio files |
| `POST` | `/api/collections` | Create collection (update to support audio_collection) |
| `GET` | `/api/collections?type=audio_collection` | Filter audio collections |
| `GET` | `/api/collections/:id/items` | Get collection items with audio URLs |

**Batch Generation Request:**
```typescript
interface BatchGenerationRequest {
    text: string;
    collectionName: string;
    collectionDescription?: string;
    provider: 'deepgram' | 'elevenlabs';
    format: string;
    sampleRate?: number;
    autoTranslate: boolean;
    languages: Array<{
        code: string;
        voiceId: string;
        voiceName: string;
    }>;
}
```

**Batch Generation Response:**
```typescript
interface BatchGenerationResponse {
    collectionId: string;
    results: Array<{
        language: string;
        success: boolean;
        audioFile?: GeneratedAudio;
        error?: string;
    }>;
}
```

### 3.3 Collection Service Migration

**Current:** `collectionService.ts` uses **localStorage**  
**Target:** Migrate to **database API** (like stops/tours)

```typescript
// NEW: collectionService.ts (API-based)
export const collectionService = {
    getAll: async (type?: CollectionType): Promise<Collection[]> => {
        const params = type ? `?type=${type}` : '';
        const response = await fetch(`/api/collections${params}`);
        return response.json();
    },
    
    getById: async (id: string): Promise<Collection | null> => {
        const response = await fetch(`/api/collections/${id}`);
        if (!response.ok) return null;
        return response.json();
    },
    
    create: async (data: CreateCollectionRequest): Promise<Collection> => {
        const response = await fetch('/api/collections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return response.json();
    },
    
    // ... update, delete, addItem
};
```

---

## 4. Phased Implementation Plan

### Phase 1: Backend Infrastructure (Week 1)

**Goal:** Migrate collections to database API, add audio collection support

**Tasks:**

1. **Create Collections API Route** (`server/routes/collections.ts`)
   - CRUD endpoints for collections
   - Support for `audio_collection` type
   - Filter by type query parameter

2. **Update Collection Schema**
   - Add new fields for audio metadata
   - Extend `CollectionItem` for audio-specific data

3. **Migrate collectionService.ts**
   - Replace localStorage with API calls
   - Add TypeScript types for audio collections

4. **Add Batch Generation Endpoint**
   - `POST /api/audio/generate-batch`
   - Sequential generation with progress tracking
   - Error handling for partial failures

**Deliverables:**
- [ ] `server/routes/collections.ts` with full CRUD
- [ ] Updated `collectionService.ts` using API
- [ ] `POST /api/audio/generate-batch` endpoint
- [ ] Unit tests for API endpoints

---

### Phase 2: Audio Collection Modal (Week 2)

**Goal:** Build the modal UI for batch audio generation

**Tasks:**

1. **Create AudioCollectionModal Component**
   - Title and description inputs
   - Provider selection (Deepgram/ElevenLabs)
   - Format and sample rate options
   - Language checkboxes with availability indicators
   - Voice dropdown per language (filtered by provider)

2. **Integrate with Audio Page**
   - Replace single "Generate Audio" button
   - Show modal on click
   - Handle generation progress

3. **Generation Progress UI**
   - Progress bar with language names
   - Per-language success/error indicators
   - Cancel button
   - Retry failed languages

4. **Success State**
   - Show generated collection summary
   - "View Collection" button
   - Option to generate more

**Deliverables:**
- [ ] `AudioCollectionModal.tsx` component
- [ ] Updated `Audio.tsx` integration
- [ ] Progress/success UI states
- [ ] Voice selection synced with language

---

### Phase 3: Collections View Enhancement (Week 3)

**Goal:** Display and manage audio collections

**Tasks:**

1. **Update Collections Page**
   - Add audio collection card design (different icon/styling)
   - Show language badges
   - Play preview of default (English) audio
   - Display total duration and file count

2. **Audio Collection Detail Page**
   - List all language variants
   - Play button per language
   - Download individual or all
   - Show original text and translations
   - Edit metadata (title, description)

3. **Collection Filtering**
   - Filter tabs: All | Images | Audio
   - Search across name/description

**Deliverables:**
- [ ] Audio collection card component
- [ ] Updated `CollectionDetail.tsx` for audio type
- [ ] Filter/search UI
- [ ] Download functionality (zip for all)

---

### Phase 4: Block Import Integration (Week 4)

**Goal:** Import collections into Audio Block and Timeline Gallery Block

**Tasks:**

1. **Audio Block Import**
   - Add "Import from Collection" button
   - Collection picker modal
   - Auto-populate `audioFiles` for all languages
   - Preserve existing manual uploads

2. **Timeline Gallery Import**
   - Add "Import from Collection" button
   - Language selector for single audio
   - Update `audioUrl` with selected language
   - **Future:** Support per-language audio switching

3. **Collection Linking**
   - Store collection ID reference in block data
   - Show "Linked to: [Collection Name]" badge
   - Update block when collection changes

4. **Import Preview**
   - Show what will be imported before confirming
   - Warn if overwriting existing audio

**Deliverables:**
- [ ] `CollectionImportModal.tsx` component
- [ ] Updated `AudioBlockEditor.tsx` with import
- [ ] Updated `TimelineGalleryBlockEditor.tsx` with import
- [ ] Collection reference in block data

---

### Phase 5: Timeline Gallery Multi-Language Support (Week 5)

**Goal:** Enable Timeline Gallery to work with multiple audio languages

**Tasks:**

1. **Extend TimelineGalleryBlockData**
   ```typescript
   interface TimelineGalleryBlockData {
     // Single audio (legacy)
     audioUrl?: string;
     
     // Multi-language audio (new)
     audioFiles?: { [lang: string]: string };
     
     // ... existing fields
   }
   ```

2. **Update Timeline Gallery Editor**
   - Show language tabs for audio
   - Sync timestamps across languages
   - Preview in any language

3. **Update Timeline Gallery Preview**
   - Use current stop language for audio selection
   - Fallback to English if language unavailable

4. **Migration Utility**
   - Convert existing `audioUrl` to `audioFiles.en`
   - Preserve backward compatibility

**Deliverables:**
- [ ] Multi-language `TimelineGalleryBlockData` type
- [ ] Updated editor with language tabs
- [ ] Preview language switching
- [ ] Migration for existing blocks

---

### Phase 6: Polish & Testing (Week 6)

**Goal:** Quality assurance, edge cases, documentation

**Tasks:**

1. **Error Handling**
   - Translation API failures (partial batch)
   - TTS API rate limits
   - File storage errors
   - Network timeouts

2. **Performance Optimization**
   - Parallel translation (where possible)
   - Audio file compression options
   - Collection caching

3. **Accessibility**
   - Keyboard navigation in modals
   - Screen reader support
   - Focus management

4. **Documentation**
   - Update HANDOFF.md
   - Update audio-services.md
   - Create user guide for batch generation

5. **Testing**
   - E2E tests for generation flow
   - Unit tests for services
   - Manual QA checklist

**Deliverables:**
- [ ] Comprehensive error handling
- [ ] Performance improvements
- [ ] Accessibility audit passed
- [ ] Updated documentation
- [ ] Test coverage >80%

---

## 5. Data Model Changes

### 5.1 Extended CollectionItem Type

```typescript
// types/index.ts additions

export interface BaseCollectionItem {
    id: string;
    order: number;
}

export interface ImageCollectionItem extends BaseCollectionItem {
    type: 'image';
    url: string;
    alt?: { [lang: string]: string };
    caption?: { [lang: string]: string };
    credit?: string;
}

export interface AudioCollectionItem extends BaseCollectionItem {
    type: 'audio';
    url: string;
    language: string;
    voice: {
        id: string;
        name: string;
        gender?: 'male' | 'female' | 'neutral';
    };
    provider: 'deepgram' | 'elevenlabs';
    format: string;
    sampleRate?: number;
    fileSize: number;
    duration?: number;
    text: {
        original: string;
        translated?: string;
    };
}

export type CollectionItem = ImageCollectionItem | AudioCollectionItem;

export interface Collection {
    id: string;
    museumId?: string;
    name: string;
    description?: string;
    type: 'gallery' | 'dataset' | 'audio_collection';
    items: CollectionItem[];
    
    // Audio collection specific
    sourceText?: string;
    ttsSettings?: {
        provider: 'deepgram' | 'elevenlabs';
        format: string;
        sampleRate?: number;
        autoTranslate: boolean;
    };
    
    createdAt: string;
    updatedAt: string;
}
```

### 5.2 Prisma Schema Update

```prisma
model Collection {
  id          String   @id @default(cuid())
  museumId    String?
  museum      Museum?  @relation(fields: [museumId], references: [id])
  
  name        String
  description String?
  type        String   @default("gallery") // gallery, dataset, audio_collection
  items       String   // JSON: CollectionItem[]
  
  // Audio collection specific (JSON)
  sourceText  String?  // Original English text for audio collections
  ttsSettings String?  // JSON: { provider, format, sampleRate, autoTranslate }
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 6. UI Component Tree

```
Audio.tsx
├── DeepgramTab
│   ├── TextInput
│   ├── VoiceSelector
│   ├── FormatSelector
│   └── GenerateButton → Opens AudioCollectionModal
└── ElevenLabsTab
    ├── TextInput
    ├── VoiceSelector
    ├── ModelSelector
    └── GenerateButton → Opens AudioCollectionModal

AudioCollectionModal.tsx (NEW)
├── CollectionDetailsSection
│   ├── TitleInput
│   └── DescriptionInput
├── GenerationSettingsSection
│   ├── ProviderToggle
│   ├── FormatDropdown
│   ├── SampleRateDropdown
│   └── AutoTranslateCheckbox
├── LanguageSelectionSection
│   └── LanguageRow (for each available language)
│       ├── Checkbox
│       ├── LanguageName + AvailabilityBadge
│       └── VoiceDropdown
├── EstimatedOutput
│   ├── FileCount
│   ├── EstimatedSize
│   └── EstimatedDuration
└── ActionButtons
    ├── CancelButton
    └── GenerateButton

GenerationProgressModal.tsx (NEW)
├── ProgressBar
├── LanguageStatusList
│   └── LanguageStatusRow
│       ├── LanguageName
│       ├── Spinner/Checkmark/Error
│       └── StatusText
├── CancelButton
└── RetryButton (on error)

Collections.tsx
├── FilterTabs (All | Images | Audio)
├── SearchInput
└── CollectionGrid
    ├── ImageCollectionCard
    └── AudioCollectionCard (NEW)
        ├── AudioIcon
        ├── Title
        ├── LanguageBadges
        ├── PlayPreviewButton
        └── MetadataLine

CollectionDetail.tsx (UPDATED)
├── ImageCollectionDetail (existing)
└── AudioCollectionDetail (NEW)
    ├── Header
    │   ├── Title
    │   ├── Description
    │   └── EditButton
    ├── SourceTextSection
    │   └── OriginalText
    ├── AudioItemsList
    │   └── AudioItemRow
    │       ├── LanguageBadge
    │       ├── VoiceInfo
    │       ├── Duration
    │       ├── FileSize
    │       ├── PlayButton
    │       └── DownloadButton
    └── ActionButtons
        ├── DownloadAllButton
        └── DeleteCollectionButton

AudioBlockEditor.tsx (UPDATED)
├── TitleInput
├── AudioFileSection
│   ├── UploadButton
│   └── ImportFromCollectionButton (NEW)
│       └── CollectionImportModal
├── TranscriptSection
└── OptionsSection

TimelineGalleryBlockEditor.tsx (UPDATED)
├── AudioSection
│   ├── UploadButton
│   └── ImportFromCollectionButton (NEW)
│       └── CollectionImportModal (single language mode)
├── ImageUploadSection
└── ImageListSection

CollectionImportModal.tsx (NEW)
├── CollectionList
│   └── CollectionCard
│       ├── Name
│       ├── LanguageCount
│       └── SelectButton
├── LanguageSelector (for Timeline Gallery mode)
└── ActionButtons
    ├── CancelButton
    └── ImportButton
```

---

## 7. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| TTS API rate limits during batch | High | Medium | Sequential generation with delays, retry logic |
| LibreTranslate downtime | Medium | Low | Fallback to "provide translated text" mode |
| Large audio files storage | Medium | Medium | Compression options, storage quotas |
| Browser memory during batch | Low | Low | Stream to server, not client |
| Collection schema migration | Medium | Low | Backward compatible changes, migration script |
| ElevenLabs character limits | Medium | Medium | Text chunking, clear warnings |

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Time to generate 4-language collection | < 60 seconds |
| Audio collection creation success rate | > 95% |
| Block import success rate | 100% |
| User task completion (create + import) | < 3 minutes |
| Documentation completeness | 100% |

---

## 9. Dependencies

### External Services
- **LibreTranslate**: Auto-translation (self-hosted or cloud)
- **Deepgram Aura-2**: TTS generation (requires API key)
- **ElevenLabs**: Premium TTS (requires API key)

### Internal Dependencies
- Collection service must be migrated to API before Phase 2
- Audio Block types must support multi-language before Phase 4
- Timeline Gallery multi-language is optional enhancement (Phase 5)

---

## 10. Open Questions

1. **Should we support editing audio collections after creation?**
   - Regenerate individual languages?
   - Change voice for a language?

2. **How to handle very long text (>10K characters)?**
   - Chunk into multiple audio files?
   - Warn user about limits?

3. **Should collections be shareable between museums?**
   - Global vs museum-scoped collections?

4. **Voice consistency across languages?**
   - Auto-select similar voice gender/style?
   - Let user choose independently?

---

## 11. Appendix: File Reference

| Purpose | File Path |
|---------|-----------|
| Audio Page | `app/src/pages/Audio.tsx` |
| Deepgram Routes | `app/server/routes/audio.ts` |
| ElevenLabs Routes | `app/server/routes/elevenlabs.ts` |
| Audio Service | `app/src/services/audioService.ts` |
| ElevenLabs Service | `app/src/services/elevenlabsService.ts` |
| Translation Service | `app/src/services/translationService.ts` |
| Collections Page | `app/src/pages/Collections.tsx` |
| Collection Detail | `app/src/pages/CollectionDetail.tsx` |
| Collection Service | `app/src/lib/collectionService.ts` |
| Audio Block Editor | `app/src/components/blocks/AudioBlockEditor.tsx` |
| Timeline Gallery Editor | `app/src/components/blocks/TimelineGalleryBlockEditor.tsx` |
| Types | `app/src/types/index.ts` |
| Prisma Schema | `app/prisma/schema.prisma` |

---

*Document created: January 24, 2026*  
*Author: TourStack Development Team*
