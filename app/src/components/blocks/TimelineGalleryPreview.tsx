import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Images } from 'lucide-react';
import type { TimelineGalleryBlockData } from '../../types';

interface TimelineGalleryPreviewProps {
    data: TimelineGalleryBlockData;
    language: string;
}

export function TimelineGalleryPreview({ data, language }: TimelineGalleryPreviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);

    const images = data.images || [];
    const crossfadeDuration = data.crossfadeDuration || 500;

    // Sort images by timestamp
    const sortedImages = [...images].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Auto-advance based on audio time
    useEffect(() => {
        if (!isPlaying || sortedImages.length === 0) return;

        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if (sortedImages[i].timestamp <= currentTime) {
                const newIndex = images.findIndex(img => img.id === sortedImages[i].id);
                if (newIndex !== currentIndex) {
                    triggerCrossfade(newIndex);
                }
                break;
            }
        }
    }, [currentTime, isPlaying, sortedImages.length]);

    if (images.length === 0) {
        return (
            <div className="bg-[var(--color-bg-hover)] rounded-lg p-8 text-center text-[var(--color-text-muted)]">
                <Images className="w-12 h-12 mx-auto mb-2" />
                <p>No images in timeline gallery</p>
            </div>
        );
    }

    if (!data.audioUrl) {
        return (
            <div className="bg-[var(--color-bg-hover)] rounded-lg p-8 text-center text-[var(--color-text-muted)]">
                <Images className="w-12 h-12 mx-auto mb-2" />
                <p>No audio narration uploaded</p>
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

    const currentImage = images[currentIndex];

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
