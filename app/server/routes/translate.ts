// Translation API proxy - unified provider-aware route
// Supports Google Cloud Translation and LibreTranslate
import express from 'express';
import multer from 'multer';
import path from 'path';
import {
    translateText,
    translateBatch,
    detectLanguage,
    getSupportedLanguages,
    getTranslationStatus,
    getTranslationConfig,
    isMockMode,
    mockTranslate,
    type TranslationProvider,
} from '../services/translation.js';

const router = express.Router();

// Re-export type for frontend compatibility
export type { TranslationProvider };

// LibreTranslate file API (only used for native file translation)
const LIBRE_TRANSLATE_FILE_API = process.env.LIBRE_TRANSLATE_URL
    ? process.env.LIBRE_TRANSLATE_URL.replace('/translate', '/translate_file')
    : 'https://translate.supersoul.top/translate_file';

interface TranslateRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    provider?: TranslationProvider;
    apiKey?: string;
}

interface BatchTranslateRequest {
    texts: string[];
    sourceLang: string;
    targetLang: string;
    provider?: TranslationProvider;
    apiKey?: string;
}

// POST /api/translate - Translate text with provider selection
router.post('/', async (req, res) => {
    const { text, sourceLang, targetLang, provider } = req.body as TranslateRequest;

    if (!text || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing required fields: text, sourceLang, targetLang' });
    }

    if (sourceLang === targetLang) {
        return res.json({ translatedText: text, provider: provider || getTranslationConfig().provider });
    }

    try {
        const configOverride = provider ? { provider } : undefined;
        const translatedText = await translateText(text, sourceLang, targetLang, configOverride);
        return res.json({
            translatedText,
            provider: provider || getTranslationConfig().provider,
        });
    } catch (error) {
        console.error('Translation proxy error:', error);
        return res.status(500).json({
            error: 'Translation service unavailable',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/translate/batch - Batch translate multiple texts
router.post('/batch', async (req, res) => {
    const { texts, sourceLang, targetLang, provider } = req.body as BatchTranslateRequest;

    if (!texts || !Array.isArray(texts) || !sourceLang || !targetLang) {
        return res.status(400).json({ error: 'Missing required fields: texts (array), sourceLang, targetLang' });
    }

    if (sourceLang === targetLang) {
        return res.json({ translatedTexts: texts });
    }

    if (isMockMode()) {
        return res.json({
            translatedTexts: texts.map(text => mockTranslate(text, targetLang)),
            mock: true,
        });
    }

    try {
        const configOverride = provider ? { provider } : undefined;
        const translatedTexts = await translateBatch(texts, sourceLang, targetLang, configOverride);
        return res.json({ translatedTexts });
    } catch (error) {
        console.error('Batch translation error:', error);
        return res.status(500).json({
            error: 'Batch translation service unavailable',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/translate/languages - Get supported languages for active provider
router.get('/languages', async (_req, res) => {
    try {
        const languages = await getSupportedLanguages();
        return res.json({ languages });
    } catch (error) {
        console.error('Failed to fetch languages:', error);
        return res.status(500).json({ error: 'Failed to fetch languages' });
    }
});

// POST /api/translate/detect - Detect language (Google Cloud only)
router.post('/detect', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const result = await detectLanguage(text);
        return res.json(result);
    } catch (error) {
        console.error('Language detection error:', error);
        return res.status(500).json({
            error: 'Language detection failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/translate/status - Get active provider and availability
router.get('/status', (_req, res) => {
    const status = getTranslationStatus();
    return res.json(status);
});

// ============================================================================
// FILE TRANSLATION
// ============================================================================

const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowedExtensions = ['.txt', '.odt', '.odp', '.docx', '.pptx', '.epub', '.html', '.srt', '.pdf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${ext}. Supported: ${allowedExtensions.join(', ')}`));
        }
    },
});

// POST /api/translate/file - Translate file content
// When LibreTranslate is active: uses native /translate_file endpoint
// When Google Cloud is active: extracts text then translates via Google API
router.post('/file', fileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { sourceLang, targetLang, provider: requestProvider } = req.body;

        if (!targetLang) {
            return res.status(400).json({ error: 'Missing targetLang parameter' });
        }

        if (isMockMode()) {
            const content = req.file.buffer.toString('utf-8');
            return res.json({
                translatedText: `[${targetLang.toUpperCase()}] ${content}`,
                mock: true,
            });
        }

        const config = getTranslationConfig();
        const activeProvider = (requestProvider as TranslationProvider) || config.provider;

        if (activeProvider === 'google_cloud') {
            // Google Cloud: extract text from file, then translate
            const ext = path.extname(req.file.originalname).toLowerCase();
            let textContent: string;

            if (['.txt', '.html', '.srt'].includes(ext)) {
                textContent = req.file.buffer.toString('utf-8');
            } else {
                // Use LibreTranslate's file parsing to extract text (translate to English first)
                const formData = new FormData();
                const fileBlob = new Blob([new Uint8Array(req.file.buffer)]);
                formData.append('file', fileBlob, req.file.originalname);
                formData.append('source', 'auto');
                formData.append('target', 'en');
                if (config.libreTranslateApiKey) {
                    formData.append('api_key', config.libreTranslateApiKey);
                }

                const extractResponse = await fetch(LIBRE_TRANSLATE_FILE_API, {
                    method: 'POST',
                    body: formData,
                });

                if (!extractResponse.ok) {
                    const errorText = await extractResponse.text();
                    return res.status(extractResponse.status).json({
                        error: 'File text extraction failed',
                        details: errorText,
                    });
                }

                const extractData = await extractResponse.json() as { translatedFileUrl?: string };
                if (extractData.translatedFileUrl) {
                    const fileResponse = await fetch(extractData.translatedFileUrl);
                    textContent = await fileResponse.text();
                } else {
                    return res.status(500).json({ error: 'File text extraction failed' });
                }
            }

            // Now translate the extracted text with Google Cloud
            const translatedText = await translateText(textContent, sourceLang || 'en', targetLang, { provider: 'google_cloud' });
            return res.json({ translatedText, provider: 'google_cloud' });

        } else {
            // LibreTranslate: use native file translation
            const formData = new FormData();
            const fileBlob = new Blob([new Uint8Array(req.file.buffer)]);
            formData.append('file', fileBlob, req.file.originalname);
            formData.append('source', sourceLang || 'auto');
            formData.append('target', targetLang);

            if (config.libreTranslateApiKey) {
                formData.append('api_key', config.libreTranslateApiKey);
            }

            const response = await fetch(LIBRE_TRANSLATE_FILE_API, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('LibreTranslate file translation error:', errorText);
                return res.status(response.status).json({
                    error: 'File translation failed',
                    details: errorText,
                });
            }

            const data = await response.json() as { translatedFileUrl?: string };

            if (data.translatedFileUrl) {
                const fileResponse = await fetch(data.translatedFileUrl);
                const translatedContent = await fileResponse.text();
                return res.json({ translatedText: translatedContent, provider: 'libretranslate' });
            }

            return res.status(500).json({ error: 'No translated file URL returned' });
        }
    } catch (error) {
        console.error('File translation error:', error);
        return res.status(500).json({
            error: 'File translation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/translate/extract - Extract text from file without translation
router.post('/extract', fileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === '.txt' || ext === '.html' || ext === '.srt') {
            const content = req.file.buffer.toString('utf-8');
            return res.json({ text: content, format: ext.slice(1) });
        }

        if (isMockMode()) {
            return res.json({
                text: req.file.buffer.toString('utf-8'),
                format: ext.slice(1),
                mock: true,
            });
        }

        const config = getTranslationConfig();
        const formData = new FormData();
        const extractBlob = new Blob([new Uint8Array(req.file.buffer)]);
        formData.append('file', extractBlob, req.file.originalname);
        formData.append('source', 'auto');
        formData.append('target', 'en');

        if (config.libreTranslateApiKey) {
            formData.append('api_key', config.libreTranslateApiKey);
        }

        const response = await fetch(LIBRE_TRANSLATE_FILE_API, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('File extract error:', errorText);
            return res.status(response.status).json({
                error: 'Text extraction failed',
                details: errorText,
            });
        }

        const data = await response.json() as { translatedFileUrl?: string };

        if (data.translatedFileUrl) {
            const fileResponse = await fetch(data.translatedFileUrl);
            const extractedContent = await fileResponse.text();
            return res.json({ text: extractedContent, format: ext.slice(1) });
        }

        return res.status(500).json({ error: 'Text extraction failed' });
    } catch (error) {
        console.error('Text extraction error:', error);
        return res.status(500).json({
            error: 'Text extraction failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
