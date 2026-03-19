import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';
import type { GalleryBlockData } from '../../types';

interface GalleryPreviewProps {
    data: GalleryBlockData;
    language: string;
}

export function GalleryPreview({ data, language }: GalleryPreviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFading, setIsFading] = useState(false);

    const images = data.images || [];
    const crossfadeDuration = data.crossfadeDuration || 500;
    const showCaptions = data.showCaptions !== false;
    const showCredits = data.showCredits !== false;
    const showArrows = data.showArrows !== false;
    const showThumbnails = data.showThumbnails !== false;
    const showDots = data.showDots || false;
    const imageFit = data.imageFit || 'contain';
    const aspectRatio = data.aspectRatio || '16:9';
    const gap = data.gap ?? 8;
    const borderRadius = data.borderRadius ?? 12;
    const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-advance
    useEffect(() => {
        if (data.autoAdvance && images.length > 1 && (data.layout === 'carousel' || data.layout === 'slideshow')) {
            autoAdvanceRef.current = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % images.length);
            }, (data.autoAdvanceInterval || 5) * 1000);
        }
        return () => {
            if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
        };
    }, [data.autoAdvance, data.autoAdvanceInterval, images.length, data.layout]);

    const getAspectClass = useCallback(() => {
        switch (aspectRatio) {
            case '16:9': return 'aspect-video';
            case '4:3': return 'aspect-[4/3]';
            case '3:2': return 'aspect-[3/2]';
            case '1:1': return 'aspect-square';
            default: return 'aspect-video';
        }
    }, [aspectRatio]);

    if (images.length === 0) {
        return (
            <div className="bg-[var(--color-bg-hover)] rounded-lg p-8 text-center text-[var(--color-text-muted)]">
                <Images className="w-12 h-12 mx-auto mb-2" />
                <p>No images in gallery</p>
            </div>
        );
    }

    function triggerCrossfade(newIndex: number) {
        setIsFading(true);
        setTimeout(() => {
            setCurrentIndex(newIndex);
            setTimeout(() => setIsFading(false), crossfadeDuration / 2);
        }, crossfadeDuration / 2);
    }

    function goToPrevious() {
        triggerCrossfade(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    }

    function goToNext() {
        triggerCrossfade(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
    }

    const currentImage = images[currentIndex];

    function renderCaption(img: typeof images[0]) {
        const caption = img.caption?.[language] || img.caption?.en;
        const credit = img.credit?.[language];
        if ((!showCaptions || !caption) && (!showCredits || !credit)) return null;
        return (
            <div className="space-y-0.5">
                {showCaptions && caption && (
                    <p className="text-sm text-[var(--color-text-primary)] font-medium">{caption}</p>
                )}
                {showCredits && credit && (
                    <p className="text-xs text-[var(--color-text-muted)] italic">Credit: {credit}</p>
                )}
            </div>
        );
    }

    // CAROUSEL / SLIDESHOW layout — hero image, no rounded corners
    if (data.layout === 'carousel' || data.layout === 'slideshow') {
        return (
            <div className="bg-[var(--color-bg-surface)]">
                {/* Main Image — no border radius */}
                <div className={`relative bg-black ${getAspectClass()}`}>
                    <div
                        className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                    >
                        {currentImage && (
                            <img
                                src={currentImage.url}
                                alt=""
                                className={`w-full h-full ${imageFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                            />
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    {showArrows && images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                type="button"
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/60 transform hover:scale-110 transition-all shadow-xl"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-medium">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>

                {/* Dot Navigation */}
                {showDots && images.length > 1 && (
                    <div className="flex justify-center gap-1.5 py-2.5 bg-[var(--color-bg-elevated)]">
                        {images.map((_, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => triggerCrossfade(index)}
                                className={`rounded-full transition-all ${index === currentIndex
                                    ? 'w-6 h-2 bg-[var(--color-accent-primary)]'
                                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                )}

                {/* Caption and Credit */}
                {currentImage && (showCaptions || showCredits) && (
                    <div className="p-4">
                        {renderCaption(currentImage)}
                    </div>
                )}

                {/* Thumbnail Navigation — slideshow only, not carousel */}
                {showThumbnails && data.layout === 'slideshow' && images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto border-t border-[var(--color-border-default)]">
                        {images.map((img, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => triggerCrossfade(index)}
                                className={`relative flex-shrink-0 w-16 h-16 overflow-hidden transition-all ${index === currentIndex
                                    ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                    : 'opacity-60 hover:opacity-100'
                                    }`}
                                style={{ borderRadius: `${Math.min(borderRadius, 8)}px` }}
                            >
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // FILMSTRIP layout
    if (data.layout === 'filmstrip') {
        return (
            <div className="flex overflow-x-auto pb-2 scrollbar-thin" style={{ gap: `${gap}px` }}>
                {images.map((img, idx) => (
                    <div key={idx} className="flex-shrink-0 w-48">
                        <img
                            src={img.url}
                            alt=""
                            className={`w-full ${getAspectClass()} ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} shadow-lg`}
                            style={{ borderRadius: `${borderRadius}px` }}
                        />
                        {(showCaptions || showCredits) && (
                            <div className="mt-2">
                                {renderCaption(img)}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // MASONRY layout
    if (data.layout === 'masonry') {
        return (
            <div className="columns-2 md:columns-3" style={{ gap: `${gap}px` }}>
                {images.map((img, idx) => (
                    <figure
                        key={idx}
                        className="break-inside-avoid"
                        style={{ marginBottom: `${gap}px` }}
                    >
                        <img
                            src={img.url}
                            alt=""
                            className="w-full object-cover shadow-lg"
                            style={{ borderRadius: `${borderRadius}px` }}
                        />
                        {(showCaptions || showCredits) && (
                            <div className="mt-2">{renderCaption(img)}</div>
                        )}
                    </figure>
                ))}
            </div>
        );
    }

    // GRID layout (default — also handles 'lightbox' layout as simple grid)
    const cols = data.itemsPerRow || 3;
    return (
        <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}
        >
            {images.map((img, idx) => (
                <figure key={idx}>
                    <img
                        src={img.url}
                        alt=""
                        className={`w-full ${getAspectClass()} ${imageFit === 'cover' ? 'object-cover' : 'object-contain'} shadow-lg`}
                        style={{ borderRadius: `${borderRadius}px` }}
                    />
                    {(showCaptions || showCredits) && (
                        <div className="mt-2">{renderCaption(img)}</div>
                    )}
                </figure>
            ))}
        </div>
    );
}
