import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ConciergeKnowledge } from '../../src/generated/prisma/index.js';
import { prisma } from '../db.js';

const router = Router();

// Type interfaces for route params
interface IdParams { id: string }
interface CollectionIdParams { collectionId: string }

// =============================================================================
// CONCIERGE CONFIG
// =============================================================================

// Get or create concierge config
router.get('/config', async (_req: Request, res: Response) => {
    try {
        // Get the first config (we only support single museum for now)
        let config = await prisma.conciergeConfig.findFirst({
            include: {
                knowledgeSources: {
                    orderBy: { priority: 'desc' }
                },
                quickActions: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        // Create default config if none exists
        if (!config) {
            config = await prisma.conciergeConfig.create({
                data: {
                    enabled: false,
                    persona: 'friendly',
                    welcomeMessage: JSON.stringify({ en: 'Welcome! How can I help you today?' }),
                    enabledLanguages: JSON.stringify(['en', 'es', 'fr', 'de']),
                },
                include: {
                    knowledgeSources: true,
                    quickActions: true
                }
            });
        }

        // Parse JSON fields
        const parsedConfig = {
            ...config,
            welcomeMessage: JSON.parse(config.welcomeMessage || '{}'),
            enabledLanguages: JSON.parse(config.enabledLanguages || '["en"]'),
            quickActions: config.quickActions.map(action => ({
                ...action,
                question: JSON.parse(action.question || '{}'),
            })),
        };

        res.json(parsedConfig);
    } catch (error) {
        console.error('Error getting concierge config:', error);
        res.status(500).json({ error: 'Failed to get concierge config', details: String(error) });
    }
});

// Update concierge config
router.put('/config', async (req: Request, res: Response) => {
    try {
        const { id, welcomeMessage, enabledLanguages, ...rest } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Config ID required' });
        }

        const updated = await prisma.conciergeConfig.update({
            where: { id },
            data: {
                ...rest,
                welcomeMessage: welcomeMessage ? JSON.stringify(welcomeMessage) : undefined,
                enabledLanguages: enabledLanguages ? JSON.stringify(enabledLanguages) : undefined,
            },
            include: {
                knowledgeSources: true,
                quickActions: true
            }
        });

        res.json({
            ...updated,
            welcomeMessage: JSON.parse(updated.welcomeMessage || '{}'),
            enabledLanguages: JSON.parse(updated.enabledLanguages || '["en"]'),
        });
    } catch (error) {
        console.error('Error updating concierge config:', error);
        res.status(500).json({ error: 'Failed to update concierge config' });
    }
});

// =============================================================================
// KNOWLEDGE SOURCES
// =============================================================================

// List knowledge sources
router.get('/knowledge', async (req: Request, res: Response) => {
    try {
        const configId = req.query.configId as string;

        const sources = await prisma.conciergeKnowledge.findMany({
            where: configId ? { configId } : undefined,
            orderBy: { priority: 'desc' }
        });

        res.json(sources);
    } catch (error) {
        console.error('Error listing knowledge sources:', error);
        res.status(500).json({ error: 'Failed to list knowledge sources' });
    }
});

// Add knowledge source
router.post('/knowledge', async (req: Request, res: Response) => {
    try {
        const { configId, sourceType, sourceId, title, content, priority } = req.body;

        if (!configId || !sourceType || !title || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const source = await prisma.conciergeKnowledge.create({
            data: {
                configId,
                sourceType,
                sourceId,
                title,
                content,
                characterCount: content.length,
                priority: priority || 0,
            }
        });

        res.json(source);
    } catch (error) {
        console.error('Error adding knowledge source:', error);
        res.status(500).json({ error: 'Failed to add knowledge source' });
    }
});

// Import from document collection
router.post('/knowledge/import/:collectionId', async (req: Request<CollectionIdParams>, res: Response) => {
    try {
        const { collectionId } = req.params;
        const { configId } = req.body;

        if (!configId) {
            return res.status(400).json({ error: 'Config ID required' });
        }

        // Get the collection
        const collection = await prisma.collection.findUnique({
            where: { id: collectionId }
        });

        if (!collection) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Parse items and extract text
        const items = JSON.parse(collection.items || '[]');
        const textParts: string[] = [];

        for (const item of items) {
            if (item.metadata?.extractedText) {
                textParts.push(`## ${item.metadata.fileName || 'Document'}\n\n${item.metadata.extractedText}`);
            }
            // Also include AI summaries if available
            if (item.metadata?.aiAnalysis?.summary) {
                textParts.push(`**Summary:** ${item.metadata.aiAnalysis.summary}`);
            }
        }

        const combinedText = textParts.join('\n\n---\n\n');

        if (!combinedText.trim()) {
            return res.status(400).json({ error: 'No text content found in collection' });
        }

        // Check if already imported
        const existing = await prisma.conciergeKnowledge.findFirst({
            where: {
                configId,
                sourceType: 'document_collection',
                sourceId: collectionId
            }
        });

        if (existing) {
            // Update existing
            const updated = await prisma.conciergeKnowledge.update({
                where: { id: existing.id },
                data: {
                    content: combinedText,
                    characterCount: combinedText.length,
                    updatedAt: new Date()
                }
            });
            return res.json({ ...updated, isUpdate: true });
        }

        // Create new
        const source = await prisma.conciergeKnowledge.create({
            data: {
                configId,
                sourceType: 'document_collection',
                sourceId: collectionId,
                title: collection.name,
                content: combinedText,
                characterCount: combinedText.length,
            }
        });

        res.json(source);
    } catch (error) {
        console.error('Error importing collection:', error);
        res.status(500).json({ error: 'Failed to import collection' });
    }
});

// Delete knowledge source
router.delete('/knowledge/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.conciergeKnowledge.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting knowledge source:', error);
        res.status(500).json({ error: 'Failed to delete knowledge source' });
    }
});

