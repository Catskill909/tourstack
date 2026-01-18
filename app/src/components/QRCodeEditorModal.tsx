import { useState, useEffect } from 'react';
import { X, QrCode, RefreshCw, Copy, Check, ExternalLink, Download } from 'lucide-react';
import type { Stop, PositioningConfig, QRCodeConfig } from '../types';

interface QRCodeEditorModalProps {
    stop: Stop;
    tourId: string;
    onSave: (stop: Stop) => void;
    onClose: () => void;
}

// Generate QR code URL via public API
function generateQRCodeUrl(content: string, size: number = 300): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(content)}`;
}

// Generate a short code
function generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function QRCodeEditorModal({ stop, tourId, onSave, onClose }: QRCodeEditorModalProps) {
    const [copied, setCopied] = useState(false);

    // Get current config
    const qrConfig = (stop.primaryPositioning as QRCodeConfig) || {
        method: 'qr_code' as const,
        url: '',
        shortCode: generateShortCode(),
    };

    // Default URL if not set
    const defaultBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tourstack.app';
    const defaultUrl = `${defaultBaseUrl}/visitor/tour/${tourId}/stop/${stop.id}`;

    const [targetUrl, setTargetUrl] = useState(qrConfig.url || defaultUrl);
    const [shortCode, setShortCode] = useState(qrConfig.shortCode || generateShortCode());
    const [qrCodeUrl, setQrCodeUrl] = useState(generateQRCodeUrl(targetUrl));

    // Update QR code when URL changes
    useEffect(() => {
        setQrCodeUrl(generateQRCodeUrl(targetUrl));
    }, [targetUrl]);

    function getStopTitle(): string {
        return typeof stop.title === 'object'
            ? stop.title.en || Object.values(stop.title)[0] || 'Untitled'
            : String(stop.title);
    }

    function handleCopyUrl() {
        navigator.clipboard.writeText(targetUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleGenerateNewShortCode() {
        setShortCode(generateShortCode());
    }

    function handleSave() {
        const updatedPositioning: PositioningConfig = {
            method: 'qr_code',
            url: targetUrl,
            shortCode: shortCode,
        };

        onSave({
            ...stop,
            primaryPositioning: updatedPositioning,
            updatedAt: new Date().toISOString(),
        });
    }

    function handleDownload() {
        // Create a larger QR code for download
        const downloadUrl = generateQRCodeUrl(targetUrl, 500);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `qr-${stop.id}.png`;
        link.click();
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <QrCode className="w-5 h-5 text-[var(--color-accent-primary)]" />
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">QR Code Settings</h2>
                            <p className="text-sm text-[var(--color-text-muted)]">{getStopTitle()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex gap-6">
                        {/* QR Code Preview */}
                        <div className="shrink-0 flex flex-col items-center">
                            <div className="bg-white p-4 rounded-xl shadow-lg">
                                <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40" />
                            </div>
                            <button
                                onClick={() => setQrCodeUrl(generateQRCodeUrl(targetUrl))}
                                className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                            </button>
                        </div>

                        {/* Settings */}
                        <div className="flex-1 space-y-5">
                            {/* Target URL */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Target URL
                                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(visitors go here when scanning)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
                                        placeholder="https://..."
                                    />
                                    <button
                                        onClick={handleCopyUrl}
                                        className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                        title="Copy URL"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />}
                                    </button>
                                    <a
                                        href={targetUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                        title="Test URL"
                                    >
                                        <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    </a>
                                </div>
                            </div>

                            {/* Short Code */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Short Code
                                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(for manual entry fallback)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shortCode}
                                        onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                                        className="w-32 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm font-mono uppercase focus:border-[var(--color-accent-primary)] focus:outline-none tracking-wider"
                                        maxLength={8}
                                        placeholder="ABC123"
                                    />
                                    <button
                                        onClick={handleGenerateNewShortCode}
                                        className="px-3 py-2 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                                    >
                                        Generate New
                                    </button>
                                </div>
                            </div>

                            {/* Best Practices */}
                            <div className="bg-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/20 rounded-lg p-3">
                                <h4 className="text-xs font-medium text-[var(--color-accent-primary)] mb-2">💡 Signage Tips</h4>
                                <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                                    <li>• Print at least 1.5" × 1.5" for easy scanning</li>
                                    <li>• Place at eye level, 3-4 feet from exhibit</li>
                                    <li>• Include short code "{shortCode}" as backup</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                    >
                        <Download className="w-4 h-4" />
                        Download QR
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
