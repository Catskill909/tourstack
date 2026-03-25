import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Plus, ExternalLink, Navigation, MessageSquare, Languages, Loader2, Save, Check } from 'lucide-react';
import type { ImageHotspot, ImageMapIcon, Stop } from '../../types';
import { ImageMapMarkerPin } from './ImageMapMarkerPin';
import { ColorPicker } from '../ui/ColorPicker';
import { translateText, type TranslationProvider } from '../../services/translationService';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';

const ICON_OPTIONS: { value: ImageMapIcon; label: string; icon: string }[] = [
    { value: 'pin', label: 'Pin', icon: '📍' },
    { value: 'dot', label: 'Dot', icon: '⚫' },
    { value: 'number', label: 'Number', icon: '#' },
    { value: 'star', label: 'Star', icon: '⭐' },
    { value: 'info', label: 'Info', icon: 'ℹ️' },
    { value: 'accessibility', label: 'Accessible', icon: '♿' },
    { value: 'restroom', label: 'Restroom', icon: '🚻' },
    { value: 'stairs', label: 'Stairs', icon: '🪜' },
    { value: 'elevator', label: 'Elevator', icon: '🛗' },
    { value: 'exit', label: 'Exit', icon: '🚪' },
    { value: 'cafe', label: 'Café', icon: '☕' },
    { value: 'gift-shop', label: 'Gift Shop', icon: '🎁' },
    { value: 'ticket', label: 'Tickets', icon: '🎫' },
    { value: 'camera', label: 'Photo Spot', icon: '📷' },
    { value: 'audio-guide', label: 'Audio Guide', icon: '🎧' },
    { value: 'parking', label: 'Parking', icon: '🅿️' },
];

interface ImageHotspotEditorProps {
    imageUrl: string;
    hotspots: ImageHotspot[];
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    allStops?: Stop[];
    onSave?: (shouldClose: boolean) => void;
    onChange: (hotspots: ImageHotspot[]) => void;
    onClose: () => void;
}