// Toggle knowledge source enabled
router.put('/knowledge/:id/toggle', async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        const updated = await prisma.conciergeKnowledge.update({
            where: { id },
            data: { enabled }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error toggling knowledge source:', error);
        res.status(500).json({ error: 'Failed to toggle knowledge source' });
    }
});

// =============================================================================
// QUICK ACTIONS
// =============================================================================

// List quick actions
router.get('/quick-actions', async (req: Request, res: Response) => {
    try {
        const configId = req.query.configId as string;

        const actions = await prisma.conciergeQuickAction.findMany({
            where: configId ? { configId } : undefined,
            orderBy: { order: 'asc' }
        });

        // Parse question JSON
        const parsed = actions.map(a => ({
            ...a,
            question: JSON.parse(a.question || '{}')
        }));

        res.json(parsed);
    } catch (error) {
        console.error('Error listing quick actions:', error);
        res.status(500).json({ error: 'Failed to list quick actions' });
    }
});

// Add quick action
router.post('/quick-actions', async (req: Request, res: Response) => {
    try {
        const { configId, question, category, icon, order } = req.body;

        if (!configId || !question || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get max order
        const maxOrder = await prisma.conciergeQuickAction.aggregate({
            where: { configId },
            _max: { order: true }
        });

        const action = await prisma.conciergeQuickAction.create({
            data: {
                configId,
                question: JSON.stringify(question),
                category,
                icon,
                order: order ?? ((maxOrder._max.order ?? -1) + 1),
            }
        });

        res.json({
            ...action,
            question: JSON.parse(action.question)
        });
    } catch (error) {
        console.error('Error adding quick action:', error);
        res.status(500).json({ error: 'Failed to add quick action' });
    }
});

// Update quick action
router.put('/quick-actions/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;
        const { question, category, icon, enabled, order } = req.body;

        const updated = await prisma.conciergeQuickAction.update({
            where: { id },
            data: {
                question: question ? JSON.stringify(question) : undefined,
                category,
                icon,
                enabled,
                order,
            }
        });

        res.json({
            ...updated,
            question: JSON.parse(updated.question)
        });
    } catch (error) {
        console.error('Error updating quick action:', error);
        res.status(500).json({ error: 'Failed to update quick action' });
    }
});

