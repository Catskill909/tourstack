# TourStack: Architectural Ground Plan

**Version**: 2.0  
**Date**: January 18, 2026  
**Purpose**: Comprehensive architectural foundation for modular museum tour platform

---

## Executive Summary

This document establishes the **architectural foundation** for TourStack - a museum tour builder platform based on three core principles:

1. **Modular Content Blocks**: Tours and stops are composed of reusable, type-safe content blocks
2. **JSON-First Architecture**: All data structures designed for clean JSON export/import
3. **Translation-Ready**: Multilingual support baked into every content type from day one

This ground plan aligns our database schema, TypeScript types, UI components, and export formats into a cohesive system that supports everything from simple QR code tours to complex multimedia experiences.

---

## 1. Core Architecture Principles

### 1.1 Modular Block System

**Philosophy**: Every piece of content is a **block** with a defined type, schema, and renderer.

**Benefits**:
- ✅ Flexibility: Simple stops (title + description) OR rich stops (galleries, audio, video)
- ✅ Reusability: Blocks can be copied between stops
- ✅ Extensibility: New block types added without breaking existing content
- ✅ Type Safety: TypeScript ensures correct data structures
- ✅ JSON Export: Clean, predictable JSON schema

**Block Hierarchy**:
```
Tour
├── Tour Metadata (title, description, heroImage)
├── Tour Settings (languages, duration, positioning)
└── Stops[]
    ├── Stop Metadata (title, description, heroImage, order)
    ├── Stop Positioning (QR, GPS, BLE, etc.)
    └── Content Blocks[]
        ├── Text Block
        ├── Image Block
        ├── Gallery Block
        ├── Audio Block
        ├── Video Block
        ├── Collection Block
        ├── Quote Block
        ├── Timeline Block
        └── Comparison Block
```

### 1.2 JSON-First Design

**Philosophy**: All data structures must serialize to clean, portable JSON.

**Requirements**:
- No circular references
- No functions or class instances
- All dates as ISO 8601 strings
- All media as URLs or base64 data URLs
- Multilingual content as `{ [lang]: value }` objects

**Export Use Cases**:
1. **Backup**: Export entire tour database
2. **Migration**: Move tours between museums
3. **Version Control**: Git-track tour changes
4. **Mobile App**: Send JSON to visitor apps
5. **API**: RESTful tour delivery

### 1.3 Translation-First

**Philosophy**: Multilingual support is not an afterthought - it's core to every content type.

**Implementation**:
- All text fields are objects: `{ en: "Hello", es: "Hola", fr: "Bonjour" }`
- Media has per-language captions/alt-text
- Audio/video have per-language tracks
- UI provides language selector
- AI translation via "Magic Translate" button

---

## 2. Content Block System

### 2.1 Block Type Definitions

```typescript
// Base block interface
interface ContentBlock {
  id: string;                    // Unique block ID
  type: ContentBlockType;        // Block type discriminator
  order: number;                 // Display order in stop
  data: ContentBlockData;        // Type-specific data
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}

// All supported block types
type ContentBlockType = 
  | 'text'           // Rich text paragraph
  | 'image'          // Single image with caption
  | 'gallery'        // Image gallery/carousel
  | 'audio'          // Audio player
  | 'video'          // Video embed
  | 'collection'     // Link to Collection
  | 'quote'          // Highlighted quote
  | 'timeline'       // Historical timeline
  | 'comparison'     // Before/after, side-by-side
  | 'positioning';   // QR code, GPS, BLE config (special)

// Discriminated union for type safety
type ContentBlockData = 
  | TextBlockData
  | ImageBlockData
  | GalleryBlockData
  | AudioBlockData
  | VideoBlockData
  | CollectionBlockData
  | QuoteBlockData
  | TimelineBlockData
  | ComparisonBlockData
  | PositioningBlockData;
```

### 2.2 Block Data Schemas

#### Text Block
```typescript
interface TextBlockData {
  content: { [lang: string]: string };  // Multilingual rich text (HTML)
  style: 'normal' | 'callout' | 'sidebar';
}

// JSON Example
{
  "id": "block_001",
  "type": "text",
  "order": 1,
  "data": {
    "content": {
      "en": "<p>This ancient amphora...</p>",
      "es": "<p>Esta ánfora antigua...</p>"
    },
    "style": "normal"
  }
}
```

#### Image Block
```typescript
interface ImageBlockData {
  url: string;                          // Image URL or data URL
  alt: { [lang: string]: string };      // Multilingual alt text
  caption?: { [lang: string]: string }; // Optional caption
  size: 'small' | 'medium' | 'large' | 'full';
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
}
```

