# AI Chatbot & Documents Collection Development Plan

> **Phase 25: Documents Collection + AI Museum Concierge**  
> Staff tools for content creation + Visitor chatbot for logistics  
> **Last Updated:** February 1, 2026

---

## 📋 Quick Reference

| Feature | Location | Users | Status |
|---------|----------|-------|--------|
| **Documents Collection** | `/collections` → Documents type | Staff/Curators | ✅ Implemented |
| **Chat Block (Concierge)** | Tour stops, visitor drawer | Visitors | ✅ Core Implemented |

**Tech Stack:** Gemini 2.0 Flash, SQLite/Prisma, officeparser (PDF/DOCX/RTF extraction)

---

## ✅ Implementation Checklist

### Museum Concierge (Chat Block) - ✅ Complete
- [x] Create `/app/uploads/knowledge/` directory
- [x] Create `server/routes/chat.ts` endpoint
- [x] Build system prompt with grounded context
- [x] Add language detection + translation
- [x] Register route in `server/index.ts`
- [x] Create `ChatDrawer.tsx` component
- [x] Add Framer Motion slide-in animation
- [x] Create quick action buttons
- [x] Integrate into Visitor view
- [x] Add "New Chat" reset button
- [ ] **Admin: Configurable Quick Actions** (Settings page)
- [ ] Add `chatbot` block type to types
- [ ] Create `ChatbotBlockEditor.tsx`

### Documents Collection (Staff Tools) - ✅ Core Complete
- [x] Enable "Documents" type in `CollectionTypeModal.tsx`
- [x] Create `DocumentCollectionWizard.tsx` (simplified 3-step wizard)
- [x] Add PDF/DOCX/DOC/RTF/ODT/PPTX text extraction via `officeparser`
- [x] Create `/api/documents/extract-text-base64` endpoint
- [x] Create `/api/gemini/analyze-text` endpoint
- [x] Build `DocumentAIToolsPanel.tsx` with fullWidth layout option
- [x] Integrate AI tools into `CollectionDetail.tsx`
- [ ] Update Prisma schema for document-specific fields

### Testing & Polish
- [x] Test chat with sample knowledge docs
- [x] Test multilingual responses
- [x] Verify document text extraction (PDF, DOCX, TXT)
- [x] Test AI analysis tools (Summarize, Facts, FAQ, Tags)
- [ ] Add batch "Run All Tools" for all documents

---

## 🔧 Part 1: Documents Collection (Staff Tools) - IMPLEMENTED

### Supported Document Formats

| Format | Extension | Extraction Method |
|--------|-----------|-------------------|
| **PDF** | `.pdf` | officeparser (server-side) |
| **Word (Modern)** | `.docx` | officeparser (server-side) |
| **Word (Legacy)** | `.doc` | officeparser (server-side) |
| **Rich Text** | `.rtf` | officeparser (server-side) |
| **OpenDocument** | `.odt` | officeparser (server-side) |
| **PowerPoint** | `.pptx` | officeparser (server-side) |
| **Plain Text** | `.txt` | Browser FileReader API |

### Document Collection Wizard (Simplified)

The wizard is now streamlined to 3 steps:

```
Step 1: Details      → Name, description
Step 2: Upload       → Drag & drop documents (multiple formats)
Step 3: Review       → Verify text extraction status
```

**Key Components:**
- `DocumentCollectionWizard.tsx` - 3-step upload wizard
- `DocumentAIToolsPanel.tsx` - Full-width AI tools panel
- `CollectionDetail.tsx` - Integrated document view with AI panel

### AI Tools Panel (Full-Width Layout)

