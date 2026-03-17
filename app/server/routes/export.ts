// Tour Export API — Package tour data + media as a downloadable ZIP
import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import archiver from 'archiver';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Helper to parse JSON fields from the database
function parseStop(stop: any) {
    return {
        ...stop,
        title: JSON.parse(stop.title),
        description: JSON.parse(stop.description),
        content: JSON.parse(stop.content),
        contentBlocks: JSON.parse(stop.content),
        customFieldValues: JSON.parse(stop.customFieldValues),
        primaryPositioning: JSON.parse(stop.primaryPositioning),
        backupPositioning: stop.backupPositioning ? JSON.parse(stop.backupPositioning) : null,
        triggers: JSON.parse(stop.triggers),
        interactive: stop.interactive ? JSON.parse(stop.interactive) : null,
        links: JSON.parse(stop.links),
        accessibility: JSON.parse(stop.accessibility),
    };
}

function parseTour(tour: any) {
    return {
        ...tour,
        title: JSON.parse(tour.title),
        description: JSON.parse(tour.description),
        languages: JSON.parse(tour.languages),
        accessibility: JSON.parse(tour.accessibility),
        conciergeWelcome: tour.conciergeWelcome ? JSON.parse(tour.conciergeWelcome) : null,
        conciergeQuickActions: tour.conciergeQuickActions ? JSON.parse(tour.conciergeQuickActions) : [],
        stops: tour.stops.map(parseStop),
    };
}

// Collect all media URLs referenced in tour data
function collectMediaUrls(tourData: any): Set<string> {
    const urls = new Set<string>();

    function scanValue(val: any) {
        if (!val) return;
        if (typeof val === 'string') {
            // Match /uploads/... paths
            if (val.startsWith('/uploads/')) {
                urls.add(val);
            }
            return;
        }
        if (Array.isArray(val)) {
            val.forEach(scanValue);
            return;
        }
        if (typeof val === 'object') {
            Object.values(val).forEach(scanValue);
        }
    }

    // Scan tour-level fields
    scanValue(tourData.heroImage);
    scanValue(tourData.description);

    // Scan all stops
    for (const stop of tourData.stops) {
        scanValue(stop.image);
        scanValue(stop.description);
        scanValue(stop.content);
        scanValue(stop.contentBlocks);
        scanValue(stop.customFieldValues);
    }

    return urls;
}

// Rewrite /uploads/... URLs to ./media/... in the tour data
function rewriteUrls(data: any, urlMap: Map<string, string>): any {
    if (!data) return data;
    if (typeof data === 'string') {
        return urlMap.get(data) || data;
    }
    if (Array.isArray(data)) {
        return data.map(item => rewriteUrls(item, urlMap));
    }
    if (typeof data === 'object') {
        const result: any = {};
        for (const [key, val] of Object.entries(data)) {
            result[key] = rewriteUrls(val, urlMap);
        }
        return result;
    }
    return data;
}

// GET /api/export/:tourId — Download tour as ZIP
router.get('/:tourId', async (req: Request, res: Response) => {
    try {
        const tourId = req.params.tourId as string;

        // Find tour by slug or ID
        let tour = await prisma.tour.findFirst({
            where: { slug: tourId },
            include: { stops: { orderBy: { order: 'asc' } } },
        });
        if (!tour) {
            tour = await prisma.tour.findUnique({
                where: { id: tourId as string },
                include: { stops: { orderBy: { order: 'asc' } } },
            });
        }
        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        const tourData = parseTour(tour);
        const uploadsDir = path.join(__dirname, '../../uploads');

        // Collect all referenced media URLs
        const mediaUrls = collectMediaUrls(tourData);

        // Build URL rewrite map: /uploads/images/abc.jpg → ./media/images/abc.jpg
        const urlMap = new Map<string, string>();
        for (const url of mediaUrls) {
            const relativePath = url.replace(/^\/uploads\//, '');
            urlMap.set(url, `./media/${relativePath}`);
        }

        // Rewrite URLs in tour data
        const rewrittenTour = rewriteUrls(tourData, urlMap);

        // Create slug for filename
        const slug = tourData.slug || tourData.id;
        const filename = `tourstack-${slug}.zip`;

        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Create ZIP archive
        const archive = archiver('zip', { zlib: { level: 6 } });
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Failed to create archive' });
            }
        });
        archive.pipe(res);

        // Add tour data JSON
        archive.append(JSON.stringify(rewrittenTour, null, 2), { name: 'data/tour.json' });

        // Add media files
        for (const url of mediaUrls) {
            const relativePath = url.replace(/^\/uploads\//, '');
            const filePath = path.join(uploadsDir, relativePath);

            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `media/${relativePath}` });
            } else {
                console.warn(`Export: media file not found: ${filePath}`);
            }
        }

        // Add a simple manifest
        const manifest = {
            version: 1,
            exportedAt: new Date().toISOString(),
            tourId: tourData.id,
            tourSlug: tourData.slug,
            tourTitle: tourData.title,
            languages: tourData.languages,
            stopCount: tourData.stops.length,
            mediaFiles: Array.from(mediaUrls).map(url => url.replace(/^\/uploads\//, 'media/')),
        };
        archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

        await archive.finalize();

    } catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to export tour' });
        }
    }
});

export default router;
