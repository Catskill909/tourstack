#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."
echo "📂 Working directory: $(pwd)"

# Ensure data directory exists
mkdir -p data

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
