import { useState, useCallback } from 'react';
import { GripVertical, X, Check, LayoutGrid, LayoutList, Rows3, Maximize2 } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import type { StopListBlockData, StopListLayout, Stop, Tour, StopImageData } from '../../types';
import type { TranslationProvider } from '../../services/translationService';
import fallbackImage from '../../assets/fallback.jpg';

interface StopListBlockEditorProps {
    data: StopListBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    tourData?: Tour;
    allStops?: Stop[];
    onChange: (data: StopListBlockData) => void;
}

const LAYOUT_OPTIONS: { value: StopListLayout; label: string; description: string; icon: typeof LayoutGrid }[] = [
    { value: 'card', label: 'Card', description: 'Image thumbnail with info', icon: LayoutGrid },
    { value: 'large-card', label: 'Large Card', description: 'Full-width image above text', icon: Rows3 },
    { value: 'compact-list', label: 'Compact', description: 'Small thumbnails, dense list', icon: LayoutList },
    { value: 'full-bleed', label: 'Full Bleed', description: 'Edge-to-edge cinematic', icon: Maximize2 },
];

function getStopImageUrl(stop: Stop): string {
    if (typeof stop.image === 'object' && (stop.image as StopImageData)?.url) {
        return (stop.image as StopImageData).url;
    }
    if (typeof stop.image === 'string' && stop.image) return stop.image;
    return fallbackImage;
}

function getStopTitle(stop: Stop, language: string): string {
    if (typeof stop.title === 'object') {
        return stop.title[language] || stop.title.en || Object.values(stop.title)[0] || 'Untitled';
    }
    return String(stop.title || 'Untitled');
}

