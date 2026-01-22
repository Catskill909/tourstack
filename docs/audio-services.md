# TourStack Audio Services - Implementation Document

## Overview

The **Audio** section in TourStack's side navigation provides a centralized hub for creating and managing text-to-speech (TTS) audio files for tours. **Phase 1 is now complete** with full Deepgram Aura-2 integration.

### ✅ Implementation Status (January 22, 2026)

| Feature | Status |
|---------|--------|
| Deepgram Aura-2 TTS | ✅ Complete |
| 7 Languages Support | ✅ Complete |
| 40+ Voice Models | ✅ Complete |
| Auto-Translate (LibreTranslate) | ✅ Complete |
| Voice Preview | ✅ Complete |
| Multiple Output Formats | ✅ Complete |
| Success Modal | ✅ Complete |
| File Metadata Display | ✅ Complete |
| Whisper Integration | 🔜 Coming Soon |
| ElevenLabs Integration | 🔜 Coming Soon |

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

The Audio page will have 3 provider tabs:

| Tab | Status | Provider |
|-----|--------|----------|
| **Deepgram** | ✅ Active | Current TTS provider |
| **Whisper** | 🔜 Coming Soon | Testing soon |
| **ElevenLabs** | 🔜 Coming Soon | Future integration |

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

### Phase 4: ElevenLabs Integration (Future)
- [ ] Voice cloning capabilities
- [ ] More natural prosody
- [ ] Emotion/tone control
- [ ] Custom voice creation

### Phase 5: Whisper Integration (Future)
- [ ] STT for transcription verification
- [ ] Audio-to-text for existing tour audio
- [ ] Subtitle/caption generation

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

## Next Steps

1. Review this document with stakeholders
2. Prioritize Phase 1 features
3. Create UI mockups/designs
4. Begin Sprint 1 implementation

---

*Document created: January 2026*
*Last updated: January 22, 2026*
*Status: Phase 1 Complete ✅*
