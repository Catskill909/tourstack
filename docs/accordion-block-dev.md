# Accordion Block — Development Plan

**Status:** Planned
**Block Type:** `accordion`
**Priority:** High — solves "too much text" problem, perfect for FAQ, provenance, conservation details

---

## Overview

A collapsible sections block that lets curators organize supplementary content into expandable panels. Supports multiple visual styles, multilingual content, and quick-start templates for common museum use cases.

**Use Cases:**
- **FAQ** — "What is this artifact?", "How old is it?", "Can I photograph it?"
- **Provenance / History** — Ownership timeline, exhibition history, acquisition details
- **Conservation Notes** — Materials, condition, restoration history
- **Visitor Info** — Hours, accessibility, parking, dining
- **Educational** — "Did you know?" facts, deeper context, curriculum connections
- **Technical Details** — Dimensions, medium, accession number, bibliography
- **Safety & Rules** — Photography policy, food policy, emergency info

---

## Data Interface

```typescript
// app/src/types/index.ts

export interface AccordionItem {
  id: string;
  heading: { [lang: string]: string };
  content: { [lang: string]: string };
  icon?: AccordionIcon;
  defaultOpen?: boolean;           // Start expanded (default false)
}

export type AccordionIcon =
  | 'none'
  | 'info'           // ℹ️ Info circle
  | 'question'       // ❓ Question mark
  | 'history'        // 🕐 Clock
  | 'star'           // ⭐ Star / highlight
  | 'warning'        // ⚠️ Warning
  | 'lightbulb'      // 💡 Did you know
  | 'book'           // 📖 Reference
  | 'eye'            // 👁️ Look closer
  | 'palette'        // 🎨 Materials / art
  | 'shield'         // 🛡️ Conservation
  | 'accessibility'  // ♿ Accessibility
  | 'camera'         // 📷 Photography
  | 'map-pin'        // 📍 Location
  | 'ticket'         // 🎫 Admission
  | 'clock';         // ⏰ Hours

export type AccordionStyle =
  | 'minimal'        // Clean lines, no background
  | 'card'           // Separated cards with subtle background
  | 'bordered'       // Connected sections with divider lines
  | 'museum'         // Dark elegant with gold/amber accents
  | 'faq';           // Question-mark icons, bold headings

export interface AccordionBlockData {
  items: AccordionItem[];
  style: AccordionStyle;

  // Behavior
  allowMultipleOpen: boolean;      // Can multiple sections be open at once (default true)
  collapseLabel?: { [lang: string]: string }; // Optional "Collapse All" / "Expand All" label
  showExpandAll: boolean;          // Show expand/collapse all toggle (default false)
  numberedItems: boolean;          // Show 1. 2. 3. prefix (default false)

  // Block metadata (standard pattern)
  title?: { [lang: string]: string };
  showTitle?: boolean;
  blockImage?: StopImageData;
  showBlockImage?: boolean;
}
```

---

## Template System

Quick-start templates that pre-populate accordion items with common museum patterns. Curators pick a template, then customize the content.

