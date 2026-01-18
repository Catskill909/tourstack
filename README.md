# TourStack 🏛️

**Museum tour builder with modular content blocks and Swiss Army Knife positioning**

Build interactive tours with QR codes, GPS, Bluetooth beacons, NFC, and more. Support for multilingual content, audio guides, image galleries, and rich media.

## 🚀 Quick Start

```bash
cd app
npm install
npm run dev           # http://localhost:5173
npm run db:studio     # Open database GUI
```

## 🎯 Key Features

- **7 Positioning Technologies**: QR Code, GPS, BLE Beacon, NFC, RFID, WiFi, UWB
- **Modular Content Blocks**: Text, images, galleries, audio, video, collections
- **Multilingual**: All content supports multiple languages
- **JSON Export**: Portable tour data for mobile apps and backup

## 📁 Project Structure

```
TourStack/
├── app/                    # Main application
│   ├── prisma/             # Database schema + seed
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Services + utilities
│   │   ├── stores/         # Zustand stores
│   │   └── types/          # TypeScript types
│   └── package.json
├── docs/                   # Documentation
│   └── ARCHITECTURE.md     # Content block system
├── HANDOFF.md              # Development handoff
└── tourstack.md            # Full scope document
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite, React 19, TypeScript |
| Styling | Tailwind CSS v4, Dark Mode |
| Database | SQLite + Prisma 7 |
| State | Zustand |
| Icons | Lucide React |

## 📖 Documentation

| Doc | Purpose |
|-----|---------|
| [HANDOFF.md](./HANDOFF.md) | Development status & phases |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Content block system |
| [tourstack.md](./tourstack.md) | Full scope reference |

## 🔧 Database Commands

```bash
npm run db:migrate    # Run migrations
npm run db:seed       # Seed templates
npm run db:studio     # Prisma Studio GUI
```

---

**Repository**: https://github.com/Catskill909/tourstack
