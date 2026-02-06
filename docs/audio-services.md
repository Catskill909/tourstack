# TourStack Audio Services - Implementation Document

## Overview

The **Audio** section in TourStack's side navigation provides a centralized hub for creating and managing text-to-speech (TTS) audio files for tours. **Phase 1 is now complete** with full Deepgram Aura-2 integration.

### Implementation Status (January 22, 2026)

| Feature | Status |
|---------|--------|
| Deepgram Aura-2 TTS | Complete |
| 7 Languages Support | Complete |
| 40+ Voice Models | Complete |
| Auto-Translate (LibreTranslate) | Complete |
| Voice Preview | Complete |
| Multiple Output Formats | Complete |
| Success Modal | Complete |
| File Metadata Display | Complete |
| ElevenLabs Integration | Complete |
| ElevenLabs Native Voices | Complete |
| ElevenLabs Auto-Translate | Complete |
| Language Availability Modal | Complete |
| Google Cloud TTS Integration | Complete |
| Google Cloud Neural2 + Standard Voices | Complete |
| Google Cloud Batch Collections | Complete |
| Whisper Integration | Coming Soon |

---

## Navigation Structure

Add "Audio" to the sidebar navigation between "Languages" and "Analytics":

```
Dashboard
Tours
Collections
Templates
Media Library
Languages
🔊 Audio (NEW)        <-- Insert here
Analytics
Tools
---
Settings
Help
```

---

## Tab Structure

The Audio page has provider tabs:

| Tab | Status | Provider |
|-----|--------|----------|
| **Deepgram** | ✅ Active | Aura-2 TTS with 40+ voices |
| **ElevenLabs** | ✅ Active | Premium multilingual TTS |
| **Google Cloud** | ✅ Active | Neural2 + Standard TTS with 400+ voices |
| **Whisper** | 🔜 Coming Soon | Speech-to-text |

---

## Deepgram Aura TTS Features

Based on Deepgram's Text-to-Speech API documentation, here are the available features:

### Voice Models (Aura-2) - IMPLEMENTED ✅

**Languages Supported (7 total):**

| Language | Code | Featured Voices | Total Voices |
|----------|------|-----------------|--------------|
| English | en | Thalia, Andromeda, Helena, Apollo, Arcas, Aries | 40+ |
| Spanish | es | Celeste, Estrella, Nestor | 17 |
| German | de | Viktoria, Julius | 7 |
| French | fr | Agathe, Hector | 2 |
| Dutch | nl | Rhea, Sander, Beatrix | 9 |
| Italian | it | Livia, Dionisio | 10 |
| Japanese | ja | Fujin, Izanami | 5 |

**Auto-Translate Feature:**
When selecting a non-English language, an auto-translate toggle appears (enabled by default). This automatically translates English text to the target language via LibreTranslate before generating audio, ensuring the output is in the actual target language (not just English with an accent).

**Full English Voice Library:** 40+ voices including:
- Female: Asteria, Athena, Aurora, Callista, Cora, Cordelia, Delia, Electra, Harmonia, Hera, Iris, Juno, Luna, Minerva, Ophelia, Pandora, Phoebe, Selene, Theia, Vesta
- Male: Atlas, Draco, Hermes, Hyperion, Janus, Jupiter, Mars, Neptune, Odysseus, Orion, Orpheus, Pluto, Saturn, Zeus

### Media Output Settings

| Feature | Options | Default |
|---------|---------|---------|
| **Encoding** | linear16, mp3, opus, flac, alaw, mulaw | linear16 |
| **Sample Rate** | 8000, 16000, 24000, 48000 Hz | 24000 |
| **Bit Rate** | 8kbps - 320kbps (for mp3) | 128kbps |
| **Container** | wav, mp3, ogg, flac | wav |

### API Features

- **REST API** - Single request for complete audio generation
- **WebSocket Streaming** - Real-time audio for live applications
- **Callback URLs** - Async processing with webhook notifications
- **Audio Output Streaming** - Stream chunks as they're generated

---

## Feature Brainstorm: Audio Section

