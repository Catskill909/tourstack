import { useState, useRef, useEffect } from 'react';
import {
    Upload, X, GripVertical, Pencil, Music,
    Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Clock
} from 'lucide-react';
import type { TimelineGalleryBlockData } from '../../types';

interface TimelineGalleryImage {
    id: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
    timestamp: number;
}

interface TimelineGalleryBlockEditorProps {
    data: TimelineGalleryBlockData;
    language: string;
    onChange: (data: TimelineGalleryBlockData) => void;
}

function generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function TimelineGalleryBlockEditor({ data, language, onChange }: TimelineGalleryBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [editingImageId, setEditingImageId] = useState<string | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    // Audio state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const crossfadeDuration = data.crossfadeDuration || 500;

    // Ensure images array exists with proper structure
    const images: TimelineGalleryImage[] = (data.images || []).map((img, idx) => ({
        id: img.id || `img_legacy_${idx}`,
        url: img.url,
        alt: img.alt || { [language]: '' },
        caption: img.caption || { [language]: '' },
        credit: img.credit,
        timestamp: img.timestamp || 0
    }));

    // Sort images by timestamp for display
    const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp);

    // Auto-advance based on audio time
    useEffect(() => {
        if (!isPlaying || sortedImages.length === 0) return;

        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if (sortedImages[i].timestamp <= currentTime) {
                const newIndex = images.findIndex(img => img.id === sortedImages[i].id);
                if (newIndex !== previewIndex) {
                    triggerCrossfade(newIndex);
                }
                break;
            }
        }
    }, [currentTime, isPlaying, sortedImages.length]);

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

        const readPromises = validFiles.map(file => {
            return new Promise<TimelineGalleryImage>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const url = event.target?.result as string;
                    resolve({
                        id: generateId(),
                        url,
                        alt: { [language]: file.name.replace(/\.[^/.]+$/, '') },
                        caption: { [language]: '' },
                        credit: { [language]: '' },
                        timestamp: data.audioDuration || 0
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

    function handleUpdateImage(id: string, updates: Partial<TimelineGalleryImage>) {
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

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const currentImage = images[previewIndex];

    return (
        <div className="space-y-6">
            {/* Audio Upload Section */}
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
                                            style={{ left: `${(img.timestamp / (data.audioDuration || 1)) * 100}%` }}
                                        >
                                            <div className="w-3 h-3 -ml-1.5 rounded-full bg-yellow-400 border-2 border-white shadow-lg transform group-hover:scale-125 transition-transform" />
                                            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                                <span className="px-2 py-1 bg-black/80 text-white text-xs rounded">
                                                    {formatTime(img.timestamp)}
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
                                        onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
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
                                        onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(data.audioDuration || 0, currentTime + 10); }}
                                        className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                    >
                                        <SkipForward className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { if (audioRef.current) { audioRef.current.muted = !isMuted; setIsMuted(!isMuted); } }}
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
                            onClick={() => onChange({ ...data, audioUrl: '', audioDuration: 0 })}
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
                        <span className="text-sm text-[var(--color-text-secondary)]">Upload audio narration (MP3, WAV)</span>
                        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                    </label>
                )}
            </div>

            {/* Current Image Preview with Crossfade */}
            {images.length > 0 && (
                <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                    <div className="relative aspect-[4/3] bg-black">
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

                        {/* Timestamp Badge */}
                        {currentImage && (
                            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-yellow-500 text-black text-sm font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(currentImage.timestamp)}
                            </div>
                        )}

                        {/* Image Counter */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium">
                            {previewIndex + 1} / {images.length}
                        </div>
                    </div>

                    {/* Caption/Credit */}
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
                    Add images to your timeline
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">Drag and drop or click below</p>
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

            {/* Image List with Timestamp Controls */}
            {images.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-[var(--color-text-primary)]">
                            Timeline Images ({images.length})
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                            Set when each image appears
                        </span>
                    </div>
                    <div className="space-y-2">
                        {sortedImages.map((img) => (
                            <div
                                key={img.id}
                                draggable
                                onDragStart={() => handleDragStart(images.indexOf(img))}
                                onDragOver={(e) => handleDragOver(e, images.indexOf(img))}
                                onDragEnd={handleDragEnd}
                                className="flex items-center gap-4 p-3 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50 transition-all"
                            >
                                <div className="cursor-grab text-[var(--color-text-muted)]">
                                    <GripVertical className="w-4 h-4" />
                                </div>

                                <img src={img.url} alt="" className="w-16 h-16 rounded-lg object-cover" />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                        {img.caption[language] || 'No caption'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-[var(--color-text-muted)]">Appears at:</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                min={0}
                                                max={data.audioDuration || 0}
                                                step={1}
                                                value={Math.floor(img.timestamp / 60)}
                                                onChange={(e) => {
                                                    const mins = parseInt(e.target.value) || 0;
                                                    const secs = img.timestamp % 60;
                                                    handleUpdateImage(img.id, { timestamp: mins * 60 + secs });
                                                }}
                                                className="w-12 px-2 py-1 text-center bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded text-sm"
                                            />
                                            <span className="text-sm">:</span>
                                            <input
                                                type="number"
                                                min={0}
                                                max={59}
                                                step={1}
                                                value={Math.floor(img.timestamp % 60)}
                                                onChange={(e) => {
                                                    const mins = Math.floor(img.timestamp / 60);
                                                    const secs = parseInt(e.target.value) || 0;
                                                    handleUpdateImage(img.id, { timestamp: mins * 60 + secs });
                                                }}
                                                className="w-12 px-2 py-1 text-center bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setEditingImageId(img.id)}
                                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveImage(img.id)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--color-text-muted)] hover:text-red-500"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
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
                                            Caption
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
                                            Credit
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
