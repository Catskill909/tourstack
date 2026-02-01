// Media Detail Modal - Full detail view for a media item
import { useState, useEffect, useCallback } from 'react';
import { X, Trash2, Save, Image, Volume2, Play, FileText, Calendar, HardDrive, Maximize2 } from 'lucide-react';
import { AudioPreview } from './AudioPreview';
import { VideoPreview } from './VideoPreview';
import { MediaUsageList } from './MediaUsageList';
import { ImageAnalysisPanel } from './ImageAnalysisPanel';
import { mediaService } from '../../lib/mediaService';
import type { Media, MediaType, AIAnalysisResult } from '../../types/media';
import { getMediaType, formatFileSize, formatDuration } from '../../types/media';

interface MediaDetailModalProps {
  media: Media;
  onClose: () => void;
  onUpdate: (media: Media) => void;
  onDelete: (id: string) => void;
}

export function MediaDetailModal({ media, onClose, onUpdate, onDelete }: MediaDetailModalProps) {
  const [alt, setAlt] = useState(media.alt || '');
  const [caption, setCaption] = useState(media.caption || '');
  const [tags, setTags] = useState<string[]>(media.tags);
  const [tagInput, setTagInput] = useState('');
  const [aiMetadata, setAiMetadata] = useState<AIAnalysisResult | undefined>(media.aiMetadata);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const type = getMediaType(media.mimeType);

  // Track changes
  useEffect(() => {
    const changed =
      alt !== (media.alt || '') ||
      caption !== (media.caption || '') ||
      JSON.stringify(tags) !== JSON.stringify(media.tags) ||
      JSON.stringify(aiMetadata) !== JSON.stringify(media.aiMetadata);
    setHasChanges(changed);
  }, [alt, caption, tags, aiMetadata, media]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showFullscreen) {
          setShowFullscreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, showFullscreen]);

  // Save changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await mediaService.update(media.id, { alt, caption, tags, aiMetadata });
      onUpdate(updated);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete media
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await mediaService.delete(media.id);
      onDelete(media.id);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add tag
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Apply AI tags
  const handleApplyTags = useCallback((aiTags: string[]) => {
    const merged = [...new Set([...tags, ...aiTags])];
    setTags(merged);
  }, [tags]);

  // Apply AI description as caption
  const handleApplyDescription = useCallback((description: string) => {
    setCaption(description);
  }, []);

  // Handle AI analysis completion - store for saving
  const handleAnalysisComplete = useCallback((analysis: AIAnalysisResult) => {
    setAiMetadata(analysis);
  }, []);

  const TYPE_ICONS: Record<MediaType, typeof Image> = {
    image: Image,
    audio: Volume2,
    video: Play,
    document: FileText,
  };
  const TypeIcon = TYPE_ICONS[type];

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-4 md:inset-8 z-50 flex items-center justify-center pointer-events-none">
        <div
          className="w-full max-w-6xl max-h-full bg-[var(--color-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-bg-surface)] rounded-lg flex items-center justify-center">
                <TypeIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />
              </div>
              <div>
                <h2 className="font-semibold text-[var(--color-text-primary)] truncate max-w-md">
                  {media.filename}
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {type.charAt(0).toUpperCase() + type.slice(1)} - {media.mimeType}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Column - Preview */}
              <div className="space-y-4">
                {type === 'image' && (
                  <div
                    className="relative bg-[var(--color-bg-surface)] rounded-xl overflow-hidden cursor-pointer group"
                    onClick={() => setShowFullscreen(true)}
                  >
                    <img
                      src={media.url}
                      alt={media.alt || media.filename}
                      className="w-full max-h-[500px] object-contain"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-black/50 text-white px-3 py-2 rounded-lg flex items-center gap-2">
                        <Maximize2 className="w-4 h-4" />
                        Click to expand
                      </div>
                    </div>
                  </div>
                )}

                {type === 'audio' && (
                  <AudioPreview url={media.url} duration={media.duration} />
                )}

                {type === 'video' && (
                  <VideoPreview url={media.url} duration={media.duration} />
                )}

                {type === 'document' && (
                  <div className="bg-[var(--color-bg-surface)] rounded-xl p-8 flex flex-col items-center justify-center">
                    <FileText className="w-16 h-16 text-[var(--color-text-muted)] mb-4" />
                    <p className="text-[var(--color-text-secondary)]">Document preview not available</p>
                    <a
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                    >
                      Open Document
                    </a>
                  </div>
                )}

                {/* Metadata Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-bg-surface)] rounded-lg p-3">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                      <HardDrive className="w-4 h-4" />
                      <span className="text-xs">Size</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {formatFileSize(media.size)}
                    </p>
                  </div>
                  <div className="bg-[var(--color-bg-surface)] rounded-lg p-3">
                    <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Uploaded</span>
                    </div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {new Date(media.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {type === 'image' && media.width && media.height && (
                    <div className="bg-[var(--color-bg-surface)] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                        <Image className="w-4 h-4" />
                        <span className="text-xs">Dimensions</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {media.width} x {media.height}
                      </p>
                    </div>
                  )}
                  {(type === 'audio' || type === 'video') && media.duration && (
                    <div className="bg-[var(--color-bg-surface)] rounded-lg p-3">
                      <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-1">
                        <Play className="w-4 h-4" />
                        <span className="text-xs">Duration</span>
                      </div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {formatDuration(media.duration)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Where Used */}
                <MediaUsageList mediaId={media.id} />
              </div>

              {/* Right Column - Edit Form & AI */}
              <div className="space-y-4">
                {/* Metadata Form */}
                <div className="bg-[var(--color-bg-surface)] rounded-xl p-4 space-y-4">
                  <h3 className="font-medium text-[var(--color-text-primary)]">Metadata</h3>

                  {/* Alt Text */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={alt}
                      onChange={e => setAlt(e.target.value)}
                      placeholder="Describe this media for accessibility"
                      className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                    />
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      placeholder="Add a caption or description"
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors resize-none"
                    />
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="Add a tag"
                        className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors"
                      />
                      <button
                        onClick={handleAddTag}
                        disabled={!tagInput.trim()}
                        className="px-3 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm hover:bg-[var(--color-accent-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add
                      </button>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-md text-xs group"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="text-[var(--color-text-muted)] hover:text-[var(--color-status-error)] transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>

                {/* AI Analysis (Images Only) */}
                {type === 'image' && (
                  <ImageAnalysisPanel
                    imageUrl={media.url}
                    initialAnalysis={aiMetadata}
                    onApplyTags={handleApplyTags}
                    onApplyDescription={handleApplyDescription}
                    onAnalysisComplete={handleAnalysisComplete}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)]">
            {showDeleteConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-status-error)]">Delete this media?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 bg-[var(--color-status-error)] text-white rounded-lg text-sm hover:bg-[var(--color-status-error)]/90 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-status-error)] hover:bg-[var(--color-status-error)]/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg text-sm hover:border-[var(--color-border-hover)] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Image */}
      {showFullscreen && type === 'image' && (
        <div
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center cursor-pointer"
          onClick={() => setShowFullscreen(false)}
        >
          <img
            src={media.url}
            alt={media.alt || media.filename}
            className="max-w-full max-h-full object-contain"
          />
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
