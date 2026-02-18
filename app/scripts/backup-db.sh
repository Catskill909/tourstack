#!/bin/bash
# TourStack Database Backup Script
# Run this BEFORE any schema changes
# Usage: bash app/scripts/backup-db.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"

# Server reads from app/data/dev.db (primary)
# Prisma CLI reads from app/prisma/data/dev.db (secondary)
PRIMARY_DB="$APP_DIR/data/dev.db"
PRISMA_DB="$APP_DIR/prisma/data/dev.db"
BACKUP_DIR="$APP_DIR/data/backups"

if [ ! -f "$PRIMARY_DB" ]; then
    echo "ERROR: Primary database not found at $PRIMARY_DB"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create timestamped backup of PRIMARY (server) database
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/dev.db.bak-$TIMESTAMP"
cp "$PRIMARY_DB" "$BACKUP_PATH"

# Verify backup
if [ -f "$BACKUP_PATH" ]; then
    SIZE=$(ls -lh "$BACKUP_PATH" | awk '{print $5}')
    TOURS=$(sqlite3 "$BACKUP_PATH" "SELECT count(*) FROM Tour;" 2>/dev/null || echo "?")
    STOPS=$(sqlite3 "$BACKUP_PATH" "SELECT count(*) FROM Stop;" 2>/dev/null || echo "?")
    COLLECTIONS=$(sqlite3 "$BACKUP_PATH" "SELECT count(*) FROM Collection;" 2>/dev/null || echo "?")
    echo "✅ Backup created: $BACKUP_PATH ($SIZE)"
    echo "   Tours: $TOURS | Stops: $STOPS | Collections: $COLLECTIONS"
else
    echo "❌ ERROR: Backup failed!"
    exit 1
fi

# Also sync prisma copy from primary
if [ -f "$PRISMA_DB" ]; then
    cp "$PRIMARY_DB" "$PRISMA_DB"
    echo "✅ Synced prisma/data/dev.db from primary"
fi

# Keep only last 10 backups
ls -t "$BACKUP_DIR"/dev.db.bak-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null
echo "Done. (Keeping last 10 backups)"
