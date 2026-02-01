// Collections API Routes
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Collection } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Type for collection image items with AI metadata
interface ImageCollectionItem {
    type: 'image';
    url: string;
    aiMetadata?: Record<string, unknown>;
    aiTranslations?: Record<string, unknown>;
}

/**
 * Sync AI metadata from collection items to Media Library
 * Called after collection create/update to keep systems in sync
 */
async function syncToMediaLibrary(items: unknown[]): Promise<{ synced: number; notFound: number }> {
    const results = { synced: 0, notFound: 0 };

    // Filter for image items with AI metadata and local URLs
    const imageItems = (items as ImageCollectionItem[]).filter(
        (item) =>
            item.type === 'image' &&
            item.url?.startsWith('/uploads/') &&
            (item.aiMetadata || item.aiTranslations)
    );

    for (const item of imageItems) {
        try {
            // Find media by URL
            const media = await prisma.media.findFirst({
                where: { url: item.url },
            });

            if (!media) {
                results.notFound++;
                continue;
            }

            // Update with AI metadata
            await prisma.media.update({
                where: { id: media.id },
                data: {
                    aiMetadata: item.aiMetadata ? JSON.stringify(item.aiMetadata) : undefined,
                    aiTranslations: item.aiTranslations ? JSON.stringify(item.aiTranslations) : undefined,
                },
            });

            results.synced++;
        } catch (err) {
            console.error(`Failed to sync item ${item.url} to media library:`, err);
        }
    }

    return results;
}

// Type for route params
interface IdParams {
    id: string;
}

// Query params for filtering
interface CollectionQuery {
    type?: string;
    museumId?: string;
}

// Helper to parse collection JSON fields
function parseCollection(collection: Collection) {
    return {
        ...collection,
        items: JSON.parse(collection.items),
        texts: collection.texts ? JSON.parse(collection.texts) : undefined,
        ttsSettings: collection.ttsSettings ? JSON.parse(collection.ttsSettings) : undefined,
    };
}

// GET /api/collections - List all collections (with optional type filter)
router.get('/', async (req: Request<object, object, object, CollectionQuery>, res: Response) => {
    try {
        const { type, museumId } = req.query;
        
        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (museumId) where.museumId = museumId;

        const collections = await prisma.collection.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });

        res.json(collections.map(parseCollection));
    } catch (error) {
        console.error('Error fetching collections:', error);
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

// GET /api/collections/:id - Get single collection
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const collection = await prisma.collection.findUnique({
            where: { id: req.params.id },
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        res.json(parseCollection(collection));
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ error: 'Failed to fetch collection' });
    }
});

// POST /api/collections - Create collection
router.post('/', async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const items = data.items || [];

        const collection = await prisma.collection.create({
            data: {
                museumId: data.museumId || null,
                name: data.name,
                description: data.description || '',
                type: data.type || 'gallery',
                items: JSON.stringify(items),
                sourceLanguage: data.sourceLanguage || null,
                texts: data.texts ? JSON.stringify(data.texts) : null,
                ttsSettings: data.ttsSettings ? JSON.stringify(data.ttsSettings) : null,
            },
        });

        // Auto-sync AI metadata to Media Library (Phase 23)
        if (items.length > 0) {
            const syncResult = await syncToMediaLibrary(items);
            console.log(`Collection ${collection.id} created - synced ${syncResult.synced} items to Media Library`);
        }

        res.status(201).json(parseCollection(collection));
    } catch (error) {
        console.error('Error creating collection:', error);
        res.status(500).json({ error: 'Failed to create collection' });
    }
});

// PUT /api/collections/:id - Update collection
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const data = req.body;

        const updateData: Record<string, unknown> = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.type !== undefined) updateData.type = data.type;
        if (data.items !== undefined) updateData.items = JSON.stringify(data.items);
        if (data.sourceLanguage !== undefined) updateData.sourceLanguage = data.sourceLanguage;
        if (data.texts !== undefined) updateData.texts = data.texts ? JSON.stringify(data.texts) : null;
        if (data.ttsSettings !== undefined) updateData.ttsSettings = data.ttsSettings ? JSON.stringify(data.ttsSettings) : null;

        const collection = await prisma.collection.update({
            where: { id: req.params.id },
            data: updateData,
        });

        // Auto-sync AI metadata to Media Library (Phase 23)
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            const syncResult = await syncToMediaLibrary(data.items);
            console.log(`Collection ${collection.id} updated - synced ${syncResult.synced} items to Media Library`);
        }

        res.json(parseCollection(collection));
    } catch (error) {
        console.error('Error updating collection:', error);
        res.status(500).json({ error: 'Failed to update collection' });
    }
});

// DELETE /api/collections/:id - Delete collection
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        await prisma.collection.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting collection:', error);
        res.status(500).json({ error: 'Failed to delete collection' });
    }
});

// POST /api/collections/:id/items - Add item to collection
router.post('/:id/items', async (req: Request<IdParams>, res: Response) => {
    try {
        const newItem = req.body;
        
        const collection = await prisma.collection.findUnique({
            where: { id: req.params.id },
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const items = JSON.parse(collection.items);
        
        // Generate ID if not provided
        if (!newItem.id) {
            newItem.id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        // Set order if not provided
        if (newItem.order === undefined) {
            newItem.order = items.length;
        }

        items.push(newItem);

        const updated = await prisma.collection.update({
            where: { id: req.params.id },
            data: { items: JSON.stringify(items) },
        });

        res.status(201).json(parseCollection(updated));
    } catch (error) {
        console.error('Error adding item to collection:', error);
        res.status(500).json({ error: 'Failed to add item to collection' });
    }
});

// DELETE /api/collections/:id/items/:itemId - Remove item from collection
router.delete('/:id/items/:itemId', async (req: Request<{ id: string; itemId: string }>, res: Response) => {
    try {
        const collection = await prisma.collection.findUnique({
            where: { id: req.params.id },
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        const items = JSON.parse(collection.items);
        const filteredItems = items.filter((item: { id: string }) => item.id !== req.params.itemId);

        // Re-order remaining items
        filteredItems.forEach((item: { order: number }, index: number) => {
            item.order = index;
        });

        const updated = await prisma.collection.update({
            where: { id: req.params.id },
            data: { items: JSON.stringify(filteredItems) },
        });

        res.json(parseCollection(updated));
    } catch (error) {
        console.error('Error removing item from collection:', error);
        res.status(500).json({ error: 'Failed to remove item from collection' });
    }
});

export default router;