#### Gallery Block
```typescript
interface GalleryBlockData {
  images: Array<{
    url: string;
    alt: { [lang: string]: string };
    caption?: { [lang: string]: string };
  }>;
  layout: 'carousel' | 'grid' | 'masonry';
  itemsPerRow?: number;  // For grid layout
}
```

#### Audio Block
```typescript
interface AudioBlockData {
  audioFiles: { [lang: string]: string };  // Per-language audio URLs
  title: { [lang: string]: string };
  duration: number;  // Seconds
  transcript?: { [lang: string]: string };
  autoplay: boolean;
  showTranscript: boolean;
}

// JSON Example
{
  "id": "block_audio_001",
  "type": "audio",
  "order": 3,
  "data": {
    "audioFiles": {
      "en": "/media/audio/rosetta_en.mp3",
      "es": "/media/audio/rosetta_es.mp3"
    },
    "title": {
      "en": "The Rosetta Stone Narration",
      "es": "Narración de la Piedra Rosetta"
    },
    "duration": 225,
    "transcript": {
      "en": "Discovered in 1799...",
      "es": "Descubierta en 1799..."
    },
    "autoplay": false,
    "showTranscript": true
  }
}
```

#### Video Block
```typescript
interface VideoBlockData {
  videoUrl: string;  // YouTube, Vimeo, or direct URL
  provider: 'youtube' | 'vimeo' | 'direct';
  title: { [lang: string]: string };
  description?: { [lang: string]: string };
  subtitles?: { [lang: string]: string };  // VTT/SRT URLs
  thumbnail?: string;
  autoplay: boolean;
  controls: boolean;
}
```

#### Collection Block
```typescript
interface CollectionBlockData {
  collectionId: string;  // Reference to Collection model
  displayMode: 'preview' | 'full' | 'link';
  itemCount?: number;  // How many items to show in preview
  layout?: 'grid' | 'carousel' | 'list';
}
```

#### Quote Block
```typescript
interface QuoteBlockData {
  quote: { [lang: string]: string };
  author?: { [lang: string]: string };
  source?: { [lang: string]: string };
  style: 'default' | 'highlighted' | 'sidebar';
}
```

#### Timeline Block
```typescript
interface TimelineBlockData {
  events: Array<{
    date: string;  // ISO 8601 or year
    title: { [lang: string]: string };
    description?: { [lang: string]: string };
    image?: string;
  }>;
  orientation: 'vertical' | 'horizontal';
}
```

#### Comparison Block
```typescript
interface ComparisonBlockData {
  leftImage: {
    url: string;
    label: { [lang: string]: string };
    caption?: { [lang: string]: string };
  };
  rightImage: {
    url: string;
    label: { [lang: string]: string };
    caption?: { [lang: string]: string };
  };
  mode: 'side-by-side' | 'slider';
}
```

#### Positioning Block (Special)
```typescript
interface PositioningBlockData {
  method: PositioningMethod;
  config: PositioningConfig;  // QRCodeConfig | GPSConfig | BLEConfig, etc.
  qrCodeDataUrl?: string;  // Generated QR code image
  instructions?: { [lang: string]: string };
}
```

### 2.3 Block Storage Strategy

**Database**: Store blocks as JSON in `Stop.content` field (already exists in schema)

**Current Schema**:
```prisma
model Stop {
  content String  // JSON: LocalizedContent
}
```

**Updated Schema** (backward compatible):
```prisma
model Stop {
  content String  // JSON: ContentBlock[]
}
```

**Migration Path**:
1. Existing stops have `content` as `LocalizedContent`
2. New stops have `content` as `ContentBlock[]`
3. Renderer checks type and handles both formats
4. Gradual migration via UI "Upgrade to Blocks" button

---

## 3. JSON Export Schema

### 3.1 Complete Tour Export

