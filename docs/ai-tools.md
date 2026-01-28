# AI Assistance & Smart Image Tools (Phase 19)

**Status**: Phase 19 COMPLETE ✅ (Jan 27, 2026)

## Overview
TourStack now includes a suite of AI-powered tools designed to assist museum staff in cataloging and describing artifacts. These tools leverage Google Cloud Vision API and (soon) Generative AI to automate metadata extraction.

## Features

### 1. AI Object Analysis
A forensic-grade tool for extracting deep metadata from artifact images, labels, or plaques.

- **Status**: Production Ready ✅
- **Route**: `/ai-assistance` -> AI Object Analysis
- **Capabilities**:
    - **Visual DNA**: Deep analysis of image mood (e.g., "Playful"), lighting ("Flat"), art style ("Cartoon"), and context ("Comic Book Archive").
    - **Object Detection**: Identifying specific items and features (e.g., "Face", "Hair").
    - **Dominant Colors**: Extracting color palettes with common names and HEX codes.
    - **OCR Text Extraction**: High-precision text recognition for transcribing museum labels and plaques.
    - **Smart Titles**: Web-aware "Best Guess" identification for artwork and artifacts.
    - **Manual Tagging**: Interactive AI tag generation with full manual editing (Add/Remove).

### 2. AI Dashboard
A central hub for all AI assistance tools.
- **Route**: `/ai-assistance`
- **Design**: Modern, dark-mode card interface.
- **Status Indicators**: Beta, Coming Soon, Alpha.

## Technical Implementation

### Frontend (`/app/src/components/tools/SmartTagGenerator.tsx`)
- **React Dropzone**: For drag-and-drop image upload.
- **Framer Motion**: For animated "Add Tag" popover and interactions.
- **State Management**: Local state for image, tags, text, and analysis status.

### Backend (`/app/server/routes/vision.ts` & `/app/server/routes/gemini.ts`)
- **Google Cloud Vision API**:
    - `TEXT_DETECTION`: OCR
    - `LABEL_DETECTION`: Visual tags
    - `WEB_DETECTION`: Web entities and best guess labels
    - `IMAGE_PROPERTIES`: Dominant color detection
- **Google Gemini Pro Vision**:
    - Advanced visual analysis for mood, lighting, style, and context.
- **Security**:
    - API Keys stored server-side only.
    - `Referer` header validation to prevent unauthorized usage.

## Configuration

### Environment Variables
Required for production (Coolify):
```bash
GOOGLE_VISION_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
```

## Future Roadmap (Phase 19 Part 2)
1. **Caption/Narrative Generator**: Use Gemini to write professional curatorial descriptions.
2. **Media Library Integration**: Bring AI tools directly into the main asset upload workflow.
3. **Bulk Image Processing**: Analyze entire collections in one click.
