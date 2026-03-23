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

# Safe schema migrations using ALTER TABLE (NEVER use prisma db push - it can drop tables!)
# Each migration is idempotent: errors are suppressed if column/index already exists.
if [ -f /app/data/dev.db ]; then
  echo "🔧 Running safe schema migrations..."

  # Stop table migrations
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN shortCode TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "CREATE UNIQUE INDEX IF NOT EXISTS Stop_shortCode_key ON Stop(shortCode);" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN slug TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN showTitle INTEGER DEFAULT 1;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN showImage INTEGER DEFAULT 1;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Stop ADD COLUMN showDescription INTEGER DEFAULT 1;" 2>/dev/null || true

  # Tour table migrations
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN slug TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN defaultTranslationProvider TEXT DEFAULT 'google_cloud';" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeEnabled INTEGER DEFAULT 1;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergePersona TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeWelcome TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeCollections TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeQuickActions TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeChatIcon TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeChatIconBgColor TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN conciergeChatIconColor TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Tour ADD COLUMN scheduledPublishAt DATETIME;" 2>/dev/null || true

  # Media table migrations
  sqlite3 /app/data/dev.db "ALTER TABLE Media ADD COLUMN aiMetadata TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Media ADD COLUMN aiTranslations TEXT;" 2>/dev/null || true

  # Collection table migrations
  sqlite3 /app/data/dev.db "ALTER TABLE Collection ADD COLUMN sourceLanguage TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Collection ADD COLUMN texts TEXT;" 2>/dev/null || true
  sqlite3 /app/data/dev.db "ALTER TABLE Collection ADD COLUMN ttsSettings TEXT;" 2>/dev/null || true

  # ConciergeConfig table (create if not exists)
  sqlite3 /app/data/dev.db "CREATE TABLE IF NOT EXISTS ConciergeConfig (
    id TEXT PRIMARY KEY NOT NULL,
    museumId TEXT,
    enabled INTEGER NOT NULL DEFAULT 0,
    persona TEXT NOT NULL DEFAULT 'friendly',
    customPersona TEXT,
    welcomeMessage TEXT NOT NULL DEFAULT '{}',
    primaryLanguage TEXT NOT NULL DEFAULT 'en',
    enabledLanguages TEXT NOT NULL DEFAULT '[\"en\"]',
    autoTranslate INTEGER NOT NULL DEFAULT 1,
    showNewChat INTEGER NOT NULL DEFAULT 1,
    showSources INTEGER NOT NULL DEFAULT 0,
    allowFeedback INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );" 2>/dev/null || true

  # ConciergeKnowledge table (create if not exists)
  sqlite3 /app/data/dev.db "CREATE TABLE IF NOT EXISTS ConciergeKnowledge (
    id TEXT PRIMARY KEY NOT NULL,
    configId TEXT NOT NULL,
    sourceType TEXT NOT NULL,
    sourceId TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    characterCount INTEGER NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    priority INTEGER NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (configId) REFERENCES ConciergeConfig(id) ON DELETE CASCADE
  );" 2>/dev/null || true
  sqlite3 /app/data/dev.db "CREATE INDEX IF NOT EXISTS ConciergeKnowledge_configId_idx ON ConciergeKnowledge(configId);" 2>/dev/null || true

  # ConciergeQuickAction table (create if not exists)
  sqlite3 /app/data/dev.db "CREATE TABLE IF NOT EXISTS ConciergeQuickAction (
    id TEXT PRIMARY KEY NOT NULL,
    configId TEXT NOT NULL,
    question TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT,
    \"order\" INTEGER NOT NULL DEFAULT 0,
    enabled INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (configId) REFERENCES ConciergeConfig(id) ON DELETE CASCADE
  );" 2>/dev/null || true
  sqlite3 /app/data/dev.db "CREATE INDEX IF NOT EXISTS ConciergeQuickAction_configId_idx ON ConciergeQuickAction(configId);" 2>/dev/null || true

  echo "✅ Schema migrations complete"
else
  # Fresh install - no existing DB, use prisma db push to create all tables from scratch
  echo "🆕 No existing database found. Creating fresh database..."
  npx prisma db push
  if [ $? -ne 0 ]; then
    echo "❌ Failed to create database!"
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
