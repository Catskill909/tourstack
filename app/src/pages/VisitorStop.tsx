import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Globe, AlertCircle, Loader2, ChevronLeft, ChevronRight, Settings, Maximize, RotateCcw, MapPin, QrCode, Smartphone, X, Navigation } from 'lucide-react';
import { StopContentBlock } from '../components/blocks/StopContentBlock';
import { DisplaySettingsPanel, type DisplaySettings } from '../components/DisplaySettingsPanel';
import { ChatDrawer, ChatFloatingButton, KioskChatButton } from '../components/chat/ChatDrawer';
import { useGeofenceMonitor, type GeofenceTarget } from '../hooks/useGeofenceMonitor';
import type { Stop, ContentBlock, TourQuickAction, PositioningConfig } from '../types';

// API returns tour with full stop objects (not just IDs)
interface TourWithStops {
    id: string;
    slug: string;
    title: Record<string, string>;
    description?: Record<string, string>;
    status: string;
    languages: string[];
    stops: Stop[];
    displaySettings?: {
        showTitles: boolean;
        showDescriptions: boolean;
    };
    conciergeEnabled?: boolean;
    conciergeQuickActions?: TourQuickAction[];
    conciergeWelcome?: Record<string, string>;
    conciergeChatIcon?: string;
    conciergeChatIconColor?: string;
    conciergeChatIconBgColor?: string;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
};

