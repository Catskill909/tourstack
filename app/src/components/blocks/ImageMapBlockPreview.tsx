import { useState, useRef, useCallback } from 'react';
import { X, Info, ArrowRight, Layers, MapPin, Circle, Star, Plus, Minus, Accessibility, Toilet, ArrowUpDown, ArrowUpFromLine, DoorOpen, Coffee, Gift, Ticket, Camera, Headphones, ParkingSquare } from 'lucide-react';
import { ImageMapMarkerPin } from './ImageMapMarkerPin';
import type { ImageMapBlockData, ImageMapMarker, ImageMapFloor, Stop } from '../../types';

interface ImageMapBlockPreviewProps {
    data: ImageMapBlockData;
    language: string;
    deviceType?: 'phone' | 'tablet' | 'kiosk';
    allStops?: Stop[];
    onNavigateToStop?: (stopId: string) => void;
}

function getFloors(data: ImageMapBlockData): ImageMapFloor[] {
    if (data.floors && data.floors.length > 0) return data.floors;
    if (data.imageUrl) {
        return [{
            id: 'default',
            imageUrl: data.imageUrl,
            imageAlt: data.imageAlt,
            label: { en: '' },
            order: 0,
            markers: data.markers || [],
        }];
    }
    return [];
}

export function ImageMapBlockPreview({
    data,
    language,
    deviceType = 'phone',
    allStops = [],
    onNavigateToStop,
}: ImageMapBlockPreviewProps) {
    const floors = getFloors(data);
    const [activeFloorId, setActiveFloorId] = useState(() => floors[0]?.id || '');
    const [infoPopup, setInfoPopup] = useState<ImageMapMarker | null>(null);
    const [scale, setScale] = useState(1);
    const [origin, setOrigin] = useState({ x: 50, y: 50 });
    const containerRef = useRef<HTMLDivElement>(null);
    const lastDistance = useRef<number | null>(null);

    const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0] || null;
    const activeMarkers = activeFloor?.markers || [];
    const isMultiFloor = floors.length > 1;

    // Pinch-to-zoom handlers
    function handleTouchStart(e: React.TouchEvent) {
        if (!data.zoomable || e.touches.length < 2) return;
        lastDistance.current = getTouchDistance(e.touches);
    }

    function handleTouchMove(e: React.TouchEvent) {
        if (!data.zoomable || e.touches.length < 2 || lastDistance.current === null) return;
        e.preventDefault();
        const dist = getTouchDistance(e.touches);
        const delta = dist / lastDistance.current;
        setScale(prev => Math.min(4, Math.max(1, prev * delta)));
        lastDistance.current = dist;

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
            const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) / rect.width * 100;
            const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) / rect.height * 100;
            setOrigin({ x: midX, y: midY });
        }
    }

    function handleTouchEnd() {
        lastDistance.current = null;
        if (scale <= 1.05) {
            setScale(1);
            setOrigin({ x: 50, y: 50 });
        }
    }

    function getTouchDistance(touches: React.TouchList) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Zoom control functions
    const zoomIn = useCallback(() => {
        setScale(prev => Math.min(4, prev + 0.5));
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prev => {
            const next = Math.max(1, prev - 0.5);
            if (next <= 1) setOrigin({ x: 50, y: 50 });
            return next;
        });
    }, []);

    const zoomReset = useCallback(() => {
        setScale(1);
        setOrigin({ x: 50, y: 50 });
    }, []);

    // Double-tap to reset zoom
    const lastTap = useRef(0);
    function handleDoubleTap(e: React.TouchEvent) {
        if (!data.zoomable) return;
        const now = Date.now();
        if (now - lastTap.current < 300) {
            e.preventDefault();
            zoomReset();
        }
        lastTap.current = now;
    }

    function handleMarkerClick(marker: ImageMapMarker) {
        const hasInfo = !!(marker.infoText?.[language] || marker.infoText?.en);

        // If marker has info text (and no stop link), show info popup
        if (hasInfo && !marker.stopId) {
            setInfoPopup(infoPopup?.id === marker.id ? null : marker);
            return;
        }

        // If linked to a stop and has info, show info popup with "Go to stop" button
        if (hasInfo && marker.stopId) {
            setInfoPopup(infoPopup?.id === marker.id ? null : marker);
            return;
        }

        // Navigate directly to stop
        if (marker.stopId && onNavigateToStop) {
            onNavigateToStop(marker.stopId);
            return;
        }

        // No action — just toggle label tooltip via old behavior
        setInfoPopup(infoPopup?.id === marker.id ? null : marker);
    }

    function getStopTitle(stop: Stop): string {
        const title = typeof stop.title === 'string'
            ? (() => { try { return JSON.parse(stop.title); } catch { return { en: stop.title }; } })()
            : stop.title;
        return title?.[language] || title?.en || stop.id;
    }

    const isTablet = deviceType === 'tablet' || deviceType === 'kiosk';

    if (!activeFloor?.imageUrl) {
        return (
            <div className="flex items-center justify-center p-8 text-[var(--color-text-muted)] text-sm">
                No floor plan uploaded
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Floor switcher */}
            {isMultiFloor && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    <Layers className="w-4 h-4 text-[var(--color-text-muted)] shrink-0 mr-1" />
                    {floors.map(floor => {
                        const label = floor.label?.[language] || floor.label?.en || `Floor ${floor.order + 1}`;
                        const floorColor = floor.color || 'var(--color-accent-primary)';
                        return (
                            <button
                                key={floor.id}
                                onClick={() => {
                                    setActiveFloorId(floor.id);
                                    setInfoPopup(null);
                                    setScale(1);
                                    setOrigin({ x: 50, y: 50 });
                                }}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${floor.id === activeFloorId
                                    ? 'text-white shadow-md'
                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] shadow-sm ring-1 ring-black/[0.08] dark:ring-white/[0.12] hover:bg-[var(--color-bg-hover)] hover:shadow-md'
                                    }`}
                                style={floor.id === activeFloorId ? { backgroundColor: floorColor } : undefined}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Map container */}
            <div
                ref={containerRef}
                className="relative overflow-hidden rounded-xl"
                style={{ touchAction: data.zoomable ? 'manipulation' : 'auto' }}
                onTouchStart={(e) => { handleDoubleTap(e); handleTouchStart(e); }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: `${origin.x}% ${origin.y}%`,
                        transition: scale === 1 ? 'transform 0.2s ease-out' : undefined,
                    }}
                >
                    <div className="relative">
                        <img
                            src={activeFloor.imageUrl}
                            alt={activeFloor.imageAlt?.[language] || activeFloor.imageAlt?.en || 'Floor plan'}
                            className="w-full block"
                            draggable={false}
                        />
                        {activeMarkers.map(marker => (
                            <ImageMapMarkerPin
                                key={marker.id}
                                marker={marker}
                                language={language}
                                showLabel={data.showLabels}
                                labelsPosition={data.labelsPosition}
                                onClick={(e) => { e.stopPropagation(); handleMarkerClick(marker); }}
                            />
                        ))}
                    </div>
                </div>

                {/* Info Popup Overlay */}
                {infoPopup && (() => {
                    const markerColor = infoPopup.color || 'var(--color-accent-primary)';
                    const hasInfoText = !!(infoPopup.infoText?.[language] || infoPopup.infoText?.en);

                    function renderPopupIcon() {
                        const iconClass = 'w-5 h-5 text-white';
                        switch (infoPopup!.icon) {
                            case 'dot':
                                return <Circle className={iconClass} fill="currentColor" />;
                            case 'star':
                                return <Star className={iconClass} fill="currentColor" />;
                            case 'info':
                                return <Info className={iconClass} />;
                            case 'number':
                                return <span className="text-sm font-bold text-white">{infoPopup!.number || '?'}</span>;
                            case 'accessibility':
                                return <Accessibility className={iconClass} />;
                            case 'restroom':
                                return <Toilet className={iconClass} />;
                            case 'stairs':
                                return <ArrowUpDown className={iconClass} />;
                            case 'elevator':
                                return <ArrowUpFromLine className={iconClass} />;
                            case 'exit':
                                return <DoorOpen className={iconClass} />;
                            case 'cafe':
                                return <Coffee className={iconClass} />;
                            case 'gift-shop':
                                return <Gift className={iconClass} />;
                            case 'ticket':
                                return <Ticket className={iconClass} />;
                            case 'camera':
                                return <Camera className={iconClass} />;
                            case 'audio-guide':
                                return <Headphones className={iconClass} />;
                            case 'parking':
                                return <ParkingSquare className={iconClass} />;
                            case 'pin':
                            default:
                                return <MapPin className={iconClass} fill="currentColor" strokeWidth={1.5} />;
                        }
                    }

                    return (
                        <div
                            className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40"
                            onClick={() => setInfoPopup(null)}
                        >
                            <div
                                className="w-full max-w-sm mx-4 mb-4 sm:mb-0 bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200"
                                style={{ boxShadow: `0 8px 32px -4px rgba(0,0,0,0.24), 0 0 0 1px rgba(0,0,0,0.05), 0 -1px 0 0 ${markerColor}20` }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Colored accent bar */}
                                <div className="h-1 w-full" style={{ backgroundColor: markerColor }} />

                                {/* Popup header */}
                                <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0"
                                        style={{
                                            backgroundColor: markerColor,
                                            boxShadow: `0 4px 12px ${markerColor}40`,
                                        }}
                                    >
                                        {renderPopupIcon()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[var(--color-text-primary)] text-[15px] leading-tight truncate">
                                            {infoPopup.label?.[language] || infoPopup.label?.en || 'Marker'}
                                        </h3>
                                        {infoPopup.stopId && (
                                            <p className="text-xs mt-0.5" style={{ color: markerColor }}>
                                                Linked stop
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setInfoPopup(null)}
                                        className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-colors shrink-0"
                                    >
                                        <X className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                    </button>
                                </div>

                                {/* Divider */}
                                {(hasInfoText || (infoPopup.stopId && onNavigateToStop)) && (
                                    <div className="mx-5 border-t border-[var(--color-border-default)]" />
                                )}

                                {/* Info text */}
                                {hasInfoText && (
                                    <div className="px-5 py-3">
                                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                                            {infoPopup.infoText?.[language] || infoPopup.infoText?.en}
                                        </p>
                                    </div>
                                )}

                                {/* Go to stop button */}
                                {infoPopup.stopId && onNavigateToStop && (
                                    <div className="px-5 pb-5 pt-2">
                                        <button
                                            onClick={() => {
                                                onNavigateToStop(infoPopup.stopId!);
                                                setInfoPopup(null);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                                            style={{
                                                backgroundColor: markerColor,
                                                boxShadow: `0 4px 14px ${markerColor}35`,
                                            }}
                                        >
                                            Go to {(() => {
                                                const stop = allStops.find(s => s.id === infoPopup.stopId);
                                                return stop ? getStopTitle(stop) : 'this stop';
                                            })()}
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Zoom Controls — straddling bottom edge of map */}
            {data.zoomable && (
                <div className="flex justify-center -mt-5 mb-1 relative z-20">
                    <div className="flex items-center gap-0.5 bg-white/95 dark:bg-neutral-800/95 backdrop-blur-md rounded-full shadow-lg ring-1 ring-black/[0.08] dark:ring-white/[0.08] p-0.5">
                        <button
                            onClick={zoomOut}
                            disabled={scale <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                        >
                            <Minus className="w-3.5 h-3.5 text-[var(--color-text-primary)]" strokeWidth={2.5} />
                        </button>
                        {scale > 1 ? (
                            <button
                                onClick={zoomReset}
                                className="min-w-[36px] h-8 px-1 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all active:scale-90"
                                title="Reset zoom"
                            >
                                <span className="text-[11px] font-semibold tabular-nums text-[var(--color-text-secondary)]">
                                    {Math.round(scale * 100)}%
                                </span>
                            </button>
                        ) : (
                            <div className="min-w-[36px] h-8 px-1 flex items-center justify-center">
                                <span className="text-[11px] font-semibold tabular-nums text-[var(--color-text-muted)]">
                                    100%
                                </span>
                            </div>
                        )}
                        <button
                            onClick={zoomIn}
                            disabled={scale >= 4}
                            className="w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
                        >
                            <Plus className="w-3.5 h-3.5 text-[var(--color-text-primary)]" strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            )}

            {/* Legend */}
            {data.showLegend && activeMarkers.length > 0 && (
                <div className={`bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl p-3 ${isTablet ? 'text-base' : 'text-sm'}`}>
                    <div className="grid grid-cols-2 gap-1">
                        {activeMarkers.map(marker => {
                            const label = marker.label?.[language] || marker.label?.en || 'Marker';
                            return (
                                <div
                                    key={marker.id}
                                    className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-[var(--color-bg-hover)]"
                                    onClick={() => handleMarkerClick(marker)}
                                >
                                    <div
                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                                        style={{ backgroundColor: marker.color || 'var(--color-accent-primary)' }}
                                    >
                                        {marker.number || '•'}
                                    </div>
                                    <span className="text-[var(--color-text-secondary)] truncate">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Zoom hint */}
            {data.zoomable && scale === 1 && (
                <p className="text-center text-[11px] text-[var(--color-text-secondary)]">
                    Pinch to zoom • Use controls to adjust
                </p>
            )}
        </div>
    );
}
