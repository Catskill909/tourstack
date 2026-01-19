import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Trash2, QrCode, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { useToursStore } from '../stores/useToursStore';
import { StopEditor } from '../components/StopEditor';
import { QRCodeEditorModal } from '../components/QRCodeEditorModal';
import type { Stop, Tour, PositioningConfig } from '../types';

// ============================================
// STOPS API SERVICE - Uses database, not localStorage
// ============================================

async function fetchStopsFromAPI(tourId: string): Promise<Stop[]> {
    try {
        const response = await fetch(`/api/stops/${tourId}`);
        if (!response.ok) throw new Error('Failed to fetch stops');
        return await response.json();
    } catch (error) {
        console.error('Error fetching stops:', error);
        return [];
    }
}

async function createStopAPI(stop: Omit<Stop, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stop | null> {
    try {
        const response = await fetch('/api/stops', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stop)
        });
        if (!response.ok) throw new Error('Failed to create stop');
        return await response.json();
    } catch (error) {
        console.error('Error creating stop:', error);
        return null;
    }
}

async function updateStopAPI(stop: Stop): Promise<Stop | null> {
    try {
        const response = await fetch(`/api/stops/${stop.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stop)
        });
        if (!response.ok) throw new Error('Failed to update stop');
        return await response.json();
    } catch (error) {
        console.error('Error updating stop:', error);
        return null;
    }
}

async function deleteStopAPI(stopId: string): Promise<boolean> {
    try {
        const response = await fetch(`/api/stops/${stopId}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('Error deleting stop:', error);
        return false;
    }
}

async function reorderStopsAPI(tourId: string, stopIds: string[]): Promise<Stop[]> {
    try {
        const response = await fetch(`/api/stops/reorder/${tourId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stopIds })
        });
        if (!response.ok) throw new Error('Failed to reorder stops');
        return await response.json();
    } catch (error) {
        console.error('Error reordering stops:', error);
        return [];
    }
}

// ============================================
// COMPONENT
// ============================================

export function TourDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { tours, fetchTours } = useToursStore();

    const [tour, setTour] = useState<Tour | null>(null);
    const [stops, setStops] = useState<Stop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setIsSaving] = useState(false); // Used for loading states
    const [showAddStop, setShowAddStop] = useState(false);
    const [newStopTitle, setNewStopTitle] = useState('');
    const [showQRModal, setShowQRModal] = useState<string | null>(null);
    const [editingStop, setEditingStop] = useState<Stop | null>(null);

    useEffect(() => {
        fetchTours();
    }, [fetchTours]);

    useEffect(() => {
        async function loadData() {
            if (id && tours.length > 0) {
                const found = tours.find(t => t.id === id);
                setTour(found || null);

                // Load stops from database API
                const tourStops = await fetchStopsFromAPI(id);
                setStops(tourStops);
                setIsLoading(false);
            }
        }
        loadData();
    }, [id, tours]);

    function getTourTitle(): string {
        if (!tour) return '';
        return typeof tour.title === 'object'
            ? tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled'
            : String(tour.title);
    }

    function getStopTitle(stop: Stop): string {
        return typeof stop.title === 'object'
            ? stop.title['en'] || Object.values(stop.title)[0] || 'Untitled Stop'
            : String(stop.title);
    }

    async function handleAddStop(e: React.FormEvent) {
        e.preventDefault();
        if (!tour || !newStopTitle.trim()) return;

        setIsSaving(true);
        const newStop = await createStopAPI({
            tourId: tour.id,
            order: stops.length,
            type: 'mandatory',
            title: { en: newStopTitle },
            image: '',
            description: { en: '' },
            customFieldValues: {},
            primaryPositioning: { method: 'qr_code', url: '', shortCode: '' } as PositioningConfig,
            triggers: {
                entryTrigger: true,
                exitTrigger: false,
                notification: { sound: 'chime', vibration: 'short', visual: 'banner' }
            },
            content: { en: { text: '', images: [] } },
            links: [],
            accessibility: { largePrintAvailable: false, seatingNearby: false }
        });

        if (newStop) {
            setStops([...stops, newStop]);
        }
        setNewStopTitle('');
        setShowAddStop(false);
        setIsSaving(false);
    }

    async function handleDeleteStop(stopId: string) {
        if (!confirm('Delete this stop?')) return;

        setIsSaving(true);
        const success = await deleteStopAPI(stopId);
        if (success) {
            setStops(stops.filter(s => s.id !== stopId));
        }
        setIsSaving(false);
    }

    async function handleMoveStop(stopId: string, direction: 'up' | 'down') {
        if (!tour) return;
        const idx = stops.findIndex(s => s.id === stopId);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === stops.length - 1) return;

        const newStops = [...stops];
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        [newStops[idx], newStops[swapIdx]] = [newStops[swapIdx], newStops[idx]];

        // Optimistic update
        setStops(newStops);

        // Save to database
        const stopIds = newStops.map(s => s.id);
        await reorderStopsAPI(tour.id, stopIds);
    }

    function handleEditStop(stop: Stop) {
        setEditingStop(stop);
    }

    async function handleSaveStop(updatedStop: Stop) {
        setIsSaving(true);
        const saved = await updateStopAPI(updatedStop);

        if (saved) {
            setStops(stops.map(s => s.id === saved.id ? saved : s));
            setEditingStop(null);
        } else {
            alert('Failed to save stop. Please try again.');
        }
        setIsSaving(false);
    }

    async function handleSaveQRSettings(updatedStop: Stop) {
        setIsSaving(true);
        const saved = await updateStopAPI(updatedStop);

        if (saved) {
            setStops(stops.map(s => s.id === saved.id ? saved : s));
        }
        setShowQRModal(null);
        setIsSaving(false);
    }

    if (isLoading) {
        return <div className="p-6 text-center text-[var(--color-text-muted)]">Loading...</div>;
    }

    if (!tour) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500 mb-4">Tour not found</p>
                <button onClick={() => navigate('/tours')} className="text-[var(--color-accent-primary)] hover:underline">
                    Back to Tours
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/tours')}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-secondary)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{getTourTitle()}</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {stops.length} stops • {tour.primaryPositioningMethod.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddStop(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Stop</span>
                    </button>
                </div>
            </div>

            {/* Stops List */}
            <div className="space-y-3">
                {stops.length === 0 ? (
                    <div className="text-center py-16 bg-[var(--color-bg-elevated)] rounded-xl border-2 border-dashed border-[var(--color-border-default)]">
                        <QrCode className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">No stops yet</h3>
                        <p className="text-[var(--color-text-muted)] mb-4">Add your first stop to build this tour</p>
                        <button
                            onClick={() => setShowAddStop(true)}
                            className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                        >
                            Add First Stop
                        </button>
                    </div>
                ) : (
                    stops.map((stop, index) => (
                        <div
                            key={stop.id}
                            className="flex items-center gap-4 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl hover:border-[var(--color-accent-primary)]/50 transition-colors group"
                        >
                            {/* Drag Handle & Order */}
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                <GripVertical className="w-5 h-5 cursor-grab" />
                                <span className="w-6 h-6 flex items-center justify-center text-sm font-medium bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-full">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Stop Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-[var(--color-text-primary)] truncate">{getStopTitle(stop)}</h3>
                                <p className="text-sm text-[var(--color-text-muted)] truncate">
                                    {stop.type} • {stop.primaryPositioning.method.replace('_', ' ')}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleMoveStop(stop.id, 'up')}
                                    disabled={index === 0}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] disabled:opacity-30"
                                    title="Move up"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleMoveStop(stop.id, 'down')}
                                    disabled={index === stops.length - 1}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] disabled:opacity-30"
                                    title="Move down"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setShowQRModal(stop.id)}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                                    title="View QR Code"
                                >
                                    <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleEditStop(stop)}
                                    className="p-2 hover:bg-[var(--color-accent-primary)]/10 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
                                    title="Edit"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteStop(stop.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--color-text-muted)] hover:text-red-500"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Stop Modal */}
            {showAddStop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Add New Stop</h2>
                        <form onSubmit={handleAddStop} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Stop Title</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newStopTitle}
                                    onChange={e => setNewStopTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="e.g. The Rosetta Stone"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddStop(false)}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                                >
                                    Add Stop
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Code Editor Modal */}
            {showQRModal && (
                <QRCodeEditorModal
                    stop={stops.find(s => s.id === showQRModal)!}
                    tourId={tour.id}
                    onSave={handleSaveQRSettings}
                    onClose={() => setShowQRModal(null)}
                />
            )}

            {/* Stop Editor Modal */}
            {editingStop && (
                <StopEditor
                    stop={editingStop}
                    onSave={handleSaveStop}
                    onClose={() => setEditingStop(null)}
                />
            )}


        </div>
    );
}
