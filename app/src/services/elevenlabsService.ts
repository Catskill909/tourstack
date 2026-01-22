// ElevenLabs API Service - Premium Text-to-Speech

export interface ElevenLabsModel {
    id: string;
    name: string;
    description: string;
    languages: number;
    charLimit: number;
    latency: string;
}

export interface ElevenLabsFormat {
    id: string;
    name: string;
    mimeType: string;
    extension: string;
    quality?: string;
}

export interface ElevenLabsLanguage {
    code: string;
    name: string;
    voices: string;
}

export interface ElevenLabsVoice {
    id: string;
    name: string;
    category: string;
    description?: string;
    labels?: Record<string, string>;
    preview_url?: string;
    available_for_tiers?: string[];
}

export interface ElevenLabsStatus {
    configured: boolean;
    valid?: boolean;
    error?: string;
    hint?: string;
    subscription?: {
        tier: string;
        character_count: number;
        character_limit: number;
        can_use_instant_voice_cloning: boolean;
        can_use_professional_voice_cloning: boolean;
    };
}

export interface GeneratedAudio {
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

export interface GenerateOptions {
    text: string;
    voiceId: string;
    voiceName?: string;
    modelId?: string;
    outputFormat?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
    name?: string;
}

// Get API status
export async function getStatus(): Promise<ElevenLabsStatus> {
    const response = await fetch('/api/elevenlabs/status');
    if (!response.ok) {
        throw new Error('Failed to get ElevenLabs status');
    }
    return response.json();
}

// Get available models
export async function getModels(): Promise<ElevenLabsModel[]> {
    const response = await fetch('/api/elevenlabs/models');
    if (!response.ok) {
        throw new Error('Failed to get ElevenLabs models');
    }
    return response.json();
}

// Get available formats
export async function getFormats(): Promise<ElevenLabsFormat[]> {
    const response = await fetch('/api/elevenlabs/formats');
    if (!response.ok) {
        throw new Error('Failed to get ElevenLabs formats');
    }
    return response.json();
}

// Get supported languages
export async function getLanguages(): Promise<ElevenLabsLanguage[]> {
    const response = await fetch('/api/elevenlabs/languages');
    if (!response.ok) {
        throw new Error('Failed to get ElevenLabs languages');
    }
    return response.json();
}

// Get available voices for a specific language (native language voices)
export async function getVoices(language: string = 'en'): Promise<{ voices: ElevenLabsVoice[], language: string }> {
    const response = await fetch(`/api/elevenlabs/voices?language=${language}`);
    if (!response.ok) {
        throw new Error('Failed to get ElevenLabs voices');
    }
    return response.json();
}

// Generate audio
export async function generateAudio(options: GenerateOptions): Promise<GeneratedAudio> {
    const response = await fetch('/api/elevenlabs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
    }
    return response.json();
}

// Get generated audio files
export async function getAudioFiles(): Promise<GeneratedAudio[]> {
    const response = await fetch('/api/elevenlabs/files');
    if (!response.ok) {
        throw new Error('Failed to get audio files');
    }
    return response.json();
}

// Delete audio file
export async function deleteAudioFile(id: string): Promise<void> {
    const response = await fetch(`/api/elevenlabs/files/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete audio file');
    }
}

// Preview voice
export async function previewVoice(voiceId: string, text?: string): Promise<Blob> {
    const response = await fetch('/api/elevenlabs/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, text }),
    });
    if (!response.ok) {
        const error = await response.json();
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
