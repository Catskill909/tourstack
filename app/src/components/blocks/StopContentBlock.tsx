import { useState } from 'react';
import { Type, Image, Images, Music, Video, Quote, History, Columns, QrCode, Map as MapIcon, Play, ChevronRight, List, ScanLine, LayoutGrid, ZoomIn, Code } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContentBlock, ContentBlockType, TextBlockData, ImageBlockData, GalleryBlockData, TimelineGalleryBlockData, AudioBlockData, VideoBlockData, QuoteBlockData, PositioningBlockData, MapBlockData, ImageMapBlockData, TourBlockData, StopListBlockData, QRScannerBlockData, ComparisonBlockData, HtmlBlockData, Tour, Stop } from '../../types';
import { GalleryPreview } from './GalleryPreview';
import { TimelineGalleryPreview } from './TimelineGalleryPreview';
import { MapPreview } from './MapPreview';
import { ImageMapBlockPreview } from './ImageMapBlockPreview';
import { ImageMapMarkerPin } from './ImageMapMarkerPin';
import { StopListBlockPreview } from './StopListBlockPreview';
import { QRScannerBlockPreview } from './QRScannerBlockPreview';
import { ComparisonPreview } from './ComparisonPreview';
import { detectProvider, generateEmbedUrl } from '../../lib/embedProviders';
import { sanitizeHtml, extractIframeSrc } from '../../lib/htmlSanitizer';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';
import { ImageLightbox } from '../ui/ImageLightbox';
import fallbackImage from '../../assets/fallback.jpg';

export interface DisplaySettings {
    showTitles: boolean;
    showDescriptions: boolean;
}

interface StopContentBlockProps {
    block: ContentBlock;
    mode: 'view' | 'edit';
    language: string;
    deviceType?: 'phone' | 'tablet' | 'kiosk';
    tourData?: Tour; // For tour blocks that need parent tour info
    allStops?: Stop[]; // For stop list blocks
    currentStopId?: string; // ID of the stop containing this block (to exclude from stop lists)
    displaySettings?: DisplaySettings; // Control title/description visibility
    onNavigateToStop?: (stopId: string) => void; // For stop list navigation
    onEdit?: (block: ContentBlock) => void;
    onDelete?: (blockId: string) => void;
}

// Block type metadata
const BLOCK_ICONS: Record<ContentBlockType, LucideIcon> = {
    text: Type,
    image: Image,
    gallery: Images,
    timelineGallery: Music,
    audio: Music,
    video: Video,
    quote: Quote,
    timeline: History,
    comparison: Columns,
    positioning: QrCode,
    map: MapIcon,
    imageMap: LayoutGrid,
    tour: Play,
    stopList: List,
    qrScanner: ScanLine,
    html: Code,
};

const BLOCK_LABELS: Record<ContentBlockType, string> = {
    text: 'Text',
    image: 'Image',
    gallery: 'Gallery',
    timelineGallery: 'Timeline Gallery',
    audio: 'Audio',
    video: 'Video',
    quote: 'Quote',
    timeline: 'Timeline',
    comparison: 'Comparison',
    positioning: 'Positioning',
    map: 'Map',
    imageMap: 'Image Map',
    tour: 'Tour Intro',
    stopList: 'Stop List',
    qrScanner: 'QR Scanner',
    html: 'HTML / Embed',
};

