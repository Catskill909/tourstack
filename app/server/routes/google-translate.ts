// Google Cloud Translation API route
// This route delegates to the shared translation service.
// Kept for backward compatibility. New code should use /api/translate instead.
import express from 'express';
import {
    translateText,
    translateBatch,
    detectLanguage,
    getSupportedLanguages,
    getTranslationConfig,
} from '../services/translation.js';

const router = express.Router();

// POST /api/google-translate - Single text translation via Google Cloud
router.post('/', async (req, res) => {
    try {
        const { text, sourceLang, targetLang } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }
        if (!targetLang) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        const translatedText = await translateText(text, sourceLang || 'auto', targetLang, { provider: 'google_cloud' });

        res.json({
            translatedText,
            provider: 'google',
        });
    } catch (error) {
        console.error('Google Translate endpoint error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

// POST /api/google-translate/batch - Batch translate via Google Cloud
router.post('/batch', async (req, res) => {
    try {
        const { texts, sourceLang, targetLang } = req.body;

        if (!texts || !Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'Texts array is required' });
        }
        if (!targetLang) {
            return res.status(400).json({ error: 'Target language is required' });
        }

        const translatedTexts = await translateBatch(texts, sourceLang || 'auto', targetLang, { provider: 'google_cloud' });

        res.json({
            translations: translatedTexts.map(t => ({ translatedText: t })),
            provider: 'google',
        });
    } catch (error) {
        console.error('Google Translate batch endpoint error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

// POST /api/google-translate/detect - Detect language
router.post('/detect', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const result = await detectLanguage(text, { provider: 'google_cloud' });
        res.json(result);
    } catch (error) {
        console.error('Google Detect endpoint error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

// GET /api/google-translate/languages - Get supported languages
router.get('/languages', async (_req, res) => {
    try {
        const languages = await getSupportedLanguages({ provider: 'google_cloud' });
        res.json({ languages });
    } catch (error) {
        console.error('Google Languages endpoint error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});

// GET /api/google-translate/status - Check availability
router.get('/status', (_req, res) => {
    const config = getTranslationConfig();
    const hasApiKey = !!config.googleApiKey;

    res.json({
        available: hasApiKey,
        reason: hasApiKey ? undefined : 'GOOGLE_VISION_API_KEY not configured',
    });
});

export default router;
