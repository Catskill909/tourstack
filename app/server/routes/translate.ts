// Translation API proxy - bypasses CORS restrictions
import express from 'express';
import multer from 'multer';
import path from 'path';

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

// POST /api/translate/file - Translate file content using LibreTranslate
// Supports: .txt, .odt, .odp, .docx, .pptx, .epub, .html, .srt, .pdf

// Configure multer for file uploads
const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
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

// LibreTranslate file translation endpoint
const LIBRE_TRANSLATE_FILE_API = process.env.LIBRE_TRANSLATE_URL 
    ? process.env.LIBRE_TRANSLATE_URL.replace('/translate', '/translate_file')
    : 'https://translate.supersoul.top/translate_file';

router.post('/file', fileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { sourceLang, targetLang } = req.body;
        
        if (!targetLang) {
            return res.status(400).json({ error: 'Missing targetLang parameter' });
        }

        // Use mock mode if configured
        if (USE_MOCK) {
            // For mock mode, just return the file content with a prefix
            const content = req.file.buffer.toString('utf-8');
            return res.json({
                translatedText: `[${targetLang.toUpperCase()}] ${content}`,
                mock: true,
            });
        }

        // Create FormData for LibreTranslate file API
        const formData = new FormData();
        // Convert Buffer to Uint8Array for Blob compatibility (works in Node.js and browser)
        const fileBlob = new Blob([new Uint8Array(req.file.buffer)]);
        formData.append('file', fileBlob, req.file.originalname);
        formData.append('source', sourceLang || 'auto');
        formData.append('target', targetLang);
        
        if (LIBRE_TRANSLATE_API_KEY) {
            formData.append('api_key', LIBRE_TRANSLATE_API_KEY);
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
        
        // LibreTranslate returns a URL to download the translated file
        if (data.translatedFileUrl) {
            // Fetch the translated file content
            const fileResponse = await fetch(data.translatedFileUrl);
            const translatedContent = await fileResponse.text();
            return res.json({ translatedText: translatedContent });
        }

        return res.status(500).json({ error: 'No translated file URL returned' });

    } catch (error) {
        console.error('File translation error:', error);
        return res.status(500).json({ 
            error: 'File translation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/translate/extract - Extract text from file without translation
// Useful for importing content in the source language
router.post('/extract', fileUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        
        // For plain text files, just return the content
        if (ext === '.txt' || ext === '.html' || ext === '.srt') {
            const content = req.file.buffer.toString('utf-8');
            return res.json({ text: content, format: ext.slice(1) });
        }

        // For other formats, use LibreTranslate to extract (translate to same language)
        // This leverages LibreTranslate's document parsing capabilities
        if (USE_MOCK) {
            return res.json({ 
                text: req.file.buffer.toString('utf-8'),
                format: ext.slice(1),
                mock: true,
            });
        }

        const formData = new FormData();
        const extractBlob = new Blob([new Uint8Array(req.file.buffer)]);
        formData.append('file', extractBlob, req.file.originalname);
        formData.append('source', 'auto');
        formData.append('target', 'en'); // Extract as English, user can translate after
        
        if (LIBRE_TRANSLATE_API_KEY) {
            formData.append('api_key', LIBRE_TRANSLATE_API_KEY);
        }

        const response = await fetch(LIBRE_TRANSLATE_FILE_API, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LibreTranslate extract error:', errorText);
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