### Phase 1: Core TTS Generation (MVP) ✅ COMPLETE

#### 1.1 Text-to-Speech Generator ✅
- [x] Text input area with character count
- [x] Voice selector dropdown (grouped by language)
- [x] Voice preview/sample player
- [x] Output format selector (MP3, WAV, OGG, FLAC)
- [x] Sample rate selector (8kHz, 16kHz, 24kHz, 48kHz)
- [x] Generate button with progress indicator
- [x] Audio player for generated content
- [x] Download button
- [x] **Auto-translate toggle** for non-English languages
- [x] **Success modal** with generation settings summary
- [x] **Auto-scroll** to generated files after creation

#### 1.2 Audio File Management ✅
- [x] List view of generated audio files
- [x] File metadata display with **color-coded badges**:
  - Language badge (blue)
  - Format badge (purple)
  - Sample rate badge (green)
  - File size
  - Voice name
- [x] Text preview (truncated)
- [x] Play/pause controls
- [x] Download button
- [x] Delete button
- [x] Refresh button

#### 1.3 Voice Gallery ✅
- [x] Visual voice selector with cards
- [x] Gender indicators (pink/blue icons)
- [x] Featured voice badges
- [x] Preview button per voice
- [x] Language filter dropdown

### Phase 2: Tour Integration

#### 2.1 Tour Audio Workflow
- [ ] Generate audio from tour stop text content
- [ ] Batch generate audio for entire tour
- [ ] Multi-language audio generation
- [ ] Auto-link generated audio to tour stops
- [ ] Preview audio in tour editor

#### 2.2 Audio Templates
- [ ] Save voice/settings presets
- [ ] Tour-level default voice settings
- [ ] Organization-wide voice standards

### Phase 3: Advanced Features

#### 3.1 Voice Customization
- [ ] Speed/pace adjustment (if supported)
- [ ] Pronunciation hints (SSML support)
- [ ] Custom vocabulary/pronunciation dictionary

#### 3.2 Batch Processing
- [ ] CSV/spreadsheet import for bulk generation
- [ ] Queue management for large jobs
- [ ] Background processing with notifications

#### 3.3 Audio Editing (Light)
- [ ] Trim start/end
- [ ] Add silence/padding
- [ ] Normalize volume
- [ ] Concatenate multiple clips

### Phase 4: ElevenLabs Integration ✅ COMPLETE

> **Status:** Fully Implemented (January 24, 2026)

---

### 🚨🚨🚨 CRITICAL: ELEVENLABS VOICE SLOTS - READ THIS FIRST! 🚨🚨🚨

> [!CAUTION]
> **We wasted an ENTIRE DAY (January 24, 2026) debugging voice slot issues.**
> **DO NOT try to add "native language voices" - it WILL break!**

#### The Problem We Solved (The Hard Way)

| What You Want | What Actually Happens |
|---------------|----------------------|
| Show Italian voices for Italian | Uses `/shared-voices` API |
| Generate audio with Italian voice | **AUTO-ADDS voice to your account** |
| Auto-add uses a voice slot | **Starter tier = 10 slots MAX** |
| 10 generations later... | **"voice_limit_reached" - ALL GENERATION FAILS** |

#### The Solution (LOCKED IN - DO NOT CHANGE)

```typescript
// ✅ CORRECT - Use /voices API filtered to premade ONLY
fetch(`${ELEVENLABS_API_URL}/voices`)
  .filter((voice) => voice.category === 'premade')

// ❌ WRONG - NEVER use shared-voices for generation!
fetch(`${ELEVENLABS_API_URL}/shared-voices?language=${lang}`)
```

#### Why Premade Voices Work Fine

| Concern | Reality |
|---------|---------|
| "But they're all English names!" | Yes, but Multilingual v2 handles pronunciation |
| "Roger can't speak Italian!" | **WRONG** - Roger + Italian text = Italian pronunciation |
| "We need native Italian voices!" | **NO** - premade voices sound native in ALL languages |
| "Deepgram has per-language voices!" | Deepgram is different architecture, ElevenLabs uses multilingual model |

