// Translation API proxy - bypasses CORS restrictions
import express from 'express';

const router = express.Router();

// LibreTranslate API endpoint - Self-hosted by TourStack
// Override with LIBRE_TRANSLATE_URL env var for different deployments
const LIBRE_TRANSLATE_API = process.env.LIBRE_TRANSLATE_URL || 'https://translate.supersoul.top/translate';
const LIBRE_TRANSLATE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY || 'TranslateThisForMe26';

// Use mock mode only if explicitly set
const USE_MOCK = process.env.LIBRE_TRANSLATE_URL === 'mock';

interface TranslateRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    apiKey?: string;
}

// Mock translation - returns text with language prefix for testing
function mockTranslate(text: string, targetLang: string): string {
    const prefixes: Record<string, string> = {
        'es': '[ES] ',
        'fr': '[FR] ',
        'de': '[DE] ',
        'it': '[IT] ',
        'pt': '[PT] ',
        'zh': '[ZH] ',
        'ja': '[JA] ',
        'ko': '[KO] ',
    };
    return (prefixes[targetLang] || `[${targetLang.toUpperCase()}] `) + text;
}

// POST /api/translate - Proxy translation requests to LibreTranslate
router.post('/', async (req, res) => {
    const { text, sourceLang, targetLang, apiKey } = req.body as TranslateRequest;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing required fields: text, sourceLang, targetLang' });
    }

    // Skip if same language
    if (sourceLang === targetLang) {
        return res.json({ translatedText: text });
    }

    // Use mock translations if no API configured
    if (USE_MOCK) {
        return res.json({
            translatedText: mockTranslate(text, targetLang),
            mock: true
        });
    }

    try {
        const body: Record<string, string> = {
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
        };

        const usedApiKey = apiKey || LIBRE_TRANSLATE_API_KEY;
        if (usedApiKey) {
            body.api_key = usedApiKey;
        }

        const response = await fetch(LIBRE_TRANSLATE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LibreTranslate error:', errorText);
            return res.status(response.status).json({
                error: 'Translation failed',
                details: errorText
            });
        }

        const data = await response.json() as { translatedText: string };
        return res.json({ translatedText: data.translatedText });

    } catch (error) {
        console.error('Translation proxy error:', error);
        return res.status(500).json({ error: 'Translation service unavailable' });
    }
});

// GET /api/translate/languages - Get supported languages
router.get('/languages', async (_req, res) => {
    try {
        const response = await fetch('https://libretranslate.com/languages');
        const languages = await response.json();
        return res.json(languages);
    } catch (error) {
        console.error('Failed to fetch languages:', error);
        return res.status(500).json({ error: 'Failed to fetch languages' });
    }
});

export default router;
