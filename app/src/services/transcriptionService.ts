// Transcription Service - Speech-to-Text API client
// Supports Deepgram and Whisper (self-hosted) providers

export interface TranscriptionOptions {
    provider?: 'deepgram' | 'whisper';
    language?: string;
    model?: string;
}

export interface TranscriptionWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

export interface TranscriptionResult {
    text: string;
    confidence?: number;
    words?: TranscriptionWord[];
    duration?: number;
    provider: string;
    model?: string;
    language: string;
}

export interface TranscriptionStatus {
    deepgram: {
        configured: boolean;
        endpoint: string;
    };
    whisper: {
        configured: boolean;
        endpoint: string | null;
    };
}

/**
 * Transcribe an audio file to text
 * @param audioFile - Audio file (Blob or File)
 * @param options - Transcription options (provider, language, model)
 * @returns Transcription result with text and metadata
 */
export async function transcribeAudio(
    audioFile: Blob | File,
    options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
    const { provider = 'deepgram', language = 'en', model = 'nova-2' } = options;

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('provider', provider);
    formData.append('language', language);
    formData.append('model', model);

    const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Transcription failed' }));
        throw new Error(error.error || error.details || 'Transcription failed');
    }

    return response.json();
}

/**
 * Check transcription service status
 * @returns Status of configured transcription providers
 */
export async function getTranscriptionStatus(): Promise<TranscriptionStatus> {
    const response = await fetch('/api/transcribe/status');
    
    if (!response.ok) {
        throw new Error('Failed to get transcription status');
    }

    return response.json();
}

/**
 * Transcribe audio from a URL (fetches and transcribes)
 * @param audioUrl - URL of the audio file
 * @param options - Transcription options
 * @returns Transcription result
 */
export async function transcribeFromUrl(
    audioUrl: string,
    options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
    // Fetch the audio file
    const response = await fetch(audioUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch audio from ${audioUrl}`);
    }

    const audioBlob = await response.blob();
    return transcribeAudio(audioBlob, options);
}
