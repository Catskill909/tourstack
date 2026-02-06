// Google Cloud Text-to-Speech API Routes
// Uses the REST API with API key authentication (same key as Vision/Translate)
// Supports Neural2 + Standard voice types
//
// API Reference: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
// Voice list: https://cloud.google.com/text-to-speech/docs/voices
//
import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Google Cloud TTS API configuration
const GOOGLE_TTS_API_URL = 'https://texttospeech.googleapis.com/v1';

// Get API key (shared with Vision and Google Translate)
function getApiKey(): string {
    return process.env.GOOGLE_VISION_API_KEY || '';
}

// Audio storage paths (shared with Deepgram and ElevenLabs)
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const AUDIO_DIR = path.join(UPLOAD_BASE, 'audio');
const GENERATED_DIR = path.join(AUDIO_DIR, 'generated');

// Ensure directories exist
[AUDIO_DIR, GENERATED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// =============================================================================
// STATIC DATA
// =============================================================================

// Supported audio formats
export const GOOGLE_TTS_FORMATS = [
    { id: 'MP3', name: 'MP3', mimeType: 'audio/mpeg', extension: '.mp3' },
    { id: 'LINEAR16', name: 'WAV (PCM 16-bit)', mimeType: 'audio/wav', extension: '.wav' },
    { id: 'OGG_OPUS', name: 'OGG Opus', mimeType: 'audio/ogg', extension: '.ogg' },
];

// Supported sample rates
export const GOOGLE_TTS_SAMPLE_RATES = [
    { id: 16000, name: '16 kHz (Compact)' },
    { id: 24000, name: '24 kHz (Standard)', default: true },
    { id: 44100, name: '44.1 kHz (High Quality)' },
    { id: 48000, name: '48 kHz (Studio)' },
];

// Map our 2-letter language codes to Google's BCP-47 codes
const LANGUAGE_CODE_MAP: Record<string, string> = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'ja': 'ja-JP',
    'nl': 'nl-NL',
    'ko': 'ko-KR',
    'pt': 'pt-BR',
    'zh': 'cmn-CN',
    'ar': 'ar-XA',
    'hi': 'hi-IN',
    'ru': 'ru-RU',
    'pl': 'pl-PL',
    'sv': 'sv-SE',
    'da': 'da-DK',
    'fi': 'fi-FI',
    'nb': 'nb-NO',
    'tr': 'tr-TR',
    'uk': 'uk-UA',
    'vi': 'vi-VN',
    'th': 'th-TH',
    'id': 'id-ID',
    'cs': 'cs-CZ',
    'el': 'el-GR',
    'hu': 'hu-HU',
    'ro': 'ro-RO',
    'sk': 'sk-SK',
    'bg': 'bg-BG',
    'ms': 'ms-MY',
    'he': 'he-IL',
};

// Reverse map: Google BCP-47 → our 2-letter code
const REVERSE_LANGUAGE_MAP: Record<string, string> = {};
for (const [short, bcp47] of Object.entries(LANGUAGE_CODE_MAP)) {
    REVERSE_LANGUAGE_MAP[bcp47] = short;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
    'it': 'Italian', 'ja': 'Japanese', 'nl': 'Dutch', 'ko': 'Korean',
    'pt': 'Portuguese', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
    'ru': 'Russian', 'pl': 'Polish', 'sv': 'Swedish', 'da': 'Danish',
    'fi': 'Finnish', 'nb': 'Norwegian', 'tr': 'Turkish', 'uk': 'Ukrainian',
    'vi': 'Vietnamese', 'th': 'Thai', 'id': 'Indonesian', 'cs': 'Czech',
    'el': 'Greek', 'hu': 'Hungarian', 'ro': 'Romanian', 'sk': 'Slovak',
    'bg': 'Bulgarian', 'ms': 'Malay', 'he': 'Hebrew',
};

// Voice types we support (filter out WaveNet, Studio, Journey for now)
const SUPPORTED_VOICE_TYPES = ['Standard', 'Neural2'];