```typescript
// app/src/lib/accordionTemplates.ts

export interface AccordionTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  style: AccordionStyle;
  items: Omit<AccordionItem, 'id'>[];   // IDs generated on apply
}

export const ACCORDION_TEMPLATES: AccordionTemplate[] = [
  {
    id: 'faq',
    name: 'Visitor FAQ',
    description: 'Common questions visitors ask at museum stops',
    icon: HelpCircle,
    style: 'faq',
    items: [
      {
        heading: { en: 'What am I looking at?' },
        content: { en: '' },
        icon: 'question',
      },
      {
        heading: { en: 'How old is this?' },
        content: { en: '' },
        icon: 'question',
      },
      {
        heading: { en: 'Why is this important?' },
        content: { en: '' },
        icon: 'question',
      },
      {
        heading: { en: 'Where was this found?' },
        content: { en: '' },
        icon: 'question',
      },
      {
        heading: { en: 'Can I take photos?' },
        content: { en: '' },
        icon: 'camera',
      },
    ],
  },
  {
    id: 'artwork-details',
    name: 'Artwork Details',
    description: 'Technical information about a work of art',
    icon: Palette,
    style: 'museum',
    items: [
      {
        heading: { en: 'About the Artist' },
        content: { en: '' },
        icon: 'palette',
      },
      {
        heading: { en: 'Materials & Technique' },
        content: { en: '' },
        icon: 'eye',
      },
      {
        heading: { en: 'Provenance' },
        content: { en: '' },
        icon: 'history',
      },
      {
        heading: { en: 'Conservation Notes' },
        content: { en: '' },
        icon: 'shield',
      },
      {
        heading: { en: 'Bibliography' },
        content: { en: '' },
        icon: 'book',
      },
    ],
  },
  {
    id: 'did-you-know',
    name: 'Did You Know?',
    description: 'Fun facts and deeper context for curious visitors',
    icon: Lightbulb,
    style: 'card',
    items: [
      {
        heading: { en: 'Fun Fact' },
        content: { en: '' },
        icon: 'lightbulb',
        defaultOpen: true,
      },
      {
        heading: { en: 'Historical Context' },
        content: { en: '' },
        icon: 'history',
      },
      {
        heading: { en: 'Look Closer' },
        content: { en: '' },
        icon: 'eye',
      },
    ],
  },
  {
    id: 'visitor-info',
    name: 'Visitor Information',
    description: 'Practical details for museum visitors',
    icon: Info,
    style: 'bordered',
    items: [
      {
        heading: { en: 'Opening Hours' },
        content: { en: '' },
        icon: 'clock',
      },
      {
        heading: { en: 'Admission' },
        content: { en: '' },
        icon: 'ticket',
      },
      {
        heading: { en: 'Accessibility' },
        content: { en: '' },
        icon: 'accessibility',
      },
      {
        heading: { en: 'Getting Here' },
        content: { en: '' },
        icon: 'map-pin',
      },
      {
        heading: { en: 'Photography Policy' },
        content: { en: '' },
        icon: 'camera',
      },
    ],
  },
  {
    id: 'artifact-record',
    name: 'Artifact Record',
    description: 'Catalog-style details for museum objects',
    icon: FileText,
    style: 'minimal',
    items: [
      {
        heading: { en: 'Object Description' },
        content: { en: '' },
        icon: 'info',
      },
      {
        heading: { en: 'Date & Origin' },
        content: { en: '' },
        icon: 'history',
      },
      {
        heading: { en: 'Dimensions & Materials' },
        content: { en: '' },
        icon: 'eye',
      },
      {
        heading: { en: 'Accession Information' },
        content: { en: '' },
        icon: 'book',
      },
      {
        heading: { en: 'Related Objects' },
        content: { en: '' },
        icon: 'star',
      },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start with an empty accordion',
    icon: Plus,
    style: 'minimal',
    items: [
      {
        heading: { en: 'Section 1' },
        content: { en: '' },
        icon: 'none',
      },
    ],
  },
];
```

---

## Style Definitions

### Minimal
```
No background. Thin top/bottom divider lines. Clean sans-serif headings.
Chevron icon on the right. Content indented slightly.
Best for: Technical details, artifact records where content density matters.
```

### Card
```
Each item is a separate card with subtle dark background (bg-neutral-800/50).
Rounded corners, slight shadow. Gap between cards.
Best for: "Did you know?" facts, standalone expandable tidbits.
```

### Bordered
```
Connected sections with shared border. Divider line between items.
Left accent border (2px, neutral-600). Items flow as one visual unit.
Best for: Visitor info, structured lists where items are related.
```

### Museum
```
Dark elegant design. Amber/gold accent on active heading (text-amber-400).
Subtle gradient on expanded content area. Small-caps heading style.
Thin gold line accent on left border of active item.
Best for: Artwork details, provenance, high-end museum aesthetic.
```

