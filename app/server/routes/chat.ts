import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Body: { message: string, language?: string, conversationId?: string }
 * Returns: { response: string, sources: string[] }
 */
router.post('/', async (req, res) => {
    try {
        const { message, language = 'en' } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!GEMINI_API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Gemini API key missing'
            });
        }

        // Load knowledge base
        const { context, files } = loadKnowledgeBase();

        // Build grounded system prompt
        const systemPrompt = `You are a friendly and helpful museum concierge assistant. Your role is to answer visitor questions about the museum using ONLY the information provided below.

IMPORTANT RULES:
1. ONLY answer based on the museum information provided below
2. If the answer is NOT in the provided information, politely say you don't have that specific information and suggest asking a museum staff member
3. Be concise, friendly, and helpful
4. Format responses for easy reading on mobile devices
5. If asked about something completely unrelated to the museum, politely redirect to museum-related topics

MUSEUM INFORMATION:
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
            sources: files,
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
