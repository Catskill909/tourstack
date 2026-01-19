#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"

# Ensure data directory exists
mkdir -p data

# Check if we need to reinitialize database (schema change)
# Remove this check after first successful deploy
if [ -f ./data/dev.db ]; then
  echo "🔄 Checking database schema..."
  # Check if Museum table has location column
  sqlite3 ./data/dev.db "SELECT location FROM Museum LIMIT 1" 2>/dev/null
  if [ $? -ne 0 ]; then
    echo "⚠️ Database schema outdated, rebuilding..."
    rm -f ./data/dev.db
  fi
fi

# Initialize database (creates file and tables if needed)
echo "🔧 Initializing database..."
npx tsx scripts/init-db.ts

# Seed database with templates
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

# Verify database exists
ls -la ./data/dev.db 2>/dev/null && echo "✅ Database ready" || echo "❌ Database missing"

# Start the server
echo "🎯 Starting API server..."
exec tsx server/index.ts