// Delete quick action
router.delete('/quick-actions/:id', async (req: Request<IdParams>, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.conciergeQuickAction.delete({
            where: { id }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting quick action:', error);
        res.status(500).json({ error: 'Failed to delete quick action' });
    }
});

// Reorder quick actions
router.put('/quick-actions/reorder', async (req: Request, res: Response) => {
    try {
        const { actions } = req.body; // Array of { id, order }

        if (!actions || !Array.isArray(actions)) {
            return res.status(400).json({ error: 'Actions array required' });
        }

        await Promise.all(
            actions.map((a: { id: string; order: number }) =>
                prisma.conciergeQuickAction.update({
                    where: { id: a.id },
                    data: { order: a.order }
                })
            )
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error reordering quick actions:', error);
        res.status(500).json({ error: 'Failed to reorder quick actions' });
    }
});

// =============================================================================
// CHAT PREVIEW (for testing)
// =============================================================================

router.post('/preview', async (req: Request, res: Response) => {
    try {
        const { message, language } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }

        // Get config with knowledge
        const config = await prisma.conciergeConfig.findFirst({
            include: {
                knowledgeSources: {
                    where: { enabled: true },
                    orderBy: { priority: 'desc' }
                }
            }
        });

        if (!config) {
            return res.status(404).json({ error: 'Concierge not configured' });
        }

        // Build context from knowledge sources
        const knowledgeContext = config.knowledgeSources
            .map(k => k.content)
            .join('\n\n---\n\n');

        // Get persona prompt
        const personaPrompts: Record<string, string> = {
            friendly: `You are a friendly museum docent. Be warm and welcoming. Use casual language but remain informative.`,
            professional: `You are a professional museum guide. Maintain a formal but approachable tone. Provide accurate, factual information.`,
            fun: `You are a fun, family-friendly museum guide! Use simple words that kids can understand. Be enthusiastic and encouraging!`,
            scholarly: `You are an expert museum scholar. Provide detailed, academic-quality information.`,
        };

        const personaPrompt = config.persona === 'custom' && config.customPersona
            ? config.customPersona
            : personaPrompts[config.persona] || personaPrompts.friendly;

        // Call Gemini
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${personaPrompt}

KNOWLEDGE BASE:
${knowledgeContext}

---

Visitor Question (in ${language || 'English'}):
${message}

Answer the visitor's question based ONLY on the knowledge base above. If you cannot find the answer, politely say you don't have that information. Keep your response concise and helpful.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 500,
                }
            })
        });

        const data = await response.json();
        const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I was unable to process your question.';

        res.json({
            response: answer,
            sources: config.knowledgeSources.map(k => k.title)
        });
    } catch (error) {
        console.error('Error in chat preview:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
});

// =============================================================================
// TRANSLATE ALL QUICK ACTIONS
// =============================================================================

const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

router.post('/quick-actions/translate-all', async (req: Request, res: Response) => {
    try {
        const { configId } = req.body;

        if (!configId) {
            return res.status(400).json({ error: 'Config ID required' });
        }

        const API_KEY = process.env.GOOGLE_VISION_API_KEY;
        if (!API_KEY) {
            return res.status(500).json({ error: 'Translation API key not configured' });
        }

        // Get config with enabled languages
        const config = await prisma.conciergeConfig.findUnique({
            where: { id: configId }
        });

        if (!config) {
            return res.status(404).json({ error: 'Config not found' });
        }

        const enabledLanguages = JSON.parse(config.enabledLanguages || '["en"]') as string[];
        const targetLanguages = enabledLanguages.filter(lang => lang !== 'en');

        if (targetLanguages.length === 0) {
            return res.status(400).json({ error: 'No target languages configured besides English' });
        }

        // Get all quick actions
        const actions = await prisma.conciergeQuickAction.findMany({
            where: { configId }
        });

        if (actions.length === 0) {
            return res.status(400).json({ error: 'No quick actions to translate' });
        }

        // Translate each action
        let translatedCount = 0;
        for (const action of actions) {
            const question = JSON.parse(action.question || '{}') as Record<string, string>;
            const englishText = question.en;

            if (!englishText) continue;

            // Translate to each target language
            for (const targetLang of targetLanguages) {
                if (question[targetLang]) continue; // Skip if already translated

                try {
                    const response = await fetch(`${TRANSLATE_API_URL}?key=${API_KEY}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            q: englishText,
                            source: 'en',
                            target: targetLang,
                            format: 'text'
                        })
                    });

                    const data = await response.json() as { data?: { translations: Array<{ translatedText: string }> } };
                    const translatedText = data.data?.translations?.[0]?.translatedText;

                    if (translatedText) {
                        question[targetLang] = translatedText;
                    }
                } catch (err) {
                    console.error(`Failed to translate to ${targetLang}:`, err);
                }
            }

            // Update the action with translations
            await prisma.conciergeQuickAction.update({
                where: { id: action.id },
                data: { question: JSON.stringify(question) }
            });
            translatedCount++;
        }

        res.json({
            success: true,
            translatedCount,
            languages: targetLanguages
        });
    } catch (error) {
        console.error('Error translating quick actions:', error);
        res.status(500).json({ error: 'Failed to translate quick actions' });
    }
});

export default router;
