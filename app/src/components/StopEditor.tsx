import { useState } from 'react';
import { X, Plus, Eye, Save, GripVertical, ChevronUp, ChevronDown, Trash2, AlertTriangle, Maximize2, Music, Languages, Loader2, Image as ImageIcon } from 'lucide-react';
import { BLOCK_ICONS, BLOCK_LABELS } from './blocks/StopContentBlock';
import { LanguageSwitcher } from './LanguageSwitcher';
import { translateWithLibre, type TranslationProvider } from '../services/translationService';
import { TextBlockEditor } from './blocks/TextBlockEditor';
import { ImageBlockEditor } from './blocks/ImageBlockEditor';
import { AudioBlockEditor } from './blocks/AudioBlockEditor';
import { GalleryBlockEditor } from './blocks/GalleryBlockEditor';
import { TimelineGalleryEditorModal } from './blocks/TimelineGalleryEditorModal';
import { MapEditorModal } from './blocks/MapEditorModal';
import { MapBlockEditor } from './blocks/MapBlockEditor';
import { PositioningBlockEditor } from './blocks/PositioningBlockEditor';
import { TourBlockEditor } from './blocks/TourBlockEditor';
import { StopPreviewModal } from './StopPreviewModal';
import type { Stop, Tour, ContentBlock, ContentBlockType, ContentBlockData, TextBlockData, ImageBlockData, GalleryBlockData, TimelineGalleryBlockData, AudioBlockData, PositioningBlockData, MapBlockData, TourBlockData, StopImageData } from '../types';

interface StopEditorProps {
    stop: Stop;
    /** Tour data for tour blocks */
    tourData?: Tour;
    /** All stops for navigation (tour blocks) */
    allStops?: Stop[];
    /** Available languages from tour.languages */
    availableLanguages?: string[];
    /** Translation provider for Magic Translate */
    translationProvider?: TranslationProvider;
    onSave: (stop: Stop, shouldClose?: boolean) => void;
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
            return { url: '', caption: { en: '' }, credit: { en: '' }, size: 'medium' } as ImageBlockData;
        case 'gallery':
            return { images: [], layout: 'carousel', crossfadeDuration: 500 } as GalleryBlockData;
        case 'timelineGallery':
            return { images: [], audioUrl: '', audioDuration: 0, crossfadeDuration: 500 } as TimelineGalleryBlockData;
        case 'audio':
            return { audioFiles: {}, title: { en: '' }, size: 'large', showTitle: false, autoplay: false, showTranscript: false } as AudioBlockData;
        case 'positioning':
            return { method: 'qr_code', config: { method: 'qr_code', url: '', shortCode: '' } } as PositioningBlockData;
        case 'map':
            return { latitude: 0, longitude: 0, zoom: 15, provider: 'openstreetmap', style: 'standard', showMarker: true } as MapBlockData;
        case 'tour':
            return { layout: 'hero-bottom', imagePosition: 'center', imageFit: 'cover', overlayOpacity: 70, showBadge: true, badge: { en: 'FEATURED EXHIBIT' }, ctaText: { en: 'Begin Guided Tour' }, ctaStyle: 'primary', ctaAction: 'next-stop' } as TourBlockData;
        default:
            return { content: { en: '' }, style: 'normal' } as TextBlockData;
    }
}

