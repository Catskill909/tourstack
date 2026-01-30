# 🚀 TourStack Coolify Deployment Guide

## ⚠️ CRITICAL CONFIGURATION

### Volume Mounts (MUST BE CORRECT)

| Volume | Container Path | Purpose |
|--------|----------------|---------|
| **Database** | `/app/data` | SQLite database persistence |
| **Uploads** | `/app/uploads` | User-uploaded media files |

> [!CAUTION]
> **NEVER mount to `/app/dev.db`!** Docker volumes create DIRECTORIES, not files.
> Always mount to `/app/data` (the directory containing `dev.db`).

---

## ⚠️ Volume Mount Behavior (READ THIS!)

> [!IMPORTANT]
> **Volume mounts start EMPTY on first deployment!**
>
> Coolify volumes are persistent directories that preserve data across redeploys. However, they do **NOT** copy files from your local machine or container image. They start as empty directories.

| What Happens | First Deploy | Subsequent Deploys |
|--------------|--------------|-------------------|
| `/app/uploads` | Empty directory | Preserves uploaded files |
| `/app/data` | Empty (new DB created) | Preserves database |

**This means:**
- Media Library will be empty on first deploy (no files to show)
- Database tables exist but have no content (except seeded templates)
- Upload files directly through the production UI to populate

---

## 🔧 Coolify Setup Checklist

### 1. Repository Settings
- **Build Pack:** Dockerfile
- **Dockerfile Location:** `Dockerfile` (root)
- **Branch:** `main`

### 2. Persistent Volumes (CRITICAL!)

In Coolify → Storages → Volumes, add these **two volumes**:

```
Volume 1: /app/uploads
Volume 2: /app/data
```

**Verify both are set before first deployment!**

### 3. Environment Variables

Add these in Coolify's **Environment Variables** section:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `file:./data/dev.db` |
| `DEEPGRAM_API_KEY` | Optional | Deepgram Aura-2 TTS (text-to-speech) |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs premium TTS |
| `GOOGLE_MAPS_API_KEY` | Optional | Google Maps for premium maps |
| `GEMINI_API_KEY` | Optional | AI Image Analysis in Media Library |

> **Note:** Environment variables override any settings saved via the Settings UI.

**LibreTranslate (if self-hosted):**

If running LibreTranslate as a separate Coolify service:

```
LT_LOAD_ONLY=en,es,fr,de,ja,it,ko,zh,pt
```

Notes:
- Loading more languages increases memory usage
- Dutch (nl) is NOT supported by LibreTranslate

---

## ✅ Deployment Verification

After deploying, check the logs for these success indicators:

```
✅ Good signs:
🔌 DATABASE_URL set to: file:/app/data/dev.db
⏭ Template already exists: QR Code     ← Data preserved!
✅ Database ready
🚀 TourStack API server running

❌ Bad signs:
SQLite database dev.db created at...   ← NEW db created, data LOST!
✓ Created template: QR Code            ← Should be "already exists"
```

---

## 🚨 Troubleshooting

### "P1013: Invalid database string"
- **Cause:** Volume mounted to file path (`/app/dev.db`) instead of directory
- **Fix:** Change Coolify volume to mount to `/app/data`

### "Database sync failed" / OpenSSL errors
- **Cause:** Missing system dependencies
- **Fix:** Ensure Dockerfile has `apk add --no-cache openssl sqlite`

### Data missing after deploy
- **Cause:** Volume not mounted or mounted to wrong path
- **Fix:** Verify Coolify storages show `/app/data` and `/app/uploads`

### Media Library shows empty (no errors)
- **Cause:** Volume mounts start empty on first deploy - this is expected
- **Fix:** Upload files directly through the Media Library page, or click Sync if files exist in `/uploads`

---

## 📁 File Structure in Container

```
/app/
├── data/
│   └── dev.db          ← SQLite database (PERSISTENT)
├── uploads/
│   ├── images/         ← User uploads (PERSISTENT)
│   ├── audio/
│   └── documents/
├── dist/               ← Built frontend
├── server/             ← API server code
└── prisma/             ← Schema & migrations
```

---

## 🔒 Database Safety Rules

1. **NEVER** use `prisma migrate reset` in production
2. **ALWAYS** use `prisma db push` for schema changes
3. **NEVER** delete or modify `/app/data/dev.db` manually
4. Seed script is **idempotent** - safe to run repeatedly

---

## 📷 Media Library on Production

### First Time Setup

After first deployment, the Media Library (`/media`) will be empty. To populate it:

1. **Upload directly** - Use the Upload button on the Media Library page
2. **Sync existing files** - If files were uploaded via tour/stop editors, click **Sync** button

### Sync Feature

The Sync button scans `/app/uploads` and creates database entries for any files not already tracked:

```bash
# API endpoint (can also call directly)
curl -X POST https://your-site.com/api/media/sync
```

Returns:
```json
{
  "message": "Sync complete: 53 added, 1 already exist, 0 errors",
  "added": 53,
  "skipped": 1,
  "errors": 0
}
```

### Required Environment Variable

For AI Image Analysis features, add:

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Optional | Enables AI analysis (tags, description, colors, OCR) |
