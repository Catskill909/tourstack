import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TextBlockData } from '../../types';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';

interface TextBlockEditorProps {
    data: TextBlockData;
    /** Current editing language */
    language: string;
    /** All available languages for the tour */
    availableLanguages?: string[];
    onChange: (data: TextBlockData) => void;
}

export function TextBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    onChange
}: TextBlockEditorProps) {
    const { t } = useTranslation();
    const [activeLanguage, setActiveLanguage] = useState(language);
    const [content, setContent] = useState(data.content[activeLanguage] || data.content.en || '');

    // Update content when active language changes
    useEffect(() => {
        setContent(data.content[activeLanguage] || '');
    }, [activeLanguage, data.content]);

    // Sync activeLanguage when prop changes
    useEffect(() => {
        setActiveLanguage(language);
    }, [language]);

    function handleContentChange(value: string) {
        setContent(value);
        onChange({
            ...data,
            content: {
                ...data.content,
                [activeLanguage]: value,
            },
        });
    }

    function handleTranslations(translations: { [lang: string]: string }) {
        onChange({
            ...data,
            content: {
                ...data.content,
                ...translations,
            },
        });
    }

    // Get primary language (first with content, or first in list)
    const primaryLang = availableLanguages.find(l => data.content[l]?.trim()) || availableLanguages[0] || 'en';
    const primaryText = data.content[primaryLang] || '';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    return (
        <div className="space-y-4">
            {/* Language Controls */}
            {availableLanguages.length > 1 && (
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-default)]">
                    <LanguageSwitcher
                        availableLanguages={availableLanguages}
                        activeLanguage={activeLanguage}
                        onChange={setActiveLanguage}
                        contentMap={data.content}
                        size="sm"
                        showStatus={true}
                    />
                    <MagicTranslateButton
                        sourceText={primaryText}
                        sourceLang={primaryLang}
                        targetLangs={otherLangs}
                        onTranslate={handleTranslations}
                        size="sm"
                        disabled={!primaryText.trim()}
                    />
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    {t('textBlock.content')} ({activeLanguage.toUpperCase()})
                </label>
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y"
                    placeholder={t('textBlock.placeholder')}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {t('textBlock.htmlHint')}
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    {t('textBlock.style')}
                </label>
                <div className="flex gap-2">
                    {(['normal', 'callout', 'sidebar'] as const).map((style) => (
                        <button
                            key={style}
                            type="button"
                            onClick={() => onChange({ ...data, style })}
                            className={`px-3 py-2 rounded-lg border transition-colors capitalize ${data.style === style
                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            {t(`textBlock.${style}`)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
