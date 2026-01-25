// Visitor API Routes - Public endpoints for visitor-facing pages
// Supports lookup by slug (readable URLs) or ID (legacy/fallback)
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Tour, Stop } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Type for tour with stops included
type TourWithStops = Tour & { stops: Stop[] };

// Helper to parse stop JSON fields
function parseStop(stop: Stop) {
    const content = JSON.parse(stop.content);
    return {
        ...stop,
        title: JSON.parse(stop.title),
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

// GET /api/visitor/s/:shortCode - Redirect by short code
router.get('/s/:shortCode', async (req: Request, res: Response) => {
    try {
        const shortCode = req.params.shortCode as string;

        // Find stop by short code in primaryPositioning
        const stops = await prisma.stop.findMany();

        for (const stop of stops) {
            const positioning = JSON.parse(stop.primaryPositioning);
            if (positioning.shortCode === shortCode) {
                // Get tour slug
                const tour = await prisma.tour.findUnique({ where: { id: stop.tourId } });
                if (tour) {
                    const redirectUrl = `/visitor/tour/${tour.slug}/stop/${stop.slug}`;
                    res.json({ redirectUrl, tourSlug: tour.slug, stopSlug: stop.slug });
                    return;
                }
            }
        }

        res.status(404).json({ error: 'Short code not found' });
    } catch (error) {
        console.error('Error looking up short code:', error);
        res.status(500).json({ error: 'Failed to look up short code' });
    }
});

export default router;
