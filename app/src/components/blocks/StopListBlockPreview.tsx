import { useMemo } from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import type { StopListBlockData, Stop, Tour, StopImageData, TimelineGalleryBlockData } from '../../types';
import fallbackImage from '../../assets/fallback.jpg';

interface StopListBlockPreviewProps {
    data: StopListBlockData;
    language: string;
    deviceType?: 'phone' | 'tablet';
    allStops?: Stop[];
    tourData?: Tour;
    onNavigateToStop?: (stopId: string) => void;
}

function getStopImageUrl(stop: Stop): string {
    if (typeof stop.image === 'object' && (stop.image as StopImageData)?.url) {
        return (stop.image as StopImageData).url;
    }
    if (typeof stop.image === 'string' && stop.image) return stop.image;
    return fallbackImage;
}

function getLocalizedText(field: string | Record<string, string> | null | undefined, language: string): string {
    if (!field) return '';
    if (typeof field === 'string') return field;
    return field[language] || field.en || Object.values(field)[0] || '';
}

function getStopDurationMinutes(stop: Stop): number | null {
    const blocks = stop.contentBlocks || [];
    let totalSeconds = 0;
    let hasAudio = false;
    for (const block of blocks) {
        if (block.type === 'timelineGallery') {
            const dur = (block.data as TimelineGalleryBlockData).audioDuration;
            if (dur) { totalSeconds += dur; hasAudio = true; }
        }
        if (block.type === 'audio') {
            // Audio blocks store per-language files; estimate from any available
            hasAudio = true;
        }
    }
    if (!hasAudio) return null;
    return Math.max(1, Math.round(totalSeconds / 60));
}

