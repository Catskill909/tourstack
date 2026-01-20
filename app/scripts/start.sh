#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"

# Ensure data directory exists
mkdir -p data

# Set DATABASE_URL to use the persistent volume
# This ensures migrations and the app use the same file!
export DATABASE_URL="file:/app/data/dev.db"
echo "🔌 DATABASE_URL set to: $DATABASE_URL"

# Initialize database (safe schema push)
echo "🔄 Syncing database schema..."
npx prisma db push
if [ $? -ne 0 ]; then
  echo "❌ Database sync failed!"
  exit 1
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
