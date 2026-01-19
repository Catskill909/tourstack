// Database initialization script
// Creates the SQLite database file and runs migrations
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Use data directory for Docker volume compatibility
const dataDir = path.resolve(process.cwd(), 'data');
const dbPath = path.resolve(dataDir, 'dev.db');

console.log(`🔧 Initializing database at: ${dbPath}`);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  console.log('📁 Creating data directory...');
  fs.mkdirSync(dataDir, { recursive: true });
}

// Check if database already exists
if (fs.existsSync(dbPath)) {
  console.log('✅ Database file already exists');
} else {
  console.log('📦 Creating new database file...');

  // Create the database file using better-sqlite3 directly
  const db = new Database(dbPath);

  // Create the tables directly (matching Prisma schema)
  db.exec(`
    -- Museum table
    CREATE TABLE IF NOT EXISTS "Museum" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "branding" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Template table
    CREATE TABLE IF NOT EXISTS "Template" (
      "id" TEXT PRIMARY KEY,
      "museumId" TEXT,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "icon" TEXT NOT NULL DEFAULT '📍',
      "builtIn" INTEGER NOT NULL DEFAULT 0,
      "customFields" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE SET NULL
    );
    
    -- Tour table
    CREATE TABLE IF NOT EXISTS "Tour" (
      "id" TEXT PRIMARY KEY,
      "museumId" TEXT NOT NULL,
      "templateId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'draft',
      "title" TEXT NOT NULL DEFAULT '{}',
      "heroImage" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '{}',
      "languages" TEXT NOT NULL DEFAULT '["en"]',
      "primaryLanguage" TEXT NOT NULL DEFAULT 'en',
      "duration" INTEGER NOT NULL DEFAULT 30,
      "difficulty" TEXT NOT NULL DEFAULT 'general',
      "primaryPositioningMethod" TEXT NOT NULL DEFAULT 'qr_code',
      "backupPositioningMethod" TEXT,
      "accessibility" TEXT NOT NULL DEFAULT '{}',
      "publishedAt" DATETIME,
      "scheduledPublishAt" DATETIME,
      "version" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("museumId") REFERENCES "Museum"("id"),
      FOREIGN KEY ("templateId") REFERENCES "Template"("id")
    );
    
    -- Stop table
    CREATE TABLE IF NOT EXISTS "Stop" (
      "id" TEXT PRIMARY KEY,
      "tourId" TEXT NOT NULL,
      "order" INTEGER NOT NULL DEFAULT 0,
      "type" TEXT NOT NULL DEFAULT 'mandatory',
      "title" TEXT NOT NULL DEFAULT '{}',
      "image" TEXT NOT NULL DEFAULT '',
      "description" TEXT NOT NULL DEFAULT '{}',
      "customFieldValues" TEXT NOT NULL DEFAULT '{}',
      "primaryPositioning" TEXT NOT NULL DEFAULT '{}',
      "backupPositioning" TEXT,
      "triggers" TEXT NOT NULL DEFAULT '{}',
      "content" TEXT NOT NULL DEFAULT '[]',
      "interactive" TEXT,
      "links" TEXT NOT NULL DEFAULT '[]',
      "accessibility" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("tourId") REFERENCES "Tour"("id") ON DELETE CASCADE
    );
    
    -- Media table
    CREATE TABLE IF NOT EXISTS "Media" (
      "id" TEXT PRIMARY KEY,
      "museumId" TEXT,
      "filename" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "url" TEXT NOT NULL,
      "alt" TEXT,
      "caption" TEXT,
      "tags" TEXT,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE SET NULL
    );
    
    -- AppSettings table
    CREATE TABLE IF NOT EXISTS "AppSettings" (
      "id" TEXT PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Collection table
    CREATE TABLE IF NOT EXISTS "Collection" (
      "id" TEXT PRIMARY KEY,
      "museumId" TEXT,
      "name" TEXT NOT NULL DEFAULT '{}',
      "description" TEXT NOT NULL DEFAULT '{}',
      "items" TEXT NOT NULL DEFAULT '[]',
      "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("museumId") REFERENCES "Museum"("id") ON DELETE SET NULL
    );
  `);

  db.close();
  console.log('✅ Database tables created');
}

console.log('🎉 Database initialization complete!');
