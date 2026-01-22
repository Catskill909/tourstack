import { Router, Request, Response } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Feed version for schema tracking
const FEED_VERSION = '1.0';

// Query parameter types
interface FeedQueryParams {
    lang?: string;           // Filter by language (e.g., ?lang=es)
    format?: 'full' | 'compact' | 'minimal';  // Output format
    status?: string;         // Filter by status (e.g., ?status=published)
    include_stops?: string;  // Include stops (default: true)
}

// GET /api/feeds/tours - Get all tours as a feed
// Query params: ?lang=es&format=compact&status=published&include_stops=true
router.get('/tours', async (req: Request, res: Response) => {
    try {
        const { lang, format = 'full', status, include_stops } = req.query as FeedQueryParams;
        const includeStops = include_stops !== 'false';

        const tours = await prisma.tour.findMany({
            include: includeStops ? {
                stops: {
                    orderBy: { order: 'asc' },
                },
            } : undefined,
            orderBy: { updatedAt: 'desc' },
        });

        // Filter by status if provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let filteredTours = tours as any[];
        if (status) {
            filteredTours = filteredTours.filter(t => t.status === status);
        }

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            query: {
                language: lang || 'all',
                format,
                status: status || 'all',
                include_stops: includeStops,
            },
            total_tours: filteredTours.length,
            tours: filteredTours.map((tour) => formatTourForFeed(tour, lang, format)),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tours feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id - Get single tour feed
// Query params: ?lang=es&format=compact
router.get('/tours/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { lang, format = 'full' } = req.query as FeedQueryParams;

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
            query: {
                language: lang || 'all',
                format,
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tour: formatTourForFeed(tour as any, lang, format),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tour feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id/stops - Get tour stops only
// Query params: ?lang=es
router.get('/tours/:id/stops', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { lang } = req.query as FeedQueryParams;

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
        const title = parseLocalizedField(tourData.title);
        const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            query: {
                language: lang || 'all',
            },
            tour_id: tourData.id,
            tour_title: localizedTitle,
            total_stops: tourData.stops?.length || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stops: (tourData.stops || []).map((stop: any) => formatStopForFeed(stop, lang)),
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
function formatTourForFeed(tour: any, lang?: string, format: string = 'full') {
    const title = parseLocalizedField(tour.title);
    const description = parseLocalizedField(tour.description);
    
    // If language specified, return only that language's content
    const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;
    const localizedDescription = lang ? { [lang]: description[lang] || description['en'] || '' } : description;

    // Minimal format - just IDs and titles
    if (format === 'minimal') {
        return {
            id: tour.id,
            title: localizedTitle,
            status: tour.status,
            stop_count: tour.stops?.length || 0,
        };
    }

    // Compact format - no stops content
    if (format === 'compact') {
        return {
            id: tour.id,
            title: localizedTitle,
            description: localizedDescription,
            hero_image: tour.heroImage,
            status: tour.status,
            languages: parseJsonArray(tour.languages),
            estimated_duration: tour.duration || tour.estimatedDuration,
            difficulty: tour.difficulty,
            stop_count: tour.stops?.length || 0,
            updated_at: tour.updatedAt.toISOString(),
        };
    }

    // Full format - everything
    return {
        id: tour.id,
        title: localizedTitle,
        description: localizedDescription,
        hero_image: tour.heroImage,
        status: tour.status,
        languages: parseJsonArray(tour.languages),
        estimated_duration: tour.duration || tour.estimatedDuration,
        difficulty: tour.difficulty,
        created_at: tour.createdAt.toISOString(),
        updated_at: tour.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stops: tour.stops?.map((stop: any) => formatStopForFeed(stop, lang)) || [],
        stop_count: tour.stops?.length || 0,
    };
}

// Helper: Format stop for feed output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStopForFeed(stop: any, lang?: string) {
    const title = parseLocalizedField(stop.title);
    const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;

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
        title: localizedTitle,
        order: stop.order,
        content_blocks: contentBlocks,
        positioning: positioning,
        created_at: stop.createdAt.toISOString(),
        updated_at: stop.updatedAt.toISOString(),
    };
}

export default router;
