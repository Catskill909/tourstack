import { useState } from 'react';
import { X, Smartphone, Tablet, RotateCcw, ZoomIn, ZoomOut, Monitor, MonitorOff } from 'lucide-react';
import { StopContentBlock } from './blocks/StopContentBlock';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { Stop, ContentBlock } from '../types';

interface StopPreviewModalProps {
    stop: Stop;
    /** Available languages from tour */
    availableLanguages?: string[];
    onClose: () => void;
}

type DeviceType = 'phone' | 'tablet';

const DEVICE_CONFIGS = {
    phone: {
        width: 375,
        height: 812,
        label: 'iPhone',
        icon: Smartphone,
        bezelRadius: 44,
        screenRadius: 38,
        bezelWidth: 12,
        notchWidth: 120,
        notchHeight: 28,
        homeIndicatorWidth: 134,
        homeIndicatorHeight: 5,
    },
    tablet: {
        width: 820,
        height: 1180,
        label: 'iPad',
        icon: Tablet,
        bezelRadius: 24,
        screenRadius: 18,
        bezelWidth: 16,
        notchWidth: 0,
        notchHeight: 0,
        homeIndicatorWidth: 180,
        homeIndicatorHeight: 5,
    },
};

export function StopPreviewModal({ stop, availableLanguages = ['en'], onClose }: StopPreviewModalProps) {
    const [deviceType, setDeviceType] = useState<DeviceType>('phone');
    const [previewLanguage, setPreviewLanguage] = useState(availableLanguages[0] || 'en');
    const [scale, setScale] = useState(0.85);
    const [showStatusBar, setShowStatusBar] = useState(true);

    // Calculate appropriate scale when device changes
    const getDefaultScale = (type: DeviceType) => {
        return type === 'tablet' ? 0.55 : 0.85;
    };

    const handleDeviceChange = (type: DeviceType) => {
        setDeviceType(type);
        setScale(getDefaultScale(type));
    };

    const device = DEVICE_CONFIGS[deviceType];
    const blocks = stop.contentBlocks || [];

    function getStopTitle(): string {
        if (typeof stop.title === 'object') {
            return stop.title[previewLanguage] || stop.title.en || Object.values(stop.title)[0] || 'Untitled';
        }
        return String(stop.title);
    }

    function getStopDescription(): string | undefined {
        if (!stop.description) return undefined;
        if (typeof stop.description === 'object') {
            return stop.description[previewLanguage] || stop.description.en || undefined;
        }
        return String(stop.description);
    }

    const adjustScale = (delta: number) => {
        setScale(prev => Math.min(1.2, Math.max(0.5, prev + delta)));
    };

    const resetScale = () => setScale(0.85);

    // Calculate scaled dimensions
    const scaledWidth = device.width + (device.bezelWidth * 2);
    const scaledHeight = device.height + (device.bezelWidth * 2);

    return (
        <div 
            className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0d0d0d]" 
            onClick={onClose}
        >
            {/* Header Bar */}
            <div 
                className="flex flex-wrap items-center gap-4 px-4 py-3 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-b border-[var(--color-border-default)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                <h2 className="text-base font-semibold text-[var(--color-text-primary)] truncate max-w-[200px]">
                    Preview: <span className="text-[var(--color-accent-primary)]">{getStopTitle()}</span>
                </h2>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Device Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                    {(Object.keys(DEVICE_CONFIGS) as DeviceType[]).map((type) => {
                        const Icon = DEVICE_CONFIGS[type].icon;
                        const isActive = deviceType === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => handleDeviceChange(type)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive
                                        ? 'bg-[var(--color-accent-primary)] text-[#1a1a1a] shadow-md'
                                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{DEVICE_CONFIGS[type].label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Dimensions Badge */}
                <span className="hidden md:inline text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-elevated)] px-2 py-1 rounded">
                    {device.width} × {device.height}
                </span>

                {/* Status Bar Toggle */}
                <button
                    onClick={() => setShowStatusBar(!showStatusBar)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        showStatusBar
                            ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                            : 'bg-[var(--color-bg-hover)] border-[var(--color-border-hover)] text-[var(--color-text-muted)]'
                    }`}
                    title={showStatusBar ? 'Hide status bar' : 'Show status bar'}
                >
                    {showStatusBar ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
                    <span className="hidden lg:inline">{showStatusBar ? 'Status Bar' : 'No Status'}</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                    <button
                        onClick={() => adjustScale(-0.1)}
                        className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        onClick={resetScale}
                        className="px-2 py-1 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Reset zoom"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <button
                        onClick={() => adjustScale(0.1)}
                        className="p-1.5 rounded hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>

                {/* Language Switcher */}
                {availableLanguages.length > 1 && (
                    <LanguageSwitcher
                        availableLanguages={availableLanguages}
                        activeLanguage={previewLanguage}
                        onChange={setPreviewLanguage}
                        size="sm"
                        showStatus={false}
                    />
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    title="Close preview (Esc)"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Device Preview Area */}
            <div 
                className="flex-1 flex items-center justify-center overflow-auto p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Device Frame Container */}
                <div
                    className="relative transition-transform duration-300 ease-out"
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'center center',
                    }}
                >
                    {/* Device Frame - Outer Shell */}
                    <div
                        className="relative"
                        style={{
                            width: scaledWidth,
                            height: scaledHeight,
                            borderRadius: device.bezelRadius,
                            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)',
                            boxShadow: `
                                0 0 0 1px rgba(255,255,255,0.08),
                                0 25px 50px -12px rgba(0,0,0,0.8),
                                0 12px 24px -8px rgba(0,0,0,0.6),
                                inset 0 1px 0 rgba(255,255,255,0.1)
                            `,
                        }}
                    >
                        {/* Side Buttons - Volume (left side) */}
                        <div 
                            className="absolute -left-[3px] top-[100px] w-[3px] h-[32px] rounded-l-sm"
                            style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
                        />
                        <div 
                            className="absolute -left-[3px] top-[145px] w-[3px] h-[56px] rounded-l-sm"
                            style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
                        />
                        <div 
                            className="absolute -left-[3px] top-[210px] w-[3px] h-[56px] rounded-l-sm"
                            style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)' }}
                        />
                        
                        {/* Side Button - Power (right side) */}
                        <div 
                            className="absolute -right-[3px] top-[160px] w-[3px] h-[80px] rounded-r-sm"
                            style={{ background: 'linear-gradient(270deg, #1a1a1a, #2a2a2a)' }}
                        />

                        {/* Inner Bezel */}
                        <div
                            className="absolute inset-0 m-[1px] rounded-[43px]"
                            style={{
                                background: 'linear-gradient(180deg, #1f1f1f 0%, #171717 100%)',
                            }}
                        />

                        {/* Screen Area */}
                        <div
                            className="absolute overflow-hidden bg-[var(--color-bg-primary)]"
                            style={{
                                top: device.bezelWidth,
                                left: device.bezelWidth,
                                width: device.width,
                                height: device.height,
                                borderRadius: device.screenRadius,
                            }}
                        >
                            {/* Dynamic Island / Notch (Phone only) */}
                            {deviceType === 'phone' && (
                                <div 
                                    className="absolute top-[10px] left-1/2 -translate-x-1/2 z-20 flex items-center justify-center"
                                    style={{
                                        width: device.notchWidth,
                                        height: device.notchHeight,
                                        borderRadius: 20,
                                        background: '#000',
                                    }}
                                >
                                    {/* Camera dot */}
                                    <div className="w-3 h-3 rounded-full bg-[#1a1a1a] border border-[#333] ml-auto mr-4" />
                                </div>
                            )}

                            {/* Screen Content */}
                            <div className="h-full overflow-y-auto">
                                {/* Status Bar */}
                                {showStatusBar && (
                                    <div 
                                        className="sticky top-0 z-10 flex items-center justify-between px-6 bg-[var(--color-bg-surface)]/95 backdrop-blur-md"
                                        style={{ 
                                            paddingTop: deviceType === 'phone' ? 48 : 12,
                                            paddingBottom: 8,
                                        }}
                                    >
                                        <span className="text-xs font-semibold text-[var(--color-text-primary)]">9:41</span>
                                        <div className="flex items-center gap-1.5">
                                            {/* Signal bars */}
                                            <div className="flex items-end gap-[2px]">
                                                <div className="w-[3px] h-[4px] rounded-sm bg-[var(--color-text-primary)]" />
                                                <div className="w-[3px] h-[6px] rounded-sm bg-[var(--color-text-primary)]" />
                                                <div className="w-[3px] h-[8px] rounded-sm bg-[var(--color-text-primary)]" />
                                                <div className="w-[3px] h-[10px] rounded-sm bg-[var(--color-text-primary)]" />
                                            </div>
                                            {/* WiFi */}
                                            <svg className="w-4 h-4 text-[var(--color-text-primary)]" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 16.4 10.6 16 12 16s2.6.4 3.5 1.1l1.4-1.4C15.6 14.6 13.9 14 12 14s-3.6.6-4.9 1.7zm-2.8-2.8l1.4 1.4C7.3 13 9.5 12 12 12s4.7 1 6.3 2.3l1.4-1.4C17.7 11.1 15 10 12 10s-5.7 1.1-7.7 2.9zM1.5 10l1.4 1.4C5.1 9.2 8.4 8 12 8s6.9 1.2 9.1 3.4L22.5 10C19.8 7.3 16.1 6 12 6s-7.8 1.3-10.5 4z"/>
                                            </svg>
                                            {/* Battery */}
                                            <div className="flex items-center gap-1">
                                                <div className="relative w-6 h-3 rounded-[3px] border border-[var(--color-text-primary)] p-[2px]">
                                                    <div className="h-full w-full rounded-[1px] bg-green-500" />
                                                </div>
                                                <div className="w-[2px] h-[4px] rounded-r-sm bg-[var(--color-text-primary)]" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Content - with safe area padding when status bar is hidden */}
                                <div 
                                    className={`space-y-5 ${deviceType === 'tablet' ? 'px-8' : 'px-5'}`}
                                    style={{
                                        paddingTop: showStatusBar ? 16 : (deviceType === 'phone' ? 56 : 20),
                                        // Scale up font sizes for tablets
                                        fontSize: deviceType === 'tablet' ? '1.25rem' : '1rem',
                                    }}
                                >
                                    {/* Stop Header */}
                                    <div className="space-y-3">
                                        <h1 
                                            className="font-bold text-[var(--color-text-primary)] leading-tight"
                                            style={{ fontSize: deviceType === 'tablet' ? '2.5rem' : '1.5rem' }}
                                        >
                                            {getStopTitle()}
                                        </h1>
                                        {getStopDescription() && (
                                            <p 
                                                className="text-[var(--color-text-secondary)] leading-relaxed"
                                                style={{ fontSize: deviceType === 'tablet' ? '1.25rem' : '1rem' }}
                                            >
                                                {getStopDescription()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Content Blocks */}
                                    {blocks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)]">
                                            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
                                                <RotateCcw className="w-8 h-8 opacity-50" />
                                            </div>
                                            <p className="text-sm">No content blocks yet</p>
                                            <p className="text-xs mt-1 opacity-60">Add content to see it here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            {blocks.map((block: ContentBlock) => (
                                                <StopContentBlock
                                                    key={block.id}
                                                    block={block}
                                                    mode="view"
                                                    language={previewLanguage}
                                                    deviceType={deviceType}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Bottom safe area padding */}
                                    <div className="h-8" />
                                </div>
                            </div>

                            {/* Home Indicator */}
                            <div 
                                className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/30"
                                style={{
                                    width: device.homeIndicatorWidth,
                                    height: device.homeIndicatorHeight,
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div 
                className="flex items-center justify-center gap-2 py-3 bg-[var(--color-bg-surface)]/80 backdrop-blur-sm border-t border-[var(--color-border-default)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-bg-elevated)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)]" />
                        {previewLanguage.toUpperCase()}
                    </span>
                    <span>·</span>
                    <span>This is how visitors will see this stop on their device</span>
                </div>
            </div>
        </div>
    );
}
