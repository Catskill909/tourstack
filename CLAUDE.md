# TourStack — Claude Code Instructions

## CRITICAL: Every Change Must Work in Production

TourStack runs locally (SQLite files) AND in production (Coolify Docker container with persistent volumes).
**Every database or data change MUST account for BOTH environments.**

- Local DB changes that skip the seed/migration files **WILL NOT reach production**.
- On 2026-03-16 we shipped a template that only existed locally because it wasn't added to `seed.ts`.
- On 2026-02-18 `prisma db push` destroyed all tour data in production.

**Before finishing any DB-related work, ask yourself:**
1. Will this change appear in production on the next deploy? (seed.ts, start.sh)
2. Could this change destroy existing production data? (NEVER use prisma db push)

---

## CRITICAL: Database Safety

**NEVER run `prisma db push`, `prisma migrate reset`, or `prisma migrate dev`.**
These commands can and WILL drop tables and destroy all data.

### Safe schema change procedure (columns):
1. Run `bash app/scripts/backup-db.sh` FIRST
2. Edit `app/prisma/schema.prisma`
3. Apply with raw SQL to BOTH local databases:
   ```
   sqlite3 app/data/dev.db "ALTER TABLE ... ADD COLUMN ...;"
   sqlite3 app/prisma/data/dev.db "ALTER TABLE ... ADD COLUMN ...;"
   ```
4. **Add the same ALTER TABLE to `app/scripts/start.sh`** so production gets it on next deploy
5. Regenerate types only: `cd app && npx prisma generate`
6. Verify: `sqlite3 app/data/dev.db "SELECT count(*) FROM Tour;"`

### Safe schema change procedure (new tables):
1. Run `bash app/scripts/backup-db.sh` FIRST
2. Edit `app/prisma/schema.prisma`
3. Apply with `CREATE TABLE IF NOT EXISTS ...` SQL to BOTH local databases
4. **Add the same CREATE TABLE to `app/scripts/start.sh`** so production gets it on next deploy
5. Regenerate types only: `cd app && npx prisma generate`

### Adding seed data (templates, default records):
1. **ALWAYS add to `app/prisma/seed.ts`** — this is the ONLY way data reaches production
2. NEVER insert data only into local SQLite — it will not exist in production
3. The seed runs automatically on every deploy via `app/scripts/start.sh`
4. Seeds must be idempotent (check if record exists before inserting)

### Database locations (TWO local copies must stay in sync!)
- **Server reads from: `app/data/dev.db`** (hardcoded in `app/server/db.ts`)
- Prisma CLI reads from: `app/prisma/data/dev.db` (via DATABASE_URL)
- Backup script: `app/scripts/backup-db.sh` (backs up + syncs both)

### Production deployment (Coolify)
- DB lives at `/app/data/dev.db` inside the container (persistent volume)
- `app/scripts/start.sh` runs on every deploy: safe migrations → seed → start server
- `start.sh` uses ALTER TABLE / CREATE TABLE IF NOT EXISTS (never prisma db push) for existing DBs
- `prisma db push` is ONLY used for brand-new installs (no existing database file)

---

## Project Structure
- Frontend: React + TypeScript + Vite in `app/src/`
- Backend: Express server in `app/server/`
- Run `tsc` from `app/` directory
