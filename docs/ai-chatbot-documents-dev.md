# AI Chatbot & Documents Collection Development Plan

> **Phase 25: Documents Collection + AI Museum Concierge**  
> Staff tools for content creation + Visitor chatbot for logistics  
> **Last Updated:** February 1, 2026

---

## 📋 Quick Reference

| Feature | Location | Users | Status |
|---------|----------|-------|--------|
| **Documents Collection** | `/collections` → Documents type | Staff/Curators | 🔲 Not Started |
| **Chat Block (Concierge)** | Tour stops, visitor drawer | Visitors | 🔲 Not Started |

**Tech Stack:** Gemini 1.5 Flash (1M context), SQLite/Prisma, existing Google Translate

---

## ✅ Implementation Checklist

### Museum Concierge (Chat Block) - Priority 1
- [ ] Create `/app/uploads/knowledge/` directory
- [ ] Create `server/routes/chat.ts` endpoint
- [ ] Build system prompt with grounded context
- [ ] Add language detection + translation
- [ ] Register route in `server/index.ts`
- [ ] Create `ChatDrawer.tsx` component
- [ ] Add Framer Motion slide-in animation
- [ ] Create quick action buttons
- [ ] Integrate into Visitor view
- [ ] Add `chatbot` block type to types
- [ ] Create `ChatbotBlockEditor.tsx`

### Documents Collection (Staff Tools) - Priority 2
- [ ] Enable "Documents" type in `CollectionTypeModal.tsx`
- [ ] Create `DocumentCollectionWizard.tsx`
- [ ] Add PDF/DOCX/TXT text extraction
- [ ] Create `/api/documents/analyze` endpoint
- [ ] Build `DocumentAIToolsPanel.tsx`
- [ ] Update Prisma schema for document fields

### Testing & Polish
- [ ] Test chat with sample knowledge docs
- [ ] Test multilingual responses
- [ ] Verify in visitor mode

---

## 🔧 Part 1: Documents Collection (Staff Tools)

Enable the "Documents" collection type with AI-powered content tools for museum staff.

### Use Cases

| Scenario | Example |
|----------|---------|
| **Summarize research** | Upload 50-page exhibition catalog → Get 1-paragraph summary |
| **Extract key facts** | Upload artist bio → Extract dates, movements, key works |
| **Write exhibit labels** | Paste research notes → Generate visitor-friendly label text |
| **Parse donor docs** | Upload acquisition records → Extract provenance, dates, values |
| **Translate content** | Upload English doc → Generate multilingual versions |
| **Create FAQ** | Upload policies → AI suggests common visitor questions |

### Document Collection Wizard

Enable "Documents" in `CollectionTypeModal.tsx` (currently "Coming Soon"):

```
Step 1: Details      → Name, description
Step 2: Upload       → Drag & drop PDF, DOCX, TXT, images (for OCR)
Step 3: Processing   → OCR extraction, text parsing
Step 4: AI Tools     → Summarize, extract, analyze
```

### AI Tools Panel (Document View)

When viewing a document in a collection:

```
┌─────────────────────────────────────────────────────────────────┐
│  📄 exhibition-catalog-2026.pdf                    [Languages ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Preview: [Document text preview...]                             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  🤖 AI Tools                                                     │
│                                                                  │
│  [📝 Summarize]  [🔍 Extract Facts]  [💬 Generate FAQ]           │
│  [✏️ Write Label]  [🌐 Translate All]  [🏷️ Auto-Tag]             │
│                                                                  │
│  ─────────────────────────────────────────────────────────────── │
│                                                                  │
│  AI Output:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Summary: This exhibition catalog documents the 2026         │ │
│  │ retrospective of María López, featuring 47 works from       │ │
│  │ her Blue Period (1987-1995)...                              │ │
│  │                                                             │ │
│  │ [Copy]  [Save to Notes]  [Use in Stop]                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### AI Tool Prompts

| Tool | Gemini Prompt |
|------|---------------|
| **Summarize** | "Summarize this document in 2-3 sentences for a museum exhibit label." |
| **Extract Facts** | "Extract key facts: dates, names, locations, measurements. Return as JSON." |
| **Generate FAQ** | "Generate 5 FAQ questions visitors might ask about this content." |
| **Write Label** | "Write a 100-word exhibit label suitable for general audiences." |
| **Auto-Tag** | "Generate 5-10 keyword tags for cataloging this document." |

### Database Schema Addition

```prisma
// Add to Collection model (or create separate DocumentCollection)
model Collection {
  // ... existing fields
  
  // For type='document'
  documentText     String?  @db.Text  // Extracted full text
  documentSummary  String?            // AI-generated summary
  documentFacts    String?            // JSON: extracted facts
  documentTags     String?            // JSON: auto-generated tags
}
```

---

## 🤖 Part 2: Chat Block (Museum Concierge)

Visitor-facing chatbot for logistics questions. Deploys as a **Chat Block** in tours or as a **floating drawer** in visitor view.

### Knowledge Base

Documents in `/app/uploads/knowledge/` power the concierge:

| File | Content |
|------|---------|
| `general-info.txt` | Hours, admission, location, parking |
| `accessibility.txt` | Wheelchair access, elevators, assistive devices |
| `facilities.txt` | Restrooms, café, gift shop, coat check |
| `policies.txt` | Photography, bags, strollers, service animals |

### Chat Drawer (Visitor View)

Framer Motion slide-in from right:

```
┌───────────────────────────────────────┬─────────────────────────┐
│                                       │ 🤖 Museum Concierge   ✕ │
│  [Tour Stop Content]                  │                         │
│                                       │ Hi! How can I help?     │
│                                       │                         │
│                                       │ Quick Actions:          │
│                                       │ [🚻 Restrooms]          │
│                                       │ [🍽️ Food & Drink]       │
│                                       │ [♿ Accessibility]      │
│                                       │ [⏰ Hours]              │
│                                       │                         │
│                                       │ ─────────────────────── │
│                                       │ [Ask a question...]     │
└───────────────────────────────────────┴─────────────────────────┘
```

### Chat Block (In Tour Stops)

Add `chatbot` as a content block type:

```typescript
interface ChatbotBlockData {
  blockType: 'chatbot';
  title: string;
  placeholder: string;
  suggestedQuestions: string[];
  position: 'inline' | 'floating';
}
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GEMINI 1.5 FLASH (1M Context)                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STAFF TOOLS (Collections)        VISITOR CONCIERGE (Tours)    │
│   ┌─────────────────────────┐      ┌─────────────────────────┐  │
│   │ • Summarize docs        │      │ • Answer logistics Q's  │  │
│   │ • Extract facts         │      │ • Quick action buttons  │  │
│   │ • Write labels          │      │ • Multilingual          │  │
│   │ • Generate FAQs         │      │ • Grounded in knowledge │  │
│   │ • Translate content     │      │   docs only             │  │
│   └─────────────────────────┘      └─────────────────────────┘  │
│              ↓                                ↓                  │
│   /api/documents/analyze          /api/chat                      │
│              ↓                                ↓                  │
│   Upload → Process → Tools        Knowledge folder → Respond     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Code Implementation Details

### Chat Route: `server/routes/chat.ts`

```typescript
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const KNOWLEDGE_DIR = path.join(process.cwd(), 'uploads', 'knowledge');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Read all knowledge documents
function loadKnowledgeBase(): string {
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
    return '';
  }
  
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.txt'));
  let context = '';
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
    context += `\n--- ${file} ---\n${content}\n`;
  }
  
  return context;
}

router.post('/', async (req, res) => {
  try {
    const { message, language = 'en' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const knowledge = loadKnowledgeBase();
    
    const systemPrompt = `You are a helpful museum concierge assistant. Answer visitor questions about the museum using ONLY the information provided below. If the answer is not in the provided information, politely say you don't have that information and suggest asking a staff member.

Be concise, friendly, and helpful. Format responses for easy reading.