// Sample texts per language for voice preview
const SAMPLE_TEXTS: Record<string, string> = {
    'en': 'Hello! This is a sample of my voice. Welcome to the museum tour.',
    'es': '¡Hola! Esta es una muestra de mi voz. Bienvenido al recorrido del museo.',
    'fr': 'Bonjour! Ceci est un échantillon de ma voix. Bienvenue dans la visite du musée.',
    'de': 'Hallo! Dies ist eine Probe meiner Stimme. Willkommen zur Museumsführung.',
    'it': 'Ciao! Questo è un esempio della mia voce. Benvenuto al tour del museo.',
    'ja': 'こんにちは！これは私の声のサンプルです。美術館ツアーへようこそ。',
    'nl': 'Hallo! Dit is een voorbeeld van mijn stem. Welkom bij de museumrondleiding.',
    'ko': '안녕하세요! 이것은 제 목소리의 샘플입니다. 박물관 투어에 오신 것을 환영합니다.',
    'pt': 'Olá! Esta é uma amostra da minha voz. Bem-vindo ao tour do museu.',
    'zh': '你好！这是我的声音样本。欢迎参加博物馆之旅。',
};

// =============================================================================
// VOICE CACHE
// =============================================================================

interface CachedVoices {
    voices: GoogleVoice[];
    timestamp: number;
}

interface GoogleVoice {
    languageCodes: string[];
    name: string;
    ssmlGender: string;
    naturalSampleRateHertz: number;
}

let voiceCache: CachedVoices | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

