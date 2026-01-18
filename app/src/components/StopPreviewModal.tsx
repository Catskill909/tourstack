import { useState } from 'react';
import { X, Smartphone, Tablet } from 'lucide-react';
import { StopContentBlock } from './blocks/StopContentBlock';
import type { Stop, ContentBlock } from '../types';

interface StopPreviewModalProps {
    stop: Stop;
    onClose: () => void;
}

type DeviceSize = 'phone' | 'tablet';

const DEVICE_SIZES = {
    phone: { width: 375, height: 667, label: 'Phone', icon: Smartphone },
    tablet: { width: 768, height: 1024, label: 'Tablet', icon: Tablet },
};

export function StopPreviewModal({ stop, onClose }: StopPreviewModalProps) {
    const [deviceSize, setDeviceSize] = useState<DeviceSize>('phone');
    const language = 'en';

    const device = DEVICE_SIZES[deviceSize];
    const blocks = stop.contentBlocks || [];

    function getStopTitle(): string {
        return typeof stop.title === 'object'
            ? stop.title.en || Object.values(stop.title)[0] || 'Untitled'
            : String(stop.title);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="flex flex-col max-h-[95vh] max-w-[95vw]" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-bg-surface)] rounded-t-2xl border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                            Preview: {getStopTitle()}
                        </h2>

                        {/* Device Size Toggle */}
                        <div className="flex rounded-xl overflow-hidden border border-[var(--color-border-default)]">
                            {(Object.keys(DEVICE_SIZES) as DeviceSize[]).map((size) => {
                                const Icon = DEVICE_SIZES[size].icon;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setDeviceSize(size)}
                                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${deviceSize === size
                                                ? 'bg-[var(--color-accent-primary)] text-white'
                                                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {DEVICE_SIZES[size].label}
                                    </button>
                                );
                            })}
                        </div>

                        <span className="text-sm text-[var(--color-text-muted)]">
                            {device.width} × {device.height}
                        </span>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Device Frame */}
                <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-bg-base)] rounded-b-2xl overflow-hidden">
                    <div
                        className="relative bg-black rounded-[3rem] p-3 shadow-2xl"
                        style={{
                            width: Math.min(device.width + 24, window.innerWidth - 100),
                            height: Math.min(device.height + 24, window.innerHeight - 200),
                        }}
                    >
                        {/* Device Notch/Camera */}
                        {deviceSize === 'phone' && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
                        )}

                        {/* Screen Content */}
                        <div
                            className="bg-[var(--color-bg-base)] rounded-[2.5rem] overflow-hidden h-full"
                            style={{
                                width: Math.min(device.width, window.innerWidth - 124),
                                height: Math.min(device.height, window.innerHeight - 224),
                            }}
                        >
                            <div className="h-full overflow-y-auto">
                                {/* Status Bar */}
                                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-[var(--color-bg-surface)]/90 backdrop-blur-sm text-xs text-[var(--color-text-muted)]">
                                    <span>9:41</span>
                                    <div className="flex items-center gap-1">
                                        <div className="w-4 h-2 rounded-sm bg-green-500" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 space-y-4">
                                    {/* Stop Header */}
                                    <div className="space-y-2">
                                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                                            {getStopTitle()}
                                        </h1>
                                        {stop.description?.en && (
                                            <p className="text-[var(--color-text-secondary)]">
                                                {stop.description.en}
                                            </p>
                                        )}
                                    </div>

                                    {/* Content Blocks */}
                                    {blocks.length === 0 ? (
                                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                                            No content blocks yet
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {blocks.map((block: ContentBlock) => (
                                                <StopContentBlock
                                                    key={block.id}
                                                    block={block}
                                                    mode="view"
                                                    language={language}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Bottom Padding for safe area */}
                                    <div className="h-8" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Hint */}
                <div className="text-center py-3 text-xs text-[var(--color-text-muted)]">
                    This is how visitors will see this stop on their {deviceSize}
                </div>
            </div>
        </div>
    );
}
