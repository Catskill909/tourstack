import { useState } from 'react';
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

    // CAROUSEL layout - beautiful slideshow with prev/next
    if (data.layout === 'carousel') {
        return (
            <div className="bg-[var(--color-bg-surface)] rounded-2xl overflow-hidden border border-[var(--color-border-default)]">
                {/* Main Image */}
                <div className="relative aspect-[16/10] bg-black">
                    <div
                        className={`absolute inset-0 transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
                        style={{ transitionDuration: `${crossfadeDuration / 2}ms` }}
                    >
                        {currentImage && (
                            <img
                                src={currentImage.url}
                                alt={currentImage.alt[language] || currentImage.alt.en || ''}
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Navigation Arrows */}
                    {images.length > 1 && (
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

                {/* Caption and Credit */}
                <div className="p-4 bg-gradient-to-r from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
                    {currentImage && (
                        <div className="space-y-1">
                            <p className="text-[var(--color-text-primary)] font-medium">
                                {currentImage.caption?.[language] || currentImage.caption?.en || ''}
                            </p>
                            {currentImage.credit?.[language] && (
                                <p className="text-sm text-[var(--color-text-muted)] italic">
                                    Credit: {currentImage.credit[language]}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Thumbnail Navigation */}
                    {images.length > 1 && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                            {images.map((img, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => triggerCrossfade(index)}
                                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${index === currentIndex
                                        ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 ring-offset-[var(--color-bg-surface)]'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Masonry layout
    if (data.layout === 'masonry') {
        return (
            <div className="columns-2 md:columns-3 gap-4">
                {images.map((img, idx) => (
                    <figure key={idx} className="break-inside-avoid mb-4">
                        <img
                            src={img.url}
                            alt={img.alt[language] || img.alt.en || ''}
                            className="rounded-xl w-full object-cover shadow-lg"
                        />
                        {img.caption && (
                            <figcaption className="text-sm text-[var(--color-text-secondary)] mt-2">
                                {img.caption[language] || img.caption.en}
                            </figcaption>
                        )}
                        {img.credit?.[language] && (
                            <p className="text-xs text-[var(--color-text-muted)] italic mt-1">
                                {img.credit[language]}
                            </p>
                        )}
                    </figure>
                ))}
            </div>
        );
    }

    // Grid layout (default)
    const cols = data.itemsPerRow || 3;
    return (
        <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
            {images.map((img, idx) => (
                <figure key={idx}>
                    <img
                        src={img.url}
                        alt={img.alt[language] || img.alt.en || ''}
                        className="rounded-xl w-full aspect-square object-cover shadow-lg"
                    />
                    {img.caption && (
                        <figcaption className="text-sm text-[var(--color-text-secondary)] mt-2">
                            {img.caption[language] || img.caption.en}
                        </figcaption>
                    )}
                    {img.credit?.[language] && (
                        <p className="text-xs text-[var(--color-text-muted)] italic mt-1">
                            {img.credit[language]}
                        </p>
                    )}
                </figure>
            ))}
        </div>
    );
}
