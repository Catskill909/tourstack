// Video Preview Component
import { useRef, useState } from 'react';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { formatDuration } from '../../types/media';

interface VideoPreviewProps {
  url: string;
  duration?: number;
}

export function VideoPreview({ url, duration }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setTotalDuration(videoRef.current.duration);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="bg-[var(--color-bg-surface)] rounded-xl overflow-hidden">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Play overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          >
            <div className="w-16 h-16 bg-[var(--color-accent-primary)] rounded-full flex items-center justify-center">
              <Play className="w-7 h-7 text-white ml-1" />
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="p-2 bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTime}
            onChange={(e) => {
              const time = parseFloat(e.target.value);
              if (videoRef.current) {
                videoRef.current.currentTime = time;
                setCurrentTime(time);
              }
            }}
            className="w-full h-1 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-primary)]"
          />
        </div>

        {/* Time display */}
        <span className="text-sm text-[var(--color-text-muted)] min-w-[80px] text-right">
          {formatDuration(currentTime)} / {formatDuration(totalDuration)}
        </span>

        {/* Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="p-2 bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
