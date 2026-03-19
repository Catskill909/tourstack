import { useState, useRef, useEffect } from 'react';
import {
    Upload, X, GripVertical, Pencil, ChevronLeft, ChevronRight,
    Image as ImageIcon, LayoutGrid, Columns,
    Maximize2, Play, Pause, SlidersHorizontal, Eye,
    Film, GalleryHorizontal, Layers, Sparkles, Loader2
} from 'lucide-react';
import { translateText, type TranslationProvider } from '../../services/translationService';
import type { GalleryBlockData, GalleryLayout } from '../../types';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import { MagicTranslateButton } from '../MagicTranslateButton';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { DeleteConfirmModal } from '../DeleteConfirmModal';

interface GalleryImage {
    id: string;
    url: string;
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
}

interface GalleryBlockEditorProps {
    data: GalleryBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    onChange: (data: GalleryBlockData) => void;
}

function generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const LAYOUT_OPTIONS: { value: GalleryLayout; label: string; icon: typeof LayoutGrid; description: string }[] = [
    { value: 'carousel', label: 'Carousel', icon: GalleryHorizontal, description: 'Image with arrows, no thumbnails' },
    { value: 'slideshow', label: 'Slideshow', icon: Play, description: 'Thumbnails, dots & auto-advance' },
    { value: 'grid', label: 'Grid', icon: LayoutGrid, description: 'Uniform grid of thumbnails' },
    { value: 'masonry', label: 'Masonry', icon: Layers, description: 'Pinterest-style flowing layout' },
    { value: 'filmstrip', label: 'Filmstrip', icon: Film, description: 'Horizontal scrolling strip' },
];

const ASPECT_RATIOS = [
    { value: '16:9', label: '16:9' },
    { value: '4:3', label: '4:3' },
    { value: '3:2', label: '3:2' },
    { value: '1:1', label: '1:1' },
    { value: 'auto', label: 'Auto' },
];

