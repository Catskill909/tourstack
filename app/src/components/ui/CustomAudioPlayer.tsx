import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Captions } from 'lucide-react';
import { ClosedCaptions } from './ClosedCaptions';

interface TranscriptWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

interface CustomAudioPlayerProps {
    src: string;
    title?: string;
    size?: 'large' | 'medium' | 'small';
    deviceType?: 'phone' | 'tablet';
    autoplay?: boolean;
    className?: string;
    transcriptWords?: TranscriptWord[];
    showCaptions?: boolean;
    onCaptionsToggle?: (show: boolean) => void;
}

export function CustomAudioPlayer({ src, title, size = 'large', deviceType = 'phone', autoplay = false, className = '', transcriptWords, showCaptions = false, onCaptionsToggle }: CustomAudioPlayerProps) {
    const isTablet = deviceType === 'tablet';
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [localShowCaptions, setLocalShowCaptions] = useState(showCaptions);

    const hasCaptions = transcriptWords && transcriptWords.length > 0;
    const captionsVisible = localShowCaptions && hasCaptions;

    const toggleCaptions = () => {
        const newValue = !localShowCaptions;
        setLocalShowCaptions(newValue);
        onCaptionsToggle?.(newValue);
    };

    useEffect(() => {
        if (autoplay && audioRef.current) {
            audioRef.current.play().catch(() => {
                // Autoplay was prevented
                setIsPlaying(false);
            });
        }
    }, [autoplay]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            if (!isDragging) {
                setCurrentTime(audio.currentTime);
            }
        };

        const updateDuration = () => setDuration(audio.duration);
        const onEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', onEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', onEnded);
        };
    }, [isDragging]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(e.target.value);
        setVolume(value);
        if (audioRef.current) {
            audioRef.current.volume = value;
            setIsMuted(value === 0);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            const newMuteState = !isMuted;
            setIsMuted(newMuteState);
            audioRef.current.muted = newMuteState;
            if (newMuteState) {
                setVolume(0);
            } else {
                setVolume(1);
                audioRef.current.volume = 1;
            }
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const toggleSpeed = () => {
        const speeds = [1, 1.25, 1.5, 2];
        const nextSpeedIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        const nextSpeed = speeds[nextSpeedIndex];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const skipForward = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
        }
    };

    const skipBack = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
        }
    };

    // Small size: just play/pause button
    if (size === 'small') {
        return (
            <div className={`inline-flex ${className}`}>
                <audio ref={audioRef} src={src} preload="metadata" />
                <button
                    onClick={togglePlay}
                    className={`flex items-center justify-center bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white rounded-full shadow-md transition-all active:scale-95 ${
                        isTablet ? 'w-14 h-14' : 'w-11 h-11'
                    }`}
                >
                    {isPlaying ? (
                        <Pause className={isTablet ? 'w-6 h-6 fill-current' : 'w-5 h-5 fill-current'} />
                    ) : (
                        <Play className={`${isTablet ? 'w-6 h-6' : 'w-5 h-5'} fill-current ml-0.5`} />
                    )}
                </button>
            </div>
        );
    }

    // Medium size: inline play + scrubber + time + volume
    if (size === 'medium') {
        return (
            <div className={`bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl shadow-sm ${className} ${
                isTablet ? 'p-4' : 'p-3'
            }`}>
                <audio ref={audioRef} src={src} preload="metadata" />
                <div className={`flex items-center ${isTablet ? 'gap-4' : 'gap-3'}`}>
                    <button
                        onClick={togglePlay}
                        className={`flex-shrink-0 flex items-center justify-center bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white rounded-full shadow-sm transition-all active:scale-95 ${
                            isTablet ? 'w-12 h-12' : 'w-9 h-9'
                        }`}
                    >
                        {isPlaying ? (
                            <Pause className={isTablet ? 'w-5 h-5 fill-current' : 'w-4 h-4 fill-current'} />
                        ) : (
                            <Play className={`${isTablet ? 'w-5 h-5' : 'w-4 h-4'} fill-current ml-0.5`} />
                        )}
                    </button>
                    <div className="flex-1 min-w-0">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            onMouseDown={() => setIsDragging(true)}
                            onMouseUp={() => setIsDragging(false)}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            className={`w-full bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)] ${
                                isTablet ? 'h-1.5' : 'h-1'
                            }`}
                        />
                    </div>
                    <span className={`text-[var(--color-text-muted)] font-mono flex-shrink-0 text-right ${
                        isTablet ? 'text-sm w-12' : 'text-xs w-10'
                    }`}>
                        {formatTime(currentTime)}
                    </span>
                    <button
                        onClick={toggleMute}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors flex-shrink-0"
                    >
                        {isMuted || volume === 0 ? (
                            <VolumeX className={isTablet ? 'w-5 h-5' : 'w-4 h-4'} />
                        ) : (
                            <Volume2 className={isTablet ? 'w-5 h-5' : 'w-4 h-4'} />
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Large size: full player with title, progress, all controls
    return (
        <div className={`bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-4 shadow-sm ${className}`}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {title && (
                <div className="mb-4">
                    <h4 className="font-medium text-[var(--color-text-primary)] truncate">{title}</h4>
                </div>
            )}

            {/* Closed Captions Display */}
            {captionsVisible && transcriptWords && (
                <div className="mb-4">
                    <ClosedCaptions
                        words={transcriptWords}
                        currentTime={currentTime}
                        isVisible={true}
                        maxWords={10}
                        className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"
                    />
                </div>
            )}

            {/* Main Controls */}
            <div className="flex flex-col gap-4">
                {/* Progress Bar */}
                <div className="w-full group">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        onMouseDown={() => setIsDragging(true)}
                        onMouseUp={() => setIsDragging(false)}
                        onTouchStart={() => setIsDragging(true)}
                        onTouchEnd={() => setIsDragging(false)}
                        className="w-full h-1 bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)] hover:h-1.5 transition-all"
                        style={{
                            backgroundSize: `${(currentTime / duration) * 100}% 100%`,
                        }}
                    />
                    <div className="flex justify-between mt-1 text-xs text-[var(--color-text-muted)] font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleSpeed}
                            className="px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                        >
                            {playbackRate}x
                        </button>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={skipBack}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 flex items-center justify-center bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-white rounded-full shadow-md transition-all active:scale-95"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>

                        <button
                            onClick={skipForward}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 group relative">
                        {/* CC Toggle Button */}
                        {hasCaptions && (
                            <button
                                onClick={toggleCaptions}
                                className={`p-2 rounded-full transition-colors ${
                                    localShowCaptions
                                        ? 'bg-yellow-500 text-black'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                                }`}
                                title={localShowCaptions ? 'Hide captions' : 'Show captions'}
                            >
                                <Captions className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={toggleMute}
                            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors p-2"
                        >
                            {isMuted || volume === 0 ? (
                                <VolumeX className="w-5 h-5" />
                            ) : (
                                <Volume2 className="w-5 h-5" />
                            )}
                        </button>
                        {/* Volume slider (hidden on mobile, hover on desktop) */}
                        <div className="hidden sm:block w-0 overflow-hidden group-hover:w-20 transition-all duration-300">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-[var(--color-bg-active)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)]"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
