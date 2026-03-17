import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, MapPin, Clock, ChevronRight, Package } from 'lucide-react';

interface TourSummary {
    id: string;
    slug: string;
    title: Record<string, string>;
    heroImage?: string;
    duration: number;
    status: string;
    languages: string[];
    stops: Array<{ id: string }>;
}

export function KioskTourList() {
    const navigate = useNavigate();
    const [tours, setTours] = useState<TourSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTours() {
            try {
                const res = await fetch('/api/tours');
                if (!res.ok) throw new Error('Failed to load tours');
                const data = await res.json();
                // Only show published tours with stops
                setTours(data.filter((t: any) => t.status === 'published' && t.stops?.length > 0));
            } catch {
                // If the tours API requires auth, try visitor endpoint for each tour
                // For now just show empty state
            }
            setLoading(false);
        }
        fetchTours();
    }, []);

    function getTitle(tour: TourSummary) {
        return tour.title?.en || Object.values(tour.title || {})[0] || 'Untitled Tour';
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[var(--color-accent-primary)] animate-spin mx-auto mb-4" />
                    <p className="text-[var(--color-text-muted)] text-lg">Loading tours...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-10 pb-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-[var(--color-accent-primary)]" />
                </div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                    Select a Tour
                </h1>
                <p className="text-[var(--color-text-muted)] text-sm">
                    Choose the tour to load on this device
                </p>
            </div>

            {/* Tour List */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="max-w-lg mx-auto space-y-3">
                    {tours.length === 0 ? (
                        <div className="text-center py-12">
                            <MapPin className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-3" />
                            <p className="text-[var(--color-text-muted)]">No published tours available</p>
                        </div>
                    ) : (
                        tours.map(tour => (
                            <button
                                key={tour.id}
                                onClick={() => navigate(`/kiosk/tour/${tour.slug || tour.id}`)}
                                className="w-full flex items-center gap-4 p-4 bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)] rounded-xl transition-all text-left group"
                            >
                                {tour.heroImage ? (
                                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[var(--color-border-default)]">
                                        <img src={tour.heroImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center shrink-0 border border-[var(--color-border-default)]">
                                        <MapPin className="w-6 h-6 text-[var(--color-accent-primary)]" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                                        {getTitle(tour)}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-1">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {tour.stops.length} stops
                                        </span>
                                        {tour.duration > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {tour.duration} min
                                            </span>
                                        )}
                                        <span>{tour.languages.length} languages</span>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors shrink-0" />
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
