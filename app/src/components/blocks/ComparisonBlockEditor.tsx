import { useState } from 'react';
import { Upload, X, ArrowLeftRight, ArrowUpDown } from 'lucide-react';
import type { ComparisonBlockData } from '../../types';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import type { TranslationProvider } from '../../services/translationService';

interface ComparisonBlockEditorProps {
    data: ComparisonBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    onChange: (data: ComparisonBlockData) => void;
}

export function ComparisonBlockEditor({ data, language, availableLanguages = ['en'], translationProvider = 'libretranslate', onChange }: ComparisonBlockEditorProps) {
    const [isDragOverBefore, setIsDragOverBefore] = useState(false);
    const [isDragOverAfter, setIsDragOverAfter] = useState(false);

    function handleFileUpload(side: 'before' | 'after', file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const key = side === 'before' ? 'beforeImage' : 'afterImage';
            onChange({ ...data, [key]: { ...data[key], url } });
        };
        reader.readAsDataURL(file);
    }

    function renderImageSlot(side: 'before' | 'after') {
        const image = side === 'before' ? data.beforeImage : data.afterImage;
        const isDragOver = side === 'before' ? isDragOverBefore : isDragOverAfter;
        const setDragOver = side === 'before' ? setIsDragOverBefore : setIsDragOverAfter;
        const sideLabel = side === 'before' ? 'Before' : 'After';

        return (
            <div className="flex-1">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    {sideLabel} Image
                </label>
                {image?.url ? (
                    <div className="relative inline-block">
                        <img src={image.url} alt={`${sideLabel} preview`} className="max-h-36 rounded-lg" />
                        <button
                            type="button"
                            onClick={() => {
                                const key = side === 'before' ? 'beforeImage' : 'afterImage';
                                onChange({ ...data, [key]: { ...image, url: '' } });
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                            e.preventDefault();
                            setDragOver(false);
                            const file = e.dataTransfer.files[0];
                            if (file) handleFileUpload(side, file);
                        }}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                            : 'border-[var(--color-border-default)]'
                        }`}
                    >
                        <Upload className="w-6 h-6 mx-auto mb-1 text-[var(--color-text-muted)]" />
                        <label className="inline-block px-3 py-1.5 text-sm bg-[var(--color-accent-primary)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent-primary)]/90">
                            Browse
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(side, file);
                                }}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}
                {/* Label */}
                <input
                    type="text"
                    value={image?.label?.[language] || ''}
                    onChange={(e) => {
                        const key = side === 'before' ? 'beforeImage' : 'afterImage';
                        onChange({
                            ...data,
                            [key]: { ...image, label: { ...image?.label, [language]: e.target.value } }
                        });
                    }}
                    className="w-full mt-2 px-2 py-1.5 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder={`${sideLabel} label...`}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Block Metadata */}
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

            {/* Image slots */}
            <div className="flex gap-4">
                {renderImageSlot('before')}
                {renderImageSlot('after')}
            </div>

            {/* Orientation */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Slider Direction
                </label>
                <div className="flex gap-2">
                    {([
                        { value: 'horizontal' as const, icon: ArrowLeftRight, label: 'Horizontal' },
                        { value: 'vertical' as const, icon: ArrowUpDown, label: 'Vertical' },
                    ]).map(({ value, icon: Icon, label }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onChange({ ...data, orientation: value })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${data.orientation === value
                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Initial position */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Starting Position <span className="text-[var(--color-text-muted)] font-normal">{data.initialPosition ?? 50}%</span>
                </label>
                <input
                    type="range"
                    min="10"
                    max="90"
                    value={data.initialPosition ?? 50}
                    onChange={(e) => onChange({ ...data, initialPosition: parseInt(e.target.value) })}
                    className="w-full accent-[var(--color-accent-primary)]"
                />
            </div>
        </div>
    );
}
