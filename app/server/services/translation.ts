// Unified Translation Service
// Supports Google Cloud Translation API v2 and LibreTranslate
// All backend routes should import from this module instead of implementing their own translation logic.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings file path (same as settings.ts)
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

// ============================================================================
// TYPES
// ============================================================================

export type TranslationProvider = 'google_cloud' | 'libretranslate';

export interface TranslationConfig {
    provider: TranslationProvider;
    googleApiKey?: string;
    libreTranslateUrl?: string;
    libreTranslateApiKey?: string;
}

export interface LanguageInfo {
    code: string;
    name: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// LibreTranslate language code mapping
const LIBRE_LANGUAGE_CODE_MAP: Record<string, string> = {
    'zh': 'zh-Hans',
};

// Reverse mapping for normalizing LibreTranslate codes back to standard
const LIBRE_LANGUAGE_CODE_REVERSE: Record<string, string> = {
    'zh-Hans': 'zh',
};

// Google Cloud Translation API v2 endpoint
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

/**
 * Reads settings.json + env vars to determine the active translation provider and credentials.
 * Env vars always override file settings (for Coolify production).
 */
export function getTranslationConfig(): TranslationConfig {
    let config: TranslationConfig = {
        provider: 'google_cloud',
        googleApiKey: process.env.GOOGLE_VISION_API_KEY || '',
        libreTranslateUrl: process.env.LIBRE_TRANSLATE_URL || 'https://translate.supersoul.top/translate',
        libreTranslateApiKey: process.env.LIBRE_TRANSLATE_API_KEY || 'TranslateThisForMe26',
    };

    // Load from settings file
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const settings = JSON.parse(data);
            const translation = settings.translation;
            if (translation) {
                if (translation.defaultProvider) {
                    config.provider = translation.defaultProvider as TranslationProvider;
                }
                if (translation.libreTranslateUrl) {
                    config.libreTranslateUrl = translation.libreTranslateUrl;
                }
                if (translation.libreTranslateApiKey) {
                    config.libreTranslateApiKey = translation.libreTranslateApiKey;
                }
                if (translation.googleCloudApiKey) {
                    config.googleApiKey = translation.googleCloudApiKey;
                }
            }
        }
    } catch {
        // Settings file read failed, use defaults
    }

    // Env vars always override (for production/Coolify)
    if (process.env.GOOGLE_VISION_API_KEY) {
        config.googleApiKey = process.env.GOOGLE_VISION_API_KEY;
    }
    if (process.env.LIBRE_TRANSLATE_URL && process.env.LIBRE_TRANSLATE_URL !== 'mock') {
        config.libreTranslateUrl = process.env.LIBRE_TRANSLATE_URL;
    }
    if (process.env.LIBRE_TRANSLATE_API_KEY) {
        config.libreTranslateApiKey = process.env.LIBRE_TRANSLATE_API_KEY;
    }

    return config;
}

// Check if mock mode is enabled
export function isMockMode(): boolean {
    return process.env.LIBRE_TRANSLATE_URL === 'mock';
}

// Mock translation for testing
export function mockTranslate(text: string, targetLang: string): string {
    const prefixes: Record<string, string> = {
        'es': '[ES] ', 'fr': '[FR] ', 'de': '[DE] ', 'it': '[IT] ',
        'pt': '[PT] ', 'zh': '[ZH] ', 'ja': '[JA] ', 'ko': '[KO] ',
    };
    return (prefixes[targetLang] || `[${targetLang.toUpperCase()}] `) + text;
}

// ============================================================================
// GOOGLE CLOUD TRANSLATION
// ============================================================================

async function translateWithGoogle(
    text: string,
    sourceLang: string,
    targetLang: string,
    apiKey: string
): Promise<string> {
    const requestBody: Record<string, unknown> = {
        q: text,
        target: targetLang,
        format: 'text',
    };

    if (sourceLang && sourceLang !== 'auto') {
        requestBody.source = sourceLang;
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'http://localhost:3000',
        },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json() as {
        data?: { translations: Array<{ translatedText: string; detectedSourceLanguage?: string }> };
        error?: { code: number; message: string };
    };

    if (data.error) {
        throw new Error(`Google Translate error: ${data.error.message}`);
    }

    if (!data.data?.translations?.[0]) {
        throw new Error('No translation returned from Google');
    }

    return data.data.translations[0].translatedText;
}

