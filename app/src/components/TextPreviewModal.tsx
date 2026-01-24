import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface TextPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    language?: string;
    voiceName?: string;
}

export function TextPreviewModal({
    isOpen,
    onClose,
    title,
    text,
    language,
    voiceName,
}: TextPreviewModalProps) {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)]">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            {title}
                        </h2>
                        {(language || voiceName) && (
                            <div className="flex items-center gap-2 mt-1">
                                {language && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                                        {language}
                                    </span>
                                )}
                                {voiceName && (
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        Voice: {voiceName}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] transition-colors"
                            title="Copy text"
                        >
                            {copied ? (
                                <Check className="w-5 h-5 text-green-500" />
                            ) : (
                                <Copy className="w-5 h-5" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed">
                        {text}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                    <div className="flex justify-between items-center text-sm text-[var(--color-text-muted)]">
                        <span>{text.length} characters</span>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--color-bg-hover)] hover:bg-[var(--color-border-default)] rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
