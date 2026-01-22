// ElevenLabs API Routes - Premium Text-to-Speech
import { Router } from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// ElevenLabs API configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Settings file path (same as settings.ts)
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

// Get ElevenLabs API key from settings or environment
function getApiKey(): string {
    // Environment variable takes priority
    if (process.env.ELEVENLABS_API_KEY) {
        return process.env.ELEVENLABS_API_KEY;
    }
    
    // Fall back to settings file
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const settings = JSON.parse(data);
            return settings?.transcription?.elevenLabsApiKey || '';
        }
    } catch (error) {
        console.error('Error reading settings for ElevenLabs API key:', error);
    }
    
    return '';
}

// Audio storage paths (shared with Deepgram)
const UPLOAD_BASE = path.join(__dirname, '../../uploads');
const AUDIO_DIR = path.join(UPLOAD_BASE, 'audio');
const GENERATED_DIR = path.join(AUDIO_DIR, 'generated');

// Ensure directories exist
[AUDIO_DIR, GENERATED_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// ElevenLabs Models
export const ELEVENLABS_MODELS = [
    { 
        id: 'eleven_multilingual_v2', 
        name: 'Multilingual v2', 
        description: 'Best quality, 29 languages, 10K char limit',
        languages: 29,
        charLimit: 10000,
        latency: 'higher'
    },
    { 
        id: 'eleven_flash_v2_5', 
        name: 'Flash v2.5', 
        description: 'Ultra-low latency (~75ms), 32 languages, 40K char limit',
        languages: 32,
        charLimit: 40000,
        latency: '~75ms'
    },
    { 
        id: 'eleven_turbo_v2_5', 
        name: 'Turbo v2.5', 
        description: 'Balanced quality/speed, 32 languages, 40K char limit',
        languages: 32,
        charLimit: 40000,
        latency: '~250ms'
    },
];

// Audio output formats (more options including lower quality)
export const ELEVENLABS_FORMATS = [
    // MP3 formats (various quality levels)
    { id: 'mp3_22050_32', name: 'MP3 22kHz 32kbps (Low)', mimeType: 'audio/mpeg', extension: '.mp3', quality: 'low' },
    { id: 'mp3_44100_64', name: 'MP3 44kHz 64kbps (Medium)', mimeType: 'audio/mpeg', extension: '.mp3', quality: 'medium' },
    { id: 'mp3_44100_128', name: 'MP3 44kHz 128kbps (Standard)', mimeType: 'audio/mpeg', extension: '.mp3', quality: 'standard' },
    { id: 'mp3_44100_192', name: 'MP3 44kHz 192kbps (High)', mimeType: 'audio/mpeg', extension: '.mp3', quality: 'high' },
    // PCM formats
    { id: 'pcm_16000', name: 'PCM 16kHz (Compact)', mimeType: 'audio/pcm', extension: '.pcm', quality: 'low' },
    { id: 'pcm_22050', name: 'PCM 22kHz', mimeType: 'audio/pcm', extension: '.pcm', quality: 'medium' },
    { id: 'pcm_24000', name: 'PCM 24kHz', mimeType: 'audio/pcm', extension: '.pcm', quality: 'standard' },
    { id: 'pcm_44100', name: 'PCM 44kHz (High Quality)', mimeType: 'audio/pcm', extension: '.pcm', quality: 'high' },
    // μ-law format for telephony
    { id: 'ulaw_8000', name: 'μ-law 8kHz (Telephony)', mimeType: 'audio/basic', extension: '.ulaw', quality: 'telephony' },
];

// ElevenLabs supported languages (Multilingual v2 supports 29, Flash/Turbo support 32)
export const ELEVENLABS_LANGUAGES = [
    { code: 'en', name: 'English', voices: 'many' },
    { code: 'es', name: 'Spanish', voices: 'many' },
    { code: 'fr', name: 'French', voices: 'many' },
    { code: 'de', name: 'German', voices: 'many' },
    { code: 'it', name: 'Italian', voices: 'many' },
    { code: 'pt', name: 'Portuguese', voices: 'many' },
    { code: 'pl', name: 'Polish', voices: 'some' },
    { code: 'nl', name: 'Dutch', voices: 'some' },
    { code: 'sv', name: 'Swedish', voices: 'some' },
    { code: 'da', name: 'Danish', voices: 'some' },
    { code: 'fi', name: 'Finnish', voices: 'some' },
    { code: 'no', name: 'Norwegian', voices: 'some' },
    { code: 'cs', name: 'Czech', voices: 'some' },
    { code: 'ro', name: 'Romanian', voices: 'some' },
    { code: 'el', name: 'Greek', voices: 'some' },
    { code: 'tr', name: 'Turkish', voices: 'some' },
    { code: 'ru', name: 'Russian', voices: 'some' },
    { code: 'uk', name: 'Ukrainian', voices: 'some' },
    { code: 'hu', name: 'Hungarian', voices: 'some' },
    { code: 'bg', name: 'Bulgarian', voices: 'some' },
    { code: 'hr', name: 'Croatian', voices: 'some' },
    { code: 'sk', name: 'Slovak', voices: 'some' },
    { code: 'id', name: 'Indonesian', voices: 'some' },
    { code: 'ms', name: 'Malay', voices: 'some' },
    { code: 'vi', name: 'Vietnamese', voices: 'some' },
    { code: 'th', name: 'Thai', voices: 'some' },
    { code: 'zh', name: 'Chinese', voices: 'many' },
    { code: 'ja', name: 'Japanese', voices: 'many' },
    { code: 'ko', name: 'Korean', voices: 'many' },
    { code: 'hi', name: 'Hindi', voices: 'some' },
    { code: 'ar', name: 'Arabic', voices: 'some' },
    { code: 'he', name: 'Hebrew', voices: 'some' },
];

// Voice settings defaults
const DEFAULT_VOICE_SETTINGS = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
};

