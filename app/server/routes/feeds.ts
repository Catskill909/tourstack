import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Feed version for schema tracking
const FEED_VERSION = '1.0';

// GET /api/feeds/tours - Get all tours as a feed
router.get('/tours', async (_req: Request, res: Response) => {
    try {
        const tours = await prisma.tour.findMany({
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            total_tours: tours.length,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tours: tours.map((tour: any) => formatTourForFeed(tour)),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tours feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id - Get single tour feed
router.get('/tours/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const tour = await prisma.tour.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tour: formatTourForFeed(tour as any),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tour feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id/stops - Get tour stops only
router.get('/tours/:id/stops', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        const tour = await prisma.tour.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tourData = tour as any;
        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            tour_id: tourData.id,
            tour_title: parseLocalizedField(tourData.title),
            total_stops: tourData.stops?.length || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stops: (tourData.stops || []).map((stop: any) => formatStopForFeed(stop)),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating stops feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// Helper: Parse JSON field safely
function parseLocalizedField(field: string | null): Record<string, string> {
    if (!field) return { en: '' };
    try {
        return JSON.parse(field);
    } catch {
        return { en: field };
    }
}

// Helper: Parse JSON array safely
function parseJsonArray(field: string | null): string[] {
    if (!field) return [];
    try {
        return JSON.parse(field);
    } catch {
        return [];
    }
}

// Helper: Format tour for feed output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTourForFeed(tour: any) {
    return {
        id: tour.id,
        title: parseLocalizedField(tour.title),
        description: parseLocalizedField(tour.description),
        hero_image: tour.heroImage,
        status: tour.status,
        languages: parseJsonArray(tour.languages),
        estimated_duration: tour.duration || tour.estimatedDuration,
        difficulty: tour.difficulty,
        created_at: tour.createdAt.toISOString(),
        updated_at: tour.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stops: tour.stops?.map((stop: any) => formatStopForFeed(stop)) || [],
        stop_count: tour.stops?.length || 0,
    };
}

// Helper: Format stop for feed output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStopForFeed(stop: any) {
    let contentBlocks = [];
    try {
        contentBlocks = stop.content ? JSON.parse(stop.content) : [];
    } catch {
        contentBlocks = [];
    }

    let positioning = null;
    try {
        positioning = stop.positioning ? JSON.parse(stop.positioning) : null;
    } catch {
        positioning = null;
    }

    return {
        id: stop.id,
        title: parseLocalizedField(stop.title),
        order: stop.order,
        content_blocks: contentBlocks,
        positioning: positioning,
        created_at: stop.createdAt.toISOString(),
        updated_at: stop.updatedAt.toISOString(),
    };
}

export default router;