async function batchTranslateWithGoogle(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    apiKey: string
): Promise<string[]> {
    // Filter out empty texts
    const nonEmptyTexts: string[] = [];
    const indexMap: number[] = [];
    texts.forEach((text, i) => {
        if (text && text.trim()) {
            nonEmptyTexts.push(text);
            indexMap.push(i);
        }
    });

    if (nonEmptyTexts.length === 0) {
        return texts.map(() => '');
    }

    const requestBody: Record<string, unknown> = {
        q: nonEmptyTexts,
        target: targetLang,
        format: 'text',
    };

    if (sourceLang && sourceLang !== 'auto') {
        requestBody.source = sourceLang;
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'http://localhost:3000',
        },
        body: JSON.stringify(requestBody),
    });

    const data = await response.json() as {
        data?: { translations: Array<{ translatedText: string }> };
        error?: { code: number; message: string };
    };

    if (data.error) {
        throw new Error(`Google Translate batch error: ${data.error.message}`);
    }

    if (!data.data?.translations) {
        throw new Error('No translations returned from Google');
    }

    const translatedTexts = data.data.translations.map(t => t.translatedText);

    // Rebuild full array with empty strings for originally empty texts
    const result: string[] = texts.map(() => '');
    indexMap.forEach((originalIndex, translatedIndex) => {
        result[originalIndex] = translatedTexts[translatedIndex] || '';
    });

    return result;
}

// ============================================================================
// LIBRETRANSLATE
// ============================================================================

async function translateWithLibreTranslate(
    text: string,
    sourceLang: string,
    targetLang: string,
    url: string,
    apiKey?: string
): Promise<string> {
    const mappedSource = LIBRE_LANGUAGE_CODE_MAP[sourceLang] || sourceLang;
    const mappedTarget = LIBRE_LANGUAGE_CODE_MAP[targetLang] || targetLang;

    const body: Record<string, string> = {
        q: text,
        source: mappedSource,
        target: mappedTarget,
        format: 'text',
    };

    if (apiKey) {
        body.api_key = apiKey;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('LibreTranslate error:', errorText);
        throw new Error(`Translation failed: ${errorText}`);
    }

    const data = await response.json() as { translatedText: string };
    return data.translatedText;
}

async function batchTranslateWithLibreTranslate(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    url: string,
    apiKey?: string
): Promise<string[]> {
    const mappedSource = LIBRE_LANGUAGE_CODE_MAP[sourceLang] || sourceLang;
    const mappedTarget = LIBRE_LANGUAGE_CODE_MAP[targetLang] || targetLang;

    // Filter out empty texts and track their indices
    const nonEmptyTexts: string[] = [];
    const indexMap: number[] = [];
    texts.forEach((text, i) => {
        if (text && text.trim()) {
            nonEmptyTexts.push(text);
            indexMap.push(i);
        }
    });

    if (nonEmptyTexts.length === 0) {
        return texts.map(() => '');
    }

    const body: Record<string, string | string[]> = {
        q: nonEmptyTexts,
        source: mappedSource,
        target: mappedTarget,
        format: 'text',
    };

    if (apiKey) {
        body.api_key = apiKey;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('LibreTranslate batch error:', errorText);
        throw new Error(`Batch translation failed: ${errorText}`);
    }

    const data = await response.json() as { translatedText: string | string[] };

    const translatedTexts = Array.isArray(data.translatedText)
        ? data.translatedText
        : [data.translatedText];

    const result: string[] = texts.map(() => '');
    indexMap.forEach((originalIndex, translatedIndex) => {
        result[originalIndex] = translatedTexts[translatedIndex] || '';
    });

    return result;
}

// ============================================================================
// PUBLIC API - Provider-aware functions
// ============================================================================

