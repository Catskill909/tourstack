import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, RectangleHorizontal, Square, RectangleVertical, Maximize, Crosshair, MapPin } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { TranslationProvider } from '../../services/translationService';
import type { ImageBlockData, Stop } from '../../types';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import { ImageHotspotEditor } from './ImageHotspotEditor';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';

interface ImageBlockEditorProps {
    data: ImageBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    allStops?: Stop[];
    onSave?: (shouldClose: boolean) => void;
    onChange: (data: ImageBlockData) => void;
}

export function ImageBlockEditor({ data, language, availableLanguages = ['en'], translationProvider = 'libretranslate', allStops, onSave, onChange }: ImageBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [showHotspotEditor, setShowHotspotEditor] = useState(false);
    const [isDraggingFocalPoint, setIsDraggingFocalPoint] = useState(false);
    const [activeLanguage, setActiveLanguage] = useState(language);
    const imageRef = useRef<HTMLDivElement>(null);

    // Sync activeLanguage when prop changes
    useEffect(() => {
        setActiveLanguage(language);
    }, [language]);

    const isCropped = data.size !== 'full';

    const handleFocalPointInteraction = useCallback((e: React.MouseEvent) => {
        if (!imageRef.current || !isCropped) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        onChange({ ...data, focalPoint: { x: Math.round(x), y: Math.round(y) } });
    }, [data, isCropped, onChange]);

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

    // Translation helpers
    const primaryLang = availableLanguages.find(l => data.caption?.[l]?.trim()) || availableLanguages[0] || 'en';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    function handleCaptionTranslations(translations: { [lang: string]: string }) {
        onChange({ ...data, caption: { ...data.caption, ...translations } });
    }

    function handleCreditTranslations(translations: { [lang: string]: string }) {
        onChange({ ...data, credit: { ...data.credit, ...translations } });
    }

    function handleAltTextTranslations(translations: { [lang: string]: string }) {
        onChange({ ...data, altText: { ...data.altText, ...translations } });
    }

    return (
        <div className="space-y-4">
            {/* Block Metadata (Title & Image) */}
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={activeLanguage}
                availableLanguages={availableLanguages}
                translationProvider={translationProvider}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {/* Language Controls */}
            {availableLanguages.length > 1 && (
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-[var(--color-border-default)]">
                    <div className="flex-1 min-w-0">
                        <LanguageSwitcher
                            availableLanguages={availableLanguages}
                            activeLanguage={activeLanguage}
                            onChange={setActiveLanguage}
                            contentMap={data.caption || {}}
                            size="sm"
                            showStatus={true}
                        />
                    </div>
                </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-2 gap-6">
                {/* LEFT COLUMN: Image + Focal Point */}
                <div className="space-y-4">
                    {/* Image upload/preview */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Image
                        </label>
                        {data.url ? (
                            <div className="relative">
                                {/* Source image with focal point picker */}
                                <div
                                    ref={imageRef}
                                    className={`relative ${isCropped ? 'cursor-crosshair' : ''}`}
                                    onMouseDown={(e) => {
                                        if (!isCropped) return;
                                        setIsDraggingFocalPoint(true);
                                        handleFocalPointInteraction(e);
                                    }}
                                    onMouseMove={(e) => {
                                        if (isDraggingFocalPoint) handleFocalPointInteraction(e);
                                    }}
                                    onMouseUp={() => setIsDraggingFocalPoint(false)}
                                    onMouseLeave={() => setIsDraggingFocalPoint(false)}
                                >
                                    <img src={data.url} alt="Preview" className="w-full max-h-72 object-contain rounded-lg select-none" draggable={false} />
                                    {/* Focal point crosshair — always visible when cropped */}
                                    {isCropped && (
                                        <div
                                            className="absolute pointer-events-none"
                                            style={{
                                                left: `${data.focalPoint?.x ?? 50}%`,
                                                top: `${data.focalPoint?.y ?? 50}%`,
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <div className="relative">
                                                <Crosshair className="w-7 h-7 text-white drop-shadow-[0_0_4px_rgba(0,0,0,0.9)]" />
                                                <div className="absolute inset-0 rounded-full ring-2 ring-white/30 scale-[2]" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {isCropped && (
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        <Crosshair className="w-3 h-3 inline mr-1" />
                                        Drag crosshair to set focal point
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
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

                    {/* Crop preview */}
                    {data.url && isCropped && (
                        <div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Crop preview</p>
                            <div className={`overflow-hidden rounded-lg border border-[var(--color-border-default)] max-w-[200px] ${
                                data.size === 'small' ? 'aspect-[16/9]' :
                                data.size === 'medium' ? 'aspect-square' :
                                'aspect-[3/4]'
                            }`}>
                                <img
                                    src={data.url}
                                    alt="Crop preview"
                                    className="w-full h-full object-cover"
                                    style={{ objectPosition: `${data.focalPoint?.x ?? 50}% ${data.focalPoint?.y ?? 50}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Format
                        </label>
                        <div className="flex gap-2">
                            {([
                                { size: 'small' as const, label: 'Landscape', icon: RectangleHorizontal, ratio: '16:9' as const },
                                { size: 'medium' as const, label: 'Square', icon: Square, ratio: '1:1' as const },
                                { size: 'large' as const, label: 'Portrait', icon: RectangleVertical, ratio: '3:4' as const },
                                { size: 'full' as const, label: 'Full', icon: Maximize, ratio: 'auto' as const },
                            ]).map(({ size, label, icon: Icon, ratio }) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => onChange({ ...data, size, aspectRatio: ratio })}
                                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors ${data.size === size
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Text fields + Hotspots */}
                <div className="space-y-4">
                    {/* Caption */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Caption ({activeLanguage.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                            </label>
                            {availableLanguages.length > 1 && (
                                <MagicTranslateButton
                                    sourceText={data.caption?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={handleCaptionTranslations}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!data.caption?.[primaryLang]?.trim()}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={data.caption?.[activeLanguage] || ''}
                            onChange={(e) => onChange({
                                ...data,
                                caption: { ...data.caption, [activeLanguage]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Image caption..."
                        />
                    </div>

                    {/* Credit */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Credit ({activeLanguage.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                            </label>
                            {availableLanguages.length > 1 && (
                                <MagicTranslateButton
                                    sourceText={data.credit?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={handleCreditTranslations}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!data.credit?.[primaryLang]?.trim()}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={data.credit?.[activeLanguage] || ''}
                            onChange={(e) => onChange({
                                ...data,
                                credit: { ...data.credit, [activeLanguage]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Photo credit or attribution..."
                        />
                    </div>

                    {/* Alt Text */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Alt Text ({activeLanguage.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Accessibility</span>
                            </label>
                            {availableLanguages.length > 1 && (
                                <MagicTranslateButton
                                    sourceText={data.altText?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={handleAltTextTranslations}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!data.altText?.[primaryLang]?.trim()}
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={data.altText?.[activeLanguage] || ''}
                            onChange={(e) => onChange({
                                ...data,
                                altText: { ...data.altText, [activeLanguage]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Describe this image for screen readers..."
                        />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Describes the image for visitors using screen readers</p>
                    </div>

                    {/* Hotspots */}
                    {data.url && (
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Hotspots <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowHotspotEditor(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">
                                    {data.hotspots?.length
                                        ? `Edit ${data.hotspots.length} hotspot${data.hotspots.length > 1 ? 's' : ''}`
                                        : 'Add hotspots'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Hotspot Editor Modal */}
            <AnimatePresence>
                {showHotspotEditor && (
                    <ImageHotspotEditor
                        imageUrl={data.url}
                        hotspots={data.hotspots || []}
                        language={language}
                        availableLanguages={availableLanguages}
                        translationProvider={translationProvider}
                        allStops={allStops}
                        onSave={onSave}
                        onChange={(hotspots) => onChange({ ...data, hotspots })}
                        onClose={() => setShowHotspotEditor(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
