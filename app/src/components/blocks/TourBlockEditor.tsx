import { useState, useEffect } from 'react';
import { Upload, X, Play, ExternalLink, ChevronRight } from 'lucide-react';
import type { TourBlockData, Tour, Stop } from '../../types';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';
import type { TranslationProvider } from '../../services/translationService';
import fallbackImage from '../../assets/fallback.jpg';

interface TourBlockEditorProps {
    data: TourBlockData;
    /** Current editing language */
    language: string;
    /** All available languages for the tour */
    availableLanguages?: string[];
    /** Translation provider to use */
    translationProvider?: TranslationProvider;
    /** Tour data for defaults */
    tourData?: Tour;
    /** All stops for navigation target selection */
    allStops?: Stop[];
    onChange: (data: TourBlockData) => void;
}

const LAYOUT_OPTIONS: { value: TourBlockData['layout']; label: string; description: string }[] = [
    { value: 'hero-bottom', label: 'Bottom Aligned', description: 'Content at bottom with gradient' },
    { value: 'hero-center', label: 'Centered', description: 'Content centered over image' },
    { value: 'hero-overlay', label: 'Card Overlay', description: 'Content in floating card' },
];

const CTA_STYLE_OPTIONS: { value: TourBlockData['ctaStyle']; label: string }[] = [
    { value: 'primary', label: 'Primary' },
    { value: 'secondary', label: 'Secondary' },
    { value: 'outline', label: 'Outline' },
    { value: 'ghost', label: 'Ghost' },
];

const CTA_ACTION_OPTIONS: { value: TourBlockData['ctaAction']; label: string; icon: typeof Play }[] = [
    { value: 'next-stop', label: 'Go to Next Stop', icon: ChevronRight },
    { value: 'specific-stop', label: 'Go to Specific Stop', icon: Play },
    { value: 'external-url', label: 'Open External URL', icon: ExternalLink },
];

const IMAGE_POSITION_OPTIONS: { value: TourBlockData['imagePosition']; label: string }[] = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'bottom', label: 'Bottom' },
];