#### Voice Slot Rules (MEMORIZE THIS)

| Action | Uses Slot? | Safe for Production? |
|--------|------------|---------------------|
| `GET /voices` (premade only) | ❌ No | ✅ YES |
| `POST /text-to-speech/{premade_id}` | ❌ No | ✅ YES |
| `GET /shared-voices` (browse only) | ❌ No | ✅ YES |
| `POST /text-to-speech/{shared_id}` | **✅ YES** | ❌ **BREAKS AT 10!** |

#### If You See "voice_limit_reached"

```bash
# Check current slot usage
curl -s "https://api.elevenlabs.io/v1/user/subscription" \
  -H "xi-api-key: YOUR_KEY" | jq '.voice_slots_used, .voice_limit'

# List voices using slots
curl -s "https://api.elevenlabs.io/v1/voices" \
  -H "xi-api-key: YOUR_KEY" | jq '.voices[] | select(.category != "premade")'

# Delete a voice to free slot
curl -X DELETE "https://api.elevenlabs.io/v1/voices/{voice_id}" \
  -H "xi-api-key: YOUR_KEY"
```

📖 **Full incident report:** [ELEVENLABS-VOICES-ISSUE.md](ELEVENLABS-VOICES-ISSUE.md)

---

#### 4.1 ElevenLabs Overview

ElevenLabs provides premium text-to-speech with:
- **32+ languages** supported via Multilingual v2 model
- **PREMADE VOICES ONLY** - this is NOT a limitation, it's the CORRECT approach
- **Auto-translate via LibreTranslate** - text translated, then spoken by premade voice
- **Ultra-low latency** (~75ms with Flash v2.5)

**Our Workflow:**
1. User writes text in English (source language)
2. LibreTranslate translates text to target language (Spanish, Italian, etc.)
3. ElevenLabs speaks the translated text using a **premade** voice
4. Multilingual v2 model handles correct pronunciation for all languages

**Why Premade Voices Are The ONLY Option:**
- ✅ NO custom voice slots consumed (Starter tier limit = 10)
- ✅ NO voice cloning fees
- ✅ Works reliably on ALL ElevenLabs tiers including FREE
- ✅ Premade voices speak ALL languages correctly via multilingual model
- ⚠️ Shared voices LOOK better but BREAK production at scale

#### 4.2 ElevenLabs Models

| Model | Languages | Char Limit | Latency | Best For |
|-------|-----------|------------|---------|----------|
| **Multilingual v2** | 29 | 10,000 | Higher | Long-form, consistent quality ✅ DEFAULT |
| **Flash v2.5** | 32 | 40,000 | ~75ms | Real-time, cost-effective |
| **Turbo v2.5** | 32 | 40,000 | ~250ms | Balanced quality/speed |

#### 4.3 ElevenLabs Audio Formats

| Format | Sample Rates | Notes |
|--------|--------------|-------|
| **MP3** | 22.05kHz, 44.1kHz | Bitrates: 32-192kbps |
| **PCM** | 16kHz - 48kHz | 16-bit depth |
| **μ-law** | 8kHz | Telephony optimized |

#### 4.4 ElevenLabs Voice Types

> [!CAUTION]
> **DO NOT try to implement native language voices. We tried. It breaks. See top of this section.**

**✅ USED: Premade Voices ONLY (THIS IS FINAL)**
- 21 high-quality voices included with any tier (even FREE)
- Work with ALL 32 languages via multilingual model
- **No custom voice slots required - EVER**
- Always available, no additional cost
- Roger + Italian text = Italian pronunciation
- Sarah + Chinese text = Chinese pronunciation

**❌ FORBIDDEN: Community/Shared Voices**
- Browsing is fine, GENERATING is NOT
- Auto-adds to account on first generation
- Consumes 1 of 10 voice slots (Starter tier)
- After 10 voices: "voice_limit_reached" error
- **We wasted a full day learning this - don't repeat!**

**❌ NOT USED: Voice Cloning**
- Requires premium tier
- Not needed for museum tour TTS

