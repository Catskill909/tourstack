import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    MapPin,
    Eye,
    CheckCircle2,
    FolderOpen,
    LayoutGrid,
    Volume2,
    BarChart3,
    Radio,
    Users,
    Loader2,
} from 'lucide-react';
import { useToursStore } from '../stores/useToursStore';
import { CreateTourModal } from '../components/CreateTourModal';
import type { Tour } from '../types';

export function Dashboard() {
    const navigate = useNavigate();
    const { tours, templates, isLoading, fetchTours, fetchTemplates, createTour } = useToursStore();
    const [mediaCount, setMediaCount] = useState<number | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        fetchTours();
        fetchTemplates();
    }, [fetchTours, fetchTemplates]);

    // Fetch media count
    useEffect(() => {
        fetch('/api/media')
            .then(res => res.ok ? res.json() : [])
            .then(data => setMediaCount(Array.isArray(data) ? data.length : 0))
            .catch(() => setMediaCount(0));
    }, []);

    const handleCreateTour = useCallback(async (data: Partial<Tour>) => {
        const tour = await createTour(data);
        setIsCreateModalOpen(false);
        navigate(`/tours/${tour.id}`);
    }, [createTour, navigate]);

    // Compute stats
    const totalTours = tours.length;
    const totalStops = tours.reduce((sum, t) => sum + (Array.isArray(t.stops) ? t.stops.length : 0), 0);
    const publishedTours = tours.filter(t => t.status === 'published').length;

    // Recent tours (last 5, sorted by updatedAt)
    const recentTours = [...tours]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5);

    const stats = [
        { label: 'Total Tours', value: totalTours, icon: MapPin, route: '/tours' },
        { label: 'Active Stops', value: totalStops, icon: Eye, route: '/tours' },
        { label: 'Published', value: publishedTours, icon: CheckCircle2, route: '/tours' },
        { label: 'Media Files', value: mediaCount ?? '...', icon: FolderOpen, route: '/media' },
    ];

    const quickActions = [
        { label: 'Create New Tour', icon: Plus, color: 'primary', action: () => setIsCreateModalOpen(true) },
        { label: 'Collections', icon: LayoutGrid, color: 'secondary', action: () => navigate('/collections') },
        { label: 'Media Library', icon: FolderOpen, color: 'tertiary', action: () => navigate('/media') },
        { label: 'Audio TTS', icon: Volume2, color: 'primary', action: () => navigate('/audio') },
    ];

    const comingSoon = [
        { label: 'Analytics Dashboard', icon: BarChart3, description: 'Visitor insights and engagement metrics' },
        { label: 'Beacon Scanner', icon: Radio, description: 'BLE beacon testing and field tools' },
        { label: 'Visitor Gallery', icon: Users, description: 'Public tour discovery page' },
    ];

    const getTourTitle = (tour: Tour) => {
        if (typeof tour.title === 'object') {
            return tour.title[tour.primaryLanguage || 'en'] || Object.values(tour.title)[0] || 'Untitled';
        }
        return String(tour.title) || 'Untitled';
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Welcome to <span className="text-gradient">TourStack</span>
                </h1>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                    Create interactive museum tours with any positioning technology
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <button
                        key={stat.label}
                        onClick={() => navigate(stat.route)}
                        className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-all text-left cursor-pointer"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            onClick={action.action}
                            className={`flex items-center gap-4 p-5 rounded-xl border transition-all hover:scale-[1.02] ${action.color === 'primary'
                                    ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/30 hover:border-[var(--color-accent-primary)]'
                                    : action.color === 'secondary'
                                        ? 'bg-[var(--color-accent-secondary)]/10 border-[var(--color-accent-secondary)]/30 hover:border-[var(--color-accent-secondary)]'
                                        : 'bg-[var(--color-accent-tertiary)]/10 border-[var(--color-accent-tertiary)]/30 hover:border-[var(--color-accent-tertiary)]'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color === 'primary'
                                    ? 'bg-[var(--color-accent-primary)]/20'
                                    : action.color === 'secondary'
                                        ? 'bg-[var(--color-accent-secondary)]/20'
                                        : 'bg-[var(--color-accent-tertiary)]/20'
                                }`}>
                                <action.icon className={`w-6 h-6 ${action.color === 'primary'
                                        ? 'text-[var(--color-accent-primary)]'
                                        : action.color === 'secondary'
                                            ? 'text-[var(--color-accent-secondary)]'
                                            : 'text-[var(--color-accent-tertiary)]'
                                    }`} />
                            </div>
                            <span className="font-medium text-[var(--color-text-primary)]">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Recent Tours */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Recent Tours</h2>
                    {tours.length > 0 && (
                        <button
                            onClick={() => navigate('/tours')}
                            className="text-sm text-[var(--color-accent-primary)] hover:underline"
                        >
                            View all
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : recentTours.length > 0 ? (
                    <div className="space-y-2">
                        {recentTours.map((tour) => (
                            <button
                                key={tour.id}
                                onClick={() => navigate(`/tours/${tour.id}`)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {tour.heroImage ? (
                                        <img
                                            src={tour.heroImage}
                                            alt=""
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="font-medium text-[var(--color-text-primary)] truncate">
                                            {getTourTitle(tour)}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {Array.isArray(tour.stops) ? tour.stops.length : 0} stops
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        tour.status === 'published'
                                            ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                                            : 'bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)]'
                                    }`}>
                                        {tour.status}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-muted)] hidden sm:block">
                                        {formatDate(tour.updatedAt)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <MapPin className="w-10 h-10 mx-auto text-[var(--color-text-muted)] mb-3 opacity-50" />
                        <p className="text-[var(--color-text-muted)] mb-4">No tours yet. Create your first tour to get started!</p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 rounded-lg bg-[var(--color-accent-primary)] text-white hover:opacity-90 transition-opacity"
                        >
                            Create Tour
                        </button>
                    </div>
                )}
            </div>

            {/* Coming Soon */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Coming Soon</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {comingSoon.map((item) => (
                        <div
                            key={item.label}
                            className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 opacity-60"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
                                    <item.icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </div>
                                <span className="font-medium text-[var(--color-text-primary)]">{item.label}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-accent-secondary)]/20 text-[var(--color-accent-secondary)] ml-auto">
                                    Soon
                                </span>
                            </div>
                            <p className="text-sm text-[var(--color-text-muted)]">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Tour Modal */}
            <CreateTourModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateTour}
                templates={templates}
            />
        </div>
    );
}