export function TourBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    tourData,
    allStops = [],
    onChange,
}: TourBlockEditorProps) {
    // Title language state
    const [activeTitleLang, setActiveTitleLang] = useState(language);
    const [titleContent, setTitleContent] = useState(data.titleOverride?.[activeTitleLang] || '');

    // Description language state
    const [activeDescLang, setActiveDescLang] = useState(language);
    const [descContent, setDescContent] = useState(data.descriptionOverride?.[activeDescLang] || '');

    // Badge language state
    const [activeBadgeLang, setActiveBadgeLang] = useState(language);
    const [badgeContent, setBadgeContent] = useState(data.badge?.[activeBadgeLang] || '');

    // CTA language state
    const [activeCtaLang, setActiveCtaLang] = useState(language);
    const [ctaContent, setCtaContent] = useState(data.ctaText?.[activeCtaLang] || '');

    const [isDragOver, setIsDragOver] = useState(false);

    // Update content when active language changes
    useEffect(() => {
        setTitleContent(data.titleOverride?.[activeTitleLang] || '');
    }, [activeTitleLang, data.titleOverride]);

    useEffect(() => {
        setDescContent(data.descriptionOverride?.[activeDescLang] || '');
    }, [activeDescLang, data.descriptionOverride]);

    useEffect(() => {
        setBadgeContent(data.badge?.[activeBadgeLang] || '');
    }, [activeBadgeLang, data.badge]);

    useEffect(() => {
        setCtaContent(data.ctaText?.[activeCtaLang] || '');
    }, [activeCtaLang, data.ctaText]);

    // Get display values (override or tour data)
    const displayTitle = data.titleOverride?.[language] || tourData?.title?.[language] || tourData?.title?.en || '';
    const displayDescription = data.descriptionOverride?.[language] || tourData?.description?.[language] || tourData?.description?.en || '';
    const displayImage = data.imageOverride || tourData?.heroImage || fallbackImage;

    // Handlers for multilingual fields
    function handleTitleChange(value: string) {
        setTitleContent(value);
        onChange({
            ...data,
            titleOverride: {
                ...data.titleOverride,
                [activeTitleLang]: value,
            },
        });
    }

    function handleTitleTranslations(translations: { [lang: string]: string }) {
        onChange({
            ...data,
            titleOverride: {
                ...data.titleOverride,
                ...translations,
            },
        });
    }

    function handleDescChange(value: string) {
        setDescContent(value);
        onChange({
            ...data,
            descriptionOverride: {
                ...data.descriptionOverride,
                [activeDescLang]: value,
            },
        });
    }

    function handleDescTranslations(translations: { [lang: string]: string }) {
        onChange({
            ...data,
            descriptionOverride: {
                ...data.descriptionOverride,
                ...translations,
            },
        });
    }

    function handleBadgeChange(value: string) {
        setBadgeContent(value);
        onChange({
            ...data,
            badge: {
                ...data.badge,
                [activeBadgeLang]: value,
            },
        });
    }

    function handleBadgeTranslations(translations: { [lang: string]: string }) {
        onChange({
            ...data,
            badge: {
                ...data.badge,
                ...translations,
            },
        });
    }

    function handleCtaChange(value: string) {
        setCtaContent(value);
        onChange({
            ...data,
            ctaText: {
                ...data.ctaText,
                [activeCtaLang]: value,
            },
        });
    }

    function handleCtaTranslations(translations: { [lang: string]: string }) {
        onChange({
            ...data,
            ctaText: {
                ...data.ctaText,
                ...translations,
            },
        });
    }

    // Image handling
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    }

    function processFile(file: File) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            onChange({ ...data, imageOverride: url });
        };
        reader.readAsDataURL(file);
    }

    function handleRemoveImage() {
        onChange({ ...data, imageOverride: undefined });
    }

    function useDefaultsFromTour() {
        onChange({
            ...data,
            titleOverride: undefined,
            descriptionOverride: undefined,
            imageOverride: undefined,
        });
    }

    // Get primary language text for translations
    const primaryLang = availableLanguages[0] || 'en';
    const primaryTitle = data.titleOverride?.[primaryLang] || '';
    const primaryDesc = data.descriptionOverride?.[primaryLang] || '';
    const primaryBadge = data.badge?.[primaryLang] || '';
    const primaryCta = data.ctaText?.[primaryLang] || '';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);

    return (
        <div className="space-y-6">
            {/* Live Preview - Architectural Information System */}
            <div className="relative aspect-[9/16] max-h-[400px] overflow-hidden border border-neutral-800 bg-neutral-950">
                <img
                    src={displayImage}
                    alt="Tour hero"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        objectPosition: data.imagePosition || 'center',
                        objectFit: data.imageFit || 'cover'
                    }}
                />
                {/* Gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: data.layout === 'hero-bottom'
                            ? `linear-gradient(to top, rgba(17,17,17,${(data.overlayOpacity || 60) / 100}) 0%, rgba(17,17,17,${(data.overlayOpacity || 60) / 100 * 0.6}) 40%, transparent 100%)`
                            : data.layout === 'hero-center'
                                ? `rgba(17,17,17,${(data.overlayOpacity || 60) / 100 * 0.7})`
                                : 'transparent',
                    }}
                />
                {/* Content preview - Architectural styling */}
                <div className={`absolute inset-0 flex flex-col ${data.layout === 'hero-bottom' ? 'justify-end' :
                    data.layout === 'hero-center' ? 'justify-center items-center text-center' :
                        'justify-end'
                    } p-5`}>
                    {data.layout === 'hero-overlay' && (
                        <div className="bg-neutral-900/90 backdrop-blur-xl p-5 mx-auto max-w-[90%] border border-white/10">
                            {data.showBadge && (data.badge?.[language] || 'FEATURED EXHIBIT') && (
                                <span className="inline-block px-2 py-0.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/70 border border-white/20 mb-3">
                                    {data.badge?.[language] || 'FEATURED EXHIBIT'}
                                </span>
                            )}
                            <h2 className="text-lg font-light tracking-tight text-white mb-2">
                                {displayTitle || 'Tour Title'}
                            </h2>
                            <p className="text-xs text-white/60 mb-4 line-clamp-2 font-light leading-relaxed">
                                {displayDescription || 'Tour description will appear here...'}
                            </p>
                            <button className="flex items-center gap-2 px-4 py-2 bg-white text-neutral-900 text-xs font-medium tracking-wide">
                                {data.ctaText?.[language] || 'Begin Tour'}
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                    {data.layout !== 'hero-overlay' && (
                        <div className={`${data.layout === 'hero-center' ? 'text-center' : ''}`}>
                            {data.showBadge && (
                                <span className="inline-block px-2 py-0.5 text-[9px] font-medium tracking-[0.2em] uppercase text-white/80 border border-white/30 mb-3">
                                    {data.badge?.[language] || 'FEATURED EXHIBIT'}
                                </span>
                            )}
                            <h2 className="text-xl font-light tracking-tight text-white mb-2">
                                {displayTitle || 'Tour Title'}
                            </h2>
                            <p className="text-xs text-white/70 mb-4 line-clamp-2 font-light leading-relaxed">
                                {displayDescription || 'Tour description will appear here...'}
                            </p>
                            <button className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide ${data.ctaStyle === 'primary' ? 'bg-white text-neutral-900' :
                                    data.ctaStyle === 'secondary' ? 'bg-neutral-900/80 text-white backdrop-blur-sm' :
                                        data.ctaStyle === 'outline' ? 'border border-white/80 text-white' :
                                            'text-white/90'
                                }`}>
                                {data.ctaText?.[language] || 'Begin Tour'}
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Layout Selection */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Layout Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {LAYOUT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange({ ...data, layout: option.value })}
                            className={`p-3 rounded-lg border text-left transition-all ${data.layout === option.value
                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                                }`}
                        >
                            <div className="text-sm font-medium text-[var(--color-text-primary)]">{option.label}</div>
                            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{option.description}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Title Override */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Title Override
                    </label>
                    {tourData?.title && (
                        <button
                            type="button"
                            onClick={useDefaultsFromTour}
                            className="text-xs text-[var(--color-accent-primary)] hover:underline"
                        >
                            Use Tour Defaults
                        </button>
                    )}
                </div>
                {availableLanguages.length > 1 && (
                    <div className="flex flex-wrap items-center gap-3 pb-2">
                        <div className="flex-1 min-w-0">
                            <LanguageSwitcher
                                availableLanguages={availableLanguages}
                                activeLanguage={activeTitleLang}
                                onChange={setActiveTitleLang}
                                contentMap={data.titleOverride || {}}
                                size="sm"
                                showStatus={true}
                            />
                        </div>
                        <MagicTranslateButton
                            sourceText={primaryTitle}
                            sourceLang={primaryLang}
                            targetLangs={otherLangs}
                            onTranslate={handleTitleTranslations}
                            provider={translationProvider}
                            size="sm"
                            disabled={!primaryTitle.trim()}
                        />
                    </div>
                )}
                <input
                    type="text"
                    value={titleContent}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder={tourData?.title?.[activeTitleLang] || tourData?.title?.en || 'Enter custom title...'}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Leave empty to use tour's title
                </p>
            </div>

            {/* Description Override */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Description Override
                </label>
                {availableLanguages.length > 1 && (
                    <div className="flex flex-wrap items-center gap-3 pb-2">
                        <div className="flex-1 min-w-0">
                            <LanguageSwitcher
                                availableLanguages={availableLanguages}
                                activeLanguage={activeDescLang}
                                onChange={setActiveDescLang}
                                contentMap={data.descriptionOverride || {}}
                                size="sm"
                                showStatus={true}
                            />
                        </div>
                        <MagicTranslateButton
                            sourceText={primaryDesc}
                            sourceLang={primaryLang}
                            targetLangs={otherLangs}
                            onTranslate={handleDescTranslations}
                            provider={translationProvider}
                            size="sm"
                            disabled={!primaryDesc.trim()}
                        />
                    </div>
                )}
                <textarea
                    value={descContent}
                    onChange={(e) => handleDescChange(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                    placeholder={tourData?.description?.[activeDescLang] || tourData?.description?.en || 'Enter custom description...'}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Leave empty to use tour's description
                </p>
            </div>

            {/* Image Override */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Hero Image Override
                </label>
                {data.imageOverride ? (
                    <div className="relative inline-block">
                        <img src={data.imageOverride} alt="Custom hero" className="max-h-32 rounded-lg" />
                        <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                            : 'border-[var(--color-border-default)]'
                            }`}
                    >
                        <Upload className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-muted)]" />
                        <p className="text-sm text-[var(--color-text-muted)] mb-2">
                            Drag image here, or
                        </p>
                        <label className="inline-block px-3 py-1.5 text-sm bg-[var(--color-accent-primary)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent-primary)]/90">
                            Browse
                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                            Uses tour's hero image if not set
                        </p>
                    </div>
                )}
            </div>

            {/* Image Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Image Position
                    </label>
                    <div className="flex gap-1">
                        {IMAGE_POSITION_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onChange({ ...data, imagePosition: option.value })}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${data.imagePosition === option.value
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Image Fit
                    </label>
                    <div className="flex gap-1">
                        {(['cover', 'contain'] as const).map((fit) => (
                            <button
                                key={fit}
                                type="button"
                                onClick={() => onChange({ ...data, imageFit: fit })}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors capitalize ${data.imageFit === fit
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                            >
                                {fit}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overlay Opacity */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Overlay Darkness: {data.overlayOpacity || 70}%
                </label>
                <input
                    type="range"
                    min={0}
                    max={100}
                    value={data.overlayOpacity || 70}
                    onChange={(e) => onChange({ ...data, overlayOpacity: parseInt(e.target.value) })}
                    className="w-full accent-[var(--color-accent-primary)]"
                />
                <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                    <span>None</span>
                    <span>Dark</span>
                </div>
            </div>

            {/* Badge Settings */}
            <div className="border border-[var(--color-border-default)] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                        Badge / Label
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.showBadge || false}
                            onChange={(e) => onChange({ ...data, showBadge: e.target.checked })}
                            className="rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">Show Badge</span>
                    </label>
                </div>
                {data.showBadge && (
                    <div className="space-y-3">
                        {availableLanguages.length > 1 && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-0">
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeBadgeLang}
                                        onChange={setActiveBadgeLang}
                                        contentMap={data.badge || {}}
                                        size="sm"
                                        showStatus={true}
                                    />
                                </div>
                                <MagicTranslateButton
                                    sourceText={primaryBadge}
                                    sourceLang={primaryLang}
                                    targetLangs={otherLangs}
                                    onTranslate={handleBadgeTranslations}
                                    provider={translationProvider}
                                    size="sm"
                                    disabled={!primaryBadge.trim()}
                                />
                            </div>
                        )}
                        <input
                            type="text"
                            value={badgeContent}
                            onChange={(e) => handleBadgeChange(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="FEATURED EXHIBIT"
                        />
                        <p className="text-xs text-[var(--color-text-muted)]">
                            Uses minimal border-style badge for clean architectural aesthetic
                        </p>
                    </div>
                )}
            </div>

            {/* CTA Button Settings */}
            <div className="border border-[var(--color-border-default)] rounded-lg p-4 space-y-4">
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Call-to-Action Button
                </label>

                {/* CTA Text */}
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
                            sourceText={primaryCta}
                            sourceLang={primaryLang}
                            targetLangs={otherLangs}
                            onTranslate={handleCtaTranslations}
                            provider={translationProvider}
                            size="sm"
                            disabled={!primaryCta.trim()}
                        />
                    </div>
                )}
                <input
                    type="text"
                    value={ctaContent}
                    onChange={(e) => handleCtaChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder="Begin Guided Tour"
                />

                {/* CTA Style */}
                <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-2">Button Style</label>
                    <div className="flex gap-1">
                        {CTA_STYLE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => onChange({ ...data, ctaStyle: option.value })}
                                className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${data.ctaStyle === option.value
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CTA Action */}
                <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-2">Button Action</label>
                    <div className="space-y-2">
                        {CTA_ACTION_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <label
                                    key={option.value}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.ctaAction === option.value
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                        : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="ctaAction"
                                        value={option.value}
                                        checked={data.ctaAction === option.value}
                                        onChange={() => onChange({ ...data, ctaAction: option.value })}
                                        className="text-[var(--color-accent-primary)]"
                                    />
                                    <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    <span className="text-sm text-[var(--color-text-primary)]">{option.label}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Specific Stop Selector */}
                {data.ctaAction === 'specific-stop' && allStops.length > 0 && (
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-2">Select Target Stop</label>
                        <select
                            value={data.ctaTargetStopId || ''}
                            onChange={(e) => onChange({ ...data, ctaTargetStopId: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                        >
                            <option value="">Select a stop...</option>
                            {allStops.map((stop, index) => (
                                <option key={stop.id} value={stop.id}>
                                    {index + 1}. {typeof stop.title === 'object' ? (stop.title[language] || stop.title.en) : stop.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {/* External URL */}
                {data.ctaAction === 'external-url' && (
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-2">External URL</label>
                        <input
                            type="url"
                            value={data.ctaExternalUrl || ''}
                            onChange={(e) => onChange({ ...data, ctaExternalUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                            placeholder="https://..."
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
