import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Use the same API key as Vision API
const API_KEY = process.env.GOOGLE_VISION_API_KEY;

// Google Cloud Translation API v2 endpoint (simpler, works with API key)
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

interface TranslateResponse {
    data?: {
        translations: Array<{
            translatedText: string;
            detectedSourceLanguage?: string;
        }>;
    };
    error?: {
        code: number;
        message: string;
        status: string;
    };
}

interface LanguagesResponse {
    data?: {
        languages: Array<{
            language: string;
            name?: string;
        }>;
    };
    error?: {
        code: number;
        message: string;
        status: string;
    };
}

interface DetectResponse {
    data?: {
        detections: Array<Array<{
            language: string;
            confidence: number;
        }>>;
    };
    error?: {
        code: number;
        message: string;
        status: string;
    };
}

// ============================================================================
// TRANSLATE TEXT
// ============================================================================

router.post('/', async (req, res) => {
    try {
        const { text, sourceLang, targetLang, format = 'text' } = req.body;

        if (!API_KEY) {
            console.error('Missing GOOGLE_VISION_API_KEY for translation');
            return res.status(500).json({
                error: 'Server configuration error: Google API key not found.'
            });
        }

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!targetLang) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        // Build request body
        const requestBody: Record<string, unknown> = {
            q: text,
            target: targetLang,
            format: format, // 'text' or 'html'
        };

        // Only add source if not auto-detect
        if (sourceLang && sourceLang !== 'auto') {
            requestBody.source = sourceLang;
        }

        const response = await fetch(`${TRANSLATE_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'http://localhost:3000'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json() as TranslateResponse;

        if (data.error) {
            console.error('Google Translate API Error:', data.error);
            return res.status(data.error.code || 500).json({
                error: data.error.message,
                details: data.error
            });
        }

        if (!data.data?.translations?.[0]) {
            return res.status(500).json({ error: 'No translation returned' });
        }

        const translation = data.data.translations[0];

        res.json({
            translatedText: translation.translatedText,
            detectedSourceLanguage: translation.detectedSourceLanguage,
            provider: 'google'
        });

    } catch (error) {
        console.error('Google Translate endpoint error:', error);
        res.status(500).json({ error: 'Internal server error processing translation' });
    }
});

// ============================================================================
// BATCH TRANSLATE
// ============================================================================

router.post('/batch', async (req, res) => {
    try {
        const { texts, sourceLang, targetLang, format = 'text' } = req.body;

        if (!API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Google API key not found.'
            });
        }

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Texts array is required' });
        }

        if (!targetLang) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        // Google API accepts 'q' as array for batch
        const requestBody: Record<string, unknown> = {
            q: texts,
            target: targetLang,
            format: format,
        };

        if (sourceLang && sourceLang !== 'auto') {
            requestBody.source = sourceLang;
        }

        const response = await fetch(`${TRANSLATE_API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'http://localhost:3000'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json() as TranslateResponse;

        if (data.error) {
            console.error('Google Translate Batch API Error:', data.error);
            return res.status(data.error.code || 500).json({
                error: data.error.message,
                details: data.error
            });
        }

        if (!data.data?.translations) {
            return res.status(500).json({ error: 'No translations returned' });
        }

        res.json({
            translations: data.data.translations.map(t => ({
                translatedText: t.translatedText,
                detectedSourceLanguage: t.detectedSourceLanguage
            })),
            provider: 'google'
        });

    } catch (error) {
        console.error('Google Translate batch endpoint error:', error);
        res.status(500).json({ error: 'Internal server error processing batch translation' });
    }
});

// ============================================================================
// DETECT LANGUAGE
// ============================================================================

router.post('/detect', async (req, res) => {
    try {
        const { text } = req.body;

        if (!API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Google API key not found.'
            });
        }

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const response = await fetch(`${TRANSLATE_API_URL}/detect?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'http://localhost:3000'
            },
            body: JSON.stringify({ q: text })
        });

        const data = await response.json() as DetectResponse;

        if (data.error) {
            console.error('Google Detect API Error:', data.error);
            return res.status(data.error.code || 500).json({
                error: data.error.message,
                details: data.error
            });
        }

        if (!data.data?.detections?.[0]?.[0]) {
            return res.status(500).json({ error: 'No detection result' });
        }

        const detection = data.data.detections[0][0];

        res.json({
            language: detection.language,
            confidence: detection.confidence
        });

    } catch (error) {
        console.error('Google Detect endpoint error:', error);
        res.status(500).json({ error: 'Internal server error detecting language' });
    }
});

// ============================================================================
// GET SUPPORTED LANGUAGES
// ============================================================================

router.get('/languages', async (req, res) => {
    try {
        const { target = 'en' } = req.query;

        if (!API_KEY) {
            return res.status(500).json({
                error: 'Server configuration error: Google API key not found.'
            });
        }

        const response = await fetch(
            `${TRANSLATE_API_URL}/languages?key=${API_KEY}&target=${target}`,
            {
                method: 'GET',
                headers: {
                    'Referer': 'http://localhost:3000'
                }
            }
        );

        const data = await response.json() as LanguagesResponse;

        if (data.error) {
            console.error('Google Languages API Error:', data.error);
            return res.status(data.error.code || 500).json({
                error: data.error.message,
                details: data.error
            });
        }

        if (!data.data?.languages) {
            return res.status(500).json({ error: 'No languages returned' });
        }

        res.json({
            languages: data.data.languages.map(l => ({
                code: l.language,
                name: l.name || l.language
            }))
        });

    } catch (error) {
        console.error('Google Languages endpoint error:', error);
        res.status(500).json({ error: 'Internal server error fetching languages' });
    }
});

// ============================================================================
// STATUS CHECK
// ============================================================================

router.get('/status', async (_req, res) => {
    const hasApiKey = !!API_KEY;

    if (!hasApiKey) {
        return res.json({
            available: false,
            reason: 'GOOGLE_VISION_API_KEY not configured'
        });
    }

    // Quick test to verify API key works
    try {
        const response = await fetch(
            `${TRANSLATE_API_URL}/languages?key=${API_KEY}&target=en`,
            {
                method: 'GET',
                headers: { 'Referer': 'http://localhost:3000' }
            }
        );

        const data = await response.json() as LanguagesResponse;

        if (data.error) {
            return res.json({
                available: false,
                reason: data.error.message
            });
        }

        res.json({
            available: true,
            languageCount: data.data?.languages?.length || 0
        });

    } catch (error) {
        res.json({
            available: false,
            reason: 'Failed to connect to Google Translate API'
        });
    }
});

export default router;