// Generated audio interface
interface GeneratedAudio {
    id: string;
    name: string;
    text: string;
    voiceId: string;
    voiceName: string;
    modelId: string;
    modelName: string;
    outputFormat: string;
    filePath: string;
    fileUrl: string;
    fileSize: number;
    provider: 'elevenlabs';
    createdAt: Date;
}

// In-memory storage for generated audio files
const generatedAudioFiles = new Map<string, GeneratedAudio>();

// Metadata file path
const METADATA_FILE = path.join(GENERATED_DIR, 'elevenlabs-metadata.json');

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
            console.log(`📁 Loaded ${generatedAudioFiles.size} ElevenLabs audio files from metadata`);
        }
    } catch (error) {
        console.error('Error loading ElevenLabs metadata:', error);
    }
}

// Save metadata
function saveMetadata() {
    try {
        const items = Array.from(generatedAudioFiles.values());
        fs.writeFileSync(METADATA_FILE, JSON.stringify(items, null, 2));
    } catch (error) {
        console.error('Error saving ElevenLabs metadata:', error);
    }
}

// Load metadata on module init
loadMetadata();

// GET /api/elevenlabs/status - Check API status and key
router.get('/status', async (_req: Request, res: Response) => {
    if (!getApiKey()) {
        return res.json({
            configured: false,
            error: 'ElevenLabs API key not configured',
            hint: 'Set ELEVENLABS_API_KEY environment variable or configure in Settings',
        });
    }

    try {
        // Check subscription/user info
        const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
            headers: {
                'xi-api-key': getApiKey(),
            },
        });

        if (!response.ok) {
            return res.json({
                configured: true,
                valid: false,
                error: 'Invalid API key or API error',
            });
        }

        const subscription = await response.json() as {
            tier: string;
            character_count: number;
            character_limit: number;
            can_use_instant_voice_cloning: boolean;
            can_use_professional_voice_cloning: boolean;
        };
        
        return res.json({
            configured: true,
            valid: true,
            subscription: {
                tier: subscription.tier,
                character_count: subscription.character_count,
                character_limit: subscription.character_limit,
                can_use_instant_voice_cloning: subscription.can_use_instant_voice_cloning,
                can_use_professional_voice_cloning: subscription.can_use_professional_voice_cloning,
            },
        });
    } catch (error) {
        return res.status(500).json({
            configured: true,
            valid: false,
            error: 'Failed to validate API key',
        });
    }
});

// GET /api/elevenlabs/models - Get available models
router.get('/models', (_req: Request, res: Response) => {
    return res.json(ELEVENLABS_MODELS);
});

// GET /api/elevenlabs/formats - Get available output formats
router.get('/formats', (_req: Request, res: Response) => {
    return res.json(ELEVENLABS_FORMATS);
});

// GET /api/elevenlabs/languages - Get supported languages
router.get('/languages', (_req: Request, res: Response) => {
    return res.json(ELEVENLABS_LANGUAGES);
});

