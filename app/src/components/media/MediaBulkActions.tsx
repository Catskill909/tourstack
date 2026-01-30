// Media Bulk Actions Toolbar
import { useState } from 'react';
import { X, Trash2, Tag, CheckSquare } from 'lucide-react';

interface MediaBulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onAddTags: (tags: string[]) => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
}

export function MediaBulkActions({
  selectedCount,
  onDelete,
  onAddTags,
  onClearSelection,
  isDeleting,
}: MediaBulkActionsProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddTags = () => {
    if (tagInput.trim()) {
      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
      onAddTags(tags);
      setTagInput('');
      setShowTagInput(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete();
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl shadow-xl px-4 py-3 flex items-center gap-4">
        {/* Selection Count */}
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-[var(--color-accent-primary)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {selectedCount} selected
          </span>
        </div>

        <div className="w-px h-6 bg-[var(--color-border-default)]" />

        {/* Tag Input or Button */}
        {showTagInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddTags()}
              placeholder="Enter tags (comma separated)"
              className="px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] w-56"
              autoFocus
            />
            <button
              onClick={handleAddTags}
              className="px-3 py-1.5 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm hover:bg-[var(--color-accent-primary)]/90 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
          >
            <Tag className="w-4 h-4" />
            Add Tags
          </button>
        )}

        {/* Delete Button or Confirm */}
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-status-error)]">Delete {selectedCount} items?</span>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 bg-[var(--color-status-error)] text-white rounded-lg text-sm hover:bg-[var(--color-status-error)]/90 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X className="w-4 h-4" />
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

        <div className="w-px h-6 bg-[var(--color-border-default)]" />

        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>
    </div>
  );
}
