# Translate Collections Feature - Development Plan

**Created**: January 24, 2026  
**Last Updated**: January 24, 2026  
**Status**: Phase 4 COMPLETE ✅ | Audio Block Import Working ✅  
**Feature**: Multi-language TTS Audio Collection Generation
**Current Phase**: Phase 4 - Block Import Integration ✅

---

## 🚨 CRITICAL: ElevenLabs Voice Limitations

> [!CAUTION]
> **Before modifying ANY ElevenLabs code, read [ELEVENLABS-VOICES-ISSUE.md](ELEVENLABS-VOICES-ISSUE.md)**
>
> **TL;DR:**
> - ✅ **Deepgram:** Different voices per language (Celeste for Spanish, Thalia for English) - WORKS GREAT
> - ⚠️ **ElevenLabs:** Same 21 premade voices for ALL languages - THIS IS CORRECT, DON'T "FIX" IT
> - ❌ **DO NOT** try to add native language voices via `/shared-voices` API
> - ❌ Using shared voices for GENERATION auto-adds them to account (10 slot limit)
> - ❌ After 10 slots filled: "voice_limit_reached" error - ALL GENERATION FAILS
>
> **We wasted January 24, 2026 learning this. Don't repeat our mistake.**

---

## ✅ Production Deployment (January 24, 2026)

| Feature | Deepgram | ElevenLabs | Status |
|---------|----------|------------|--------|
| Batch TTS Generation | ✅ Working | ✅ Working | DEPLOYED |
| Auto-Translation | ✅ LibreTranslate | ✅ LibreTranslate | DEPLOYED |
| Collections Saved to DB | ✅ Working | ✅ Working | DEPLOYED |
| Collection Detail View | ✅ Playback works | ✅ Playback works | DEPLOYED |
| Success Modal with Metadata | ✅ Shows all details | ✅ Shows all details | DEPLOYED |

**🚀 Successfully deployed to Coolify production!**

---

## Implementation Progress

### ✅ Phase 1: Backend Infrastructure - COMPLETE
- [x] Collections API Route (`server/routes/collections.ts`)
- [x] Audio collection type support (`audio_collection`)
- [x] Batch generation endpoint: `POST /api/audio/generate-batch` (Deepgram)
- [x] Batch generation endpoint: `POST /api/elevenlabs/generate-batch` (ElevenLabs)
- [x] Collection service using database API (not localStorage)

### ✅ Phase 2: Audio Collection Modal - COMPLETE
- [x] `AudioCollectionModal.tsx` component
- [x] Deepgram "Create Collection" button on Audio page
- [x] ElevenLabs "Create Collection" button on Audio page
- [x] Multi-language selection with checkboxes
- [x] Voice selection (per-language for Deepgram, single voice for ElevenLabs)
- [x] **Deepgram voice dropdowns always visible** (not just when language is checked)
- [x] **ElevenLabs Audio Quality selector** (MP3 22-192kbps, PCM, μ-law formats)
- [x] Auto-translate toggle with LibreTranslate
- [x] Generation progress UI with per-language results
- [x] **Success Modal with Metadata** - Shows:
  - Collection name
  - Summary stats (files generated, total size, provider)
  - Per-language details (format, sample rate, file size, voice info)
  - TTS settings summary (provider, format, sample rate, auto-translate)
  - Choice: "Stay & Continue Editing" or "View Collection"

### ✅ Phase 2.5: Collections View Enhancement - COMPLETE
- [x] Audio collection cards with Volume2 icon (purple)
- [x] Updated `CollectionDetail.tsx` for audio collections
- [x] Audio playback controls (play/pause per item)
- [x] Language badges, voice name, file size display
- [x] Translated text preview for each language
- [x] Download button per audio file

### 🔄 Phase 3: Collections View Enhancement - PARTIAL
- [ ] Filter tabs: All | Images | Audio
- [ ] Download all as ZIP functionality
- [ ] Collection search

### ✅ Phase 4: Block Import Integration - COMPLETE 🎉
- [x] Audio Block "Import from Collection" button
- [x] Timeline Gallery "Import from Collection" button  
- [x] Collection picker modal (`CollectionPickerModal.tsx`)
- [x] Auto-populate audioFiles for all languages (Audio Block)
- [x] Import translated text into transcript fields
- [x] **Audio Block: Full multi-language support** - switches BOTH audio AND text on language change! 🎊

#### Phase 4 Summary: Two Different Workflows

