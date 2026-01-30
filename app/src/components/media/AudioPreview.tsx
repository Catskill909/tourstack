// Audio Preview Component with Waveform
import { useRef, useEffect, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import { formatDuration } from '../../types/media';

interface AudioPreviewProps {
  url: string;
  duration?: number;
}

export function AudioPreview({ url, duration }: AudioPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: 'var(--color-text-muted)',
      progressColor: 'var(--color-accent-primary)',
      cursorColor: 'var(--color-accent-primary)',
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      height: 80,
      normalize: true,
    });

    wavesurfer.load(url);

    wavesurfer.on('ready', () => {
      setIsReady(true);
      setTotalDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));
    wavesurfer.on('finish', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [url]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  return (
    <div className="bg-[var(--color-bg-surface)] rounded-xl p-6">
      <div className="flex items-center gap-4 mb-4">
        <Volume2 className="w-8 h-8 text-[var(--color-accent-primary)]" />
        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">Audio Preview</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {formatDuration(currentTime)} / {formatDuration(totalDuration)}
          </p>
        </div>
      </div>

      {/* Waveform */}
      <div ref={containerRef} className="mb-4" />

      {/* Controls */}
      <div className="flex items-center justify-center">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="flex items-center justify-center w-12 h-12 bg-[var(--color-accent-primary)] text-white rounded-full hover:bg-[var(--color-accent-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
      </div>

      {!isReady && (
        <div className="flex items-center justify-center mt-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--color-accent-primary)] border-t-transparent" />
          <span className="ml-2 text-sm text-[var(--color-text-muted)]">Loading audio...</span>
        </div>
      )}
    </div>
  );
}