// GET /api/elevenlabs/voices - Get available voices for a language
// Uses the Shared Voice Library API to get native language voices
router.get('/voices', async (req: Request, res: Response) => {
    if (!getApiKey()) {
        return res.status(500).json({
            error: 'ElevenLabs API key not configured',
        });
    }

    const language = req.query.language as string || 'en';
    
    try {
        // Use the shared-voices API to get native language voices
        // This gives us Italian voices for Italian, Chinese for Chinese, etc.
        const response = await fetch(
            `${ELEVENLABS_API_URL}/shared-voices?page_size=50&language=${language}&sort=trending`,
            {
                headers: {
                    'xi-api-key': getApiKey(),
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs shared-voices error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'Failed to fetch voices',
                details: errorText,
            });
        }

        const data = await response.json() as { voices?: any[] };
        
        // Transform shared voices to our format
        const voices = (data.voices || []).map((voice: any) => ({
            id: voice.voice_id,
            name: voice.name,
            category: voice.category || 'shared',
            description: voice.description,
            labels: {
                gender: voice.gender,
                age: voice.age,
                accent: voice.accent,
                language: voice.language,
                use_case: voice.use_case,
                descriptive: voice.descriptive,
            },
            preview_url: voice.preview_url,
            available_for_tiers: [],
            verified_languages: voice.verified_languages || [],
            free_users_allowed: voice.free_users_allowed,
        }));

        return res.json({ voices, language });
    } catch (error) {
        console.error('Error fetching ElevenLabs voices:', error);
        return res.status(500).json({
            error: 'Failed to fetch voices',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/elevenlabs/generate - Generate TTS audio
router.post('/generate', async (req: Request, res: Response) => {
    try {
        const {
            text,
            voiceId,
            voiceName = 'Unknown Voice',
            modelId = 'eleven_multilingual_v2',
            outputFormat = 'mp3_44100_128',
            stability = DEFAULT_VOICE_SETTINGS.stability,
            similarityBoost = DEFAULT_VOICE_SETTINGS.similarity_boost,
            style = DEFAULT_VOICE_SETTINGS.style,
            useSpeakerBoost = DEFAULT_VOICE_SETTINGS.use_speaker_boost,
            name,
        } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (!voiceId) {
            return res.status(400).json({ error: 'Voice ID is required' });
        }

        if (!getApiKey()) {
            return res.status(500).json({
                error: 'ElevenLabs API key not configured',
                hint: 'Set ELEVENLABS_API_KEY environment variable or configure in Settings',
            });
        }

        // Build request body
        const requestBody = {
            text: text.trim(),
            model_id: modelId,
            voice_settings: {
                stability,
                similarity_boost: similarityBoost,
                style,
                use_speaker_boost: useSpeakerBoost,
            },
        };

        // Call ElevenLabs TTS API
        const response = await fetch(
            `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': getApiKey(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs TTS error:', response.status, errorText);
            return res.status(response.status).json({
                error: 'ElevenLabs TTS failed',
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

        console.log(`[ElevenLabs] Generated ${totalLength} bytes from ${chunks.length} chunks`);

        // Generate filename
        const id = uuidv4();
        const format = ELEVENLABS_FORMATS.find(f => f.id === outputFormat) || ELEVENLABS_FORMATS[0];
        const timestamp = Date.now();
        const filename = `${timestamp}-elevenlabs-${voiceId}${format.extension}`;
        const filePath = path.join(GENERATED_DIR, filename);
        const fileUrl = `/uploads/audio/generated/${filename}`;

        // Save file
        fs.writeFileSync(filePath, Buffer.from(audioBuffer));

        // Find model info
        const model = ELEVENLABS_MODELS.find(m => m.id === modelId) || ELEVENLABS_MODELS[0];

        // Create record
        const audioFile: GeneratedAudio = {
            id,
            name: name || `ElevenLabs - ${voiceName}`,
            text,
            voiceId,
            voiceName,
            modelId,
            modelName: model.name,
            outputFormat,
            filePath,
            fileUrl,
            fileSize: totalLength,
            provider: 'elevenlabs',
            createdAt: new Date(),
        };

        generatedAudioFiles.set(id, audioFile);
        saveMetadata();

        return res.status(201).json(audioFile);
    } catch (error) {
        console.error('ElevenLabs TTS generation error:', error);
        return res.status(500).json({
            error: 'TTS generation failed',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/elevenlabs/files - Get all generated audio files
router.get('/files', (_req: Request, res: Response) => {
    const files = Array.from(generatedAudioFiles.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(files);
});

// DELETE /api/elevenlabs/files/:id - Delete a generated audio file
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

// POST /api/elevenlabs/preview - Generate a voice preview
router.post('/preview', async (req: Request, res: Response) => {
    try {
        const { voiceId, text = 'Hello! This is a preview of how I sound.' } = req.body;

        if (!voiceId) {
            return res.status(400).json({ error: 'Voice ID is required' });
        }

        if (!getApiKey()) {
            return res.status(500).json({
                error: 'ElevenLabs API key not configured',
            });
        }

        const response = await fetch(
            `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': getApiKey(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_flash_v2_5', // Fast model for previews
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({
                error: 'Voice preview failed',
                details: errorText,
            });
        }

        // Stream and collect all chunks
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

        const audioBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }

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
