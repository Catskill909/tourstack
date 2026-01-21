import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, GripVertical, Trash2, QrCode, Pencil, Settings, Check, X, Languages, Loader2 } from 'lucide-react';
import { translateWithLibre } from '../services/translationService';
import { useToursStore } from '../stores/useToursStore';
import { StopEditor } from '../components/StopEditor';
import { QRCodeEditorModal } from '../components/QRCodeEditorModal';
import { EditTourModal } from '../components/EditTourModal';
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
    const { tours, fetchTours, updateTour } = useToursStore();

    const [tour, setTour] = useState<Tour | null>(null);
    const [stops, setStops] = useState<Stop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [, setIsSaving] = useState(false); // Used for loading states
    const [showAddStop, setShowAddStop] = useState(false);
    const [showEditTour, setShowEditTour] = useState(false);
    const [newStopTitle, setNewStopTitle] = useState('');
    const [showQRModal, setShowQRModal] = useState<string | null>(null);
    const [editingStop, setEditingStop] = useState<Stop | null>(null);
    
    // Drag and drop state
    const [draggedStopId, setDraggedStopId] = useState<string | null>(null);
    const [dragOverStopId, setDragOverStopId] = useState<string | null>(null);
    
    // Inline title editing state
    const [editingTitleStopId, setEditingTitleStopId] = useState<string | null>(null);
    const [editingTitleValue, setEditingTitleValue] = useState<{ [lang: string]: string }>({});
    const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
    const titleInputRef = useRef<HTMLInputElement>(null);

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
            content: [] as unknown as Stop['content'],  // MUST be array, not object!
            contentBlocks: [],  // Also send as contentBlocks for compatibility
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

    function handleEditStop(stop: Stop) {
        setEditingStop(stop);
    }

    async function handleSaveStop(updatedStop: Stop, shouldClose: boolean = true) {
        setIsSaving(true);
        const saved = await updateStopAPI(updatedStop);

        if (saved) {
            setStops(stops.map(s => s.id === saved.id ? saved : s));
            // Update editingStop with saved data so editor has fresh state
            if (shouldClose) {
                setEditingStop(null);
            } else {
                setEditingStop(saved);
            }
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

    async function handleUpdateTour(id: string, data: Partial<Tour>) {
        await updateTour(id, data);
        setTour(prev => prev ? { ...prev, ...data } : null);
        setShowEditTour(false);
    }

    // ============================================
    // DRAG AND DROP HANDLERS
    // ============================================
    
    function handleDragStart(e: React.DragEvent, stopId: string) {
        setDraggedStopId(stopId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', stopId);
        // Add visual feedback
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '0.5';
        }
    }

    function handleDragEnd(e: React.DragEvent) {
        setDraggedStopId(null);
        setDragOverStopId(null);
        if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1';
        }
    }

    function handleDragOver(e: React.DragEvent, stopId: string) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (stopId !== draggedStopId) {
            setDragOverStopId(stopId);
        }
    }

    function handleDragLeave() {
        setDragOverStopId(null);
    }

    async function handleDrop(e: React.DragEvent, targetStopId: string) {
        e.preventDefault();
        setDragOverStopId(null);
        
        if (!draggedStopId || !tour || draggedStopId === targetStopId) return;

        const draggedIdx = stops.findIndex(s => s.id === draggedStopId);
        const targetIdx = stops.findIndex(s => s.id === targetStopId);
        
        if (draggedIdx === -1 || targetIdx === -1) return;

        // Reorder array
        const newStops = [...stops];
        const [removed] = newStops.splice(draggedIdx, 1);
        newStops.splice(targetIdx, 0, removed);

        // Optimistic update
        setStops(newStops);
        setDraggedStopId(null);

        // Save to database
        const stopIds = newStops.map(s => s.id);
        await reorderStopsAPI(tour.id, stopIds);
    }

    // ============================================
    // INLINE TITLE EDITING
    // ============================================

    function startEditingTitle(stop: Stop) {
        const titleObj = typeof stop.title === 'object' ? stop.title : { en: String(stop.title) };
        setEditingTitleValue(titleObj);
        setEditingTitleStopId(stop.id);
        // Focus input after render
        setTimeout(() => titleInputRef.current?.focus(), 50);
    }

    function cancelEditingTitle() {
        setEditingTitleStopId(null);
        setEditingTitleValue({});
    }

    async function saveEditingTitle() {
        if (!editingTitleStopId || !tour) return;
        
        const stop = stops.find(s => s.id === editingTitleStopId);
        if (!stop) return;

        setIsSaving(true);
        const updatedStop = {
            ...stop,
            title: editingTitleValue,
        };

        const saved = await updateStopAPI(updatedStop);
        if (saved) {
            setStops(stops.map(s => s.id === saved.id ? saved : s));
        }
        
        setEditingTitleStopId(null);
        setEditingTitleValue({});
        setIsSaving(false);
    }

    async function translateStopTitle() {
        if (!editingTitleStopId || !tour) return;
        
        const primaryLang = tour.primaryLanguage || 'en';
        const sourceText = editingTitleValue[primaryLang] || editingTitleValue['en'] || Object.values(editingTitleValue)[0];
        
        if (!sourceText?.trim()) return;

        setIsTranslatingTitle(true);
        const newTitleObj = { ...editingTitleValue };

        // Translate to all tour languages
        for (const lang of (tour.languages || ['en'])) {
            if (lang === primaryLang) continue;
            try {
                const translated = await translateWithLibre(sourceText, primaryLang, lang);
                newTitleObj[lang] = translated;
            } catch (error) {
                console.error(`Failed to translate title to ${lang}:`, error);
            }
        }

        setEditingTitleValue(newTitleObj);
        setIsTranslatingTitle(false);
    }

    function handleTitleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEditingTitle();
        } else if (e.key === 'Escape') {
            cancelEditingTitle();
        }
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
                        onClick={() => setShowEditTour(true)}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        title="Tour Settings"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
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
            {/* ... preserved list code ... */}
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
                            draggable
                            onDragStart={(e) => handleDragStart(e, stop.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, stop.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, stop.id)}
                            className={`flex items-center gap-4 p-4 bg-[var(--color-bg-elevated)] border rounded-xl transition-all group ${
                                dragOverStopId === stop.id
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5 scale-[1.02]'
                                    : draggedStopId === stop.id
                                    ? 'border-[var(--color-accent-primary)]/50 opacity-50'
                                    : 'border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]/50'
                            }`}
                        >
                            {/* Drag Handle & Order */}
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
                                <GripVertical className="w-5 h-5 cursor-grab active:cursor-grabbing" />
                                <span className="w-6 h-6 flex items-center justify-center text-sm font-medium bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-full">
                                    {index + 1}
                                </span>
                            </div>

                            {/* Stop Info */}
                            <div className="flex-1 min-w-0">
                                {editingTitleStopId === stop.id ? (
                                    /* Edit mode - shown when pencil is clicked */
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            value={editingTitleValue[tour?.primaryLanguage || 'en'] || editingTitleValue['en'] || ''}
                                            onChange={(e) => setEditingTitleValue({
                                                ...editingTitleValue,
                                                [tour?.primaryLanguage || 'en']: e.target.value
                                            })}
                                            onKeyDown={handleTitleKeyDown}
                                            className="flex-1 px-2 py-1 bg-[var(--color-bg-surface)] border border-[var(--color-accent-primary)] rounded text-[var(--color-text-primary)] focus:outline-none text-sm font-medium"
                                            placeholder="Stop title..."
                                        />
                                        {(tour?.languages?.length || 0) > 1 && (
                                            <button
                                                onClick={translateStopTitle}
                                                disabled={isTranslatingTitle}
                                                className="p-1.5 hover:bg-[var(--color-accent-primary)]/10 rounded text-[var(--color-accent-primary)] disabled:opacity-50"
                                                title="Translate to all languages"
                                            >
                                                {isTranslatingTitle ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Languages className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                        <button
                                            onClick={saveEditingTitle}
                                            className="p-1.5 hover:bg-green-500/10 rounded text-green-500"
                                            title="Save (Enter)"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={cancelEditingTitle}
                                            className="p-1.5 hover:bg-red-500/10 rounded text-red-400"
                                            title="Cancel (Esc)"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    /* Display mode - plain text with visible pencil icon */
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                                            {getStopTitle(stop)}
                                        </h3>
                                        <button
                                            onClick={() => startEditingTitle(stop)}
                                            className="p-1 hover:bg-[var(--color-bg-hover)] rounded text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
                                            title="Edit title"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                <p className="text-sm text-[var(--color-text-muted)] truncate">
                                    {stop.type} • {stop.primaryPositioning.method.replace('_', ' ')}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowQRModal(stop.id)}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-secondary)]"
                                    title="View QR Code"
                                >
                                    <QrCode className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleEditStop(stop)}
                                    className="p-2 hover:bg-[var(--color-accent-primary)]/10 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-accent-primary)]"
                                    title="Edit Stop Content"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteStop(stop.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--color-text-secondary)] hover:text-red-500"
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
                    availableLanguages={tour.languages || ['en']}
                    onSave={handleSaveStop}
                    onClose={() => setEditingStop(null)}
                />
            )}

            {/* Edit Tour Settings Modal */}
            {tour && (
                <EditTourModal
                    isOpen={showEditTour}
                    tour={tour}
                    // Pass current template info structurally if needed, or just partial
                    template={undefined}
                    onClose={() => setShowEditTour(false)}
                    onSave={handleUpdateTour}
                />
            )}

        </div>
    );
}