export function GalleryBlockEditor({ data, language, availableLanguages = ['en'], translationProvider = 'libretranslate', onChange }: GalleryBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isTranslatingAll, setIsTranslatingAll] = useState(false);
    const [editLang, setEditLang] = useState(language);

    // Preview state
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [isAutoPlaying, setIsAutoPlaying] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Ensure images array exists with proper structure
    const images: GalleryImage[] = (data.images || []).map((img, idx) => ({
        id: (img as GalleryImage).id || `img_legacy_${idx}`,
        url: img.url,
        caption: img.caption || { [language]: '' },
        credit: img.credit
    }));

    const crossfadeDuration = data.crossfadeDuration || 500;
    const showCaptions = data.showCaptions !== false;
    const showCredits = data.showCredits !== false;
    const showArrows = data.showArrows !== false;
    const showThumbnails = data.showThumbnails !== false;
    const showDots = data.showDots || false;
    const imageFit = data.imageFit || 'contain';
    const aspectRatio = data.aspectRatio || '16:9';
    const gap = data.gap ?? 8;
    const borderRadius = data.borderRadius ?? 12;


    // Auto-play for slideshow
    useEffect(() => {
        if (isAutoPlaying && images.length > 1) {
            autoPlayRef.current = setInterval(() => {
                setPreviewIndex(prev => (prev + 1) % images.length);
            }, (data.autoAdvanceInterval || 5) * 1000);
        }
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [isAutoPlaying, images.length, data.autoAdvanceInterval]);

    function triggerCrossfade(newIndex: number) {
        setIsFading(true);
        setTimeout(() => {
            setPreviewIndex(newIndex);
            setTimeout(() => setIsFading(false), crossfadeDuration / 2);
        }, crossfadeDuration / 2);
    }

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

        const readPromises = validFiles.map(file => {
            return new Promise<GalleryImage>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const url = event.target?.result as string;
                    resolve({
                        id: generateId(),
                        url,
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

    // Translate all captions for all images at once
    async function handleTranslateAllCaptions() {
        const primaryLang = availableLanguages[0] || 'en';
        const otherLangs = availableLanguages.filter(l => l !== primaryLang);
        if (otherLangs.length === 0) return;

        setIsTranslatingAll(true);
        const updatedImages = [...images];

        for (let i = 0; i < updatedImages.length; i++) {
            const img = updatedImages[i];
            const sourceText = img.caption?.[primaryLang] || img.caption?.['en'];
            if (!sourceText?.trim()) continue;

            const newCaption = { ...img.caption };
            for (const lang of otherLangs) {
                try {
                    const translated = await translateText(sourceText, primaryLang, lang, undefined, translationProvider);
                    newCaption[lang] = translated;
                } catch (error) {
                    console.error(`Failed to translate caption for image ${i} to ${lang}:`, error);
                }
            }
            updatedImages[i] = { ...img, caption: newCaption };
        }

        onChange({ ...data, images: updatedImages });
        setIsTranslatingAll(false);
    }

    function goToPrevious() {
        triggerCrossfade(previewIndex === 0 ? images.length - 1 : previewIndex - 1);
    }

    function goToNext() {
        triggerCrossfade(previewIndex === images.length - 1 ? 0 : previewIndex + 1);
    }

    const currentImage = images[previewIndex];

    // Helper for aspect ratio CSS
    function getAspectClass() {
        switch (aspectRatio) {
            case '16:9': return 'aspect-video';
            case '4:3': return 'aspect-[4/3]';
            case '3:2': return 'aspect-[3/2]';
            case '1:1': return 'aspect-square';
            default: return 'aspect-video';
        }
    }

    // Determine which settings are relevant per layout
    const layoutSupports = {
        arrows: ['carousel', 'slideshow'].includes(data.layout),
        thumbnails: data.layout === 'slideshow',
        dots: ['carousel', 'slideshow'].includes(data.layout),
        autoAdvance: ['carousel', 'slideshow'].includes(data.layout),
        itemsPerRow: ['grid'].includes(data.layout),
        crossfade: ['carousel', 'slideshow'].includes(data.layout),
        imageFit: true,
        aspectRatio: ['carousel', 'slideshow', 'grid', 'filmstrip'].includes(data.layout),
        gap: ['grid', 'masonry', 'filmstrip'].includes(data.layout),
    };

    return (
        <div className="flex gap-6 min-h-0">
            {/* LEFT COLUMN — Settings & Controls */}
            <div className="w-80 shrink-0 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 scrollbar-thin">
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

                {/* Layout Selection */}
                <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 border border-[var(--color-border-default)]">
                    <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3">
                        Layout Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {LAYOUT_OPTIONS.map(({ value, label, icon: LIcon, description }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => onChange({ ...data, layout: value })}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${data.layout === value
                                    ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)] shadow-lg shadow-[var(--color-accent-primary)]/20'
                                    : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                    }`}
                                title={description}
                            >
                                <LIcon className="w-5 h-5" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Display Settings */}
                <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 border border-[var(--color-border-default)] space-y-4">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[var(--color-accent-primary)]" />
                        <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Display Settings
                        </label>
                    </div>

                    {/* Aspect Ratio */}
                    {layoutSupports.aspectRatio && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                                Aspect Ratio
                            </label>
                            <div className="flex gap-1.5">
                                {ASPECT_RATIOS.map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => onChange({ ...data, aspectRatio: value as GalleryBlockData['aspectRatio'] })}
                                        className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${aspectRatio === value
                                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Image Fit */}
                    {layoutSupports.imageFit && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                                Image Fit
                            </label>
                            <div className="flex gap-2">
                                {([
                                    { value: 'contain', label: 'Contain', icon: Maximize2 },
                                    { value: 'cover', label: 'Cover', icon: ImageIcon },
                                ] as const).map(({ value, label, icon: FIcon }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => onChange({ ...data, imageFit: value })}
                                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${imageFit === value
                                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                            }`}
                                    >
                                        <FIcon className="w-3.5 h-3.5" />
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Items per Row */}
                    {layoutSupports.itemsPerRow && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                                Items per Row
                            </label>
                            <div className="flex gap-1.5">
                                {[2, 3, 4, 5, 6].map((cols) => (
                                    <button
                                        key={cols}
                                        type="button"
                                        onClick={() => onChange({ ...data, itemsPerRow: cols })}
                                        className={`flex-1 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${(data.itemsPerRow || 3) === cols
                                            ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                            }`}
                                    >
                                        {cols}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Gap */}
                    {layoutSupports.gap && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                                Spacing: {gap}px
                            </label>
                            <input
                                type="range"
                                min={0}
                                max={24}
                                step={2}
                                value={gap}
                                onChange={(e) => onChange({ ...data, gap: parseInt(e.target.value) })}
                                className="w-full accent-[var(--color-accent-primary)]"
                            />
                        </div>
                    )}

                    {/* Border Radius */}
                    <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                            Corner Radius: {borderRadius}px
                        </label>
                        <input
                            type="range"
                            min={0}
                            max={24}
                            step={2}
                            value={borderRadius}
                            onChange={(e) => onChange({ ...data, borderRadius: parseInt(e.target.value) })}
                            className="w-full accent-[var(--color-accent-primary)]"
                        />
                    </div>

                    {/* Crossfade Duration */}
                    {layoutSupports.crossfade && (
                        <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                                Transition: {crossfadeDuration}ms
                            </label>
                            <input
                                type="range"
                                min={100}
                                max={1500}
                                step={100}
                                value={crossfadeDuration}
                                onChange={(e) => onChange({ ...data, crossfadeDuration: parseInt(e.target.value) })}
                                className="w-full accent-[var(--color-accent-primary)]"
                            />
                        </div>
                    )}
                </div>

                {/* Navigation & Behavior */}
                {(layoutSupports.arrows || layoutSupports.dots || layoutSupports.autoAdvance) && (
                    <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 border border-[var(--color-border-default)] space-y-3">
                        <div className="flex items-center gap-2">
                            <Columns className="w-4 h-4 text-[var(--color-accent-primary)]" />
                            <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                                Navigation & Behavior
                            </label>
                        </div>

                        {layoutSupports.arrows && (
                            <ToggleRow
                                label="Show Arrows"
                                checked={showArrows}
                                onChange={(v) => onChange({ ...data, showArrows: v })}
                            />
                        )}

                        {layoutSupports.thumbnails && (
                            <ToggleRow
                                label="Show Thumbnails"
                                checked={showThumbnails}
                                onChange={(v) => onChange({ ...data, showThumbnails: v })}
                            />
                        )}

                        {layoutSupports.dots && (
                            <ToggleRow
                                label="Show Dots"
                                checked={showDots}
                                onChange={(v) => onChange({ ...data, showDots: v })}
                            />
                        )}

                        {layoutSupports.autoAdvance && (
                            <>
                                <ToggleRow
                                    label="Auto-Advance"
                                    checked={data.autoAdvance || false}
                                    onChange={(v) => onChange({ ...data, autoAdvance: v })}
                                />
                                {data.autoAdvance && (
                                    <div className="pl-4">
                                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">
                                            Interval: {data.autoAdvanceInterval || 5}s
                                        </label>
                                        <input
                                            type="range"
                                            min={2}
                                            max={15}
                                            step={1}
                                            value={data.autoAdvanceInterval || 5}
                                            onChange={(e) => onChange({ ...data, autoAdvanceInterval: parseInt(e.target.value) })}
                                            className="w-full accent-[var(--color-accent-primary)]"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                    </div>
                )}

                {/* Caption & Credit Toggles */}
                <div className="bg-[var(--color-bg-elevated)] rounded-2xl p-4 border border-[var(--color-border-default)] space-y-3">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--color-accent-primary)]" />
                        <label className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Captions & Credits
                        </label>
                    </div>

                    <ToggleRow
                        label="Show Captions"
                        checked={showCaptions}
                        onChange={(v) => onChange({ ...data, showCaptions: v })}
                    />
                    <ToggleRow
                        label="Show Credits"
                        checked={showCredits}
                        onChange={(v) => onChange({ ...data, showCredits: v })}
                    />
                </div>
            </div>

            {/* RIGHT COLUMN — Preview & Image Management */}
            <div className="flex-1 min-w-0 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-thin">
                {/* Live Preview */}
                {images.length > 0 && (data.layout === 'carousel' || data.layout === 'slideshow') && (
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border-default)]">
                            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Live Preview</span>
                            {data.layout === 'slideshow' && (
                                <button
                                    type="button"
                                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${isAutoPlaying
                                        ? 'bg-[var(--color-accent-primary)] text-white'
                                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                        }`}
                                >
                                    {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                    {isAutoPlaying ? 'Pause' : 'Play'}
                                </button>
                            )}
                        </div>
                        <div className={`relative bg-black ${getAspectClass()}`}>
                            <div
                                className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                                style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                            >
                                {currentImage && (
                                    <img
                                        src={currentImage.url}
                                        alt=""
                                        className={`w-full h-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                                    />
                                )}
                            </div>

                            {/* Navigation Arrows */}
                            {showArrows && images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={goToPrevious}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={goToNext}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            {/* Image Counter */}
                            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-medium">
                                {previewIndex + 1} / {images.length}
                            </div>
                        </div>

                        {/* Dot Navigation */}
                        {showDots && images.length > 1 && (
                            <div className="flex justify-center gap-1.5 py-2 bg-[var(--color-bg-elevated)]">
                                {images.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => triggerCrossfade(index)}
                                        className={`rounded-full transition-all ${index === previewIndex
                                            ? 'w-6 h-2 bg-[var(--color-accent-primary)]'
                                            : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                            }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Caption/Credit Display */}
                        {currentImage && (showCaptions || showCredits) && (
                            <div className="p-3 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
                                {showCaptions && (
                                    <p className="text-sm text-[var(--color-text-primary)] font-medium">
                                        {currentImage.caption[language] || 'No caption'}
                                    </p>
                                )}
                                {showCredits && currentImage.credit?.[language] && (
                                    <p className="text-xs text-[var(--color-text-muted)] italic mt-0.5">
                                        Credit: {currentImage.credit[language]}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Thumbnail Navigation — slideshow only */}
                        {showThumbnails && data.layout === 'slideshow' && images.length > 1 && (
                            <div className="flex gap-1.5 p-3 overflow-x-auto bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-default)]">
                                {images.map((img, index) => (
                                    <button
                                        key={img.id}
                                        type="button"
                                        onClick={() => triggerCrossfade(index)}
                                        className={`relative flex-shrink-0 w-14 h-14 overflow-hidden transition-all ${index === previewIndex
                                            ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-1 ring-offset-[var(--color-bg-elevated)]'
                                            : 'opacity-50 hover:opacity-100'
                                            }`}
                                        style={{ borderRadius: `${Math.min(borderRadius, 8)}px` }}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Grid/Masonry/Filmstrip preview */}
                {images.length > 0 && !['carousel', 'slideshow'].includes(data.layout) && (
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                        <div className="px-4 py-2 border-b border-[var(--color-border-default)]">
                            <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Live Preview</span>
                        </div>
                        <div className="p-4">
                            {data.layout === 'filmstrip' ? (
                                <div className="flex overflow-x-auto" style={{ gap: `${gap}px` }}>
                                    {images.map((img) => (
                                        <div key={img.id} className="flex-shrink-0 w-40">
                                            <img
                                                src={img.url}
                                                alt=""
                                                className={`w-full ${getAspectClass()} ${imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                                                style={{ borderRadius: `${borderRadius}px` }}
                                            />
                                            {showCaptions && img.caption[language] && (
                                                <p className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">{img.caption[language]}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : data.layout === 'masonry' ? (
                                <div className="columns-2 md:columns-3" style={{ gap: `${gap}px` }}>
                                    {images.map((img) => (
                                        <figure key={img.id} className="break-inside-avoid" style={{ marginBottom: `${gap}px` }}>
                                            <img
                                                src={img.url}
                                                alt=""
                                                className="w-full object-cover shadow-sm"
                                                style={{ borderRadius: `${borderRadius}px` }}
                                            />
                                            {showCaptions && img.caption[language] && (
                                                <figcaption className="text-xs text-[var(--color-text-secondary)] mt-1">{img.caption[language]}</figcaption>
                                            )}
                                        </figure>
                                    ))}
                                </div>
                            ) : (
                                /* Grid */
                                <div
                                    className="grid"
                                    style={{
                                        gridTemplateColumns: `repeat(${data.itemsPerRow || 3}, 1fr)`,
                                        gap: `${gap}px`
                                    }}
                                >
                                    {images.map((img) => (
                                        <figure key={img.id}>
                                            <img
                                                src={img.url}
                                                alt=""
                                                className={`w-full ${getAspectClass()} ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} shadow-sm`}
                                                style={{ borderRadius: `${borderRadius}px` }}
                                            />
                                            {showCaptions && img.caption[language] && (
                                                <figcaption className="text-xs text-[var(--color-text-secondary)] mt-1 truncate">{img.caption[language]}</figcaption>
                                            )}
                                        </figure>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Image Upload Area */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${isDragOver
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 scale-[1.01]'
                        : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                        }`}
                >
                    <div className="p-3 rounded-full bg-[var(--color-accent-primary)]/10 inline-block mb-3">
                        <Upload className="w-6 h-6 text-[var(--color-accent-primary)]" />
                    </div>
                    <p className="text-[var(--color-text-secondary)] mb-1 font-medium text-sm">
                        {images.length === 0 ? 'Add images to your gallery' : 'Add more images'}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">Drag and drop or click below</p>
                    <label className="inline-block px-5 py-2.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white rounded-xl cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all font-medium text-sm">
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

                {/* Image Management */}
                {images.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-[var(--color-text-primary)] text-sm">
                                Gallery Images ({images.length})
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)]">
                                Drag to reorder
                            </span>
                        </div>

                        {/* Translate All Captions — language pills + magic translate */}
                        {availableLanguages.length > 1 && (
                            <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                                <div className="flex items-center gap-2 mr-1">
                                    <Sparkles className="w-4 h-4 text-[var(--color-accent-primary)]" />
                                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Captions</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={language}
                                        onChange={() => {}}
                                        contentMap={(() => {
                                            // Build a content map showing which languages have any captions
                                            const map: { [lang: string]: string } = {};
                                            for (const lang of availableLanguages) {
                                                const hasAny = images.some(img => img.caption?.[lang]?.trim());
                                                map[lang] = hasAny ? 'yes' : '';
                                            }
                                            return map;
                                        })()}
                                        size="sm"
                                        showStatus={true}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleTranslateAllCaptions}
                                    disabled={isTranslatingAll || !images.some(img => img.caption?.[availableLanguages[0]]?.trim())}
                                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isTranslatingAll
                                        ? 'bg-[var(--color-accent-primary)]/50 text-white cursor-wait'
                                        : 'bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isTranslatingAll ? (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                            Translating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Translate All
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {images.map((img, index) => (
                                <div
                                    key={img.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => triggerCrossfade(index)}
                                    className={`relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-all ${previewIndex === index
                                        ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                        : 'hover:ring-2 hover:ring-[var(--color-accent-primary)]/50 hover:ring-offset-1'
                                        }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />

                                    {/* Drag Handle — always visible */}
                                    <div className="absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white cursor-grab">
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {/* Actions — always visible for touch support */}
                                    <div className="absolute top-2 right-2 flex gap-1.5">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setEditingImageId(img.id); }}
                                            className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setDeletingImageId(img.id); }}
                                            className="p-1.5 bg-red-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Caption indicator */}
                                    {img.caption[language] && (
                                        <div className="absolute bottom-2 left-2 right-2">
                                            <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs truncate">
                                                {img.caption[language]}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Caption/Credit Editor Modal */}
            {editingImageId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditingImageId(null); setEditLang(language); }}>
                    <div
                        className="bg-[var(--color-bg-surface)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl border border-[var(--color-border-default)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const img = images.find(i => i.id === editingImageId);
                            if (!img) return null;
                            const primaryLang = availableLanguages[0] || 'en';
                            const otherLangs = availableLanguages.filter(l => l !== primaryLang);
                            return (
                                <div className="space-y-5">
                                    <div className="flex items-start gap-4">
                                        <img src={img.url} alt="" className="w-28 h-28 rounded-xl object-cover" />
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                                Edit Image Details
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">
                                                Caption and credit information
                                            </p>
                                        </div>
                                    </div>

                                    {/* Language pills + Magic Translate */}
                                    {availableLanguages.length > 1 && (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <LanguageSwitcher
                                                    availableLanguages={availableLanguages}
                                                    activeLanguage={editLang}
                                                    onChange={setEditLang}
                                                    contentMap={img.caption}
                                                    size="sm"
                                                    showStatus={true}
                                                />
                                            </div>
                                            <MagicTranslateButton
                                                sourceText={img.caption?.[primaryLang] || ''}
                                                sourceLang={primaryLang}
                                                targetLangs={otherLangs}
                                                onTranslate={(translations) => {
                                                    handleUpdateImage(img.id, {
                                                        caption: { ...img.caption, ...translations }
                                                    });
                                                }}
                                                provider={translationProvider}
                                                size="sm"
                                                disabled={!(img.caption?.[primaryLang] || '').trim()}
                                            />
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Caption <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                                        </label>
                                        <textarea
                                            value={img.caption[editLang] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                caption: { ...img.caption, [editLang]: e.target.value }
                                            })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                                            placeholder="What does this image show?"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Credit <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={img.credit?.[editLang] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                credit: { ...img.credit, [editLang]: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                            placeholder="Photo credit or attribution..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setEditingImageId(null); setEditLang(language); }}
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

            {/* Delete Image Confirmation */}
            <DeleteConfirmModal
                isOpen={deletingImageId !== null}
                title="Delete Image"
                itemName={(() => {
                    const img = images.find(i => i.id === deletingImageId);
                    return img?.caption?.[language] || `Image ${images.findIndex(i => i.id === deletingImageId) + 1}`;
                })()}
                onClose={() => setDeletingImageId(null)}
                onConfirm={() => {
                    if (deletingImageId) {
                        handleRemoveImage(deletingImageId);
                        setDeletingImageId(null);
                    }
                }}
            />
        </div>
    );
}

// Toggle switch component
function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-surface)] border border-[var(--color-border-default)]'
                    }`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}
