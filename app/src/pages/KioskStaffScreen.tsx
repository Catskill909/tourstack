import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Globe, Battery, CheckCircle2, Loader2, Wifi, WifiOff,
    Clock, MapPin, ChevronRight, Settings, Package, RefreshCw
} from 'lucide-react';

// Language display names with native labels
const LANGUAGE_META: Record<string, { native: string; english: string; flag: string }> = {
    en: { native: 'English', english: 'English', flag: '🇺🇸' },
    es: { native: 'Español', english: 'Spanish', flag: '🇪🇸' },
    fr: { native: 'Français', english: 'French', flag: '🇫🇷' },
    de: { native: 'Deutsch', english: 'German', flag: '🇩🇪' },
    it: { native: 'Italiano', english: 'Italian', flag: '🇮🇹' },
    pt: { native: 'Português', english: 'Portuguese', flag: '🇵🇹' },
    ja: { native: '日本語', english: 'Japanese', flag: '🇯🇵' },
    ko: { native: '한국어', english: 'Korean', flag: '🇰🇷' },
    zh: { native: '中文', english: 'Chinese', flag: '🇨🇳' },
    ar: { native: 'العربية', english: 'Arabic', flag: '🇸🇦' },
    ru: { native: 'Русский', english: 'Russian', flag: '🇷🇺' },
    hi: { native: 'हिन्दी', english: 'Hindi', flag: '🇮🇳' },
};

interface TourData {
    id: string;
    slug: string;
    title: Record<string, string>;
    description?: Record<string, string>;
    heroImage?: string;
    languages: string[];
    primaryLanguage: string;
    duration: number;
    status: string;
    stops: Array<{
        id: string;
        slug: string;
        order: number;
        title: Record<string, string>;
    }>;
}