**🎵 Audio Block Workflow (Full Multi-Language):**
```
Audio View → Enter text → Generate TTS (all languages) → Save to Collection
    ↓
Tour Stop → Add Audio Block → "Import from Collection" 
    ↓
Preview → Switch language → BOTH audio AND transcript change ✅
```

**🖼️ Timeline Gallery Workflow (Self-Contained with Single Audio):**
```
Tour Stop → Add Timeline Gallery Block → Upload images
    ↓
Upload audio OR "Import from Collection" (picks ONE language)
    ↓
Transcribe with Deepgram → "Translate CC" → All caption languages
    ↓
Preview → Switch language → Captions change ✅, audio stays same
```

#### Why Timeline Gallery Uses Single Audio (By Design)

Timeline Gallery synchronizes images to audio timestamps (markers on waveform). Multi-language audio would require:
1. Different audio durations per language (narration length varies by language)
2. Re-mapping all image timestamps for each language
3. Complex sync logic for timeline markers across different durations

**Current design is intentional:** One audio track with multi-language captions is the standard approach for image slideshows with narration. This is how most museum audio guides work.

**Timeline Gallery Already Has Built-In Tools:**
- ✅ Upload or import audio (single language)
- ✅ Deepgram transcription (generates transcript from audio)
- ✅ Magic Translate CC button (translates captions to all tour languages)
- ✅ Waveform editor with draggable image markers

#### Future Enhancement (Optional, Low Priority)

To add full multi-language audio switching to Timeline Gallery:
1. Add `audioFiles?: { [lang: string]: string }` to `TimelineGalleryBlockData`
2. Store timestamps as percentages (0-100%) instead of absolute seconds
3. Recalculate actual timestamps based on each audio's duration
4. Update `TimelineGalleryPreview` to switch audio on language change

**Recommendation:** Keep current design. The built-in transcription + translation tools provide a complete workflow.

---

## 🎯 Phase 4 Implementation Details - COMPLETE ✅

### What Was Built

**New Component: `CollectionPickerModal.tsx`** (417 lines)
A reusable modal for importing audio collections into blocks:
- Search functionality to filter collections
- Collection list view with language badges and file size
- Collection detail view with audio preview (play/pause)
- Two modes: `multi` (all languages) and `single` (user picks one)
- Clean import interface returning `ImportedAudioData`

**Modified: `AudioBlockEditor.tsx`**
- Added "Import from Collection" button (purple, with FolderOpen icon)
- Opens CollectionPickerModal in `mode="multi"`
- Imports ALL language audio files and transcripts at once
- **Result: Switching languages in preview switches BOTH audio and text!** 🎊

**Modified: `TimelineGalleryBlockEditor.tsx`**
- Added "Import from Collection" button in audio upload section
- Opens CollectionPickerModal in `mode="single"` 
- User selects which language's audio to import
- Imports selected audio + all transcript languages

**Modified: `TimelineGalleryEditorModal.tsx`**
- Same import functionality for full-screen editor
- Consistent UX across compact and expanded views

### Current Block Data Structures

**AudioBlockData** (from `types/index.ts`):
```typescript
export interface AudioBlockData {
  audioFiles: { [lang: string]: string }; // Per-language audio URLs ← IMPORT TARGET
  title: { [lang: string]: string };
  size: 'large' | 'medium' | 'small';
  showTitle: boolean;
  transcript?: { [lang: string]: string }; // ← IMPORT TRANSLATED TEXT HERE
  transcriptWords?: Array<{ word: string; start: number; end: number; confidence: number; }>;
  autoplay: boolean;
  showTranscript: boolean;
  showCaptions?: boolean;
}
```

**TimelineGalleryBlockData** (from `types/index.ts`):
```typescript
export interface TimelineGalleryBlockData {
  images: Array<{ id?: string; url: string; alt: { [lang: string]: string }; ... }>;
  audioUrl: string;                     // Single audio URL ← NEEDS UPGRADE
  audioDuration: number;
  transcript?: { [lang: string]: string }; // ← IMPORT TRANSLATED TEXT HERE
  transcriptWords?: Array<{ word: string; start: number; end: number; confidence: number; }>;
  showCaptions?: boolean;
}
```

