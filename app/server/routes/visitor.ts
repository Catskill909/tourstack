// Visitor API Routes - Public endpoints for visitor-facing pages
// Supports lookup by slug (readable URLs) or ID (legacy/fallback)
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Tour, Stop } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';
import crypto from 'crypto';

const router = Router();

// Type for tour with stops included
type TourWithStops = Tour & { stops: Stop[] };

// Helper to parse stop JSON fields
function parseStop(stop: Stop) {
    const content = JSON.parse(stop.content);

    // Parse image field - handle both old string format and new object format
    let parsedImage: unknown;
    try {
        parsedImage = typeof stop.image === 'string' && stop.image.startsWith('{')
            ? JSON.parse(stop.image)
            : stop.image;
    } catch {
        parsedImage = stop.image;
    }

    return {
        ...stop,
        title: JSON.parse(stop.title),
        image: parsedImage,
        description: JSON.parse(stop.description),
        content: content,
        contentBlocks: content,
        customFieldValues: JSON.parse(stop.customFieldValues),
        primaryPositioning: JSON.parse(stop.primaryPositioning),
        backupPositioning: stop.backupPositioning ? JSON.parse(stop.backupPositioning) : null,
        triggers: JSON.parse(stop.triggers),
        interactive: stop.interactive ? JSON.parse(stop.interactive) : null,
        links: JSON.parse(stop.links),
        accessibility: JSON.parse(stop.accessibility),
    };
}

