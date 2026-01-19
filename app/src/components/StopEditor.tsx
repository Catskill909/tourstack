import { useState } from 'react';
import { X, Plus, Eye, Save, GripVertical, ChevronUp, ChevronDown, Trash2, AlertTriangle } from 'lucide-react';
import { BLOCK_ICONS, BLOCK_LABELS } from './blocks/StopContentBlock';
import { TextBlockEditor } from './blocks/TextBlockEditor';
import { ImageBlockEditor } from './blocks/ImageBlockEditor';
import { AudioBlockEditor } from './blocks/AudioBlockEditor';
import { GalleryBlockEditor } from './blocks/GalleryBlockEditor';
import { TimelineGalleryBlockEditor } from './blocks/TimelineGalleryBlockEditor';
import { PositioningBlockEditor } from './blocks/PositioningBlockEditor';
import { StopPreviewModal } from './StopPreviewModal';
import type { Stop, ContentBlock, ContentBlockType, ContentBlockData, TextBlockData, ImageBlockData, GalleryBlockData, TimelineGalleryBlockData, AudioBlockData, PositioningBlockData } from '../types';

interface StopEditorProps {
    stop: Stop;
    onSave: (stop: Stop) => void;
    onClose: () => void;
}

function generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createEmptyBlockData(type: ContentBlockType): ContentBlockData {
    switch (type) {
        case 'text':
            return { content: { en: '' }, style: 'normal' } as TextBlockData;
        case 'image':
            return { url: '', alt: { en: '' }, size: 'medium' } as ImageBlockData;
        case 'gallery':
            return { images: [], layout: 'carousel', crossfadeDuration: 500 } as GalleryBlockData;
        case 'timelineGallery':
            return { images: [], audioUrl: '', audioDuration: 0, crossfadeDuration: 500 } as TimelineGalleryBlockData;
        case 'audio':
            return { audioFiles: {}, title: { en: '' }, duration: 0, autoplay: false, showTranscript: false } as AudioBlockData;
        case 'positioning':
            return { method: 'qr_code', config: { method: 'qr_code', url: '', shortCode: '' } } as PositioningBlockData;
        default:
            return { content: { en: '' }, style: 'normal' } as TextBlockData;
    }
}

