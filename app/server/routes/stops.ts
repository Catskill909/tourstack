// Stops API Routes
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Stop } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Helper to generate unique short codes for QR/positioning
function generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper to generate unique tracking token
function generateToken(): string {
    return Math.random().toString(36).substring(2, 10);
}

// Generate URL-friendly slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')          // Spaces to hyphens
        .replace(/-+/g, '-')           // Multiple hyphens to single
        .substring(0, 50)              // Limit length
        .replace(/^-|-$/g, '');        // Trim hyphens
}

// Ensure slug is unique within tour
async function ensureUniqueStopSlug(baseSlug: string, tourId: string): Promise<string> {
    let slug = baseSlug || 'untitled';
    let counter = 1;

    while (true) {
        const exists = await prisma.stop.findFirst({ where: { slug, tourId } });
        if (!exists) return slug;
        slug = `${baseSlug}-${counter++}`;
    }
}

// Type for route params
interface TourIdParams {
    tourId: string;
}

interface IdParams {
    id: string;
}

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
        // Also return as contentBlocks for frontend compatibility
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

// GET /api/stops/:tourId - List stops for a tour
router.get('/:tourId', async (req: Request<TourIdParams>, res: Response) => {
    try {
        const stops = await prisma.stop.findMany({
            where: { tourId: req.params.tourId },
            orderBy: { order: 'asc' },
        });

        res.json(stops.map(parseStop));
    } catch (error) {
        console.error('Error fetching stops:', error);
        res.status(500).json({ error: 'Failed to fetch stops' });
    }
});

// POST /api/stops - Create stop
router.post('/', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Get the tour to access its slug
        const tour = await prisma.tour.findUnique({ where: { id: data.tourId } });
        if (!tour) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        // Get max order for this tour
        const maxOrder = await prisma.stop.aggregate({
            where: { tourId: data.tourId },
            _max: { order: true },
        });

        // Generate slug from title
        const titleObj = data.title || { en: 'New Stop' };
        const titleText = titleObj.en || Object.values(titleObj)[0] || 'New Stop';
        const baseSlug = generateSlug(titleText);
        const slug = await ensureUniqueStopSlug(baseSlug, data.tourId);

        const shortCode = generateShortCode();
        const token = generateToken();

        // Build readable URL using slugs
        const baseUrl = (req.get('origin') || req.get('host')) ?
            `${req.protocol}://${req.get('host')}` :
            'https://tourstack.app';
        const visitorUrl = `${baseUrl}/visitor/tour/${tour.slug}/stop/${slug}?t=${token}`;

        // Create the stop with slug and readable URL
        const stop = await prisma.stop.create({
            data: {
                tourId: data.tourId,
                slug,
                order: (maxOrder._max.order ?? -1) + 1,
                type: data.type || 'mandatory',
                title: JSON.stringify(data.title || { en: 'New Stop' }),
                image: typeof data.image === 'object' ? JSON.stringify(data.image) : (data.image || ''),
                description: JSON.stringify(data.description || { en: '' }),
                customFieldValues: JSON.stringify(data.customFieldValues || {}),
                primaryPositioning: JSON.stringify({ method: 'qr_code', url: visitorUrl, shortCode }),
                backupPositioning: data.backupPositioning ? JSON.stringify(data.backupPositioning) : null,
                triggers: JSON.stringify(data.triggers || { triggerOnEnter: true, triggerOnExit: false }),
                content: JSON.stringify(data.content || []),
                interactive: data.interactive ? JSON.stringify(data.interactive) : null,
                links: JSON.stringify(data.links || []),
                accessibility: JSON.stringify(data.accessibility || {}),
            },
        });

        res.status(201).json(parseStop(stop));
    } catch (error) {
        console.error('Error creating stop:', error);
        res.status(500).json({ error: 'Failed to create stop' });
    }
});

// PUT /api/stops/:id - Update stop
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const data = req.body;

        const updateData: Record<string, unknown> = {};

        if (data.order !== undefined) updateData.order = data.order;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.title !== undefined) updateData.title = JSON.stringify(data.title);
        if (data.image !== undefined) updateData.image = typeof data.image === 'object' ? JSON.stringify(data.image) : data.image;
        if (data.description !== undefined) updateData.description = JSON.stringify(data.description);
        // Accept both 'content' and 'contentBlocks' from frontend
        if (data.content !== undefined) updateData.content = JSON.stringify(data.content);
        if (data.contentBlocks !== undefined) updateData.content = JSON.stringify(data.contentBlocks);
        if (data.customFieldValues !== undefined) updateData.customFieldValues = JSON.stringify(data.customFieldValues);
        if (data.primaryPositioning !== undefined) updateData.primaryPositioning = JSON.stringify(data.primaryPositioning);
        if (data.backupPositioning !== undefined) updateData.backupPositioning = data.backupPositioning ? JSON.stringify(data.backupPositioning) : null;
        if (data.triggers !== undefined) updateData.triggers = JSON.stringify(data.triggers);
        if (data.interactive !== undefined) updateData.interactive = data.interactive ? JSON.stringify(data.interactive) : null;
        if (data.links !== undefined) updateData.links = JSON.stringify(data.links);
        if (data.accessibility !== undefined) updateData.accessibility = JSON.stringify(data.accessibility);

        const stop = await prisma.stop.update({
            where: { id: req.params.id },
            data: updateData,
        });

        res.json(parseStop(stop));
    } catch (error) {
        console.error('Error updating stop:', error);
        res.status(500).json({ error: 'Failed to update stop' });
    }
});

// DELETE /api/stops/:id - Delete stop
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        await prisma.stop.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting stop:', error);
        res.status(500).json({ error: 'Failed to delete stop' });
    }
});

// PUT /api/stops/reorder/:tourId - Reorder stops
router.put('/reorder/:tourId', async (req: Request<TourIdParams>, res: Response) => {
    try {
        const { stopIds } = req.body; // Array of stop IDs in new order

        // Update each stop's order
        await Promise.all(
            stopIds.map((id: string, index: number) =>
                prisma.stop.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        const stops = await prisma.stop.findMany({
            where: { tourId: req.params.tourId },
            orderBy: { order: 'asc' },
        });

        res.json(stops.map(parseStop));
    } catch (error) {
        console.error('Error reordering stops:', error);
        res.status(500).json({ error: 'Failed to reorder stops' });
    }
});

export default router;
