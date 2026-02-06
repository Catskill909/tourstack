// Google Cloud Text-to-Speech API Service
// Frontend service layer for the Google Cloud TTS backend

export interface GoogleTtsVoice {
    id: string;
    name: string;
    displayName: string;
    languageCode: string;
    ssmlGender: string;
    type: string;
    naturalSampleRateHertz: number;
}

export interface GoogleTtsVoicesResponse {
    voices: Record<string, GoogleTtsVoice[]>;
    language: string;
}

export interface GoogleTtsFormat {
    id: string;
    name: string;
    mimeType: string;
    extension: string;
}

export interface GoogleTtsSampleRate {
    id: number;
    name: string;
    default?: boolean;
}

export interface GoogleTtsFormatsResponse {
    formats: GoogleTtsFormat[];
    sampleRates: GoogleTtsSampleRate[];
}

export interface GoogleTtsLanguage {
    code: string;
    name: string;
    googleCode: string;
    voiceCount: number;
}

export interface GoogleTtsStatus {
    configured: boolean;
    valid?: boolean;
    error?: string;
    hint?: string;
    voiceCount?: number;
}

export interface GoogleTtsGeneratedAudio {
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
    createdAt: string;
}

export interface GoogleTtsGenerateOptions {
    text: string;
    voiceId: string;
    voiceName?: string;
    encoding?: string;
    sampleRate?: number;
    speakingRate?: number;
    pitch?: number;
    name?: string;
}

const API_BASE = '/api/google-tts';

// Get API status
export async function getStatus(): Promise<GoogleTtsStatus> {
    const response = await fetch(`${API_BASE}/status`);
    if (!response.ok) {
        throw new Error('Failed to get Google TTS status');
    }
    return response.json();
}

// Get available voices (optionally filtered by language)
export async function getVoices(language?: string): Promise<GoogleTtsVoicesResponse> {
    const params = language ? `?language=${language}` : '';
    const response = await fetch(`${API_BASE}/voices${params}`);
    if (!response.ok) {
        throw new Error('Failed to get Google TTS voices');
    }
    return response.json();
}

// Get available formats and sample rates
export async function getFormats(): Promise<GoogleTtsFormatsResponse> {
    const response = await fetch(`${API_BASE}/formats`);
    if (!response.ok) {
        throw new Error('Failed to get Google TTS formats');
    }
    return response.json();
}

// Get supported languages
export async function getLanguages(): Promise<GoogleTtsLanguage[]> {
    const response = await fetch(`${API_BASE}/languages`);
    if (!response.ok) {
        throw new Error('Failed to get Google TTS languages');
    }
    return response.json();
}

// Generate audio
export async function generateAudio(options: GoogleTtsGenerateOptions): Promise<GoogleTtsGeneratedAudio> {
    const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(error.error || 'Failed to generate audio');
    }
    return response.json();
}

// Get generated audio files
export async function getAudioFiles(): Promise<GoogleTtsGeneratedAudio[]> {
    const response = await fetch(`${API_BASE}/files`);
    if (!response.ok) {
        throw new Error('Failed to get audio files');
    }
    return response.json();
}

// Delete audio file
export async function deleteAudioFile(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/files/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete audio file');
    }
}

// Preview voice
export async function previewVoice(voiceId: string, text?: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, text }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Preview failed' }));
        throw new Error(error.error || 'Failed to preview voice');
    }
    return response.blob();
}

// Format file size
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