The AI tools panel now uses a responsive full-width layout:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📄 Documents (compact grid - 4 columns)                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ doc1.pdf     │ │ doc2.docx    │ │ doc3.txt     │ │ + Add Docs   │        │
│  │ 245 KB • AI  │ │ 89 KB • Ready│ │ 12 KB • AI   │ │              │        │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
├─────────────────────────────────────────────────────────────────────────────┤
│  🤖 AI Document Tools                                     [Single] [Batch]  │
├────────────────────────────────────┬────────────────────────────────────────┤
│  📄 selected-doc.pdf               │  Analysis Results                      │
│  12,456 characters extracted       │                                        │
│                                    │  ▼ Summary                             │
│  ┌────────────┐ ┌────────────┐     │    This document describes...          │
│  │ Summarize  │ │ Extract    │     │                                        │
│  │ ✓          │ │ Facts ✓    │     │  ▼ Facts (8)                          │
│  └────────────┘ └────────────┘     │    • Founded in 1967                   │
│  ┌────────────┐ ┌────────────┐     │    • Located in Sullivan County        │
│  │ Generate   │ │ Auto-Tag   │     │                                        │
│  │ FAQ ✓      │ │ ✓          │     │  ▼ Tags (12)                          │
│  └────────────┘ └────────────┘     │    [museum] [history] [exhibition]     │
│                                    │                                        │
│  [✨ Run All Tools]                │                                        │
└────────────────────────────────────┴────────────────────────────────────────┘
```

### AI Tool Endpoints

**`POST /api/gemini/analyze-text`**

```typescript
interface AnalyzeTextRequest {
  text: string;               // Extracted document text
  tool: 'summarize' | 'facts' | 'faq' | 'tags';
}

interface AnalyzeTextResponse {
  result: string | string[] | Array<{ question: string; answer: string }>;
}
```

**Tool Prompts:**

| Tool | Output Format | Description |
|------|---------------|-------------|
| `summarize` | `{ result: string }` | 2-3 sentence museum-style summary |
| `facts` | `{ result: string[] }` | Array of key facts, dates, names |
| `faq` | `{ result: [{question, answer}] }` | 5 visitor FAQ questions |
| `tags` | `{ result: string[] }` | 8-12 keyword tags for cataloging |

### Document Extraction Endpoint

**`POST /api/documents/extract-text-base64`**

```typescript
interface ExtractTextRequest {
  data: string;      // Base64-encoded file content
  fileName: string;  // Original filename with extension
  mimeType: string;  // MIME type (for detection)
}

interface ExtractTextResponse {
  success: boolean;
  text: string;
  characterCount: number;
  fileName: string;
}
```

---

## 🤖 Part 2: Chat Block (Museum Concierge) - IMPLEMENTED

### Knowledge Base

Documents in `/app/uploads/knowledge/` power the concierge:

| File | Content |
|------|---------|
| `general-info.txt` | Hours, admission, location, parking |
| `accessibility.txt` | Wheelchair access, elevators, assistive devices |
| `facilities.txt` | Restrooms, café, gift shop, coat check |
| `policies.txt` | Photography, bags, strollers, service animals |

### Chat Drawer Implementation

The `ChatDrawer.tsx` component provides:
- Framer Motion slide-in from right
- Quick action buttons (configurable)
- Message history with bubbles
- "New Chat" reset functionality
- Multilingual support via Google Translate

### Chat API

**`POST /api/chat`**

```typescript
interface ChatRequest {
  message: string;
  language?: string;  // ISO language code
}

