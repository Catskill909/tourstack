import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUp, Loader2 } from 'lucide-react';
import type { TextBlockData } from '../../types';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';
import { extractTextFromFile, SUPPORTED_FILE_FORMATS, type TranslationProvider } from '../../services/translationService';

interface TextBlockEditorProps {
    data: TextBlockData;
    /** Current editing language */
    language: string;
    /** All available languages for the tour */
    availableLanguages?: string[];
    /** Translation provider to use */
    translationProvider?: TranslationProvider;
    onChange: (data: TextBlockData) => void;
}

export function TextBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    onChange
}: TextBlockEditorProps) {
    const { t } = useTranslation();
    const [activeLanguage, setActiveLanguage] = useState(language);
    const [content, setContent] = useState(data.content[activeLanguage] || data.content.en || '');
    const [isImporting, setIsImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportError(null);
        setIsImporting(true);

        try {
            const extractedText = await extractTextFromFile(file);
            handleContentChange(extractedText);
        } catch (error) {
            console.error('File import error:', error);
            setImportError(error instanceof Error ? error.message : 'Failed to import file');
        } finally {
            setIsImporting(false);
            // Reset file input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    // Get primary language (first with content, or first in list)
    const primaryLang = availableLanguages.find(l => data.content[l]?.trim()) || availableLanguages[0] || 'en';
    const primaryText = data.content[primaryLang] || '';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    return (
        <div className="space-y-4">
            {/* Language Controls */}
            {availableLanguages.length > 1 && (
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-[var(--color-border-default)]">
                    <div className="flex-1 min-w-0">
                        <LanguageSwitcher
                            availableLanguages={availableLanguages}
                            activeLanguage={activeLanguage}
                            onChange={setActiveLanguage}
                            contentMap={data.content}
                            size="sm"
                            showStatus={true}
                        />
                    </div>
                    <MagicTranslateButton
                        sourceText={primaryText}
                        sourceLang={primaryLang}
                        targetLangs={otherLangs}
                        onTranslate={handleTranslations}
                        provider={translationProvider}
                        size="sm"
                        disabled={!primaryText.trim()}
                    />
                </div>
            )}

            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        {t('textBlock.content')} ({activeLanguage.toUpperCase()})
                    </label>
                    
                    {/* Import from File Button */}
                    <div className="flex items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={SUPPORTED_FILE_FORMATS.join(',')}
                            onChange={handleFileImport}
                            className="hidden"
                            id="text-block-file-import"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
                            title={`Import from file (${SUPPORTED_FILE_FORMATS.join(', ')})`}
                        >
                            {isImporting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <FileUp className="w-3.5 h-3.5" />
                            )}
                            <span>{isImporting ? 'Importing...' : 'Import File'}</span>
                        </button>
                    </div>
                </div>
                
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y"
                    placeholder={t('textBlock.placeholder')}
                />
                
                {/* Error message */}
                {importError && (
                    <p className="text-xs text-red-400 mt-1">
                        {importError}
                    </p>
                )}
                
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