export function KioskStaffScreen() {
    const { tourId } = useParams<{ tourId: string }>();
    const navigate = useNavigate();

    const [tour, setTour] = useState<TourData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedLang, setSelectedLang] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Device status
    const [isOnline] = useState(navigator.onLine);
    const [cacheStatus] = useState<'cached' | 'syncing' | 'none'>('cached');
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

    // Get battery status if available
    useEffect(() => {
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(Math.round(battery.level * 100));
                battery.addEventListener('levelchange', () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                });
            }).catch(() => {});
        }
    }, []);

    // Fetch tour data
    useEffect(() => {
        if (!tourId) return;

        async function fetchTour() {
            try {
                const res = await fetch(`/api/visitor/tour/${tourId}`);
                if (!res.ok) throw new Error('Tour not found');
                const data = await res.json();
                setTour(data);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load tour');
                setLoading(false);
            }
        }
        fetchTour();
    }, [tourId]);

    // Start tour in visitor mode
    function handleStartTour() {
        if (!tour || !selectedLang || tour.stops.length === 0) return;

        setIsStarting(true);
        const sortedStops = [...tour.stops].sort((a, b) => a.order - b.order);
        const firstStop = sortedStops[0];

        // Navigate to visitor mode with kiosk params — VisitorStop handles kiosk behavior
        const kioskReturn = encodeURIComponent(`/kiosk/tour/${tour.slug || tour.id}`);
        navigate(`/visitor/tour/${tour.slug || tour.id}/stop/${firstStop.slug || firstStop.id}?kiosk=true&lang=${selectedLang}&fullscreen=true&kioskReset=${kioskReturn}`);
    }

    function getTitle(lang?: string) {
        if (!tour) return '';
        const l = lang || tour.primaryLanguage || 'en';
        return tour.title[l] || tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled Tour';
    }

    function getDescription(lang?: string) {
        if (!tour?.description) return '';
        const l = lang || tour.primaryLanguage || 'en';
        return tour.description[l] || tour.description[tour.primaryLanguage] || tour.description.en || '';
    }

    // Loading state
    if (loading) {
        return (
            <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[var(--color-accent-primary)] animate-spin mx-auto mb-4" />
                    <p className="text-[var(--color-text-muted)] text-lg">Loading tour...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !tour) {
        return (
            <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">Tour Not Found</h1>
                    <p className="text-[var(--color-text-muted)] mb-6">{error || 'This tour could not be loaded.'}</p>
                    <button
                        onClick={() => navigate('/kiosk')}
                        className="px-6 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-xl border border-[var(--color-border-default)] transition-colors"
                    >
                        Back to Tour List
                    </button>
                </div>
            </div>
        );
    }

    // Settings panel (PIN-protected)
    if (showSettings) {
        return (
            <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Kiosk Settings</h2>
                    <button
                        onClick={() => setShowSettings(false)}
                        className="px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border-default)] transition-colors"
                    >
                        Done
                    </button>
                </div>
                <div className="flex-1 overflow-auto p-6 max-w-lg mx-auto w-full space-y-6">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-5 space-y-3">
                        <h3 className="font-medium text-[var(--color-text-primary)]">Device Info</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Network</span>
                                <span className="text-[var(--color-text-secondary)]">{isOnline ? 'Connected' : 'Offline'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Battery</span>
                                <span className="text-[var(--color-text-secondary)]">{batteryLevel !== null ? `${batteryLevel}%` : 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Tour</span>
                                <span className="text-[var(--color-text-secondary)]">{getTitle()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-[var(--color-text-muted)]">Stops</span>
                                <span className="text-[var(--color-text-secondary)]">{tour.stops.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-5 space-y-3">
                        <h3 className="font-medium text-[var(--color-text-primary)]">Actions</h3>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border-default)] transition-colors text-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh Tour Data
                        </button>
                        <button
                            onClick={() => navigate('/kiosk')}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border-default)] transition-colors text-sm"
                        >
                            <Package className="w-4 h-4" />
                            Choose Different Tour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">

            {/* Status Bar */}
            <div className="flex items-center justify-between px-5 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
                <div className="flex items-center gap-3">
                    {isOnline ? (
                        <Wifi className="w-4 h-4 text-[var(--color-success)]" />
                    ) : (
                        <WifiOff className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                    {cacheStatus === 'cached' && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Tour ready
                        </span>
                    )}
                    {cacheStatus === 'syncing' && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--color-warning)]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Syncing...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {batteryLevel !== null && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                            <Battery className="w-4 h-4" />
                            {batteryLevel}%
                        </span>
                    )}
                    <button
                        onClick={() => {
                            // Show PIN entry
                            const pin = prompt('Enter staff PIN:');
                            if (pin) {
                                const correctPin = localStorage.getItem('tourstack_kiosk_pin') || '0000';
                                if (pin === correctPin) {
                                    setShowSettings(true);
                                }
                            }
                        }}
                        className="p-1.5 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] transition-colors"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-lg mx-auto px-6 py-8 flex flex-col min-h-full">

                    {/* Tour Hero */}
                    <div className="text-center mb-8">
                        {tour.heroImage ? (
                            <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-5 border border-[var(--color-border-default)] shadow-lg">
                                <img
                                    src={tour.heroImage}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] flex items-center justify-center mx-auto mb-5">
                                <MapPin className="w-10 h-10 text-[var(--color-accent-primary)]" />
                            </div>
                        )}

                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                            {getTitle(selectedLang || undefined)}
                        </h1>

                        {getDescription(selectedLang || undefined) && (
                            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-sm mx-auto mb-4">
                                {getDescription(selectedLang || undefined)}
                            </p>
                        )}

                        <div className="flex items-center justify-center gap-4 text-sm text-[var(--color-text-muted)]">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {tour.stops.length} stops
                            </span>
                            {tour.duration > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {tour.duration} min
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Language Selection */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <Globe className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                                Select Language
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {tour.languages.map(lang => {
                                const meta = LANGUAGE_META[lang];
                                const isSelected = selectedLang === lang;

                                return (
                                    <button
                                        key={lang}
                                        onClick={() => setSelectedLang(lang)}
                                        className={`
                                            relative flex items-center gap-3 px-4 py-4 rounded-xl border-2 transition-all
                                            ${isSelected
                                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 shadow-[var(--shadow-glow)]'
                                                : 'border-[var(--color-border-default)] bg-[var(--color-bg-surface)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-elevated)]'
                                            }
                                        `}
                                    >
                                        <span className="text-2xl leading-none">{meta?.flag || '🌐'}</span>
                                        <div className="text-left">
                                            <div className={`font-medium text-sm ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                                                {meta?.native || lang}
                                            </div>
                                            {meta?.english && meta.english !== meta.native && (
                                                <div className="text-xs text-[var(--color-text-muted)]">
                                                    {meta.english}
                                                </div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <CheckCircle2 className="w-5 h-5 text-[var(--color-accent-primary)] absolute top-2 right-2" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Spacer to push button to bottom */}
                    <div className="flex-1" />

                    {/* Start Tour Button */}
                    <div className="pb-6">
                        <button
                            onClick={handleStartTour}
                            disabled={!selectedLang || isStarting}
                            className={`
                                w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-lg transition-all
                                ${selectedLang
                                    ? 'bg-[var(--color-accent-primary)] text-[#1a1a1a] hover:opacity-90 shadow-[var(--shadow-glow)] active:scale-[0.98]'
                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-disabled)] border border-[var(--color-border-default)] cursor-not-allowed'
                                }
                            `}
                        >
                            {isStarting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Start Tour
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        {!selectedLang && (
                            <p className="text-center text-xs text-[var(--color-text-muted)] mt-3">
                                Choose a language to begin
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