/**
 * Translate a single text string.
 * Automatically routes to the configured provider.
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string,
    configOverride?: Partial<TranslationConfig>
): Promise<string> {
    if (!text || !text.trim()) return '';
    if (sourceLang === targetLang) return text;

    if (isMockMode()) {
        return mockTranslate(text, targetLang);
    }

    const config = { ...getTranslationConfig(), ...configOverride };

    if (config.provider === 'google_cloud') {
        if (!config.googleApiKey) {
            throw new Error('Google Cloud API key not configured. Set GOOGLE_VISION_API_KEY or configure in Settings.');
        }
        return translateWithGoogle(text, sourceLang, targetLang, config.googleApiKey);
    } else {
        if (!config.libreTranslateUrl) {
            throw new Error('LibreTranslate URL not configured.');
        }
        return translateWithLibreTranslate(text, sourceLang, targetLang, config.libreTranslateUrl, config.libreTranslateApiKey);
    }
}

/**
 * Translate multiple texts in a single batch request.
 * Significantly faster than individual calls.
 */
export async function translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string,
    configOverride?: Partial<TranslationConfig>
): Promise<string[]> {
    if (!texts || texts.length === 0) return [];
    if (sourceLang === targetLang) return [...texts];

    if (isMockMode()) {
        return texts.map(text => mockTranslate(text, targetLang));
    }

    const config = { ...getTranslationConfig(), ...configOverride };

    if (config.provider === 'google_cloud') {
        if (!config.googleApiKey) {
            throw new Error('Google Cloud API key not configured.');
        }
        return batchTranslateWithGoogle(texts, sourceLang, targetLang, config.googleApiKey);
    } else {
        if (!config.libreTranslateUrl) {
            throw new Error('LibreTranslate URL not configured.');
        }
        return batchTranslateWithLibreTranslate(texts, sourceLang, targetLang, config.libreTranslateUrl, config.libreTranslateApiKey);
    }
}

/**
 * Detect the language of a text string.
 * Only supported by Google Cloud.
 */
export async function detectLanguage(
    text: string,
    configOverride?: Partial<TranslationConfig>
): Promise<{ language: string; confidence: number }> {
    const config = { ...getTranslationConfig(), ...configOverride };

    if (config.provider !== 'google_cloud' || !config.googleApiKey) {
        throw new Error('Language detection requires Google Cloud Translation with a valid API key.');
    }

    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}/detect?key=${config.googleApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'http://localhost:3000',
        },
        body: JSON.stringify({ q: text }),
    });

    const data = await response.json() as {
        data?: { detections: Array<Array<{ language: string; confidence: number }>> };
        error?: { code: number; message: string };
    };

    if (data.error) {
        throw new Error(`Language detection error: ${data.error.message}`);
    }

    if (!data.data?.detections?.[0]?.[0]) {
        throw new Error('No detection result');
    }

    const detection = data.data.detections[0][0];
    // Normalize language code
    const normalizedLang = LIBRE_LANGUAGE_CODE_REVERSE[detection.language] || detection.language;
    return { language: normalizedLang, confidence: detection.confidence };
}

/**
 * Get supported languages for the active provider.
 * Google Cloud returns 195+; LibreTranslate returns 9.
 */
export async function getSupportedLanguages(
    configOverride?: Partial<TranslationConfig>
): Promise<LanguageInfo[]> {
    const config = { ...getTranslationConfig(), ...configOverride };

    if (config.provider === 'google_cloud' && config.googleApiKey) {
        try {
            const response = await fetch(
                `${GOOGLE_TRANSLATE_API_URL}/languages?key=${config.googleApiKey}&target=en`,
                {
                    method: 'GET',
                    headers: { 'Referer': 'http://localhost:3000' },
                }
            );

            const data = await response.json() as {
                data?: { languages: Array<{ language: string; name?: string }> };
                error?: { code: number; message: string };
            };

            if (data.data?.languages) {
                return data.data.languages.map(l => ({
                    code: l.language,
                    name: l.name || l.language,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch Google languages, falling back to LibreTranslate list:', error);
        }
    }

    // LibreTranslate static list (or fallback)
    return [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
    ];
}

/**
 * Get translation service status.
 */
export function getTranslationStatus(): {
    provider: TranslationProvider;
    available: boolean;
    reason?: string;
} {
    const config = getTranslationConfig();

    if (config.provider === 'google_cloud') {
        const available = !!config.googleApiKey;
        return {
            provider: 'google_cloud',
            available,
            reason: available ? undefined : 'GOOGLE_VISION_API_KEY not configured',
        };
    } else {
        const available = !!config.libreTranslateUrl;
        return {
            provider: 'libretranslate',
            available,
            reason: available ? undefined : 'LibreTranslate URL not configured',
        };
    }
}
