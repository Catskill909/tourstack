# TourStack 🏛️

**Museum tour builder platform with Swiss Army Knife positioning technologies**

A modern SaaS application for museums to create interactive tours with multiple positioning technologies (QR, GPS, BLE, NFC, RFID, WiFi, UWB, computer vision, and more).

## 🚀 Quick Start

```bash
cd app
npm install
npm run dev           # Start dev server at http://localhost:5173
npm run db:studio     # Open Prisma Studio GUI
```

## 📁 Project Structure

```
TourStack/
├── app/                      # Main application (Vite + React + TypeScript)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (6 models)
│   │   ├── seed.ts           # Built-in templates seeding
│   │   └── migrations/       # Database migrations
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── layouts/          # Layout components
│   │   ├── types/            # TypeScript types
│   │   ├── lib/              # Utilities (db.ts)
│   │   └── generated/        # Prisma client (gitignored)
│   └── package.json
└── tourstack.md              # Comprehensive scope document
```

## 🗄️ Database

**SQLite with Prisma 7** - 6 models:

| Model | Purpose |
|-------|---------|
| Museum | Organization with branding |
| Template | Tour templates with custom fields |
| Tour | Tours with multilingual content |
| Stop | Tour stops with positioning configs |
| AppSettings | API keys and preferences |
| Media | Media library assets |

**npm scripts:**
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed 6 built-in templates
- `npm run db:studio` - Open Prisma Studio GUI

## 🎨 Built-in Templates

Seeded templates for different museum types:
- 🎨 **Artwork** - Art museums and galleries
- 🏺 **Artifact** - Historical and archaeological
- 🦖 **Natural History** - Science museums
- 🔬 **Interactive Science** - Science centers
- 🏛️ **Historic Site** - Walking tours
- 🌿 **Botanical Garden** - Arboretums

## 📍 Positioning Technologies

The platform supports 11 positioning methods:
- QR Code, GPS, BLE Beacon, BLE Virtual
- NFC, RFID, WiFi Fingerprinting
- Ultra-Wideband (UWB), Image Recognition
- Audio Watermarking, Manual, Hybrid

## 🛠️ Tech Stack

- **Frontend**: Vite, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Dark Mode Material Design
- **Database**: SQLite via Prisma 7 with better-sqlite3 adapter
- **State**: Zustand, TanStack Query
- **Icons**: Lucide React

## 📄 Documentation

- [tourstack.md](./tourstack.md) - Comprehensive scope document
- [HANDOFF.md](./HANDOFF.md) - Session handoff and next steps

---

**Repository**: https://github.com/Catskill909/tourstack
