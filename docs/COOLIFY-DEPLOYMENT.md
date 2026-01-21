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
TourStack does not require environment variables for core operation (configuration is in the Dockerfile).

If you are running **LibreTranslate** as a separate Coolify service, it requires environment variables for which languages to load.

Example:

```
LT_LOAD_ONLY=en,es,fr,de,ja,it,ko,zh,pt
```

Notes:

- Loading more languages/models increases memory usage.
- If a language is enabled in TourStack but not loaded in LibreTranslate, translations may fail (400) and appear to fall back to English.

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
