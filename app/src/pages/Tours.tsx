import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, Sparkles, MapPin } from 'lucide-react';
import { useToursStore } from '../stores/useToursStore';
import { TourCard } from '../components/TourCard';
import { CreateTourModal } from '../components/CreateTourModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import type { Tour, TourStatus } from '../types';

type FilterStatus = 'all' | TourStatus;

export function Tours() {
    const { tours, templates, isLoading, fetchTours, fetchTemplates, createTour, updateTour, deleteTour } = useToursStore();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tourToDelete, setTourToDelete] = useState<Tour | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch data on mount
    useEffect(() => {
        fetchTours();
        fetchTemplates();
    }, [fetchTours, fetchTemplates]);

    // Keyboard shortcut for new tour
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            // Ctrl/Cmd + N to create new tour
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                setIsCreateModalOpen(true);
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter tours
    const filteredTours = tours.filter(tour => {
        // Search filter
        const title = typeof tour.title === 'object'
            ? Object.values(tour.title).join(' ')
            : tour.title;
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = statusFilter === 'all' || tour.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Get template by ID
    const getTemplate = useCallback((templateId: string) => {
        return templates.find(t => t.id === templateId);
    }, [templates]);

    // Handlers
    const handleCreateTour = async (data: Partial<Tour>) => {
        await createTour(data);
    };

    const handleEditTour = (tour: Tour) => {
        // TODO: Open edit modal
        console.log('Edit tour:', tour.id);
    };

    const handleDuplicateTour = async (tour: Tour) => {
        const titleObj: Record<string, string> = typeof tour.title === 'object'
            ? { ...tour.title }
            : { en: String(tour.title) };

        Object.keys(titleObj).forEach(lang => {
            titleObj[lang] = `${titleObj[lang]} (Copy)`;
        });

        await createTour({
            ...tour,
            title: titleObj,
            status: 'draft',
        });
    };

    const handleDeleteTour = async () => {
        if (!tourToDelete) return;
        setIsDeleting(true);
        try {
            await deleteTour(tourToDelete.id);
            setTourToDelete(null);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStatusChange = async (tour: Tour, status: TourStatus) => {
        await updateTour(tour.id, { status });
    };

    // Get tour title for delete modal
    const getTourTitle = (tour: Tour | null): string => {
        if (!tour) return '';
        return typeof tour.title === 'object'
            ? tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled'
            : tour.title;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Tours</h1>
                    <p className="text-[var(--color-text-muted)]">
                        Create and manage your museum tours
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-[var(--color-accent-primary)]/25"
                >
                    <Plus className="w-5 h-5" />
                    New Tour
                </button>
            </div>

            {/* Empty State */}
            {!isLoading && tours.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center mb-6">
                        <MapPin className="w-12 h-12 text-[var(--color-accent-primary)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                        Create your first tour
                    </h2>
                    <p className="text-[var(--color-text-muted)] max-w-md mb-6">
                        Get started by choosing a template and adding stops. Your visitors will love exploring your museum!
                    </p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white font-medium rounded-lg transition-all hover:scale-[1.02]"
                    >
                        <Sparkles className="w-5 h-5" />
                        Create Your First Tour
                    </button>
                    <p className="text-xs text-[var(--color-text-muted)] mt-4">
                        Press <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-elevated)] rounded text-[var(--color-text-secondary)]">⌘N</kbd> anytime
                    </p>
                </div>
            )}

            {/* Search & Filter - Only show when tours exist */}
            {tours.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search tours..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                            className="pl-9 pr-10 py-2.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && tours.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 animate-pulse">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-elevated)]" />
                                <div className="flex-1">
                                    <div className="h-5 bg-[var(--color-bg-elevated)] rounded w-3/4 mb-2" />
                                    <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-1/2" />
                                </div>
                            </div>
                            <div className="h-10 bg-[var(--color-bg-elevated)] rounded mb-4" />
                            <div className="flex gap-4">
                                <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-16" />
                                <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tours Grid */}
            {tours.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTours.map((tour, index) => (
                        <div
                            key={tour.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="animate-in fade-in slide-in-from-bottom-2"
                        >
                            <TourCard
                                tour={tour}
                                template={getTemplate(tour.templateId)}
                                onEdit={handleEditTour}
                                onDuplicate={handleDuplicateTour}
                                onDelete={setTourToDelete}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* No results */}
            {tours.length > 0 && filteredTours.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-[var(--color-text-muted)]">
                        No tours match your search or filter.
                    </p>
                </div>
            )}

            {/* Create Tour Modal */}
            <CreateTourModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateTour}
                templates={templates}
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={tourToDelete !== null}
                title="Delete Tour"
                itemName={getTourTitle(tourToDelete)}
                onClose={() => setTourToDelete(null)}
                onConfirm={handleDeleteTour}
                isDeleting={isDeleting}
            />
        </div>
    );
}
