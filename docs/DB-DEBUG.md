# TourStack Production Database Debug Document

**Created**: January 19, 2026  
**Issue**: `SQLITE_CANTOPEN` error in production Docker deployment

---

## The Problem

When deployed to Coolify/Docker, the Express API returns 500 errors because Prisma cannot open the SQLite database:

```
code: 'SQLITE_CANTOPEN'
unable to open database file
```

This works **perfectly in local development** but fails in Docker production.

---

## Root Cause Analysis

### Evidence from Logs

```
✅ Database file already exists   ← init-db thinks file exists
🌱 Seeding database...
❌ Seeding error: SQLITE_CANTOPEN  ← But Prisma can't open it

ls -la ./dev.db output:
drw-rw-rw-    2 root root 4096 ...   ← THIS IS A DIRECTORY NOT A FILE!
```

### The Real Issue

**Coolify/Docker volume mount is creating `/app/dev.db` as a DIRECTORY, not allowing a file.**

When you mount a Docker volume to a path like `/app/dev.db`:
- If the file doesn't exist, Docker creates an **empty directory** at that path
- The application then can't create a file there because it's a directory
- SQLite fails with `SQLITE_CANTOPEN`

---

## Attempted Fixes (All Failed)

1. ❌ Using `touch ./dev.db` to create file first
2. ❌ Using `better-sqlite3` directly to create database
3. ❌ Different path configurations (`__dirname` vs `process.cwd()`)
4. ❌ Changed startup scripts multiple times

All fail because the volume mount creates a directory, not a file.

---

## The Solution

### Option A: Mount a DIRECTORY, not a file

Instead of mounting to `/app/dev.db`, mount to `/app/data`:

**In Coolify Volume Settings:**
| Name | Destination Path |
|------|------------------|
| `tourstack-data` | `/app/data` |

**Then update code to use `/app/data/dev.db`:**

1. `server/db.ts`:
```typescript
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
```

2. `prisma/seed.ts`:
```typescript
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
```

3. `scripts/init-db.ts`:
```typescript
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
```

4. `Dockerfile`:
```dockerfile
RUN mkdir -p data uploads/images uploads/audio uploads/documents
```

### Option B: Remove the database volume mount entirely

Just mount `/app/uploads` and let the database be ephemeral (recreated on each deploy).

For development/demo this is fine. For production with real data, use Option A.

---

## Key Files to Modify

| File | Change |
|------|--------|
| `app/server/db.ts` | Change dbPath to `data/dev.db` |
| `app/prisma/seed.ts` | Change dbPath to `data/dev.db` |
| `app/scripts/init-db.ts` | Change dbPath to `data/dev.db` |
| `Dockerfile` | Add `mkdir -p data` |
| Coolify | Change volume mount from `/app/dev.db` to `/app/data` |

---

## Quick Test

After making changes:

1. In Coolify, **remove** the existing `/app/dev.db` volume mount
2. Add new volume: Destination Path = `/app/data`
3. Redeploy

The container should now be able to create `/app/data/dev.db` as a file.

---

## Technical Details

### Stack
- Express.js 5.x
- Prisma 7.2.0 with `@prisma/adapter-better-sqlite3`
- better-sqlite3 12.x
- SQLite database
- Docker (node:20-alpine)
- Coolify deployment

### Working Local Setup
```bash
cd app
npm run db:seed    # Creates dev.db and seeds templates
npm run dev:all    # Runs Vite + Express
```

### Database Path Configuration
Currently using: `path.resolve(process.cwd(), 'dev.db')` = `/app/dev.db`
Should change to: `path.resolve(process.cwd(), 'data', 'dev.db')` = `/app/data/dev.db`
