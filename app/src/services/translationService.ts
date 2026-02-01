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
const TRANSLATE_BATCH_API = '/api/translate/batch';

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
 * Batch translate multiple texts to a single target language in one API call.
 * This is significantly faster than individual translateText calls (10-15x improvement).
 *
 * Uses LibreTranslate's array support: q: ["text1", "text2"] → translatedText: ["trans1", "trans2"]
 *
 * @param texts - Array of texts to translate
 * @param sourceLang - Source language code
 * @param targetLang - Target language code
 * @param apiKey - Optional API key
 * @returns Array of translated texts (same order as input)
 */
export async function translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    apiKey?: string
): Promise<string[]> {
    // Skip if same language or empty array
    if (sourceLang === targetLang || texts.length === 0) {
        return texts;
    }

    try {
        const response = await fetch(TRANSLATE_BATCH_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                texts,
                sourceLang,
                targetLang,
                apiKey,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Batch translation failed');
        }

        const data = await response.json();
        return data.translatedTexts;
    } catch (error) {
        console.error('Batch translation error:', error);
        throw error;
    }
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

// Languages supported by our self-hosted LibreTranslate server (translate.supersoul.top)
// Must match LT_LOAD_ONLY env var: en,es,fr,de,ja,it,ko,zh,pt
// Note: Server uses 'zh-Hans' for Chinese, mapped automatically
export const SUPPORTED_LANGUAGES = [
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh',
];

// Note: Language code mapping (zh -> zh-Hans) is done on the server side in translate.ts

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

// Import types for AI analysis translation
import type { AIAnalysisResult, MultilingualAIAnalysis } from '../types/media';

/**
 * Translate all translatable fields of an AI analysis result
 * to multiple target languages.
 *
 * OPTIMIZED VERSION: Uses batch translation + parallel language requests.
 * Before: 112 sequential API calls for 1 image to 8 languages (~15-20s)
 * After: 8 parallel batch calls (~1-2s) - 10-15x faster!
 *
 * @param analysis - Original AI analysis result (in source language)
 * @param sourceLang - Source language code (usually 'en')
 * @param targetLangs - Array of target language codes
 * @param apiKey - Optional API key
 * @param _provider - Translation provider (unused, kept for API compatibility)
 * @returns MultilingualAIAnalysis with all translations
 */
export async function translateAnalysis(
    analysis: AIAnalysisResult,
    sourceLang: string,
    targetLangs: string[],
    apiKey?: string,
    _provider: TranslationProvider = 'libretranslate'
): Promise<MultilingualAIAnalysis> {
    // Initialize with source language content
    const result: MultilingualAIAnalysis = {
        original: analysis,
        sourceLanguage: sourceLang,
        translatedLanguages: [sourceLang],
        suggestedTitle: { [sourceLang]: analysis.suggestedTitle },
        description: { [sourceLang]: analysis.description },
        tags: { [sourceLang]: analysis.tags },
    };

    // Add optional fields if present
    if (analysis.mood) {
        result.mood = { [sourceLang]: analysis.mood };
    }
    if (analysis.lighting) {
        result.lighting = { [sourceLang]: analysis.lighting };
    }
    if (analysis.artStyle) {
        result.artStyle = { [sourceLang]: analysis.artStyle };
    }
    if (analysis.estimatedLocation) {
        result.estimatedLocation = { [sourceLang]: analysis.estimatedLocation };
    }

    // Filter out source language from targets
    const langsToTranslate = targetLangs.filter(lang => lang !== sourceLang);
    if (langsToTranslate.length === 0) {
        return result;
    }

    // Build array of all texts to translate (for batch API)
    // Track field positions so we can map results back
    interface FieldMapping {
        field: 'suggestedTitle' | 'description' | 'mood' | 'lighting' | 'artStyle' | 'estimatedLocation';
        index: number;
    }

    const texts: string[] = [];
    const fieldMap: FieldMapping[] = [];

    if (analysis.suggestedTitle) {
        fieldMap.push({ field: 'suggestedTitle', index: texts.length });
        texts.push(analysis.suggestedTitle);
    }
    if (analysis.description) {
        fieldMap.push({ field: 'description', index: texts.length });
        texts.push(analysis.description);
    }
    if (analysis.mood) {
        fieldMap.push({ field: 'mood', index: texts.length });
        texts.push(analysis.mood);
    }
    if (analysis.lighting) {
        fieldMap.push({ field: 'lighting', index: texts.length });
        texts.push(analysis.lighting);
    }
    if (analysis.artStyle) {
        fieldMap.push({ field: 'artStyle', index: texts.length });
        texts.push(analysis.artStyle);
    }
    if (analysis.estimatedLocation) {
        fieldMap.push({ field: 'estimatedLocation', index: texts.length });
        texts.push(analysis.estimatedLocation);
    }

    // Add tags to the batch
    const tagsStartIndex = texts.length;
    const tagsCount = analysis.tags?.length || 0;
    if (analysis.tags && tagsCount > 0) {
        texts.push(...analysis.tags);
    }

    // Translate to all languages in parallel using batch API
    const translationPromises = langsToTranslate.map(async (targetLang) => {
        try {
            const translated = await translateBatch(texts, sourceLang, targetLang, apiKey);
            return { lang: targetLang, translated, success: true };
        } catch (error) {
            console.error(`Failed to translate analysis to ${targetLang}:`, error);
            return { lang: targetLang, translated: [] as string[], success: false };
        }
    });

    const translationResults = await Promise.all(translationPromises);

    // Map results back to the result structure
    for (const { lang, translated, success } of translationResults) {
        if (!success || translated.length === 0) continue;

        // Map field translations
        for (const { field, index } of fieldMap) {
            if (translated[index]) {
                if (!result[field]) {
                    result[field] = { [sourceLang]: analysis[field] as string };
                }
                (result[field] as { [key: string]: string })[lang] = translated[index];
            }
        }

        // Map tag translations
        if (tagsCount > 0 && result.tags) {
            const translatedTags = translated.slice(tagsStartIndex, tagsStartIndex + tagsCount);
            if (translatedTags.length === tagsCount) {
                result.tags[lang] = translatedTags;
            }
        }

        // Mark this language as translated
        result.translatedLanguages.push(lang);
    }

    return result;
}