```json
{
  "version": "2.0",
  "exportedAt": "2026-01-18T05:08:00Z",
  "museum": {
    "id": "museum_001",
    "name": "Metropolitan Museum of Art",
    "location": "New York, NY"
  },
  "tour": {
    "id": "tour_001",
    "templateId": "tpl_qr_code",
    "status": "published",
    "title": {
      "en": "Ancient Egypt Gallery",
      "es": "Galería del Antiguo Egipto",
      "fr": "Galerie de l'Égypte Ancienne"
    },
    "heroImage": "data:image/jpeg;base64,/9j/4AAQ...",
    "description": {
      "en": "Explore 3000 years of Egyptian history...",
      "es": "Explora 3000 años de historia egipcia...",
      "fr": "Explorez 3000 ans d'histoire égyptienne..."
    },
    "languages": ["en", "es", "fr"],
    "primaryLanguage": "en",
    "duration": 45,
    "difficulty": "family",
    "primaryPositioningMethod": "qr_code",
    "backupPositioningMethod": null,
    "accessibility": {
      "wheelchairAccessible": true,
      "audioDescriptions": true,
      "signLanguage": false,
      "tactileElements": true,
      "quietSpaceFriendly": false
    },
    "stops": [
      {
        "id": "stop_001",
        "order": 1,
        "type": "mandatory",
        "title": {
          "en": "The Rosetta Stone",
          "es": "La Piedra Rosetta",
          "fr": "La Pierre de Rosette"
        },
        "heroImage": "/media/stops/rosetta_hero.jpg",
        "description": {
          "en": "Discovered in 1799, this granodiorite stele...",
          "es": "Descubierta en 1799, esta estela de granodiorita...",
          "fr": "Découverte en 1799, cette stèle en granodiorite..."
        },
        "contentBlocks": [
          {
            "id": "block_001",
            "type": "text",
            "order": 1,
            "data": {
              "content": {
                "en": "<p>The Rosetta Stone is one of the most important...</p>",
                "es": "<p>La Piedra Rosetta es uno de los más importantes...</p>"
              },
              "style": "normal"
            }
          },
          {
            "id": "block_002",
            "type": "gallery",
            "order": 2,
            "data": {
              "images": [
                {
                  "url": "/media/rosetta_detail_01.jpg",
                  "alt": {
                    "en": "Close-up of hieroglyphics",
                    "es": "Primer plano de jeroglíficos"
                  },
                  "caption": {
                    "en": "Hieroglyphic script detail",
                    "es": "Detalle de escritura jeroglífica"
                  }
                },
                {
                  "url": "/media/rosetta_detail_02.jpg",
                  "alt": {
                    "en": "Demotic script section",
                    "es": "Sección de escritura demótica"
                  }
                }
              ],
              "layout": "carousel"
            }
          },
          {
            "id": "block_003",
            "type": "audio",
            "order": 3,
            "data": {
              "audioFiles": {
                "en": "/media/audio/rosetta_en.mp3",
                "es": "/media/audio/rosetta_es.mp3"
              },
              "title": {
                "en": "Audio Guide",
                "es": "Guía de Audio"
              },
              "duration": 225,
              "autoplay": false,
              "showTranscript": true
            }
          },
          {
            "id": "block_004",
            "type": "positioning",
            "order": 4,
            "data": {
              "method": "qr_code",
              "config": {
                "method": "qr_code",
                "url": "https://tourstack.app/t/tour_001/stop_001",
                "shortCode": "RS001"
              },
              "qrCodeDataUrl": "data:image/png;base64,iVBORw0KG...",
              "instructions": {
                "en": "Scan this QR code to trigger the stop",
                "es": "Escanea este código QR para activar la parada"
              }
            }
          }
        ],
        "customFieldValues": {},
        "interactive": {
          "quiz": {
            "question": {
              "en": "In how many languages is the Rosetta Stone inscribed?",
              "es": "¿En cuántos idiomas está inscrita la Piedra Rosetta?"
            },
            "options": {
              "en": ["Two", "Three", "Four", "Five"],
              "es": ["Dos", "Tres", "Cuatro", "Cinco"]
            },
            "correctIndex": 1,
            "explanation": {
              "en": "The stone contains three scripts: hieroglyphic, demotic, and ancient Greek.",
              "es": "La piedra contiene tres escrituras: jeroglífica, demótica y griego antiguo."
            }
          }
        },
        "links": [
          {
            "label": "British Museum Collection",
            "url": "https://britishmuseum.org/collection/rosetta-stone",
            "type": "website",
            "openInApp": false
          }
        ],
        "accessibility": {
          "audioDescription": "A large dark stone with three bands of ancient text",
          "tactileDescription": "Replica available at information desk",
          "largePrintAvailable": true,
          "seatingNearby": true
        }
      }
    ],
    "createdAt": "2026-01-10T10:00:00Z",
    "updatedAt": "2026-01-18T05:00:00Z",
    "publishedAt": "2026-01-15T14:00:00Z",
    "version": 2
  }
}
```

### 3.2 Export Formats

**Full Export** (`tour_export_full.json`):
- Complete tour with all stops and content blocks
- Includes base64-encoded images
- Self-contained, portable

**Lightweight Export** (`tour_export_light.json`):
- Media as URLs (not base64)
- Smaller file size
- Requires media files separately

