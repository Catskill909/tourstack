import { useState, type ReactNode } from 'react';
import { X, Eye } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PreviewChoiceModal } from '../PreviewChoiceModal';
import type { Stop, Tour } from '../../types';

interface BlockEditorModalProps {
    title: string;
    icon: LucideIcon;
    onClose: () => void;
    children: ReactNode;
    stop?: Stop;
    tourData?: Tour;
    allStops?: Stop[];
    availableLanguages?: string[];
    wide?: boolean;
}

export function BlockEditorModal({ title, icon: Icon, onClose, children, stop, tourData, allStops, availableLanguages = ['en'], wide = false }: BlockEditorModalProps) {
    const [showPreview, setShowPreview] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#111] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-purple-500">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-lg font-bold text-white">Edit {title} Block</h2>
                </div>
                <div className="flex items-center gap-3">
                    {stop && tourData && (
                        <button
                            onClick={() => setShowPreview(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white/10 text-gray-300 hover:bg-white/20 rounded-lg transition-all"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white rounded-lg font-medium transition-colors"
                    >
                        Done
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className={wide ? 'max-w-6xl mx-auto' : 'max-w-2xl mx-auto'}>
                    {children}
                </div>
            </div>

            {/* Preview Choice Modal */}
            {showPreview && stop && tourData && (
                <PreviewChoiceModal
                    isOpen={showPreview}
                    tour={tourData}
                    stops={allStops || []}
                    initialStop={stop}
                    availableLanguages={availableLanguages}
                    onClose={() => setShowPreview(false)}
                />
            )}
        </div>
    );
}
