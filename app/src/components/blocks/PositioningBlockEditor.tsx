import { useState, useEffect } from 'react';
import { QrCode, RefreshCw, Copy, Check, ExternalLink } from 'lucide-react';
import type { PositioningBlockData, PositioningMethod, QRCodeConfig } from '../../types';

interface PositioningBlockEditorProps {
    data: PositioningBlockData;
    stopId: string;
    tourId: string;
    language: string;
    onChange: (data: PositioningBlockData) => void;
}

// Generate QR code URL via public API
function generateQRCodeUrl(content: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(content)}`;
}

// Generate a short code
function generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function PositioningBlockEditor({ data, stopId, tourId, language, onChange }: PositioningBlockEditorProps) {
    const [copied, setCopied] = useState(false);

    // Get current config as QR code config (default if not set)
    const qrConfig = (data.config as QRCodeConfig) || {
        method: 'qr_code' as const,
        url: '',
        shortCode: generateShortCode(),
    };

    // Default URL if not set
    const defaultBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tourstack.app';
    const defaultUrl = `${defaultBaseUrl}/visitor/tour/${tourId}/stop/${stopId}`;

    const currentUrl = qrConfig.url || defaultUrl;
    const currentShortCode = qrConfig.shortCode || generateShortCode();

    // Generate QR code on mount if not already set
    useEffect(() => {
        if (!data.qrCodeDataUrl && currentUrl) {
            onChange({
                ...data,
                config: {
                    method: 'qr_code',
                    url: currentUrl,
                    shortCode: currentShortCode,
                },
                qrCodeDataUrl: generateQRCodeUrl(currentUrl),
            });
        }
    }, []);

    function handleUrlChange(url: string) {
        onChange({
            ...data,
            config: {
                method: 'qr_code',
                url,
                shortCode: currentShortCode,
            },
            qrCodeDataUrl: generateQRCodeUrl(url),
        });
    }

    function handleShortCodeChange(shortCode: string) {
        onChange({
            ...data,
            config: {
                method: 'qr_code',
                url: currentUrl,
                shortCode,
            },
        });
    }

    function handleRegenerateQR() {
        onChange({
            ...data,
            qrCodeDataUrl: generateQRCodeUrl(currentUrl),
        });
    }

    function handleGenerateNewShortCode() {
        const newCode = generateShortCode();
        handleShortCodeChange(newCode);
    }

    function handleCopyUrl() {
        navigator.clipboard.writeText(currentUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleInstructionsChange(value: string) {
        onChange({
            ...data,
            instructions: { ...data.instructions, [language]: value },
        });
    }

    function handleMethodChange(method: PositioningMethod) {
        onChange({
            ...data,
            method,
            config: method === 'qr_code'
                ? { method: 'qr_code', url: currentUrl, shortCode: currentShortCode }
                : data.config,
        });
    }

    return (
        <div className="space-y-5">
            {/* Method Selector */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Positioning Method
                </label>
                <div className="flex flex-wrap gap-2">
                    {(['qr_code', 'gps', 'ble_beacon', 'nfc'] as PositioningMethod[]).map((method) => (
                        <button
                            key={method}
                            type="button"
                            onClick={() => handleMethodChange(method)}
                            className={`px-3 py-2 rounded-lg border transition-colors text-sm ${data.method === method
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            {method.replace('_', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {data.method === 'qr_code' && (
                <>
                    {/* QR Code Preview */}
                    <div className="flex gap-6">
                        <div className="shrink-0">
                            <div className="bg-white p-3 rounded-lg shadow-lg">
                                {data.qrCodeDataUrl ? (
                                    <img src={data.qrCodeDataUrl} alt="QR Code" className="w-32 h-32" />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center bg-gray-100 rounded">
                                        <QrCode className="w-12 h-12 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={handleRegenerateQR}
                                className="mt-2 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                            </button>
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Target URL */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Target URL
                                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(scanned visitors go here)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={currentUrl}
                                        onChange={(e) => handleUrlChange(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm focus:border-[var(--color-accent-primary)] focus:outline-none"
                                        placeholder="https://..."
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCopyUrl}
                                        className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                        title="Copy URL"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />}
                                    </button>
                                    <a
                                        href={currentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    </a>
                                </div>
                            </div>

                            {/* Short Code */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Short Code
                                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(for manual entry)</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={currentShortCode}
                                        onChange={(e) => handleShortCodeChange(e.target.value.toUpperCase())}
                                        className="w-32 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm font-mono uppercase focus:border-[var(--color-accent-primary)] focus:outline-none"
                                        maxLength={8}
                                        placeholder="ABC123"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateNewShortCode}
                                        className="px-3 py-2 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                                    >
                                        Generate New
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visitor Instructions */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Scanning Instructions ({language.toUpperCase()})
                            <span className="text-xs text-[var(--color-text-muted)] ml-1">Optional</span>
                        </label>
                        <textarea
                            value={data.instructions?.[language] || data.instructions?.en || ''}
                            onChange={(e) => handleInstructionsChange(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm focus:border-[var(--color-accent-primary)] focus:outline-none resize-none"
                            placeholder="Scan this QR code with your phone's camera to learn more..."
                        />
                    </div>

                    {/* Usage Tips */}
                    <div className="bg-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/20 rounded-lg p-3">
                        <h4 className="text-xs font-medium text-[var(--color-accent-primary)] mb-2">💡 Best Practices</h4>
                        <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                            <li>• Print QR codes at least 1.5" × 1.5" for easy scanning</li>
                            <li>• Place at eye level, 3-4 feet from the exhibit</li>
                            <li>• Include the short code as a backup for manual entry</li>
                            <li>• Test the QR code with multiple devices before deploying</li>
                        </ul>
                    </div>
                </>
            )}

            {data.method === 'gps' && (
                <div className="text-sm text-[var(--color-text-muted)] p-4 bg-[var(--color-bg-elevated)] rounded-lg">
                    GPS positioning configuration coming soon. This will allow you to trigger stops based on visitor location.
                </div>
            )}

            {data.method === 'ble_beacon' && (
                <div className="text-sm text-[var(--color-text-muted)] p-4 bg-[var(--color-bg-elevated)] rounded-lg">
                    BLE Beacon configuration coming soon. Configure iBeacon/Eddystone UUIDs for proximity triggers.
                </div>
            )}

            {data.method === 'nfc' && (
                <div className="text-sm text-[var(--color-text-muted)] p-4 bg-[var(--color-bg-elevated)] rounded-lg">
                    NFC tag configuration coming soon. Assign tag IDs for tap-to-view functionality.
                </div>
            )}
        </div>
    );
}