export function StopEditor({ stop, tourData, allStops = [], availableLanguages = ['en'], translationProvider = 'libretranslate', onSave, onClose }: StopEditorProps) {
    // Ensure contentBlocks is always an array - defensive check
    const safeContentBlocks = Array.isArray(stop.contentBlocks) ? stop.contentBlocks : [];

    const [editedStop, setEditedStop] = useState<Stop>({
        ...stop,
        contentBlocks: safeContentBlocks,
    });
    const [showPreview, setShowPreview] = useState(false);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [showAddBlock, setShowAddBlock] = useState(false);
    const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
    const [showTimelineEditorId, setShowTimelineEditorId] = useState<string | null>(null);
    const [showMapEditorId, setShowMapEditorId] = useState<string | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [activeTitleLang, setActiveTitleLang] = useState(availableLanguages[0] || 'en');
    const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
    const [activeDescriptionLang, setActiveDescriptionLang] = useState(availableLanguages[0] || 'en');
    const [isTranslatingDescription, setIsTranslatingDescription] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [activeImageLang, setActiveImageLang] = useState(availableLanguages[0] || 'en');
    const [isTranslatingImageCaption, setIsTranslatingImageCaption] = useState(false);
    const language = availableLanguages[0] || 'en'; // Primary language for editing

    const blocks = Array.isArray(editedStop.contentBlocks) ? editedStop.contentBlocks : [];

    function getStopTitle(): string {
        if (typeof editedStop.title === 'object') {
            // Return the value for the active language, or empty string if not set
            // Don't fall back to other languages or 'Untitled' - let the placeholder handle that
            return editedStop.title[activeTitleLang] ?? '';
        }
        return String(editedStop.title);
    }

    function handleTitleChange(value: string) {
        const currentTitle = typeof editedStop.title === 'object' ? editedStop.title : { en: String(editedStop.title) };
        setEditedStop({
            ...editedStop,
            title: { ...currentTitle, [activeTitleLang]: value },
        });
        setHasUnsavedChanges(true);
    }

    async function handleTranslateTitle() {
        const titleObj = typeof editedStop.title === 'object' ? editedStop.title : { en: String(editedStop.title) };
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = titleObj[primaryLang] || titleObj['en'] || Object.values(titleObj)[0];

        if (!sourceText?.trim()) return;

        setIsTranslatingTitle(true);
        const newTitleObj = { ...titleObj };

        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newTitleObj[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate title to ${lang}:`, error);
            }
        }

        setEditedStop({
            ...editedStop,
            title: newTitleObj,
        });
        setHasUnsavedChanges(true);
        setIsTranslatingTitle(false);
    }

    function handleDescriptionChange(value: string) {
        setEditedStop({
            ...editedStop,
            description: { ...editedStop.description, [activeDescriptionLang]: value },
        });
        setHasUnsavedChanges(true);
    }

    async function handleTranslateDescription() {
        const descObj = editedStop.description || { en: '' };
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = descObj[primaryLang] || descObj['en'] || Object.values(descObj)[0];

        if (!sourceText?.trim()) return;

        setIsTranslatingDescription(true);
        const newDescObj = { ...descObj };

        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newDescObj[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate description to ${lang}:`, error);
            }
        }

        setEditedStop({
            ...editedStop,
            description: newDescObj,
        });
        setHasUnsavedChanges(true);
        setIsTranslatingDescription(false);
    }

    function getStopDescription(): string {
        if (typeof editedStop.description === 'object') {
            return editedStop.description[activeDescriptionLang] ?? '';
        }
        return String(editedStop.description || '');
    }

    // Hero Image Helpers
    function getImageData(): StopImageData {
        if (typeof editedStop.image === 'string') {
            // Legacy format - convert to object
            return {
                url: editedStop.image || '',
                caption: {},
                credit: {},
            };
        }
        return editedStop.image || { url: '', caption: {}, credit: {} };
    }

    async function handleImageUpload(file: File) {
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            const currentImage = getImageData();

            setEditedStop({
                ...editedStop,
                image: {
                    ...currentImage,
                    url: data.url,
                },
            });
            setHasUnsavedChanges(true);
        } catch (error) {
            console.error('Failed to upload image:', error);
            alert('Failed to upload image. Please try again.');
        } finally {
            setIsUploadingImage(false);
        }
    }

    function handleImageCaptionChange(value: string) {
        const currentImage = getImageData();
        setEditedStop({
            ...editedStop,
            image: {
                ...currentImage,
                caption: { ...currentImage.caption, [activeImageLang]: value },
            },
        });
        setHasUnsavedChanges(true);
    }

    function handleImageCreditChange(value: string) {
        const currentImage = getImageData();
        setEditedStop({
            ...editedStop,
            image: {
                ...currentImage,
                credit: { ...currentImage.credit, [activeImageLang]: value },
            },
        });
        setHasUnsavedChanges(true);
    }

    async function handleTranslateImageCaption() {
        const currentImage = getImageData();
        const primaryLang = availableLanguages[0] || 'en';
        const sourceText = currentImage.caption?.[primaryLang] || currentImage.caption?.['en'];

        if (!sourceText?.trim()) return;

        setIsTranslatingImageCaption(true);
        const newCaption = { ...currentImage.caption };
        for (const lang of availableLanguages) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newCaption[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate caption to ${lang}:`, error);
            }
        }

        setEditedStop({
            ...editedStop,
            image: {
                ...currentImage,
                caption: newCaption,
            },
        });
        setHasUnsavedChanges(true);
        setIsTranslatingImageCaption(false);
    }


    function handleImageRemove() {
        setEditedStop({
            ...editedStop,
            image: { url: '', caption: {}, credit: {} },
        });
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
    }

    function handleUpdateBlock(blockId: string, data: ContentBlockData) {
        setEditedStop({
            ...editedStop,
            contentBlocks: blocks.map((b) =>
                b.id === blockId ? { ...b, data, updatedAt: new Date().toISOString() } : b
            ),
        });
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
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
        setHasUnsavedChanges(true);
    }

    function handleSave(shouldClose: boolean = false) {
        onSave({
            ...editedStop,
            updatedAt: new Date().toISOString(),
        }, shouldClose);
        setHasUnsavedChanges(false);
    }

    function handleClose() {
        if (hasUnsavedChanges) {
            setShowUnsavedWarning(true);
        } else {
            onClose();
        }
    }

    function confirmDiscardChanges() {
        setShowUnsavedWarning(false);
        onClose();
    }

    const editingBlock = editingBlockId ? blocks.find((b) => b.id === editingBlockId) : null;

    return (
        <div className="fixed inset-0 z-50 flex overflow-hidden bg-black/50 backdrop-blur-sm">
            <div className="flex-1 flex flex-col bg-[var(--color-bg-surface)] m-4 rounded-xl border border-[var(--color-border-default)] shadow-2xl overflow-hidden max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-3 px-6 py-4 border-b border-[var(--color-border-default)]">
                    {/* Title Row with Language Tabs */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1">
                            {/* Language tabs for title (only show if multiple languages) */}
                            {availableLanguages.length > 1 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeTitleLang}
                                        onChange={setActiveTitleLang}
                                        contentMap={typeof editedStop.title === 'object' ? editedStop.title : { en: String(editedStop.title) }}
                                        size="sm"
                                        showStatus={true}
                                    />
                                    <button
                                        onClick={handleTranslateTitle}
                                        disabled={isTranslatingTitle}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary)]/20 disabled:opacity-50"
                                        title="Translate title to all languages"
                                    >
                                        {isTranslatingTitle ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Languages className="w-4 h-4" />
                                        )}
                                        <span>Translate</span>
                                    </button>
                                </div>
                            )}
                            <input
                                type="text"
                                value={getStopTitle()}
                                onChange={(e) => handleTitleChange(e.target.value)}
                                className="w-full text-xl font-bold bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] rounded-lg px-4 py-2 focus:border-[var(--color-accent-primary)] focus:outline-none"
                                placeholder="Stop Title"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges && (
                                <span className="text-xs text-yellow-500 font-medium">Unsaved changes</span>
                            )}
                            <button
                                onClick={() => setShowPreview(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                            </button>
                            <button
                                onClick={() => setShowSaveModal(true)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${hasUnsavedChanges
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black font-bold animate-pulse'
                                    : 'bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white'
                                    }`}
                            >
                                <Save className="w-4 h-4" />
                                <span>Save</span>
                            </button>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Blocks list */}
                    <div className="w-1/2 border-r border-[var(--color-border-default)] overflow-y-auto p-6 space-y-4">
                        {/* Description */}
                        <div className="mb-6">
                            {/* Language tabs and translate button for description (only show if multiple languages) */}
                            {availableLanguages.length > 1 && (
                                <div className="flex items-center gap-2 mb-2">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeDescriptionLang}
                                        onChange={setActiveDescriptionLang}
                                        contentMap={typeof editedStop.description === 'object' ? editedStop.description : { en: String(editedStop.description) }}
                                        size="sm"
                                        showStatus={true}
                                    />
                                    <button
                                        onClick={handleTranslateDescription}
                                        disabled={isTranslatingDescription}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-lg hover:bg-[var(--color-accent-primary)]/20 disabled:opacity-50"
                                        title="Translate description to all languages"
                                    >
                                        {isTranslatingDescription ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Languages className="w-4 h-4" />
                                        )}
                                        <span>Translate</span>
                                    </button>
                                </div>
                            )}
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                Description
                            </label>
                            <textarea
                                value={getStopDescription()}
                                onChange={(e) => handleDescriptionChange(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                                placeholder="Brief description of this stop..."
                            />
                        </div>

                        {/* Hero Image */}
                        <div className="mb-6 space-y-3">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                                Hero Image
                            </label>

                            {/* Image Upload */}
                            <div
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/jpeg,image/png,image/webp';
                                    input.onchange = (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) handleImageUpload(file);
                                    };
                                    input.click();
                                }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type.startsWith('image/')) {
                                        handleImageUpload(file);
                                    }
                                }}
                                className={`
                                    relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                                    ${getImageData().url
                                        ? 'border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]'
                                        : 'border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                                    }
                                `}
                            >
                                {isUploadingImage ? (
                                    <div className="flex flex-col items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin mb-2" />
                                        <p className="text-sm text-[var(--color-text-muted)]">Uploading image...</p>
                                    </div>
                                ) : getImageData().url ? (
                                    <div className="relative group">
                                        <img
                                            src={getImageData().url}
                                            alt="Stop hero"
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleImageRemove();
                                                }}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                                Remove Image
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 px-4">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[var(--color-bg-surface)]">
                                            <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
                                        </div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                                            Drag & drop image here
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                                            or click to browse
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            Supports JPG, PNG, WebP (max 5MB)
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Caption and Credit (only show if image exists) */}
                            {getImageData().url && (
                                <>
                                    {/* Language switcher for caption/credit */}
                                    {availableLanguages.length > 1 && (
                                        <LanguageSwitcher
                                            availableLanguages={availableLanguages}
                                            activeLanguage={activeImageLang}
                                            onChange={setActiveImageLang}
                                            contentMap={{
                                                ...(getImageData().caption || {}),
                                                ...(getImageData().credit || {}),
                                            }}
                                            size="sm"
                                            showStatus={true}
                                        />
                                    )}

                                    {/* Caption */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                                                Caption <span className="text-[var(--color-text-muted)]">Optional</span>
                                            </label>
                                            {availableLanguages.length > 1 && (
                                                <button
                                                    onClick={handleTranslateImageCaption}
                                                    disabled={isTranslatingImageCaption}
                                                    className="flex items-center gap-1 px-2 py-0.5 text-xs bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded hover:bg-[var(--color-accent-primary)]/20 disabled:opacity-50"
                                                    title="Translate caption to all languages"
                                                >
                                                    {isTranslatingImageCaption ? (
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                    ) : (
                                                        <Languages className="w-3 h-3" />
                                                    )}
                                                    <span>Translate</span>
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={getImageData().caption?.[activeImageLang] || ''}
                                            onChange={(e) => handleImageCaptionChange(e.target.value)}
                                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                            placeholder="Image caption..."
                                        />
                                    </div>

                                    {/* Credit */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                                            Credit <span className="text-[var(--color-text-muted)]">Optional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={getImageData().credit?.[activeImageLang] || ''}
                                            onChange={(e) => handleImageCreditChange(e.target.value)}
                                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                            placeholder="Photo credit or attribution..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Show/Hide Toggles for Stop Title, Description, and Hero Image */}
                        <div className="mb-6 p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                            <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">Display Settings</h4>
                            <div className="flex flex-wrap gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedStop.showTitle ?? true}
                                        onChange={(e) => setEditedStop({ ...editedStop, showTitle: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                    />
                                    <span className="text-sm text-[var(--color-text-secondary)]">Show Stop Title</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedStop.showDescription ?? true}
                                        onChange={(e) => setEditedStop({ ...editedStop, showDescription: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                    />
                                    <span className="text-sm text-[var(--color-text-secondary)]">Show Stop Description</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedStop.showImage ?? true}
                                        onChange={(e) => setEditedStop({ ...editedStop, showImage: e.target.checked })}
                                        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                    />
                                    <span className="text-sm text-[var(--color-text-secondary)]">Show Hero Image</span>
                                </label>
                            </div>
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
                                        availableLanguages={availableLanguages}
                                        translationProvider={translationProvider}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'image' && (
                                    <ImageBlockEditor
                                        data={editingBlock.data as ImageBlockData}
                                        language={language}
                                        availableLanguages={availableLanguages}
                                        translationProvider={translationProvider}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'gallery' && (
                                    <GalleryBlockEditor
                                        data={editingBlock.data as GalleryBlockData}
                                        language={language}
                                        availableLanguages={availableLanguages}
                                        translationProvider={translationProvider}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'audio' && (
                                    <AudioBlockEditor
                                        data={editingBlock.data as AudioBlockData}
                                        language={language}
                                        availableLanguages={availableLanguages}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                    />
                                )}
                                {editingBlock.type === 'timelineGallery' && (
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] rounded-xl p-6 border border-[var(--color-border-default)]">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-purple-500">
                                                    <Music className="w-6 h-6 text-white" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-[var(--color-text-primary)]">
                                                        Timeline Gallery
                                                    </h4>
                                                    <p className="text-sm text-[var(--color-text-muted)]">
                                                        {(editingBlock.data as TimelineGalleryBlockData).images?.length || 0} images synced to audio
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowTimelineEditorId(editingBlock.id)}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--color-accent-primary)] to-purple-500 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all"
                                            >
                                                <Maximize2 className="w-5 h-5" />
                                                Open Full Editor
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] text-center">
                                            The Timeline Gallery editor opens in a full-screen view for precise audio-image synchronization
                                        </p>
                                    </div>
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
                                {editingBlock.type === 'map' && (
                                    <MapBlockEditor
                                        data={editingBlock.data as MapBlockData}
                                        language={language}
                                        availableLanguages={availableLanguages}
                                        onChange={(data) => handleUpdateBlock(editingBlock.id, data)}
                                        onOpenFullEditor={() => setShowMapEditorId(editingBlock.id)}
                                    />
                                )}
                                {editingBlock.type === 'tour' && (
                                    <TourBlockEditor
                                        data={editingBlock.data as TourBlockData}
                                        language={language}
                                        availableLanguages={availableLanguages}
                                        translationProvider={translationProvider}
                                        tourData={tourData}
                                        allStops={allStops}
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
                            {(['tour', 'text', 'image', 'gallery', 'timelineGallery', 'audio', 'map'] as ContentBlockType[]).map((type) => {
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
                    tourData={tourData}
                    availableLanguages={availableLanguages}
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

            {/* Timeline Gallery Full Editor Modal */}
            {showTimelineEditorId && (() => {
                const timelineBlock = blocks.find(b => b.id === showTimelineEditorId);
                if (!timelineBlock || timelineBlock.type !== 'timelineGallery') return null;
                return (
                    <TimelineGalleryEditorModal
                        data={timelineBlock.data as TimelineGalleryBlockData}
                        language={language}
                        availableLanguages={availableLanguages}
                        onChange={(data) => handleUpdateBlock(showTimelineEditorId, data)}
                        onClose={() => setShowTimelineEditorId(null)}
                    />
                );
            })()}

            {/* Map Editor Modal */}
            {showMapEditorId && (() => {
                const mapBlock = blocks.find(b => b.id === showMapEditorId);
                if (!mapBlock || mapBlock.type !== 'map') return null;
                return (
                    <MapEditorModal
                        data={mapBlock.data as MapBlockData}
                        language={language}
                        availableLanguages={availableLanguages}
                        onChange={(data) => handleUpdateBlock(showMapEditorId, data)}
                        onClose={() => setShowMapEditorId(null)}
                    />
                );
            })()}

            {/* Unsaved Changes Warning Modal */}
            {showUnsavedWarning && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-yellow-500/50 p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-yellow-500/10">
                                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Unsaved Changes</h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    You have unsaved changes
                                </p>
                            </div>
                        </div>

                        <p className="text-[var(--color-text-secondary)] mb-6">
                            Do you want to save your changes before closing?
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUnsavedWarning(false)}
                                className="flex-1 px-4 py-2.5 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDiscardChanges}
                                className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors font-medium"
                            >
                                Discard
                            </button>
                            <button
                                onClick={() => {
                                    handleSave();
                                    setShowUnsavedWarning(false);
                                }}
                                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-xl hover:bg-[var(--color-accent-primary)]/90 transition-colors font-medium flex items-center justify-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-accent-primary)]/30 p-6 w-full max-w-md shadow-2xl mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center mb-4">
                                <Save className="w-7 h-7 text-[var(--color-accent-primary)]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                                Save Changes
                            </h3>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                                Your changes are ready to be saved. What would you like to do next?
                            </p>
                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => {
                                        handleSave(false);
                                        setShowSaveModal(false);
                                    }}
                                    className="w-full px-4 py-3 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Save & Continue Editing
                                </button>
                                <button
                                    onClick={() => {
                                        handleSave(true);
                                        setShowSaveModal(false);
                                    }}
                                    className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Save & Exit
                                </button>
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="w-full px-4 py-3 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
