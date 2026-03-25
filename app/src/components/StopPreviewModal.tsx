import { useState, useRef, useEffect } from 'react';
import { X, Smartphone, Tablet, RotateCcw, RotateCw, ZoomIn, ZoomOut, Monitor, MonitorOff, ChevronLeft, MonitorPlay } from 'lucide-react';
import { StopContentBlock } from './blocks/StopContentBlock';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DisplaySettingsPanel, type DisplaySettings } from './DisplaySettingsPanel';
import { ChatDrawer, ChatFloatingButton, KioskChatButton } from './chat/ChatDrawer';
import type { Stop, Tour, ContentBlock } from '../types';

interface StopPreviewModalProps {
    stop: Stop;
    /** Tour data for tour blocks */
    tourData?: Tour;
    /** All stops for stop list blocks */
    allStops?: Stop[];
    /** Available languages from tour */
    availableLanguages?: string[];
    onClose: () => void;
}

type DeviceType = 'phone' | 'tablet' | 'kiosk';

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
        dynamic: false,
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
        dynamic: false,
    },
    kiosk: {
        width: 1920,
        height: 1080,
        label: 'Kiosk',
        icon: MonitorPlay,
        bezelRadius: 0,
        screenRadius: 12,
        bezelWidth: 0,
        notchWidth: 0,
        notchHeight: 0,
        homeIndicatorWidth: 0,
        homeIndicatorHeight: 0,
        dynamic: true,
    },
};

