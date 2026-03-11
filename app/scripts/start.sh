#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"

# Ensure data directory exists
mkdir -p data

# Set DATABASE_URL - Docker volumes must mount to DIRECTORIES
# Coolify volume should be: /app/data (not /app/dev.db)
export DATABASE_URL="file:/app/data/dev.db"
echo "🔌 DATABASE_URL set to: $DATABASE_URL"

# Pre-migration: ensure shortCode column exists before prisma db push
# This prevents the unique constraint failure when the column doesn't exist yet
if [ -f /app/data/dev.db ]; then
  echo "🔧 Pre-migration: checking shortCode column..."
  # Add shortCode column if it doesn't exist (safe, no-op if already present)
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN shortCode TEXT;" 2>/dev/null || true
  # Add unique index if it doesn't exist
  sqlite3 /app/data/dev.db "CREATE UNIQUE INDEX IF NOT EXISTS Stop_shortCode_key ON Stop(shortCode);" 2>/dev/null || true
  echo "✅ Pre-migration complete"
fi

# Initialize database (safe schema push)
echo "🔄 Syncing database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
  echo "⚠️ prisma db push failed, retrying with --accept-data-loss..."
  npx prisma db push --accept-data-loss
  if [ $? -ne 0 ]; then
    echo "❌ Database sync failed even with --accept-data-loss!"
    exit 1
  fi
fi

# Seed database with templates (idempotent - skips if exists)
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts
if [ $? -ne 0 ]; then
  echo "❌ Database seeding failed!"
  exit 1
fi

# Verify database exists
ls -la ./data/dev.db 2>/dev/null && echo "✅ Database ready" || echo "❌ Database missing"

# Start the server
echo "🎯 Starting API server..."
exec tsx server/index.ts
