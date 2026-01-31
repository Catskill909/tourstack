# Collections Development Guide

## Overview

TourStack Collections provide curated groupings of media assets for museum experiences. Collections enable museums to organize images, audio, video, and documents into reusable content packages that can be deployed across tours, exhibits, and kiosk displays.

## Collection Types

### Image Collections (Gallery)

**Status:** Fully Implemented

Image collections support drag-and-drop upload with AI-powered analysis capabilities.

#### Features

- **Drag & Drop Upload** - Multi-image upload via dropzone interface
- **AI Object Analysis** - Powered by Google Gemini 2.0 Flash Vision API
- **Automatic Tagging** - AI-generated tags for searchability
- **Color Extraction** - Dominant color palette detection
- **Object Detection** - Identification of subjects and objects in images
- **OCR Text Extraction** - Automatic text recognition from images
- **Visual DNA** - Mood, lighting, style, and context analysis
- **Description Generation** - AI-generated catalog descriptions

#### AI Analysis Fields

| Field | Type | Description | Museum Use Case |
|-------|------|-------------|-----------------|
| `suggestedTitle` | string | AI-generated title | Auto-populate alt text, catalog entries |
| `description` | string | 2-3 sentence description | Caption generation, accessibility |
| `tags` | string[] | 5-10 relevant tags | Search, filtering, categorization |
| `objects` | string[] | Detected objects | Object-based search, inventory |
| `colors` | {name, hex}[] | Dominant colors | Color-based filtering, exhibition design |
| `mood` | string | Emotional tone (e.g., "Serene") | Thematic grouping, experience design |
| `lighting` | string | Lighting description | Photography analysis, conservation |
| `artStyle` | string | Artistic style | Art history categorization |
| `estimatedLocation` | string | Context/setting | Location tagging, provenance |
| `text` | string | OCR extracted text | Searchable inscriptions, labels |

#### Component Files

- [CollectionTypeModal.tsx](../app/src/components/collections/CollectionTypeModal.tsx) - Type selection modal
- [ImageCollectionWizard.tsx](../app/src/components/collections/ImageCollectionWizard.tsx) - 4-step creation wizard
- [CollectionImageCard.tsx](../app/src/components/collections/CollectionImageCard.tsx) - Image display card
- [CollectionItemAnalysisModal.tsx](../app/src/components/collections/CollectionItemAnalysisModal.tsx) - AI analysis viewer
- [AddItemWizard.tsx](../app/src/components/collections/AddItemWizard.tsx) - Add items to existing collections

#### Workflow

1. User clicks "New Collection" → CollectionTypeModal appears
2. User selects "Images" → ImageCollectionWizard opens
3. **Step 1: Details** - Enter name and description
4. **Step 2: Upload** - Drag/drop multiple images via react-dropzone
5. **Step 3: AI Analysis** - Click "Analyze All" for batch Gemini analysis
6. **Step 4: Review** - Preview all images with AI metadata, then create

#### Adding Items to Existing Collections

The AddItemWizard provides the same guided experience when adding items to existing collections:

1. Open collection detail page
2. Click "Add Items" button
3. **Step 1: Upload** - Drag/drop images
4. **Step 2: AI Analysis** - Batch analysis with progress
5. **Step 3: Review & Add** - Preview and confirm

---

### Audio Collections

**Status:** Fully Implemented (via Audio TTS page)

Audio collections are created through the dedicated Audio TTS interface, supporting multi-language text-to-speech generation.

#### Features

- **Multi-Language TTS** - Generate audio in 30+ languages
- **Provider Support** - Deepgram and ElevenLabs integration
- **Voice Selection** - Language-specific voice options
- **Automatic Translation** - LibreTranslate integration
- **Batch Generation** - Create all languages at once
- **Quality Controls** - Format, sample rate configuration

#### Workflow

1. User selects "Audio" in Collection Type Modal
2. Redirected to `/audio` (Audio TTS page)
3. Enter source text, select languages and voices
4. Generate collection with translations
5. Audio collection appears in Collections list

#### Component Files

- [AudioCollectionModal.tsx](../app/src/components/AudioCollectionModal.tsx) - Multi-language TTS generation
- [CollectionPickerModal.tsx](../app/src/components/CollectionPickerModal.tsx) - Import audio into tours

---

### Video Collections

**Status:** Placeholder (Coming Soon)

Video collections will support intelligent video management with AI-powered analysis.

#### Planned Features

- [ ] Video upload with format conversion
- [ ] Thumbnail generation and selection
- [ ] AI scene detection and chapter markers
- [ ] Transcript generation via Whisper API
- [ ] Auto-captioning (SRT/VTT export)
- [ ] Object tracking across frames
- [ ] Face detection (opt-in for portrait recognition)
- [ ] Audio description generation for accessibility
- [ ] Highlight reel generation
- [ ] Multi-angle synchronization

#### Proposed AI Integration

