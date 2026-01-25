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
    return {
        ...stop,
        title: JSON.parse(stop.title),
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

        // Get max order for this tour
        const maxOrder = await prisma.stop.aggregate({
            where: { tourId: data.tourId },
            _max: { order: true },
        });

        // Generate a temporary ID for URL (will be replaced with actual ID)
        // We need to create with a placeholder, then update with the real URL
        const shortCode = generateShortCode();
        const token = generateToken();

        // Create the stop first to get its ID
        const stop = await prisma.stop.create({
            data: {
                tourId: data.tourId,
                order: (maxOrder._max.order ?? -1) + 1,
                type: data.type || 'mandatory',
                title: JSON.stringify(data.title || { en: 'New Stop' }),
                image: data.image || '',
                description: JSON.stringify(data.description || { en: '' }),
                customFieldValues: JSON.stringify(data.customFieldValues || {}),
                // Will be updated below with the correct stop ID in URL
                primaryPositioning: JSON.stringify({ method: 'qr_code', url: '', shortCode }),
                backupPositioning: data.backupPositioning ? JSON.stringify(data.backupPositioning) : null,
                triggers: JSON.stringify(data.triggers || { triggerOnEnter: true, triggerOnExit: false }),
                content: JSON.stringify(data.content || []),
                interactive: data.interactive ? JSON.stringify(data.interactive) : null,
                links: JSON.stringify(data.links || []),
                accessibility: JSON.stringify(data.accessibility || {}),
            },
        });

        // Now update with the correct URL containing the real stop ID
        // Use the host header or default to tourstack.app
        const baseUrl = (req.get('origin') || req.get('host')) ?
            `${req.protocol}://${req.get('host')}` :
            'https://tourstack.app';
        const visitorUrl = `${baseUrl}/visitor/tour/${data.tourId}/stop/${stop.id}?t=${token}`;

        const updatedStop = await prisma.stop.update({
            where: { id: stop.id },
            data: {
                primaryPositioning: JSON.stringify({
                    method: 'qr_code',
                    url: visitorUrl,
                    shortCode
                }),
            },
        });

        res.status(201).json(parseStop(updatedStop));
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
        if (data.image !== undefined) updateData.image = data.image;
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
