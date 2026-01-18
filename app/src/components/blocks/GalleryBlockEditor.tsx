import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload, X, GripVertical, Pencil, Music,
    ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward,
    Volume2, VolumeX, Settings, Clock
} from 'lucide-react';
import type { GalleryBlockData } from '../../types';

interface GalleryImage {
    id: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
    timestamp?: number;
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
    const [isTimelineMode, setIsTimelineMode] = useState(data.timelineMode || false);
    const [showSettings, setShowSettings] = useState(false);

    // Preview state
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFading, setIsFading] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Ensure images array exists with proper structure
    const images: GalleryImage[] = (data.images || []).map((img, idx) => ({
        id: (img as GalleryImage).id || `img_legacy_${idx}`,
        url: img.url,
        alt: img.alt || { [language]: '' },
        caption: img.caption || { [language]: '' },
        credit: img.credit,
        timestamp: img.timestamp
    }));

    const crossfadeDuration = data.crossfadeDuration || 500;

    // Auto-advance effect for timeline mode
    useEffect(() => {
        if (!isTimelineMode || !isPlaying || images.length === 0) return;

        const sortedImages = [...images].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

        // Find the current image based on audio time
        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if ((sortedImages[i].timestamp || 0) <= currentTime) {
                const newIndex = images.findIndex(img => img.id === sortedImages[i].id);
                if (newIndex !== previewIndex) {
                    triggerCrossfade(newIndex);
                }
                break;
            }
        }
    }, [currentTime, isTimelineMode, isPlaying, images, previewIndex]);

    // Crossfade transition
    const triggerCrossfade = useCallback((newIndex: number) => {
        setIsFading(true);
        setTimeout(() => {
            setPreviewIndex(newIndex);
            setTimeout(() => setIsFading(false), crossfadeDuration / 2);
        }, crossfadeDuration / 2);
    }, [crossfadeDuration]);

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

        // Read all files and collect them before updating state
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
                        credit: { [language]: '' },
                        timestamp: isTimelineMode ? 0 : undefined
                    });
                };
                reader.readAsDataURL(file);
            });
        });

        // Once all files are read, add them all at once
        Promise.all(readPromises).then(newImages => {
            onChange({
                ...data,
                images: [...(data.images || []), ...newImages]
            });
        });
    }

    function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const audioUrl = event.target?.result as string;
                const audio = new Audio(audioUrl);
                audio.onloadedmetadata = () => {
                    onChange({
                        ...data,
                        timelineMode: true,
                        audioUrl,
                        audioDuration: audio.duration
                    });
                };
            };
            reader.readAsDataURL(file);
        }
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

    function toggleTimelineMode() {
        const newMode = !isTimelineMode;
        setIsTimelineMode(newMode);
        onChange({
            ...data,
            timelineMode: newMode,
            images: images.map(img => ({
                ...img,
                timestamp: newMode ? img.timestamp || 0 : undefined
            }))
        });
    }

    // Navigation controls
    function goToPrevious() {
        if (images.length === 0) return;
        triggerCrossfade(previewIndex === 0 ? images.length - 1 : previewIndex - 1);
    }

    function goToNext() {
        if (images.length === 0) return;
        triggerCrossfade(previewIndex === images.length - 1 ? 0 : previewIndex + 1);
    }

    // Audio controls
    function togglePlayback() {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }

    function handleTimeUpdate() {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    }

    function handleSeek(e: React.MouseEvent<HTMLDivElement>) {
        if (!audioRef.current || !data.audioDuration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const position = (e.clientX - rect.left) / rect.width;
        audioRef.current.currentTime = position * data.audioDuration;
    }

    function toggleMute() {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }

    function skipBackward() {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
        }
    }

    function skipForward() {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(data.audioDuration || 0, audioRef.current.currentTime + 10);
        }
    }

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const currentImage = images[previewIndex];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Layout selector */}
                {!isTimelineMode && (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Layout</span>
                        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border-default)]">
                            {(['carousel', 'grid', 'masonry'] as const).map((layout) => (
                                <button
                                    key={layout}
                                    type="button"
                                    onClick={() => handleLayoutChange(layout)}
                                    className={`px-4 py-2 text-sm font-medium transition-all ${data.layout === layout
                                        ? 'bg-[var(--color-accent-primary)] text-white'
                                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                        }`}
                                >
                                    {layout.charAt(0).toUpperCase() + layout.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid columns */}
                {!isTimelineMode && data.layout === 'grid' && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--color-text-muted)]">Columns:</span>
                        <select
                            value={data.itemsPerRow || 3}
                            onChange={(e) => onChange({ ...data, itemsPerRow: parseInt(e.target.value) })}
                            className="px-3 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm"
                        >
                            {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                )}

                {/* Settings and Timeline toggle */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg border transition-colors ${showSettings
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                            : 'border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Timeline</span>
                        <div
                            onClick={toggleTimelineMode}
                            className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${isTimelineMode
                                ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500'
                                : 'bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg transition-transform ${isTimelineMode ? 'translate-x-7' : 'translate-x-1'
                                }`} />
                        </div>
                    </label>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)] space-y-4">
                    <h4 className="font-medium text-[var(--color-text-primary)]">Gallery Settings</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                                Crossfade Duration
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min={100}
                                    max={2000}
                                    step={100}
                                    value={crossfadeDuration}
                                    onChange={(e) => onChange({ ...data, crossfadeDuration: parseInt(e.target.value) })}
                                    className="flex-1"
                                />
                                <span className="text-sm text-[var(--color-text-muted)] min-w-[50px]">{crossfadeDuration}ms</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                                Auto-Advance
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.autoAdvance || false}
                                    onChange={(e) => onChange({ ...data, autoAdvance: e.target.checked })}
                                    className="w-4 h-4 rounded"
                                />
                                {data.autoAdvance && (
                                    <input
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={data.autoAdvanceInterval || 5}
                                        onChange={(e) => onChange({ ...data, autoAdvanceInterval: parseInt(e.target.value) })}
                                        className="w-16 px-2 py-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded text-sm"
                                    />
                                )}
                                {data.autoAdvance && <span className="text-sm text-[var(--color-text-muted)]">sec</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Mode: Audio Section */}
            {isTimelineMode && (
                <div className="bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] rounded-2xl p-5 border border-[var(--color-border-default)] space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                        <Music className="w-4 h-4" />
                        Audio Narration
                    </div>

                    {data.audioUrl ? (
                        <div className="space-y-4">
                            <audio
                                ref={audioRef}
                                src={data.audioUrl}
                                onTimeUpdate={handleTimeUpdate}
                                onEnded={() => setIsPlaying(false)}
                                className="hidden"
                            />

                            {/* Custom Audio Player */}
                            <div className="bg-[var(--color-bg-surface)] rounded-xl p-4 space-y-3">
                                {/* Progress bar with markers */}
                                <div className="relative">
                                    <div
                                        className="h-2 bg-[var(--color-bg-hover)] rounded-full cursor-pointer overflow-hidden"
                                        onClick={handleSeek}
                                    >
                                        <div
                                            className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 rounded-full transition-all"
                                            style={{ width: `${(currentTime / (data.audioDuration || 1)) * 100}%` }}
                                        />
                                    </div>

                                    {/* Timeline markers */}
                                    <div className="relative h-4 mt-1">
                                        {images.map((img) => (
                                            <div
                                                key={img.id}
                                                className="absolute top-0 cursor-pointer group"
                                                style={{ left: `${((img.timestamp || 0) / (data.audioDuration || 1)) * 100}%` }}
                                            >
                                                <div className="w-3 h-3 -ml-1.5 rounded-full bg-yellow-400 border-2 border-white shadow-lg transform group-hover:scale-125 transition-transform" />
                                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    <span className="px-2 py-1 bg-black/80 text-white text-xs rounded">
                                                        {formatTime(img.timestamp || 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[var(--color-text-muted)] font-mono">
                                        {formatTime(currentTime)}
                                    </span>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={skipBackward}
                                            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                        >
                                            <SkipBack className="w-5 h-5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={togglePlayback}
                                            className="p-4 rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={skipForward}
                                            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                        >
                                            <SkipForward className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={toggleMute}
                                            className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                        >
                                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                        <span className="text-sm text-[var(--color-text-muted)] font-mono">
                                            {formatTime(data.audioDuration || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => onChange({ ...data, audioUrl: undefined, audioDuration: undefined })}
                                className="text-xs text-red-400 hover:text-red-300"
                            >
                                Remove audio
                            </button>
                        </div>
                    ) : (
                        <label className="flex items-center justify-center gap-3 px-6 py-4 bg-[var(--color-bg-surface)] border-2 border-dashed border-[var(--color-border-default)] rounded-xl cursor-pointer hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/5 transition-all group">
                            <div className="p-3 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] group-hover:bg-[var(--color-accent-primary)]/20 transition-colors">
                                <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-sm text-[var(--color-text-secondary)]">Upload audio file for timeline</span>
                            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                        </label>
                    )}
                </div>
            )}

            {/* Gallery Preview with Navigation */}
            {images.length > 0 && (
                <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                    {/* Main Image Display */}
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

                        {/* Navigation Controls - Material Design */}
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

                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium">
                            {previewIndex + 1} / {images.length}
                        </div>

                        {/* Timeline Timestamp Badge */}
                        {isTimelineMode && currentImage?.timestamp !== undefined && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-yellow-500 text-black text-sm font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(currentImage.timestamp)}
                            </div>
                        )}
                    </div>

                    {/* Caption and Credit */}
                    <div className="p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
                        {currentImage && (
                            <div className="space-y-1">
                                <p className="text-[var(--color-text-primary)] font-medium">
                                    {currentImage.caption[language] || currentImage.caption.en || 'No caption'}
                                </p>
                                {currentImage.credit?.[language] && (
                                    <p className="text-sm text-[var(--color-text-muted)] italic">
                                        Credit: {currentImage.credit[language]}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Thumbnail Navigation */}
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={img.id}
                                    type="button"
                                    onClick={() => triggerCrossfade(index)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${index === previewIndex
                                        ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
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
                    Drag and drop images here
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">or</p>
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
                <p className="text-xs text-[var(--color-text-muted)] mt-4">
                    JPG, PNG, WebP, GIF • Max 10MB per image
                </p>
            </div>

            {/* Image Grid Editor */}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((img, index) => (
                            <div
                                key={img.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                className={`group relative bg-[var(--color-bg-elevated)] rounded-xl overflow-hidden cursor-move border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50 transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''
                                    }`}
                            >
                                <div className="aspect-square">
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </div>

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setEditingImageId(img.id)}
                                            className="p-2 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(img.id)}
                                            className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Drag handle */}
                                <div className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                {/* Status indicators */}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    {img.caption[language] && (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                            ✓
                                        </div>
                                    )}
                                    {isTimelineMode && img.timestamp !== undefined && (
                                        <div className="px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold shadow-lg">
                                            {formatTime(img.timestamp)}
                                        </div>
                                    )}
                                </div>
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
                                                All fields are required for accessibility
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alt text */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Alt Text <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={img.alt[language] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                alt: { ...img.alt, [language]: e.target.value }
                                            })}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                            placeholder="Describe the image for accessibility..."
                                        />
                                    </div>

                                    {/* Caption */}
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                            Caption <span className="text-red-400">*</span>
                                        </label>
                                        <textarea
                                            value={img.caption[language] || ''}
                                            onChange={(e) => handleUpdateImage(img.id, {
                                                caption: { ...img.caption, [language]: e.target.value }
                                            })}
                                            rows={2}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20 resize-none"
                                            placeholder="Describe what this image shows..."
                                        />
                                    </div>

                                    {/* Credit */}
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
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
                                            placeholder="© Photographer Name, Museum Collection..."
                                        />
                                    </div>

                                    {/* Timeline timestamp */}
                                    {isTimelineMode && (
                                        <div>
                                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                                Show at time: <span className="text-[var(--color-accent-primary)]">{formatTime(img.timestamp || 0)}</span>
                                            </label>
                                            <div className="relative">
                                                <div className="h-2 bg-[var(--color-bg-hover)] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500"
                                                        style={{ width: `${((img.timestamp || 0) / (data.audioDuration || 1)) * 100}%` }}
                                                    />
                                                </div>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={data.audioDuration || 0}
                                                    step={0.1}
                                                    value={img.timestamp || 0}
                                                    onChange={(e) => handleUpdateImage(img.id, { timestamp: parseFloat(e.target.value) })}
                                                    className="absolute inset-0 w-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)]">
                                                <span>0:00</span>
                                                <span>{formatTime(data.audioDuration || 0)}</span>
                                            </div>
                                        </div>
                                    )}

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
