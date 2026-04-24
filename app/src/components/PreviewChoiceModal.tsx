import { useState, useEffect } from 'react';
import { X, Smartphone, ExternalLink, Settings2, Loader2 } from 'lucide-react';
import { StopPreviewModal } from './StopPreviewModal';
import { KioskLauncherModal } from './KioskLauncherModal';
import type { Tour, Stop } from '../types';

interface PreviewChoiceModalProps {
    isOpen: boolean;
    tour: Tour;
    stops: Stop[];
    /** Which stop to preview in simulator — defaults to first stop */
    initialStop?: Stop;
    availableLanguages?: string[];
    /** When true, stops are still loading — action buttons show a spinner and are disabled */
    isLoading?: boolean;
    onClose: () => void;
}

export function PreviewChoiceModal({ isOpen, tour, stops, initialStop, availableLanguages, isLoading = false, onClose }: PreviewChoiceModalProps) {
    const [showSimulator, setShowSimulator] = useState(false);
    const [showKioskModal, setShowKioskModal] = useState(false);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset sub-modal state when closing
    useEffect(() => {
        if (!isOpen) {
            setShowSimulator(false);
            setShowKioskModal(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sortedStops = [...stops].sort((a, b) => a.order - b.order);
    const previewStop = initialStop || sortedStops[0];
    const langs = availableLanguages || tour.languages || ['en'];

    function handleSimulator() {
        setShowSimulator(true);
    }

    function handleTourDevice() {
        const slug = tour.slug || tour.id;
        const firstStop = sortedStops[0];
        if (!firstStop) return;
        const stopSlug = firstStop.slug || firstStop.id;
        const lang = tour.primaryLanguage || 'en';
        window.open(`/visitor/tour/${slug}/stop/${stopSlug}?staff=true&lang=${lang}`, '_blank');
        onClose();
    }

    function handleAdvanced() {
        setShowKioskModal(true);
    }

    // If simulator is open, render it instead of the choice modal
    if (showSimulator && previewStop) {
        return (
            <StopPreviewModal
                stop={previewStop}
                tourData={tour}
                allStops={sortedStops}
                availableLanguages={langs}
                onClose={() => {
                    setShowSimulator(false);
                    onClose();
                }}
            />
        );
    }

    // If kiosk launcher is open, render it instead
    if (showKioskModal) {
        return (
            <KioskLauncherModal
                isOpen={true}
                tour={tour}
                stops={sortedStops}
                onClose={() => {
                    setShowKioskModal(false);
                    onClose();
                }}
            />
        );
    }

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        Preview Tour
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors" aria-label="Close">
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Two choices */}
                <div className="p-6 space-y-3">
                    {/* Simulator */}
                    <button
                        onClick={handleSimulator}
                        disabled={!previewStop || isLoading}
                        className="w-full text-left p-4 rounded-xl border-2 border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center shrink-0">
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                                ) : (
                                    <Smartphone className="w-6 h-6 text-blue-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                                    Simulator
                                </p>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                    Preview in a phone, tablet, or kiosk frame right here in the editor. Great for checking layout and content.
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Tour Device */}
                    <button
                        onClick={handleTourDevice}
                        disabled={sortedStops.length === 0 || isLoading}
                        className="w-full text-left p-4 rounded-xl border-2 border-[var(--color-border-default)] hover:border-green-500 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center shrink-0">
                                {isLoading ? (
                                    <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
                                ) : (
                                    <ExternalLink className="w-6 h-6 text-green-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[var(--color-text-primary)] group-hover:text-green-400 transition-colors">
                                    Tour Device
                                </p>
                                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                    Open in a new browser tab exactly as visitors will see it. Use this to test on a real device or share a preview link.
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Advanced button */}
                <div className="px-6 pb-5">
                    <button
                        onClick={handleAdvanced}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-default)] hover:border-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] rounded-lg px-4 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Settings2 className="w-4 h-4" />
                        <span>Advanced: Kiosk, Staff Handoff & Export</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
