import { useState } from 'react';
import { Upload, X, Languages, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { translateWithLibre, type TranslationProvider } from '../../services/translationService';
import type { StopImageData } from '../../types';

interface BlockMetadataEditorProps {
    title?: { [lang: string]: string };
    showTitle?: boolean;
    blockImage?: StopImageData;
    showBlockImage?: boolean;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    onChange: (updates: {
        title?: { [lang: string]: string };
        showTitle?: boolean;
        blockImage?: StopImageData;
        showBlockImage?: boolean;
    }) => void;
}

export function BlockMetadataEditor({
    title = {},
    showTitle = false,
    blockImage,
    showBlockImage = false,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    onChange
}: BlockMetadataEditorProps) {
    const [isExpanded, setIsExpanded] = useState(() => {
        // Auto-expand if any data exists
        return !!(title?.[language] || blockImage?.url || showTitle || showBlockImage);
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
    const [isTranslatingCaption, setIsTranslatingCaption] = useState(false);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }

    function processFile(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            onChange({
                title,
                showTitle,
                blockImage: { ...blockImage, url },
                showBlockImage
            });
        };
        reader.readAsDataURL(file);
    }

    function handleRemoveImage() {
        onChange({
            title,
            showTitle,
            blockImage: undefined,
            showBlockImage: false
        });
    }

    async function handleTranslateTitle() {
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = title?.[primaryLang] || title?.['en'];

        if (!sourceText?.trim()) return;

        setIsTranslatingTitle(true);
        const newTitle = { ...title };
        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newTitle[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate title to ${lang}:`, error);
            }
        }

        onChange({ title: newTitle, showTitle, blockImage, showBlockImage });
        setIsTranslatingTitle(false);
    }

    async function handleTranslateCaption() {
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = blockImage?.caption?.[primaryLang] || blockImage?.caption?.['en'];

        if (!sourceText?.trim()) return;

        setIsTranslatingCaption(true);
        const newCaption = { ...blockImage?.caption };
        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newCaption[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate caption to ${lang}:`, error);
            }
        }

        onChange({
            title,
            showTitle,
            blockImage: { ...blockImage, url: blockImage?.url || '', caption: newCaption },
            showBlockImage
        });
        setIsTranslatingCaption(false);
    }

    return (
        <div className="border border-[var(--color-border-default)] rounded-lg bg-[var(--color-bg-elevated)]/50">
            {/* Collapsible Header */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-[var(--color-bg-hover)] transition-colors rounded-t-lg"
            >
                <div className="flex items-center gap-2">
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Block Title & Image
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                        (Optional)
                    </span>
                </div>
                {(showTitle || showBlockImage) && (
                    <div className="flex items-center gap-1">
                        {showTitle && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                Title
                            </span>
                        )}
                        {showBlockImage && (
                            <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                Image
                            </span>
                        )}
                    </div>
                )}
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="p-4 space-y-4 border-t border-[var(--color-border-default)]">
                    {/* Block Title */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Block Title ({language.toUpperCase()})
                            </label>
                            {availableLanguages.length > 1 && (
                                <button
                                    type="button"
                                    onClick={handleTranslateTitle}
                                    disabled={isTranslatingTitle}
                                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded hover:bg-[var(--color-accent-primary)]/20 disabled:opacity-50"
                                    title="Translate title to all languages"
                                >
                                    {isTranslatingTitle ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Languages className="w-3 h-3" />
                                    )}
                                    <span>Translate</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={title?.[language] || title?.en || ''}
                            onChange={(e) => onChange({
                                title: { ...title, [language]: e.target.value },
                                showTitle,
                                blockImage,
                                showBlockImage
                            })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Block title..."
                        />
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={showTitle}
                                onChange={(e) => onChange({
                                    title,
                                    showTitle: e.target.checked,
                                    blockImage,
                                    showBlockImage
                                })}
                                className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">Show Block Title</span>
                        </label>
                    </div>

                    {/* Block Image */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Block Image
                        </label>
                        {blockImage?.url ? (
                            <div className="relative inline-block">
                                <img src={blockImage.url} alt="Preview" className="max-h-48 rounded-lg" />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    isDragOver
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                        : 'border-[var(--color-border-default)]'
                                }`}
                            >
                                <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                                <p className="text-[var(--color-text-muted)] mb-2">Drag and drop an image, or</p>
                                <label className="inline-block px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent-primary)]/90">
                                    Browse
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}
                        <label className="flex items-center gap-2 cursor-pointer mt-2">
                            <input
                                type="checkbox"
                                checked={showBlockImage}
                                onChange={(e) => onChange({
                                    title,
                                    showTitle,
                                    blockImage,
                                    showBlockImage: e.target.checked
                                })}
                                className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">Show Block Image</span>
                        </label>
                    </div>

                    {/* Image Caption */}
                    {blockImage?.url && (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                    Image Caption <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                                </label>
                                {availableLanguages.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleTranslateCaption}
                                        disabled={isTranslatingCaption}
                                        className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded hover:bg-[var(--color-accent-primary)]/20 disabled:opacity-50"
                                        title="Translate caption to all languages"
                                    >
                                        {isTranslatingCaption ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Languages className="w-3 h-3" />
                                        )}
                                        <span>Translate</span>
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={blockImage?.caption?.[language] || blockImage?.caption?.en || ''}
                                onChange={(e) => onChange({
                                    title,
                                    showTitle,
                                    blockImage: {
                                        ...blockImage,
                                        caption: { ...blockImage.caption, [language]: e.target.value }
                                    },
                                    showBlockImage
                                })}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                placeholder="Image caption..."
                            />
                        </div>
                    )}

                    {/* Image Credit */}
                    {blockImage?.url && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Image Credit <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                            </label>
                            <input
                                type="text"
                                value={blockImage?.credit?.[language] || blockImage?.credit?.en || ''}
                                onChange={(e) => onChange({
                                    title,
                                    showTitle,
                                    blockImage: {
                                        ...blockImage,
                                        url: blockImage.url,
                                        credit: { ...blockImage.credit, [language]: e.target.value }
                                    },
                                    showBlockImage
                                })}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                placeholder="Photo credit..."
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