// Helper to parse tour JSON fields
function parseTour(tour: TourWithStops) {
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

// GET /api/visitor/tour/:tourSlugOrId - Get tour by slug or ID
router.get('/tour/:tourSlugOrId', async (req: Request, res: Response) => {
    try {
        const tourSlugOrId = req.params.tourSlugOrId as string;

        // Try to find by slug first, then by ID
        let tour = await prisma.tour.findFirst({
            where: { slug: tourSlugOrId },
            include: { stops: { orderBy: { order: 'asc' } } },
        });

        if (!tour) {
            // Fallback to ID lookup
            tour = await prisma.tour.findUnique({
                where: { id: tourSlugOrId },
                include: { stops: { orderBy: { order: 'asc' } } },
            });
        }

        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        res.json(parseTour(tour));
    } catch (error) {
        console.error('Error fetching tour:', error);
        res.status(500).json({ error: 'Failed to fetch tour' });
    }
});

// GET /api/visitor/tour/:tourSlugOrId/stop/:stopSlugOrId - Get specific stop
router.get('/tour/:tourSlugOrId/stop/:stopSlugOrId', async (req: Request, res: Response) => {
    try {
        const tourSlugOrId = req.params.tourSlugOrId as string;
        const stopSlugOrId = req.params.stopSlugOrId as string;

        // Find tour first
        let tour = await prisma.tour.findFirst({
            where: { slug: tourSlugOrId },
            include: { stops: { orderBy: { order: 'asc' } } },
        });

        if (!tour) {
            tour = await prisma.tour.findUnique({
                where: { id: tourSlugOrId },
                include: { stops: { orderBy: { order: 'asc' } } },
            });
        }

        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        // Find stop by slug or ID
        let stop = tour.stops.find(s => s.slug === stopSlugOrId);
        if (!stop) {
            stop = tour.stops.find(s => s.id === stopSlugOrId);
        }

        if (!stop) {
            res.status(404).json({ error: 'Stop not found' });
            return;
        }

        // Log visit analytics (non-blocking)
        const trackingToken = req.query.t as string | undefined;
        const source = req.query.src as string | undefined;
        if (trackingToken || source) {
            prisma.visitLog.create({
                data: {
                    id: crypto.randomUUID(),
                    stopId: stop.id,
                    tourId: tour.id,
                    token: trackingToken || null,
                    source: source || null,
                    timestamp: new Date(),
                    userAgent: req.headers['user-agent'] || null,
                },
            }).catch(() => { }); // Don't fail the request on analytics error
        }

        // Return both tour info and stop data
        res.json({
            tour: parseTour({ ...tour, stops: [] }),
            stop: parseStop(stop),
            allStops: tour.stops.map(parseStop),
        });
    } catch (error) {
        console.error('Error fetching stop:', error);
        res.status(500).json({ error: 'Failed to fetch stop' });
    }
});

// GET /api/visitor/tour/:tourSlugOrId/stop/:stopSlugOrId/info - Lightweight stop info (for QR scanner info popup)
router.get('/tour/:tourSlugOrId/stop/:stopSlugOrId/info', async (req: Request, res: Response) => {
    try {
        const tourSlugOrId = req.params.tourSlugOrId as string;
        const stopSlugOrId = req.params.stopSlugOrId as string;

        let tour = await prisma.tour.findFirst({
            where: { slug: tourSlugOrId },
            include: { stops: { orderBy: { order: 'asc' } } },
        });
        if (!tour) {
            tour = await prisma.tour.findUnique({
                where: { id: tourSlugOrId },
                include: { stops: { orderBy: { order: 'asc' } } },
            });
        }
        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        let stop = tour.stops.find(s => s.slug === stopSlugOrId);
        if (!stop) {
            stop = tour.stops.find(s => s.id === stopSlugOrId);
        }
        if (!stop) {
            res.status(404).json({ error: 'Stop not found' });
            return;
        }

        res.json({
            id: stop.id,
            title: JSON.parse(stop.title),
            description: JSON.parse(stop.description),
            image: stop.image,
            order: stop.order,
        });
    } catch (error) {
        console.error('Error fetching stop info:', error);
        res.status(500).json({ error: 'Failed to fetch stop info' });
    }
});

// GET /api/visitor/tour/:tourSlugOrId/gps-stops - Lightweight GPS geofence targets
router.get('/tour/:tourSlugOrId/gps-stops', async (req: Request, res: Response) => {
    try {
        const tourSlugOrId = req.params.tourSlugOrId as string;

        let tour = await prisma.tour.findFirst({
            where: { slug: tourSlugOrId },
            include: { stops: { orderBy: { order: 'asc' } } },
        });
        if (!tour) {
            tour = await prisma.tour.findUnique({
                where: { id: tourSlugOrId },
                include: { stops: { orderBy: { order: 'asc' } } },
            });
        }
        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        // Filter to stops with GPS primary positioning and return lightweight data
        const gpsStops = tour.stops
            .map((stop) => {
                try {
                    const primaryPositioning = JSON.parse(stop.primaryPositioning);
                    if (primaryPositioning?.method === 'gps') {
                        return {
                            id: stop.id,
                            slug: stop.slug,
                            title: JSON.parse(stop.title),
                            latitude: primaryPositioning.latitude,
                            longitude: primaryPositioning.longitude,
                            radius: primaryPositioning.radius,
                        };
                    }
                } catch { /* skip malformed */ }
                return null;
            })
            .filter(Boolean);

        res.json({ tourId: tour.id, gpsStops });
    } catch (error) {
        console.error('Error fetching GPS stops:', error);
        res.status(500).json({ error: 'Failed to fetch GPS stops' });
    }
});

// GET /api/visitor/s/:shortCode - Redirect by short code (O(1) indexed lookup)
router.get('/s/:shortCode', async (req: Request, res: Response) => {
    try {
        const shortCode = req.params.shortCode as string;

        // Indexed lookup on shortCode column
        const stop = await prisma.stop.findFirst({
            where: { shortCode },
            include: { tour: true },
        });

        if (!stop || !stop.tour) {
            res.status(404).json({ error: 'Short code not found' });
            return;
        }

        const redirectUrl = `/visitor/tour/${stop.tour.slug}/stop/${stop.slug}`;
        res.json({ redirectUrl, tourSlug: stop.tour.slug, stopSlug: stop.slug });
    } catch (error) {
        console.error('Error looking up short code:', error);
        res.status(500).json({ error: 'Failed to look up short code' });
    }
});

export default router;