### FAQ
```
Question-mark icon auto-prepended. Bold heading treated as question.
Answer text in slightly lighter color. Alternating subtle backgrounds.
"Q:" prefix on heading, "A:" prefix on content.
Best for: Visitor FAQ, educational Q&A sections.
```

---

## Editor Component

### File: `app/src/components/blocks/AccordionBlockEditor.tsx`

```
┌─────────────────────────────────────────────────────────────────────┐
│  Accordion Block Editor                               [Save ▾] [×] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ── Template ─────────────────────────────────────────────────────  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │  ❓ FAQ  │ │ 🎨 Art   │ │ 💡 Did   │ │ ℹ️ Visitor│ │ 📋 Arti-│  │
│  │          │ │  Details │ │ You Know │ │   Info   │ │  fact   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘  │
│  Selecting a template replaces current items. [Blank] to start fresh│
│                                                                     │
│  ── Style ────────────────────────────────────────────────────────  │
│  [ Minimal ] [ Card ] [ Bordered ] [ Museum ] [ FAQ ]              │
│                                                                     │
│  ── Settings ─────────────────────────────────────────────────────  │
│  ☑ Allow multiple sections open   □ Show Expand/Collapse All       │
│  □ Numbered items                                                   │
│                                                                     │
│  ── Translation ──────────────────────────────────────────────────  │
│  [ en ▪ ] [ es ○ ] [ fr ○ ] [ de ○ ]       [🌐 Translate All]     │
│                                                                     │
│  ── Sections ─────────────────────────────────────────────────────  │
│                                                                     │
│  ┌─ 1. ──────────────────────────────────────── [⋮] [🗑] [▲] [▼] ─┐│
│  │ Icon: [❓]  Heading: [What am I looking at?          ]          ││
│  │ Content:                                                        ││
│  │ ┌──────────────────────────────────────────────────────────┐    ││
│  │ │ This is a 3rd century Roman mosaic depicting...          │    ││
│  │ │                                                          │    ││
│  │ └──────────────────────────────────────────────────────────┘    ││
│  │ □ Start expanded                                                ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─ 2. ──────────────────────────────────────── [⋮] [🗑] [▲] [▼] ─┐│
│  │ Icon: [❓]  Heading: [How old is this?                ]          ││
│  │ Content:                                                        ││
│  │ ┌──────────────────────────────────────────────────────────┐    ││
│  │ │ This mosaic dates to approximately 250 CE...             │    ││
│  │ └──────────────────────────────────────────────────────────┘    ││
│  │ □ Start expanded                                                ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─ 3. (collapsed) ─────────────────────── [⋮] [🗑] [▲] [▼] ─────┐│
│  │ ❓ Why is this important?                                       ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  [ + Add Section ]                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Editor Features

1. **Template Picker** — Grid of template cards at top. Selecting one replaces items with template items (with confirmation if items already have content). Only shown when block is first created or via a "Change Template" button.

2. **Style Selector** — Segmented pills to switch visual style. Live preview updates immediately.

3. **Settings** — Checkboxes for behavior toggles.

4. **Language Bar** — LanguageSwitcher + MagicTranslateButton at the top. Translate All translates every heading and content field across all items for all target languages in one batch.

5. **Section List** — Each item is an expandable editor card:
   - **Icon picker** — Dropdown with Lucide icon options
   - **Heading** — Single-line text input (shows active language content)
   - **Content** — Multi-line textarea (shows active language content)
   - **Default open** — Checkbox per item
   - **Reorder** — Up/down arrow buttons (or drag handle for future drag-and-drop)
   - **Delete** — Trash icon with confirmation
   - **Collapse** — Click heading bar to collapse/expand the editor card (saves vertical space)

6. **Add Section** — Button at bottom creates new empty item with generated ID.

7. **BlockMetadataEditor** — Standard block title + image above the template picker.

### Translation Flow

The "Translate All" button should batch-translate all items efficiently:

```typescript
async function handleTranslateAll() {
  // Collect all source texts (headings + contents)
  const sourceTexts: string[] = [];
  items.forEach(item => {
    sourceTexts.push(item.heading[primaryLang] || '');
    sourceTexts.push(item.content[primaryLang] || '');
  });

  // Batch translate to all target languages
  for (const targetLang of targetLangs) {
    const translations = await translateBatch(sourceTexts, primaryLang, targetLang);
    // Map translations back to items
    const updatedItems = items.map((item, i) => ({
      ...item,
      heading: { ...item.heading, [targetLang]: translations[i * 2] },
      content: { ...item.content, [targetLang]: translations[i * 2 + 1] },
    }));
    // Update state
  }
}
```

---

## Rendering (StopContentBlock.tsx)

### Visitor View

```tsx
function renderAccordionBlock(data: AccordionBlockData) {
  const [openItems, setOpenItems] = useState<Set<string>>(() => {
    // Initialize with defaultOpen items
    return new Set(data.items.filter(i => i.defaultOpen).map(i => i.id));
  });

  function toggleItem(id: string) {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!data.allowMultipleOpen) next.clear();
        next.add(id);
      }
      return next;
    });
  }

  const styleConfig = ACCORDION_STYLES[data.style];

  return (
    <div className={styleConfig.container}>
      {data.showExpandAll && (
        <button
          onClick={() => {
            if (openItems.size === data.items.length) {
              setOpenItems(new Set());
            } else {
              setOpenItems(new Set(data.items.map(i => i.id)));
            }
          }}
          className="text-xs text-neutral-400 hover:text-neutral-200 mb-2"
        >
          {openItems.size === data.items.length ? 'Collapse All' : 'Expand All'}
        </button>
      )}

      {data.items.map((item, index) => {
        const isOpen = openItems.has(item.id);
        const heading = item.heading[language] || item.heading.en || '';
        const content = item.content[language] || item.content.en || '';
        const IconComponent = item.icon && item.icon !== 'none'
          ? ACCORDION_ICON_MAP[item.icon]
          : null;

        return (
          <div key={item.id} className={styleConfig.item(isOpen)}>
            <button
              onClick={() => toggleItem(item.id)}
              className={styleConfig.heading(isOpen)}
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-2">
                {IconComponent && <IconComponent className="w-4 h-4 flex-shrink-0" />}
                {data.numberedItems && <span className="text-neutral-500">{index + 1}.</span>}
                {data.style === 'faq' && <span className="text-neutral-500 font-bold">Q:</span>}
                <span>{heading}</span>
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* CSS-only expand/collapse — no Framer Motion (avoids transform/sticky bugs) */}
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className={styleConfig.content}>
                  {data.style === 'faq' && <span className="text-neutral-500 font-medium">A: </span>}
                  {content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### Style Configuration Object

```typescript
const ACCORDION_STYLES: Record<AccordionStyle, {
  container: string;
  item: (isOpen: boolean) => string;
  heading: (isOpen: boolean) => string;
  content: string;
}> = {
  minimal: {
    container: 'divide-y divide-neutral-700',
    item: () => '',
    heading: (isOpen) =>
      `flex items-center justify-between w-full py-3 text-left text-sm font-medium ${isOpen ? 'text-white' : 'text-neutral-300'} hover:text-white transition-colors`,
    content: 'pb-3 pl-1 text-sm text-neutral-400 leading-relaxed',
  },
  card: {
    container: 'space-y-2',
    item: (isOpen) =>
      `rounded-lg ${isOpen ? 'bg-neutral-800/70' : 'bg-neutral-800/40'} transition-colors`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium ${isOpen ? 'text-white' : 'text-neutral-300'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed',
  },
  bordered: {
    container: 'border-l-2 border-neutral-600 divide-y divide-neutral-700/50',
    item: () => '',
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-medium ${isOpen ? 'text-white border-l-2 border-blue-500 -ml-[2px]' : 'text-neutral-300'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed',
  },
  museum: {
    container: 'divide-y divide-neutral-700/30',
    item: (isOpen) =>
      `${isOpen ? 'border-l-2 border-amber-500/70' : ''}`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3.5 text-left text-sm tracking-wide ${isOpen ? 'text-amber-400 font-semibold' : 'text-neutral-300 font-medium'} hover:text-amber-300 transition-colors uppercase`,
    content: 'px-4 pb-4 text-sm text-neutral-400 leading-relaxed bg-gradient-to-b from-neutral-800/30 to-transparent',
  },
  faq: {
    container: 'space-y-1',
    item: (isOpen) =>
      `rounded-lg ${isOpen ? 'bg-neutral-800/50' : ''} ${!isOpen ? 'odd:bg-neutral-800/20' : ''}`,
    heading: (isOpen) =>
      `flex items-center justify-between w-full px-4 py-3 text-left text-sm font-semibold ${isOpen ? 'text-white' : 'text-neutral-200'} hover:text-white`,
    content: 'px-4 pb-3 text-sm text-neutral-400 leading-relaxed',
  },
};
```

### Lucide Icon Mapping

```typescript
import {
  Info, HelpCircle, Clock, Star, AlertTriangle, Lightbulb,
  BookOpen, Eye, Palette, Shield, Accessibility, Camera,
  MapPin, Ticket, Timer,
} from 'lucide-react';

const ACCORDION_ICON_MAP: Record<AccordionIcon, LucideIcon | null> = {
  none: null,
  info: Info,
  question: HelpCircle,
  history: Clock,
  star: Star,
  warning: AlertTriangle,
  lightbulb: Lightbulb,
  book: BookOpen,
  eye: Eye,
  palette: Palette,
  shield: Shield,
  accessibility: Accessibility,
  camera: Camera,
  'map-pin': MapPin,
  ticket: Ticket,
  clock: Timer,
};
```

---

## Accessibility

The accordion must be fully accessible:

```tsx
// Each heading button:
<button
  aria-expanded={isOpen}
  aria-controls={`accordion-content-${item.id}`}
  id={`accordion-heading-${item.id}`}
>

// Each content panel:
<div
  id={`accordion-content-${item.id}`}
  role="region"
  aria-labelledby={`accordion-heading-${item.id}`}
>
```

- **Keyboard:** Enter/Space toggles, Tab navigates between headings
- **Screen readers:** Proper expanded/collapsed state announcements
- **Motion:** Respects `prefers-reduced-motion` (skip Framer Motion animation)

---

## Integration with Existing Features

### 1. AI Concierge

Accordion items with their headings and content should be indexed by the concierge chatbot. When a visitor asks "Can I take photos?", the chatbot can reference the FAQ accordion's answer. The heading acts as a question, content as the answer — perfect for RAG.

### 2. Translation

Full integration with the existing translation system:
- LanguageSwitcher pills control which language is being edited
- MagicTranslateButton on each heading/content field for individual translation
- "Translate All" bulk button translates all headings + contents for all target languages
- Uses `translateBatch()` for efficient batching (same as Collection translations)

### 3. JSON Feed Export

```json
{
  "type": "accordion",
  "data": {
    "style": "faq",
    "items": [
      {
        "id": "abc123",
        "heading": { "en": "What am I looking at?", "es": "Que estoy viendo?" },
        "content": { "en": "This is a 3rd century...", "es": "Este es un..." },
        "icon": "question"
      }
    ]
  }
}
```

### 4. Kiosk Mode

In kiosk mode, accordion should use larger touch targets:
- Heading buttons: min-height 48px (phone) → 56px (tablet/kiosk)
- Content text: larger font size on tablet/kiosk
- Follows same `deviceType` scaling pattern as other blocks

### 5. Animation (CSS-Only — No Framer Motion)

> **WARNING:** TourStack has documented Framer Motion pitfalls:
> - `AnimatePresence` wrapping layout elements applies `transform`, which breaks `position: sticky` by creating a new containing block ([docs/sticky-header-bug.md](sticky-header-bug.md))
> - `AnimatePresence` doesn't support true crossfade — exit completes before enter starts ([docs/framer-motion.md](framer-motion.md))
>
> For accordion expand/collapse, **use CSS transitions instead of Framer Motion.** They're simpler, more performant, and avoid the transform/stacking-context bugs.

**CSS-only expand/collapse with `grid-template-rows` trick:**

```tsx
// No framer-motion import needed

function AccordionPanel({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-200 ease-out"
      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
    >
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

This approach:
- Animates height from 0 to auto (something `height` transitions can't do)
- Uses zero transforms — no stacking context issues
- Respects `prefers-reduced-motion` via Tailwind's `motion-reduce:transition-none`
- Zero JS, zero extra deps, works everywhere

---

## Implementation Steps

### Step 1: Types & Data (15 min)
- Add `AccordionItem`, `AccordionIcon`, `AccordionStyle`, `AccordionBlockData` to `app/src/types/index.ts`
- Add `'accordion'` to `ContentBlockType` union

### Step 2: Templates (20 min)
- Create `app/src/lib/accordionTemplates.ts`
- Define 6 templates (FAQ, Artwork Details, Did You Know, Visitor Info, Artifact Record, Blank)

### Step 3: Style Config (15 min)
- Create style objects with Tailwind classes for all 5 styles
- Icon mapping from AccordionIcon to Lucide components

### Step 4: Block Editor (60 min)
- Create `app/src/components/blocks/AccordionBlockEditor.tsx`
- Template picker grid (with confirmation when replacing existing items)
- Style selector pills
- Settings checkboxes
- LanguageSwitcher + MagicTranslateButton (Translate All for batch)
- Section list with add/delete/reorder/collapse
- Icon picker dropdown per item
- Wrap in BlockEditorModal with Save dropdown

### Step 5: Block Rendering (45 min)
- Add `renderAccordionBlock()` to `StopContentBlock.tsx`
- State management for open/closed items
- CSS `grid-template-rows` transition for smooth expand/collapse (NO Framer Motion — avoids transform/sticky bugs)
- All 5 style variants
- ARIA attributes for accessibility
- `motion-reduce:transition-none` for prefers-reduced-motion
- Add to `BLOCK_ICONS` (ChevronDown or List icon) and `BLOCK_LABELS` ("Accordion")

### Step 6: Block Registration (15 min)
- Add to `createEmptyBlockData()` in `StopEditor.tsx`
- Add to add-block grid UI
- Add editor routing in StopEditor block type switch

### Step 7: Device Scaling (15 min)
- Tablet/kiosk: larger touch targets, font sizes
- Follows existing `deviceType` prop pattern

### Step 8: Testing (30 min)
- Test all 5 styles render correctly
- Test template application and replacement
- Test add/delete/reorder sections
- Test translation (individual + Translate All batch)
- Test in phone/tablet/kiosk preview modes
- Test single-open vs multi-open behavior
- Test keyboard accessibility (Tab, Enter, Space)
- Test with `prefers-reduced-motion`

---

## Dependencies

No new dependencies required. Uses:
- `lucide-react` (already installed)
- CSS `grid-template-rows` transition for expand/collapse (no Framer Motion)
- Existing translation infrastructure

---

## Future Enhancements

- **Rich text content** — Support bold/italic/links in accordion content (mini rich text editor)
- **Nested accordions** — Accordion within accordion for deep hierarchies
- **Image in content** — Optional image per accordion item (thumbnail or full-width)
- **Drag-and-drop reorder** — Replace up/down arrows with drag handle (requires dnd library)
- **AI auto-generate** — "Generate FAQ from stop content" using Gemini to create Q&A pairs
- **Conditional sections** — Show/hide items based on language or device type
