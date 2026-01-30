// Media API Routes - File upload and management
import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import type { Media } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Type for route params
interface IdParams {
    id: string;
}

// Ensure upload directories exist
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const UPLOAD_DIRS = {
    images: path.join(UPLOAD_BASE, 'images'),
    audio: path.join(UPLOAD_BASE, 'audio'),
    documents: path.join(UPLOAD_BASE, 'documents'),
};

// Create directories if they don't exist
Object.values(UPLOAD_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer storage
const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
        // Determine folder based on mimetype
        let folder = UPLOAD_DIRS.documents;
        if (file.mimetype.startsWith('image/')) {
            folder = UPLOAD_DIRS.images;
        } else if (file.mimetype.startsWith('audio/')) {
            folder = UPLOAD_DIRS.audio;
        }
        cb(null, folder);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename with original extension
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max
    },
    fileFilter: (_req, file, cb) => {
        // Allow images, audio, and common document types
        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'audio/mpeg',
            'audio/mp3',
            'audio/wav',
            'audio/ogg',
            'audio/webm',
            'video/mp4',
            'video/webm',
            'application/pdf',
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} not allowed`));
        }
    },
});

// Helper to parse media
function parseMedia(m: Media) {
    return {
        ...m,
        tags: m.tags ? JSON.parse(m.tags) : [],
    };
}

// GET /api/media - List all media
router.get('/', async (_req: Request, res: Response) => {
    try {
        const media = await prisma.media.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json(media.map(parseMedia));
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// POST /api/media/sync - Sync existing files from uploads folder to database
router.post('/sync', async (_req: Request, res: Response) => {
    try {
        const results = { added: 0, skipped: 0, errors: 0 };

        // Get all existing URLs in database
        const existingMedia = await prisma.media.findMany({
            select: { url: true },
        });
        const existingUrls = new Set(existingMedia.map(m => m.url));

        // Scan directories and their mime types
        const directories = [
            { dir: UPLOAD_DIRS.images, urlPrefix: '/uploads/images', mimePrefix: 'image/' },
            { dir: UPLOAD_DIRS.audio, urlPrefix: '/uploads/audio', mimePrefix: 'audio/' },
            { dir: UPLOAD_DIRS.documents, urlPrefix: '/uploads/documents', mimePrefix: 'application/' },
        ];

        // Mime type mapping by extension
        const mimeTypes: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.ogg': 'audio/ogg',
            '.webm': 'audio/webm',
            '.mp4': 'video/mp4',
            '.pdf': 'application/pdf',
        };

        for (const { dir, urlPrefix, mimePrefix } of directories) {
            if (!fs.existsSync(dir)) continue;

            const files = fs.readdirSync(dir);
            for (const filename of files) {
                if (filename.startsWith('.')) continue; // Skip hidden files

                const filePath = path.join(dir, filename);
                const url = `${urlPrefix}/${filename}`;

                // Skip if already in database
                if (existingUrls.has(url)) {
                    results.skipped++;
                    continue;
                }

                try {
                    const stat = fs.statSync(filePath);
                    if (!stat.isFile()) continue;

                    const ext = path.extname(filename).toLowerCase();
                    let mimeType = mimeTypes[ext] || `${mimePrefix}octet-stream`;

                    // Create database entry
                    await prisma.media.create({
                        data: {
                            filename: filename,
                            mimeType,
                            size: stat.size,
                            url,
                            createdAt: stat.birthtime,
                            updatedAt: stat.mtime,
                        },
                    });
                    results.added++;
                } catch (err) {
                    console.error(`Error syncing file ${filename}:`, err);
                    results.errors++;
                }
            }
        }

        res.json({
            message: `Sync complete: ${results.added} added, ${results.skipped} already exist, ${results.errors} errors`,
            ...results,
        });
    } catch (error) {
        console.error('Error syncing media:', error);
        res.status(500).json({ error: 'Failed to sync media' });
    }
});

// POST /api/media - Upload file
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Determine URL path based on destination folder
        let urlPath: string;
        if (req.file.destination.includes('images')) {
            urlPath = `/uploads/images/${req.file.filename}`;
        } else if (req.file.destination.includes('audio')) {
            urlPath = `/uploads/audio/${req.file.filename}`;
        } else {
            urlPath = `/uploads/documents/${req.file.filename}`;
        }

        // Parse optional dimensions/duration from body
        const width = req.body.width ? parseInt(req.body.width, 10) : null;
        const height = req.body.height ? parseInt(req.body.height, 10) : null;
        const duration = req.body.duration ? parseFloat(req.body.duration) : null;

        // Save to database
        const media = await prisma.media.create({
            data: {
                filename: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                url: urlPath,
                width,
                height,
                duration,
                alt: req.body.alt || null,
                caption: req.body.caption || null,
                tags: req.body.tags ? JSON.stringify(JSON.parse(req.body.tags)) : null,
            },
        });

        res.status(201).json(parseMedia(media));
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// POST /api/media/upload - Quick upload that returns just the URL (for inline content)
// This endpoint does NOT save to database - just stores the file and returns URL
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        // Determine URL path based on destination folder
        let urlPath: string;
        if (req.file.destination.includes('images')) {
            urlPath = `/uploads/images/${req.file.filename}`;
        } else if (req.file.destination.includes('audio')) {
            urlPath = `/uploads/audio/${req.file.filename}`;
        } else {
            urlPath = `/uploads/documents/${req.file.filename}`;
        }

        // Return just the URL for quick use
        res.status(201).json({
            url: urlPath,
            filename: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// GET /api/media/:id - Get single media item
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id },
        });

        if (!media) {
            res.status(404).json({ error: 'Media not found' });
            return;
        }

        res.json(parseMedia(media));
    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({ error: 'Failed to fetch media' });
    }
});

// PUT /api/media/:id - Update media metadata
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const { alt, caption, tags } = req.body;

        const media = await prisma.media.update({
            where: { id: req.params.id },
            data: {
                alt: alt !== undefined ? alt : undefined,
                caption: caption !== undefined ? caption : undefined,
                tags: tags !== undefined ? JSON.stringify(tags) : undefined,
            },
        });

        res.json(parseMedia(media));
    } catch (error) {
        console.error('Error updating media:', error);
        res.status(500).json({ error: 'Failed to update media' });
    }
});

// GET /api/media/:id/usage - Find where media is used
router.get('/:id/usage', async (req: Request<IdParams>, res: Response) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id },
        });

        if (!media) {
            res.status(404).json({ error: 'Media not found' });
            return;
        }

        const mediaUrl = media.url;

        // Find tours using this media as hero image
        const toursWithHero = await prisma.tour.findMany({
            where: { heroImage: mediaUrl },
            select: { id: true, title: true, slug: true },
        });

        // Find stops with image containing URL (direct or JSON)
        const allStops = await prisma.stop.findMany({
            select: { id: true, title: true, slug: true, tourId: true, image: true, content: true },
        });

        // Get tour titles for stops
        const tourIds = [...new Set(allStops.map(s => s.tourId))];
        const tours = await prisma.tour.findMany({
            where: { id: { in: tourIds } },
            select: { id: true, title: true },
        });
        const tourTitleMap = new Map(tours.map(t => [t.id, t.title]));

        // Filter stops that use this media
        const stopsWithMedia = allStops.filter(stop => {
            // Check direct image field
            if (stop.image && stop.image.includes(mediaUrl)) {
                return true;
            }
            // Check content blocks (JSON string)
            if (stop.content && stop.content.includes(mediaUrl)) {
                return true;
            }
            return false;
        }).map(stop => {
            const usageType: 'image' | 'content' = stop.image?.includes(mediaUrl) ? 'image' : 'content';
            return {
                id: stop.id,
                title: JSON.parse(stop.title),
                slug: stop.slug,
                tourId: stop.tourId,
                tourTitle: tourTitleMap.get(stop.tourId) ? JSON.parse(tourTitleMap.get(stop.tourId)!) : undefined,
                usageType,
            };
        });

        res.json({
            tours: toursWithHero.map(t => ({
                id: t.id,
                title: JSON.parse(t.title),
                slug: t.slug,
                usageType: 'heroImage' as const,
            })),
            stops: stopsWithMedia,
        });
    } catch (error) {
        console.error('Error fetching media usage:', error);
        res.status(500).json({ error: 'Failed to fetch media usage' });
    }
});

// DELETE /api/media/bulk - Bulk delete media items
router.delete('/bulk', async (req: Request, res: Response) => {
    try {
        const { ids } = req.body as { ids: string[] };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: 'No IDs provided' });
            return;
        }

        // Get all media items to delete
        const mediaItems = await prisma.media.findMany({
            where: { id: { in: ids } },
        });

        // Delete physical files
        for (const media of mediaItems) {
            const filePath = path.join(UPLOAD_BASE, '..', media.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete from database
        await prisma.media.deleteMany({
            where: { id: { in: ids } },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error bulk deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media items' });
    }
});

// PUT /api/media/bulk/tags - Bulk add or replace tags
router.put('/bulk/tags', async (req: Request, res: Response) => {
    try {
        const { ids, tags, mode } = req.body as { ids: string[]; tags: string[]; mode: 'add' | 'replace' };

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ error: 'No IDs provided' });
            return;
        }

        if (!tags || !Array.isArray(tags)) {
            res.status(400).json({ error: 'No tags provided' });
            return;
        }

        if (mode === 'replace') {
            // Replace all tags
            await prisma.media.updateMany({
                where: { id: { in: ids } },
                data: { tags: JSON.stringify(tags) },
            });
        } else {
            // Add tags (merge with existing)
            const mediaItems = await prisma.media.findMany({
                where: { id: { in: ids } },
            });

            for (const media of mediaItems) {
                const existingTags = media.tags ? JSON.parse(media.tags) : [];
                const mergedTags = [...new Set([...existingTags, ...tags])];
                await prisma.media.update({
                    where: { id: media.id },
                    data: { tags: JSON.stringify(mergedTags) },
                });
            }
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error bulk updating tags:', error);
        res.status(500).json({ error: 'Failed to update tags' });
    }
});

// DELETE /api/media/:id - Delete file
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const media = await prisma.media.findUnique({
            where: { id: req.params.id },
        });

        if (!media) {
            res.status(404).json({ error: 'Media not found' });
            return;
        }

        // Delete physical file
        const filePath = path.join(UPLOAD_BASE, '..', media.url);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await prisma.media.delete({
            where: { id: req.params.id },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

export default router;