#### 4.5 ElevenLabs Tab Features ✅ IMPLEMENTED

**Core TTS Generation:**
- [x] Text input with character count (model-specific limits)
- [x] Model selector (Multilingual v2, Flash v2.5, Turbo v2.5)
- [x] **Premade voice gallery only** (30 voices, all work with any language)
- [x] Voice preview player using pre-hosted URLs
- [x] Output format selector (MP3 44.1kHz, PCM)
- [x] Generate button with progress indicator
- [x] Audio player and download
- [x] **Auto-translate toggle** for non-English languages via LibreTranslate

**Voice Settings:**
- [x] Stability slider (0-1) - consistency vs expressiveness
- [x] Similarity boost slider (0-1) - voice matching

**Language Availability (LibreTranslate):**
- [x] Languages with auto-translation show ✓ in dropdown
- [x] Styled modal for unavailable languages explaining configuration
- [x] Supported: en, es, fr, de, it, pt, ja, ko, zh

**Generated Audio Display:**
- [x] Format badges (MP3, 44kHz)
- [x] File size display
- [x] Voice name
- [x] Text preview
- [x] Play/pause controls
- [x] Download and delete buttons

#### 4.6 ElevenLabs API Endpoints

```typescript
// Core TTS
POST /v1/text-to-speech/{voice_id}
POST /v1/text-to-speech/{voice_id}/stream

// Voices
GET  /v1/voices                    // List all voices
GET  /v1/voices/{voice_id}         // Get voice details
GET  /v1/voices/settings/default   // Default voice settings
POST /v1/voices/settings/{voice_id}/edit  // Edit settings

// Voice Library
GET  /v1/shared-voices             // Community voices

// Voice Cloning
POST /v1/voices/add                // Instant clone
POST /v1/voices/{voice_id}/edit    // Update voice

// Voice Design
POST /v1/voice-generation/generate-voice  // Create from description

// Models
GET  /v1/models                    // List available models
```

#### 4.7 ElevenLabs Pricing Considerations

- Pay-per-character model
- Different tiers: Free, Starter, Creator, Pro, Scale
- Voice cloning requires Creator+ plan
- Higher quality audio on paid tiers only

### Phase 5: Google Cloud TTS Integration ✅ COMPLETE

> **Status:** Fully Implemented (February 6, 2026)

#### 5.1 Google Cloud TTS Overview

Google Cloud Text-to-Speech provides neural voices via REST API:
- **10 languages** with BCP-47 code mapping (en→en-US, es→es-ES, etc.)
- **Neural2 + Standard** voice types (filtered from 400+ available voices)
- **Shared API key** - reuses `GOOGLE_VISION_API_KEY` (same as Vision + Google Translate)
- **No SDK needed** - uses `texttospeech.googleapis.com/v1` REST endpoints with `fetch`

#### 5.2 Google Cloud TTS Features ✅ IMPLEMENTED

**Core TTS Generation:**
- [x] Text input with voice preview
- [x] Language dropdown (10 languages with voice count per language)
- [x] Voice dropdown (filtered by language, showing type + gender)
- [x] Format selector (MP3, WAV/LINEAR16, OGG Opus)
- [x] Sample rate selector (16kHz, 24kHz, 44.1kHz, 48kHz)
- [x] Speaking rate slider (0.25-4.0, default 1.0)
- [x] Pitch slider (-20 to 20, default 0)
- [x] Generate button with progress indicator
- [x] Audio player and download

**Batch Collection Generation:**
- [x] "Create Collection" button opens AudioCollectionModal
- [x] Multi-language selection with auto-translation via LibreTranslate
- [x] Per-language voice selection
- [x] Generated files tracked in metadata and appear in Generated Files list

#### 5.3 Google Cloud TTS Audio Formats

| Format | ID | Extension | Notes |
|--------|----|-----------|-------|
| **MP3** | MP3 | .mp3 | Default, widely compatible |
| **WAV (PCM)** | LINEAR16 | .wav | Uncompressed, highest quality |
| **OGG Opus** | OGG_OPUS | .ogg | Good quality/size balance |

