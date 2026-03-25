import { useState, useRef, useCallback, useEffect } from 'react';
import type { ComparisonBlockData } from '../../types';

interface ComparisonPreviewProps {
    data: ComparisonBlockData;
    language: string;
}

export function ComparisonPreview({ data, language }: ComparisonPreviewProps) {
    const [position, setPosition] = useState(data.initialPosition ?? 50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const isHorizontal = data.orientation === 'horizontal';

    const beforeLabel = data.beforeImage?.label?.[language] || data.beforeImage?.label?.en;
    const afterLabel = data.afterImage?.label?.[language] || data.afterImage?.label?.en;

    const updatePosition = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let pct: number;
        if (isHorizontal) {
            pct = ((clientX - rect.left) / rect.width) * 100;
        } else {
            pct = ((clientY - rect.top) / rect.height) * 100;
        }
        setPosition(Math.max(5, Math.min(95, pct)));
    }, [isHorizontal]);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        updatePosition(e.clientX, e.clientY);
    }, [isDragging, updatePosition]);

    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Reset position when data changes
    useEffect(() => {
        setPosition(data.initialPosition ?? 50);
    }, [data.initialPosition]);

    if (!data.beforeImage?.url || !data.afterImage?.url) {
        return (
            <div className="aspect-video bg-[var(--color-bg-hover)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)]">
                <p className="text-sm">Add before and after images to preview</p>
            </div>
        );
    }

    const clipBefore = isHorizontal
        ? `inset(0 ${100 - position}% 0 0)`
        : `inset(0 0 ${100 - position}% 0)`;
    const clipAfter = isHorizontal
        ? `inset(0 0 0 ${position}%)`
        : `inset(${position}% 0 0 0)`;

    return (
        <div
            ref={containerRef}
            className="relative select-none overflow-hidden rounded-lg touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Before image (full, clipped) */}
            <div className="relative">
                <img
                    src={data.beforeImage.url}
                    alt={beforeLabel || 'Before'}
                    className="w-full block"
                    draggable={false}
                    style={{ clipPath: clipBefore }}
                />
                {/* After image overlaid */}
                <img
                    src={data.afterImage.url}
                    alt={afterLabel || 'After'}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                    style={{ clipPath: clipAfter }}
                />
            </div>

            {/* Slider line */}
            {isHorizontal ? (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                    {/* Handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto cursor-ew-resize">
                        <div className="flex gap-0.5">
                            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                            <div className="w-0.5 h-3 bg-gray-400 rounded-full" />
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className="absolute left-0 right-0 h-0.5 bg-white shadow-lg pointer-events-none"
                    style={{ top: `${position}%`, transform: 'translateY(-50%)' }}
                >
                    {/* Handle */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto cursor-ns-resize">
                        <div className="flex flex-col gap-0.5">
                            <div className="h-0.5 w-3 bg-gray-400 rounded-full" />
                            <div className="h-0.5 w-3 bg-gray-400 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {/* Labels */}
            {beforeLabel && (
                <div className={`absolute ${isHorizontal ? 'top-3 left-3' : 'top-3 left-3'}`}>
                    <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">{beforeLabel}</span>
                </div>
            )}
            {afterLabel && (
                <div className={`absolute ${isHorizontal ? 'top-3 right-3' : 'bottom-3 left-3'}`}>
                    <span className="text-xs bg-black/60 text-white px-2 py-1 rounded">{afterLabel}</span>
                </div>
            )}
        </div>
    );
}
