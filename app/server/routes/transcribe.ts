// Transcription API proxy - Speech-to-Text services (Deepgram, Whisper)
import express from 'express';
import multer from 'multer';

const router = express.Router();

// Deepgram API configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1/listen';

// Whisper (self-hosted) configuration
const WHISPER_ENDPOINT = process.env.WHISPER_ENDPOINT || '';

// Configure multer for audio file uploads
const audioUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max for audio files
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
            'audio/ogg', 'audio/webm', 'audio/flac', 'audio/m4a', 'audio/mp4',
            'audio/x-m4a', 'audio/aac', 'audio/aiff', 'audio/x-aiff',
            'video/webm', 'video/mp4', 'application/octet-stream'
        ];
        const allowedExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.flac', '.m4a', '.mp4', '.aac', '.aiff'];
        const ext = file.originalname ? file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.')) : '';
        
        if (allowedMimeTypes.includes(file.mimetype) || 
            file.mimetype.startsWith('audio/') || 
            allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported audio format: ${file.mimetype} (${file.originalname})`));
        }
    },
});

interface DeepgramResponse {
    results?: {
        channels?: Array<{
            alternatives?: Array<{
                transcript?: string;
                confidence?: number;
                words?: Array<{
                    word: string;
                    start: number;
                    end: number;
                    confidence: number;
                }>;
            }>;
        }>;
    };
    metadata?: {
        duration?: number;
        channels?: number;
    };
}

// POST /api/transcribe - Transcribe audio using configured provider
router.post('/', audioUpload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        const provider = req.body.provider || 'deepgram';
        const language = req.body.language || 'en';
        const model = req.body.model || 'nova-2';

        if (provider === 'deepgram') {
            return await transcribeWithDeepgram(req, res, language, model);
        } else if (provider === 'whisper') {
            return await transcribeWithWhisper(req, res, language);
        } else {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }
    } catch (error) {
        console.error('Transcription error:', error);
        return res.status(500).json({
            error: 'Transcription failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// Deepgram transcription
async function transcribeWithDeepgram(
    req: express.Request,
    res: express.Response,
    language: string,
    model: string
) {
    if (!DEEPGRAM_API_KEY) {
        return res.status(500).json({
            error: 'Deepgram API key not configured',
            hint: 'Set DEEPGRAM_API_KEY environment variable',
        });
    }

    const file = req.file!;
    
    // Build Deepgram API URL with query parameters
    const params = new URLSearchParams({
        model: model,
        language: language,
        punctuate: 'true',
        utterances: 'true',
        smart_format: 'true',
    });

    try {
        const response = await fetch(`${DEEPGRAM_API_URL}?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': file.mimetype,
            },
            body: new Uint8Array(file.buffer),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Deepgram API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Deepgram transcription failed',
                details: errorText,
            });
        }

        const data = await response.json() as DeepgramResponse;
        
        // Extract transcript from Deepgram response
        const channel = data.results?.channels?.[0];
        const alternative = channel?.alternatives?.[0];
        
        if (!alternative?.transcript) {
            return res.status(500).json({
                error: 'No transcript returned from Deepgram',
                raw: data,
            });
        }

        return res.json({
            text: alternative.transcript,
            confidence: alternative.confidence,
            words: alternative.words,
            duration: data.metadata?.duration,
            provider: 'deepgram',
            model: model,
            language: language,
        });

    } catch (error) {
        console.error('Deepgram fetch error:', error);
        throw error;
    }
}

// Whisper (self-hosted) transcription
async function transcribeWithWhisper(
    req: express.Request,
    res: express.Response,
    language: string
) {
    if (!WHISPER_ENDPOINT) {
        return res.status(500).json({
            error: 'Whisper endpoint not configured',
            hint: 'Set WHISPER_ENDPOINT environment variable (e.g., http://localhost:8080/inference)',
        });
    }

    const file = req.file!;

    try {
        // Create FormData for Whisper API (OpenAI-compatible format)
        const formData = new FormData();
        const audioBlob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
        formData.append('file', audioBlob, file.originalname || 'audio.wav');
        formData.append('language', language);
        formData.append('response_format', 'json');

        const response = await fetch(WHISPER_ENDPOINT, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Whisper API error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Whisper transcription failed',
                details: errorText,
            });
        }

        const data = await response.json() as { text?: string; segments?: Array<{ text: string; start: number; end: number }> };

        return res.json({
            text: data.text || '',
            segments: data.segments,
            provider: 'whisper',
            language: language,
        });

    } catch (error) {
        console.error('Whisper fetch error:', error);
        throw error;
    }
}

// GET /api/transcribe/status - Check transcription service status
router.get('/status', (_req, res) => {
    const status = {
        deepgram: {
            configured: !!DEEPGRAM_API_KEY,
            endpoint: DEEPGRAM_API_URL,
        },
        whisper: {
            configured: !!WHISPER_ENDPOINT,
            endpoint: WHISPER_ENDPOINT || null,
        },
    };

    return res.json(status);
});

export default router;