#### 5.4 Google Cloud TTS API Endpoints

```typescript
// Backend routes (server/routes/google-tts.ts)
GET  /api/google-tts/status       // Check API key validity
GET  /api/google-tts/voices       // List voices (filtered Neural2 + Standard)
GET  /api/google-tts/formats      // Static format list
GET  /api/google-tts/languages    // Supported languages
POST /api/google-tts/generate     // Single TTS generation
GET  /api/google-tts/files        // List generated files
DELETE /api/google-tts/files/:id  // Delete a generated file
POST /api/google-tts/preview      // Voice preview
POST /api/google-tts/generate-batch // Batch multilingual generation
```

#### 5.5 Google Cloud TTS Key Implementation Details

**API Key:** Reuses `GOOGLE_VISION_API_KEY` environment variable. Requires HTTP Referer header restriction set to `http://localhost:3000`.

**Voice Caching:** Server caches the voice list for 1 hour to avoid repeated API calls. The Google API returns 400+ voices; we filter to Standard + Neural2 only.

**Language Code Mapping:**
```typescript
const LANGUAGE_CODE_MAP = {
    'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE',
    'it': 'it-IT', 'ja': 'ja-JP', 'nl': 'nl-NL', 'ko': 'ko-KR',
    'pt': 'pt-BR', 'zh': 'cmn-CN',
};
```

**Text Limit:** Google Cloud TTS has a 5,000-byte limit per request. The backend validates and rejects text exceeding this limit.

**Base64 Response:** Unlike Deepgram/ElevenLabs which stream binary audio, Google returns base64 JSON (`{ audioContent: "..." }`). Decoded server-side and saved to file.

**File Storage:** Same as other providers: `/uploads/audio/generated/` with `google-tts-metadata.json` for persistence.

#### 5.6 Google Cloud TTS Files

| Purpose | File Path |
|---------|-----------|
| Backend Route | `app/server/routes/google-tts.ts` |
| Frontend Service | `app/src/services/googleTtsService.ts` |
| Audio Page Tab | `app/src/pages/Audio.tsx` (GoogleCloudTab) |
| Collection Modal | `app/src/components/AudioCollectionModal.tsx` |
| Collection Detail | `app/src/pages/CollectionDetail.tsx` |

---

### Phase 6: Whisper Integration (Future)
- [ ] STT for transcription verification
- [ ] Audio-to-text for existing tour audio
- [ ] Subtitle/caption generation

---

## Service Provider Architecture

### Provider Abstraction Layer

To enable seamless switching between TTS providers in content blocks, implement a unified interface:

```typescript
// Unified TTS Provider Interface
interface TTSProvider {
  id: string;                    // 'deepgram' | 'elevenlabs' | 'google_cloud' | 'whisper'
  name: string;
  enabled: boolean;
  
  // Core methods
  getVoices(): Promise<Voice[]>;
  generateAudio(options: TTSOptions): Promise<AudioResult>;
  previewVoice(voiceId: string): Promise<AudioBuffer>;
  
  // Provider-specific settings
  getSettings(): ProviderSettings;
  updateSettings(settings: Partial<ProviderSettings>): void;
}

interface TTSOptions {
  text: string;
  voiceId: string;
  language?: string;
  format?: 'mp3' | 'wav' | 'ogg' | 'flac' | 'pcm';
  sampleRate?: number;
  // Provider-specific options
  providerOptions?: Record<string, unknown>;
}

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female' | 'neutral';
  provider: string;
  preview_url?: string;
  // Provider-specific metadata
  metadata?: Record<string, unknown>;
}
```

### Block Integration Strategy

**Audio Block Provider Selection:**
```
┌─────────────────────────────────────────────────────────────┐
│  Audio Block Editor                                          │
├─────────────────────────────────────────────────────────────┤
│  Provider: [Deepgram ▼] [ElevenLabs] [Upload]               │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Provider-specific UI loads here]                   │    │
│  │  - Voice selection                                   │    │
│  │  - Settings (stability, format, etc.)               │    │
│  │  - Generate button                                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Generated Audio: [▶ Play] [⬇ Download] [🗑 Delete]         │
└─────────────────────────────────────────────────────────────┘
```

