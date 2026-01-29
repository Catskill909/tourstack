import { useState } from 'react';
import { Upload, X, Languages, Loader2 } from 'lucide-react';
import { translateWithLibre, type TranslationProvider } from '../../services/translationService';
import type { ImageBlockData } from '../../types';
import { BlockMetadataEditor } from './BlockMetadataEditor';

interface ImageBlockEditorProps {
    data: ImageBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    onChange: (data: ImageBlockData) => void;
}

export function ImageBlockEditor({ data, language, availableLanguages = ['en'], translationProvider = 'libretranslate', onChange }: ImageBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
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
            onChange({ ...data, url });
        };
        reader.readAsDataURL(file);
    }

    function handleRemoveImage() {
        onChange({ ...data, url: '' });
    }

    async function handleTranslateCaption() {
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = data.caption?.[primaryLang] || data.caption?.['en'];

        if (!sourceText?.trim()) return;

        setIsTranslatingCaption(true);
        const newCaption = { ...data.caption };
        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newCaption[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate caption to ${lang}:`, error);
            }
        }

        onChange({ ...data, caption: newCaption });
        setIsTranslatingCaption(false);
    }


    return (
        <div className="space-y-4">
            {/* Block Metadata (Title & Image) */}
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={language}
                availableLanguages={availableLanguages}
                translationProvider={translationProvider}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {/* Image upload/preview */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Image
                </label>
                {data.url ? (
                    <div className="relative inline-block">
                        <img src={data.url} alt="Preview" className="max-h-48 rounded-lg" />
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
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragOver
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
            </div>

            {/* Caption */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Caption <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
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
                    value={data.caption?.[language] || data.caption?.en || ''}
                    onChange={(e) => onChange({
                        ...data,
                        caption: { ...data.caption, [language]: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder="Image caption..."
                />
            </div>

            {/* Credit */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Credit <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                </label>
                <input
                    type="text"
                    value={data.credit?.[language] || data.credit?.en || ''}
                    onChange={(e) => onChange({
                        ...data,
                        credit: { ...data.credit, [language]: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder="Photo credit or attribution..."
                />
            </div>

            {/* Size */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Size
                </label>
                <div className="flex gap-2">
                    {(['small', 'medium', 'large', 'full'] as const).map((size) => (
                        <button
                            key={size}
                            type="button"
                            onClick={() => onChange({ ...data, size })}
                            className={`px-3 py-2 rounded-lg border transition-colors capitalize ${data.size === size
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
