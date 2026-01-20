// Templates API Routes
import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Template } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Type for route params
interface IdParams {
    id: string;
}

// Helper to parse template
function parseTemplate(template: Template) {
    return {
        ...template,
        customFields: JSON.parse(template.customFields),
    };
}

// GET /api/templates - List all templates
router.get('/', async (_req: Request, res: Response) => {
    try {
        const templates = await prisma.template.findMany({
            orderBy: { name: 'asc' },
        });

        res.json(templates.map(parseTemplate));
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// GET /api/templates/:id - Get single template
router.get('/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const template = await prisma.template.findUnique({
            where: { id: req.params.id },
        });

        if (!template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json(parseTemplate(template));
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

export default router;
