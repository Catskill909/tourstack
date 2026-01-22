// Audio API Routes - Text-to-Speech generation and management
import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Deepgram TTS API configuration
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const DEEPGRAM_TTS_URL = 'https://api.deepgram.com/v1/speak';

// Audio storage paths
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const AUDIO_DIR = path.join(UPLOAD_BASE, 'audio');
const GENERATED_DIR = path.join(AUDIO_DIR, 'generated');
const PREVIEWS_DIR = path.join(AUDIO_DIR, 'previews');

// Ensure directories exist
[AUDIO_DIR, GENERATED_DIR, PREVIEWS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Deepgram Aura-2 Voice Models
export const DEEPGRAM_VOICES = {
    en: {
        name: 'English',
        voices: [
            // Featured voices
            { id: 'aura-2-thalia-en', name: 'Thalia', gender: 'female', featured: true },
            { id: 'aura-2-andromeda-en', name: 'Andromeda', gender: 'female', featured: true },
            { id: 'aura-2-helena-en', name: 'Helena', gender: 'female', featured: true },
            { id: 'aura-2-apollo-en', name: 'Apollo', gender: 'male', featured: true },
            { id: 'aura-2-arcas-en', name: 'Arcas', gender: 'male', featured: true },
            { id: 'aura-2-aries-en', name: 'Aries', gender: 'male', featured: true },
            // All other voices
            { id: 'aura-2-amalthea-en', name: 'Amalthea', gender: 'female', featured: false },
            { id: 'aura-2-asteria-en', name: 'Asteria', gender: 'female', featured: false },
            { id: 'aura-2-athena-en', name: 'Athena', gender: 'female', featured: false },
            { id: 'aura-2-atlas-en', name: 'Atlas', gender: 'male', featured: false },
            { id: 'aura-2-aurora-en', name: 'Aurora', gender: 'female', featured: false },
            { id: 'aura-2-callista-en', name: 'Callista', gender: 'female', featured: false },
            { id: 'aura-2-cora-en', name: 'Cora', gender: 'female', featured: false },
            { id: 'aura-2-cordelia-en', name: 'Cordelia', gender: 'female', featured: false },
            { id: 'aura-2-delia-en', name: 'Delia', gender: 'female', featured: false },
            { id: 'aura-2-draco-en', name: 'Draco', gender: 'male', featured: false },
            { id: 'aura-2-electra-en', name: 'Electra', gender: 'female', featured: false },
            { id: 'aura-2-harmonia-en', name: 'Harmonia', gender: 'female', featured: false },
            { id: 'aura-2-hera-en', name: 'Hera', gender: 'female', featured: false },
            { id: 'aura-2-hermes-en', name: 'Hermes', gender: 'male', featured: false },
            { id: 'aura-2-hyperion-en', name: 'Hyperion', gender: 'male', featured: false },
            { id: 'aura-2-iris-en', name: 'Iris', gender: 'female', featured: false },
            { id: 'aura-2-janus-en', name: 'Janus', gender: 'male', featured: false },
            { id: 'aura-2-juno-en', name: 'Juno', gender: 'female', featured: false },
            { id: 'aura-2-jupiter-en', name: 'Jupiter', gender: 'male', featured: false },
            { id: 'aura-2-luna-en', name: 'Luna', gender: 'female', featured: false },
            { id: 'aura-2-mars-en', name: 'Mars', gender: 'male', featured: false },
            { id: 'aura-2-minerva-en', name: 'Minerva', gender: 'female', featured: false },
            { id: 'aura-2-neptune-en', name: 'Neptune', gender: 'male', featured: false },
            { id: 'aura-2-odysseus-en', name: 'Odysseus', gender: 'male', featured: false },
            { id: 'aura-2-ophelia-en', name: 'Ophelia', gender: 'female', featured: false },
            { id: 'aura-2-orion-en', name: 'Orion', gender: 'male', featured: false },
            { id: 'aura-2-orpheus-en', name: 'Orpheus', gender: 'male', featured: false },
            { id: 'aura-2-pandora-en', name: 'Pandora', gender: 'female', featured: false },
            { id: 'aura-2-phoebe-en', name: 'Phoebe', gender: 'female', featured: false },
            { id: 'aura-2-pluto-en', name: 'Pluto', gender: 'male', featured: false },
            { id: 'aura-2-saturn-en', name: 'Saturn', gender: 'male', featured: false },
            { id: 'aura-2-selene-en', name: 'Selene', gender: 'female', featured: false },
            { id: 'aura-2-theia-en', name: 'Theia', gender: 'female', featured: false },
            { id: 'aura-2-vesta-en', name: 'Vesta', gender: 'female', featured: false },
            { id: 'aura-2-zeus-en', name: 'Zeus', gender: 'male', featured: false },
        ],
    },
    es: {
        name: 'Spanish',
        voices: [
            { id: 'aura-2-celeste-es', name: 'Celeste', gender: 'female', featured: true },
            { id: 'aura-2-estrella-es', name: 'Estrella', gender: 'female', featured: true },
            { id: 'aura-2-nestor-es', name: 'Nestor', gender: 'male', featured: true },
            { id: 'aura-2-sirio-es', name: 'Sirio', gender: 'male', featured: false },
            { id: 'aura-2-carina-es', name: 'Carina', gender: 'female', featured: false },
            { id: 'aura-2-alvaro-es', name: 'Alvaro', gender: 'male', featured: false },
            { id: 'aura-2-diana-es', name: 'Diana', gender: 'female', featured: false },
            { id: 'aura-2-aquila-es', name: 'Aquila', gender: 'female', featured: false },
            { id: 'aura-2-selena-es', name: 'Selena', gender: 'female', featured: false },
            { id: 'aura-2-javier-es', name: 'Javier', gender: 'male', featured: false },
            { id: 'aura-2-agustina-es', name: 'Agustina', gender: 'female', featured: false },
            { id: 'aura-2-antonia-es', name: 'Antonia', gender: 'female', featured: false },
            { id: 'aura-2-gloria-es', name: 'Gloria', gender: 'female', featured: false },
            { id: 'aura-2-luciano-es', name: 'Luciano', gender: 'male', featured: false },
            { id: 'aura-2-olivia-es', name: 'Olivia', gender: 'female', featured: false },
            { id: 'aura-2-silvia-es', name: 'Silvia', gender: 'female', featured: false },
            { id: 'aura-2-valerio-es', name: 'Valerio', gender: 'male', featured: false },
        ],
    },
    de: {
        name: 'German',
        voices: [
            { id: 'aura-2-viktoria-de', name: 'Viktoria', gender: 'female', featured: true },
            { id: 'aura-2-julius-de', name: 'Julius', gender: 'male', featured: true },
            { id: 'aura-2-elara-de', name: 'Elara', gender: 'female', featured: false },
            { id: 'aura-2-aurelia-de', name: 'Aurelia', gender: 'female', featured: false },
            { id: 'aura-2-lara-de', name: 'Lara', gender: 'female', featured: false },
            { id: 'aura-2-fabian-de', name: 'Fabian', gender: 'male', featured: false },
            { id: 'aura-2-kara-de', name: 'Kara', gender: 'female', featured: false },
        ],
    },
    fr: {
        name: 'French',
        voices: [
            { id: 'aura-2-agathe-fr', name: 'Agathe', gender: 'female', featured: true },
            { id: 'aura-2-hector-fr', name: 'Hector', gender: 'male', featured: true },
        ],
    },
    nl: {
        name: 'Dutch',
        voices: [
            { id: 'aura-2-rhea-nl', name: 'Rhea', gender: 'female', featured: true },
            { id: 'aura-2-sander-nl', name: 'Sander', gender: 'male', featured: true },
            { id: 'aura-2-beatrix-nl', name: 'Beatrix', gender: 'female', featured: true },
            { id: 'aura-2-daphne-nl', name: 'Daphne', gender: 'female', featured: false },
            { id: 'aura-2-cornelia-nl', name: 'Cornelia', gender: 'female', featured: false },
            { id: 'aura-2-hestia-nl', name: 'Hestia', gender: 'female', featured: false },
            { id: 'aura-2-lars-nl', name: 'Lars', gender: 'male', featured: false },
            { id: 'aura-2-roman-nl', name: 'Roman', gender: 'male', featured: false },
            { id: 'aura-2-leda-nl', name: 'Leda', gender: 'female', featured: false },
        ],
    },
    it: {
        name: 'Italian',
        voices: [
            { id: 'aura-2-livia-it', name: 'Livia', gender: 'female', featured: true },
            { id: 'aura-2-dionisio-it', name: 'Dionisio', gender: 'male', featured: true },
            { id: 'aura-2-melia-it', name: 'Melia', gender: 'female', featured: false },
            { id: 'aura-2-elio-it', name: 'Elio', gender: 'male', featured: false },
            { id: 'aura-2-flavio-it', name: 'Flavio', gender: 'male', featured: false },
            { id: 'aura-2-maia-it', name: 'Maia', gender: 'female', featured: false },
            { id: 'aura-2-cinzia-it', name: 'Cinzia', gender: 'female', featured: false },
            { id: 'aura-2-cesare-it', name: 'Cesare', gender: 'male', featured: false },
            { id: 'aura-2-perseo-it', name: 'Perseo', gender: 'male', featured: false },
            { id: 'aura-2-demetra-it', name: 'Demetra', gender: 'female', featured: false },
        ],
    },
    ja: {
        name: 'Japanese',
        voices: [
            { id: 'aura-2-fujin-ja', name: 'Fujin', gender: 'male', featured: true },
            { id: 'aura-2-izanami-ja', name: 'Izanami', gender: 'female', featured: true },
            { id: 'aura-2-uzume-ja', name: 'Uzume', gender: 'female', featured: false },
            { id: 'aura-2-ebisu-ja', name: 'Ebisu', gender: 'male', featured: false },
            { id: 'aura-2-ama-ja', name: 'Ama', gender: 'female', featured: false },
        ],
    },
};

// Audio output format options
export const AUDIO_FORMATS = [
    { id: 'mp3', name: 'MP3', mimeType: 'audio/mpeg', extension: '.mp3' },
    { id: 'wav', name: 'WAV', mimeType: 'audio/wav', extension: '.wav' },
    { id: 'ogg', name: 'OGG', mimeType: 'audio/ogg', extension: '.ogg' },
    { id: 'flac', name: 'FLAC', mimeType: 'audio/flac', extension: '.flac' },
];

// Sample rates
export const SAMPLE_RATES = [
    { id: 8000, name: '8 kHz (Phone quality)' },
    { id: 16000, name: '16 kHz (Wideband)' },
    { id: 24000, name: '24 kHz (Standard)', default: true },
    { id: 48000, name: '48 kHz (High quality)' },
];

// In-memory storage for generated audio files (would be database in production)
interface GeneratedAudio {
    id: string;
    name: string;
    text: string;
    voice: string;
    voiceName: string;
    language: string;
    encoding: string;
    sampleRate: number;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    duration?: number;
    createdAt: Date;
}

const generatedAudioFiles: Map<string, GeneratedAudio> = new Map();

// Load existing files on startup
function loadExistingFiles() {
    try {
        if (fs.existsSync(GENERATED_DIR)) {
            const metaFile = path.join(GENERATED_DIR, 'metadata.json');
            if (fs.existsSync(metaFile)) {
                const data = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
                data.forEach((item: GeneratedAudio) => {
                    item.createdAt = new Date(item.createdAt);
                    generatedAudioFiles.set(item.id, item);
                });
                console.log(`📁 Loaded ${generatedAudioFiles.size} audio files from metadata`);
            }
        }
    } catch (error) {
        console.error('Error loading audio metadata:', error);
    }
}

// Save metadata to disk
function saveMetadata() {
    try {
        const metaFile = path.join(GENERATED_DIR, 'metadata.json');
        const data = Array.from(generatedAudioFiles.values());
        fs.writeFileSync(metaFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving audio metadata:', error);
    }
}

// Load on startup
loadExistingFiles();

// GET /api/audio/voices - Get available voices grouped by language
router.get('/voices', (_req: Request, res: Response) => {
    res.json(DEEPGRAM_VOICES);
});

// GET /api/audio/formats - Get available output formats
router.get('/formats', (_req: Request, res: Response) => {
    res.json({
        formats: AUDIO_FORMATS,
        sampleRates: SAMPLE_RATES,
    });
});

// GET /api/audio/status - Check TTS service status
router.get('/status', (_req: Request, res: Response) => {
    res.json({
        deepgram: {
            configured: !!DEEPGRAM_API_KEY,
            endpoint: DEEPGRAM_TTS_URL,
        },
        whisper: {
            configured: false,
            status: 'coming_soon',
        },
        elevenlabs: {
            configured: false,
            status: 'coming_soon',
        },
    });
});

// GET /api/audio/files - List all generated audio files
router.get('/files', (_req: Request, res: Response) => {
    const files = Array.from(generatedAudioFiles.values())
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json(files);
});

// GET /api/audio/files/:id - Get single audio file metadata
router.get('/files/:id', (req: Request<{ id: string }>, res: Response) => {
    const file = generatedAudioFiles.get(req.params.id);
    if (!file) {
        return res.status(404).json({ error: 'Audio file not found' });
    }
    return res.json(file);
});

// DELETE /api/audio/files/:id - Delete an audio file
router.delete('/files/:id', (req: Request<{ id: string }>, res: Response) => {
    const file = generatedAudioFiles.get(req.params.id);
    if (!file) {
        return res.status(404).json({ error: 'Audio file not found' });
    }

    try {
        // Delete physical file
        const fullPath = path.join(UPLOAD_BASE, '..', file.fileUrl);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        // Remove from memory
        generatedAudioFiles.delete(req.params.id);
        saveMetadata();

        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting audio file:', error);
        return res.status(500).json({ error: 'Failed to delete audio file' });
    }
});

// POST /api/audio/generate - Generate TTS audio using Deepgram
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const {
            text,
            voice = 'aura-2-thalia-en',
            encoding = 'mp3',
            sampleRate = 24000,
            name,
        } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!DEEPGRAM_API_KEY) {
            return res.status(500).json({
                error: 'Deepgram API key not configured',
                hint: 'Set DEEPGRAM_API_KEY environment variable or configure in Settings',
            });
        }

        // Build query parameters
        // Note: sample_rate is only applicable for linear16/wav, not mp3/ogg/flac
        const params = new URLSearchParams({
            model: voice,
            encoding: encoding,
        });
        
        // Only add sample_rate for formats that support it
        if (encoding === 'linear16' || encoding === 'wav') {
            params.set('sample_rate', sampleRate.toString());
        }

        // Call Deepgram TTS API
        const response = await fetch(`${DEEPGRAM_TTS_URL}?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Deepgram TTS error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Deepgram TTS failed',
                details: errorText,
            });
        }

        // Properly stream and collect all audio chunks
        // Deepgram streams the audio, so we must read the entire body
        const reader = response.body?.getReader();
        if (!reader) {
            return res.status(500).json({ error: 'Failed to read response stream' });
        }

        const chunks: Uint8Array[] = [];
        let totalLength = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
                totalLength += value.length;
            }
        }

        // Combine all chunks into a single buffer
        const audioBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        console.log(`[Audio] Generated ${totalLength} bytes from ${chunks.length} chunks`);

        // Generate filename
        const id = uuidv4();
        const format = AUDIO_FORMATS.find(f => f.id === encoding) || AUDIO_FORMATS[0];
        const timestamp = Date.now();
        const filename = `${timestamp}-${voice}${format.extension}`;
        const filePath = path.join(GENERATED_DIR, filename);
        const fileUrl = `/uploads/audio/generated/${filename}`;

        // Save file
        fs.writeFileSync(filePath, Buffer.from(audioBuffer));

        // Find voice info
        let voiceName = voice;
        let language = 'en';
        for (const [lang, data] of Object.entries(DEEPGRAM_VOICES)) {
            const voiceInfo = data.voices.find(v => v.id === voice);
            if (voiceInfo) {
                voiceName = voiceInfo.name;
                language = lang;
                break;
            }
        }

        // Create record
        const audioFile: GeneratedAudio = {
            id,
            name: name || `Generated Audio - ${voiceName}`,
            text,
            voice,
            voiceName,
            language,
            encoding,
            sampleRate,
            filePath,
            fileUrl,
            fileSize: totalLength,
            createdAt: new Date(),
        };

        generatedAudioFiles.set(id, audioFile);
        saveMetadata();

        return res.status(201).json(audioFile);
    } catch (error) {
        console.error('TTS generation error:', error);
        return res.status(500).json({
            error: 'TTS generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/audio/preview - Generate a short preview for a voice (doesn't save)
router.post('/preview', async (req: Request, res: Response) => {
    try {
        const { voice = 'aura-2-thalia-en' } = req.body;

        if (!DEEPGRAM_API_KEY) {
            return res.status(500).json({
                error: 'Deepgram API key not configured',
            });
        }

        // Use a short sample text based on language
        const langCode = voice.split('-').pop()?.replace(/[0-9]/g, '') || 'en';
        const sampleTexts: Record<string, string> = {
            en: 'Hello! This is a sample of my voice. I hope you like how I sound.',
            es: '¡Hola! Esta es una muestra de mi voz. Espero que te guste cómo sueno.',
            de: 'Hallo! Dies ist eine Probe meiner Stimme. Ich hoffe, sie gefällt Ihnen.',
            fr: 'Bonjour! Ceci est un échantillon de ma voix. J\'espère qu\'elle vous plaît.',
            nl: 'Hallo! Dit is een voorbeeld van mijn stem. Ik hoop dat u het mooi vindt.',
            it: 'Ciao! Questo è un esempio della mia voce. Spero che ti piaccia.',
            ja: 'こんにちは！これは私の声のサンプルです。気に入っていただけると嬉しいです。',
        };

        const text = sampleTexts[langCode] || sampleTexts.en;

        // Note: Don't include sample_rate for mp3 - Deepgram doesn't support it
        const params = new URLSearchParams({
            model: voice,
            encoding: 'mp3',
        });

        const response = await fetch(`${DEEPGRAM_TTS_URL}?${params}`, {
            method: 'POST',
            headers: {
                'Authorization': `Token ${DEEPGRAM_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Voice preview failed',
                details: errorText,
            });
        }

        // Properly stream and collect all audio chunks
        const reader = response.body?.getReader();
        if (!reader) {
            return res.status(500).json({ error: 'Failed to read response stream' });
        }

        const chunks: Uint8Array[] = [];
        let totalLength = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
                chunks.push(value);
                totalLength += value.length;
            }
        }

        // Combine all chunks into a single buffer
        const audioBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        console.log(`[Audio Preview] Generated ${totalLength} bytes from ${chunks.length} chunks`);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', totalLength);
        return res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error('Voice preview error:', error);
        return res.status(500).json({
            error: 'Voice preview failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
