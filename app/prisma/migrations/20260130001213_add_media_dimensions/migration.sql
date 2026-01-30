-- AlterTable
ALTER TABLE "Media" ADD COLUMN "duration" REAL;
ALTER TABLE "Media" ADD COLUMN "height" INTEGER;
ALTER TABLE "Media" ADD COLUMN "width" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stop" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "tourId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'mandatory',
    "title" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "customFieldValues" TEXT NOT NULL,
    "primaryPositioning" TEXT NOT NULL,
    "backupPositioning" TEXT,
    "triggers" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "interactive" TEXT,
    "links" TEXT NOT NULL,
    "accessibility" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stop_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "Tour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stop" ("accessibility", "backupPositioning", "content", "createdAt", "customFieldValues", "description", "id", "image", "interactive", "links", "order", "primaryPositioning", "slug", "title", "tourId", "triggers", "type", "updatedAt") SELECT "accessibility", "backupPositioning", "content", "createdAt", "customFieldValues", "description", "id", "image", "interactive", "links", "order", "primaryPositioning", "slug", "title", "tourId", "triggers", "type", "updatedAt" FROM "Stop";
DROP TABLE "Stop";
ALTER TABLE "new_Stop" RENAME TO "Stop";
CREATE INDEX "Stop_tourId_idx" ON "Stop"("tourId");
CREATE TABLE "new_Tour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT,
    "museumId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "heroImage" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "languages" TEXT NOT NULL,
    "primaryLanguage" TEXT NOT NULL DEFAULT 'en',
    "duration" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'general',
    "defaultTranslationProvider" TEXT NOT NULL DEFAULT 'libretranslate',
    "primaryPositioningMethod" TEXT NOT NULL,
    "backupPositioningMethod" TEXT,
    "accessibility" TEXT NOT NULL,
    "publishedAt" DATETIME,
    "scheduledPublishAt" DATETIME,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tour_museumId_fkey" FOREIGN KEY ("museumId") REFERENCES "Museum" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Tour_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tour" ("accessibility", "backupPositioningMethod", "createdAt", "defaultTranslationProvider", "description", "difficulty", "duration", "heroImage", "id", "languages", "museumId", "primaryLanguage", "primaryPositioningMethod", "publishedAt", "scheduledPublishAt", "slug", "status", "templateId", "title", "updatedAt", "version") SELECT "accessibility", "backupPositioningMethod", "createdAt", "defaultTranslationProvider", "description", "difficulty", "duration", "heroImage", "id", "languages", "museumId", "primaryLanguage", "primaryPositioningMethod", "publishedAt", "scheduledPublishAt", "slug", "status", "templateId", "title", "updatedAt", "version" FROM "Tour";
DROP TABLE "Tour";
ALTER TABLE "new_Tour" RENAME TO "Tour";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