**Mobile App Format** (`tour_mobile.json`):
- Optimized for visitor apps
- Removes editor-only fields
- Includes analytics endpoints

---

## 4. Translation Infrastructure

### 4.1 Translation Strategy

**Three-Tier Approach**:

1. **UI Translation** (i18next)
   - App interface labels, buttons, menus
   - Static content
   - Language switcher

2. **Content Translation** (AI + Human)
   - Tour/stop titles, descriptions
   - Content blocks
   - "Magic Translate" button

3. **Media Translation** (TTS + Subtitles)
   - Audio narration generation
   - Video subtitles
   - Image captions

### 4.2 i18next Integration

**Setup**:
```typescript
// i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: require('./locales/en.json') },
      es: { translation: require('./locales/es.json') },
      fr: { translation: require('./locales/fr.json') },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  });
```

**Usage**:
```typescript
import { useTranslation } from 'react-i18next';

function Header() {
  const { t, i18n } = useTranslation();
  
  return (
    <h1>{t('tours.title')}</h1>
    <button onClick={() => i18n.changeLanguage('es')}>
      Español
    </button>
  );
}
```

### 4.3 AI Translation Service

**"Magic Translate" Implementation**:

```typescript
// translationService.ts
interface TranslationRequest {
  text: string;
  sourceLang: string;
  targetLangs: string[];
}

interface TranslationResponse {
  translations: {
    [lang: string]: string;
  };
}

async function magicTranslate(
  request: TranslationRequest
): Promise<TranslationResponse> {
  // Option 1: LibreTranslate (Free, self-hosted)
  const response = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: request.text,
      source: request.sourceLang,
      target: request.targetLangs[0],
      format: 'text'
    })
  });
  
  // Option 2: OpenAI (Paid, high quality)
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [{
  //     role: 'system',
  //     content: 'You are a professional translator for museum content.'
  //   }, {
  //     role: 'user',
  //     content: `Translate to ${targetLang}: ${text}`
  //   }]
  // });
  
  return response.json();
}
```

**UI Integration**:
```typescript
function StopEditor({ stop }: { stop: Stop }) {
  const [title, setTitle] = useState(stop.title);
  const [isTranslating, setIsTranslating] = useState(false);
  
  const handleMagicTranslate = async () => {
    setIsTranslating(true);
    const result = await magicTranslate({
      text: title.en,
      sourceLang: 'en',
      targetLangs: ['es', 'fr', 'de']
    });
    
    setTitle({
      ...title,
      ...result.translations
    });
    setIsTranslating(false);
  };
  
  return (
    <div>
      <input value={title.en} onChange={e => setTitle({...title, en: e.target.value})} />
      <button onClick={handleMagicTranslate} disabled={isTranslating}>
        ✨ Magic Translate
      </button>
    </div>
  );
}
```

### 4.4 TTS Integration

**Audio Generation Service**:

```typescript
// ttsService.ts
interface TTSRequest {
  text: string;
  language: string;
  voice?: string;
  speed?: number;
}

async function generateAudio(request: TTSRequest): Promise<string> {
  // Google Cloud TTS
  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GOOGLE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { text: request.text },
      voice: {
        languageCode: request.language,
        name: request.voice || `${request.language}-Standard-A`
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: request.speed || 1.0
      }
    })
  });
  
  const data = await response.json();
  return `data:audio/mp3;base64,${data.audioContent}`;
}
```

**Batch Audio Generation**:
```typescript
async function generateTourAudio(tour: Tour) {
  const audioFiles: { [stopId: string]: { [lang: string]: string } } = {};
  
  for (const stop of tour.stops) {
    audioFiles[stop.id] = {};
    
    for (const lang of tour.languages) {
      const description = stop.description[lang];
      const audioDataUrl = await generateAudio({
        text: description,
        language: lang
      });
      
      audioFiles[stop.id][lang] = audioDataUrl;
    }
  }
  
  return audioFiles;
}
```

---

## 5. Positioning Technology Integration

### 5.1 Positioning as Content Blocks

**Key Insight**: Positioning configuration is just another content block type!

**Benefits**:
- Consistent with modular architecture
- Easy to add/edit/remove positioning
- Supports multiple positioning methods per stop
- Clean JSON export

**Example**:
```json
{
  "id": "block_positioning_001",
  "type": "positioning",
  "order": 1,
  "data": {
    "method": "qr_code",
    "config": {
      "url": "https://tourstack.app/t/tour_001/stop_001",
      "shortCode": "RS001"
    },
    "qrCodeDataUrl": "data:image/png;base64,..."
  }
}
```

