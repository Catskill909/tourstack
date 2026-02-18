# TourStack — Claude Code Instructions

## CRITICAL: Database Safety

**NEVER run `prisma db push`, `prisma migrate reset`, or `prisma migrate dev`.**
These commands can and WILL drop tables and destroy all data.

### Safe schema change procedure:
1. Run `bash app/scripts/backup-db.sh` FIRST
2. Edit `app/prisma/schema.prisma`
3. Apply with raw SQL to BOTH databases:
   ```
   sqlite3 app/data/dev.db "ALTER TABLE ... ADD COLUMN ...;"
   sqlite3 app/prisma/data/dev.db "ALTER TABLE ... ADD COLUMN ...;"
   ```
4. Regenerate types only: `cd app && npx prisma generate`
5. Verify: `sqlite3 app/data/dev.db "SELECT count(*) FROM Tour;"`

### Database locations (TWO copies must stay in sync!)
- **Server reads from: `app/data/dev.db`** (hardcoded in `app/server/db.ts`)
- Prisma CLI reads from: `app/prisma/data/dev.db` (via DATABASE_URL)
- Backup script: `app/scripts/backup-db.sh` (backs up + syncs both)

## Project Structure
- Frontend: React + TypeScript + Vite in `app/src/`
- Backend: Express server in `app/server/`
- Run `tsc` from `app/` directory