**Tour-Level Default Provider:**
- Settings page allows setting default TTS provider
- Individual blocks can override the default
- Batch generation uses tour's default provider

### Translation Integration

**Auto-Translate Supported Languages:**

| Language | LibreTranslate | Deepgram TTS | ElevenLabs TTS | Google Cloud TTS |
|----------|----------------|--------------|----------------|-----------------|
| English | ✅ | ✅ | ✅ | ✅ |
| Spanish | ✅ | ✅ | ✅ | ✅ |
| French | ✅ | ✅ | ✅ | ✅ |
| German | ✅ | ✅ | ✅ | ✅ |
| Italian | ✅ | ✅ | ✅ | ✅ |
| Japanese | ✅ | ✅ | ✅ | ✅ |
| Portuguese | ✅ | ❌ | ✅ | ✅ |
| Korean | ✅ | ❌ | ✅ | ✅ |
| Chinese | ✅ | ❌ | ✅ | ✅ |
| **Dutch** | ❌ | ✅ | ✅ | ✅ |

> **Note:** Dutch (nl) is NOT supported by LibreTranslate. Users must provide pre-translated Dutch text.

---

## UI/UX Design Considerations

### Audio Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🔊 Audio                                        [+ New]    │
├─────────────────────────────────────────────────────────────┤
│  [Deepgram]  [Whisper 🔒]  [ElevenLabs 🔒]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Text-to-Speech Generator                           │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │                                               │  │   │
│  │  │  Enter text to convert to speech...          │  │   │
│  │  │                                               │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                           0/2000    │   │
│  │                                                     │   │
│  │  Voice: [Thalia (English) ▼]  Format: [MP3 ▼]      │   │
│  │                                                     │   │
│  │  [▶ Preview Voice]           [🔊 Generate Audio]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Generated Audio                    [Grid] [List]   │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ 🎵 stop-1-intro.mp3     │ 0:45 │ [▶][⬇][🗑] │    │   │
│  │  │ 🎵 stop-2-history.mp3   │ 1:23 │ [▶][⬇][🗑] │    │   │
│  │  │ 🎵 stop-3-artwork.mp3   │ 0:58 │ [▶][⬇][🗑] │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Coming Soon Tab Design

