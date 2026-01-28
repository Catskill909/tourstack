# AI Assistance & Smart Image Tools (Phase 19)

**Status**: Phase 19 COMPLETE ✅ (Jan 27, 2026)

## Overview
TourStack now includes a suite of AI-powered tools designed to assist museum staff in cataloging and describing artifacts. These tools leverage Google Cloud Vision API and (soon) Generative AI to automate metadata extraction.

## Features

### 1. Smart Tag Generator (Image to Text)
A powerful tool for extracting information from images of artifacts, labels, or plaques.

- **Status**: Production Ready ✅
- **Route**: `/ai-assistance` -> Smart Tag Generator
- **Capabilities**:
    - **Text Extraction (OCR)**: Automatically reads and copies text from images (perfect for transcribing museum labels).
    - **Visual Tagging**: Identifies objects and concepts (e.g., "Sculpture", "Bronze", "Portrait") using `LABEL_DETECTION`.
    - **Smart Titles**: Suggests a "Best Guess" title for the artifact using `WEB_DETECTION` (identifies famous works).
    - **Manual Editing**: 
        - **Add Tags**: Type + Enter to add custom tags.
        - **Remove Tags**: Click 'X' to remove irrelevant AI suggestions.

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

### Backend (`/app/server/routes/vision.ts`)
- **Google Cloud Vision API**:
    - `TEXT_DETECTION`: OCR
    - `LABEL_DETECTION`: Visual tags
    - `WEB_DETECTION`: Web entities and best guess labels
- **Security**:
    - API Key stored in `GOOGLE_VISION_API_KEY` (server-side only).
    - `Referer` header validation to prevent unauthorized API usage.

## Configuration

### Environment Variables
Required for production (Coolify):
```bash
GOOGLE_VISION_API_KEY=your_api_key_here
```

## Future Roadmap (Phase 19 Part 2)
1. **Caption Generator**: Use Google Gemini Pro Vision to write 1-paragraph descriptions of artifacts.
2. **Smart Cataloging**: Integrate these tools directly into the Media Library upload modal.
