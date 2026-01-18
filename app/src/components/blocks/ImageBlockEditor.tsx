import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import type { ImageBlockData } from '../../types';

interface ImageBlockEditorProps {
    data: ImageBlockData;
    language: string;
    onChange: (data: ImageBlockData) => void;
}

export function ImageBlockEditor({ data, language, onChange }: ImageBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);

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

    return (
        <div className="space-y-4">
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

            {/* Alt text */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Alt Text ({language.toUpperCase()})
                </label>
                <input
                    type="text"
                    value={data.alt[language] || data.alt.en || ''}
                    onChange={(e) => onChange({
                        ...data,
                        alt: { ...data.alt, [language]: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder="Describe the image..."
                />
            </div>

            {/* Caption */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Caption ({language.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                </label>
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