- **Google Video Intelligence API** - Scene detection, object tracking
- **OpenAI Whisper** - Transcription
- **Claude/GPT** - Summary generation, accessibility descriptions

---

### Document Collections

**Status:** Placeholder (Coming Soon)

Document collections will manage PDFs, research papers, and archival materials.

#### Planned Features

- [ ] PDF upload and rendering
- [ ] Multi-page document support
- [ ] OCR for scanned documents (Tesseract.js / Google Vision)
- [ ] AI summarization (per page and full document)
- [ ] Citation extraction and formatting
- [ ] Full-text search indexing
- [ ] Annotation and highlighting
- [ ] Related document suggestions
- [ ] Export to accessible formats

#### Proposed AI Integration

- **pdf.js** - Client-side PDF rendering
- **Tesseract.js** - Browser-based OCR
- **Google Document AI** - Advanced document parsing
- **Claude/GPT** - Summarization, citation generation

---

## AI Tool Roadmap

### Currently Implemented

| Tool | Provider | Media Type | Description |
|------|----------|------------|-------------|
| Image Analysis | Gemini 2.0 Flash | Images | Tags, colors, objects, OCR, mood, style |
| Text-to-Speech | Deepgram | Audio | High-quality TTS in 30+ languages |
| Text-to-Speech | ElevenLabs | Audio | Premium voice synthesis |
| Translation | LibreTranslate | Text/Audio | Multi-language translation |

### Planned Implementations

| Tool | Provider | Media Type | Description | Priority |
|------|----------|------------|-------------|----------|
| Transcription | OpenAI Whisper | Video/Audio | Speech-to-text | High |
| Scene Detection | Google Video AI | Video | Scene boundaries, chapters | High |
| Document OCR | Tesseract.js | Documents | Scanned document text extraction | High |
| PDF Parsing | pdf.js | Documents | Page extraction, rendering | High |
| Summarization | Claude/GPT | Documents | AI summaries | Medium |
| Object Tracking | Google Video AI | Video | Track objects across frames | Medium |
| Face Detection | MediaPipe | Images/Video | Portrait recognition (opt-in) | Low |
| Audio Restoration | Adobe Podcast | Audio | Noise removal, enhancement | Low |
| Voice Cloning | ElevenLabs | Audio | Historical figure voices (ethical use) | Low |

---

## Museum-Focused Features

### Artwork Authentication Assistant

**Status:** Planned

AI-powered tool to assist with artwork analysis and authentication.

- Style analysis comparing to known works
- Period/era dating based on techniques
- Comparative database search
- Provenance chain documentation
- Red flag detection for potential issues

### Multilingual Accessibility Suite

**Status:** Partially Implemented

Comprehensive accessibility tools for global museum audiences.

- 32+ language support via TTS
- Sign language video integration (planned)
- Audio description generation for visual content (planned)
- Braille-ready text export (planned)
- Reading level adjustment (planned)
- High-contrast mode support

### Conservation Documentation

**Status:** Planned

Tools for documenting artifact condition and conservation work.

- Before/after comparison views
- Condition reporting templates
- Environmental monitoring integration
- Damage mapping and annotation
- Treatment history tracking
- Material analysis integration

### Research Integration

**Status:** Planned

Connect collections with academic and research resources.

- Academic database linking (JSTOR, Google Scholar)
- Citation generation (Chicago, MLA, APA)
- Scholarly annotation support
- Research note attachments
- Expert collaboration tools
- Publication export

### Visitor Engagement Analytics

**Status:** Planned

Track how visitors interact with collection content.

- Collection popularity tracking
- Engagement time analysis
- A/B testing for descriptions
- Language preference statistics
- Device and context tracking
- Feedback collection

---

## Database Schema

Collections are stored in the Prisma database:

```prisma
model Collection {
  id          String   @id @default(cuid())
  museumId    String?
  museum      Museum?  @relation(fields: [museumId], references: [id])

  name        String
  description String?
  type        String   @default("gallery") // gallery, dataset, audio_collection, video_collection, document_collection
  items       String   // JSON: CollectionItem[]

  // Audio collection specific
  sourceLanguage String?
  texts          String?  // JSON: { [lang: string]: string }
  ttsSettings    String?  // JSON: TTSSettings

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List all collections |
| GET | `/api/collections/:id` | Get single collection |
| POST | `/api/collections` | Create collection |
| PUT | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Delete collection |
| POST | `/api/collections/:id/items` | Add item |
| DELETE | `/api/collections/:id/items/:itemId` | Remove item |
| POST | `/api/gemini/analyze` | Analyze image with AI |

---

## Component Architecture

```
src/components/collections/
├── index.ts                        # Exports
├── CollectionTypeModal.tsx         # Type selection (Images, Audio, Video, Documents)
├── ImageCollectionWizard.tsx       # 4-step image collection creator
├── CollectionImageCard.tsx         # Image card with AI metadata display
├── CollectionItemAnalysisModal.tsx # Full AI analysis viewer
└── AddItemWizard.tsx               # 3-step wizard for adding to existing collections