MUSEUM INFORMATION:
${knowledge || 'No knowledge base documents have been uploaded yet.'}`;

    const result = await model.generateContent([
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: 'I understand. I will only answer questions based on the museum information provided.' }] },
      { role: 'user', parts: [{ text: message }] }
    ]);
    
    let response = result.response.text();
    
    // Translate if needed (using existing Google Translate)
    if (language !== 'en') {
      // Call existing /api/google-translate endpoint
      const translateRes = await fetch('http://localhost:3000/api/google-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: response, sourceLang: 'en', targetLang: language })
      });
      const translated = await translateRes.json();
      if (translated.translatedText) {
        response = translated.translatedText;
      }
    }
    
    res.json({ response, sources: fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.txt')) });
    
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

export default router;
```

### Register in `server/index.ts`

```typescript
import chatRouter from './routes/chat';
// ... other imports

app.use('/api/chat', chatRouter);
```

### ChatDrawer Component Pattern

```tsx
// src/components/chat/ChatDrawer.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
}

const QUICK_ACTIONS = [
  { label: '🚻 Restrooms', question: 'Where are the restrooms?' },
  { label: '🍽️ Food & Drink', question: 'Is there a café or restaurant?' },
  { label: '♿ Accessibility', question: 'What accessibility features do you have?' },
  { label: '⏰ Hours', question: 'What are your opening hours?' },
];

export function ChatDrawer({ isOpen, onClose, language = 'en' }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-700 shadow-xl z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-700">
            <h2 className="text-lg font-medium">🤖 Museum Concierge</h2>
            <button onClick={onClose}><X className="w-5 h-5" /></button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <>
                <p className="text-zinc-400">Hi! How can I help you today?</p>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.question)}
                      className="block w-full text-left px-3 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {/* Message bubbles */}
          </div>
          
          {/* Input */}
          <div className="p-4 border-t border-zinc-700">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask a question..."
                className="flex-1 bg-zinc-800 rounded-lg px-3 py-2"
              />
              <button onClick={() => sendMessage(input)} disabled={loading}>
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 🌐 Multilingual Support

Uses existing Google Translate infrastructure:

```
1. Visitor asks in French: "Où sont les toilettes?"
2. Detect language (Google Translate /detect)
3. Translate to English: "Where are the restrooms?"
4. Query Gemini with English docs
5. Get English response
6. Translate back to French
```

**Supported:** en, es, fr, de, it, pt, ja, ko, zh

---

## 💰 Billing & Quotas

| Service | Free Tier | Our Usage |
|---------|-----------|-----------|
| **Gemini** | Generous RPM | Low - chat only |
| **Translation** | 500K chars/mo | Capped at 5K/day |
| **Vision** | 1K units/mo | Image analysis only |

---

## 📂 File Structure

```
/app/uploads/
├── images/           # Existing
├── audio/            # Existing
└── knowledge/        # NEW - Chat docs
    ├── general-info.txt
    ├── accessibility.txt
    ├── facilities.txt
    └── policies.txt
```

---

## 💡 Future Ideas

| Feature | Description |
|---------|-------------|
| **Voice Concierge** | Voice input → TTS response (ElevenLabs) |
| **Wayfinding** | "How do I get to Gallery B?" + Map Block highlight |
| **Kids Mode** | Fun facts, simplified language |
| **Staff Training Bot** | Q&A from training manuals |
| **Exhibit Context** | "Tell me more about this painting" based on stop content |

---

## 📚 Related Docs

- [Collections Development](file:///Users/paulhenshaw/Desktop/TourStack/docs/collections-dev.md)
- [AI Tools](file:///Users/paulhenshaw/Desktop/TourStack/docs/ai-tools.md)
- [Translation Services](file:///Users/paulhenshaw/Desktop/TourStack/docs/translations-dev.md)
- [README](file:///Users/paulhenshaw/Desktop/TourStack/README.md) - Critical startup info

---

## 🔑 Environment Variables

Already configured (same as Vision API):
```env
GEMINI_API_KEY=...           # Gemini 1.5 Flash
GOOGLE_VISION_API_KEY=...    # Also used for Translation
```

---

*This document is self-contained for AI handoff between conversations.*
