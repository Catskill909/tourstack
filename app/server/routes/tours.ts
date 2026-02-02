// Tours API Routes
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Tour, Stop } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Type for route params
interface IdParams {
    id: string;
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

// Ensure slug is unique by appending number if needed
async function ensureUniqueSlug(baseSlug: string, type: 'tour' | 'stop', tourId?: string): Promise<string> {
    let slug = baseSlug || 'untitled';
    let counter = 1;

    while (true) {
        const exists = type === 'tour'
            ? await prisma.tour.findFirst({ where: { slug } })
            : await prisma.stop.findFirst({ where: { slug, tourId } });

        if (!exists) return slug;
        slug = `${baseSlug}-${counter++}`;
    }
}

// Helper to parse stop JSON fields
function parseStop(stop: Stop) {
    return {
        ...stop,
        title: JSON.parse(stop.title),
        description: JSON.parse(stop.description),
        content: JSON.parse(stop.content),
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
function parseTour(tour: Tour & { stops?: Stop[] }) {
    return {
        ...tour,
        title: JSON.parse(tour.title),
        description: JSON.parse(tour.description),
        languages: JSON.parse(tour.languages),
        accessibility: JSON.parse(tour.accessibility),
        // Concierge fields (Phase 26.2)
        conciergeWelcome: tour.conciergeWelcome ? JSON.parse(tour.conciergeWelcome) : null,
        conciergeCollections: tour.conciergeCollections ? JSON.parse(tour.conciergeCollections) : [],
        conciergeQuickActions: tour.conciergeQuickActions ? JSON.parse(tour.conciergeQuickActions) : [],
        stops: tour.stops?.map(parseStop) || [],
    };
}

// GET /api/tours - List all tours
router.get('/', async (_req: Request, res: Response) => {
    try {
        const tours = await prisma.tour.findMany({
            include: { stops: { orderBy: { order: 'asc' } } },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(tours.map(parseTour));
    } catch (error) {
        console.error('Error fetching tours:', error);
        res.status(500).json({ error: 'Failed to fetch tours' });
    }
});

// GET /api/tours/:id - Get single tour
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const tour = await prisma.tour.findUnique({
            where: { id: req.params.id },
            include: { stops: { orderBy: { order: 'asc' } } },
        });

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

// POST /api/tours - Create tour
router.post('/', async (req: Request, res: Response) => {
    try {
        const data = req.body;

        // Ensure we have a museum - create default if needed
        let museum = await prisma.museum.findFirst();
        if (!museum) {
            museum = await prisma.museum.create({
                data: {
                    name: 'My Museum',
                    branding: JSON.stringify({ primaryColor: '#6366f1', secondaryColor: '#8b5cf6' }),
                },
            });
        }

        // Ensure template exists
        let template = await prisma.template.findFirst({
            where: { id: data.templateId },
        });
        if (!template) {
            template = await prisma.template.findFirst();
        }
        if (!template) {
            res.status(400).json({ error: 'No templates available' });
            return;
        }

        // Generate slug from title
        const titleObj = data.title || { en: 'Untitled Tour' };
        const titleText = titleObj.en || Object.values(titleObj)[0] || 'Untitled Tour';
        const baseSlug = generateSlug(titleText);
        const slug = await ensureUniqueSlug(baseSlug, 'tour');

        const tour = await prisma.tour.create({
            data: {
                museumId: museum.id,
                templateId: template.id,
                slug,
                status: 'draft',
                title: JSON.stringify(data.title || { en: 'Untitled Tour' }),
                heroImage: data.heroImage || '',
                description: JSON.stringify(data.description || { en: '' }),
                languages: JSON.stringify(data.languages || ['en']),
                primaryLanguage: data.primaryLanguage || 'en',
                duration: data.duration || 30,
                difficulty: data.difficulty || 'general',
                primaryPositioningMethod: data.primaryPositioningMethod || 'qr_code',
                backupPositioningMethod: data.backupPositioningMethod || null,
                accessibility: JSON.stringify(data.accessibility || {
                    wheelchairAccessible: true,
                    audioDescriptions: false,
                    signLanguage: false,
                    tactileElements: false,
                    quietSpaceFriendly: false,
                }),
            },
            include: { stops: true },
        });

        res.status(201).json(parseTour(tour));
    } catch (error) {
        console.error('Error creating tour:', error);
        res.status(500).json({ error: 'Failed to create tour' });
    }
});

// PUT /api/tours/:id - Update tour
router.put('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const data = req.body;

        const updateData: Record<string, unknown> = {};

        if (data.title !== undefined) updateData.title = JSON.stringify(data.title);
        if (data.description !== undefined) updateData.description = JSON.stringify(data.description);
        if (data.heroImage !== undefined) updateData.heroImage = data.heroImage;
        if (data.languages !== undefined) updateData.languages = JSON.stringify(data.languages);
        if (data.primaryLanguage !== undefined) updateData.primaryLanguage = data.primaryLanguage;
        if (data.duration !== undefined) updateData.duration = data.duration;
        if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.accessibility !== undefined) updateData.accessibility = JSON.stringify(data.accessibility);
        if (data.primaryPositioningMethod !== undefined) updateData.primaryPositioningMethod = data.primaryPositioningMethod;
        if (data.backupPositioningMethod !== undefined) updateData.backupPositioningMethod = data.backupPositioningMethod;
        if (data.publishedAt !== undefined) updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;

        // Concierge fields (Phase 26.2)
        if (data.conciergeEnabled !== undefined) updateData.conciergeEnabled = data.conciergeEnabled;
        if (data.conciergePersona !== undefined) updateData.conciergePersona = data.conciergePersona;
        if (data.conciergeWelcome !== undefined) updateData.conciergeWelcome = JSON.stringify(data.conciergeWelcome);
        if (data.conciergeCollections !== undefined) updateData.conciergeCollections = JSON.stringify(data.conciergeCollections);
        if (data.conciergeQuickActions !== undefined) updateData.conciergeQuickActions = JSON.stringify(data.conciergeQuickActions);

        // Update stops separately if provided
        if (data.stops !== undefined) {
            for (const stop of data.stops) {
                if (stop.id) {
                    await prisma.stop.update({
                        where: { id: stop.id },
                        data: {
                            order: stop.order,
                            title: JSON.stringify(stop.title),
                            description: JSON.stringify(stop.description),
                            content: JSON.stringify(stop.content),
                            image: stop.image || '',
                            customFieldValues: JSON.stringify(stop.customFieldValues || {}),
                            primaryPositioning: JSON.stringify(stop.primaryPositioning || {}),
                            backupPositioning: stop.backupPositioning ? JSON.stringify(stop.backupPositioning) : null,
                            triggers: JSON.stringify(stop.triggers || {}),
                            interactive: stop.interactive ? JSON.stringify(stop.interactive) : null,
                            links: JSON.stringify(stop.links || []),
                            accessibility: JSON.stringify(stop.accessibility || {}),
                        },
                    });
                }
            }
        }

        const tour = await prisma.tour.update({
            where: { id: req.params.id },
            data: updateData,
            include: { stops: { orderBy: { order: 'asc' } } },
        });

        res.json(parseTour(tour));
    } catch (error) {
        console.error('Error updating tour:', error);
        res.status(500).json({ error: 'Failed to update tour' });
    }
});

// DELETE /api/tours/:id - Delete tour
router.delete('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        await prisma.tour.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting tour:', error);
        res.status(500).json({ error: 'Failed to delete tour' });
    }
});

