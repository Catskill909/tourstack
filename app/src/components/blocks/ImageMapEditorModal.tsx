import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Trash2, Plus, Minus, RotateCcw, MapPin, Layers, GripVertical, Info, Link2, Type, Palette, Languages, Loader2, Check as CheckIcon, Sparkles, FileText } from 'lucide-react';
import { ImageMapMarkerPin } from './ImageMapMarkerPin';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { magicTranslate, type TranslationProvider } from '../../services/translationService';
import type { ImageMapBlockData, ImageMapMarker, ImageMapFloor, ImageMapIcon, Stop } from '../../types';

interface ImageMapEditorModalProps {
    data: ImageMapBlockData;
    language: string;
    availableLanguages?: string[];
    allStops?: Stop[];
    translationProvider?: TranslationProvider;
    onChange: (data: ImageMapBlockData) => void;
    onClose: () => void;
}

const ICON_OPTIONS: { value: ImageMapIcon; label: string; icon: string }[] = [
    { value: 'pin', label: 'Pin', icon: '📍' },
    { value: 'dot', label: 'Dot', icon: '⚫' },
    { value: 'number', label: 'Number', icon: '#' },
    { value: 'star', label: 'Star', icon: '⭐' },
    { value: 'info', label: 'Info', icon: 'ℹ️' },
    { value: 'accessibility', label: 'Accessible', icon: '♿' },
    { value: 'restroom', label: 'Restroom', icon: '🚻' },
    { value: 'stairs', label: 'Stairs', icon: '🪜' },
    { value: 'elevator', label: 'Elevator', icon: '🛗' },
    { value: 'exit', label: 'Exit', icon: '🚪' },
    { value: 'cafe', label: 'Café', icon: '☕' },
    { value: 'gift-shop', label: 'Gift Shop', icon: '🎁' },
    { value: 'ticket', label: 'Tickets', icon: '🎫' },
    { value: 'camera', label: 'Photo Spot', icon: '📷' },
    { value: 'audio-guide', label: 'Audio Guide', icon: '🎧' },
    { value: 'parking', label: 'Parking', icon: '🅿️' },
];

const ALL_ICON_VALUES = ICON_OPTIONS.map(o => o.value);

const COLOR_OPTIONS = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#ef4444', label: 'Red' },
    { value: '#22c55e', label: 'Green' },
    { value: '#f97316', label: 'Orange' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#6b7280', label: 'Gray' },
];

// --- Helpers ---

function getFloors(data: ImageMapBlockData): ImageMapFloor[] {
    if (data.floors && data.floors.length > 0) return data.floors;
    // Legacy single-image: synthesize one floor
    if (data.imageUrl) {
        return [{
            id: 'default',
            imageUrl: data.imageUrl,
            imageAlt: data.imageAlt,
            label: { en: 'Floor 1' },
            order: 0,
            markers: data.markers || [],
        }];
    }
    return [];
}

function syncToData(data: ImageMapBlockData, floors: ImageMapFloor[], activeFloorId: string): ImageMapBlockData {
    if (floors.length <= 1 && floors[0]?.id === 'default') {
        // Single floor — keep flat format for backward compat
        return {
            ...data,
            imageUrl: floors[0]?.imageUrl || '',
            imageAlt: floors[0]?.imageAlt,
            markers: floors[0]?.markers || [],
            floors: undefined,
            activeFloorId: undefined,
        };
    }
    // Multi-floor
    return {
        ...data,
        imageUrl: floors[0]?.imageUrl || '',
        markers: floors[0]?.markers || [],
        floors,
        activeFloorId,
    };
}

