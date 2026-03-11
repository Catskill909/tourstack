import { MapPin, Circle, Star, Info, Accessibility, Toilet, ArrowUpDown, ArrowUpFromLine, DoorOpen, Coffee, Gift, Ticket, Camera, Headphones, ParkingSquare } from 'lucide-react';
import type { ImageMapMarker } from '../../types';

interface ImageMapMarkerPinProps {
    marker: ImageMapMarker;
    language: string;
    selected?: boolean;
    dragging?: boolean;
    showLabel?: boolean;
    labelsPosition?: 'above' | 'below' | 'right';
    onClick?: (e: React.MouseEvent) => void;
    onMouseDown?: (e: React.MouseEvent) => void;
    onTouchStart?: (e: React.TouchEvent) => void;
}

const MARKER_COLORS: Record<string, string> = {
    '#ef4444': 'text-red-500',
    '#f97316': 'text-orange-500',
    '#eab308': 'text-yellow-500',
    '#22c55e': 'text-green-500',
    '#3b82f6': 'text-blue-500',
    '#8b5cf6': 'text-purple-500',
    '#ec4899': 'text-pink-500',
};

export function ImageMapMarkerPin({
    marker,
    language,
    selected = false,
    dragging = false,
    showLabel = false,
    labelsPosition = 'below',
    onClick,
    onMouseDown,
    onTouchStart,
}: ImageMapMarkerPinProps) {
    const label = marker.label?.[language] || marker.label?.en || '';
    const colorClass = marker.color && MARKER_COLORS[marker.color] ? MARKER_COLORS[marker.color] : 'text-[var(--color-accent-primary)]';

    const markerColor = marker.color || 'var(--color-accent-primary)';

    // Icons that get a colored circle background with white icon inside
    function renderCircleIcon(Icon: React.ComponentType<{ className?: string }>) {
        return (
            <div
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: markerColor }}
            >
                <Icon className="w-4 h-4 text-white" />
            </div>
        );
    }

    function renderIcon() {
        const iconClass = `w-5 h-5 ${colorClass}`;

        switch (marker.icon) {
            case 'dot':
                return <Circle className={iconClass} fill="currentColor" />;
            case 'star':
                return <Star className={iconClass} fill="currentColor" />;
            case 'info':
                return renderCircleIcon(Info);
            case 'number':
                return (
                    <div
                        className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-md"
                        style={{ backgroundColor: markerColor }}
                    >
                        {marker.number || '?'}
                    </div>
                );
            case 'accessibility':
                return renderCircleIcon(Accessibility);
            case 'restroom':
                return renderCircleIcon(Toilet);
            case 'stairs':
                return renderCircleIcon(ArrowUpDown);
            case 'elevator':
                return renderCircleIcon(ArrowUpFromLine);
            case 'exit':
                return renderCircleIcon(DoorOpen);
            case 'cafe':
                return renderCircleIcon(Coffee);
            case 'gift-shop':
                return renderCircleIcon(Gift);
            case 'ticket':
                return renderCircleIcon(Ticket);
            case 'camera':
                return renderCircleIcon(Camera);
            case 'audio-guide':
                return renderCircleIcon(Headphones);
            case 'parking':
                return renderCircleIcon(ParkingSquare);
            case 'pin':
            default:
                return <MapPin className={iconClass} fill="currentColor" strokeWidth={1.5} />;
        }
    }

    const labelEl = showLabel && label && (
        <span className="text-[10px] leading-tight font-medium text-[var(--color-text-primary)] bg-[var(--color-bg-surface)]/90 backdrop-blur-sm px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap max-w-[120px] truncate pointer-events-none">
            {label}
        </span>
    );

    return (
        <div
            className={`absolute flex items-center gap-1 cursor-pointer select-none -translate-x-1/2 -translate-y-1/2 z-10 transition-transform ${dragging ? 'scale-125 z-50 opacity-80' : ''} ${selected ? 'scale-110 z-40' : 'hover:scale-110'}`}
            style={{
                left: `${marker.x}%`,
                top: `${marker.y}%`,
                flexDirection: labelsPosition === 'above' ? 'column-reverse'
                    : labelsPosition === 'right' ? 'row'
                        : 'column',
            }}
            onClick={onClick}
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
        >
            <div className={`relative ${selected ? 'ring-2 ring-[var(--color-accent-primary)] ring-offset-2 rounded-full' : ''}`}>
                {renderIcon()}
            </div>
            {labelEl}
        </div>
    );
}
