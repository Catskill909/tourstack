import { Type, Image, Images, Music, Video, Quote, History, Columns, QrCode, Map as MapIcon, Play, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContentBlock, ContentBlockType, TextBlockData, ImageBlockData, GalleryBlockData, TimelineGalleryBlockData, AudioBlockData, VideoBlockData, QuoteBlockData, PositioningBlockData, MapBlockData, TourBlockData, Tour } from '../../types';
import { GalleryPreview } from './GalleryPreview';
import { TimelineGalleryPreview } from './TimelineGalleryPreview';
import { MapPreview } from './MapPreview';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';
import fallbackImage from '../../assets/fallback.jpg';

export interface DisplaySettings {
    showTitles: boolean;
    showDescriptions: boolean;
}

interface StopContentBlockProps {
    block: ContentBlock;
    mode: 'view' | 'edit';
    language: string;
    deviceType?: 'phone' | 'tablet';
    tourData?: Tour; // For tour blocks that need parent tour info
    displaySettings?: DisplaySettings; // Control title/description visibility
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
    tour: Play,
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
    tour: 'Tour Intro',
};

export function StopContentBlock({ block, mode, language, deviceType = 'phone', tourData, displaySettings, onEdit, onDelete }: StopContentBlockProps) {
    const Icon = BLOCK_ICONS[block.type];
    const label = BLOCK_LABELS[block.type];

    // Display settings with defaults
    const showTitles = displaySettings?.showTitles ?? true;
    const showDescriptions = displaySettings?.showDescriptions ?? true;

    // Font size scaling for tablets
    const isTablet = deviceType === 'tablet';
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
        const caption = data.caption?.[language] || data.caption?.en;
        const sizeClasses = {
            small: 'max-w-xs',
            medium: 'max-w-md',
            large: 'max-w-2xl',
            full: 'w-full',
        };
        return (
            <>
                {renderBlockHeader(data)}
                <figure className={sizeClasses[data.size]}>
                    {data.url ? (
                        <img src={data.url} alt="" className="rounded-lg w-full" />
                    ) : (
                        <div className="aspect-video bg-[var(--color-bg-hover)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)]">
                            <Image className="w-12 h-12" />
                        </div>
                    )}
                    {caption && (
                        <figcaption className="text-sm text-[var(--color-text-muted)] mt-2 text-center">{caption}</figcaption>
                    )}
                </figure>
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

    function renderMapBlock(data: MapBlockData) {
        // Size options: small=150px, medium=250px, large=fills available (calc)
        const sizeStyles: Record<string, { height: string; minHeight: string }> = {
            small: { height: '150px', minHeight: '150px' },
            medium: { height: '250px', minHeight: '200px' },
            large: { height: 'calc(100vh - 200px)', minHeight: '400px' },
        };
        const size = data.size || 'medium';
        const style = sizeStyles[size] || sizeStyles.medium;

        return (
            <>
                {renderBlockHeader(data)}
                <div className="w-full" style={style}>
                    <MapPreview
                        data={data}
                        language={language}
                        deviceType={deviceType}
                        interactive={false}
                        className="w-full h-full"
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

                {/* Gradient Overlay - ONLY behind text area at bottom, much darker */}
                {data.layout === 'hero-bottom' || !data.layout ? (
                    <div
                        className="absolute bottom-0 left-0 right-0 pointer-events-none"
                        style={{
                            height: '55%',
                            background: `linear-gradient(to top, rgba(0,0,0,${overlayOpacity}) 0%, rgba(0,0,0,${overlayOpacity * 0.7}) 35%, rgba(0,0,0,0.2) 70%, transparent 100%)`
                        }}
                    />
                ) : data.layout === 'hero-center' ? (
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: `rgba(0,0,0,${overlayOpacity * 0.6})` }}
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
                            <button className={`flex items-center gap-2 ${isTablet ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'} bg-white text-neutral-900 font-medium tracking-wide transition-all hover:bg-neutral-100`}>
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
                            <button className={`inline-flex items-center gap-3 ${isTablet ? 'px-8 py-4 text-lg' : 'px-5 py-2.5 text-sm'} font-medium tracking-wide transition-all ${ctaClasses}`}>
                                {ctaText}
                                <ChevronRight className={isTablet ? 'w-6 h-6' : 'w-4 h-4'} />
                            </button>
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
            case 'tour':
                return renderTourBlock(block.data as TourBlockData);
            default:
                return (
                    <div className="text-[var(--color-text-muted)] text-sm">
                        Unsupported block type: {block.type}
                    </div>
                );
        }
    }

    if (mode === 'view') {
        // For tour blocks, pass through height to fill container
        const isTourBlock = block.type === 'tour';
        return <div className={`content-block ${isTourBlock ? 'h-full' : ''}`} style={isTourBlock ? { minHeight: '100%' } : {}}>{renderBlock()}</div>;
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
