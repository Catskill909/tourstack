// Media Usage List Component - Shows where media is used
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, ImageIcon, FileText, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { mediaService } from '../../lib/mediaService';
import type { MediaUsage } from '../../types/media';

interface MediaUsageListProps {
  mediaId: string;
}

export function MediaUsageList({ mediaId }: MediaUsageListProps) {
  const [usage, setUsage] = useState<MediaUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
  }, [mediaId]);

  const loadUsage = async () => {
    try {
      setIsLoading(true);
      const data = await mediaService.getUsage(mediaId);
      setUsage(data);
      setError(null);
    } catch (err) {
      setError('Failed to load usage info');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const totalUsage = usage ? usage.tours.length + usage.stops.length : 0;

  // Get display title from multilingual object
  const getTitle = (title: Record<string, string>) => {
    return title.en || Object.values(title)[0] || 'Untitled';
  };

  return (
    <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-[var(--color-accent-secondary)]" />
          <span className="font-medium text-[var(--color-text-primary)]">Where Used</span>
          {!isLoading && (
            <span className="text-sm text-[var(--color-text-muted)]">
              ({totalUsage} {totalUsage === 1 ? 'location' : 'locations'})
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-[var(--color-border-default)]">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-[var(--color-accent-primary)] border-t-transparent" />
              Loading...
            </div>
          ) : error ? (
            <p className="text-sm text-[var(--color-status-error)]">{error}</p>
          ) : totalUsage === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              This media is not currently used in any tours or stops.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Tours */}
              {usage?.tours.map(tour => (
                <Link
                  key={tour.id}
                  to={`/tours/${tour.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[var(--color-accent-primary)]/10 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-[var(--color-accent-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {getTitle(tour.title)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Tour hero image
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}

              {/* Stops */}
              {usage?.stops.map(stop => (
                <Link
                  key={stop.id}
                  to={`/tours/${stop.tourId}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors group"
                >
                  <div className="w-8 h-8 bg-[var(--color-accent-secondary)]/10 rounded-lg flex items-center justify-center">
                    {stop.usageType === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-[var(--color-accent-secondary)]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[var(--color-accent-secondary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {getTitle(stop.title)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Stop {stop.usageType === 'image' ? 'image' : 'content block'}
                      {stop.tourTitle && ` in "${getTitle(stop.tourTitle)}"`}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
