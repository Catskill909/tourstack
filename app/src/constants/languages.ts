// Centralized language constants for TourStack
// All components should import from here instead of defining their own lists.

export interface LanguageInfo {
    code: string;
    name: string;
}

// Static language list (LibreTranslate compatible - 9 languages)
// Used as fallback when dynamic fetch is unavailable
export const LIBRE_TRANSLATE_LANGUAGES: LanguageInfo[] = [
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

// Language codes only (for quick lookups)
export const LIBRE_TRANSLATE_LANGUAGE_CODES = LIBRE_TRANSLATE_LANGUAGES.map(l => l.code);

// Language name lookup
export function getLanguageNameFromCode(code: string): string {
    const found = LIBRE_TRANSLATE_LANGUAGES.find(l => l.code === code);
    return found?.name || code.toUpperCase();
}

// Check if a language code is in the static list
export function isInStaticLanguageList(code: string): boolean {
    return LIBRE_TRANSLATE_LANGUAGE_CODES.includes(code);
}

// Native language names for UI display (tour modals, language selectors)
export const NATIVE_LANGUAGE_NAMES: Record<string, string> = {
    'en': 'English',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'ar': 'العربية',
    'hi': 'हिन्दी',
    'ru': 'Русский',
    'nl': 'Nederlands',
    'sv': 'Svenska',
    'pl': 'Polski',
    'tr': 'Türkçe',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
};

// Get native name for a language code, falling back to English name
export function getNativeLanguageName(code: string, englishName?: string): string {
    return NATIVE_LANGUAGE_NAMES[code] || englishName || code.toUpperCase();
}

// Common museum tour languages — shown first in language selectors
// These cover the vast majority of museum visitor demographics worldwide
export const COMMON_MUSEUM_LANGUAGES = [
    'en', // English
    'es', // Spanish
    'fr', // French
    'de', // German
    'it', // Italian
    'ja', // Japanese
    'zh', // Chinese (Mandarin)
    'ko', // Korean
    'ru', // Russian
];

// Sort languages so common museum languages appear first, then the rest alphabetically
export function sortLanguagesCommonFirst<T extends { code: string; name?: string }>(languages: T[]): T[] {
    const commonSet = new Set(COMMON_MUSEUM_LANGUAGES);
    const commonOrder = new Map(COMMON_MUSEUM_LANGUAGES.map((code, i) => [code, i]));

    const common: T[] = [];
    const rest: T[] = [];

    for (const lang of languages) {
        if (commonSet.has(lang.code)) {
            common.push(lang);
        } else {
            rest.push(lang);
        }
    }

    // Sort common by defined order, rest alphabetically by name
    common.sort((a, b) => (commonOrder.get(a.code) ?? 99) - (commonOrder.get(b.code) ?? 99));
    rest.sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code));

    return [...common, ...rest];
}
