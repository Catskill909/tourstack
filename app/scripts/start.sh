#!/bin/sh
# Startup script for TourStack production container

echo "🚀 Starting TourStack..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy 2>/dev/null || echo "No migrations to run or first time setup"

# Seed database if templates don't exist
echo "🌱 Checking if seed needed..."
npx tsx prisma/seed.ts 2>/dev/null || echo "Seed already exists or completed"

# Start the server
echo "🎯 Starting API server..."
exec tsx server/index.ts