export function ImageMapEditorModal({
    data,
    language,
    availableLanguages = ['en'],
    allStops = [],
    translationProvider,
    onChange,
    onClose,
}: ImageMapEditorModalProps) {
    const [floors, setFloors] = useState<ImageMapFloor[]>(() => getFloors(data));
    const [activeFloorId, setActiveFloorId] = useState<string>(() => {
        const f = getFloors(data);
        return data.activeFloorId || f[0]?.id || '';
    });
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [draggingMarkerId, setDraggingMarkerId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'markers' | 'settings'>('markers');
    const [activeLang, setActiveLang] = useState(language);
    const [isTranslatingAll, setIsTranslatingAll] = useState(false);
    const [translateStatus, setTranslateStatus] = useState<'idle' | 'success'>('idle');
    const [editorScale, setEditorScale] = useState(1);
    const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'generating' | 'success' | 'error'>('idle');
    const [aiMessage, setAiMessage] = useState('');
    const imageContainerRef = useRef<HTMLDivElement>(null);

    const primaryLang = availableLanguages[0] || 'en';
    const otherLangs = availableLanguages.filter(l => l !== primaryLang);
    const hasMultipleLanguages = availableLanguages.length > 1;

    const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0] || null;
    const activeMarkers = activeFloor?.markers || [];
    const selectedMarker = activeMarkers.find(m => m.id === selectedMarkerId);

    // Sync changes back to parent
    const emitChange = useCallback((updatedFloors: ImageMapFloor[], floorId?: string) => {
        onChange(syncToData(data, updatedFloors, floorId || activeFloorId));
    }, [data, activeFloorId, onChange]);

    function updateFloors(updatedFloors: ImageMapFloor[]) {
        setFloors(updatedFloors);
        emitChange(updatedFloors);
    }

    function updateActiveFloorMarkers(markers: ImageMapMarker[]) {
        const updated = floors.map(f =>
            f.id === activeFloorId ? { ...f, markers } : f
        );
        setFloors(updated);
        emitChange(updated);
    }

    // --- Floor management ---
    function addFloor() {
        const newFloor: ImageMapFloor = {
            id: crypto.randomUUID(),
            imageUrl: '',
            label: { [activeLang]: `Floor ${floors.length + 1}` },
            order: floors.length,
            markers: [],
        };
        const updated = [...floors, newFloor];
        setFloors(updated);
        setActiveFloorId(newFloor.id);
        emitChange(updated, newFloor.id);
    }

    function deleteFloor(floorId: string) {
        if (floors.length <= 1) return;
        const updated = floors.filter(f => f.id !== floorId).map((f, i) => ({ ...f, order: i }));
        setFloors(updated);
        if (activeFloorId === floorId) {
            setActiveFloorId(updated[0]?.id || '');
        }
        emitChange(updated, updated[0]?.id);
    }

    // --- Image Upload ---
    function handleFloorImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !activeFloor) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const url = event.target?.result as string;
            const updated = floors.map(f =>
                f.id === activeFloorId ? { ...f, imageUrl: url } : f
            );
            updateFloors(updated);
        };
        reader.readAsDataURL(file);
    }

    // --- Marker Placement ---
    function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
        if (draggingMarkerId) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const marker: ImageMapMarker = {
            id: crypto.randomUUID(),
            x: Math.round(x * 100) / 100,
            y: Math.round(y * 100) / 100,
            label: { [activeLang]: `Marker ${activeMarkers.length + 1}` },
            icon: 'number',
            number: activeMarkers.length + 1,
        };
        updateActiveFloorMarkers([...activeMarkers, marker]);
        setSelectedMarkerId(marker.id);
    }

    // --- Marker Dragging ---
    const handleDragStart = useCallback((markerId: string, e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingMarkerId(markerId);
        const container = imageContainerRef.current;
        if (!container) return;

        function getPos(ev: MouseEvent | TouchEvent) {
            const rect = container!.getBoundingClientRect();
            const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
            const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
            return {
                x: Math.min(100, Math.max(0, ((cx - rect.left) / rect.width) * 100)),
                y: Math.min(100, Math.max(0, ((cy - rect.top) / rect.height) * 100)),
            };
        }

        function onMove(ev: MouseEvent | TouchEvent) {
            const pos = getPos(ev);
            setFloors(prev => {
                const updated = prev.map(f =>
                    f.id === activeFloorId
                        ? {
                            ...f,
                            markers: f.markers.map(m =>
                                m.id === markerId
                                    ? { ...m, x: Math.round(pos.x * 100) / 100, y: Math.round(pos.y * 100) / 100 }
                                    : m
                            ),
                        }
                        : f
                );
                return updated;
            });
        }

        function onEnd() {
            setDraggingMarkerId(null);
            // Sync final position to parent
            setFloors(prev => {
                emitChange(prev);
                return prev;
            });
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchmove', onMove);
        document.addEventListener('touchend', onEnd);
    }, [activeFloorId, emitChange]);

    function updateMarker(markerId: string, updates: Partial<ImageMapMarker>) {
        updateActiveFloorMarkers(
            activeMarkers.map(m => m.id === markerId ? { ...m, ...updates } : m)
        );
    }

    function deleteMarker(markerId: string) {
        const updated = activeMarkers.filter(m => m.id !== markerId).map((m, i) => ({ ...m, number: i + 1 }));
        updateActiveFloorMarkers(updated);
        if (selectedMarkerId === markerId) setSelectedMarkerId(null);
    }

    function getStopTitle(stop: Stop): string {
        const title = typeof stop.title === 'string'
            ? (() => { try { return JSON.parse(stop.title); } catch { return { en: stop.title }; } })()
            : stop.title;
        return title?.[activeLang] || title?.en || stop.id;
    }

    // --- Translate active floor only (batch via magicTranslate) ---
    async function handleTranslateFloor(forceRetranslate = false) {
        if (!hasMultipleLanguages || isTranslatingAll || !activeFloor) return;
        setIsTranslatingAll(true);
        try {
            type TextRef = { field: 'floorLabel' | 'markerLabel' | 'markerInfo'; markerIdx?: number };
            const jobs: { source: string; ref: TextRef; langsNeeded: string[] }[] = [];

            // Deep-copy only the active floor
            const workFloor: ImageMapFloor = {
                ...activeFloor,
                label: { ...activeFloor.label },
                markers: activeFloor.markers.map(m => ({ ...m, label: { ...m.label }, infoText: m.infoText ? { ...m.infoText } : undefined })),
            };

            const floorSrc = workFloor.label?.[primaryLang]?.trim();
            if (floorSrc) {
                const needed = otherLangs.filter(l => forceRetranslate || !workFloor.label?.[l]?.trim());
                if (needed.length > 0) jobs.push({ source: floorSrc, ref: { field: 'floorLabel' }, langsNeeded: needed });
            }
            for (let mi = 0; mi < workFloor.markers.length; mi++) {
                const marker = workFloor.markers[mi];
                const labelSrc = marker.label?.[primaryLang]?.trim();
                if (labelSrc) {
                    const needed = otherLangs.filter(l => forceRetranslate || !marker.label?.[l]?.trim());
                    if (needed.length > 0) jobs.push({ source: labelSrc, ref: { field: 'markerLabel', markerIdx: mi }, langsNeeded: needed });
                }
                const infoSrc = marker.infoText?.[primaryLang]?.trim();
                if (infoSrc) {
                    const needed = otherLangs.filter(l => forceRetranslate || !marker.infoText?.[l]?.trim());
                    if (needed.length > 0) jobs.push({ source: infoSrc, ref: { field: 'markerInfo', markerIdx: mi }, langsNeeded: needed });
                }
            }

            await Promise.all(jobs.map(async (job) => {
                try {
                    const translations = await magicTranslate(job.source, primaryLang, job.langsNeeded, undefined, translationProvider);
                    const { ref } = job;
                    if (ref.field === 'floorLabel') {
                        workFloor.label = { ...workFloor.label, ...translations };
                    } else if (ref.field === 'markerLabel' && ref.markerIdx !== undefined) {
                        workFloor.markers[ref.markerIdx].label = { ...workFloor.markers[ref.markerIdx].label, ...translations };
                    } else if (ref.field === 'markerInfo' && ref.markerIdx !== undefined) {
                        workFloor.markers[ref.markerIdx].infoText = { ...workFloor.markers[ref.markerIdx].infoText, ...translations };
                    }
                } catch { /* skip failed translations */ }
            }));

            const updatedFloors = floors.map(f => f.id === activeFloorId ? workFloor : f);
            setFloors(updatedFloors);
            emitChange(updatedFloors);
            setTranslateStatus('success');
            setTimeout(() => setTranslateStatus('idle'), 2500);
        } catch (err) {
            console.error('Translation failed:', err);
        } finally {
            setIsTranslatingAll(false);
        }
    }

    // Count translation coverage for active floor only
    function getFloorTranslationCoverage(): { translated: number; total: number } {
        if (!hasMultipleLanguages || !activeFloor) return { translated: 0, total: 0 };
        let total = 0;
        let translated = 0;
        if (activeFloor.label?.[primaryLang]?.trim()) {
            total += otherLangs.length;
            translated += otherLangs.filter(l => activeFloor.label?.[l]?.trim()).length;
        }
        for (const marker of activeFloor.markers) {
            if (marker.label?.[primaryLang]?.trim()) {
                total += otherLangs.length;
                translated += otherLangs.filter(l => marker.label?.[l]?.trim()).length;
            }
            if (marker.infoText?.[primaryLang]?.trim()) {
                total += otherLangs.length;
                translated += otherLangs.filter(l => marker.infoText?.[l]?.trim()).length;
            }
        }
        return { translated, total };
    }

    // --- AI: Auto-suggest markers from floor plan ---
    async function handleAISuggestMarkers() {
        if (!activeFloor?.imageUrl) return;
        setAiStatus('analyzing');
        setAiMessage('Analyzing floor plan...');
        try {
            // Convert image to base64
            const response = await fetch(activeFloor.imageUrl);
            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(blob);
            });

            const apiResponse = await fetch('/api/gemini/analyze-floorplan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64 }),
            });

            if (!apiResponse.ok) throw new Error('API request failed');

            const data = await apiResponse.json();
            if (!data.markers || !Array.isArray(data.markers)) throw new Error('Invalid response format');

            // Convert AI suggestions to ImageMapMarker format
            const existingCount = activeMarkers.length;
            const newMarkers: ImageMapMarker[] = data.markers.map((m: { label: string; x: number; y: number; icon?: string; description?: string }, i: number) => ({
                id: crypto.randomUUID(),
                x: Math.round(Math.min(100, Math.max(0, m.x)) * 100) / 100,
                y: Math.round(Math.min(100, Math.max(0, m.y)) * 100) / 100,
                label: { [activeLang]: m.label },
                icon: (ALL_ICON_VALUES.includes(m.icon as ImageMapIcon) ? m.icon : 'number') as ImageMapIcon,
                number: existingCount + i + 1,
                infoText: m.description ? { [activeLang]: m.description } : undefined,
            }));

            // Combine marker + floor label update in one state write to avoid stale closure overwrite
            const updatedFloors = floors.map(f => {
                if (f.id !== activeFloorId) return f;
                const updatedFloor = { ...f, markers: [...activeMarkers, ...newMarkers] };
                if (data.floorName) {
                    updatedFloor.label = { ...f.label, [activeLang]: data.floorName };
                }
                return updatedFloor;
            });
            setFloors(updatedFloors);
            emitChange(updatedFloors);

            setAiStatus('success');
            setAiMessage(`Added ${newMarkers.length} markers`);
            setTimeout(() => { setAiStatus('idle'); setAiMessage(''); }, 3000);
        } catch (error: any) {
            console.error('AI floor plan analysis failed:', error);
            setAiStatus('error');
            setAiMessage(error.message || 'Analysis failed');
            setTimeout(() => { setAiStatus('idle'); setAiMessage(''); }, 4000);
        }
    }

    // --- AI: Generate info text for existing markers ---
    async function handleAIGenerateDescriptions() {
        const markersNeedingInfo = activeMarkers.filter(m =>
            m.label?.[activeLang]?.trim() && !m.infoText?.[activeLang]?.trim()
        );
        if (markersNeedingInfo.length === 0) {
            setAiStatus('error');
            setAiMessage('All markers already have descriptions');
            setTimeout(() => { setAiStatus('idle'); setAiMessage(''); }, 3000);
            return;
        }

        setAiStatus('generating');
        setAiMessage(`Writing ${markersNeedingInfo.length} descriptions...`);
        try {
            let base64: string | undefined;
            if (activeFloor?.imageUrl) {
                const response = await fetch(activeFloor.imageUrl);
                const blob = await response.blob();
                base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
            }

            const apiResponse = await fetch('/api/gemini/generate-marker-info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: base64,
                    markers: markersNeedingInfo.map(m => ({
                        id: m.id,
                        label: m.label?.[activeLang] || m.label?.en || 'Unknown',
                    })),
                    language: activeLang,
                }),
            });

            if (!apiResponse.ok) throw new Error('API request failed');

            const data = await apiResponse.json();
            if (!data.descriptions || !Array.isArray(data.descriptions)) throw new Error('Invalid response');

            // Map descriptions back to markers by index
            const updatedMarkers = activeMarkers.map(marker => {
                const matchIndex = markersNeedingInfo.findIndex(m => m.id === marker.id);
                if (matchIndex === -1) return marker;
                const desc = data.descriptions[matchIndex];
                if (!desc?.infoText) return marker;
                return {
                    ...marker,
                    infoText: { ...marker.infoText, [activeLang]: desc.infoText },
                };
            });

            updateActiveFloorMarkers(updatedMarkers);
            setAiStatus('success');
            setAiMessage(`Generated ${data.descriptions.length} descriptions`);
            setTimeout(() => { setAiStatus('idle'); setAiMessage(''); }, 3000);
        } catch (error: any) {
            console.error('AI description generation failed:', error);
            setAiStatus('error');
            setAiMessage(error.message || 'Generation failed');
            setTimeout(() => { setAiStatus('idle'); setAiMessage(''); }, 4000);
        }
    }

    // Close on escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-[100] flex bg-black/80 backdrop-blur-sm">
            {/* Main area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-3 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-blue-600">
                            <Layers className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-[var(--color-text-primary)]">Image Map Editor</h2>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {floors.length} floor{floors.length !== 1 ? 's' : ''} • {activeMarkers.length} marker{activeMarkers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--color-accent-primary)] to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                        >
                            Done
                        </button>
                    </div>
                </div>

                {/* Floor tabs */}
                <div className="flex items-center gap-1 px-4 py-2 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)] overflow-x-auto">
                    {floors.map(floor => (
                        <div
                            key={floor.id}
                            role="tab"
                            tabIndex={0}
                            onClick={() => { setActiveFloorId(floor.id); setSelectedMarkerId(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveFloorId(floor.id); setSelectedMarkerId(null); } }}
                            className={`group flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer select-none ${floor.id === activeFloorId
                                ? 'bg-[var(--color-accent-primary)] text-white shadow-md'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            <span>{floor.label?.[activeLang] || floor.label?.en || `Floor ${floor.order + 1}`}</span>
                            <span className="text-[10px] opacity-60">{floor.markers.length}</span>
                            {floors.length > 1 && floor.id !== activeFloorId && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteFloor(floor.id); }}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={addFloor}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-accent-primary)] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Floor
                    </button>
                    {/* Per-floor translate */}
                    {hasMultipleLanguages && (() => {
                        const { translated, total } = getFloorTranslationCoverage();
                        const allDone = total > 0 && translated === total;
                        const hasSome = translated > 0 && translated < total;
                        return (
                            <div className="flex items-center gap-2 ml-auto">
                                {total > 0 && (
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        {translated}/{total}
                                    </span>
                                )}
                                <button
                                    onClick={() => handleTranslateFloor(allDone)}
                                    disabled={isTranslatingAll || total === 0}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg disabled:opacity-50 transition-colors ${allDone
                                        ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        : 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/20'
                                        }`}
                                >
                                    {isTranslatingAll ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : translateStatus === 'success' ? (
                                        <CheckIcon className="w-3.5 h-3.5" />
                                    ) : (
                                        <Languages className="w-3.5 h-3.5" />
                                    )}
                                    {allDone ? 'Re-translate floor' : hasSome ? 'Translate remaining' : 'Translate floor'}
                                </button>
                            </div>
                        );
                    })()}
                </div>

                {/* Canvas */}
                <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-neutral-900/50 relative">
                    {activeFloor?.imageUrl ? (
                        <div
                            className="relative max-w-full max-h-full"
                            style={{
                                transform: `scale(${editorScale})`,
                                transformOrigin: 'center center',
                                transition: 'transform 0.2s ease-out',
                            }}
                        >
                            <div
                                ref={imageContainerRef}
                                className="relative cursor-crosshair rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10"
                                onClick={handleImageClick}
                            >
                                <img
                                    src={activeFloor.imageUrl}
                                    alt={activeFloor.imageAlt?.[activeLang] || 'Floor plan'}
                                    className="max-h-[calc(100vh-220px)] w-auto block"
                                    draggable={false}
                                />
                                {activeMarkers.map(marker => (
                                    <ImageMapMarkerPin
                                        key={marker.id}
                                        marker={marker}
                                        language={activeLang}
                                        selected={marker.id === selectedMarkerId}
                                        dragging={marker.id === draggingMarkerId}
                                        showLabel={data.showLabels}
                                        labelsPosition={data.labelsPosition}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedMarkerId(marker.id === selectedMarkerId ? null : marker.id);
                                        }}
                                        onMouseDown={(e) => handleDragStart(marker.id, e)}
                                        onTouchStart={(e) => handleDragStart(marker.id, e)}
                                    />
                                ))}
                            </div>
                            <p className="text-center text-xs text-white/60 mt-3">
                                Click to place • Click marker to select • Drag to move • Scroll to zoom
                            </p>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center w-full max-w-lg aspect-[4/3] border-2 border-dashed border-white/20 rounded-2xl cursor-pointer hover:border-[var(--color-accent-primary)]/50 hover:bg-white/5 transition-colors">
                            <Upload className="w-12 h-12 text-white/30 mb-3" />
                            <p className="text-white/60 font-medium mb-1">Upload Floor Plan</p>
                            <p className="text-white/30 text-sm">PNG, JPG, or WebP</p>
                            <input type="file" accept="image/*" onChange={handleFloorImageUpload} className="hidden" />
                        </label>
                    )}

                    {/* Zoom Controls */}
                    {activeFloor?.imageUrl && (
                        <div className="absolute bottom-5 right-5 z-30 flex flex-col items-center gap-1 bg-neutral-800/80 backdrop-blur-md rounded-2xl shadow-2xl ring-1 ring-white/[0.08] p-1.5">
                            <button
                                onClick={() => setEditorScale(prev => Math.min(4, prev + 0.25))}
                                disabled={editorScale >= 4}
                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-25 text-white/70 hover:text-white hover:bg-white/10 active:scale-90"
                            >
                                <Plus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            {editorScale > 1 ? (
                                <button
                                    onClick={() => { setEditorScale(1); }}
                                    className="w-9 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all active:scale-90"
                                    title="Reset zoom"
                                >
                                    <span className="text-[10px] font-semibold tabular-nums text-white/50">
                                        {Math.round(editorScale * 100)}%
                                    </span>
                                </button>
                            ) : (
                                <div className="w-9 h-7 flex items-center justify-center">
                                    <span className="text-[10px] font-semibold tabular-nums text-white/30">
                                        100%
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => setEditorScale(prev => Math.max(0.5, prev - 0.25))}
                                disabled={editorScale <= 0.5}
                                className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-25 text-white/70 hover:text-white hover:bg-white/10 active:scale-90"
                            >
                                <Minus className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            {editorScale !== 1 && (
                                <button
                                    onClick={() => setEditorScale(1)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl transition-all text-white/50 hover:text-white hover:bg-white/10 active:scale-90 border-t border-white/[0.06] mt-0.5 pt-0.5"
                                    title="Reset to 100%"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-[var(--color-bg-surface)] border-l border-[var(--color-border-default)] flex flex-col overflow-hidden">
                {/* Sidebar tabs */}
                <div className="flex border-b border-[var(--color-border-default)]">
                    <button
                        onClick={() => setSidebarTab('markers')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'markers'
                            ? 'text-[var(--color-accent-primary)] border-b-2 border-[var(--color-accent-primary)]'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <MapPin className="w-4 h-4 inline mr-1.5" />
                        Markers
                    </button>
                    <button
                        onClick={() => setSidebarTab('settings')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${sidebarTab === 'settings'
                            ? 'text-[var(--color-accent-primary)] border-b-2 border-[var(--color-accent-primary)]'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        <Palette className="w-4 h-4 inline mr-1.5" />
                        Settings
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {sidebarTab === 'markers' ? (
                        <div className="p-4 space-y-4">
                            {/* Language switcher */}
                            {hasMultipleLanguages && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Editing Language</label>
                                    <LanguageSwitcher
                                        availableLanguages={availableLanguages}
                                        activeLanguage={activeLang}
                                        onChange={setActiveLang}
                                        size="sm"
                                        showStatus={false}
                                    />
                                </div>
                            )}

                            {/* Floor label edit */}
                            {activeFloor && (
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Floor Label</label>
                                    <input
                                        type="text"
                                        value={activeFloor.label?.[activeLang] || ''}
                                        onChange={(e) => {
                                            const updated = floors.map(f =>
                                                f.id === activeFloorId ? { ...f, label: { ...f.label, [activeLang]: e.target.value } } : f
                                            );
                                            updateFloors(updated);
                                        }}
                                        className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                                        placeholder="e.g. Ground Floor"
                                    />
                                </div>
                            )}

                            {/* Replace image */}
                            {activeFloor?.imageUrl && (
                                <label className="block text-xs text-center text-[var(--color-accent-primary)] hover:underline cursor-pointer">
                                    Replace Floor Image
                                    <input type="file" accept="image/*" onChange={handleFloorImageUpload} className="hidden" />
                                </label>
                            )}

                            {/* AI Tools */}
                            {activeFloor?.imageUrl && (
                                <div className="bg-gradient-to-br from-violet-500/[0.07] via-fuchsia-500/[0.05] to-transparent border border-violet-500/20 rounded-xl p-3 space-y-2">
                                    <div className="flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                                        <span className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">AI Tools</span>
                                    </div>

                                    {/* Status message */}
                                    {aiStatus !== 'idle' && (
                                        <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${aiStatus === 'analyzing' || aiStatus === 'generating'
                                            ? 'bg-violet-500/10 text-violet-300'
                                            : aiStatus === 'success'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : 'bg-red-500/10 text-red-400'
                                            }`}>
                                            {(aiStatus === 'analyzing' || aiStatus === 'generating') && (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            )}
                                            {aiStatus === 'success' && <CheckIcon className="w-3 h-3" />}
                                            <span>{aiMessage}</span>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAISuggestMarkers}
                                        disabled={aiStatus === 'analyzing' || aiStatus === 'generating'}
                                        className="w-full flex items-center gap-2 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Suggest Markers
                                        <span className="ml-auto text-[10px] text-violet-400/60">Gemini</span>
                                    </button>

                                    {activeMarkers.length > 0 && (
                                        <button
                                            onClick={handleAIGenerateDescriptions}
                                            disabled={aiStatus === 'analyzing' || aiStatus === 'generating'}
                                            className="w-full flex items-center gap-2 px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-violet-200 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            Generate Descriptions
                                            <span className="ml-auto text-[10px] text-violet-400/60">Gemini</span>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Selected marker editor */}
                            {selectedMarker && (
                                <div className="bg-gradient-to-b from-[var(--color-accent-primary)]/5 to-transparent border border-[var(--color-accent-primary)]/20 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[var(--color-accent-primary)]" />
                                            Marker #{selectedMarker.number || '?'}
                                        </h4>
                                        <button
                                            onClick={() => deleteMarker(selectedMarker.id)}
                                            className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-colors"
                                            title="Delete marker"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Label */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                                            <Type className="w-3 h-3" /> Label
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedMarker.label?.[activeLang] || ''}
                                            onChange={(e) => updateMarker(selectedMarker.id, {
                                                label: { ...selectedMarker.label, [activeLang]: e.target.value },
                                            })}
                                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-accent-primary)]/30 focus:border-[var(--color-accent-primary)] transition-shadow"
                                            placeholder="e.g. Egyptian Wing"
                                        />
                                    </div>

                                    {/* Icon + Color */}
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Icon</label>
                                            <div className="grid grid-cols-5 gap-1">
                                                {ICON_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => updateMarker(selectedMarker.id, { icon: opt.value })}
                                                        className={`p-1.5 rounded-lg text-center text-sm transition-all ${(selectedMarker.icon || 'pin') === opt.value
                                                            ? 'bg-[var(--color-accent-primary)]/20 ring-2 ring-[var(--color-accent-primary)] scale-105'
                                                            : 'hover:bg-[var(--color-bg-hover)]'
                                                            }`}
                                                        title={opt.label}
                                                    >
                                                        {opt.icon}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color swatches */}
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Color</label>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {COLOR_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => updateMarker(selectedMarker.id, { color: opt.value })}
                                                    className={`w-6 h-6 rounded-full transition-all ${(selectedMarker.color || '#3b82f6') === opt.value
                                                        ? 'ring-2 ring-offset-2 ring-[var(--color-accent-primary)] scale-110'
                                                        : 'hover:scale-110'
                                                        }`}
                                                    style={{ backgroundColor: opt.value }}
                                                    title={opt.label}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action: Link to Stop OR Info Text */}
                                    <div className="space-y-2 pt-1 border-t border-[var(--color-border-default)]">
                                        <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                                            <Link2 className="w-3 h-3" /> Tap Action
                                        </label>

                                        {/* Link to stop */}
                                        <div>
                                            <label className="block text-[10px] text-[var(--color-text-muted)] mb-0.5">Navigate to stop</label>
                                            <select
                                                value={selectedMarker.stopId || ''}
                                                onChange={(e) => updateMarker(selectedMarker.id, { stopId: e.target.value || undefined })}
                                                className="w-full px-3 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                                            >
                                                <option value="">None</option>
                                                {allStops.map(stop => (
                                                    <option key={stop.id} value={stop.id}>
                                                        Stop {stop.order}: {getStopTitle(stop)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Info text (shown when no stop linked or as additional info) */}
                                        <div>
                                            <label className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)] mb-0.5">
                                                <Info className="w-3 h-3" />
                                                Info popup text {!selectedMarker.stopId && '(shown on tap)'}
                                            </label>
                                            <textarea
                                                value={selectedMarker.infoText?.[activeLang] || ''}
                                                onChange={(e) => updateMarker(selectedMarker.id, {
                                                    infoText: { ...selectedMarker.infoText, [activeLang]: e.target.value },
                                                })}
                                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)] resize-none focus:ring-2 focus:ring-[var(--color-accent-primary)]/30 focus:border-[var(--color-accent-primary)] transition-shadow"
                                                rows={3}
                                                placeholder="Description shown when visitor taps this marker..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Marker list */}
                            <div>
                                <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                                    Markers on this floor ({activeMarkers.length})
                                </h4>
                                {activeMarkers.length === 0 ? (
                                    <p className="text-sm text-[var(--color-text-muted)] italic text-center py-6">
                                        Click on the floor plan to place markers
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {activeMarkers.map(marker => {
                                            const linkedStop = marker.stopId ? allStops.find(s => s.id === marker.stopId) : null;
                                            const hasInfo = !!(marker.infoText?.[activeLang] || marker.infoText?.en);
                                            return (
                                                <div
                                                    key={marker.id}
                                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all ${marker.id === selectedMarkerId
                                                        ? 'bg-[var(--color-accent-primary)]/10 ring-1 ring-[var(--color-accent-primary)]/30'
                                                        : 'hover:bg-[var(--color-bg-hover)]'
                                                        }`}
                                                    onClick={() => setSelectedMarkerId(marker.id === selectedMarkerId ? null : marker.id)}
                                                >
                                                    <GripVertical className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                                                    <span className="text-sm shrink-0" title={ICON_OPTIONS.find(o => o.value === marker.icon)?.label || 'Pin'}>
                                                        {ICON_OPTIONS.find(o => o.value === marker.icon)?.icon || '📍'}
                                                    </span>
                                                    <span className="flex-1 text-[var(--color-text-primary)] truncate">
                                                        {marker.number ? `${marker.number}. ` : ''}{marker.label?.[activeLang] || marker.label?.en || 'Unlabeled'}
                                                    </span>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {linkedStop && (
                                                            <Link2 className="w-3 h-3 text-[var(--color-accent-primary)]" aria-label={`→ ${getStopTitle(linkedStop)}`} />
                                                        )}
                                                        {hasInfo && (
                                                            <Info className="w-3 h-3 text-blue-400" aria-label="Has info text" />
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteMarker(marker.id); }}
                                                        className="text-[var(--color-text-muted)] hover:text-red-500 p-0.5 shrink-0"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Settings tab */
                        <div className="p-4 space-y-5">
                            {/* Size */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Display Size</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {(['small', 'medium', 'large', 'full'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => onChange({ ...data, size })}
                                            className={`px-2 py-2 text-xs rounded-lg border capitalize font-medium transition-all ${(data.size || 'large') === size
                                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                                : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-primary)]'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Label position */}
                            <div>
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Label Position</label>
                                <div className="grid grid-cols-3 gap-1">
                                    {(['above', 'below', 'right'] as const).map(pos => (
                                        <button
                                            key={pos}
                                            onClick={() => onChange({ ...data, labelsPosition: pos })}
                                            className={`px-2 py-2 text-xs rounded-lg border capitalize font-medium transition-all ${(data.labelsPosition || 'below') === pos
                                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                                : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-primary)]'
                                                }`}
                                        >
                                            {pos}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="space-y-3">
                                <label className="block text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Options</label>
                                {[
                                    { key: 'showLabels' as const, label: 'Show labels', defaultVal: true },
                                    { key: 'zoomable' as const, label: 'Pinch to zoom', defaultVal: true },
                                    { key: 'showLegend' as const, label: 'Show legend', defaultVal: false },
                                ].map(({ key, label, defaultVal }) => (
                                    <label key={key} className="flex items-center justify-between group cursor-pointer">
                                        <span className="text-sm text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">{label}</span>
                                        <div
                                            className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${(data[key] ?? defaultVal) ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-hover)]'
                                                }`}
                                            onClick={() => onChange({ ...data, [key]: !(data[key] ?? defaultVal) })}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${(data[key] ?? defaultVal) ? 'translate-x-4' : 'translate-x-0'
                                                }`} />
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
