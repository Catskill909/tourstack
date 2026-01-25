import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, AlertCircle, Loader2, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { StopContentBlock } from '../components/blocks/StopContentBlock';
import type { Stop, ContentBlock } from '../types';

// API returns tour with full stop objects (not just IDs)
interface TourWithStops {
    id: string;
    slug: string;
    title: Record<string, string>;
    description?: Record<string, string>;
    status: string;
    languages: string[];
    stops: Stop[];
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
    const token = searchParams.get('t');

    const [tour, setTour] = useState<TourWithStops | null>(null);
    const [allStops, setAllStops] = useState<Stop[]>([]);
    const [stop, setStop] = useState<Stop | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState('en');
    const [showLanguageMenu, setShowLanguageMenu] = useState(false);

    // Check if user is staff (simplified - could use auth system later)
    const isStaff = localStorage.getItem('tourstack_staff') === 'true';

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
                setAllStops(data.allStops || []);

                // Set initial language from tour's first language
                if (data.tour.languages?.length > 0) {
                    setLanguage(data.tour.languages[0]);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching tour data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load content');
                setLoading(false);
            }
        }

        fetchData();
    }, [tourSlugOrId, stopSlugOrId, isStaff]);

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

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-b border-[var(--color-border-default)]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Back / Tour Title */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        {prevStop ? (
                            <Link
                                to={`/visitor/tour/${tour.slug}/stop/${prevStop.slug}${token ? `?t=${token}` : ''}`}
                                className="p-2 -ml-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                title={`Previous: ${getLocalizedText(prevStop.title)}`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        ) : (
                            <div className="w-9" /> // Spacer
                        )}
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
                    {nextStop ? (
                        <Link
                            to={`/visitor/tour/${tour.slug}/stop/${nextStop.slug}${token ? `?t=${token}` : ''}`}
                            className="p-2 -mr-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            title={`Next: ${getLocalizedText(nextStop.title)}`}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    ) : (
                        <div className="w-9" /> // Spacer
                    )}
                </div>
            </header>

            {/* Staff Banner */}
            {isStaff && (
                <div className="bg-amber-500/20 border-b border-amber-500/30">
                    <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-300 text-sm">
                            <Settings className="w-4 h-4" />
                            <span>Staff Preview Mode</span>
                            {tour.status !== 'published' && (
                                <span className="px-2 py-0.5 bg-amber-500/30 rounded text-xs font-medium">
                                    DRAFT
                                </span>
                            )}
                        </div>
                        <Link
                            to={`/tours/${tour.id}`}
                            className="flex items-center gap-1.5 text-sm text-amber-300 hover:text-amber-200 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Admin
                        </Link>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-6">
                {/* Stop Title */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text-primary)] leading-tight">
                        {getLocalizedText(stop.title)}
                    </h1>
                    {stop.description && getLocalizedText(stop.description) && (
                        <p className="mt-2 text-[var(--color-text-secondary)] leading-relaxed">
                            {getLocalizedText(stop.description)}
                        </p>
                    )}
                </div>

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
                                deviceType="phone"
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Navigation */}
            <nav className="sticky bottom-0 bg-[var(--color-bg-surface)]/95 backdrop-blur-md border-t border-[var(--color-border-default)]">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
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
                    ) : (
                        <div className="px-4 py-2 text-[var(--color-text-muted)] text-sm">
                            Tour Complete! 🎉
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
}
