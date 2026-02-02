# AI Concierge Bug Audit

## Problem
`/api/concierge/config` returns **500 Internal Server Error**

## Browser Error (reported 5+ times)
```
api/concierge/config:1  Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Concierge.tsx:72 Failed to load concierge config: Error: Failed to get config
```

## Audit Log

### Attempt 1: Check actual server error
- Need to see what error is being thrown in the catch block
- Added `details: String(error)` to response but user still sees generic 500

---

## ROOT CAUSE FOUND ✅

**The ConciergeConfig, ConciergeKnowledge, and ConciergeQuickAction tables do NOT exist in the database.**

### Evidence
```bash
sqlite3 data/dev.db ".tables"
# Output:
AppSettings         Media               Stop                Tour
Collection          Museum              Template            _prisma_migrations
```

The schema.prisma has the models defined (lines 224-286), but `prisma db push` was never run after adding them, so the actual database tables were never created.

### Fix
```bash
cd app && npx prisma db push
```

This will create the missing tables:
- ConciergeConfig
- ConciergeKnowledge
- ConciergeQuickAction

**Note:** If `prisma db push` says "already in sync" but tables are missing, create them manually with SQL (see below).

### Manual SQL Fix (if prisma db push fails)
```sql
-- Create ConciergeConfig table
CREATE TABLE IF NOT EXISTS "ConciergeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "museumId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "persona" TEXT NOT NULL DEFAULT 'friendly',
    "customPersona" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT '{}',
    "primaryLanguage" TEXT NOT NULL DEFAULT 'en',
    "enabledLanguages" TEXT NOT NULL DEFAULT '["en"]',
    "autoTranslate" BOOLEAN NOT NULL DEFAULT true,
    "showNewChat" BOOLEAN NOT NULL DEFAULT true,
    "showSources" BOOLEAN NOT NULL DEFAULT false,
    "allowFeedback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create ConciergeKnowledge table
CREATE TABLE IF NOT EXISTS "ConciergeKnowledge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "characterCount" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ConciergeKnowledge_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ConciergeConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create ConciergeQuickAction table
CREATE TABLE IF NOT EXISTS "ConciergeQuickAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConciergeQuickAction_configId_fkey" FOREIGN KEY ("configId") REFERENCES "ConciergeConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

### Verification
```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/concierge/config
# Returns: {"id":"...","enabled":false,"persona":"friendly",...}
```

## Status: ✅ FIXED

---

## Deep Dive Investigation