function ImageBlockView({ data, language, mode, onNavigateToStop, deviceType = 'phone' }: { data: ImageBlockData; language: string; mode: 'view' | 'edit'; onNavigateToStop?: (stopId: string) => void; deviceType?: 'phone' | 'tablet' | 'kiosk' }) {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
    const caption = data.caption?.[language] || data.caption?.en;
    const credit = data.credit?.[language] || data.credit?.en;
    const altText = data.altText?.[language] || data.altText?.en || caption || '';
    const aspectClasses: Record<string, string> = {
        small: 'aspect-[16/9]',
        medium: 'aspect-square',
        large: 'aspect-[3/4]',
        full: '',
    };
    const isCropped = data.size !== 'full';
    const focalStyle = data.focalPoint && isCropped
        ? { objectPosition: `${data.focalPoint.x}% ${data.focalPoint.y}%` }
        : undefined;
    const hasHotspots = mode === 'view' && data.hotspots && data.hotspots.length > 0;
    // Full format breaks out of content padding for edge-to-edge display
    const paddingPx = deviceType === 'tablet' || deviceType === 'kiosk' ? 32 : 20; // px-8=32px, px-5=20px
    const fullBleedStyle = !isCropped ? {
        marginLeft: `-${paddingPx}px`,
        marginRight: `-${paddingPx}px`,
        width: `calc(100% + ${paddingPx * 2}px)`,
    } : undefined;

    function handleImageClick() {
        if (mode !== 'view') return;
        if (hasHotspots) {
            // If hotspots exist, clicking the image background dismisses active hotspot
            setActiveHotspot(null);
        } else {
            setLightboxOpen(true);
        }
    }

    function handleHotspotClick(e: React.MouseEvent, hotspotId: string) {
        e.stopPropagation();
        const hotspot = data.hotspots?.find(h => h.id === hotspotId);
        if (!hotspot) return;

        if (hotspot.action?.type === 'navigate' && hotspot.action.stopId && onNavigateToStop) {
            onNavigateToStop(hotspot.action.stopId);
        } else if (hotspot.action?.type === 'url' && hotspot.action.url) {
            window.open(hotspot.action.url, '_blank', 'noopener');
        } else {
            // Toggle tooltip
            setActiveHotspot(prev => prev === hotspotId ? null : hotspotId);
        }
    }

    return (
        <figure className="w-full" style={fullBleedStyle}>
            {data.url ? (
                <div
                    className={`overflow-hidden ${isCropped ? 'rounded-lg' : 'w-full'} relative group ${aspectClasses[data.size] || ''} ${mode === 'view' && !hasHotspots ? 'cursor-zoom-in' : ''}`}
                    onClick={handleImageClick}
                >
                    <img
                        src={data.url}
                        alt={altText}
                        className={`w-full ${isCropped ? 'h-full object-cover rounded-lg' : 'block'}`}
                        style={focalStyle}
                    />
                    {mode === 'view' && !hasHotspots && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-70 transition-opacity drop-shadow-lg" />
                        </div>
                    )}
                    {/* Hotspot pins */}
                    {hasHotspots && data.hotspots!.map(hotspot => (
                        <div
                            key={hotspot.id}
                            className="absolute z-10"
                            style={{
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
                                language={language}
                                selected={activeHotspot === hotspot.id}
                                showLabel={false}
                                onClick={(e) => handleHotspotClick(e, hotspot.id)}
                            />
                            {/* Tooltip */}
                            {activeHotspot === hotspot.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-48 z-20">
                                    <div className="bg-[#1f2937] text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                                        <p className="font-medium">{hotspot.label?.[language] || hotspot.label?.en || ''}</p>
                                    </div>
                                    <div className="w-2 h-2 bg-[#1f2937] rotate-45 mx-auto -mt-1" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="aspect-video bg-[var(--color-bg-hover)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)]">
                    <Image className="w-12 h-12" />
                </div>
            )}
            {caption && (
                <figcaption className="text-sm text-[var(--color-text-muted)] mt-2 text-center">{caption}</figcaption>
            )}
            {mode === 'view' && (
                <ImageLightbox
                    isOpen={lightboxOpen}
                    src={data.url}
                    alt={altText}
                    caption={caption}
                    credit={credit}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </figure>
    );
}

export function StopContentBlock({ block, mode, language, deviceType = 'phone', tourData, allStops, currentStopId, displaySettings, onNavigateToStop, onEdit, onDelete }: StopContentBlockProps) {
    const Icon = BLOCK_ICONS[block.type];
    const label = BLOCK_LABELS[block.type];

    // Display settings with defaults
    const showTitles = displaySettings?.showTitles ?? true;
    const showDescriptions = displaySettings?.showDescriptions ?? true;

    // Font size scaling for tablets
    const isTablet = deviceType === 'tablet' || deviceType === 'kiosk';
    const proseSize = isTablet ? 'prose-lg' : 'prose-base';

    // Render block header (title + image) if visible
    function renderBlockHeader(blockData: any) {
        // Skip tour blocks (they have their own header system)
        if (block.type === 'tour') return null;

        const showTitle = blockData.showTitle ?? false;
        const showBlockImage = blockData.showBlockImage ?? false;

        // If nothing to show, return null
        if (!showTitle && !showBlockImage) return null;

        const title = blockData.title?.[language] || blockData.title?.en || '';
        const blockImage = blockData.blockImage;

        return (
            <div className="space-y-3 mb-4">
                {/* Block Image FIRST */}
                {showBlockImage && blockImage?.url && (
                    <figure className="rounded-lg overflow-hidden">
                        <img
                            src={blockImage.url}
                            alt=""
                            className="w-full h-auto object-cover"
                            style={{ maxHeight: isTablet ? '400px' : '300px' }}
                        />
                        {blockImage.caption?.[language] && (
                            <figcaption className={`${isTablet ? 'text-sm' : 'text-xs'} text-[var(--color-text-muted)] mt-2 px-2`}>
                                {blockImage.caption[language]}
                            </figcaption>
                        )}
                    </figure>
                )}

                {/* Block Title SECOND */}
                {showTitle && title && (
                    <h3 className={`${isTablet ? 'text-2xl' : 'text-xl'} font-semibold text-[var(--color-text-primary)]`}>
                        {title}
                    </h3>
                )}
            </div>
        );
    }

    // Render functions for each block type
    function renderTextBlock(data: TextBlockData) {
        const content = data.content[language] || data.content.en || '';
        return (
            <>
                {renderBlockHeader(data)}
                <div className={`prose prose-invert max-w-none ${proseSize} ${data.style === 'callout' ? 'bg-[var(--color-accent-primary)]/10 p-4 rounded-lg border-l-4 border-[var(--color-accent-primary)]' : ''} ${data.style === 'sidebar' ? 'bg-[var(--color-bg-elevated)] p-4 rounded-lg' : ''}`}>
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            </>
        );
    }

    function renderImageBlock(data: ImageBlockData) {
        return (
            <>
                {renderBlockHeader(data)}
                <ImageBlockView data={data} language={language} mode={mode} onNavigateToStop={onNavigateToStop} deviceType={deviceType} />
            </>
        );
    }

    function renderGalleryBlock(data: GalleryBlockData) {
        return (
            <>
                {renderBlockHeader(data)}
                <GalleryPreview data={data} language={language} />
            </>
        );
    }

    function renderTimelineGalleryBlock(data: TimelineGalleryBlockData) {
        return (
            <>
                {renderBlockHeader(data)}
                <TimelineGalleryPreview data={data} language={language} deviceType={deviceType} />
            </>
        );
    }

    function renderAudioBlock(data: AudioBlockData) {
        const audioUrl = data.audioFiles[language] || data.audioFiles.en || '';
        const title = data.title[language] || data.title.en || 'Audio';
        const transcript = data.transcript?.[language] || data.transcript?.en;
        const size = data.size || 'large';
        // Block title takes precedence over player title
        const useBlockTitle = data.showTitle && data.title?.[language];
        const usePlayerTitle = size === 'large' && (data.showTitle ?? true) && showTitles && !useBlockTitle;
        return (
            <>
                {renderBlockHeader(data)}
                <div className="space-y-3">
                    {audioUrl ? (
                        <CustomAudioPlayer
                            src={audioUrl}
                            title={usePlayerTitle ? title : undefined}
                            size={size}
                            deviceType={deviceType}
                            autoplay={data.autoplay}
                            transcriptWords={data.transcriptWords}
                            transcript={data.transcript?.[language]}
                            showCaptions={data.showCaptions}
                        />
                    ) : (
                        <div className="text-[var(--color-text-muted)] text-sm">No audio file</div>
                    )}
                    {data.showTranscript && transcript && (
                        <div className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] p-3 rounded-lg max-h-32 overflow-y-auto border border-[var(--color-border-default)]">
                            {transcript}
                        </div>
                    )}
                </div>
            </>
        );
    }

    function renderVideoBlock(data: VideoBlockData) {
        const title = data.title[language] || data.title.en || 'Video';
        const useBuiltInTitle = showTitles && (data.showTitle ?? true) && !data.showTitle;
        return (
            <>
                {renderBlockHeader(data)}
                <div className="bg-[var(--color-bg-elevated)] rounded-lg overflow-hidden">
                    <div className="aspect-video bg-black flex items-center justify-center">
                        {data.videoUrl ? (
                            data.provider === 'youtube' ? (
                                <iframe
                                    src={data.videoUrl.replace('watch?v=', 'embed/')}
                                    className="w-full h-full"
                                    allowFullScreen
                                />
                            ) : (
                                <video controls className="w-full h-full" autoPlay={data.autoplay}>
                                    <source src={data.videoUrl} />
                                </video>
                            )
                        ) : (
                            <Video className="w-12 h-12 text-[var(--color-text-muted)]" />
                        )}
                    </div>
                    {useBuiltInTitle && (
                        <div className="p-3">
                            <h4 className="font-medium text-[var(--color-text-primary)]">{title}</h4>
                        </div>
                    )}
                </div>
            </>
        );
    }

    function renderQuoteBlock(data: QuoteBlockData) {
        const quote = data.quote[language] || data.quote.en || '';
        const author = data.author?.[language] || data.author?.en;
        const source = data.source?.[language] || data.source?.en;
        return (
            <>
                {renderBlockHeader(data)}
                <blockquote className={`border-l-4 border-[var(--color-accent-primary)] pl-4 py-2 ${data.style === 'highlighted' ? 'bg-[var(--color-accent-primary)]/10 pr-4 rounded-r-lg' : ''}`}>
                    <p className="text-lg italic text-[var(--color-text-primary)]">"{quote}"</p>
                    {(author || source) && (
                        <footer className="text-sm text-[var(--color-text-muted)] mt-2">
                            {author && <span className="font-medium">{author}</span>}
                            {author && source && ', '}
                            {source && <cite>{source}</cite>}
                        </footer>
                    )}
                </blockquote>
            </>
        );
    }

    function renderPositioningBlock(data: PositioningBlockData) {
        return (
            <>
                {renderBlockHeader(data)}
                <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 flex items-center gap-4">
                    <div className="bg-white p-2 rounded-lg">
                        {data.qrCodeDataUrl ? (
                            <img src={data.qrCodeDataUrl} alt="QR Code" className="w-24 h-24" />
                        ) : (
                            <QrCode className="w-24 h-24 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-medium text-[var(--color-text-primary)]">
                            {data.method.replace('_', ' ').toUpperCase()}
                        </h4>
                        {data.instructions && (
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                {data.instructions[language] || data.instructions.en}
                            </p>
                        )}
                    </div>
                </div>
            </>
        );
    }

    function renderQRScannerBlock(data: QRScannerBlockData) {
        if (mode === 'view') {
            return (
                <>
                    {renderBlockHeader(data)}
                    <QRScannerBlockPreview
                        data={data}
                        language={language}
                        tourId={tourData?.id}
                        tourSlug={tourData?.slug}
                        allStops={allStops}
                        deviceType={deviceType}
                        onNavigateToStop={onNavigateToStop}
                    />
                </>
            );
        }
        // Admin preview — show static placeholder
        return (
            <>
                {renderBlockHeader(data)}
                <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 flex items-center gap-4">
                    <div className="bg-gray-900 p-4 rounded-xl flex items-center justify-center w-20 h-20">
                        <ScanLine className="w-8 h-8 text-[var(--color-accent-primary)]" />
                    </div>
                    <div>
                        <h4 className="font-medium text-[var(--color-text-primary)]">
                            QR Scanner — {data.mode === 'navigate' ? 'Navigate' : data.mode === 'checkin' ? 'Check-in' : data.mode === 'scavenger' ? 'Scavenger Hunt' : 'Info Popup'}
                        </h4>
                        {data.promptText && (
                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                {data.promptText[language] || data.promptText.en}
                            </p>
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1 italic">
                            Camera scanner active in visitor view
                        </p>
                    </div>
                </div>
            </>
        );
    }

    function renderMapBlock(data: MapBlockData) {
        // Size options: small=150px, medium=250px, large=fills available (calc)
        const sizeStyles: Record<string, { height: string; minHeight: string }> = {
            small: { height: '150px', minHeight: '150px' },
            medium: { height: '250px', minHeight: '200px' },
            large: { height: 'calc(100vh - 200px)', minHeight: '400px' },
        };
        const size = data.size || 'medium';
        const style = sizeStyles[size] || sizeStyles.medium;
        const isInteractive = mode === 'view' && (data.allowInteraction !== false);

        return (
            <>
                {renderBlockHeader(data)}
                <div className="w-full" style={style}>
                    <MapPreview
                        data={data}
                        language={language}
                        deviceType={deviceType}
                        interactive={isInteractive}
                        className="w-full h-full"
                        onStopNavigate={mode === 'view' ? onNavigateToStop : undefined}
                    />
                </div>
            </>
        );
    }

    function renderTourBlock(data: TourBlockData) {
        // Get display values (override or tour data)
        const title = data.titleOverride?.[language] || data.titleOverride?.en || tourData?.title?.[language] || tourData?.title?.en || 'Welcome';
        const description = data.descriptionOverride?.[language] || data.descriptionOverride?.en || tourData?.description?.[language] || tourData?.description?.en || '';
        const heroImage = data.imageOverride || tourData?.heroImage || fallbackImage;
        const badge = data.badge?.[language] || data.badge?.en || 'FEATURED EXHIBIT';
        const ctaText = data.ctaText?.[language] || data.ctaText?.en || 'Begin Tour';

        // Stronger gradient for text readability - only behind text area
        const overlayOpacity = (data.overlayOpacity || 80) / 100; // Default higher for better contrast

        // Architectural CTA button styles - minimal, clean
        const ctaClasses = data.ctaStyle === 'primary'
            ? 'bg-white text-neutral-900 hover:bg-neutral-100'
            : data.ctaStyle === 'secondary'
                ? 'bg-neutral-900/80 text-white backdrop-blur-sm hover:bg-neutral-900/90'
                : data.ctaStyle === 'outline'
                    ? 'border border-white/80 text-white hover:bg-white/10'
                    : 'text-white/90 hover:text-white hover:bg-white/5';

        // CTA button click handler
        const handleCtaClick = () => {
            if (data.ctaAction === 'external-url' && data.ctaExternalUrl) {
                window.open(data.ctaExternalUrl, '_blank', 'noopener,noreferrer');
            } else if (data.ctaAction === 'specific-stop' && data.ctaTargetStopId && onNavigateToStop) {
                onNavigateToStop(data.ctaTargetStopId);
            } else if (data.ctaAction === 'next-stop' && onNavigateToStop && allStops && currentStopId) {
                // Find current stop index and navigate to next
                const currentIndex = allStops.findIndex(s => s.id === currentStopId);
                if (currentIndex >= 0 && currentIndex < allStops.length - 1) {
                    onNavigateToStop(allStops[currentIndex + 1].id);
                }
            }
        };

        return (
            <div className="relative w-full h-full" style={{ minHeight: 'inherit' }}>
                {/* Full-bleed Hero Image - fills entire container */}
                <img
                    src={heroImage}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                        objectPosition: data.imagePosition || 'center',
                        objectFit: data.imageFit || 'cover'
                    }}
                />

                {/* Gradient Overlay - behind text area, darker for readability */}
                {data.layout === 'hero-bottom' || !data.layout ? (
                    <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-none"
                        style={{
                            height: '70%',
                            background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity}) 0%, rgba(0,0,0,${overlayOpacity * 0.85}) 30%, rgba(0,0,0,${overlayOpacity * 0.4}) 65%, transparent 100%)`
                        }}
                    />
                ) : data.layout === 'hero-center' ? (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: `rgba(0,0,0,${overlayOpacity * 0.8})` }}
                    />
                ) : null}

                {/* Content - Architectural Information System styling */}
                <div className={`absolute inset-0 flex flex-col ${data.layout === 'hero-bottom' || !data.layout ? 'justify-end' :
                    data.layout === 'hero-center' ? 'justify-center items-center text-center' :
                        'justify-end'
                    } ${isTablet ? 'p-12' : 'p-6'}`}>
                    {data.layout === 'hero-overlay' ? (
                        <div className={`bg-neutral-900/90 backdrop-blur-xl rounded-sm ${isTablet ? 'p-10' : 'p-6'} mx-auto max-w-[90%] border border-white/10`}>
                            {data.showBadge && badge && (
                                <span className={`inline-block px-2 py-0.5 ${isTablet ? 'text-sm' : 'text-[10px]'} font-medium tracking-[0.2em] uppercase text-white/70 border border-white/20 mb-4`}>
                                    {badge}
                                </span>
                            )}
                            {showTitles && (
                                <h2 className={`${isTablet ? 'text-5xl' : 'text-2xl'} font-light tracking-tight text-white mb-4`}>
                                    {title}
                                </h2>
                            )}
                            {showDescriptions && description && (
                                <p className={`${isTablet ? 'text-xl' : 'text-sm'} text-white/60 mb-6 line-clamp-3 font-light leading-relaxed`}>
                                    {description}
                                </p>
                            )}
                            <button onClick={handleCtaClick} className={`flex items-center gap-2 ${isTablet ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'} bg-white text-neutral-900 font-medium tracking-wide transition-all hover:bg-neutral-100`}>
                                {ctaText}
                                <ChevronRight className={isTablet ? 'w-6 h-6' : 'w-4 h-4'} />
                            </button>
                        </div>
                    ) : (
                        <div className={`${data.layout === 'hero-center' ? 'text-center' : ''} ${isTablet ? 'max-w-3xl' : 'max-w-xl'}`}>
                            {data.showBadge && badge && (
                                <span className={`inline-block px-3 py-1 ${isTablet ? 'text-sm' : 'text-[10px]'} font-medium tracking-[0.2em] uppercase text-white/80 border border-white/30 mb-4`}>
                                    {badge}
                                </span>
                            )}
                            {showTitles && (
                                <h2 className={`${isTablet ? 'text-6xl' : 'text-3xl'} font-light tracking-tight text-white mb-4`}>
                                    {title}
                                </h2>
                            )}
                            {showDescriptions && description && (
                                <p className={`${isTablet ? 'text-2xl' : 'text-base'} text-white/70 mb-8 line-clamp-3 font-light leading-relaxed`}>
                                    {description}
                                </p>
                            )}
                            <button onClick={handleCtaClick} className={`inline-flex items-center gap-3 ${isTablet ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'} font-medium tracking-wide transition-all ${ctaClasses}`}>
                                {ctaText}
                                <ChevronRight className={isTablet ? 'w-6 h-6' : 'w-4 h-4'} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderHtmlBlock(data: HtmlBlockData) {
        // Determine what to render
        let iframeSrc = '';
        let rawHtml = '';

        if (data.mode === 'url' && data.url) {
            const provider = data.provider || detectProvider(data.url);
            iframeSrc = generateEmbedUrl(data.url, provider);
        } else if (data.mode === 'embed' && data.embedCode) {
            const src = extractIframeSrc(data.embedCode);
            if (src) {
                iframeSrc = src;
            } else {
                rawHtml = sanitizeHtml(data.embedCode, true);
            }
        } else if (data.mode === 'html') {
            rawHtml = sanitizeHtml(data.htmlContent?.[language] || data.htmlContent?.en || '', false, true);
        }

        const sizing = data.sizing || 'fill';

        // Aspect ratio class (only used when sizing is 'auto' with a specific ratio)
        const aspectClass = (sizing === 'auto' && data.aspectRatio !== 'auto') ? ({
            '16:9': 'aspect-video',
            '4:3': 'aspect-[4/3]',
            '1:1': 'aspect-square',
            '9:16': 'aspect-[9/16]',
            '21:9': 'aspect-[21/9]',
        }[data.aspectRatio] || '') : '';

        // Container height based on sizing mode
        let containerStyle: React.CSSProperties = {};
        let containerClass = '';

        if (sizing === 'fill') {
            // Fill all available space — uses flex-1 + h-full inherited from parent
            containerClass = 'w-full h-full';
            containerStyle = { minHeight: 'inherit', flex: 1 };
        } else if (sizing === 'fixed') {
            // Fixed pixel height
            containerStyle = { height: `${data.height || 500}px` };
        }
        // sizing === 'auto': no height set, aspect ratio or content determines height

        // Max width — 'full' uses full-bleed calc() pattern like Image block
        const isFull = data.maxWidth === 'full';
        const maxWidthMap: Record<string, string> = {
            small: 'max-w-sm mx-auto',
            medium: 'max-w-xl mx-auto',
            large: 'w-full',
        };
        const maxWidthClass = isFull ? '' : (maxWidthMap[data.maxWidth || 'large'] || 'w-full');

        // Full-bleed inline style (same pattern as Image block full format)
        const fullBleedStyle: React.CSSProperties = isFull ? { marginLeft: '-24px', width: 'calc(100% + 48px)' } : {};
        const roundedClass = (!isFull && data.borderRadius) ? 'rounded-lg' : '';

        return (
            <div
                className={`${sizing === 'fill' ? 'flex flex-col w-full h-full' : ''}`}
                style={sizing === 'fill' ? { minHeight: 'inherit' } : {}}
            >
                {renderBlockHeader(data)}
                <div
                    className={`${maxWidthClass} ${containerClass} ${sizing === 'fill' ? 'flex-1' : ''}`}
                    style={{ ...fullBleedStyle, ...containerStyle }}
                >
                    {iframeSrc ? (
                        <div
                            className={`relative overflow-hidden ${aspectClass} ${roundedClass} bg-black ${sizing === 'fill' ? 'w-full h-full' : sizing === 'fixed' ? 'w-full h-full' : ''}`}
                            style={sizing === 'fill' ? { minHeight: 'inherit' } : {}}
                        >
                            <iframe
                                src={iframeSrc}
                                className={`border-0 ${sizing === 'fill' || sizing === 'fixed' ? 'absolute inset-0 w-full h-full' : 'w-full h-full'}`}
                                style={{
                                    pointerEvents: data.allowInteraction !== false ? 'auto' : 'none',
                                    ...(sizing === 'auto' && !aspectClass ? { minHeight: '300px' } : {}),
                                }}
                                sandbox="allow-scripts allow-same-origin allow-popups"
                                loading={data.lazyLoad !== false ? 'lazy' : 'eager'}
                                allowFullScreen
                            />
                        </div>
                    ) : rawHtml ? (
                        <iframe
                            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;min-height:100%}body{font-family:system-ui,-apple-system,sans-serif;color:#e5e5e5;background:#111;overflow-x:hidden}a{color:#60a5fa}</style></head><body>${rawHtml}</body></html>`}
                            className={`border-0 w-full ${roundedClass} ${sizing === 'fill' ? 'h-full' : ''}`}
                            style={{
                                background: 'transparent',
                                pointerEvents: data.allowInteraction !== false ? 'auto' : 'none',
                                ...(sizing === 'auto' && !aspectClass ? { minHeight: '300px' } : {}),
                                ...(sizing === 'fill' ? { minHeight: 'inherit' } : {}),
                                ...(sizing === 'fixed' ? { height: '100%' } : {}),
                            }}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-32 bg-[var(--color-bg-elevated)] rounded-lg">
                            <div className="text-center text-[var(--color-text-muted)]">
                                <Code className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs">No embed content configured</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    function renderBlock() {
        switch (block.type) {
            case 'text':
                return renderTextBlock(block.data as TextBlockData);
            case 'image':
                return renderImageBlock(block.data as ImageBlockData);
            case 'gallery':
                return renderGalleryBlock(block.data as GalleryBlockData);
            case 'audio':
                return renderAudioBlock(block.data as AudioBlockData);
            case 'video':
                return renderVideoBlock(block.data as VideoBlockData);
            case 'quote':
                return renderQuoteBlock(block.data as QuoteBlockData);
            case 'timelineGallery':
                return renderTimelineGalleryBlock(block.data as TimelineGalleryBlockData);
            case 'positioning':
                return renderPositioningBlock(block.data as PositioningBlockData);
            case 'map':
                return renderMapBlock(block.data as MapBlockData);
            case 'imageMap': {
                const imData = block.data as ImageMapBlockData;
                // On tablet/kiosk, always fill width; on phone, respect size setting
                const imSizeClass = isTablet ? 'w-full' : ({
                    small: 'max-w-xs',
                    medium: 'max-w-md',
                    large: 'max-w-2xl',
                    full: 'w-full',
                } as Record<string, string>)[imData.size || 'large'] || 'max-w-2xl';
                return (
                    <>
                        {renderBlockHeader(imData)}
                        <div className={imSizeClass}>
                            <ImageMapBlockPreview
                                data={imData}
                                language={language}
                                deviceType={deviceType}
                                allStops={allStops}
                                onNavigateToStop={mode === 'view' ? onNavigateToStop : undefined}
                            />
                        </div>
                    </>
                );
            }
            case 'tour':
                return renderTourBlock(block.data as TourBlockData);
            case 'stopList':
                return (
                    <>
                        {renderBlockHeader(block.data as StopListBlockData)}
                        <StopListBlockPreview
                            data={block.data as StopListBlockData}
                            language={language}
                            deviceType={deviceType}
                            allStops={allStops}
                            currentStopId={currentStopId}
                            tourData={tourData}
                            onNavigateToStop={mode === 'view' ? onNavigateToStop : undefined}
                        />
                    </>
                );
            case 'comparison': {
                const compData = block.data as ComparisonBlockData;
                return (
                    <>
                        {renderBlockHeader(compData)}
                        <ComparisonPreview data={compData} language={language} />
                    </>
                );
            }
            case 'qrScanner':
                return renderQRScannerBlock(block.data as QRScannerBlockData);
            case 'html':
                return renderHtmlBlock(block.data as HtmlBlockData);
            default:
                return (
                    <div className="text-[var(--color-text-muted)] text-sm">
                        Unsupported block type: {block.type}
                    </div>
                );
        }
    }

    if (mode === 'view') {
        // For tour blocks and HTML fill blocks, pass through height to fill container
        const isTourBlock = block.type === 'tour';
        const isHtmlFill = block.type === 'html' && ((block.data as HtmlBlockData).sizing || 'fill') === 'fill';
        const fillsContainer = isTourBlock || isHtmlFill;
        return <div className={`content-block ${fillsContainer ? 'h-full flex flex-col' : ''}`} style={fillsContainer ? { minHeight: '100%' } : {}}>{renderBlock()}</div>;
    }

    // Edit mode - show with controls
    return (
        <div className="content-block-edit group relative border border-[var(--color-border-default)] rounded-lg hover:border-[var(--color-accent-primary)]/50 transition-colors">
            {/* Block header */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] rounded-t-lg">
                <Icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">{label}</span>
                <div className="flex-1" />
                {onEdit && (
                    <button
                        onClick={() => onEdit(block)}
                        className="text-xs px-2 py-1 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 rounded"
                    >
                        Edit
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(block.id)}
                        className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded"
                    >
                        Delete
                    </button>
                )}
            </div>
            {/* Block content */}
            <div className="p-4">{renderBlock()}</div>
        </div>
    );
}

export { BLOCK_ICONS, BLOCK_LABELS };