export function StopEditor({ stop, onSave, onClose }: StopEditorProps) {
    const [editedStop, setEditedStop] = useState<Stop>({
        ...stop,
        contentBlocks: stop.contentBlocks || [],
    });
    const [showPreview, setShowPreview] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
    const language = 'en'; // Default language for editing

    const blocks = editedStop.contentBlocks || [];

    function getStopTitle(): string {
        return typeof editedStop.title === 'object'
            ? editedStop.title.en || Object.values(editedStop.title)[0] || 'Untitled'
            : String(editedStop.title);
    }

    function handleTitleChange(value: string) {
        setEditedStop({
            ...editedStop,
            title: { ...editedStop.title, en: value },
        });
    }

    function handleDescriptionChange(value: string) {
        setEditedStop({
            ...editedStop,
            description: { ...editedStop.description, en: value },
        });
    }

    function handleAddBlock(type: ContentBlockType) {
        const newBlock: ContentBlock = {
            id: generateBlockId(),
            type,
            order: blocks.length,
            data: createEmptyBlockData(type),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setEditedStop({
            ...editedStop,
            contentBlocks: [...blocks, newBlock],
        });
        setShowAddBlock(false);
        setEditingBlockId(newBlock.id);
    }

    function handleUpdateBlock(blockId: string, data: ContentBlockData) {
        setEditedStop({
            ...editedStop,
            contentBlocks: blocks.map((b) =>
                b.id === blockId ? { ...b, data, updatedAt: new Date().toISOString() } : b
            ),
        });
    }

    function handleDeleteBlock(blockId: string) {
        setDeleteBlockId(blockId);
    }

    function confirmDeleteBlock() {
        if (!deleteBlockId) return;
        setEditedStop({
            ...editedStop,
            contentBlocks: blocks.filter((b) => b.id !== deleteBlockId).map((b, i) => ({ ...b, order: i })),
        });
        if (editingBlockId === deleteBlockId) {
            setEditingBlockId(null);
        }
        setDeleteBlockId(null);
    }

    function handleMoveBlock(blockId: string, direction: 'up' | 'down') {
        const idx = blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === blocks.length - 1) return;

        const newBlocks = [...blocks];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
        newBlocks.forEach((b, i) => (b.order = i));

        setEditedStop({ ...editedStop, contentBlocks: newBlocks });
    }

    function handleSave() {
        onSave({
            ...editedStop,
            updatedAt: new Date().toISOString(),
        });
    }

    const editingBlock = editingBlockId ? blocks.find((b) => b.id === editingBlockId) : null;

    return (
        <div className="fixed inset-0 z-50 flex overflow-hidden bg-black/50 backdrop-blur-sm">
            <div className="flex-1 flex flex-col bg-[var(--color-bg-surface)] m-4 rounded-xl border border-[var(--color-border-default)] shadow-2xl overflow-hidden max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <input
                        type="text"
                        value={getStopTitle()}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="text-xl font-bold bg-transparent text-[var(--color-text-primary)] border-none outline-none flex-1"
                        placeholder="Stop Title"
                    />
                    <div className="flex items-center gap-2 ml-4">
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            <span>Preview</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Blocks list */}
                    <div className="w-1/2 border-r border-[var(--color-border-default)] overflow-y-auto p-6 space-y-4">
                        {/* Description */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Description
                            </label>
                            <textarea
                                value={editedStop.description?.en || ''}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                                placeholder="Brief description of this stop..."
                            />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-[var(--color-text-primary)]">Content Blocks</h3>
                            <button
                                onClick={() => setShowAddBlock(true)}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary)]/20"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Block</span>
                            </button>
                        </div>

                        {blocks.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-[var(--color-border-default)] rounded-lg">
                                <p className="text-[var(--color-text-muted)] mb-3">No content blocks yet</p>
                                <button
                                    onClick={() => setShowAddBlock(true)}
                                    className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg"
                                >
                                    Add First Block
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {blocks.map((block, index) => {
                                    const Icon = BLOCK_ICONS[block.type];
                                    const isActive = editingBlockId === block.id;
                                    return (
                                        <div
                                            key={block.id}
                                            onClick={() => setEditingBlockId(block.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isActive
                                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                                : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                                }`}
                                        >
                                            <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] cursor-grab" />
                                            <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                            <span className="flex-1 text-sm text-[var(--color-text-primary)]">
                                                {BLOCK_LABELS[block.type]}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }}
                                                    disabled={index === 0}
                                                    className="p-1 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-text-muted)] disabled:opacity-30"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }}
                                                    disabled={index === blocks.length - 1}
                                                    className="p-1 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-text-muted)] disabled:opacity-30"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                                    className="p-1 hover:bg-red-500/10 rounded text-[var(--color-text-muted)] hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Block editor */}
                    <div className="w-1/2 overflow-y-auto p-6 bg-[var(--color-bg-base)]">
                        {editingBlock ? (
                            <div>
                                <h3 className="font-medium text-[var(--color-text-primary)] mb-4">
                                    Edit {BLOCK_LABELS[editingBlock.type]} Block
                                </h3>
                                {editingBlock.type === 'text' && (
                                    <TextBlockEditor
                                        data={editingBlock.data as TextBlockData}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'image' && (
                                    <ImageBlockEditor
                                        data={editingBlock.data as ImageBlockData}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'gallery' && (
                                    <GalleryBlockEditor
                                        data={editingBlock.data as GalleryBlockData}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'audio' && (
                                    <AudioBlockEditor
                                        data={editingBlock.data as AudioBlockData}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'timelineGallery' && (
                                    <TimelineGalleryBlockEditor
                                        data={editingBlock.data as TimelineGalleryBlockData}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'positioning' && (
                                    <PositioningBlockEditor
                                        data={editingBlock.data as PositioningBlockData}
                                        stopId={editedStop.id}
                                        tourId={editedStop.tourId}
                                        language={language}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-[var(--color-text-muted)]">
                                Select a block to edit or add a new one
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Block Modal */}
            {showAddBlock && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6 w-full max-w-md shadow-xl">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">Add Content Block</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {(['text', 'image', 'gallery', 'timelineGallery', 'audio'] as ContentBlockType[]).map((type) => {
                                const Icon = BLOCK_ICONS[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => handleAddBlock(type)}
                                        className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 transition-colors"
                                    >
                                        <Icon className="w-6 h-6 text-[var(--color-accent-primary)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">{BLOCK_LABELS[type]}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setShowAddBlock(false)}
                            className="w-full mt-4 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Device Preview Modal */}
            {showPreview && (
                <StopPreviewModal
                    stop={editedStop}
                    onClose={() => setShowPreview(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {deleteBlockId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-red-500/10">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Delete Block</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    This action cannot be undone
                                </p>
                            </div>
                        </div>

                        <p className="text-[var(--color-text-secondary)] mb-6">
                            Are you sure you want to delete this{' '}
                            <span className="font-medium text-[var(--color-text-primary)]">
                                {BLOCK_LABELS[blocks.find(b => b.id === deleteBlockId)?.type || 'text']}
                            </span>
                            {' '}block?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteBlockId(null)}
                                className="flex-1 px-4 py-2.5 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteBlock}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