### 5.2 Multi-Method Support

**Hybrid Positioning**:
```json
{
  "contentBlocks": [
    {
      "id": "pos_primary",
      "type": "positioning",
      "order": 1,
      "data": {
        "method": "ble_beacon",
        "config": {
          "uuid": "FDA50693-A4E2-4FB1-AFCF-C6EB07647825",
          "major": 100,
          "minor": 1,
          "radius": 5
        },
        "priority": "primary"
      }
    },
    {
      "id": "pos_backup",
      "type": "positioning",
      "order": 2,
      "data": {
        "method": "qr_code",
        "config": {
          "url": "https://tourstack.app/t/tour_001/stop_001",
          "shortCode": "RS001"
        },
        "qrCodeDataUrl": "data:image/png;base64,...",
        "priority": "backup"
      }
    }
  ]
}
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (COMPLETE ✅)
- [x] Database schema with Prisma
- [x] TypeScript types
- [x] Tours CRUD
- [x] Templates system

### Phase 2: Content Blocks (NEXT)
- [ ] Define ContentBlock types
- [ ] Update Stop schema to use blocks
- [ ] Create StopContentBlock renderer
- [ ] Build block editors (Text, Image, Gallery)
- [ ] Implement drag-and-drop reordering

### Phase 3: Translation
- [ ] i18next setup
- [ ] UI translation (en, es, fr)
- [ ] "Magic Translate" button
- [ ] Translation service integration
- [ ] TTS integration

### Phase 4: Advanced Blocks
- [ ] Audio block with TTS
- [ ] Video block with subtitles
- [ ] Collection block
- [ ] Quote, Timeline, Comparison blocks

### Phase 5: JSON Export
- [ ] Export service
- [ ] Import service
- [ ] Mobile app format
- [ ] Backup/restore

---

## 7. Documentation Updates Needed

### 7.1 Update tourstack.md
- Add content block system section
- Add JSON export schema
- Add translation infrastructure
- Update data structure examples

### 7.2 Update HANDOFF.md
- Reflect new architecture
- Update next steps
- Add translation roadmap

### 7.3 Update README.md
- Add content blocks overview
- Add translation features
- Update tech stack

### 7.4 Create New Docs
- `ARCHITECTURE.md` - This document
- `CONTENT_BLOCKS.md` - Block type reference
- `TRANSLATION.md` - Translation guide
- `JSON_SCHEMA.md` - Export format spec

---

## 8. Key Decisions & Rationale

### Why Content Blocks?
- **Flexibility**: Support simple and complex stops
- **Extensibility**: Add new block types without breaking changes
- **Type Safety**: TypeScript discriminated unions
- **Clean JSON**: Predictable export format

### Why JSON-First?
- **Portability**: Easy backup, migration, version control
- **Mobile Apps**: Direct consumption by visitor apps
- **API-Ready**: RESTful tour delivery
- **Future-Proof**: Works with any frontend

### Why Translation-First?
- **Global Reach**: Museums serve international visitors
- **AI Efficiency**: Affordable translation via AI
- **Curator Control**: Manual override of AI translations
- **Audio Generation**: TTS for all languages

### Why Modular Positioning?
- **Technology Agnostic**: Support any positioning method
- **Hybrid Support**: Multiple methods per stop
- **Easy Testing**: Swap methods without rebuilding
- **Future-Proof**: Add new technologies easily

---

## 9. Success Metrics

**Technical**:
- ✅ All content types support multilingual
- ✅ JSON export/import works flawlessly
- ✅ Content blocks are type-safe
- ✅ Zero breaking changes to existing tours

**User Experience**:
- ✅ Curators can build simple stops in < 2 minutes
- ✅ Curators can build rich stops in < 10 minutes
- ✅ "Magic Translate" works in < 5 seconds
- ✅ Audio generation works in < 30 seconds

**Business**:
- ✅ Support 20+ languages
- ✅ Translation cost < $100 per tour
- ✅ Audio generation cost < $10 per tour
- ✅ Export/import enables museum collaboration

---

## 10. Next Steps

1. **Review & Approve** this ground plan
2. **Update Documentation** (tourstack.md, HANDOFF.md, README.md)
3. **Define TypeScript Types** for all content blocks
4. **Update Database Schema** (backward compatible)
5. **Build Content Block Renderer**
6. **Implement Stop Editor** with blocks
7. **Add Translation Infrastructure**
8. **Test with Real Museum Content**

---

**This ground plan establishes a solid architectural foundation for TourStack that will scale from simple QR code tours to complex, multilingual, multimedia experiences.**