export function StopPreviewModal({ stop, tourData, allStops, availableLanguages = ['en'], onClose }: StopPreviewModalProps) {
    const [deviceType, setDeviceType] = useState<DeviceType>('phone');
    const [previewLanguage, setPreviewLanguage] = useState(tourData?.primaryLanguage || availableLanguages[0] || 'en');
    const [scale, setScale] = useState(0.75);
    const [showStatusBar, setShowStatusBar] = useState(true);
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
        showTitles: tourData?.displaySettings?.showTitles ?? true,
        showDescriptions: tourData?.displaySettings?.showDescriptions ?? true,
    });

    // Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Navigation within the simulator — clicking a stop list item loads that stop
    const [currentStop, setCurrentStop] = useState<Stop>(stop);
    const [stopHistory, setStopHistory] = useState<Stop[]>([]);

    const navigateToStop = (stopId: string) => {
        const target = allStops?.find(s => s.id === stopId);
        if (target) {
            setStopHistory(prev => [...prev, currentStop]);
            setCurrentStop(target);
        }
    };

    const navigateBack = () => {
        if (stopHistory.length > 0) {
            const prev = stopHistory[stopHistory.length - 1];
            setStopHistory(h => h.slice(0, -1));
            setCurrentStop(prev);
        }
    };

    // Measure the preview container for kiosk mode (fills available space)
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const isKioskMode = deviceType === 'kiosk';

    useEffect(() => {
        if (!isKioskMode || !previewContainerRef.current) return;
        const el = previewContainerRef.current;
        const measure = () => {
            // Subtract padding (32px each side = p-8)
            setContainerSize({ width: el.clientWidth - 64, height: el.clientHeight - 64 });
        };
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(el);
        return () => observer.disconnect();
    }, [isKioskMode]);

    // Calculate appropriate scale when device changes
    const getDefaultScale = (type: DeviceType, orient: 'portrait' | 'landscape' = 'portrait') => {
        if (type === 'kiosk') return 1;
        if (type === 'tablet') return orient === 'landscape' ? 0.45 : 0.55;
        return 0.75;
    };

    const handleDeviceChange = (type: DeviceType) => {
        setDeviceType(type);
        if (type !== 'tablet') setOrientation('portrait');
        setScale(getDefaultScale(type, type === 'tablet' ? orientation : 'portrait'));
    };

    const toggleOrientation = () => {
        const newOrient = orientation === 'portrait' ? 'landscape' : 'portrait';
        setOrientation(newOrient);
        setScale(getDefaultScale('tablet', newOrient));
    };

    const device = DEVICE_CONFIGS[deviceType];
    const isLandscape = deviceType === 'tablet' && orientation === 'landscape';
    const effectiveWidth = isLandscape ? device.height : device.width;
    const effectiveHeight = isLandscape ? device.width : device.height;
    const blocks = currentStop.contentBlocks || [];

    function getStopTitle(): string {
        if (typeof currentStop.title === 'object') {
            return currentStop.title[previewLanguage] || currentStop.title.en || Object.values(currentStop.title)[0] || 'Untitled';
        }
        return String(currentStop.title);
    }

    function getStopDescription(): string | undefined {
        if (!currentStop.description) return undefined;
        if (typeof currentStop.description === 'object') {
            return currentStop.description[previewLanguage] || currentStop.description.en || undefined;
        }
        return String(currentStop.description);
    }

    const adjustScale = (delta: number) => {
        setScale(prev => Math.min(1.2, Math.max(0.5, prev + delta)));
    };

    const resetScale = () => setScale(getDefaultScale(deviceType, orientation));

    // Calculate scaled dimensions
    const scaledWidth = effectiveWidth + (device.bezelWidth * 2);
    const scaledHeight = effectiveHeight + (device.bezelWidth * 2);

    return (
        <div
            className="fixed inset-0 z-[110] flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0d0d0d]"
            onClick={onClose}
        >
            {/* Header Bar */}
            <div
                className="flex items-center gap-4 px-4 py-3 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-b border-[var(--color-border-default)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Title */}
                <h2 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                    Preview: <span className="text-[var(--color-accent-primary)]">{getStopTitle()}</span>
                </h2>

                {/* Spacer */}
                <div className="flex-1 min-w-0" />

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
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
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

                {/* Orientation Toggle - iPad only */}
                {deviceType === 'tablet' && (
                    <button
                        onClick={toggleOrientation}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${isLandscape
                                ? 'bg-[var(--color-accent-primary)]/15 border-[var(--color-accent-primary)]/40 text-[var(--color-accent-primary)]'
                                : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                            }`}
                        title={orientation === 'portrait' ? 'Switch to landscape' : 'Switch to portrait'}
                    >
                        <RotateCw className="w-4 h-4" />
                        <span className="hidden lg:inline">{isLandscape ? 'Portrait' : 'Landscape'}</span>
                    </button>
                )}

                {/* Dimensions Badge */}
                <span className="hidden md:inline text-xs text-[var(--color-text-muted)] font-mono bg-[var(--color-bg-elevated)] px-2 py-1 rounded">
                    {isKioskMode
                        ? `${containerSize.width || '—'} × ${containerSize.height || '—'}`
                        : `${effectiveWidth} × ${effectiveHeight}`
                    }
                </span>

                {/* Status Bar Toggle - hidden for kiosk */}
                {!isKioskMode && (
                    <button
                        onClick={() => setShowStatusBar(!showStatusBar)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border ${showStatusBar
                            ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-secondary)]'
                            : 'bg-[var(--color-bg-hover)] border-[var(--color-border-hover)] text-[var(--color-text-muted)]'
                            }`}
                        title={showStatusBar ? 'Hide status bar' : 'Show status bar'}
                    >
                        {showStatusBar ? <Monitor className="w-4 h-4" /> : <MonitorOff className="w-4 h-4" />}
                        <span className="hidden lg:inline">{showStatusBar ? 'Status Bar' : 'No Status'}</span>
                    </button>
                )}

                {/* Zoom Controls - hidden for kiosk (fills available space) */}
                {!isKioskMode && (
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
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="group shrink-0 p-2.5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] shadow-sm hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)] hover:shadow-md active:scale-95 transition-all duration-300 ease-out"
                    title="Close preview (Esc)"
                >
                    <X className="w-5 h-5 transition-transform duration-300 ease-out group-hover:rotate-90" />
                </button>

            </div>

            {/* Device Preview Area */}
            <div
                ref={previewContainerRef}
                className="flex-1 overflow-auto p-8"
                onClick={(e) => e.stopPropagation()}
            >
                {isKioskMode ? (
                    /* ===== KIOSK MODE: Frameless, fills available space ===== */
                    <div className="w-full h-full flex items-center justify-center">
                        <div
                            className="relative w-full h-full overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)]"
                            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}
                        >
                            {/* Screen Content */}
                            <div
                                className="h-full overflow-y-auto"
                                style={{ scrollbarWidth: 'none' }}
                            >
                                {/* Back navigation bar when viewing a different stop */}
                                {stopHistory.length > 0 && !(blocks.length > 0 && blocks[0].type === 'tour') && (
                                    <div className="sticky top-0 z-10 bg-[var(--color-bg-surface)]/95 backdrop-blur-md">
                                        <div className="flex items-center gap-2 py-2 px-10 border-b border-[var(--color-border-default)]">
                                            <button
                                                onClick={navigateBack}
                                                className="flex items-center gap-1 text-[var(--color-accent-primary)] text-sm hover:underline"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Back
                                            </button>
                                            <span className="text-xs text-[var(--color-text-muted)] truncate flex-1 text-right">
                                                {getStopTitle()}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Content */}
                                {(() => {
                                    const hasTourIntroFirst = blocks.length > 0 && blocks[0].type === 'tour';
                                    const kioskContentHeight = containerSize.height || undefined;
                                    return (
                                        <div
                                            className={hasTourIntroFirst ? '' : 'space-y-5 px-10'}
                                            style={hasTourIntroFirst ? { height: kioskContentHeight, minHeight: kioskContentHeight } : {
                                                paddingTop: 24,
                                                fontSize: '1.25rem',
                                            }}
                                        >
                                            {/* Stop Header */}
                                            {!hasTourIntroFirst && (displaySettings.showTitles || displaySettings.showDescriptions) && (
                                                <div className="space-y-3 mb-4">
                                                    {displaySettings.showTitles && (currentStop.showTitle ?? true) && (
                                                        <h1
                                                            className="font-bold text-[var(--color-text-primary)] leading-tight"
                                                            style={{ fontSize: '2.5rem' }}
                                                        >
                                                            {getStopTitle()}
                                                        </h1>
                                                    )}
                                                    {displaySettings.showDescriptions && (currentStop.showDescription ?? true) && getStopDescription() && (
                                                        <p
                                                            className="text-[var(--color-text-secondary)] leading-relaxed"
                                                            style={{ fontSize: '1.25rem' }}
                                                        >
                                                            {getStopDescription()}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* Hero Image */}
                                            {!hasTourIntroFirst && (currentStop.showImage ?? true) && (() => {
                                                const heroImage = currentStop.image;
                                                if (!heroImage) return null;
                                                const imageData = typeof heroImage === 'object'
                                                    ? heroImage
                                                    : { url: heroImage, caption: {} };
                                                if (!imageData.url) return null;
                                                const caption = typeof imageData.caption === 'object'
                                                    ? imageData.caption[previewLanguage] || imageData.caption.en || ''
                                                    : '';
                                                return (
                                                    <figure className="overflow-hidden rounded-lg mb-4 -mx-10">
                                                        <img
                                                            src={imageData.url}
                                                            alt=""
                                                            className="w-full h-auto object-cover"
                                                            style={{ maxHeight: (containerSize.height || 600) * 0.4 }}
                                                        />
                                                        {caption && (
                                                            <figcaption
                                                                className="text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 leading-snug"
                                                                style={{ fontSize: '0.9rem', padding: '0.75rem 2.5rem' }}
                                                            >
                                                                {caption}
                                                            </figcaption>
                                                        )}
                                                    </figure>
                                                );
                                            })()}

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
                                                <div className={hasTourIntroFirst ? '' : 'space-y-5'} style={hasTourIntroFirst ? { height: '100%', minHeight: '100%' } : {}}>
                                                    {blocks.map((block: ContentBlock, index: number) => {
                                                        const isHtmlFill = block.type === 'html' && ((block.data as any).sizing || 'fill') === 'fill';
                                                        return (
                                                            <div
                                                                key={block.id}
                                                                className={
                                                                    index === 0 && hasTourIntroFirst
                                                                        ? ''
                                                                        : index > 0 && hasTourIntroFirst
                                                                            ? 'space-y-5 px-10'
                                                                            : ''
                                                                }
                                                                style={
                                                                    index === 0 && hasTourIntroFirst
                                                                        ? { height: kioskContentHeight, minHeight: kioskContentHeight }
                                                                        : isHtmlFill
                                                                            ? { height: `${effectiveHeight - 60}px`, minHeight: '400px' }
                                                                            : {}
                                                                }
                                                            >
                                                                <StopContentBlock
                                                                    block={block}
                                                                    mode="view"
                                                                    language={previewLanguage}
                                                                    deviceType={deviceType}
                                                                    tourData={tourData}
                                                                    allStops={allStops}
                                                                    displaySettings={displaySettings}
                                                                    onNavigateToStop={navigateToStop}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Bottom padding */}
                                            {!hasTourIntroFirst && <div className="h-8" />}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Kiosk Chat Button + Drawer */}
                            {tourData?.conciergeEnabled !== false && (
                                <>
                                    <KioskChatButton
                                        onClick={() => setIsChatOpen(true)}
                                        contained
                                        iconName={tourData?.conciergeChatIcon}
                                        iconColor={tourData?.conciergeChatIconColor}
                                        iconBgColor={tourData?.conciergeChatIconBgColor}
                                    />
                                    <ChatDrawer
                                        isOpen={isChatOpen}
                                        onClose={() => setIsChatOpen(false)}
                                        language={previewLanguage}
                                        tourId={tourData?.id}
                                        contained
                                        tourQuickActions={(() => {
                                            const raw = tourData?.conciergeQuickActions;
                                            if (!raw) return undefined;
                                            if (Array.isArray(raw)) return raw;
                                            try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                                        })()}
                                        tourWelcomeMessage={(() => {
                                            const raw = tourData?.conciergeWelcome;
                                            if (!raw) return undefined;
                                            if (typeof raw === 'object') return raw;
                                            try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                                        })()}
                                        iconName={tourData?.conciergeChatIcon}
                                        iconColor={tourData?.conciergeChatIconColor}
                                        iconBgColor={tourData?.conciergeChatIconBgColor}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ===== PHONE / TABLET MODE: Device frame with bezel ===== */
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '100%',
                            minHeight: '100%',
                        }}
                    >
                        <div
                            style={{
                                width: scaledWidth * scale,
                                height: scaledHeight * scale,
                                flexShrink: 0,
                                transition: 'width 300ms ease-out, height 300ms ease-out',
                            }}
                        >
                            <div
                                className="relative"
                                style={{
                                    transform: `scale(${scale})`,
                                    transformOrigin: 'top left',
                                    transition: 'transform 300ms ease-out',
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
                                    {/* Side Buttons - hidden in landscape */}
                                    {!isLandscape && (
                                        <>
                                            {/* Volume (left side) */}
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
                                            {/* Power (right side) */}
                                            <div
                                                className="absolute -right-[3px] top-[160px] w-[3px] h-[80px] rounded-r-sm"
                                                style={{ background: 'linear-gradient(270deg, #1a1a1a, #2a2a2a)' }}
                                            />
                                        </>
                                    )}

                                    {/* Inner Bezel */}
                                    <div
                                        className="absolute inset-0 m-[1px]"
                                        style={{
                                            borderRadius: device.bezelRadius - 1,
                                            background: 'linear-gradient(180deg, #1f1f1f 0%, #171717 100%)',
                                        }}
                                    />

                                    {/* Screen Area */}
                                    <div
                                        className="absolute overflow-hidden bg-[var(--color-bg-primary)]"
                                        style={{
                                            top: device.bezelWidth,
                                            left: device.bezelWidth,
                                            width: effectiveWidth,
                                            height: effectiveHeight,
                                            borderRadius: device.screenRadius,
                                        }}
                                    >
                                        {/* Status Bar — positioned absolutely at top, BEHIND the notch (like real iOS) */}
                                        {showStatusBar && (
                                            <div
                                                className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6"
                                                style={{
                                                    paddingTop: deviceType === 'phone' ? 14 : 8,
                                                    paddingBottom: 4,
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
                                                        <path d="M12 18c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4.9-2.3l1.4 1.4C9.4 16.4 10.6 16 12 16s2.6.4 3.5 1.1l1.4-1.4C15.6 14.6 13.9 14 12 14s-3.6.6-4.9 1.7zm-2.8-2.8l1.4 1.4C7.3 13 9.5 12 12 12s4.7 1 6.3 2.3l1.4-1.4C17.7 11.1 15 10 12 10s-5.7 1.1-7.7 2.9zM1.5 10l1.4 1.4C5.1 9.2 8.4 8 12 8s6.9 1.2 9.1 3.4L22.5 10C19.8 7.3 16.1 6 12 6s-7.8 1.3-10.5 4z" />
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

                                        {/* Dynamic Island / Notch (Phone only) — above status bar and content */}
                                        {deviceType === 'phone' && (
                                            <div
                                                className="absolute top-[10px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center"
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

                                        {/* Screen Content — starts below the notch safe area */}
                                        <div
                                            className="h-full overflow-y-auto"
                                            style={{ scrollbarWidth: 'none', height: effectiveHeight }}
                                        >
                                            {/* Safe area spacer + back navigation */}
                                            {!(blocks.length > 0 && blocks[0].type === 'tour') && (
                                                <div className="sticky top-0 z-10 bg-[var(--color-bg-surface)]/95 backdrop-blur-md">
                                                    {/* Safe area spacer — always present to keep content below notch */}
                                                    <div style={{ height: deviceType === 'phone' ? 48 : 24 }} />

                                                    {/* Back navigation bar when viewing a different stop */}
                                                    {stopHistory.length > 0 && (
                                                        <div className={`flex items-center gap-2 py-2 border-b border-[var(--color-border-default)] ${deviceType === 'tablet' ? 'px-8' : 'px-5'}`}>
                                                            <button
                                                                onClick={navigateBack}
                                                                className="flex items-center gap-1 text-[var(--color-accent-primary)] text-sm hover:underline"
                                                            >
                                                                <ChevronLeft className="w-4 h-4" />
                                                                Back
                                                            </button>
                                                            <span className="text-xs text-[var(--color-text-muted)] truncate flex-1 text-right">
                                                                {getStopTitle()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Content */}
                                            {/* Remove padding for Tour Intro blocks to allow full-bleed */}
                                            {(() => {
                                                const hasTourIntroFirst = blocks.length > 0 && blocks[0].type === 'tour';
                                                return (
                                                    <div
                                                        className={hasTourIntroFirst ? '' : `space-y-5 ${deviceType === 'tablet' ? 'px-8' : 'px-5'}`}
                                                        style={hasTourIntroFirst ? { height: effectiveHeight, minHeight: effectiveHeight } : {
                                                            paddingTop: 16,
                                                            fontSize: deviceType === 'tablet' ? '1.25rem' : '1rem',
                                                        }}
                                                    >
                                                        {/* Stop Header - MOVED TO TOP - hide when Tour Intro block is first (it has its own title/desc) */}
                                                        {!hasTourIntroFirst && (displaySettings.showTitles || displaySettings.showDescriptions) && (
                                                            <div className="space-y-3 mb-4">
                                                                {displaySettings.showTitles && (currentStop.showTitle ?? true) && (
                                                                    <h1
                                                                        className="font-bold text-[var(--color-text-primary)] leading-tight"
                                                                        style={{ fontSize: deviceType === 'tablet' ? '2.5rem' : '1.5rem' }}
                                                                    >
                                                                        {getStopTitle()}
                                                                    </h1>
                                                                )}
                                                                {displaySettings.showDescriptions && (currentStop.showDescription ?? true) && getStopDescription() && (
                                                                    <p
                                                                        className="text-[var(--color-text-secondary)] leading-relaxed"
                                                                        style={{ fontSize: deviceType === 'tablet' ? '1.25rem' : '1rem' }}
                                                                    >
                                                                        {getStopDescription()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Hero Image - NOW SECOND - hide when Tour Intro block is first */}
                                                        {!hasTourIntroFirst && (currentStop.showImage ?? true) && (() => {
                                                            const heroImage = currentStop.image;
                                                            if (!heroImage) return null;

                                                            // Handle both new object format and legacy string format
                                                            const imageData = typeof heroImage === 'object'
                                                                ? heroImage
                                                                : { url: heroImage, caption: {} };

                                                            if (!imageData.url) return null;

                                                            const caption = typeof imageData.caption === 'object'
                                                                ? imageData.caption[previewLanguage] || imageData.caption.en || ''
                                                                : '';

                                                            return (
                                                                <figure className={`overflow-hidden rounded-lg mb-4 ${deviceType === 'tablet' ? '-mx-8' : '-mx-5'}`}>
                                                                    <img
                                                                        src={imageData.url}
                                                                        alt=""
                                                                        className="w-full h-auto object-cover"
                                                                        style={{ maxHeight: effectiveHeight * 0.4 }}
                                                                    />
                                                                    {caption && (
                                                                        <figcaption
                                                                            className="text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50 leading-snug"
                                                                            style={{
                                                                                fontSize: deviceType === 'tablet' ? '0.9rem' : '0.75rem',
                                                                                padding: deviceType === 'tablet' ? '0.75rem 2rem' : '0.5rem 1.25rem'
                                                                            }}
                                                                        >
                                                                            {caption}
                                                                        </figcaption>
                                                                    )}
                                                                </figure>
                                                            );
                                                        })()}

                                                        {/* Content Blocks */}
                                                        {blocks.length === 0 ? (
                                                            <div className={`flex flex-col items-center justify-center py-16 text-[var(--color-text-muted)] ${hasTourIntroFirst ? 'px-5' : ''}`}>
                                                                <div className="w-16 h-16 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center mb-4">
                                                                    <RotateCcw className="w-8 h-8 opacity-50" />
                                                                </div>
                                                                <p className="text-sm">No content blocks yet</p>
                                                                <p className="text-xs mt-1 opacity-60">Add content to see it here</p>
                                                            </div>
                                                        ) : (
                                                            <div className={hasTourIntroFirst ? '' : 'space-y-5'} style={hasTourIntroFirst ? { height: '100%', minHeight: '100%' } : {}}>
                                                                {blocks.map((block: ContentBlock, index: number) => {
                                                                    const isHtmlFill = block.type === 'html' && ((block.data as any).sizing || 'fill') === 'fill';
                                                                    return (
                                                                        <div
                                                                            key={block.id}
                                                                            className={
                                                                                index === 0 && hasTourIntroFirst
                                                                                    ? ''
                                                                                    : index > 0 && hasTourIntroFirst
                                                                                        ? `space-y-5 ${deviceType === 'tablet' ? 'px-8' : 'px-5'}`
                                                                                        : ''
                                                                            }
                                                                            style={
                                                                                index === 0 && hasTourIntroFirst
                                                                                    ? { height: effectiveHeight, minHeight: effectiveHeight }
                                                                                    : isHtmlFill
                                                                                        ? { height: `${effectiveHeight - 60}px`, minHeight: '400px' }
                                                                                        : {}
                                                                            }
                                                                        >
                                                                            <StopContentBlock
                                                                                block={block}
                                                                                mode="view"
                                                                                language={previewLanguage}
                                                                                deviceType={deviceType}
                                                                                tourData={tourData}
                                                                                allStops={allStops}
                                                                                displaySettings={displaySettings}
                                                                                onNavigateToStop={navigateToStop}
                                                                            />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Bottom safe area padding */}
                                                        {!hasTourIntroFirst && <div className="h-8" />}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Chat Floating Button + Drawer (inside device screen) */}
                                        {tourData?.conciergeEnabled !== false && (
                                            <>
                                                {!isKioskMode && (
                                                    <ChatFloatingButton
                                                        onClick={() => setIsChatOpen(true)}
                                                        contained
                                                        iconName={tourData?.conciergeChatIcon}
                                                        iconColor={tourData?.conciergeChatIconColor}
                                                        iconBgColor={tourData?.conciergeChatIconBgColor}
                                                    />
                                                )}
                                                <ChatDrawer
                                                    isOpen={isChatOpen}
                                                    onClose={() => setIsChatOpen(false)}
                                                    language={previewLanguage}
                                                    tourId={tourData?.id}
                                                    contained
                                                    tourQuickActions={(() => {
                                                        const raw = tourData?.conciergeQuickActions;
                                                        if (!raw) return undefined;
                                                        if (Array.isArray(raw)) return raw;
                                                        try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                                                    })()}
                                                    tourWelcomeMessage={(() => {
                                                        const raw = tourData?.conciergeWelcome;
                                                        if (!raw) return undefined;
                                                        if (typeof raw === 'object') return raw;
                                                        try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                                                    })()}
                                                    iconName={tourData?.conciergeChatIcon}
                                                    iconColor={tourData?.conciergeChatIconColor}
                                                    iconBgColor={tourData?.conciergeChatIconBgColor}
                                                />
                                            </>
                                        )}

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
                    </div>
                )}
            </div>

            {/* Display Settings FAB */}
            <DisplaySettingsPanel
                settings={displaySettings}
                onChange={setDisplaySettings}
                position="bottom-right"
            />

            {/* Footer */}
            <div
                className="flex items-center gap-2 py-3 px-4 bg-[var(--color-bg-surface)]/80 backdrop-blur-sm border-t border-[var(--color-border-default)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Language Switcher - bottom left */}
                {availableLanguages.length > 1 ? (
                    <LanguageSwitcher
                        availableLanguages={availableLanguages}
                        activeLanguage={previewLanguage}
                        onChange={setPreviewLanguage}
                        size="sm"
                        showStatus={false}
                    />
                ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--color-bg-elevated)] text-xs text-[var(--color-text-muted)]">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)]" />
                        {previewLanguage.toUpperCase()}
                    </span>
                )}

                <div className="flex-1" />

                <span className="text-xs text-[var(--color-text-muted)]">
                    {isKioskMode ? 'Kiosk preview — content fills available space' : 'This is how visitors will see this stop on their device'}
                </span>
            </div>
        </div>
    );
}
