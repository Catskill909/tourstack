import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Images, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { GalleryBlockData } from '../../types';

interface GalleryPreviewProps {
    data: GalleryBlockData;
    language: string;
}

export function GalleryPreview({ data, language }: GalleryPreviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const images = data.images || [];
    const crossfadeDuration = data.crossfadeDuration || 500;
    const isTimelineMode = data.timelineMode && data.audioUrl;

    // Sort images by timestamp for timeline mode
    const sortedImages = isTimelineMode
        ? [...images].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        : images;

    // Auto-advance based on audio time in timeline mode
    useEffect(() => {
        if (!isTimelineMode || !isPlaying || sortedImages.length === 0) return;

        // Find the current image based on audio time
        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if ((sortedImages[i].timestamp || 0) <= currentTime) {
                const newIndex = sortedImages.findIndex(img => img === sortedImages[i]);
                if (newIndex !== currentIndex) {
                    triggerCrossfade(newIndex);
                }
                break;
            }
        }
    }, [currentTime, isTimelineMode, isPlaying, sortedImages.length]);

    if (images.length === 0) {
        return (
            <div className="bg-[var(--color-bg-hover)] rounded-lg p-8 text-center text-[var(--color-text-muted)]">
                <Images className="w-12 h-12 mx-auto mb-2" />
                <p>No images in gallery</p>
            </div>
        );
    }

    function triggerCrossfade(newIndex: number) {
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setTimeout(() => setIsFading(false), crossfadeDuration / 2);
        }, crossfadeDuration / 2);
    }

    function goToPrevious() {
        triggerCrossfade(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    }

    function goToNext() {
        triggerCrossfade(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
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

    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const displayImages = isTimelineMode ? sortedImages : images;
    const currentImage = displayImages[currentIndex];

    // TIMELINE MODE - Image above audio player, no controls, auto-crossfade
    if (isTimelineMode) {
        return (
            <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                {/* Hidden Audio Element */}
                <audio
                    ref={audioRef}
                    src={data.audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />

                {/* Main Image with Crossfade */}
                <div className="relative aspect-[4/3] bg-black">
                    <div
                        className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                    >
                        {currentImage && (
                            <img
                                src={currentImage.url}
                                alt={currentImage.alt[language] || currentImage.alt.en || ''}
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>
                </div>

                {/* Caption and Credit */}
                <div className="p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
                    {currentImage && (
                        <div className="space-y-1">
                            <p className="text-[var(--color-text-primary)] font-medium">
                                {currentImage.caption?.[language] || currentImage.caption?.en || ''}
                            </p>
                            {currentImage.credit?.[language] && (
                                <p className="text-sm text-[var(--color-text-muted)] italic">
                                    {currentImage.credit[language]}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Custom Audio Player */}
                <div className="p-4 bg-[var(--color-bg-surface)]">
                    {/* Progress bar */}
                    <div
                        className="h-2 bg-[var(--color-bg-hover)] rounded-full cursor-pointer overflow-hidden mb-4"
                        onClick={handleSeek}
                    >
                        <div
                            className="h-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 rounded-full transition-all"
                            style={{ width: `${(currentTime / (data.audioDuration || 1)) * 100}%` }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--color-text-muted)] font-mono w-12">
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
                            <span className="text-sm text-[var(--color-text-muted)] font-mono w-12 text-right">
                                {formatTime(data.audioDuration || 0)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CAROUSEL layout - beautiful slideshow with prev/next
    if (data.layout === 'carousel') {
        return (
            <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                {/* Main Image */}
                <div className="relative aspect-[16/10] bg-black">
                    <div
                        className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                    >
                        {currentImage && (
                            <img
                                src={currentImage.url}
                                alt={currentImage.alt[language] || currentImage.alt.en || ''}
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
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Caption and Credit */}
                <div className="p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
                    {currentImage && (
                        <div className="space-y-1">
                            <p className="text-[var(--color-text-primary)] font-medium">
                                {currentImage.caption?.[language] || currentImage.caption?.en || ''}
                            </p>
                            {currentImage.credit?.[language] && (
                                <p className="text-sm text-[var(--color-text-muted)] italic">
                                    Credit: {currentImage.credit[language]}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Thumbnail Navigation */}
                    {images.length > 1 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => triggerCrossfade(index)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${index === currentIndex
                                        ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Masonry layout
    if (data.layout === 'masonry') {
        return (
            <div className="columns-2 md:columns-3 gap-4">
                {images.map((img, idx) => (
                    <figure key={idx} className="break-inside-avoid mb-4">
                        <img
                            src={img.url}
                            alt={img.alt[language] || img.alt.en || ''}
                            className="rounded-xl w-full object-cover shadow-lg"
                        />
                        {img.caption && (
                            <figcaption className="text-sm text-[var(--color-text-secondary)] mt-2">
                                {img.caption[language] || img.caption.en}
                            </figcaption>
                        )}
                        {img.credit?.[language] && (
                            <p className="text-xs text-[var(--color-text-muted)] italic mt-1">
                                {img.credit[language]}
                            </p>
                        )}
                    </figure>
                ))}
            </div>
        );
    }

    // Grid layout
    const cols = data.itemsPerRow || 3;
    return (
        <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
            {images.map((img, idx) => (
                <figure key={idx}>
                    <img
                        src={img.url}
                        alt={img.alt[language] || img.alt.en || ''}
                        className="rounded-xl w-full aspect-square object-cover shadow-lg"
                    />
                    {img.caption && (
                        <figcaption className="text-sm text-[var(--color-text-secondary)] mt-2">
                            {img.caption[language] || img.caption.en}
                        </figcaption>
                    )}
                    {img.credit?.[language] && (
                        <p className="text-xs text-[var(--color-text-muted)] italic mt-1">
                            {img.credit[language]}
                        </p>
                    )}
                </figure>
            ))}
        </div>
    );
}