export function VisitorStop() {
    const { tourId: tourSlugOrId, stopId: stopSlugOrId } = useParams<{ tourId: string; stopId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('t');

    // Kiosk mode URL parameters
    const urlLang = searchParams.get('lang');
    const isKioskMode = searchParams.get('kiosk') === 'true';
    const hideNav = searchParams.get('hideNav') === 'true';
    const autoRestart = searchParams.get('autoRestart') === 'true';
    const requestFullscreen = searchParams.get('fullscreen') === 'true';
    const showChat = searchParams.get('showChat') === 'true';
    const kioskReset = searchParams.get('kioskReset'); // URL to return to staff screen

    const [tour, setTour] = useState<TourWithStops | null>(null);
    const [allStopsRaw, setAllStopsRaw] = useState<Stop[]>([]);
    const allStops = useMemo(() => [...allStopsRaw].sort((a, b) => a.order - b.order), [allStopsRaw]);
    const [stop, setStop] = useState<Stop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState(urlLang || 'en');
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);
    const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
        showTitles: true,
        showDescriptions: true,
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [fallbackDismissed, setFallbackDismissed] = useState(false);
    const [geoTargets, setGeoTargets] = useState<GeofenceTarget[]>([]);
    const [geoDismissed, setGeoDismissed] = useState(false);

    // Kiosk inactivity reset
    const [showKioskReset, setShowKioskReset] = useState(false);
    const [resetCountdown, setResetCountdown] = useState(30);
    const inactivityTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval>>(undefined);

    // Determine device type for content rendering
    // Kiosk mode gets kiosk sizing, otherwise detect from screen width
    const deviceType = isKioskMode ? 'kiosk' as const
        : window.innerWidth >= 820 ? 'tablet' as const
            : 'phone' as const;

    // Check if user is staff (simplified - could use auth system later)
    // Kiosk mode and staff param (from admin preview) both indicate staff access
    const isStaffParam = searchParams.get('staff') === 'true';
    const isStaff = localStorage.getItem('tourstack_staff') === 'true' || isKioskMode || isStaffParam;

    // Fetch tour and stop data using visitor API (supports slugs)
    useEffect(() => {
        async function fetchData() {
            if (!tourSlugOrId || !stopSlugOrId) {
                setError('Invalid tour or stop');
                setLoading(false);
                return;
            }

            try {
                // Use visitor API which supports both slugs and IDs
                const res = await fetch(`/api/visitor/tour/${tourSlugOrId}/stop/${stopSlugOrId}`);
                if (!res.ok) {
                    throw new Error('Content not found');
                }
                const data = await res.json();

                // Check if tour is published (or staff viewing draft)
                if (data.tour.status !== 'published' && !isStaff) {
                    setError('This tour is not available yet');
                    setLoading(false);
                    return;
                }

                setTour(data.tour);
                setStop(data.stop);
                setAllStopsRaw(data.allStops || []);

                // Set initial language from URL param or tour's first language
                if (urlLang && data.tour.languages?.includes(urlLang)) {
                    setLanguage(urlLang);
                } else if (data.tour.languages?.length > 0) {
                    setLanguage(data.tour.languages[0]);
                }

                // Initialize display settings from tour data
                if (data.tour.displaySettings) {
                    setDisplaySettings({
                        showTitles: data.tour.displaySettings.showTitles ?? true,
                        showDescriptions: data.tour.displaySettings.showDescriptions ?? true,
                    });
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching tour data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load content');
                setLoading(false);
            }
        }

        fetchData();
    }, [tourSlugOrId, stopSlugOrId, isStaff, urlLang]);

    // Fetch GPS geofence targets for this tour
    useEffect(() => {
        if (!tourSlugOrId) return;
        fetch(`/api/visitor/tour/${tourSlugOrId}/gps-stops`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data?.gpsStops?.length) {
                    setGeoTargets(data.gpsStops.map((s: any) => ({
                        id: s.id,
                        lat: s.latitude,
                        lng: s.longitude,
                        radius: s.radius,
                    })));
                }
            })
            .catch(() => { /* non-critical */ });
    }, [tourSlugOrId]);

    // Geofence monitoring — auto-navigate when entering a different stop's zone
    const handleGeofenceEnter = useCallback((stopId: string) => {
        if (!tour || stopId === stop?.id) return;
        const target = allStops.find(s => s.id === stopId);
        if (target) {
            navigate(`/visitor/tour/${tour.slug || tour.id}/stop/${target.slug || target.id}?${searchParams.toString()}`);
        }
    }, [tour, stop, allStops, searchParams, navigate]);

    const geofence = useGeofenceMonitor(geoTargets, handleGeofenceEnter);
    const hasGpsStops = geoTargets.length > 0;
    const showGeoPrompt = hasGpsStops && geofence.permission === 'prompt' && !geoDismissed;

    // Fullscreen API handling
    useEffect(() => {
        if (requestFullscreen && !loading && tour) {
            const enterFullscreen = async () => {
                try {
                    if (document.documentElement.requestFullscreen) {
                        await document.documentElement.requestFullscreen();
                        setIsFullscreen(true);
                    }
                } catch (err) {
                    console.log('Fullscreen request denied:', err);
                }
            };
            // Small delay to ensure page is rendered
            const timer = setTimeout(enterFullscreen, 500);
            return () => clearTimeout(timer);
        }
    }, [requestFullscreen, loading, tour]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Toggle fullscreen
    const toggleFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.log('Fullscreen toggle failed:', err);
        }
    }, []);

    // Kiosk inactivity reset — returns to staff screen after idle period
    const resetInactivityTimer = useCallback(() => {
        if (!kioskReset || showKioskReset) return;
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            setShowKioskReset(true);
            setResetCountdown(30);
        }, 5 * 60 * 1000); // 5 minutes
    }, [kioskReset, showKioskReset]);

    useEffect(() => {
        if (!kioskReset) return;
        const events = ['touchstart', 'mousedown', 'scroll', 'keydown'] as const;
        events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
        resetInactivityTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [kioskReset, resetInactivityTimer]);

    useEffect(() => {
        if (!showKioskReset) return;
        countdownTimerRef.current = setInterval(() => {
            setResetCountdown(prev => {
                if (prev <= 1) {
                    navigate(decodeURIComponent(kioskReset!));
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
    }, [showKioskReset, kioskReset, navigate]);

    function dismissKioskReset() {
        setShowKioskReset(false);
        setResetCountdown(30);
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        resetInactivityTimer();
    }

    // Handle tour restart (for kiosk auto-restart)
    const handleRestartTour = useCallback(() => {
        if (!tour || allStops.length === 0) return;
        const firstStop = allStops[0];
        // Preserve kiosk params when restarting
        const params = new URLSearchParams(searchParams);
        navigate(`/visitor/tour/${tour.slug || tour.id}/stop/${firstStop.slug || firstStop.id}?${params.toString()}`);
    }, [tour, allStops, searchParams, navigate]);

    // Get localized text
    function getLocalizedText(field: string | Record<string, string> | null | undefined): string {
        if (!field) return '';
        if (typeof field === 'string') return field;
        return field[language] || field.en || Object.values(field)[0] || '';
    }

    // Get stop index and navigation using allStops
    const stopIndex = allStops.findIndex((s) => s.id === stop?.id) ?? -1;
    const prevStop = stopIndex > 0 ? allStops[stopIndex - 1] : null;
    const nextStop = stopIndex >= 0 && stopIndex < allStops.length - 1 ? allStops[stopIndex + 1] : null;

    // Auto-detection positioning methods that can fail (GPS denied, BLE unavailable, etc.)
    const AUTO_DETECT_METHODS = new Set(['gps', 'ble_beacon', 'ble_virtual', 'wifi', 'uwb', 'audio_watermark', 'image_recognition']);

    // Determine if we should show the backup positioning fallback banner
    const showFallbackBanner = !fallbackDismissed
        && stop?.primaryPositioning
        && AUTO_DETECT_METHODS.has((stop.primaryPositioning as PositioningConfig).method)
        && stop.backupPositioning
        && (stop.backupPositioning as PositioningConfig).method;

    function getFallbackMessage(config: PositioningConfig): { icon: React.ReactNode; text: string } {
        switch (config.method) {
            case 'qr_code':
                return { icon: <QrCode className="w-4 h-4 shrink-0" />, text: 'Scan the QR code at this exhibit' };
            case 'nfc':
                return { icon: <Smartphone className="w-4 h-4 shrink-0" />, text: 'Tap the NFC tag at this exhibit' };
            case 'manual':
                return { icon: <MapPin className="w-4 h-4 shrink-0" />, text: config.instructions || 'Find this exhibit manually' };
            default:
                return { icon: <MapPin className="w-4 h-4 shrink-0" />, text: 'Navigate to this exhibit manually' };
        }
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[var(--color-accent-primary)] mx-auto mb-4" />
                    <p className="text-[var(--color-text-muted)]">Loading tour content...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !tour || !stop) {
        return (
            <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        Content Not Available
                    </h1>
                    <p className="text-[var(--color-text-muted)] mb-6">
                        {error || 'This tour content could not be loaded.'}
                    </p>
                    {isStaff && tourSlugOrId && (
                        <Link
                            to={`/tours/${tourSlugOrId}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-[#1a1a1a] rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            <Settings className="w-4 h-4" />
                            Back to Admin
                        </Link>
                    )}
                </div>
            </div>
        );
    }

    const blocks = stop.contentBlocks || [];
    const availableLanguages = tour.languages || ['en'];
    const hasTourIntroFirst = blocks.length > 0 && blocks[0].type === 'tour';

    return (
        <div className="relative min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header — transparent overlay when Tour Intro is first block so it doesn't push content down */}
            <header className={`${hasTourIntroFirst ? 'absolute inset-x-0 top-0' : 'sticky top-0'} z-50 ${hasTourIntroFirst ? 'bg-transparent' : 'bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-b border-[var(--color-border-default)]'}`}>
                <div className={`${deviceType === 'kiosk' ? 'max-w-7xl px-10' : 'max-w-4xl px-4'} mx-auto py-3 flex items-center justify-between`}>
                    {/* Back / Tour Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {!hideNav && prevStop ? (
                            <Link
                                to={`/visitor/tour/${tour.slug}/stop/${prevStop.slug}${token ? `?t=${token}` : ''}`}
                                className="p-2 -ml-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                title={`Previous: ${getLocalizedText(prevStop.title)}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        ) : !hideNav ? (
                            <div className="w-9" /> // Spacer
                        ) : null}
                        <div className="min-w-0 flex-1">
                            <p className="text-xs text-[var(--color-text-muted)] truncate">
                                {getLocalizedText(tour.title)}
                            </p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                {stopIndex + 1} of {allStops.length}
                            </p>
                        </div>
                    </div>

                    {/* Language Selector */}
                    {availableLanguages.length > 1 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-full text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <Globe className="w-4 h-4" />
                                {language.toUpperCase()}
                            </button>
                            {showLanguageMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowLanguageMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 py-2 w-40 bg-[var(--color-bg-elevated)] rounded-xl shadow-xl border border-[var(--color-border-default)] z-50">
                                        {availableLanguages.map((lang) => (
                                            <button
                                                key={lang}
                                                onClick={() => {
                                                    setLanguage(lang);
                                                    setShowLanguageMenu(false);
                                                }}
                                                className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)] transition-colors ${language === lang
                                                    ? 'text-[var(--color-accent-primary)] font-medium'
                                                    : 'text-[var(--color-text-primary)]'
                                                    }`}
                                            >
                                                {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Next Stop */}
                    {!hideNav && nextStop ? (
                        <Link
                            to={`/visitor/tour/${tour.slug}/stop/${nextStop.slug}${token ? `?t=${token}` : ''}`}
                            className="p-2 -mr-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            title={`Next: ${getLocalizedText(nextStop.title)}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    ) : !hideNav ? (
                        <div className="w-9" /> // Spacer
                    ) : null}
                </div>
            </header>

            {/* Backup Positioning Fallback Banner */}
            {showFallbackBanner && (() => {
                const backup = stop!.backupPositioning as PositioningConfig;
                const { icon, text } = getFallbackMessage(backup);
                return (
                    <div className="bg-blue-500/15 border-b border-blue-500/25">
                        <div className={`${deviceType === 'kiosk' ? 'max-w-7xl px-10' : 'max-w-4xl px-4'} mx-auto py-2.5 flex items-center justify-between gap-3`}>
                            <div className="flex items-center gap-2 text-blue-300 text-sm">
                                {icon}
                                <span>{text}</span>
                            </div>
                            <button
                                onClick={() => setFallbackDismissed(true)}
                                className="p-1 text-blue-400/60 hover:text-blue-300 transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* GPS Geofence Permission Prompt */}
            {showGeoPrompt && (
                <div className="bg-green-500/10 border-b border-green-500/20">
                    <div className={`${deviceType === 'kiosk' ? 'max-w-7xl px-10' : 'max-w-4xl px-4'} mx-auto py-2.5 flex items-center justify-between gap-3`}>
                        <div className="flex items-center gap-2 text-green-300 text-sm">
                            <Navigation className="w-4 h-4 shrink-0" />
                            <span>Enable location to auto-navigate between stops</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => geofence.start()}
                                className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                                Enable
                            </button>
                            <button
                                onClick={() => setGeoDismissed(true)}
                                className="p-1 text-green-400/60 hover:text-green-300 transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            {(() => {
                const isKiosk = deviceType === 'kiosk';
                const contentMaxWidth = isKiosk ? 'max-w-7xl' : 'max-w-4xl';
                const contentPadding = isKiosk ? 'px-10' : 'px-4';

                const handleNavigateToStop = (stopId: string) => {
                    const target = allStops.find(s => s.id === stopId);
                    if (target && tour) navigate(`/visitor/tour/${tour.slug || tour.id}/stop/${target.slug || target.id}?${searchParams.toString()}`);
                };

                // Tour Intro block - full viewport, no padding
                // IMPORTANT: The first block wrapper needs explicit `height` (not just `minHeight`)
                // because CSS percentage heights (h-full / height:100%) only resolve against
                // a parent's `height` — `min-height` does NOT count for percentage resolution.
                // Without this, the Tour Intro block collapses and the card is pushed off-screen.
                if (hasTourIntroFirst) {
                    return (
                        <>
                            {/* Tour Intro fills the screen */}
                            <div className="relative" style={{ minHeight: '100dvh' }}>
                                {blocks.map((block: ContentBlock, index: number) => (
                                    <div
                                        key={block.id}
                                        className={index === 0 ? '' : `${contentMaxWidth} mx-auto ${contentPadding} py-6`}
                                        style={index === 0 ? { height: '100dvh', minHeight: '100dvh' } : {}}
                                    >
                                        <StopContentBlock
                                            block={block}
                                            mode="view"
                                            language={language}
                                            deviceType={deviceType}
                                            tourData={tour as any}
                                            allStops={allStops}
                                            currentStopId={stop?.id}
                                            displaySettings={displaySettings}
                                            onNavigateToStop={handleNavigateToStop}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    );
                }

                // Normal content - standard layout
                return (
                    <main className={`${contentMaxWidth} mx-auto ${contentPadding} py-6`}>
                        {/* Stop Title & Description - MOVED TO TOP */}
                        {(displaySettings.showTitles || displaySettings.showDescriptions) && (
                            <div className="mb-6">
                                {displaySettings.showTitles && (stop.showTitle ?? true) && (
                                    <h1
                                        className={`font-bold text-[var(--color-text-primary)] leading-tight ${isKiosk ? '' : 'text-2xl md:text-3xl'}`}
                                        style={{ fontSize: isKiosk ? '2.5rem' : undefined }}
                                    >
                                        {getLocalizedText(stop.title)}
                                    </h1>
                                )}
                                {displaySettings.showDescriptions && (stop.showDescription ?? true) && stop.description && getLocalizedText(stop.description) && (
                                    <p
                                        className={`${displaySettings.showTitles ? 'mt-2' : ''} text-[var(--color-text-secondary)] leading-relaxed`}
                                        style={{ fontSize: isKiosk ? '1.25rem' : undefined }}
                                    >
                                        {getLocalizedText(stop.description)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Hero Image - NOW SECOND */}
                        {(stop.showImage ?? true) && (() => {
                            const heroImage = stop.image;
                            if (!heroImage) return null;

                            // Handle both new object format and legacy string format
                            const imageData = typeof heroImage === 'object'
                                ? heroImage
                                : { url: heroImage, caption: {} };

                            if (!imageData.url) return null;

                            const caption = getLocalizedText(imageData.caption || {});

                            return (
                                <figure className={`mb-6 ${isKiosk ? '-mx-10' : '-mx-4 md:mx-0'} md:rounded-xl overflow-hidden`}>
                                    <img
                                        src={imageData.url}
                                        alt=""
                                        className="w-full h-auto object-cover"
                                        style={{ maxHeight: isKiosk ? '50vh' : '24rem' }}
                                    />
                                    {caption && (
                                        <figcaption className="px-4 py-2 text-sm text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)]/50">
                                            {caption}
                                        </figcaption>
                                    )}
                                </figure>
                            );
                        })()}

                        {/* Content Blocks */}
                        {blocks.length === 0 ? (
                            <div className="text-center py-16 text-[var(--color-text-muted)]">
                                <p>No content available for this stop.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {blocks.map((block: ContentBlock) => (
                                    <StopContentBlock
                                        key={block.id}
                                        block={block}
                                        mode="view"
                                        language={language}
                                        deviceType={deviceType}
                                        tourData={tour as any}
                                        allStops={allStops}
                                        currentStopId={stop?.id}
                                        displaySettings={displaySettings}
                                        onNavigateToStop={handleNavigateToStop}
                                    />
                                ))}
                            </div>
                        )}
                    </main>
                );
            })()}

            {/* Display Settings FAB - Only show for staff in preview mode */}
            {isStaff && (
                <DisplaySettingsPanel
                    settings={displaySettings}
                    onChange={setDisplaySettings}
                    position="bottom-left"
                    showLabel
                />
            )}

            {/* Bottom Navigation - hidden in hideNav kiosk mode */}
            {!hideNav && (
                <nav className="sticky bottom-0 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-t border-[var(--color-border-default)]">
                    <div className={`${deviceType === 'kiosk' ? 'max-w-7xl px-10' : 'max-w-4xl px-4'} mx-auto py-3 flex items-center justify-between`}>
                        {prevStop ? (
                            <Link
                                to={`/visitor/tour/${tour.slug}/stop/${prevStop.slug}${token ? `?t=${token}` : ''}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">{getLocalizedText(prevStop.title)}</span>
                                <span className="sm:hidden">Previous</span>
                            </Link>
                        ) : (
                            <div />
                        )}

                        {/* Progress indicator */}
                        <div className="flex items-center gap-1">
                            {allStops.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full transition-colors ${idx === stopIndex
                                        ? 'bg-[var(--color-accent-primary)]'
                                        : idx < stopIndex
                                            ? 'bg-[var(--color-accent-primary)]/50'
                                            : 'bg-[var(--color-bg-elevated)]'
                                        }`}
                                />
                            ))}
                        </div>

                        {nextStop ? (
                            <Link
                                to={`/visitor/tour/${tour.slug}/stop/${nextStop.slug}${token ? `?t=${token}` : ''}`}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-[#1a1a1a] rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                <span className="hidden sm:inline">{getLocalizedText(nextStop.title)}</span>
                                <span className="sm:hidden">Next</span>
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        ) : autoRestart ? (
                            <button
                                onClick={handleRestartTour}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-[#1a1a1a] rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Start Over</span>
                            </button>
                        ) : (
                            <div className="px-4 py-2 text-[var(--color-text-muted)] text-sm">
                                Tour Complete! 🎉
                            </div>
                        )}
                    </div>
                </nav>
            )}

            {/* Fullscreen toggle button (kiosk mode) — shift up when chat button is also showing */}
            {isKioskMode && (
                <button
                    onClick={toggleFullscreen}
                    className={`fixed ${showChat ? 'bottom-[5.5rem]' : 'bottom-4'} right-4 p-3 bg-[var(--color-bg-surface)]/90 backdrop-blur-md rounded-full shadow-lg border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors z-40`}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                    <Maximize className="w-5 h-5" />
                </button>
            )}

            {/* Museum Concierge Chat */}
            {!isKioskMode && tour?.conciergeEnabled !== false && (
                <ChatFloatingButton
                    onClick={() => setIsChatOpen(true)}
                    iconName={tour?.conciergeChatIcon}
                    iconColor={tour?.conciergeChatIconColor}
                    iconBgColor={tour?.conciergeChatIconBgColor}
                />
            )}
            {isKioskMode && showChat && tour?.conciergeEnabled !== false && (
                <KioskChatButton
                    onClick={() => setIsChatOpen(true)}
                    iconName={tour?.conciergeChatIcon}
                    iconColor={tour?.conciergeChatIconColor}
                    iconBgColor={tour?.conciergeChatIconBgColor}
                />
            )}
            <ChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                language={language}
                tourId={tour?.id}
                tourQuickActions={(() => {
                    const raw = tour?.conciergeQuickActions;
                    if (!raw) return undefined;
                    if (Array.isArray(raw)) return raw;
                    try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                })()}
                tourWelcomeMessage={(() => {
                    const raw = tour?.conciergeWelcome;
                    if (!raw) return undefined;
                    if (typeof raw === 'object') return raw;
                    try { return JSON.parse(raw as unknown as string); } catch { return undefined; }
                })()}
                iconName={tour?.conciergeChatIcon}
                iconColor={tour?.conciergeChatIconColor}
                iconBgColor={tour?.conciergeChatIconBgColor}
            />

            {/* Kiosk inactivity reset overlay */}
            {showKioskReset && kioskReset && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] shadow-2xl max-w-sm w-full p-8 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center mx-auto mb-5">
                            <RotateCcw className="w-8 h-8 text-[var(--color-accent-primary)]" />
                        </div>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                            Still exploring?
                        </h2>
                        <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                            This device will reset in <span className="font-bold text-[var(--color-accent-primary)]">{resetCountdown}s</span>
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={dismissKioskReset}
                                className="w-full px-6 py-3 bg-[var(--color-accent-primary)] text-[#1a1a1a] font-semibold rounded-xl hover:opacity-90 transition-opacity"
                            >
                                Continue Tour
                            </button>
                            <button
                                onClick={() => navigate(decodeURIComponent(kioskReset))}
                                className="w-full px-6 py-3 bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] rounded-xl border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] transition-colors text-sm"
                            >
                                Return Device
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
