import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MoreHorizontal,
    Edit3,
    Copy,
    Trash2,
    MapPin,
    Clock,
    Eye,
    Archive,
    Play,
    ExternalLink,
    Monitor
} from 'lucide-react';
import type { Tour, Template, TourStatus, Stop } from '../types';
import { KioskLauncherModal } from './KioskLauncherModal';

interface TourCardProps {
    tour: Tour;
    template?: Template;
    onEdit: (tour: Tour) => void;
    onDuplicate: (tour: Tour) => void;
    onDelete: (tour: Tour) => void;
    onStatusChange: (tour: Tour, status: TourStatus) => void;
}

// Status badge configuration
const statusConfig: Record<TourStatus, { label: string; color: string; bg: string }> = {
    draft: { label: 'Draft', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    review: { label: 'In Review', color: 'text-blue-400', bg: 'bg-blue-400/10' },
    testing: { label: 'Testing', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
    scheduled: { label: 'Scheduled', color: 'text-purple-400', bg: 'bg-purple-400/10' },
    published: { label: 'Published', color: 'text-green-400', bg: 'bg-green-400/10' },
    paused: { label: 'Paused', color: 'text-orange-400', bg: 'bg-orange-400/10' },
    archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export function TourCard({ tour, template, onEdit, onDuplicate, onDelete, onStatusChange }: TourCardProps) {
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [isLaunching, setIsLaunching] = useState(false);
    const [showKioskModal, setShowKioskModal] = useState(false);
    const [tourStops, setTourStops] = useState<Stop[]>([]);
    const menuRef = useRef<HTMLDivElement>(null);

    // Launch tour in visitor mode
    async function handleLaunchTour(e: React.MouseEvent) {
        e.stopPropagation(); // Prevent card click navigation
        setIsLaunching(true);

        try {
            // Fetch first stop for this tour
            const response = await fetch(`/api/stops/${tour.id}`);
            if (!response.ok) throw new Error('Failed to fetch stops');
            const stops = await response.json();

            if (stops.length === 0) {
                alert('This tour has no stops yet. Add stops before launching.');
                setIsLaunching(false);
                return;
            }

            // Sort by order and get first stop
            const firstStop = stops.sort((a: { order: number }, b: { order: number }) => a.order - b.order)[0];

            // Open visitor view in new tab
            const visitorUrl = `/visitor/tour/${tour.id}/stop/${firstStop.id}`;
            window.open(visitorUrl, '_blank');
        } catch (error) {
            console.error('Error launching tour:', error);
            alert('Failed to launch tour. Please try again.');
        }

        setIsLaunching(false);
    }

    // Open kiosk launcher modal
    async function handleOpenKiosk(e: React.MouseEvent) {
        e.stopPropagation(); // Prevent card click navigation

        try {
            // Fetch stops for this tour
            const response = await fetch(`/api/stops/${tour.id}`);
            if (!response.ok) throw new Error('Failed to fetch stops');
            const stops = await response.json();

            if (stops.length === 0) {
                alert('This tour has no stops yet. Add stops before launching kiosk mode.');
                return;
            }

            setTourStops(stops);
            setShowKioskModal(true);
        } catch (error) {
            console.error('Error fetching stops for kiosk:', error);
            alert('Failed to load tour stops. Please try again.');
        }
    }

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleCardClick = (e: React.MouseEvent) => {
        // Don't navigate if clicking on menu area
        if (menuRef.current?.contains(e.target as Node)) return;
        navigate(`/tours/${tour.id}`);
    };

    const title = typeof tour.title === 'object' ? tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled' : tour.title;
    const description = typeof tour.description === 'object'
        ? tour.description[tour.primaryLanguage] || tour.description.en || ''
        : tour.description;
    const status = statusConfig[tour.status] || statusConfig.draft;
    const stopCount = tour.stops?.length || 0;

    return (
        <div
            onClick={handleCardClick}
            className="group relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 hover:border-[var(--color-border-hover)] hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
            {/* Hero Image or Template Icon */}
            {tour.heroImage ? (
                <div className="w-full h-32 rounded-lg overflow-hidden mb-3">
                    <img
                        src={tour.heroImage}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : null}

            {/* Template Icon & Title */}
            <div className="flex items-start gap-3 mb-3">
                {!tour.heroImage && (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 flex items-center justify-center text-2xl flex-shrink-0">
                        {template?.icon || '📍'}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-text-primary)] truncate" title={title}>
                        {title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] truncate" title={template?.name}>
                        {template?.name || 'Custom Template'}
                    </p>
                </div>
            </div>

            {/* Description */}
            {description && (
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                    {description}
                </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)] mb-4">
                <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {stopCount} {stopCount === 1 ? 'stop' : 'stops'}
                </span>
                <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {tour.duration} min
                </span>
                <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {tour.analytics?.totalVisitors || 0}
                </span>
            </div>

            {/* Launch Buttons */}
            {stopCount > 0 && (
                <div className="mb-4 flex gap-2">
                    <button
                        onClick={handleLaunchTour}
                        disabled={isLaunching}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                            tour.status === 'published'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)]'
                        } ${isLaunching ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isLaunching ? (
                            <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                <span>Opening...</span>
                            </>
                        ) : tour.status === 'published' ? (
                            <>
                                <Play className="w-4 h-4" />
                                <span>Run Tour</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                <span>Preview</span>
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleOpenKiosk}
                        className="p-2.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border-default)] rounded-lg transition-all"
                        title="Kiosk Mode Settings"
                    >
                        <Monitor className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Footer with Status Badge */}
            <div className="flex items-center justify-between">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(tour.updatedAt).toLocaleDateString()}
                </span>
            </div>

            {/* Action Menu Button */}
            <div className="absolute top-4 right-4" ref={menuRef}>
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2 rounded-full bg-black/80 hover:bg-black transition-all shadow-lg"
                    aria-label="Tour actions"
                >
                    <MoreHorizontal className="w-5 h-5 text-white" />
                </button>

                {/* Dropdown Menu */}
                {menuOpen && (
                    <div className="absolute right-0 top-10 w-44 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg shadow-xl z-10 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                            onClick={() => { onEdit(tour); setMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                            Edit Tour
                        </button>
                        <button
                            onClick={() => { onDuplicate(tour); setMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                            Duplicate
                        </button>
                        <div className="border-t border-[var(--color-border-default)] my-1" />
                        {tour.status === 'draft' && (
                            <button
                                onClick={() => { onStatusChange(tour, 'published'); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <Play className="w-4 h-4" />
                                Publish
                            </button>
                        )}
                        {tour.status === 'published' && (
                            <button
                                onClick={() => { onStatusChange(tour, 'archived'); setMenuOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                            >
                                <Archive className="w-4 h-4" />
                                Archive
                            </button>
                        )}
                        <button
                            onClick={() => { onDelete(tour); setMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Kiosk Launcher Modal */}
            <KioskLauncherModal
                isOpen={showKioskModal}
                tour={tour}
                stops={tourStops}
                onClose={() => setShowKioskModal(false)}
            />
        </div>
    );
}
