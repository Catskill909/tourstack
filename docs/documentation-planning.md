# TourStack Documentation — Ground Plan

> **Vision:** Documentation as a gallery in the void — pure black, pure white, pure clarity.
> **Approach:** Built INTO the TourStack app itself at `/docs` route — no separate site.

---

## 🎯 Core Principle

**Documentation lives inside the app.**

- Same React codebase
- Same Tailwind styling
- Same dark theme
- Accessible via sidebar "Help" or dedicated `/docs` route
- No external dependencies, no separate deployment

---

## 🎨 Design Philosophy

### The Museum Aesthetic

| Principle | Implementation |
|-----------|----------------|
| **True Black Canvas** | `#000000` background, content floats in void |
| **High Contrast** | Pure white text on black, no mid-grays for headings |
| **Typography as Art** | Space Grotesk headlines, Inter body, dramatic scale |
| **Negative Space** | 40%+ whitespace ratio, let content breathe |
| **Minimal Borders** | Use spacing over lines, borders only when essential |
| **Subtle Motion** | Fade-ins at 200ms, no bouncing or playful animations |
| **Monochrome Icons** | White strokes, no filled icons, 1.5px stroke weight |

### Color Palette (Ultra Monochrome)

```css
/* Pure Black & White Museum Theme */
--bg-primary: #000000;      /* True black canvas */
--bg-secondary: #0a0a0a;    /* Elevated surfaces */
--bg-elevated: #141414;     /* Hover states, cards */
--bg-subtle: #1a1a1a;       /* Code blocks, callouts */
--border: #262626;          /* Subtle borders */
--border-focus: #404040;    /* Interactive focus rings */
--text-primary: #ffffff;    /* Pure white headings */
--text-secondary: #a3a3a3;  /* Neutral gray body */
--text-muted: #737373;      /* Timestamps, metadata */
--accent: #ffffff;          /* White as accent (links, buttons) */
--accent-hover: #e5e5e5;    /* Hover state */
--accent-subtle: #ffffff0d; /* White at 5% for backgrounds */
```

---

## 🏗️ Technical Implementation

### Stack (Using Existing App)

| Component | Solution |
|-----------|----------|
| **Framework** | React (already in app) |
| **Styling** | Tailwind CSS (already in app) |
| **Routing** | React Router `/docs/*` routes |
| **Markdown** | `react-markdown` + `remark-gfm` |
| **Code Highlighting** | `shiki` or `prism-react-renderer` |
| **Search** | Client-side fuzzy search (fuse.js) |

### File Structure

```
app/src/
├── pages/
│   └── Docs.tsx              # Main docs layout with sidebar
├── components/
│   └── docs/
│       ├── DocsLayout.tsx    # Two-column layout (sidebar + content)
│       ├── DocsSidebar.tsx   # Navigation tree
│       ├── DocsContent.tsx   # Markdown renderer
│       ├── DocsSearch.tsx    # ⌘K search modal
│       ├── CodeBlock.tsx     # Syntax highlighted code
│       └── Callout.tsx       # Tip/Warning/Note boxes
├── docs/                     # Markdown content files
│   ├── index.md
│   ├── getting-started/
│   │   ├── introduction.md
│   │   ├── quick-start.md
│   │   ├── core-concepts.md
│   │   └── first-tour.md
│   ├── admin-guide/
│   │   ├── tours.md
│   │   ├── stops.md
│   │   ├── blocks/
│   │   │   ├── text.md
│   │   │   ├── image.md
│   │   │   ├── audio.md
│   │   │   ├── gallery.md
│   │   │   ├── timeline.md
│   │   │   ├── map.md
│   │   │   └── tour-block.md
│   │   ├── positioning.md
│   │   └── ai-translation.md
│   ├── api/
│   │   ├── overview.md
│   │   ├── tours.md
│   │   ├── stops.md
│   │   └── collections.md
│   └── deployment/
│       ├── docker.md
│       └── coolify.md
```

### Routes

```tsx
// App.tsx routes
<Route path="/docs" element={<Docs />} />
<Route path="/docs/:section" element={<Docs />} />
<Route path="/docs/:section/:page" element={<Docs />} />
```

---

## 📐 Information Architecture

### Sitemap

```
/docs
│
├── 📍 Getting Started
│   ├── Introduction
│   ├── Quick Start (5-minute setup)
│   ├── Core Concepts
│   └── Your First Tour
│
├── 🎨 Admin Guide
│   ├── Tours
│   ├── Stops & Content
│   ├── Content Blocks (7 types)
│   ├── Positioning (QR, GPS, BLE, NFC)
│   └── AI & Translation
│
├── 🔌 API Reference
│   ├── Overview
│   ├── Tours API
│   ├── Stops API
│   └── Collections API
│
└── 🚀 Deployment
    ├── Docker
    └── Coolify
```

---

## ✨ Features

### 1. Keyboard Navigation
- `⌘K` / `Ctrl+K` — Open search
- `←` / `→` — Previous/Next page
- `Esc` — Close modals

### 2. Code Blocks (Monochrome Theme)
```
Background:  #0a0a0a
Keywords:    #ffffff (bold)
Strings:     #a3a3a3
Comments:    #525252
```

### 3. Callout Components
```tsx
<Callout type="tip">Pro tip here</Callout>
<Callout type="warning">Watch out!</Callout>
<Callout type="danger">Critical info</Callout>
```

### 4. Table of Contents
Auto-generated from `## headings` — sticky sidebar on desktop.

### 5. Copy Code Button
One-click copy for all code blocks.

---

## 🎯 Implementation Phases

### Phase 1: Foundation ← START HERE
- [ ] Add `/docs` route to React Router
- [ ] Create `DocsLayout.tsx` with sidebar + content area
- [ ] Install `react-markdown` + `remark-gfm`
- [ ] Create basic markdown rendering
- [ ] Style with ultra-monochrome theme

### Phase 2: Content Structure
- [ ] Create docs sidebar navigation
- [ ] Add Getting Started pages (4 docs)
- [ ] Add Admin Guide pages
- [ ] Add syntax highlighting with `shiki`

### Phase 3: Polish
- [ ] Add `⌘K` search modal
- [ ] Add copy code button
- [ ] Add table of contents
- [ ] Add prev/next navigation
- [ ] Mobile responsive sidebar

### Phase 4: Content
- [ ] Write all documentation content
- [ ] Add screenshots
- [ ] API reference with examples

---

## 📦 Dependencies to Add

```bash
cd app
npm install react-markdown remark-gfm shiki fuse.js
```

Minimal footprint — these are lightweight libraries.

---

## 🎨 Component Design

### DocsLayout
```
┌─────────────────────────────────────────────────────────┐
│  ← Back to App                          ⌘K Search      │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│  SIDEBAR       │  CONTENT                               │
│                │                                        │
│  Getting       │  # Page Title                          │
│  Started       │                                        │
│    Intro       │  Content here...                       │
│    Quick...    │                                        │
│                │  ## Section                            │
│  Admin Guide   │                                        │
│    Tours       │  More content...                       │
│    Stops       │                                        │
│                │                                        │
│  API           │  ```code block```                      │
│                │                                        │
├────────────────┴────────────────────────────────────────┤
│  ← Previous                              Next →         │
└─────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Create `/docs` route** in App.tsx
2. **Build DocsLayout component** with sidebar
3. **Add react-markdown** for content rendering
4. **Write first 4 pages** (Getting Started section)
5. **Style with monochrome theme**

---

*Documentation as negative space — content emerges from the void with surgical precision.*
