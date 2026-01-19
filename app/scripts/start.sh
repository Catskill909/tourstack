#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"
echo "📄 Database path: $(pwd)/dev.db"

# Create the database file if it doesn't exist
# better-sqlite3 needs the file to exist
if [ ! -f ./dev.db ]; then
  echo "📦 Creating empty database file..."
  touch ./dev.db
  chmod 666 ./dev.db
fi

# Seed database with templates
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts || echo "⚠️ Seed had issues, continuing..."

# Verify database exists
if [ -f ./dev.db ]; then
  echo "✅ Database file exists: $(ls -la ./dev.db)"
else
  echo "❌ Database file missing!"
fi

# Start the server
echo "🎯 Starting API server..."
exec tsx server/index.ts