export function StopListBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    allStops = [],
    onChange,
}: StopListBlockEditorProps) {
    const [activeHeadingLang, setActiveHeadingLang] = useState(language);
    const [activeSubheadingLang, setActiveSubheadingLang] = useState(language);
    const [activeCtaLang, setActiveCtaLang] = useState(language);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const primaryLang = availableLanguages[0] || 'en';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    const headingContent = data.heading?.[activeHeadingLang] || '';
    const subheadingContent = data.subheading?.[activeSubheadingLang] || '';
    const ctaContent = data.ctaText?.[activeCtaLang] || '';

    const selectedIds = new Set(data.stopIds || []);

    const toggleStop = useCallback((stopId: string) => {
        const current = data.stopIds || [];
        if (current.includes(stopId)) {
            onChange({ ...data, stopIds: current.filter(id => id !== stopId) });
        } else {
            onChange({ ...data, stopIds: [...current, stopId] });
        }
    }, [data, onChange]);

    const removeStop = useCallback((stopId: string) => {
        onChange({ ...data, stopIds: (data.stopIds || []).filter(id => id !== stopId) });
    }, [data, onChange]);

    const selectAll = useCallback(() => {
        onChange({ ...data, stopIds: allStops.map(s => s.id) });
    }, [data, allStops, onChange]);

    const deselectAll = useCallback(() => {
        onChange({ ...data, stopIds: [] });
    }, [data, onChange]);

    // Drag reorder for selected stops
    const handleDragStart = (index: number) => {
        setDragIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (index: number) => {
        if (dragIndex === null || dragIndex === index) {
            setDragIndex(null);
            setDragOverIndex(null);
            return;
        }
        const ids = [...(data.stopIds || [])];
        const [moved] = ids.splice(dragIndex, 1);
        ids.splice(index, 0, moved);
        onChange({ ...data, stopIds: ids });
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    // Resolve selected stops in display order
    const selectedStops = (data.stopIds || [])
        .map(id => allStops.find(s => s.id === id))
        .filter(Boolean) as Stop[];

    return (
        <div className="space-y-6">
            {/* Block Metadata */}
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={language}
                availableLanguages={availableLanguages}
                translationProvider={translationProvider}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {/* Template Selector */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Layout Template
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {LAYOUT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onChange({ ...data, layout: option.value })}
                                className={`p-3 rounded-lg border text-left transition-all ${data.layout === option.value
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                    : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className={`w-4 h-4 ${data.layout === option.value ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{option.label}</span>
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)]">{option.description}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Stop Selector */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Select Stops ({selectedIds.size} of {allStops.length})
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={selectAll}
                            className="text-xs text-[var(--color-accent-primary)] hover:underline"
                        >
                            Select All
                        </button>
                        <button
                            type="button"
                            onClick={deselectAll}
                            className="text-xs text-[var(--color-text-muted)] hover:underline"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>
                <div className="max-h-48 overflow-y-auto border border-[var(--color-border-default)] rounded-lg divide-y divide-[var(--color-border-default)]">
                    {allStops.map((stop, index) => {
                        const isSelected = selectedIds.has(stop.id);
                        return (
                            <button
                                key={stop.id}
                                type="button"
                                onClick={() => toggleStop(stop.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${isSelected
                                    ? 'bg-[var(--color-accent-primary)]/10'
                                    : 'hover:bg-[var(--color-bg-hover)]'
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${isSelected
                                    ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)]'
                                    }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <img
                                    src={getStopImageUrl(stop)}
                                    alt=""
                                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <span className="text-xs text-[var(--color-accent-primary)] font-semibold tracking-wider uppercase">
                                        Stop {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p className="text-sm text-[var(--color-text-primary)] truncate">
                                        {getStopTitle(stop, language)}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                    {allStops.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
                            No stops in this tour yet
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Stops (drag to reorder) */}
            {selectedStops.length > 0 && (
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Display Order (drag to reorder)
                    </label>
                    <div className="space-y-1">
                        {selectedStops.map((stop, index) => (
                            <div
                                key={stop.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={() => handleDrop(index)}
                                onDragEnd={handleDragEnd}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${dragOverIndex === index
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                    : 'border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]'
                                    } ${dragIndex === index ? 'opacity-50' : ''}`}
                            >
                                <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
                                <span className="text-xs text-[var(--color-accent-primary)] font-semibold w-5">{index + 1}</span>
                                <img
                                    src={getStopImageUrl(stop)}
                                    alt=""
                                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                                />
                                <span className="text-sm text-[var(--color-text-primary)] flex-1 truncate">
                                    {getStopTitle(stop, language)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeStop(stop.id)}
                                    className="p-1 text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 rounded flex-shrink-0"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Heading */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Heading
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.showHeading ?? true}
                            onChange={(e) => onChange({ ...data, showHeading: e.target.checked })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">Show</span>
                    </label>
                </div>
                {(data.showHeading ?? true) && (
                    <>
                        {availableLanguages.length > 1 && (
                            <div className="flex flex-wrap items-center gap-3 pb-2">
                                <div className="flex-1 min-w-0">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeHeadingLang}
                                        onChange={setActiveHeadingLang}
                                        contentMap={data.heading || {}}
                                        size="sm"
                                        showStatus={true}
                                    />
                                </div>
                                <MagicTranslateButton
                                    sourceText={data.heading?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={(translations) => onChange({ ...data, heading: { ...data.heading, ...translations } })}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!(data.heading?.[primaryLang] || '').trim()}
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            value={headingContent}
                            onChange={(e) => onChange({ ...data, heading: { ...data.heading, [activeHeadingLang]: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Tour Stops"
                        />
                    </>
                )}
            </div>

            {/* Subheading */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Subheading
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.showSubheading ?? true}
                            onChange={(e) => onChange({ ...data, showSubheading: e.target.checked })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">Show</span>
                    </label>
                </div>
                {(data.showSubheading ?? true) && (
                    <>
                        {availableLanguages.length > 1 && (
                            <div className="flex flex-wrap items-center gap-3 pb-2">
                                <div className="flex-1 min-w-0">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeSubheadingLang}
                                        onChange={setActiveSubheadingLang}
                                        contentMap={data.subheading || {}}
                                        size="sm"
                                        showStatus={true}
                                    />
                                </div>
                                <MagicTranslateButton
                                    sourceText={data.subheading?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={(translations) => onChange({ ...data, subheading: { ...data.subheading, ...translations } })}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!(data.subheading?.[primaryLang] || '').trim()}
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            value={subheadingContent}
                            onChange={(e) => onChange({ ...data, subheading: { ...data.subheading, [activeSubheadingLang]: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="12 Stops • 45 Minutes"
                        />
                    </>
                )}
            </div>

            {/* Display Options */}
            <div className="border border-[var(--color-border-default)] rounded-lg p-4 space-y-3">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Display Options
                </label>
                {[
                    { key: 'showStopNumbers' as const, label: 'Show stop numbers', default: true },
                    { key: 'showDuration' as const, label: 'Show duration', default: true },
                    { key: 'showDescription' as const, label: 'Show description', default: true },
                ].map(({ key, label, default: defaultVal }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data[key] ?? defaultVal}
                            onChange={(e) => onChange({ ...data, [key]: e.target.checked })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
                    </label>
                ))}
            </div>

            {/* CTA Button */}
            <div className="border border-[var(--color-border-default)] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        CTA Button
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.showCta ?? true}
                            onChange={(e) => onChange({ ...data, showCta: e.target.checked })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">Show</span>
                    </label>
                </div>
                {(data.showCta ?? true) && (
                    <>
                        {availableLanguages.length > 1 && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeCtaLang}
                                        onChange={setActiveCtaLang}
                                        contentMap={data.ctaText || {}}
                                        size="sm"
                                        showStatus={true}
                                    />
                                </div>
                                <MagicTranslateButton
                                    sourceText={data.ctaText?.[primaryLang] || ''}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={(translations) => onChange({ ...data, ctaText: { ...data.ctaText, ...translations } })}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!(data.ctaText?.[primaryLang] || '').trim()}
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            value={ctaContent}
                            onChange={(e) => onChange({ ...data, ctaText: { ...data.ctaText, [activeCtaLang]: e.target.value } })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="Start Tour"
                        />
                    </>
                )}
            </div>
        </div>
    );
}