src/components/ui/
└── ConfirmationModal.tsx           # Reusable confirmation/alert modal

src/pages/
├── Collections.tsx                 # Collection list and management
└── CollectionDetail.tsx            # Collection detail with item management
```

---

## UI Components

### ConfirmationModal

A reusable modal component for confirmations and alerts, replacing browser native dialogs.

**Location:** `src/components/ui/ConfirmationModal.tsx`

**Variants:**
| Variant | Icon | Color | Use Case |
|---------|------|-------|----------|
| `confirm` | Info | Blue | General confirmations |
| `success` | CheckCircle | Green | Success messages |
| `warning` | AlertTriangle | Amber | Warning alerts |
| `danger` | Trash2 | Red | Destructive actions |
| `info` | Info | Accent | Informational modals |

**Props:**
```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;    // Default: "Confirm"
  cancelText?: string;     // Default: "Cancel"
  variant?: ModalVariant;  // Default: "confirm"
  showCancel?: boolean;    // Default: true
  isLoading?: boolean;     // Default: false
}
```

**Features:**
- Smooth framer-motion animations
- Backdrop blur effect
- Loading state with spinner
- Keyboard accessible
- Click outside to close

---

## Usage Examples

### Creating an Image Collection

```typescript
import { collectionService } from '../lib/collectionService';

const collection = await collectionService.create({
  name: 'Ancient Pottery',
  description: 'Bronze Age ceramic artifacts',
  type: 'gallery',
  items: [
    {
      id: 'item-1',
      type: 'image',
      url: '/uploads/images/pottery-1.jpg',
      order: 0,
      alt: { en: 'Terracotta amphora' },
      caption: { en: 'Greek amphora, 5th century BCE' },
      aiMetadata: {
        suggestedTitle: 'Ancient Greek Amphora',
        description: 'A well-preserved terracotta amphora...',
        tags: ['pottery', 'greek', 'amphora', 'ancient'],
        objects: ['amphora', 'ceramic', 'handles'],
        colors: [
          { name: 'Terracotta', hex: '#E2725B' },
          { name: 'Cream', hex: '#FFFDD0' }
        ],
        mood: 'Historical',
        artStyle: 'Classical Greek'
      }
    }
  ]
});
```

### Analyzing an Image

```typescript
const response = await fetch('/api/gemini/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image: base64ImageData })
});

const analysis = await response.json();
// Returns AIAnalysisResult
```

---

## Environment Variables

Required for full functionality:

```env
GEMINI_API_KEY=your-gemini-api-key        # Image analysis
DEEPGRAM_API_KEY=your-deepgram-key        # TTS
ELEVENLABS_API_KEY=your-elevenlabs-key    # Premium TTS
LIBRETRANSLATE_URL=http://localhost:5000  # Translation (or hosted)
```

---

## Next Development: Collection Translations

**Status:** Planned (Next Session)

Image collections need multilingual support for captions and alt text.

### Planned Features

- **Magic Translate Button** - One-click AI translation for all text fields
- **Per-Image Language Switching** - View/edit captions in any supported language
- **Batch Translation** - Translate entire collection at once
- **Translation Status Indicators** - Visual badges showing translated vs. pending
- **Language Picker in Detail View** - Switch languages while viewing collection

### Implementation Approach

1. Extend `ImageCollectionItem` with multilingual caption/alt:
   ```typescript
   interface ImageCollectionItem {
     caption: { [lang: string]: string };  // Already multilingual
     alt: { [lang: string]: string };      // Already multilingual
     // Add translation status tracking
     translationStatus?: {
       [lang: string]: 'pending' | 'translated' | 'reviewed';
     };
   }
   ```

2. Reuse existing translation infrastructure:
   - `MagicTranslateButton` component
   - `translationService.ts` for LibreTranslate API
   - `LanguageSwitcher` component for selection

3. Add translation UI to:
   - `CollectionItemAnalysisModal` - Per-image translation
   - `CollectionDetail` - Batch translation for all items
   - `ImageCollectionWizard` Step 4 - Optional translation before creation

### Reference Components

- [MagicTranslateButton.tsx](../app/src/components/MagicTranslateButton.tsx) - Existing translate button
- [translationService.ts](../app/src/services/translationService.ts) - Translation API service
- [LanguageSwitcher.tsx](../app/src/components/LanguageSwitcher.tsx) - Language selection dropdown

---

## Future Considerations

1. **Batch Processing** - Queue system for large collection uploads
2. **CDN Integration** - Cloudflare/AWS for global delivery
3. **Offline Support** - PWA with IndexedDB caching
4. **Version Control** - Track collection changes over time
5. **Access Control** - Granular permissions per collection
6. **Export Formats** - IIIF, Dublin Core, museum standards
