import { useState } from 'react';
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { magicTranslate } from '../services/translationService';

interface MagicTranslateButtonProps {
    /** Source text to translate */
    sourceText: string;
    /** Source language code */
    sourceLang: string;
    /** Target language codes to translate to */
    targetLangs: string[];
    /** Callback with translations */
    onTranslate: (translations: { [lang: string]: string }) => void;
    /** Optional API key for LibreTranslate */
    apiKey?: string;
    /** Size variant */
    size?: 'sm' | 'md';
    /** Disabled state */
    disabled?: boolean;
}

type TranslateState = 'idle' | 'loading' | 'success' | 'error';

/**
 * MagicTranslateButton - One-click AI translation
 * 
 * Shows a sparkle button that translates content to all target languages.
 * Displays loading, success, and error states.
 */
export function MagicTranslateButton({
    sourceText,
    sourceLang,
    targetLangs,
    onTranslate,
    apiKey,
    size = 'md',
    disabled = false,
}: MagicTranslateButtonProps) {
    const { t } = useTranslation();
    const [state, setState] = useState<TranslateState>('idle');

    const handleTranslate = async () => {
        if (!sourceText.trim() || targetLangs.length === 0) return;

        setState('loading');
        try {
            const translations = await magicTranslate(
                sourceText,
                sourceLang,
                targetLangs,
                apiKey
            );
            onTranslate(translations);
            setState('success');
            // Reset to idle after 2 seconds
            setTimeout(() => setState('idle'), 2000);
        } catch (error) {
            console.error('Translation error:', error);
            setState('error');
            // Reset to idle after 3 seconds
            setTimeout(() => setState('idle'), 3000);
        }
    };

    const sizeClasses = size === 'sm'
        ? 'px-2 py-1 text-xs gap-1'
        : 'px-3 py-1.5 text-sm gap-1.5';

    const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    const isDisabled = disabled || !sourceText.trim() || state === 'loading';

    const getButtonContent = () => {
        switch (state) {
            case 'loading':
                return (
                    <>
                        <Loader2 className={`${iconSize} animate-spin`} />
                        <span>{t('translation.translating')}</span>
                    </>
                );
            case 'success':
                return (
                    <>
                        <Check className={iconSize} />
                        <span>{t('translation.translateSuccess')}</span>
                    </>
                );
            case 'error':
                return (
                    <>
                        <AlertCircle className={iconSize} />
                        <span>{t('translation.translateError')}</span>
                    </>
                );
            default:
                return (
                    <>
                        <Sparkles className={iconSize} />
                        <span>{t('translation.translateAll')}</span>
                    </>
                );
        }
    };

    const getButtonColors = () => {
        switch (state) {
            case 'loading':
                return 'bg-[var(--color-accent-primary)]/50 text-white cursor-wait';
            case 'success':
                return 'bg-green-500 text-white';
            case 'error':
                return 'bg-red-500/80 text-white';
            default:
                return isDisabled
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-not-allowed'
                    : 'bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]';
        }
    };

    return (
        <button
            type="button"
            onClick={handleTranslate}
            disabled={isDisabled}
            className={`
        inline-flex items-center ${sizeClasses} rounded-lg font-medium transition-all
        ${getButtonColors()}
      `}
            title={isDisabled && !sourceText.trim() ? 'Enter text first' : t('translation.translateAll')}
        >
            {getButtonContent()}
        </button>
    );
}
