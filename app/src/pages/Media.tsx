// Media Library Page
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Upload, Image, Volume2, Play, FileText, Filter, ArrowUpDown, CheckSquare, RefreshCw } from 'lucide-react';
import { MediaCard } from '../components/media/MediaCard';
import { MediaDetailModal } from '../components/media/MediaDetailModal';
import { MediaBulkActions } from '../components/media/MediaBulkActions';
import { mediaService } from '../lib/mediaService';
import type { Media, MediaType, MediaSortOption } from '../types/media';
import { getMediaType, formatFileSize } from '../types/media';

type FilterType = MediaType | 'all';

const TYPE_FILTERS: { value: FilterType; label: string; icon: typeof Image }[] = [
  { value: 'all', label: 'All Media', icon: Filter },
  { value: 'image', label: 'Images', icon: Image },
  { value: 'audio', label: 'Audio', icon: Volume2 },
  { value: 'video', label: 'Video', icon: Play },
  { value: 'document', label: 'Documents', icon: FileText },
];

const SORT_OPTIONS: { value: MediaSortOption; label: string }[] = [
  { value: 'date', label: 'Date Added' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
];

export function Media() {
  const [media, setMedia] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<MediaSortOption>('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  // Upload & Sync
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch media on mount
  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setIsLoading(true);
      const data = await mediaService.getAll();
      setMedia(data);
      setError(null);
    } catch (err) {
      setError('Failed to load media');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort media
  const filteredMedia = useMemo(() => {
    let result = [...media];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(m => getMediaType(m.mimeType) === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(m =>
        m.filename.toLowerCase().includes(query) ||
        m.alt?.toLowerCase().includes(query) ||
        m.caption?.toLowerCase().includes(query) ||
        m.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'date':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          cmp = a.filename.localeCompare(b.filename);
          break;
        case 'size':
          cmp = a.size - b.size;
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [media, typeFilter, searchQuery, sortBy, sortAsc]);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredMedia.map(m => m.id)));
  }, [filteredMedia]);

  // Bulk delete
  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true);
      await mediaService.bulkDelete(Array.from(selectedIds));
      setMedia(prev => prev.filter(m => !selectedIds.has(m.id)));
      clearSelection();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk add tags
  const handleBulkAddTags = async (tags: string[]) => {
    try {
      await mediaService.bulkTags(Array.from(selectedIds), tags, 'add');
      // Refresh to get updated tags
      await loadMedia();
    } catch (err) {
      console.error('Failed to add tags:', err);
    }
  };

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await mediaService.upload(file);
      }
      await loadMedia();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  // Sync files from uploads folder to database
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/media/sync', { method: 'POST' });
      const result = await response.json();
      console.log('Sync result:', result);
      await loadMedia();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle media update from modal
  const handleMediaUpdate = (updated: Media) => {
    setMedia(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelectedMedia(updated);
  };

  // Handle media delete from modal
  const handleMediaDelete = (id: string) => {
    setMedia(prev => prev.filter(m => m.id !== id));
    setSelectedMedia(null);
  };

  // Stats
  const stats = useMemo(() => {
    const images = media.filter(m => getMediaType(m.mimeType) === 'image').length;
    const audio = media.filter(m => getMediaType(m.mimeType) === 'audio').length;
    const video = media.filter(m => getMediaType(m.mimeType) === 'video').length;
    const totalSize = media.reduce((sum, m) => sum + m.size, 0);
    return { images, audio, video, totalSize };
  }, [media]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-bg-primary)]">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Media Library</h1>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {media.length} items ({stats.images} images, {stats.audio} audio, {stats.video} video) - {formatFileSize(stats.totalSize)} total
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Sync Button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg text-sm font-medium hover:border-[var(--color-border-hover)] transition-colors disabled:opacity-50"
                title="Sync files from uploads folder to database"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </button>

              {/* Selection Mode Toggle */}
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) clearSelection();
                }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${selectionMode
                    ? 'bg-[var(--color-accent-primary)] text-white'
                    : 'border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                  }
                `}
              >
                <CheckSquare className="w-4 h-4" />
                Select
              </button>

              {/* Upload Button */}
              <label className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-primary)]/90 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload'}
                <input
                  type="file"
                  multiple
                  accept="image/*,audio/*,video/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, tags, or caption..."
                className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1 bg-[var(--color-bg-surface)] rounded-lg p-1 border border-[var(--color-border-default)]">
              {TYPE_FILTERS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTypeFilter(value)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors
                    ${typeFilter === value
                      ? 'bg-[var(--color-accent-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as MediaSortOption)}
                className="px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-2 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)] transition-colors"
                title={sortAsc ? 'Ascending' : 'Descending'}
              >
                <ArrowUpDown className={`w-4 h-4 transition-transform ${sortAsc ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Select All (when in selection mode) */}
            {selectionMode && (
              <button
                onClick={selectAll}
                className="text-sm text-[var(--color-accent-primary)] hover:underline"
              >
                Select All ({filteredMedia.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-accent-primary)] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-[var(--color-status-error)] mb-4">{error}</p>
            <button
              onClick={loadMedia}
              className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm"
            >
              Retry
            </button>
          </div>
        ) : filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Image className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
            <p className="text-[var(--color-text-secondary)] text-lg font-medium">
              {media.length === 0 ? 'No media uploaded yet' : 'No results found'}
            </p>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">
              {media.length === 0
                ? 'Upload images, audio, or video to get started'
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map(item => (
              <MediaCard
                key={item.id}
                media={item}
                isSelected={selectedIds.has(item.id)}
                onSelect={() => toggleSelection(item.id)}
                onClick={() => setSelectedMedia(item)}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      <MediaBulkActions
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onAddTags={handleBulkAddTags}
        onClearSelection={clearSelection}
        isDeleting={isDeleting}
      />

      {/* Detail Modal */}
      {selectedMedia && (
        <MediaDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onUpdate={handleMediaUpdate}
          onDelete={handleMediaDelete}
        />
      )}
    </div>
  );
}
