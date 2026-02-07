// Hook to fetch available translation languages from the active provider
// Google Cloud returns 195+ languages; LibreTranslate returns 9
import { useState, useEffect } from 'react';
import { LIBRE_TRANSLATE_LANGUAGES, type LanguageInfo } from '../constants/languages';

interface TranslationLanguagesResult {
    languages: LanguageInfo[];
    isLoading: boolean;
    error: string | null;
    provider: string | null;
    refetch: () => void;
}

// Cache to avoid re-fetching on every component mount
let cachedLanguages: LanguageInfo[] | null = null;
let cachedProvider: string | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useTranslationLanguages(): TranslationLanguagesResult {
    const [languages, setLanguages] = useState<LanguageInfo[]>(cachedLanguages || LIBRE_TRANSLATE_LANGUAGES);
    const [isLoading, setIsLoading] = useState(!cachedLanguages);
    const [error, setError] = useState<string | null>(null);
    const [provider, setProvider] = useState<string | null>(cachedProvider);

    const fetchLanguages = async () => {
        // Use cache if fresh
        if (cachedLanguages && Date.now() - cacheTimestamp < CACHE_TTL) {
            setLanguages(cachedLanguages);
            setProvider(cachedProvider);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Fetch status to know which provider is active
            const statusRes = await fetch('/api/translate/status');
            const status = await statusRes.json();
            setProvider(status.provider || null);
            cachedProvider = status.provider || null;

            // Fetch languages from the active provider
            const langRes = await fetch('/api/translate/languages');
            const langData = await langRes.json();

            const langs: LanguageInfo[] = langData.languages || langData || LIBRE_TRANSLATE_LANGUAGES;
            setLanguages(langs);
            cachedLanguages = langs;
            cacheTimestamp = Date.now();
        } catch (err) {
            console.error('Failed to fetch translation languages:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch languages');
            setLanguages(LIBRE_TRANSLATE_LANGUAGES);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLanguages();
    }, []);

    return { languages, isLoading, error, provider, refetch: fetchLanguages };
}

// Utility: check if a language code is available for translation
export function isLanguageAvailable(code: string, availableLanguages: LanguageInfo[]): boolean {
    return availableLanguages.some(l => l.code === code);
}

// Clear the cache (useful after changing provider in settings)
export function clearTranslationLanguageCache(): void {
    cachedLanguages = null;
    cachedProvider = null;
    cacheTimestamp = 0;
}