### AudioCollectionItem Structure (from `collectionService.ts`):
```typescript
export interface AudioCollectionItem {
  id: string;
  order: number;
  type: 'audio';
  url: string;           // Audio file URL
  language: string;      // 'en', 'es', 'fr', etc.
  voice: { id: string; name: string; gender?: string; };
  provider: 'deepgram' | 'elevenlabs';
  format: string;
  fileSize: number;
  text: string;          // The translated text used for TTS
}
```

### Import Mapping Strategy

**Audio Block Import:**
```typescript
// Map collection items to AudioBlockData
function importCollectionToAudioBlock(
  collection: AudioCollection,
  existingData: AudioBlockData
): AudioBlockData {
  const audioFiles: { [lang: string]: string } = {};
  const transcript: { [lang: string]: string } = {};
  
  collection.items.forEach(item => {
    audioFiles[item.language] = item.url;      // Map audio URL
    transcript[item.language] = item.text;     // Map translated text
  });
  
  return {
    ...existingData,
    audioFiles: { ...existingData.audioFiles, ...audioFiles },
    transcript: { ...existingData.transcript, ...transcript },
  };
}
```

**Timeline Gallery Import (Requires Schema Update):**
```typescript
// Current: audioUrl (single)
// Needed: audioFiles (per-language) - same as AudioBlockData

// Option A: Add audioFiles to TimelineGalleryBlockData
export interface TimelineGalleryBlockData {
  // ... existing fields
  audioUrl: string;                           // Keep for backward compat
  audioFiles?: { [lang: string]: string };    // NEW: Per-language audio
}

// Option B: Use audioUrl for current language only (simpler)
// User selects which language's audio to use from collection
```

### UI Flow

1. **Audio Block Editor** (`AudioBlockEditor.tsx`):
   - Add "📁 Import from Collection" button next to "Choose Audio File"
   - Opens collection picker modal (shows audio_collection type only)
   - Shows collection name, language count, preview
   - On select: Populates `audioFiles` and `transcript` for ALL languages

2. **Timeline Gallery Editor** (`TimelineGalleryBlockEditor.tsx`):
   - Add "📁 Import from Collection" button in audio section
   - Modal shows language selector (which language to use)
   - On select: Sets `audioUrl` to selected language's audio
   - Also imports `transcript` for all languages

### Files Modified

| File | Changes | Status |
|------|---------|--------|
| `CollectionPickerModal.tsx` | NEW - Reusable collection picker with multi/single mode | ✅ Created |
| `AudioBlockEditor.tsx` | Added import button, multi-language import | ✅ Complete |
| `TimelineGalleryBlockEditor.tsx` | Added import button, single-language import | ✅ Complete |
| `TimelineGalleryEditorModal.tsx` | Added import button for full-screen editor | ✅ Complete |
| `collectionService.ts` | Already has `getAudioCollections()` | ✅ Existed |
| `types/index.ts` | No changes needed - AudioBlockData already supports multi-lang | ✅ N/A |

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
| Voices | 40+ per-language | **21 premade ONLY** ⚠️ |
| Auto-Translate | ✅ via LibreTranslate | ✅ via LibreTranslate |
| Voice Preview | ✅ | ✅ |
| Output Formats | MP3, WAV, OGG, FLAC | MP3, PCM, Opus |
| Sample Rates | 8-48 kHz | 16-44 kHz |
| File Storage | `/uploads/audio/generated/` | `/uploads/audio/generated/` |

> [!CAUTION]
> **ElevenLabs shows "3,000+ community voices" but using them BREAKS production!**
> See [ELEVENLABS-VOICES-ISSUE.md](ELEVENLABS-VOICES-ISSUE.md) for why we use premade only.

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

**Import Data Mapping (Audio Block):**
```typescript
// When importing an AudioCollection into an AudioBlock:
function importToAudioBlock(collection: AudioCollection): Partial<AudioBlockData> {
    // Build audioFiles from collection items
    const audioFiles: { [lang: string]: string } = {};
    collection.items.forEach(item => {
        if (item.type === 'audio') {
            audioFiles[item.language] = item.url;
        }
    });
    
    // Use collection.texts for transcript (already in correct format)
    return {
        audioFiles,                          // Per-language audio URLs
        transcript: collection.texts,        // Per-language text (for captions/transcript)
        title: { en: collection.name },      // Collection name as title
    };
}
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

**Import Data Mapping (Timeline Gallery - Current Single-Language):**
```typescript
// When importing an AudioCollection into a TimelineGalleryBlock (Phase 4):
function importToTimelineGallery(
    collection: AudioCollection, 
    selectedLang: string
): Partial<TimelineGalleryBlockData> {
    const audioItem = collection.items.find(
        item => item.type === 'audio' && item.language === selectedLang
    );
    
    return {
        audioUrl: audioItem?.url,                    // Single audio for selected language
        audioDuration: audioItem?.duration,
        transcript: collection.texts,               // ALL language texts for captions
    };
}

