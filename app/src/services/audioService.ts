// Audio Service - Text-to-Speech API client
// Supports Deepgram TTS with future support for Whisper and ElevenLabs

export interface Voice {
    id: string;
    name: string;
    gender: 'male' | 'female';
    featured: boolean;
}

export interface VoiceLanguage {
    name: string;
    voices: Voice[];
}

export interface VoicesResponse {
    [langCode: string]: VoiceLanguage;
}

export interface AudioFormat {
    id: string;
    name: string;
    mimeType: string;
    extension: string;
}

export interface SampleRate {
    id: number;
    name: string;
    default?: boolean;
}

export interface FormatsResponse {
    formats: AudioFormat[];
    sampleRates: SampleRate[];
}

export interface GeneratedAudio {
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
    createdAt: string;
}

export interface GenerateOptions {
    text: string;
    voice?: string;
    encoding?: string;
    sampleRate?: number;
    name?: string;
}

export interface AudioServiceStatus {
    deepgram: {
        configured: boolean;
        endpoint: string;
    };
    whisper: {
        configured: boolean;
        status: string;
    };
    elevenlabs: {
        configured: boolean;
        status: string;
    };
}

const API_BASE = '/api/audio';

/**
 * Get available voices grouped by language
 */
export async function getVoices(): Promise<VoicesResponse> {
    const response = await fetch(`${API_BASE}/voices`);
    if (!response.ok) {
        throw new Error('Failed to fetch voices');
    }
    return response.json();
}

/**
 * Get available audio formats and sample rates
 */
export async function getFormats(): Promise<FormatsResponse> {
    const response = await fetch(`${API_BASE}/formats`);
    if (!response.ok) {
        throw new Error('Failed to fetch formats');
    }
    return response.json();
}

/**
 * Get audio service status (configured providers)
 */
export async function getStatus(): Promise<AudioServiceStatus> {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) {
        throw new Error('Failed to fetch audio service status');
    }
    return response.json();
}

/**
 * Get all generated audio files
 */
export async function getAudioFiles(): Promise<GeneratedAudio[]> {
    const response = await fetch(`${API_BASE}/files`);
    if (!response.ok) {
        throw new Error('Failed to fetch audio files');
    }
    return response.json();
}

/**
 * Get a single audio file by ID
 */
export async function getAudioFile(id: string): Promise<GeneratedAudio> {
    const response = await fetch(`${API_BASE}/files/${id}`);
    if (!response.ok) {
        throw new Error('Audio file not found');
    }
    return response.json();
}

/**
 * Delete an audio file
 */
export async function deleteAudioFile(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete audio file');
    }
}

/**
 * Generate TTS audio from text
 */
export async function generateAudio(options: GenerateOptions): Promise<GeneratedAudio> {
    const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(error.error || error.details || 'Audio generation failed');
    }

    return response.json();
}

/**
 * Get a voice preview audio URL
 * Returns a blob URL that can be played directly
 */
export async function getVoicePreview(voiceId: string): Promise<string> {
    const response = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ voice: voiceId }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Preview failed' }));
        throw new Error(error.error || 'Voice preview failed');
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds?: number): string {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