```
┌─────────────────────────────────────────────────────────────┐
│  [Deepgram]  [Whisper 🔒]  [ElevenLabs 🔒]                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│           ┌────────────────────────────────┐               │
│           │          🔒                     │               │
│           │                                │               │
│           │    Whisper Integration         │               │
│           │    Coming Soon                 │               │
│           │                                │               │
│           │    Self-hosted speech-to-text  │               │
│           │    for transcription and       │               │
│           │    audio verification.         │               │
│           │                                │               │
│           │    [Notify Me When Available]  │               │
│           └────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Plan

### Backend (Express API)

#### New Routes: `/api/audio/*`

```typescript
// POST /api/audio/generate - Generate TTS audio
// GET  /api/audio/files - List generated audio files
// GET  /api/audio/files/:id - Get single audio file metadata
// DELETE /api/audio/files/:id - Delete audio file
// GET  /api/audio/voices - Get available voices by provider
// GET  /api/audio/status - Check provider status/quotas
```

#### New Server Route: `server/routes/audio.ts`

```typescript
// Deepgram TTS API integration
const DEEPGRAM_TTS_URL = 'https://api.deepgram.com/v1/speak';

// Generate audio from text
router.post('/generate', async (req, res) => {
  const { text, voice, encoding, sampleRate, provider } = req.body;
  // Call Deepgram Aura API
  // Save to local storage or cloud
  // Return audio URL and metadata
});
```

### Frontend

#### New Files to Create

```
src/pages/Audio.tsx           - Main Audio page with tabs
src/components/audio/
  ├── AudioGenerator.tsx      - TTS generation form
  ├── AudioPlayer.tsx         - Custom audio player component
  ├── VoiceSelector.tsx       - Voice dropdown with previews
  ├── AudioFileList.tsx       - List/grid of generated files
  ├── ComingSoonTab.tsx       - Placeholder for future providers
  └── AudioSettings.tsx       - Provider-specific settings
src/services/audioService.ts  - API client for audio endpoints
```

#### Route Addition

```typescript
// In App.tsx or router config
{ path: '/audio', element: <AudioPage /> }
```

#### Sidebar Update

```typescript
// In Sidebar.tsx - Add between Languages and Analytics
{ to: '/audio', icon: Volume2, label: 'Audio' },
```

### Database Schema (Prisma)

```prisma
model AudioFile {
  id          String   @id @default(cuid())
  name        String
  text        String   @db.Text
  provider    String   // 'deepgram' | 'whisper' | 'elevenlabs'
  voice       String
  language    String
  encoding    String
  sampleRate  Int
  duration    Float?
  fileSize    Int?
  filePath    String
  fileUrl     String?
  tourId      String?
  stopId      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tour        Tour?    @relation(fields: [tourId], references: [id])
  stop        Stop?    @relation(fields: [stopId], references: [id])
}
```

---

## Execution Roadmap

### Sprint 1: Foundation (Week 1-2)
1. [ ] Add Audio route to sidebar navigation
2. [ ] Create Audio page with tab structure
3. [ ] Implement Coming Soon tabs for Whisper/ElevenLabs
4. [ ] Create basic Deepgram TTS API route
5. [ ] Build AudioGenerator component

### Sprint 2: Core Features (Week 3-4)
6. [ ] Implement voice selector with all Deepgram voices
7. [ ] Add audio file storage (local + optional S3)
8. [ ] Build AudioFileList component
9. [ ] Add AudioPlayer component
10. [ ] Create audioService client

### Sprint 3: Database & Management (Week 5-6)
11. [ ] Add AudioFile model to Prisma schema
12. [ ] Implement CRUD operations
13. [ ] Add search/filter functionality
14. [ ] Build batch delete feature

### Sprint 4: Tour Integration (Week 7-8)
15. [ ] Link audio generation to tour stops
16. [ ] Add "Generate Audio" action in tour editor
17. [ ] Implement batch generation for tours
18. [ ] Multi-language audio support

### Sprint 5: Polish & Advanced (Week 9-10)
19. [ ] Voice presets/templates
20. [ ] Usage analytics/quotas display
21. [ ] Audio editing (trim, normalize)
22. [ ] Performance optimization

---

## API Cost Considerations

### Deepgram Aura Pricing
- Pay-as-you-go model
- Billed per character generated
- Check current pricing at: https://deepgram.com/pricing

### Recommendations
- Implement character count limits per generation
- Add usage tracking/quotas in settings
- Cache generated audio to avoid regeneration costs
- Consider bulk pricing for high-volume users

---

## Dependencies to Add

```json
{
  "@deepgram/sdk": "^3.x",  // Deepgram Node SDK (optional, can use fetch)
  "fluent-ffmpeg": "^2.x"   // For audio format conversion (optional)
}
```

---

## Settings Integration

The existing Settings page already has placeholders for:
- `deepgramApiKey` - Reuse for TTS
- `deepgramEnabled` - Check before allowing TTS
- `elevenLabsApiKey` - For future ElevenLabs integration
- `elevenLabsEnabled` - For future use

No additional settings UI needed initially; reuse existing Deepgram configuration.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| **Storage Strategy** | Local filesystem - uses existing `/app/uploads/audio/` (persistent in Coolify) |
| **File Retention** | Manual delete only via UI - no auto-delete |
| **Max Text Length** | No limits for testing phase (paragraphs only) |
| **Voice Previews** | Yes - all voices, all languages, pre-recorded samples |
| **Interface Depth** | Full-featured - expose all Deepgram capabilities |

---

## Storage Architecture

### Local Development
```
app/uploads/audio/
├── generated/        # TTS generated files
│   └── {timestamp}-{voice}.mp3
└── previews/         # Voice preview samples
    └── {voice}-sample.mp3
```

### Coolify Production (Persistent Volumes)
```
/app/uploads/audio/   → Mounted to host /data/tourstack/uploads/audio/
├── generated/
└── previews/
```

> **Note:** The `/app/uploads` volume is already configured in Coolify for persistent storage.

---

## Audio Player Architecture

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **CustomAudioPlayer** | `src/components/ui/CustomAudioPlayer.tsx` | Main reusable player (small/medium/large sizes) |
| **TimelineGalleryPreview** | `src/components/blocks/TimelineGalleryPreview.tsx` | Audio player synced with image gallery crossfade |
| **AudioWaveform** | `src/components/blocks/AudioWaveform.tsx` | WaveSurfer.js waveform editor with draggable markers |
| **AudioPreview** | `src/media/AudioPreview.tsx` | Quick preview player with waveform visualization |

### Scrubber/Progress Bar Standards

The audio players follow proven patterns based on production audio player best practices (react-h5-audio-player, Howler.js, Plyr, BBC Peaks.js):

#### 1. Smooth Updates via `requestAnimationFrame` (~60fps)

The `timeupdate` event only fires ~4 times/sec (varies by browser: Chrome ~2.5Hz, Firefox ~3.7Hz, Safari ~4Hz), causing visibly choppy scrubber movement. Instead, we use `requestAnimationFrame` for smooth visual updates:

- **Start** the rAF loop on the audio element's `play` event
- **Stop** the rAF loop on `pause` and `ended` events
- Use `useCallback` for `startRAF`/`stopRAF` so they're stable refs in `useEffect` dependencies

#### 2. Drag/Scrub Architecture (Two-Value Pattern)

To prevent the scrubber from "fighting" between user drag input and playback updates:

- **Two separate state values**: `currentTime` (playback-driven) and `dragTime` (user-driven)
- **Display value**: `isDragging ? dragTime : currentTime`
- **`isDraggingRef`** (a ref, NOT state) — the rAF loop checks this without causing listener re-registration
- **Seek on release only** (`onMouseUp`/`onTouchEnd`), NOT during `onChange` — prevents seeking to every intermediate position during a drag

#### 3. Event-Driven State

Audio element events (`play`, `pause`, `ended`) drive `isPlaying` state — the toggle function only calls `audio.play()`/`audio.pause()`, never sets state directly. This ensures a single source of truth.

#### 4. Ended Event Handling

Browsers fire `pause` BEFORE `ended`. To prevent the pause handler from overwriting the reset:

```typescript
const onPause = () => {
    if (!audio.ended) {  // Guard: skip if this pause is from ended
        setIsPlaying(false);
        stopRAF();
        setCurrentTime(audio.currentTime);
    }
};

const onEnded = () => {
    stopRAF();
    setIsPlaying(false);
    setCurrentTime(0);
    if (audio.readyState >= 1) {
        audio.currentTime = 0;  // Guard: only reset if audio is ready
    }
};
```

#### 5. Range Input Best Practices

- `step="any"` — sub-second precision, prevents snapping to integer values
- `touch-action: none` — prevents page scroll while dragging on mobile
- `appearance: none` + custom thumb/track styling for cross-browser consistency
- Minimum 44x44px touch targets (Apple HIG guideline)

#### 6. Event Listener Registration

- Register in a single `useEffect` with stable dependencies (`src`/`audioUrl`, `startRAF`, `stopRAF`)
- Do NOT put `isDragging` in `useEffect` deps — would cause listener teardown/re-registration on every drag start/end

---

## Next Steps

1. Review this document with stakeholders
2. Prioritize Phase 1 features
3. Create UI mockups/designs
4. Begin Sprint 1 implementation

---

*Document created: January 2026*
*Last updated: February 6, 2026*
*Status: Phase 1-5 Complete ✅ (Deepgram + ElevenLabs + Google Cloud TTS)*