// Phase 5 enhancement: Multi-language support
function importToTimelineGalleryMultiLang(
    collection: AudioCollection
): Partial<TimelineGalleryBlockData> {
    const audioFiles: { [lang: string]: string } = {};
    collection.items.forEach(item => {
        if (item.type === 'audio') {
            audioFiles[item.language] = item.url;
        }
    });
    
    return {
        audioFiles,                                 // NEW: Per-language audio
        transcript: collection.texts,              // Per-language text for captions
    };
}
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

### Phase 1: Backend Infrastructure ✅ COMPLETE

**Goal:** Migrate collections to database API, add audio collection support

**Tasks:**

1. **Create Collections API Route** (`server/routes/collections.ts`) ✅
   - CRUD endpoints for collections
   - Support for `audio_collection` type
   - Filter by type query parameter

2. **Update Collection Schema** ✅
   - Add new fields for audio metadata
   - Extend `CollectionItem` for audio-specific data

3. **Migrate collectionService.ts** ✅
   - Replace localStorage with API calls
   - Add TypeScript types for audio collections

4. **Add Batch Generation Endpoint** ✅
   - `POST /api/audio/generate-batch` (Deepgram)
   - `POST /api/elevenlabs/generate-batch` (ElevenLabs)
   - Sequential generation with progress tracking
   - Error handling for partial failures

**Deliverables:**
- [x] `server/routes/collections.ts` with full CRUD
- [x] Updated `collectionService.ts` using API
- [x] `POST /api/audio/generate-batch` endpoint (Deepgram)
- [x] `POST /api/elevenlabs/generate-batch` endpoint (ElevenLabs)

---

### Phase 2: Audio Collection Modal ✅ COMPLETE

**Goal:** Build the modal UI for batch audio generation

**Tasks:**

1. **Create AudioCollectionModal Component** ✅
   - Title and description inputs
   - Provider selection (Deepgram/ElevenLabs)
   - Format and sample rate options
   - Language checkboxes with availability indicators
   - Voice dropdown per language (Deepgram) / single voice (ElevenLabs)

2. **Integrate with Audio Page** ✅
   - "Create Collection" button on Deepgram tab
   - "Create Collection" button on ElevenLabs tab
   - Handle generation progress

3. **Generation Progress UI** ✅
   - Per-language success/error indicators
   - Real-time result updates

4. **Success State** ✅
   - Show generated collection summary
   - "View Collection" button

**Deliverables:**
- [x] `AudioCollectionModal.tsx` component
- [x] Updated `Audio.tsx` integration (both tabs)
- [x] Progress/success UI states
- [x] Voice selection synced with provider

---

### Phase 2.5: Collections View Enhancement ✅ COMPLETE

**Goal:** Display and manage audio collections

**Tasks:**

1. **Update Collections Page** ✅
   - Audio collection card design (Volume2 icon, purple)
   - Show audio collection type badge

2. **Audio Collection Detail Page** ✅
   - List all language variants with playback
   - Play/pause button per language
   - Download individual files
   - Show source text (English)
   - Show translated text preview per language
   - Language badges, voice name, file size display
   - TTS settings display (provider, model, format)

**Deliverables:**
- [x] Audio collection card component
- [x] Updated `CollectionDetail.tsx` for audio type
- [x] Playback controls
- [x] Download functionality (per file)

---

### Phase 3: Collections View Enhancement (Remaining) 🔄 IN PROGRESS

**Goal:** Additional collection management features

**Tasks:**

1. **Collection Filtering**
   - Filter tabs: All | Images | Audio
   - Search across name/description

2. **Bulk Download**
   - Download all languages as ZIP
   - Include metadata JSON

**Deliverables:**
- [ ] Filter/search UI
- [ ] Download all as ZIP functionality

---

### Phase 4: Block Import Integration 📋 NOT STARTED

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
    language: string;           // Language code: 'en', 'es', 'fr', etc.
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
    text: string;               // The text used to generate this audio (in this language)
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
    sourceLanguage?: string;     // Primary language (usually 'en')
    texts?: { [lang: string]: string };  // All text versions keyed by language
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
