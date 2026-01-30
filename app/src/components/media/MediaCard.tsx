// Media Card Component - Individual media item display
import { Image, Volume2, Play, FileText, Check } from 'lucide-react';
import type { Media, MediaType } from '../../types/media';
import { getMediaType, formatFileSize, formatDuration } from '../../types/media';

interface MediaCardProps {
  media: Media;
  isSelected?: boolean;
  onSelect?: () => void;
  onClick: () => void;
  selectionMode?: boolean;
}

const TYPE_ICONS: Record<MediaType, typeof Image> = {
  image: Image,
  audio: Volume2,
  video: Play,
  document: FileText,
};

const TYPE_COLORS: Record<MediaType, string> = {
  image: 'bg-blue-500',
  audio: 'bg-purple-500',
  video: 'bg-red-500',
  document: 'bg-gray-500',
};

export function MediaCard({ media, isSelected, onSelect, onClick, selectionMode }: MediaCardProps) {
  const type = getMediaType(media.mimeType);
  const Icon = TYPE_ICONS[type];

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onSelect) {
      e.stopPropagation();
      onSelect();
    } else {
      onClick();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`
        group relative bg-[var(--color-bg-elevated)] border rounded-xl overflow-hidden
        cursor-pointer transition-all duration-200
        ${isSelected
          ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]/30'
          : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
        }
      `}
    >
      {/* Thumbnail / Preview */}
      <div className="relative aspect-square bg-[var(--color-bg-surface)] overflow-hidden">
        {type === 'image' ? (
          <img
            src={media.url}
            alt={media.alt || media.filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-16 h-16 text-[var(--color-text-muted)]" />
          </div>
        )}

        {/* Type Badge */}
        <div className={`absolute top-2 right-2 ${TYPE_COLORS[type]} p-1.5 rounded-lg shadow-lg`}>
          <Icon className="w-4 h-4 text-white" />
        </div>

        {/* Selection Checkbox */}
        {selectionMode && (
          <div
            onClick={handleCheckboxClick}
            className={`
              absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center
              cursor-pointer transition-all duration-150
              ${isSelected
                ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                : 'bg-[var(--color-bg-elevated)]/80 border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]'
              }
            `}
          >
            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
          </div>
        )}

        {/* Duration Badge for Audio/Video */}
        {(type === 'audio' || type === 'video') && media.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {formatDuration(media.duration)}
          </div>
        )}

        {/* Dimensions for Images */}
        {type === 'image' && media.width && media.height && (
          <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {media.width} x {media.height}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate" title={media.filename}>
          {media.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatFileSize(media.size)}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {new Date(media.createdAt).toLocaleDateString()}
          </span>
        </div>
        {media.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {media.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
            {media.tags.length > 3 && (
              <span className="text-xs text-[var(--color-text-muted)]">
                +{media.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