export function ImageHotspotEditor({ imageUrl, hotspots, language, availableLanguages = ['en'], translationProvider = 'libretranslate', allStops = [], onSave, onChange, onClose }: ImageHotspotEditorProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [isTranslatingAll, setIsTranslatingAll] = useState(false);
    const [translateStatus, setTranslateStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [activeLanguage, setActiveLanguage] = useState(language);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const selectedHotspot = hotspots.find(h => h.id === selectedId);

    // Sync activeLanguage when prop changes
    useEffect(() => {
        setActiveLanguage(language);
    }, [language]);

    const handleImageClick = useCallback((e: React.MouseEvent) => {
        if (!imageContainerRef.current) return;
        if ((e.target as HTMLElement).closest('[data-hotspot]')) return;

        const rect = imageContainerRef.current.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

        const newHotspot: ImageHotspot = {
            id: crypto.randomUUID(),
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y)),
            label: { [activeLanguage]: `Point ${hotspots.length + 1}` },
            icon: 'pin',
            action: { type: 'tooltip' },
        };
        onChange([...hotspots, newHotspot]);
        setSelectedId(newHotspot.id);
    }, [hotspots, activeLanguage, onChange]);

    function handleHotspotMouseDown(e: React.MouseEvent, id: string) {
        e.stopPropagation();
        setSelectedId(id);
        setDraggingId(id);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!imageContainerRef.current) return;
            const rect = imageContainerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100)));
            const y = Math.max(0, Math.min(100, Math.round(((moveEvent.clientY - rect.top) / rect.height) * 100)));
            onChange(hotspots.map(h => h.id === id ? { ...h, x, y } : h));
        };

        const handleMouseUp = () => {
            setDraggingId(null);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    function updateHotspot(id: string, updates: Partial<ImageHotspot>) {
        onChange(hotspots.map(h => h.id === id ? { ...h, ...updates } : h));
    }

    function deleteHotspot(id: string) {
        onChange(hotspots.filter(h => h.id !== id));
        if (selectedId === id) setSelectedId(null);
    }

    // Translation helpers
    const primaryLang = availableLanguages[0] || 'en';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    // Build aggregated content map across all hotspots for language pill status
    const aggregatedContentMap: { [lang: string]: string } = {};
    for (const lang of availableLanguages) {
        const hotspotsWithSource = hotspots.filter(h => h.label?.[primaryLang]?.trim());
        if (hotspotsWithSource.length === 0) {
            // No hotspots have source text — nothing to translate
            continue;
        }
        const allHaveTranslation = hotspotsWithSource.every(h => h.label?.[lang]?.trim());
        if (allHaveTranslation) {
            aggregatedContentMap[lang] = 'yes';
        }
    }

    function handleLabelTranslations(translations: { [lang: string]: string }) {
        if (!selectedHotspot) return;
        updateHotspot(selectedHotspot.id, {
            label: { ...selectedHotspot.label, ...translations }
        });
    }

    async function handleTranslateAllLabels() {
        if (otherLangs.length === 0 || hotspots.length === 0) return;

        setIsTranslatingAll(true);
        setTranslateStatus('idle');
        try {
            const updatedHotspots = [...hotspots];
            for (let i = 0; i < updatedHotspots.length; i++) {
                const hotspot = updatedHotspots[i];
                const sourceText = hotspot.label?.[primaryLang] || hotspot.label?.['en'];
                if (!sourceText?.trim()) continue;

                const newLabel = { ...hotspot.label };
                for (const lang of otherLangs) {
                    try {
                        const translated = await translateText(sourceText, primaryLang, lang);
                        newLabel[lang] = translated;
                    } catch (error) {
                        console.error(`Failed to translate hotspot "${sourceText}" to ${lang}:`, error);
                    }
                }
                updatedHotspots[i] = { ...hotspot, label: newLabel };
            }
            onChange(updatedHotspots);
            setIsTranslatingAll(false);
            setTranslateStatus('success');
            setTimeout(() => setTranslateStatus('idle'), 3000);
        } catch (error) {
            console.error('Translation failed:', error);
            setIsTranslatingAll(false);
            setTranslateStatus('error');
            setTimeout(() => setTranslateStatus('idle'), 3000);
        }
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex flex-col bg-[var(--color-bg-primary)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-default)]">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Edit Hotspots</h2>
                    <span className="text-sm text-[var(--color-text-muted)]">Click image to add</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Translate All button */}
                    {availableLanguages.length > 1 && hotspots.length > 0 && (
                        <button
                            type="button"
                            onClick={handleTranslateAllLabels}
                            disabled={isTranslatingAll}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                                translateStatus === 'success'
                                    ? 'bg-green-500 text-white'
                                    : translateStatus === 'error'
                                    ? 'bg-red-500/80 text-white'
                                    : isTranslatingAll
                                    ? 'bg-[var(--color-accent-primary)]/50 text-white cursor-wait'
                                    : 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20'
                            }`}
                        >
                            {isTranslatingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : translateStatus === 'success' ? <Check className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
                            <span>{isTranslatingAll ? 'Translating...' : translateStatus === 'success' ? 'Done' : 'Translate All'}</span>
                        </button>
                    )}
                    {/* Save button with dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowSaveMenu(!showSaveMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white rounded-lg font-medium transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                        {showSaveMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSaveMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 z-20 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl shadow-2xl overflow-hidden min-w-[220px]">
                                    <button
                                        onClick={() => {
                                            if (onSave) onSave(false);
                                            setShowSaveMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                    >
                                        <Save className="w-4 h-4 text-[var(--color-accent-primary)]" />
                                        Save & Continue Editing
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onSave) onSave(true);
                                            onClose();
                                            setShowSaveMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors border-t border-[var(--color-border-default)]"
                                    >
                                        <X className="w-4 h-4 text-green-500" />
                                        Save & Exit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    </button>
                </div>
            </div>

            {/* Language pills */}
            {availableLanguages.length > 1 && (
                <div className="px-4 py-2 border-b border-[var(--color-border-default)]">
                    <LanguageSwitcher
                        availableLanguages={availableLanguages}
                        activeLanguage={activeLanguage}
                        onChange={setActiveLanguage}
                        contentMap={aggregatedContentMap}
                        size="sm"
                        showStatus={true}
                    />
                </div>
            )}

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Image area */}
                <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
                    <div
                        ref={imageContainerRef}
                        className="relative cursor-crosshair select-none"
                        onClick={handleImageClick}
                    >
                        <img
                            src={imageUrl}
                            alt=""
                            className="max-w-full max-h-[70vh] rounded-lg"
                            draggable={false}
                        />
                        {/* Render hotspot pins — always visible */}
                        {hotspots.map(hotspot => (
                            <div
                                key={hotspot.id}
                                data-hotspot
                                style={{
                                    position: 'absolute',
                                    left: `${hotspot.x}%`,
                                    top: `${hotspot.y}%`,
                                }}
                            >
                                <ImageMapMarkerPin
                                    marker={{
                                        id: hotspot.id,
                                        x: hotspot.x,
                                        y: hotspot.y,
                                        label: hotspot.label,
                                        icon: hotspot.icon || 'pin',
                                        color: hotspot.color,
                                    }}
                                    language={activeLanguage}
                                    selected={selectedId === hotspot.id}
                                    dragging={draggingId === hotspot.id}
                                    showLabel={true}
                                    labelsPosition="below"
                                    onMouseDown={(e) => handleHotspotMouseDown(e, hotspot.id)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedId(hotspot.id); }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-80 border-l border-[var(--color-border-default)] overflow-y-auto flex flex-col">
                    {/* Hotspot list — always visible at top */}
                    <div className="p-3 border-b border-[var(--color-border-default)]">
                        <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                            Hotspots ({hotspots.length})
                        </h3>
                        {hotspots.length === 0 ? (
                            <div className="text-center py-4">
                                <Plus className="w-6 h-6 mx-auto mb-1 text-[var(--color-text-muted)]" />
                                <p className="text-xs text-[var(--color-text-muted)]">Click image to add</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5 max-h-40 overflow-y-auto">
                                {hotspots.map(hotspot => {
                                    const iconOpt = ICON_OPTIONS.find(o => o.value === (hotspot.icon || 'pin'));
                                    const isSelected = selectedId === hotspot.id;
                                    return (
                                        <button
                                            key={hotspot.id}
                                            onClick={() => setSelectedId(isSelected ? null : hotspot.id)}
                                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-left text-sm ${
                                                isSelected
                                                    ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)] ring-1 ring-[var(--color-accent-primary)]/30'
                                                    : 'hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                                            }`}
                                        >
                                            <span className="text-xs shrink-0">{iconOpt?.icon || '📍'}</span>
                                            <span className="truncate">
                                                {hotspot.label?.[activeLanguage] || hotspot.label?.en || 'Untitled'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Edit panel — shows when a hotspot is selected */}
                    {selectedHotspot ? (
                        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Edit Hotspot</h3>
                                <button
                                    onClick={() => deleteHotspot(selectedHotspot.id)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete hotspot"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Label */}
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)]">
                                        Label ({activeLanguage.toUpperCase()})
                                    </label>
                                    {availableLanguages.length > 1 && (
                                        <MagicTranslateButton
                                            sourceText={selectedHotspot.label?.[primaryLang] || ''}
                                            sourceLang={primaryLang}
                                            targetLangs={otherLangs}
                                            onTranslate={handleLabelTranslations}
                                            provider={translationProvider}
                                            size="sm"
                                            disabled={!selectedHotspot.label?.[primaryLang]?.trim()}
                                        />
                                    )}
                                </div>
                                <input
                                    type="text"
                                    value={selectedHotspot.label?.[activeLanguage] || ''}
                                    onChange={(e) => updateHotspot(selectedHotspot.id, {
                                        label: { ...selectedHotspot.label, [activeLanguage]: e.target.value }
                                    })}
                                    className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="Hotspot label..."
                                />
                            </div>

                            {/* Icon picker */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Icon</label>
                                <div className="grid grid-cols-5 gap-1">
                                    {ICON_OPTIONS.map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => updateHotspot(selectedHotspot.id, { icon: opt.value })}
                                            className={`p-1.5 rounded-lg text-center text-sm transition-colors ${
                                                (selectedHotspot.icon || 'pin') === opt.value
                                                    ? 'bg-[var(--color-accent-primary)]/20 ring-1 ring-[var(--color-accent-primary)]'
                                                    : 'hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                            title={opt.label}
                                        >
                                            {opt.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color picker */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Color</label>
                                <ColorPicker
                                    value={selectedHotspot.color || '#D4A574'}
                                    onChange={(color) => updateHotspot(selectedHotspot.id, { color })}
                                />
                            </div>

                            {/* Action type */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Action</label>
                                <div className="flex gap-1">
                                    {([
                                        { type: 'tooltip' as const, icon: MessageSquare, label: 'Tooltip' },
                                        { type: 'navigate' as const, icon: Navigation, label: 'Go to Stop' },
                                        { type: 'url' as const, icon: ExternalLink, label: 'Open URL' },
                                    ]).map(({ type, icon: Icon, label }) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => updateHotspot(selectedHotspot.id, {
                                                action: { ...selectedHotspot.action, type }
                                            })}
                                            className={`flex-1 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                                                selectedHotspot.action?.type === type
                                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Navigate - stop picker */}
                            {selectedHotspot.action?.type === 'navigate' && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Target Stop</label>
                                    <select
                                        value={selectedHotspot.action?.stopId || ''}
                                        onChange={(e) => updateHotspot(selectedHotspot.id, {
                                            action: { ...selectedHotspot.action!, stopId: e.target.value }
                                        })}
                                        className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    >
                                        <option value="">Select a stop...</option>
                                        {allStops.map(stop => (
                                            <option key={stop.id} value={stop.id}>
                                                {stop.title?.[activeLanguage] || stop.title?.en || stop.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* URL input */}
                            {selectedHotspot.action?.type === 'url' && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">URL</label>
                                    <input
                                        type="url"
                                        value={selectedHotspot.action?.url || ''}
                                        onChange={(e) => updateHotspot(selectedHotspot.id, {
                                            action: { ...selectedHotspot.action!, url: e.target.value }
                                        })}
                                        className="w-full px-2 py-1.5 text-sm bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-4">
                            <p className="text-sm text-[var(--color-text-muted)] text-center">
                                Select a hotspot to edit, or click on the image to add one
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
