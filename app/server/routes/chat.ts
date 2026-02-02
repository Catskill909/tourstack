import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../db.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Knowledge base directory - stores museum info documents
const KNOWLEDGE_DIR = path.join(__dirname, '../../uploads/knowledge');

// Use same API key as Gemini route
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is not set. Chat features will not work.');
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Persona prompts for different AI personalities
const PERSONA_PROMPTS: Record<string, string> = {
    friendly: 'You are a warm, welcoming museum guide who loves sharing knowledge in an approachable way.',
    professional: 'You are a knowledgeable museum guide who provides precise, well-structured information.',
    fun: 'You are an enthusiastic, family-friendly museum guide who makes learning exciting and uses simple language.',
    scholarly: 'You are an expert curator who provides detailed, academic insights with historical context.',
};

/**
 * Build knowledge context from a specific tour and its linked collections
 */
async function buildTourKnowledge(tourId: string): Promise<{ context: string; tourTitle: string; persona: string | null }> {
    try {
        // Fetch tour with stops
        const tour = await prisma.tour.findUnique({
            where: { id: tourId },
            include: { stops: { orderBy: { order: 'asc' } } }
        });

        if (!tour) {
            return { context: '', tourTitle: '', persona: null };
        }

        const titleObj = JSON.parse(tour.title);
        const tourTitle = titleObj.en || Object.values(titleObj)[0] || 'Tour';
        const descObj = JSON.parse(tour.description);
        const tourDesc = descObj.en || Object.values(descObj)[0] || '';

        const parts: string[] = [];

        // Add tour overview
        parts.push(`# Tour: ${tourTitle}\n\n${tourDesc}`);

        // Add all stop content
        for (const stop of tour.stops) {
            const stopTitle = JSON.parse(stop.title);
            const stopDesc = JSON.parse(stop.description);
            const stopContent = JSON.parse(stop.content);

            parts.push(`\n## Stop ${stop.order + 1}: ${stopTitle.en || Object.values(stopTitle)[0]}`);

            if (stopDesc.en || Object.values(stopDesc)[0]) {
                parts.push(stopDesc.en || Object.values(stopDesc)[0]);
            }

            // Extract text from content blocks
            if (Array.isArray(stopContent)) {
                for (const block of stopContent) {
                    if (block.type === 'text' && block.content) {
                        const text = block.content.en || Object.values(block.content)[0] || '';
                        if (text) parts.push(text);
                    }
                }
            }
        }

        // Add linked document collections
        if (tour.conciergeCollections) {
            const collectionIds = JSON.parse(tour.conciergeCollections) as string[];

            for (const collectionId of collectionIds) {
                const collection = await prisma.collection.findUnique({
                    where: { id: collectionId }
                });

                if (collection && collection.items) {
                    const items = JSON.parse(collection.items);
                    parts.push(`\n## Documents: ${collection.name}`);

                    for (const item of items) {
                        if (item.metadata?.extractedText) {
                            parts.push(`\n### ${item.metadata.fileName || 'Document'}\n${item.metadata.extractedText}`);
                        }
                        // Include AI analysis if available
                        if (item.metadata?.aiAnalysis?.summary) {
                            parts.push(`**Summary:** ${item.metadata.aiAnalysis.summary}`);
                        }
                        if (item.metadata?.aiAnalysis?.facts?.length) {
                            parts.push(`**Key Facts:**\n${item.metadata.aiAnalysis.facts.map((f: string) => `- ${f}`).join('\n')}`);
                        }
                    }
                }
            }
        }

        return {
            context: parts.join('\n\n'),
            tourTitle,
            persona: tour.conciergePersona
        };
    } catch (error) {
        console.error('Error building tour knowledge:', error);
        return { context: '', tourTitle: '', persona: null };
    }
}

/**
 * Load all .txt files from the knowledge directory
 * Returns combined context string with file markers
 */
