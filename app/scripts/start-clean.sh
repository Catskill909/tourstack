#!/bin/bash
# TourStack Development Server - Clean Start Script
# This script ensures all zombie processes are killed before starting

echo "🧹 Cleaning up zombie processes..."

# Kill any processes on port 5173 (Vite)
lsof -ti :5173 | xargs kill -9 2>/dev/null || true

# Kill any processes on port 3000 (Express API)
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Kill any node processes running vite or tsx
pkill -f "node.*vite" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true

echo "✅ Cleanup complete"
echo "🚀 Starting TourStack development servers..."
echo ""

# Wait a moment for ports to free up
sleep 2

# Start both servers (Vite + Express)
npm run dev:all
