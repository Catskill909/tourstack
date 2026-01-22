/**
 * Translation Service for TourStack
 * 
 * Provides AI-powered translation using LibreTranslate or Deepgram.
 * Architecture supports multiple providers with fallback.
 */

export type TranslationProvider = 'libretranslate' | 'deepgram';

export interface TranslationRequest {
    text: string;
    sourceLang: string;
    targetLang: string;
    provider?: TranslationProvider;
}

export interface BatchTranslationRequest {
    text: string;
    sourceLang: string;
    targetLangs: string[];
    provider?: TranslationProvider;
}

export interface TranslationResult {
    [lang: string]: string;
}

// Translation API via our server proxy (avoids CORS)
const TRANSLATE_API = '/api/translate';

/**
 * Translate text using our server-side translation proxy
 * Supports LibreTranslate (default) and Deepgram providers
 * 
 * @param text - Text to translate
 * @param sourceLang - Source language code (e.g., 'en')
 * @param targetLang - Target language code (e.g., 'es')
 * @param apiKey - Optional API key for rate limit bypass
 * @param provider - Translation provider ('libretranslate' | 'deepgram')
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiKey?: string,
    provider: TranslationProvider = 'libretranslate'
): Promise<string> {
    // Skip if same language or empty text
    if (sourceLang === targetLang || !text.trim()) {
        return text;
    }

    try {
        const response = await fetch(TRANSLATE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                sourceLang,
                targetLang,
                apiKey,
                provider,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Translation failed');
        }

        const data = await response.json();
        return data.translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Translate text using LibreTranslate (legacy function for backward compatibility)
 */
export async function translateWithLibre(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiKey?: string
): Promise<string> {
    return translateText(text, sourceLang, targetLang, apiKey, 'libretranslate');
}

/**
 * Batch translate text to multiple target languages
 * 
 * @param request - Batch translation request
 * @param apiKey - Optional API key
 * @param provider - Translation provider
 * @returns Object with translations keyed by language code
 */
export async function batchTranslate(
    request: BatchTranslationRequest,
    apiKey?: string,
    provider: TranslationProvider = 'libretranslate'
): Promise<TranslationResult> {
    const { text, sourceLang, targetLangs } = request;
    const result: TranslationResult = {};

    // Keep source language text
    result[sourceLang] = text;

    // Translate to each target language (sequential to avoid rate limits)
    for (const targetLang of targetLangs) {
        if (targetLang === sourceLang) continue;

        try {
            result[targetLang] = await translateText(text, sourceLang, targetLang, apiKey, provider);
            // Small delay to respect rate limits on free API
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error(`Failed to translate to ${targetLang}:`, error);
            result[targetLang] = ''; // Empty on failure, user can retry
        }
    }

    return result;
}

/**
 * Magic Translate - One-click translation to all tour languages
 * 
 * This is the main entry point for the "✨ Translate" button.
 * 
 * @param text - Text to translate
 * @param sourceLang - Source language code
 * @param targetLangs - Array of target language codes
 * @param apiKey - Optional API key
 * @param provider - Translation provider ('libretranslate' | 'deepgram')
 */
export async function magicTranslate(
    text: string,
    sourceLang: string,
    targetLangs: string[],
    apiKey?: string,
    provider: TranslationProvider = 'libretranslate'
): Promise<TranslationResult> {
    return batchTranslate({ text, sourceLang, targetLangs }, apiKey, provider);
}

// Supported languages by LibreTranslate
export const SUPPORTED_LANGUAGES = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru',
    'zh', 'ja', 'ko', 'ar', 'hi', 'tr', 'vi', 'th', 'id',
    'sv', 'da', 'fi', 'no', 'cs', 'el', 'he', 'hu', 'ro', 'uk',
];

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): boolean {
    return SUPPORTED_LANGUAGES.includes(lang.toLowerCase());
}

/**
 * Supported file formats for import
 */
export const SUPPORTED_FILE_FORMATS = [
    '.txt', '.odt', '.odp', '.docx', '.pptx', '.epub', '.html', '.srt', '.pdf'
];

/**
 * Extract text content from a file
 * Supports: .txt, .odt, .odp, .docx, .pptx, .epub, .html, .srt, .pdf
 * 
 * @param file - File to extract text from
 * @returns Extracted text content
 */
export async function extractTextFromFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/translate/extract', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to extract text from file');
    }

    const data = await response.json();
    return data.text;
}

/**
 * Import and translate a file to a target language
 * 
 * @param file - File to translate
 * @param targetLang - Target language code
 * @param sourceLang - Source language code (optional, defaults to auto-detect)
 * @returns Translated text content
 */
export async function translateFile(
    file: File,
    targetLang: string,
    sourceLang?: string
): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('targetLang', targetLang);
    if (sourceLang) {
        formData.append('sourceLang', sourceLang);
    }

    const response = await fetch('/api/translate/file', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to translate file');
    }

    const data = await response.json();
    return data.translatedText;
}

/**
 * Check if a file format is supported for import
 */
export function isFileFormatSupported(filename: string): boolean {
    const ext = '.' + filename.split('.').pop()?.toLowerCase();
    return SUPPORTED_FILE_FORMATS.includes(ext);
}