async function fetchVoices(): Promise<GoogleVoice[]> {
    // Return cached if fresh
    if (voiceCache && (Date.now() - voiceCache.timestamp) < CACHE_DURATION) {
        return voiceCache.voices;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Google API key not configured');
    }

    const response = await fetch(`${GOOGLE_TTS_API_URL}/voices?key=${apiKey}`, {
        headers: { 'Referer': 'http://localhost:3000' },
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch voices: ${errorText}`);
    }

    const data = await response.json() as { voices?: GoogleVoice[] };
    const allVoices = data.voices || [];

    // Filter to Standard + Neural2 only
    const filtered = allVoices.filter(v => {
        const voiceType = getVoiceType(v.name);
        return SUPPORTED_VOICE_TYPES.includes(voiceType);
    });

    voiceCache = { voices: filtered, timestamp: Date.now() };
    console.log(`[Google TTS] Cached ${filtered.length} voices (filtered from ${allVoices.length} total)`);

    return filtered;
}

// Extract voice type from name (e.g., 'en-US-Neural2-D' → 'Neural2')
function getVoiceType(name: string): string {
    const parts = name.split('-');
    if (parts.length >= 3) {
        // Format: lang-region-Type-Variant or lang-region-TypeVariant
        return parts[2].replace(/[A-Z]$/, '');
    }
    return 'Unknown';
}

// Get display name for a voice (e.g., 'en-US-Neural2-D' → 'Neural2 D')
function getVoiceDisplayName(name: string): string {
    const parts = name.split('-');
    if (parts.length >= 4) {
        return `${parts[2]} ${parts[3]}`;
    } else if (parts.length >= 3) {
        return parts[2];
    }
    return name;
}

// =============================================================================
// METADATA MANAGEMENT
// =============================================================================

interface GeneratedAudio {
    id: string;
    name: string;
    text: string;
    voiceId: string;
    voiceName: string;
    languageCode: string;
    encoding: string;
    sampleRate: number;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    provider: 'google_cloud';
    createdAt: Date;
}

// In-memory storage for generated audio files
const generatedAudioFiles = new Map<string, GeneratedAudio>();

// Metadata file path
const METADATA_FILE = path.join(GENERATED_DIR, 'google-tts-metadata.json');

// Load metadata on startup
function loadMetadata() {
    try {
        if (fs.existsSync(METADATA_FILE)) {
            const data = fs.readFileSync(METADATA_FILE, 'utf-8');
            const items = JSON.parse(data) as GeneratedAudio[];
            items.forEach(item => {
                if (fs.existsSync(item.filePath)) {
                    generatedAudioFiles.set(item.id, item);
                }
            });
            console.log(`📁 Loaded ${generatedAudioFiles.size} Google TTS audio files from metadata`);
        }
    } catch (error) {
        console.error('Error loading Google TTS metadata:', error);
    }
}

// Save metadata
function saveMetadata() {
    try {
        const items = Array.from(generatedAudioFiles.values());
        fs.writeFileSync(METADATA_FILE, JSON.stringify(items, null, 2));
    } catch (error) {
        console.error('Error saving Google TTS metadata:', error);
    }
}

// Load metadata on module init
loadMetadata();

// =============================================================================
// ROUTES
// =============================================================================

// GET /api/google-tts/status - Check API key validity
router.get('/status', async (_req: Request, res: Response) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return res.json({
            configured: false,
            error: 'Google API key not configured',
            hint: 'Set GOOGLE_VISION_API_KEY environment variable (shared with Vision and Google Translate)',
        });
    }

    try {
        // Validate by fetching voice list
        const voices = await fetchVoices();
        return res.json({
            configured: true,
            valid: true,
            voiceCount: voices.length,
        });
    } catch (error) {
        return res.json({
            configured: true,
            valid: false,
            error: error instanceof Error ? error.message : 'Failed to validate API key',
        });
    }
});

// GET /api/google-tts/voices - Get available voices
router.get('/voices', async (req: Request, res: Response) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return res.status(500).json({
            error: 'Google API key not configured',
            hint: 'Set GOOGLE_VISION_API_KEY environment variable',
        });
    }

    const languageFilter = req.query.language as string || '';

    try {
        const allVoices = await fetchVoices();

        // Group voices by language
        const voicesByLanguage: Record<string, Array<{
            id: string;
            name: string;
            displayName: string;
            languageCode: string;
            ssmlGender: string;
            type: string;
            naturalSampleRateHertz: number;
        }>> = {};

        for (const voice of allVoices) {
            for (const langCode of voice.languageCodes) {
                // Get our short code for this language
                const shortCode = REVERSE_LANGUAGE_MAP[langCode];
                if (!shortCode) continue; // Skip languages we don't support

                // Apply filter if specified
                if (languageFilter && shortCode !== languageFilter && langCode !== languageFilter) {
                    continue;
                }

                if (!voicesByLanguage[shortCode]) {
                    voicesByLanguage[shortCode] = [];
                }

                voicesByLanguage[shortCode].push({
                    id: voice.name,
                    name: voice.name,
                    displayName: getVoiceDisplayName(voice.name),
                    languageCode: langCode,
                    ssmlGender: voice.ssmlGender,
                    type: getVoiceType(voice.name),
                    naturalSampleRateHertz: voice.naturalSampleRateHertz,
                });
            }
        }

        // Sort voices within each language: Neural2 first, then Standard, then by name
        for (const lang of Object.keys(voicesByLanguage)) {
            voicesByLanguage[lang].sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'Neural2' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
        }

        return res.json({
            voices: voicesByLanguage,
            language: languageFilter || 'all',
        });
    } catch (error) {
        console.error('Error fetching Google TTS voices:', error);
        return res.status(500).json({
            error: 'Failed to fetch voices',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/google-tts/formats - Get supported audio formats
router.get('/formats', (_req: Request, res: Response) => {
    return res.json({
        formats: GOOGLE_TTS_FORMATS,
        sampleRates: GOOGLE_TTS_SAMPLE_RATES,
    });
});

// GET /api/google-tts/languages - Get supported languages
router.get('/languages', async (_req: Request, res: Response) => {
    const apiKey = getApiKey();
    if (!apiKey) {
        return res.status(500).json({ error: 'Google API key not configured' });
    }

    try {
        const allVoices = await fetchVoices();

        // Count voices per language
        const langCounts: Record<string, number> = {};
        for (const voice of allVoices) {
            for (const langCode of voice.languageCodes) {
                const shortCode = REVERSE_LANGUAGE_MAP[langCode];
                if (shortCode) {
                    langCounts[shortCode] = (langCounts[shortCode] || 0) + 1;
                }
            }
        }

        // Build language list
        const languages = Object.entries(langCounts)
            .map(([code, count]) => ({
                code,
                name: LANGUAGE_NAMES[code] || code,
                googleCode: LANGUAGE_CODE_MAP[code] || code,
                voiceCount: count,
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

        return res.json(languages);
    } catch (error) {
        console.error('Error fetching Google TTS languages:', error);
        return res.status(500).json({
            error: 'Failed to fetch languages',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/google-tts/generate - Generate TTS audio
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const {
            text,
            voiceId,
            voiceName,
            encoding = 'MP3',
            sampleRate = 24000,
            speakingRate = 1.0,
            pitch = 0.0,
            name,
        } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!voiceId) {
            return res.status(400).json({ error: 'Voice ID is required' });
        }

        // Check text length (Google limit is 5000 bytes)
        const textBytes = Buffer.byteLength(text.trim(), 'utf-8');
        if (textBytes > 5000) {
            return res.status(400).json({
                error: `Text exceeds Google TTS limit (${textBytes} bytes, max 5000)`,
                hint: 'Shorten your text or split it into multiple parts',
            });
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            return res.status(500).json({
                error: 'Google API key not configured',
                hint: 'Set GOOGLE_VISION_API_KEY environment variable',
            });
        }

        // Extract language code from voice ID (e.g., 'en-US-Neural2-D' → 'en-US')
        const voiceParts = voiceId.split('-');
        const languageCode = voiceParts.length >= 2 ? `${voiceParts[0]}-${voiceParts[1]}` : 'en-US';

        // Build Google TTS request
        const requestBody = {
            input: { text: text.trim() },
            voice: {
                languageCode,
                name: voiceId,
            },
            audioConfig: {
                audioEncoding: encoding,
                sampleRateHertz: sampleRate,
                speakingRate,
                pitch,
            },
        };

        // Call Google Cloud TTS API
        const response = await fetch(
            `${GOOGLE_TTS_API_URL}/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Referer': 'http://localhost:3000' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google TTS error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Google Cloud TTS failed',
                details: errorText,
            });
        }

        const data = await response.json() as { audioContent: string };

        // Decode base64 audio
        const audioBuffer = Buffer.from(data.audioContent, 'base64');

        // Generate filename
        const id = uuidv4();
        const format = GOOGLE_TTS_FORMATS.find(f => f.id === encoding) || GOOGLE_TTS_FORMATS[0];
        const timestamp = Date.now();
        const filename = `${timestamp}-google-${voiceId}${format.extension}`;
        const filePath = path.join(GENERATED_DIR, filename);
        const fileUrl = `/uploads/audio/generated/${filename}`;

        // Save file
        fs.writeFileSync(filePath, audioBuffer);

        console.log(`[Google TTS] Generated ${audioBuffer.length} bytes for voice ${voiceId}`);

        // Create record
        const audioFile: GeneratedAudio = {
            id,
            name: name || `Google TTS - ${voiceName || getVoiceDisplayName(voiceId)}`,
            text,
            voiceId,
            voiceName: voiceName || getVoiceDisplayName(voiceId),
            languageCode,
            encoding,
            sampleRate,
            filePath,
            fileUrl,
            fileSize: audioBuffer.length,
            provider: 'google_cloud',
            createdAt: new Date(),
        };

        generatedAudioFiles.set(id, audioFile);
        saveMetadata();

        return res.status(201).json(audioFile);
    } catch (error) {
        console.error('Google TTS generation error:', error);
        return res.status(500).json({
            error: 'TTS generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/google-tts/files - Get all generated audio files
router.get('/files', (_req: Request, res: Response) => {
    const files = Array.from(generatedAudioFiles.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(files);
});

// DELETE /api/google-tts/files/:id - Delete a generated audio file
router.delete('/files/:id', (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const audioFile = generatedAudioFiles.get(id);

    if (!audioFile) {
        return res.status(404).json({ error: 'Audio file not found' });
    }

    // Delete the actual file
    try {
        if (fs.existsSync(audioFile.filePath)) {
            fs.unlinkSync(audioFile.filePath);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
    }

    // Remove from memory
    generatedAudioFiles.delete(id);
    saveMetadata();

    return res.json({ success: true });
});

// POST /api/google-tts/preview - Generate a voice preview
router.post('/preview', async (req: Request, res: Response) => {
    try {
        const { voiceId, text } = req.body;

        if (!voiceId) {
            return res.status(400).json({ error: 'Voice ID is required' });
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            return res.status(500).json({
                error: 'Google API key not configured',
            });
        }

        // Extract language code from voice ID
        const voiceParts = voiceId.split('-');
        const languageCode = voiceParts.length >= 2 ? `${voiceParts[0]}-${voiceParts[1]}` : 'en-US';

        // Get appropriate sample text
        const shortLang = REVERSE_LANGUAGE_MAP[languageCode] || 'en';
        const previewText = text || SAMPLE_TEXTS[shortLang] || SAMPLE_TEXTS['en'];

        const requestBody = {
            input: { text: previewText },
            voice: {
                languageCode,
                name: voiceId,
            },
            audioConfig: {
                audioEncoding: 'MP3',
                sampleRateHertz: 24000,
            },
        };

        const response = await fetch(
            `${GOOGLE_TTS_API_URL}/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Referer': 'http://localhost:3000' },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Voice preview failed',
                details: errorText,
            });
        }

        const data = await response.json() as { audioContent: string };
        const audioBuffer = Buffer.from(data.audioContent, 'base64');

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioBuffer.length);
        return res.send(audioBuffer);
    } catch (error) {
        console.error('Voice preview error:', error);
        return res.status(500).json({
            error: 'Voice preview failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// =============================================================================
// BATCH GENERATION FOR AUDIO COLLECTIONS
// =============================================================================

// LibreTranslate API for batch translation
const LIBRE_TRANSLATE_API = process.env.LIBRE_TRANSLATE_URL || 'https://translate.supersoul.top/translate';
const LIBRE_TRANSLATE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY || 'TranslateThisForMe26';

// Language code mapping for LibreTranslate
const LIBRE_LANGUAGE_CODE_MAP: Record<string, string> = {
    'zh': 'zh-Hans',
};

// Translate text using LibreTranslate
async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<string> {
    const mappedSource = LIBRE_LANGUAGE_CODE_MAP[sourceLang] || sourceLang;
    const mappedTarget = LIBRE_LANGUAGE_CODE_MAP[targetLang] || targetLang;

    const body: Record<string, string> = {
        q: text,
        source: mappedSource,
        target: mappedTarget,
        format: 'text',
    };

    if (LIBRE_TRANSLATE_API_KEY) {
        body.api_key = LIBRE_TRANSLATE_API_KEY;
    }

    const response = await fetch(LIBRE_TRANSLATE_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Translation failed: ${errorText}`);
    }

    const data = await response.json() as { translatedText: string };
    return data.translatedText;
}

// Generate single audio file via Google Cloud TTS (internal helper)
async function generateSingleAudioGC(
    text: string,
    voiceId: string,
    encoding: string,
    sampleRate: number
): Promise<{ buffer: Buffer; size: number }> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Google API key not configured');
    }

    // Check text length
    const textBytes = Buffer.byteLength(text.trim(), 'utf-8');
    if (textBytes > 5000) {
        throw new Error(`Text exceeds Google TTS limit (${textBytes} bytes, max 5000)`);
    }

    // Extract language code from voice ID
    const voiceParts = voiceId.split('-');
    const languageCode = voiceParts.length >= 2 ? `${voiceParts[0]}-${voiceParts[1]}` : 'en-US';

    const requestBody = {
        input: { text: text.trim() },
        voice: {
            languageCode,
            name: voiceId,
        },
        audioConfig: {
            audioEncoding: encoding,
            sampleRateHertz: sampleRate,
        },
    };

    const response = await fetch(
        `${GOOGLE_TTS_API_URL}/text:synthesize?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Referer': 'http://localhost:3000' },
            body: JSON.stringify(requestBody),
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google Cloud TTS failed: ${errorText}`);
    }

    const data = await response.json() as { audioContent: string };
    const buffer = Buffer.from(data.audioContent, 'base64');

    return { buffer, size: buffer.length };
}

// Batch generation request interface
interface BatchLanguageConfig {
    code: string;
    voiceId: string;
    voiceName: string;
}

interface BatchGenerateRequest {
    text: string;
    collectionName: string;
    collectionDescription?: string;
    encoding?: string;
    sampleRate?: number;
    autoTranslate: boolean;
    sourceLanguage: string;
    languages: BatchLanguageConfig[];
}

// POST /api/google-tts/generate-batch - Generate audio for multiple languages
router.post('/generate-batch', async (req: Request, res: Response) => {
    try {
        const {
            text,
            collectionName,
            collectionDescription,
            encoding = 'MP3',
            sampleRate = 24000,
            autoTranslate = true,
            sourceLanguage = 'en',
            languages,
        } = req.body as BatchGenerateRequest;

        // Validation
        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!collectionName) {
            return res.status(400).json({ error: 'Collection name is required' });
        }

        if (!languages || !Array.isArray(languages) || languages.length === 0) {
            return res.status(400).json({ error: 'At least one language is required' });
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            return res.status(500).json({
                error: 'Google API key not configured',
                hint: 'Set GOOGLE_VISION_API_KEY environment variable',
            });
        }

        console.log(`[Google TTS Batch] Starting batch generation for ${languages.length} languages`);

        // Store texts for each language
        const texts: Record<string, string> = { [sourceLanguage]: text };

        // Results tracking
        const results: Array<{
            language: string;
            success: boolean;
            item?: {
                id: string;
                type: 'audio';
                url: string;
                language: string;
                voice: { id: string; name: string; gender?: string };
                provider: string;
                format: string;
                sampleRate: number;
                fileSize: number;
                text: string;
                order: number;
            };
            error?: string;
        }> = [];

        // Process each language sequentially
        for (let i = 0; i < languages.length; i++) {
            const lang = languages[i];
            console.log(`[Google TTS Batch] Processing ${lang.code} (${i + 1}/${languages.length})`);

            try {
                // Get or translate text
                let langText = text;
                if (lang.code !== sourceLanguage && autoTranslate) {
                    try {
                        langText = await translateText(text, sourceLanguage, lang.code);
                        texts[lang.code] = langText;
                        console.log(`[Google TTS Batch] Translated to ${lang.code}: ${langText.substring(0, 50)}...`);
                    } catch (translateError) {
                        console.error(`[Google TTS Batch] Translation failed for ${lang.code}:`, translateError);
                        results.push({
                            language: lang.code,
                            success: false,
                            error: `Translation failed: ${translateError instanceof Error ? translateError.message : 'Unknown error'}`,
                        });
                        continue;
                    }
                } else if (lang.code === sourceLanguage) {
                    texts[lang.code] = text;
                }

                // Generate audio
                const { buffer, size } = await generateSingleAudioGC(
                    langText,
                    lang.voiceId,
                    encoding,
                    sampleRate
                );

                // Save file
                const id = uuidv4();
                const formatInfo = GOOGLE_TTS_FORMATS.find(f => f.id === encoding) || GOOGLE_TTS_FORMATS[0];
                const timestamp = Date.now();
                const filename = `batch-${timestamp}-google-${lang.code}-${lang.voiceId}${formatInfo.extension}`;
                const filePath = path.join(GENERATED_DIR, filename);
                const fileUrl = `/uploads/audio/generated/${filename}`;

                fs.writeFileSync(filePath, buffer);

                // Create item for collection
                const item = {
                    id,
                    type: 'audio' as const,
                    url: fileUrl,
                    language: lang.code,
                    voice: {
                        id: lang.voiceId,
                        name: lang.voiceName,
                    },
                    provider: 'google_cloud',
                    format: encoding,
                    sampleRate,
                    fileSize: size,
                    text: langText,
                    order: i,
                };

                // Also track in generated files so they appear in the Generated Files list
                const audioFile: GeneratedAudio = {
                    id,
                    name: `${collectionName} - ${lang.code.toUpperCase()}`,
                    text: langText,
                    voiceId: lang.voiceId,
                    voiceName: lang.voiceName,
                    languageCode: lang.code,
                    encoding,
                    sampleRate,
                    filePath,
                    fileUrl,
                    fileSize: size,
                    provider: 'google_cloud',
                    createdAt: new Date(),
                };
                generatedAudioFiles.set(id, audioFile);

                results.push({
                    language: lang.code,
                    success: true,
                    item,
                });

                console.log(`[Google TTS Batch] Generated ${lang.code}: ${size} bytes`);
            } catch (genError) {
                console.error(`[Google TTS Batch] Generation failed for ${lang.code}:`, genError);
                results.push({
                    language: lang.code,
                    success: false,
                    error: genError instanceof Error ? genError.message : 'Generation failed',
                });
            }
        }

        // Create collection with results
        const successfulItems = results
            .filter(r => r.success && r.item)
            .map(r => r.item!);

        const collectionData = {
            name: collectionName,
            description: collectionDescription || '',
            type: 'audio_collection',
            items: successfulItems,
            sourceLanguage,
            texts,
            ttsSettings: {
                provider: 'google_cloud',
                format: encoding,
                sampleRate,
                autoTranslate,
            },
        };

        // Save metadata for all batch-generated files
        if (successfulItems.length > 0) {
            saveMetadata();
        }

        console.log(`[Google TTS Batch] Completed: ${successfulItems.length}/${languages.length} successful`);

        return res.status(201).json({
            collection: collectionData,
            results,
            summary: {
                total: languages.length,
                successful: successfulItems.length,
                failed: languages.length - successfulItems.length,
            },
        });
    } catch (error) {
        console.error('Google TTS batch generation error:', error);
        return res.status(500).json({
            error: 'Batch generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
