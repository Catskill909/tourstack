import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    title: string;
    itemName: string;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export function DeleteConfirmModal({
    isOpen,
    title,
    itemName,
    onClose,
    onConfirm,
    isDeleting = false
}: DeleteConfirmModalProps) {
    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter' && !isDeleting) onConfirm();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, onConfirm, isDeleting]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl shadow-2xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                </button>

                <div className="p-6">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>

                    {/* Content */}
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)] text-center mb-2">
                        {title}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-center mb-1">
                        Are you sure you want to delete
                    </p>
                    <p className="text-[var(--color-text-primary)] font-medium text-center mb-4">
                        "{itemName}"?
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] text-center">
                        This action cannot be undone. All stops and content will be permanently removed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
