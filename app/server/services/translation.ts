// Unified Translation Service
// Supports Google Cloud Translation API v2 and LibreTranslate
// All backend routes should import from this module instead of implementing their own translation logic.
//
// RATE LIMITING: Google Cloud Translation v2 has a 100K characters per 100 seconds
// per-user limit. We enforce server-side throttling to avoid "User Rate Limit Exceeded"
// errors, and retry with exponential backoff + auto-fallback to LibreTranslate.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings file path (same as settings.ts)
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

// ============================================================================
// RATE LIMITER — Prevents Google API "User Rate Limit Exceeded" errors
// ============================================================================
// Google v2 allows 100K chars per 100 seconds. We track character usage in a
// sliding window and delay requests that would exceed the limit.

const GOOGLE_RATE_LIMIT_CHARS = 80_000;   // Stay under the 100K limit with buffer
const GOOGLE_RATE_WINDOW_MS = 100_000;    // 100-second sliding window

interface RateEntry {
    chars: number;
    timestamp: number;
}

const rateHistory: RateEntry[] = [];

/** How many characters have we used in the current sliding window? */
function charsUsedInWindow(): number {
    const cutoff = Date.now() - GOOGLE_RATE_WINDOW_MS;
    // Prune old entries
    while (rateHistory.length > 0 && rateHistory[0].timestamp < cutoff) {
        rateHistory.shift();
    }
    return rateHistory.reduce((sum, e) => sum + e.chars, 0);
}

/** Record character usage */
function recordUsage(chars: number) {
    rateHistory.push({ chars, timestamp: Date.now() });
}

/** Wait if we'd exceed the rate limit, returns when safe to proceed */
async function waitForRateLimit(charsNeeded: number): Promise<void> {
    const maxWait = 15_000; // Don't wait more than 15s
    const start = Date.now();

    while (charsUsedInWindow() + charsNeeded > GOOGLE_RATE_LIMIT_CHARS) {
        if (Date.now() - start > maxWait) {
            throw new Error('Google Translate rate limit: request queued too long, try again shortly');
        }
        // Wait for oldest entry to expire from the window
        const oldestAge = rateHistory.length > 0
            ? Date.now() - rateHistory[0].timestamp
            : 0;
        const waitTime = Math.min(GOOGLE_RATE_WINDOW_MS - oldestAge + 50, 2000);
        await new Promise(resolve => setTimeout(resolve, Math.max(waitTime, 200)));
    }
}

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

/** Check if an error is a rate limit / quota error */
function isRateLimitError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return /rate limit|quota|429|too many requests/i.test(msg);
}

async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 2,
    label = 'translation'
): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (isRateLimitError(err) && attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 500, 8000);
                console.warn(`${label}: rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw err;
        }
    }
    throw lastError;
}

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
    const charCount = text.length;
    await waitForRateLimit(charCount);

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

    recordUsage(charCount);
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

    const charCount = nonEmptyTexts.reduce((sum, t) => sum + t.length, 0);
    await waitForRateLimit(charCount);

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

    recordUsage(charCount);
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
// PUBLIC API - Provider-aware with rate limiting, retry, and auto-fallback
// ============================================================================

/** Try LibreTranslate as fallback */
function getLibreFallbackConfig(config: TranslationConfig): { url: string; apiKey?: string } {
    const url = config.libreTranslateUrl || 'https://translate.supersoul.top/translate';
    return { url, apiKey: config.libreTranslateApiKey };
}

/**
 * Translate a single text string.
 * Rate-limited → retries with backoff → falls back to LibreTranslate.
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
        try {
            return await withRetry(
                () => translateWithGoogle(text, sourceLang, targetLang, config.googleApiKey!),
                2, 'translateText'
            );
        } catch (err) {
            if (isRateLimitError(err)) {
                const fallback = getLibreFallbackConfig(config);
                console.warn('Google Translate rate limited after retries — falling back to LibreTranslate');
                return translateWithLibreTranslate(text, sourceLang, targetLang, fallback.url, fallback.apiKey);
            }
            throw err;
        }
    } else {
        if (!config.libreTranslateUrl) {
            throw new Error('LibreTranslate URL not configured.');
        }
        return translateWithLibreTranslate(text, sourceLang, targetLang, config.libreTranslateUrl, config.libreTranslateApiKey);
    }
}

/**
 * Translate multiple texts in a single batch request.
 * Rate-limited → retries with backoff → falls back to LibreTranslate.
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
        try {
            return await withRetry(
                () => batchTranslateWithGoogle(texts, sourceLang, targetLang, config.googleApiKey!),
                2, 'translateBatch'
            );
        } catch (err) {
            if (isRateLimitError(err)) {
                const fallback = getLibreFallbackConfig(config);
                console.warn('Google Translate batch rate limited after retries — falling back to LibreTranslate');
                return batchTranslateWithLibreTranslate(texts, sourceLang, targetLang, fallback.url, fallback.apiKey);
            }
            throw err;
        }
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
