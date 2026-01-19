import { useState, useRef } from 'react';
import { Upload, X, GripVertical, Pencil, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import type { GalleryBlockData } from '../../types';

interface GalleryImage {
    id: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
}

interface GalleryBlockEditorProps {
    data: GalleryBlockData;
    language: string;
    onChange: (data: GalleryBlockData) => void;
}

function generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function GalleryBlockEditor({ data, language, onChange }: GalleryBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Preview state
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ensure images array exists with proper structure
    const images: GalleryImage[] = (data.images || []).map((img, idx) => ({
        id: (img as GalleryImage).id || `img_legacy_${idx}`,
        url: img.url,
        alt: img.alt || { [language]: '' },
        caption: img.caption || { [language]: '' },
        credit: img.credit
    }));

    const crossfadeDuration = data.crossfadeDuration || 500;

    function triggerCrossfade(newIndex: number) {
        setIsFading(true);
        setTimeout(() => {
            setPreviewIndex(newIndex);
            setTimeout(() => setIsFading(false), crossfadeDuration / 2);
        }, crossfadeDuration / 2);
    }

    // Handle file selection
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
    }

    function processFiles(files: File[]) {
        const validFiles = files.filter(file =>
            file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
        );

        // Process all files in parallel, then update state once
        const readPromises = validFiles.map(file => {
            return new Promise<GalleryImage>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const url = event.target?.result as string;
                    resolve({
                        id: generateId(),
                        url,
                        alt: { [language]: file.name.replace(/\.[^/.]+$/, '') },
                        caption: { [language]: '' },
                        credit: { [language]: '' }
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        Promise.all(readPromises).then(newImages => {
            onChange({
                ...data,
                images: [...(data.images || []), ...newImages]
            });
        });
    }

    function handleRemoveImage(id: string) {
        onChange({
            ...data,
            images: images.filter(img => img.id !== id)
        });
    }

    function handleUpdateImage(id: string, updates: Partial<GalleryImage>) {
        onChange({
            ...data,
            images: images.map(img =>
                img.id === id ? { ...img, ...updates } : img
            )
        });
    }

    // Drag and drop reordering
    function handleDragStart(index: number) { setDraggedIndex(index); }
    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);
        onChange({ ...data, images: newImages });
        setDraggedIndex(index);
    }
    function handleDragEnd() { setDraggedIndex(null); }

    function handleLayoutChange(layout: 'carousel' | 'grid' | 'masonry') {
        onChange({ ...data, layout });
    }

    // Navigation controls
    function goToPrevious() {
        triggerCrossfade(previewIndex === 0 ? images.length - 1 : previewIndex - 1);
    }

    function goToNext() {
        triggerCrossfade(previewIndex === images.length - 1 ? 0 : previewIndex + 1);
    }

    const currentImage = images[previewIndex];

    return (
        <div className="space-y-6">
            {/* Layout & Settings Header */}
            <div className="flex items-center gap-4 flex-wrap">
                <button
                    type="button"
                    onClick={() => setShowSettings(!showSettings)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showSettings
                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)] shadow-lg'
                            : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                    Settings
                </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border-default)] space-y-5 animate-in slide-in-from-top duration-200">
                    {/* Layout Selection */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                            Layout Style
                        </label>
                        <div className="flex gap-2">
                            {(['carousel', 'grid', 'masonry'] as const).map((layout) => (
                                <button
                                    key={layout}
                                    type="button"
                                    onClick={() => handleLayoutChange(layout)}
                                    className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${data.layout === layout
                                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)] shadow-lg'
                                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]'
                                        }`}
                                >
                                    {layout}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grid columns */}
                    {data.layout === 'grid' && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                                Items per Row
                            </label>
                            <div className="flex gap-2">
                                {[2, 3, 4, 5, 6].map((cols) => (
                                    <button
                                        key={cols}
                                        type="button"
                                        onClick={() => onChange({ ...data, itemsPerRow: cols })}
                                        className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${(data.itemsPerRow || 3) === cols
                                                ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)] shadow-lg'
                                                : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]'
                                            }`}
                                    >
                                        {cols}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Crossfade Duration */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                            Crossfade Duration (ms)
                        </label>
                        <input
                            type="range"
                            min={100}
                            max={1500}
                            step={100}
                            value={data.crossfadeDuration || 500}
                            onChange={(e) => onChange({ ...data, crossfadeDuration: parseInt(e.target.value) })}
                            className="w-full accent-[var(--color-accent-primary)]"
                        />
                        <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                            <span>100ms</span>
                            <span className="font-medium text-[var(--color-accent-primary)]">{data.crossfadeDuration || 500}ms</span>
                            <span>1500ms</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Current Image Preview - Carousel Mode */}
            {data.layout === 'carousel' && images.length > 0 && (
                <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                    <div className="relative aspect-[16/10] bg-black">
                        <div
                            className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                            style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                        >
                            {currentImage && (
                                <img
                                    src={currentImage.url}
                                    alt={currentImage.alt[language] || ''}
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>

                        {/* Navigation Arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={goToPrevious}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    type="button"
                                    onClick={goToNext}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium">
                            {previewIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Caption/Credit Display */}
                    {currentImage && (
                        <div className="p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
                            <p className="text-[var(--color-text-primary)] font-medium">
                                {currentImage.caption[language] || 'No caption'}
                            </p>
                            {currentImage.credit?.[language] && (
                                <p className="text-sm text-[var(--color-text-muted)] italic mt-1">
                                    Credit: {currentImage.credit[language]}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Image Upload Area */}
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragOver
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 scale-[1.02]'
                        : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                    }`}
            >
                <div className="p-4 rounded-full bg-[var(--color-accent-primary)]/10 inline-block mb-4">
                    <Upload className="w-8 h-8 text-[var(--color-accent-primary)]" />
                </div>
                <p className="text-[var(--color-text-secondary)] mb-2 font-medium">
                    {images.length === 0 ? 'Add images to your gallery' : 'Add more images'}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">Drag and drop multiple images or click below</p>
                <label className="inline-block px-6 py-3 bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all font-medium">
                    Browse Files
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Image Thumbnails */}
            {images.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-[var(--color-text-primary)]">
                            Gallery Images ({images.length})
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                            Drag to reorder
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => triggerCrossfade(index)}
                                className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all ${previewIndex === index
                                        ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                        : 'hover:ring-2 hover:ring-[var(--color-accent-primary)]/50 hover:ring-offset-1'
                                    }`}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />

                                {/* Drag Handle */}
                                <div className="absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setEditingImageId(img.id); }}
                                        className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveImage(img.id); }}
                                        className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Caption indicator */}
                                {img.caption[language] && (
                                    <div className="absolute bottom-2 left-2 right-2">
                                        <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-white text-xs truncate">
                                            {img.caption[language]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Caption/Credit Editor Modal */}
            {editingImageId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditingImageId(null)}>
                    <div
                        className="bg-[var(--color-bg-surface)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-[var(--color-border-default)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const img = images.find(i => i.id === editingImageId);
                            if (!img) return null;
                            return (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <img src={img.url} alt="" className="w-24 h-24 rounded-xl object-cover" />
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                                Edit Image Details
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                Caption and credit information
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Alt Text
                                        </label>
                                        <input
                                            type="text"
                                            value={img.alt[language] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                alt: { ...img.alt, [language]: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                            placeholder="Describe the image..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Caption <span className="text-[var(--color-accent-primary)]">*</span>
                                        </label>
                                        <textarea
                                            value={img.caption[language] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                caption: { ...img.caption, [language]: e.target.value }
                                            })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                                            placeholder="What does this image show?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Credit / Attribution
                                        </label>
                                        <input
                                            type="text"
                                            value={img.credit?.[language] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                credit: { ...img.credit, [language]: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                            placeholder="© Photographer Name"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingImageId(null)}
                                            className="px-6 py-2.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
