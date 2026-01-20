import { Check, Plus } from 'lucide-react';
import { getLanguageName } from '../i18n/i18n';

interface LanguageSwitcherProps {
    /** Available languages for the content (from tour.languages) */
    availableLanguages: string[];
    /** Currently active/editing language */
    activeLanguage: string;
    /** Callback when language changes */
    onChange: (lang: string) => void;
    /** Optional: Content map to show which languages have content */
    contentMap?: { [lang: string]: string };
    /** Optional: Callback to add a new language */
    onAddLanguage?: () => void;
    /** Size variant */
    size?: 'sm' | 'md';
    /** Show status indicators for content presence */
    showStatus?: boolean;
}

/**
 * LanguageSwitcher - Pill-style language tabs for content editing
 * 
 * Shows available languages with:
 * - Active state (highlighted pill)
 * - Content status indicators (✓ has content, ○ empty)
 * - Optional "Add Language" button
 */
export function LanguageSwitcher({
    availableLanguages,
    activeLanguage,
    onChange,
    contentMap,
    onAddLanguage,
    size = 'md',
    showStatus = true,
}: LanguageSwitcherProps) {
    const sizeClasses = size === 'sm'
        ? 'px-2 py-1 text-xs gap-1'
        : 'px-3 py-1.5 text-sm gap-1.5';

    const hasContent = (lang: string) => {
        if (!contentMap) return null;
        const content = contentMap[lang];
        return content && content.trim().length > 0;
    };

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {availableLanguages.map((lang) => {
                const isActive = lang === activeLanguage;
                const hasText = hasContent(lang);

                return (
                    <button
                        key={lang}
                        type="button"
                        onClick={() => onChange(lang)}
                        className={`
              inline-flex items-center ${sizeClasses} rounded-full font-medium transition-all
              ${isActive
                                ? 'bg-[var(--color-accent-primary)] text-white shadow-sm'
                                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-default)]'
                            }
            `}
                        title={getLanguageName(lang)}
                    >
                        <span className="uppercase">{lang}</span>
                        {showStatus && hasText !== null && (
                            hasText ? (
                                <Check className={`${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-green-400`} />
                            ) : (
                                <span className={`${size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'} rounded-full border-2 ${isActive ? 'border-white/60' : 'border-[var(--color-text-muted)]'}`} />
                            )
                        )}
                    </button>
                );
            })}

            {onAddLanguage && (
                <button
                    type="button"
                    onClick={onAddLanguage}
                    className={`
            inline-flex items-center ${sizeClasses} rounded-full font-medium transition-all
            bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] 
            hover:bg-[var(--color-accent-primary)]/10 hover:text-[var(--color-accent-primary)]
            border border-dashed border-[var(--color-border-default)]
          `}
                    title="Add language"
                >
                    <Plus className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
                </button>
            )}
        </div>
    );
}
