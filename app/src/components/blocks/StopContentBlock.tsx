import { Type, Image, Images, Music, Video, Quote, History, Columns, QrCode } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContentBlock, ContentBlockType, TextBlockData, ImageBlockData, GalleryBlockData, TimelineGalleryBlockData, AudioBlockData, VideoBlockData, QuoteBlockData, PositioningBlockData } from '../../types';
import { GalleryPreview } from './GalleryPreview';
import { TimelineGalleryPreview } from './TimelineGalleryPreview';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';

interface StopContentBlockProps {
    block: ContentBlock;
    mode: 'view' | 'edit';
    language: string;
    deviceType?: 'phone' | 'tablet';
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
};

export function StopContentBlock({ block, mode, language, deviceType = 'phone', onEdit, onDelete }: StopContentBlockProps) {
    const Icon = BLOCK_ICONS[block.type];
    const label = BLOCK_LABELS[block.type];

    // Font size scaling for tablets
    const isTablet = deviceType === 'tablet';
    const proseSize = isTablet ? 'prose-lg' : 'prose-base';

    // Render functions for each block type
    function renderTextBlock(data: TextBlockData) {
        const content = data.content[language] || data.content.en || '';
        return (
            <div className={`prose prose-invert max-w-none ${proseSize} ${data.style === 'callout' ? 'bg-[var(--color-accent-primary)]/10 p-4 rounded-lg border-l-4 border-[var(--color-accent-primary)]' : ''} ${data.style === 'sidebar' ? 'bg-[var(--color-bg-elevated)] p-4 rounded-lg' : ''}`}>
                <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
        );
    }

    function renderImageBlock(data: ImageBlockData) {
        const alt = data.alt[language] || data.alt.en || '';
        const caption = data.caption?.[language] || data.caption?.en;
        const sizeClasses = {
            small: 'max-w-xs',
            medium: 'max-w-md',
            large: 'max-w-2xl',
            full: 'w-full',
        };
        return (
            <figure className={sizeClasses[data.size]}>
                {data.url ? (
                    <img src={data.url} alt={alt} className="rounded-lg w-full" />
                ) : (
                    <div className="aspect-video bg-[var(--color-bg-hover)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)]">
                        <Image className="w-12 h-12" />
                    </div>
                )}
                {caption && (
                    <figcaption className="text-sm text-[var(--color-text-muted)] mt-2 text-center">{caption}</figcaption>
                )}
            </figure>
        );
    }

    function renderGalleryBlock(data: GalleryBlockData) {
        return <GalleryPreview data={data} language={language} />;
    }

    function renderTimelineGalleryBlock(data: TimelineGalleryBlockData) {
        return <TimelineGalleryPreview data={data} language={language} deviceType={deviceType} />;
    }

    function renderAudioBlock(data: AudioBlockData) {
        const audioUrl = data.audioFiles[language] || data.audioFiles.en || '';
        const title = data.title[language] || data.title.en || 'Audio';
        const transcript = data.transcript?.[language] || data.transcript?.en;
        const size = data.size || 'large';
        const showTitle = data.showTitle ?? true;
        return (
            <div className="space-y-3">
                {audioUrl ? (
                    <CustomAudioPlayer
                        src={audioUrl}
                        title={(size === 'large' && showTitle) ? title : undefined}
                        size={size}
                        deviceType={deviceType}
                        autoplay={data.autoplay}
                        transcriptWords={data.transcriptWords}
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
        );
    }

    function renderVideoBlock(data: VideoBlockData) {
        const title = data.title[language] || data.title.en || 'Video';
        return (
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
                <div className="p-3">
                    <h4 className="font-medium text-[var(--color-text-primary)]">{title}</h4>
                </div>
            </div>
        );
    }

    function renderQuoteBlock(data: QuoteBlockData) {
        const quote = data.quote[language] || data.quote.en || '';
        const author = data.author?.[language] || data.author?.en;
        const source = data.source?.[language] || data.source?.en;
        return (
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
        );
    }

    function renderPositioningBlock(data: PositioningBlockData) {
        return (
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
            default:
                return (
                    <div className="text-[var(--color-text-muted)] text-sm">
                        Unsupported block type: {block.type}
                    </div>
                );
        }
    }

    if (mode === 'view') {
        return <div className="content-block">{renderBlock()}</div>;
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
