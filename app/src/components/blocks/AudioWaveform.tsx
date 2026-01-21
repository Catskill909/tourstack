import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus } from 'lucide-react';

interface AudioWaveformProps {
    audioUrl: string;
    duration: number;
    markers: Array<{
        id: string;
        timestamp: number;
        label?: string;
        thumbnailUrl?: string; // Thumbnail image URL
    }>;
    onMarkerMove?: (id: string, newTimestamp: number) => void;
    onMarkerClick?: (id: string) => void; // Click to edit
    onAddImage?: () => void; // Add new image
    onTimeUpdate?: (time: number) => void;
    onReady?: (duration: number) => void;
}

export interface AudioWaveformHandle {
    stop: () => void;
    pause: () => void;
}

export const AudioWaveform = forwardRef<AudioWaveformHandle, AudioWaveformProps>(function AudioWaveform({
    audioUrl,
    duration,
    markers,
    onMarkerMove,
    onMarkerClick,
    onAddImage,
    onTimeUpdate,
    onReady
}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
    const hasDraggedRef = useRef(false); // Track if actual drag happened (vs just click)

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        const wavesurfer = WaveSurfer.create({
            container: containerRef.current,
            waveColor: 'rgba(168, 85, 247, 0.4)',
            progressColor: 'rgba(168, 85, 247, 0.8)',
            cursorColor: '#a855f7',
            cursorWidth: 2,
            barWidth: 2,
            barGap: 1,
            barRadius: 2,
            height: 80,
            normalize: true,
            backend: 'WebAudio',
        });

        wavesurfer.load(audioUrl);

        wavesurfer.on('ready', () => {
            setIsReady(true);
            const audioDuration = wavesurfer.getDuration();
            onReady?.(audioDuration);
        });

        wavesurfer.on('audioprocess', () => {
            const time = wavesurfer.getCurrentTime();
            setCurrentTime(time);
            onTimeUpdate?.(time);
        });

        wavesurfer.on('seeking', () => {
            const time = wavesurfer.getCurrentTime();
            setCurrentTime(time);
            onTimeUpdate?.(time);
        });

        wavesurfer.on('play', () => setIsPlaying(true));
        wavesurfer.on('pause', () => setIsPlaying(false));
        wavesurfer.on('finish', () => setIsPlaying(false));

        wavesurferRef.current = wavesurfer;

        return () => {
            try {
                wavesurfer.destroy();
            } catch {
                // Ignore abort errors during cleanup
            }
        };
    }, [audioUrl]);

    // Expose stop/pause methods to parent via ref
    useImperativeHandle(ref, () => ({
        stop: () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.stop();
                setIsPlaying(false);
            }
        },
        pause: () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.pause();
                setIsPlaying(false);
            }
        }
    }), []);

    const togglePlayback = useCallback(() => {
        wavesurferRef.current?.playPause();
    }, []);

    const skipBackward = useCallback(() => {
        if (wavesurferRef.current) {
            const newTime = Math.max(0, wavesurferRef.current.getCurrentTime() - 10);
            wavesurferRef.current.seekTo(newTime / wavesurferRef.current.getDuration());
        }
    }, []);

    const skipForward = useCallback(() => {
        if (wavesurferRef.current) {
            const dur = wavesurferRef.current.getDuration();
            const newTime = Math.min(dur, wavesurferRef.current.getCurrentTime() + 10);
            wavesurferRef.current.seekTo(newTime / dur);
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.setMuted(!isMuted);
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle marker drag
    const handleMarkerMouseDown = (markerId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingMarkerId(markerId);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingMarkerId || !containerRef.current || !wavesurferRef.current) return;

        hasDraggedRef.current = true; // Mark that actual drag happened

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTimestamp = percentage * wavesurferRef.current.getDuration();

        onMarkerMove?.(draggingMarkerId, newTimestamp);
    }, [draggingMarkerId, onMarkerMove]);

    const handleMouseUp = useCallback(() => {
        // Small delay to let click event check hasDraggedRef
        setTimeout(() => {
            hasDraggedRef.current = false;
        }, 50);
        setDraggingMarkerId(null);
    }, []);

    // Handle touch move for tablets
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!draggingMarkerId || !containerRef.current || !wavesurferRef.current) return;
        e.preventDefault();

        const touch = e.touches[0];
        const rect = containerRef.current.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        const newTimestamp = percentage * wavesurferRef.current.getDuration();

        onMarkerMove?.(draggingMarkerId, newTimestamp);
    }, [draggingMarkerId, onMarkerMove]);

    useEffect(() => {
        if (draggingMarkerId) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleMouseUp);
            };
        }
    }, [draggingMarkerId, handleMouseMove, handleMouseUp, handleTouchMove]);

    const audioDuration = wavesurferRef.current?.getDuration() || duration || 1;

    return (
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-4 space-y-4">
            {/* Waveform Container */}
            <div className="relative">
                <div
                    ref={containerRef}
                    className="w-full rounded-lg overflow-hidden bg-[var(--color-bg-elevated)]"
                    style={{ minHeight: '80px' }}
                />

                {/* Thumbnail markers overlay */}
                {isReady && (
                    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                        {markers.map((marker) => {
                            const position = (marker.timestamp / audioDuration) * 100;
                            // Clamp position to 0-100
                            const clampedPosition = Math.max(0, Math.min(100, position));
                            const isDragging = draggingMarkerId === marker.id;
                            return (
                                <div
                                    key={marker.id}
                                    className="absolute pointer-events-auto group"
                                    style={{
                                        left: `${clampedPosition}%`,
                                        transform: 'translateX(-50%)',
                                        top: '-64px',
                                        bottom: '0'
                                    }}
                                >
                                    {/* Thumbnail image - 64px size */}
                                    <div
                                        className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shadow-lg cursor-grab active:cursor-grabbing transition-all ${isDragging
                                            ? 'border-yellow-300 scale-110 ring-2 ring-yellow-400 ring-opacity-50'
                                            : 'border-white hover:border-yellow-400 hover:scale-105'
                                            }`}
                                        onMouseDown={(e) => handleMarkerMouseDown(marker.id, e)}
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                            setDraggingMarkerId(marker.id);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Only open edit if we didn't drag
                                            if (!hasDraggedRef.current) {
                                                onMarkerClick?.(marker.id);
                                            }
                                        }}
                                    >
                                        {marker.thumbnailUrl ? (
                                            <img
                                                src={marker.thumbnailUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">?</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vertical line connecting to waveform */}
                                    <div className={`w-0.5 mx-auto transition-colors ${isDragging ? 'bg-yellow-300' : 'bg-white/50 group-hover:bg-yellow-400'}`} style={{ height: 'calc(100% - 64px)' }} />

                                    {/* Timestamp tooltip - shown when dragging */}
                                    <div className={`absolute top-[68px] left-1/2 -translate-x-1/2 whitespace-nowrap z-20 ${isDragging ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                                        <span className="px-2 py-1 bg-yellow-400 text-black text-xs font-bold rounded shadow-lg">
                                            {formatTime(marker.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add image button */}
                        {onAddImage && (
                            <button
                                type="button"
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white shadow-lg pointer-events-auto transition-colors"
                                onClick={onAddImage}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-muted)] font-mono w-16">
                    {formatTime(currentTime)}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={skipBackward}
                        className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        disabled={!isReady}
                    >
                        <SkipBack className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={togglePlayback}
                        className="p-4 rounded-full bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50"
                        disabled={!isReady}
                    >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>

                    <button
                        type="button"
                        onClick={skipForward}
                        className="p-2 rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        disabled={!isReady}
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
                    <span className="text-sm text-[var(--color-text-muted)] font-mono w-16 text-right">
                        {formatTime(audioDuration)}
                    </span>
                </div>
            </div>

            {/* Marker Legend */}
            {markers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span>Drag markers to adjust image timing</span>
                </div>
            )}
        </div>
    );
});
