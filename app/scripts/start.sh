#!/bin/sh
# Startup script for TourStack production container

set -e  # Exit on any error

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"
echo "📄 Database path: $(pwd)/dev.db"

# Check if database exists, if not create it via migration
if [ ! -f ./dev.db ]; then
  echo "📦 Database not found, running initial setup..."
  npx prisma migrate deploy --schema=./prisma/schema.prisma || true
fi

# Seed database with templates
echo "🌱 Seeding database..."
npx tsx prisma/seed.ts

# Verify seed worked
echo "✅ Database setup complete"

# Start the server
echo "🎯 Starting API server..."
exec tsx server/index.ts