// POST /api/tours/:id/duplicate - Duplicate tour
router.post('/:id/duplicate', async (req: Request<IdParams>, res: Response) => {
    try {
        const original = await prisma.tour.findUnique({
            where: { id: req.params.id },
            include: { stops: true },
        });

        if (!original) {
            res.status(404).json({ error: 'Tour not found' });
            return;
        }

        const originalTitle = JSON.parse(original.title) as Record<string, string>;
        const newTitle: Record<string, string> = {};
        for (const [lang, text] of Object.entries(originalTitle)) {
            newTitle[lang] = `${text} (Copy)`;
        }

        const duplicate = await prisma.tour.create({
            data: {
                museumId: original.museumId,
                templateId: original.templateId,
                status: 'draft',
                slug: generateSlug(newTitle.en || Object.values(newTitle)[0] || 'tour'),
                title: JSON.stringify(newTitle),
                heroImage: original.heroImage,
                description: original.description,
                languages: original.languages,
                primaryLanguage: original.primaryLanguage,
                duration: original.duration,
                difficulty: original.difficulty,
                primaryPositioningMethod: original.primaryPositioningMethod,
                backupPositioningMethod: original.backupPositioningMethod,
                accessibility: original.accessibility,
            },
        });

        // Duplicate stops - original.stops is available because of include
        for (const stop of original.stops) {
            const stopTitle = JSON.parse(stop.title) as Record<string, string>;
            await prisma.stop.create({
                data: {
                    tourId: duplicate.id,
                    order: stop.order,
                    type: stop.type,
                    slug: generateSlug(stopTitle.en || Object.values(stopTitle)[0] || 'stop'),
                    title: stop.title,
                    image: stop.image,
                    description: stop.description,
                    customFieldValues: stop.customFieldValues,
                    primaryPositioning: stop.primaryPositioning,
                    backupPositioning: stop.backupPositioning,
                    triggers: stop.triggers,
                    content: stop.content,
                    interactive: stop.interactive,
                    links: stop.links,
                    accessibility: stop.accessibility,
                },
            });
        }

        const result = await prisma.tour.findUnique({
            where: { id: duplicate.id },
            include: { stops: { orderBy: { order: 'asc' } } },
        });

        if (!result) {
            res.status(500).json({ error: 'Failed to fetch duplicated tour' });
            return;
        }

        res.status(201).json(parseTour(result));
    } catch (error) {
        console.error('Error duplicating tour:', error);
        res.status(500).json({ error: 'Failed to duplicate tour' });
    }
});

export default router;