export function StopListBlockPreview({
    data,
    language,
    deviceType = 'phone',
    allStops = [],
    onNavigateToStop,
}: StopListBlockPreviewProps) {
    const isTablet = deviceType === 'tablet';

    const resolvedStops = useMemo(() => {
        if (!data.stopIds?.length) return [];
        return data.stopIds
            .map(id => allStops.find(s => s.id === id))
            .filter(Boolean) as Stop[];
    }, [allStops, data.stopIds]);

    const heading = getLocalizedText(data.heading, language) || 'Tour Stops';
    const subheading = getLocalizedText(data.subheading, language);
    const ctaText = getLocalizedText(data.ctaText, language) || 'Start Tour';
    const showHeading = data.showHeading ?? true;
    const showSubheading = data.showSubheading ?? true;
    const showStopNumbers = data.showStopNumbers ?? true;
    const showDuration = data.showDuration ?? true;
    const showDescription = data.showDescription ?? true;
    const showCta = data.showCta ?? true;

    const handleStopClick = (stopId: string) => {
        if (onNavigateToStop) {
            onNavigateToStop(stopId);
        }
    };

    if (resolvedStops.length === 0) {
        return (
            <div className="py-8 text-center text-[var(--color-text-muted)]">
                <p className="text-sm">No stops selected</p>
            </div>
        );
    }

    // Determine grid columns based on layout and device
    // Uses isTablet prop — CSS breakpoints don't work in scaled preview frames
    const getGridClass = () => {
        if (data.layout === 'compact-list') return 'grid grid-cols-1 gap-0';
        if (isTablet) return 'grid grid-cols-2 gap-3';
        return 'grid grid-cols-1 gap-3';
    };

    return (
        <div className="py-2">
            {/* Header */}
            {(showHeading || showSubheading) && (
                <div className="mb-3">
                    {showHeading && (
                        <h2 className={`font-bold text-[var(--color-text-primary)] ${isTablet ? 'text-3xl' : 'text-2xl'}`}>
                            {heading}
                        </h2>
                    )}
                    {showSubheading && subheading && (
                        <p className={`text-[var(--color-text-secondary)] mt-1 ${isTablet ? 'text-base' : 'text-sm'}`}>
                            {subheading}
                        </p>
                    )}
                </div>
            )}

            {/* Stop List */}
            <div className={getGridClass()}>
                {resolvedStops.map((stop, index) => (
                    <StopCard
                        key={stop.id}
                        stop={stop}
                        index={index}
                        layout={data.layout}
                        language={language}
                        isTablet={isTablet}
                        showStopNumbers={showStopNumbers}
                        showDuration={showDuration}
                        showDescription={showDescription}
                        isClickable={!!onNavigateToStop}
                        onClick={() => handleStopClick(stop.id)}
                    />
                ))}
            </div>

            {/* CTA Button */}
            {showCta && (
                <div className="mt-4">
                    <button
                        onClick={() => resolvedStops[0] && handleStopClick(resolvedStops[0].id)}
                        className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors ${isTablet ? 'py-4 text-lg' : 'py-3 text-base'}`}
                    >
                        {ctaText}
                    </button>
                </div>
            )}
        </div>
    );
}

// Individual stop card component
interface StopCardProps {
    stop: Stop;
    index: number;
    layout: StopListBlockData['layout'];
    language: string;
    isTablet: boolean;
    showStopNumbers: boolean;
    showDuration: boolean;
    showDescription: boolean;
    isClickable: boolean;
    onClick: () => void;
}

function StopCard({
    stop,
    index,
    layout,
    language,
    isTablet,
    showStopNumbers,
    showDuration,
    showDescription,
    isClickable,
    onClick,
}: StopCardProps) {
    const title = getLocalizedText(stop.title, language) || 'Untitled';
    const description = getLocalizedText(stop.description, language);
    const imageUrl = getStopImageUrl(stop);
    const duration = getStopDurationMinutes(stop);
    const stopNumber = String(index + 1).padStart(2, '0');

    const Wrapper = isClickable ? 'button' : 'div';
    const wrapperProps = isClickable ? { onClick, type: 'button' as const } : {};

    switch (layout) {
        case 'large-card':
            return (
                <Wrapper
                    {...wrapperProps}
                    className={`block w-full text-left rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] transition-all ${isClickable ? 'hover:border-[var(--color-accent-primary)]/50 hover:shadow-lg cursor-pointer' : ''}`}
                >
                    <div className="aspect-[16/10] overflow-hidden">
                        <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                    <div className={`${isTablet ? 'px-4 py-3' : 'px-3 py-2.5'}`}>
                        {showStopNumbers && (
                            <span className={`text-[var(--color-accent-primary)] font-semibold tracking-[0.15em] uppercase ${isTablet ? 'text-xs' : 'text-[10px]'}`}>
                                Stop {stopNumber}
                            </span>
                        )}
                        <h3 className={`font-semibold text-[var(--color-text-primary)] ${isTablet ? 'text-xl mt-0.5' : 'text-lg mt-0.5'}`}>
                            {title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                            {showDescription && description && (
                                <p className="text-[var(--color-text-secondary)] text-sm truncate flex-1">{description}</p>
                            )}
                            {showDuration && duration && (
                                <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs flex-shrink-0">
                                    <Clock className="w-3 h-3" />
                                    {duration}M
                                </span>
                            )}
                        </div>
                    </div>
                </Wrapper>
            );

        case 'compact-list':
            return (
                <Wrapper
                    {...wrapperProps}
                    className={`w-full flex items-center gap-3 px-3 py-3 border-b border-[var(--color-border-default)] transition-colors ${isClickable ? 'hover:bg-[var(--color-bg-hover)] cursor-pointer' : ''}`}
                >
                    <img src={imageUrl} alt={title} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        {showStopNumbers && (
                            <span className="text-[var(--color-accent-primary)] text-[10px] font-semibold tracking-[0.15em] uppercase">
                                Stop {stopNumber}
                            </span>
                        )}
                        <p className={`font-medium text-[var(--color-text-primary)] truncate ${isTablet ? 'text-base' : 'text-sm'}`}>
                            {title}
                        </p>
                        {showDescription && description && (
                            <p className="text-[var(--color-text-secondary)] text-xs truncate">{description}</p>
                        )}
                    </div>
                    {showDuration && duration && (
                        <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs flex-shrink-0">
                            <Clock className="w-3 h-3" />
                            {duration} MINS
                        </span>
                    )}
                    {isClickable && <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />}
                </Wrapper>
            );

        case 'full-bleed':
            return (
                <Wrapper
                    {...wrapperProps}
                    className={`block w-full text-left rounded-xl overflow-hidden relative transition-all ${isClickable ? 'hover:shadow-lg cursor-pointer' : ''}`}
                >
                    <div className="aspect-[3/4] relative">
                        <img src={imageUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className={`absolute bottom-0 left-0 right-0 ${isTablet ? 'p-5' : 'p-4'}`}>
                            {showStopNumbers && (
                                <span className={`text-[var(--color-accent-primary)] font-semibold tracking-[0.15em] uppercase ${isTablet ? 'text-xs' : 'text-[10px]'}`}>
                                    Stop {stopNumber}
                                </span>
                            )}
                            <h3 className={`font-bold text-white ${isTablet ? 'text-xl mt-1' : 'text-lg mt-0.5'}`}>
                                {title}
                            </h3>
                            {showDescription && description && (
                                <p className="text-white/70 text-sm mt-0.5 line-clamp-1">{description}</p>
                            )}
                            {showDuration && duration && (
                                <span className="flex items-center gap-1 text-white/60 text-xs mt-1">
                                    <Clock className="w-3 h-3" />
                                    {duration} MINS
                                </span>
                            )}
                        </div>
                    </div>
                </Wrapper>
            );

        // Default: 'card' layout
        default:
            return (
                <Wrapper
                    {...wrapperProps}
                    className={`w-full flex items-start gap-3 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] overflow-hidden transition-all ${isTablet ? 'p-3' : 'p-2.5'} ${isClickable ? 'hover:border-[var(--color-accent-primary)]/50 hover:shadow-lg cursor-pointer text-left' : ''}`}
                >
                    <div className="flex-1 min-w-0">
                        {showStopNumbers && (
                            <span className={`text-[var(--color-accent-primary)] font-semibold tracking-[0.15em] uppercase ${isTablet ? 'text-xs' : 'text-[10px]'}`}>
                                Stop {stopNumber}
                            </span>
                        )}
                        <h3 className={`font-semibold text-[var(--color-text-primary)] ${isTablet ? 'text-lg mt-1' : 'text-base mt-0.5'}`}>
                            {title}
                        </h3>
                        {showDescription && description && (
                            <p className={`text-[var(--color-text-secondary)] mt-0.5 line-clamp-2 ${isTablet ? 'text-sm' : 'text-xs'}`}>
                                {description}
                            </p>
                        )}
                        {showDuration && duration && (
                            <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-xs mt-2">
                                <Clock className="w-3 h-3" />
                                {duration} MINS
                            </span>
                        )}
                    </div>
                    <img
                        src={imageUrl}
                        alt={title}
                        className={`rounded-lg object-cover flex-shrink-0 ${isTablet ? 'w-24 h-24' : 'w-20 h-20'}`}
                    />
                </Wrapper>
            );
    }
}