interface ChatResponse {
  response: string;
  sources: string[];  // Knowledge doc filenames used
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI 2.0 FLASH                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STAFF TOOLS (Collections)        VISITOR CONCIERGE (Tours)    │
│   ┌─────────────────────────┐      ┌─────────────────────────┐  │
│   │ ✅ Summarize docs       │      │ ✅ Answer logistics Q's │  │
│   │ ✅ Extract facts        │      │ ✅ Quick action buttons │  │
│   │ ✅ Generate FAQs        │      │ ✅ Multilingual         │  │
│   │ ✅ Auto-tag documents   │      │ ✅ Grounded in knowledge│  │
│   │ ✅ Batch processing     │      │    docs only            │  │
│   └─────────────────────────┘      └─────────────────────────┘  │
│              ↓                                ↓                  │
│                                                                  │
│   Document Upload                  Knowledge Folder              │
│        ↓                                  ↓                      │
│   /api/documents/extract-text      /api/chat                     │
│        ↓                                  ↓                      │
│   officeparser                     Gemini with context           │
│        ↓                                  ↓                      │
│   /api/gemini/analyze-text         Translated response           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📂 File Structure

```
/app/
├── src/
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatDrawer.tsx          # Visitor chat drawer
│   │   └── collections/
│   │       ├── DocumentCollectionWizard.tsx  # 3-step upload wizard
│   │       ├── DocumentAIToolsPanel.tsx      # AI tools with fullWidth support
│   │       └── index.ts                       # Barrel exports
│   └── pages/
│       └── CollectionDetail.tsx        # Document collection view
│
├── server/
│   ├── routes/
│   │   ├── chat.ts                     # /api/chat endpoint
│   │   ├── documents.ts                # /api/documents/* endpoints
│   │   └── gemini.ts                   # /api/gemini/analyze-text
│   └── index.ts                        # Route registration
│
└── uploads/
    └── knowledge/                      # Chat knowledge base
        ├── general-info.txt
        ├── accessibility.txt
        ├── facilities.txt
        └── policies.txt
```

---

## 🎨 UI/UX Improvements

### Document Collection Layout (Redesigned)

**Before:** Side-by-side layout with wasted vertical space
- Documents list: 2/3 width, stacked vertically
- AI panel: 1/3 width, cramped sidebar

**After:** Vertical layout with full-width utilization
- Documents: Compact 4-column grid at top
- AI Tools: Full-width panel below with 2-column results layout
- Tools: 4-column grid for tool buttons
- Tab switcher: Inline in header for cleaner look

### Key Layout Changes

| Element | Before | After |
|---------|--------|-------|
| Document cards | Full-width rows | Compact grid (4 cols) |
| AI panel | Narrow sidebar | Full-width below |
| Tool buttons | 2x2 grid | 1x4 grid (horizontal) |
| Results | Stacked accordions | 2-column layout |
| Tab switcher | Full-width row | Inline pill buttons |

---

## 🔑 Dependencies

### New Package: `officeparser`

```bash
npm install officeparser
```

Provides unified text extraction for:
- PDF (via internal pdf.js)
- DOCX, DOC (Office Open XML)
- RTF (Rich Text Format)
- ODT (OpenDocument)
- PPTX (PowerPoint)
- XLSX (Excel)

---

## 💡 Future Ideas

| Feature | Description | Priority |
|---------|-------------|----------|
| **Write Label Tool** | Generate visitor-friendly exhibit labels | Medium |
| **Translate All** | Batch translate to configured languages | Medium |
| **Admin Quick Actions** | Settings page for chat button config | Low |
| **Voice Concierge** | Voice input → TTS response (ElevenLabs) | Low |
| **Chatbot Block Type** | Embed chat in tour stops | Low |
| **OCR for Images** | Extract text from scanned documents | Medium |

---

## 📚 Related Docs

- [Collections Development](file:///Users/paulhenshaw/Desktop/TourStack/docs/collections-dev.md)
- [AI Tools](file:///Users/paulhenshaw/Desktop/TourStack/docs/ai-tools.md)
- [Translation Services](file:///Users/paulhenshaw/Desktop/TourStack/docs/translations-dev.md)
- [README](file:///Users/paulhenshaw/Desktop/TourStack/README.md) - Critical startup info

---

## 🔐 Environment Variables

```env
GEMINI_API_KEY=...           # Gemini 2.0 Flash
GOOGLE_VISION_API_KEY=...    # Also used for Translation
```

---

*This document is self-contained for AI handoff between conversations.*