function loadKnowledgeBase(): { context: string; files: string[] } {
    // Ensure directory exists
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
        console.log('📁 Created knowledge directory:', KNOWLEDGE_DIR);
        return { context: '', files: [] };
    }

    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.txt'));
    let context = '';

    for (const file of files) {
        try {
            const content = fs.readFileSync(path.join(KNOWLEDGE_DIR, file), 'utf-8');
            context += `\n--- ${file} ---\n${content}\n`;
        } catch (error) {
            console.error(`Failed to read ${file}:`, error);
        }
    }

    return { context, files };
}

/**
 * POST /api/chat
 * 
 * Handle visitor chat requests, grounded in knowledge base documents
 * 
 * Body: { message: string, language?: string, tourId?: string }
 * Returns: { response: string, sources: string[] }
 */
router.post('/', async (req, res) => {
    try {
        const { message, language = 'en', tourId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Gemini API key missing'
            });
        }

        let context = '';
        let sources: string[] = [];
        let personaPrompt = PERSONA_PROMPTS.friendly;
        let contextType = 'museum';

        // If tourId provided, build tour-specific knowledge
        if (tourId) {
            const tourKnowledge = await buildTourKnowledge(tourId);
            if (tourKnowledge.context) {
                context = tourKnowledge.context;
                contextType = 'tour';
                sources = [`Tour: ${tourKnowledge.tourTitle}`];

                // Use tour-specific persona if set
                if (tourKnowledge.persona && PERSONA_PROMPTS[tourKnowledge.persona]) {
                    personaPrompt = PERSONA_PROMPTS[tourKnowledge.persona];
                }
            }
        }

        // Fall back to museum-wide knowledge base if no tour context
        if (!context) {
            const kb = loadKnowledgeBase();
            context = kb.context;
            sources = kb.files;
        }

        // Build grounded system prompt
        const systemPrompt = `${personaPrompt}

Your role is to answer visitor questions about ${contextType === 'tour' ? 'this specific tour' : 'the museum'} using ONLY the information provided below.

IMPORTANT RULES:
1. ONLY answer based on the ${contextType} information provided below
2. If the answer is NOT in the provided information, politely say you don't have that specific information and suggest asking a museum staff member
3. Be concise, friendly, and helpful
4. Format responses for easy reading on mobile devices
5. If asked about something completely unrelated to ${contextType === 'tour' ? 'the tour' : 'the museum'}, politely redirect to relevant topics

${contextType.toUpperCase()} INFORMATION:
${context || 'No knowledge base documents have been uploaded yet. Please ask a museum staff member for assistance.'}`;

        // Generate response
        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'I understand. I\'ll help visitors with questions about the museum based only on the information provided.' }]
                },
                {
                    role: 'user',
                    parts: [{ text: message }]
                }
            ]
        });

        let response = result.response.text();

        // Translate response if language is not English
        if (language !== 'en' && response) {
            try {
                const translateRes = await fetch(`http://localhost:${process.env.PORT || 3000}/api/google-translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: response,
                        sourceLang: 'en',
                        targetLang: language
                    })
                });

                if (translateRes.ok) {
                    const translated = await translateRes.json() as { translatedText?: string };
                    if (translated.translatedText) {
                        response = translated.translatedText;
                    }
                }
            } catch (translateError) {
                console.warn('Translation failed, returning English response:', translateError);
            }
        }

        res.json({
            response,
            sources,
            language
        });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        res.status(500).json({
            error: 'Failed to generate response',
            details: error.message
        });
    }
});

/**
 * GET /api/chat/sources
 * 
 * List available knowledge base documents
 */
router.get('/sources', (_req, res) => {
    const { files } = loadKnowledgeBase();
    res.json({ sources: files });
});

/**
 * GET /api/chat/status
 * 
 * Check if chat is configured and ready
 */
router.get('/status', (_req, res) => {
    const hasApiKey = !!GEMINI_API_KEY;
    const { files } = loadKnowledgeBase();

    res.json({
        available: hasApiKey,
        apiKeyConfigured: hasApiKey,
        knowledgeFilesCount: files.length,
        knowledgeFiles: files
    });
});

export default router;
