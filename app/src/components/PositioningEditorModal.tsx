import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
    X, QrCode, RefreshCw, Copy, Check, ExternalLink, Download,
    MapPin, Radio, Smartphone, Scan, Wifi, Target, Clock
} from 'lucide-react';
import type { Stop, PositioningConfig, QRCodeConfig, PositioningMethod } from '../types';

interface PositioningEditorModalProps {
    stop: Stop;
    tourId: string;
    onSave: (stop: Stop) => void;
    onClose: () => void;
}

// Tab configuration
interface TabConfig {
    id: PositioningMethod;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    implemented: boolean;
    description: string;
    useCases: string[];
}

const TABS: TabConfig[] = [
    {
        id: 'qr_code',
        label: 'QR Code',
        icon: QrCode,
        implemented: true,
        description: 'Zero-cost deployment with camera scanning',
        useCases: ['Budget-friendly', 'Works on all devices', 'Easy to replace']
    },
    {
        id: 'gps',
        label: 'GPS',
        icon: MapPin,
        implemented: false,
        description: 'Outdoor positioning with geofencing',
        useCases: ['Sculpture gardens', 'Archaeological sites', 'City tours']
    },
    {
        id: 'ble_beacon',
        label: 'BLE Beacon',
        icon: Radio,
        implemented: false,
        description: 'Indoor positioning with Bluetooth beacons',
        useCases: ['Indoor navigation', 'Auto-triggering', 'High accuracy']
    },
    {
        id: 'nfc',
        label: 'NFC',
        icon: Smartphone,
        implemented: false,
        description: 'Tap-to-trigger with near-field communication',
        useCases: ['Artifact labels', "Kids' zones", 'Accessibility stations']
    },
    {
        id: 'rfid',
        label: 'RFID',
        icon: Scan,
        implemented: false,
        description: 'Medium-range radio frequency identification',
        useCases: ['Artifact tracking', 'Multi-object detection', 'High throughput']
    },
    {
        id: 'wifi',
        label: 'WiFi',
        icon: Wifi,
        implemented: false,
        description: 'Triangulation using existing WiFi infrastructure',
        useCases: ['Use existing APs', 'No new hardware', 'Zone detection']
    },
    {
        id: 'uwb',
        label: 'UWB',
        icon: Target,
        implemented: false,
        description: 'Ultra-wideband for centimeter-level precision',
        useCases: ['Premium exhibits', 'AR experiences', 'Research analytics']
    }
];

// Generate a short code
function generateShortCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Generate a unique token for QR tracking
function generateToken(): string {
    return Math.random().toString(36).substring(2, 10);
}

export function PositioningEditorModal({ stop, tourId, onSave, onClose }: PositioningEditorModalProps) {
    const [activeTab, setActiveTab] = useState<PositioningMethod>('qr_code');
    const [copied, setCopied] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    // Get current config
    const qrConfig = (stop.primaryPositioning as QRCodeConfig) || {
        method: 'qr_code' as const,
        url: '',
        shortCode: generateShortCode(),
    };

    // Default URL - includes a unique token so each QR code is different
    const defaultBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://tourstack.app';
    
    // Extract existing token from saved URL or generate new one
    const getInitialUrl = () => {
        if (qrConfig.url) return qrConfig.url;
        return `${defaultBaseUrl}/visitor/tour/${tourId}/stop/${stop.id}?t=${generateToken()}`;
    };

    const [targetUrl, setTargetUrl] = useState(getInitialUrl);
    const [shortCode, setShortCode] = useState(qrConfig.shortCode || generateShortCode());

    // Regenerate creates a COMPLETELY NEW QR code with new token + short code
    const handleRegenerate = useCallback(() => {
        setIsRegenerating(true);
        
        // Generate new short code
        const newShortCode = generateShortCode();
        setShortCode(newShortCode);
        
        // Generate new URL with fresh token - THIS changes the QR code!
        const newToken = generateToken();
        const newUrl = `${defaultBaseUrl}/visitor/tour/${tourId}/stop/${stop.id}?t=${newToken}`;
        setTargetUrl(newUrl);
        
        // Visual feedback
        setTimeout(() => setIsRegenerating(false), 500);
    }, [defaultBaseUrl, tourId, stop.id]);

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
        // Get SVG element and convert to PNG for download
        if (!qrRef.current) return;
        
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size (larger for print quality)
        const size = 500;
        canvas.width = size;
        canvas.height = size;

        // Create image from SVG
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            // White background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, size, size);
            
            // Draw QR code centered with padding
            const padding = 40;
            ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
            
            // Convert to PNG and download
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `qr-${shortCode}-${stop.id}.png`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            }, 'image/png');
            
            URL.revokeObjectURL(svgUrl);
        };
        img.src = svgUrl;
    }

    // Render tab content based on active tab
    function renderTabContent() {
        const tab = TABS.find(t => t.id === activeTab);
        
        if (!tab) return null;

        // QR Code tab - fully implemented
        if (activeTab === 'qr_code') {
            return (
                <div className="p-6">
                    <div className="flex gap-6">
                        {/* QR Code Preview */}
                        <div className="shrink-0 flex flex-col items-center">
                            <div 
                                ref={qrRef} 
                                className={`bg-white p-4 rounded-xl shadow-lg transition-opacity duration-200 ${isRegenerating ? 'opacity-50' : 'opacity-100'}`}
                            >
                                <QRCodeSVG
                                    value={targetUrl}
                                    size={160}
                                    level="M"
                                    marginSize={0}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                            <button
                                onClick={handleRegenerate}
                                disabled={isRegenerating}
                                className="mt-3 flex items-center gap-1 px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
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
            );
        }

        // Placeholder tabs for other technologies
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center mb-4">
                    <tab.icon className="w-8 h-8 text-[var(--color-accent-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    {tab.label} Positioning
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] text-center max-w-md mb-4">
                    {tab.description}
                </p>
                
                {/* Coming Soon Badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-medium text-amber-500">Coming Soon</span>
                </div>

                {/* Use Cases */}
                <div className="w-full max-w-sm">
                    <h4 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 text-center">
                        Best For:
                    </h4>
                    <div className="flex flex-wrap justify-center gap-2">
                        {tab.useCases.map((useCase, index) => (
                            <span
                                key={index}
                                className="px-2.5 py-1 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-full text-[var(--color-text-muted)]"
                            >
                                {useCase}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Technology-specific hints */}
                {activeTab === 'gps' && (
                    <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-blue-400 text-center">
                            📍 GPS positioning will use the existing Map Block component 
                            with geofence radius configuration.
                        </p>
                    </div>
                )}
                {activeTab === 'ble_beacon' && (
                    <div className="mt-6 p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-purple-400 text-center">
                            📡 Configure UUID, Major, and Minor values for iBeacon/Eddystone 
                            compatible hardware.
                        </p>
                    </div>
                )}
                {activeTab === 'nfc' && (
                    <div className="mt-6 p-4 bg-green-500/5 border border-green-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-green-400 text-center">
                            📱 NFC tags require physical tap (0-4cm range). 
                            Great for artifact labels and interactive exhibits.
                        </p>
                    </div>
                )}
                {activeTab === 'rfid' && (
                    <div className="mt-6 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-orange-400 text-center">
                            🏷️ RFID supports active (battery) and passive tags 
                            with range up to 100ft for powered systems.
                        </p>
                    </div>
                )}
                {activeTab === 'wifi' && (
                    <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-cyan-400 text-center">
                            📶 Leverage existing WiFi access points for zone-based 
                            positioning without new hardware.
                        </p>
                    </div>
                )}
                {activeTab === 'uwb' && (
                    <div className="mt-6 p-4 bg-pink-500/5 border border-pink-500/20 rounded-lg max-w-sm">
                        <p className="text-xs text-pink-400 text-center">
                            🎯 Ultra-Wideband offers ±10-50cm accuracy. 
                            Requires UWB anchors and compatible devices (iPhone 11+).
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-3xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                            {(() => {
                                const TabIcon = TABS.find(t => t.id === activeTab)?.icon || QrCode;
                                return <TabIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />;
                            })()}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Positioning Settings</h2>
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

                {/* Tab Navigation */}
                <div className="border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
                    <div className="flex overflow-x-auto px-2">
                        {TABS.map((tab) => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                        isActive
                                            ? 'border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]'
                                            : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-default)]'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                    {!tab.implemented && (
                                        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--color-bg-elevated)] rounded text-[var(--color-text-muted)]">
                                            Soon
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                {renderTabContent()}

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
                    {activeTab === 'qr_code' ? (
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                        >
                            <Download className="w-4 h-4" />
                            Download QR
                        </button>
                    ) : (
                        <div /> // Empty div to maintain flex spacing
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={activeTab !== 'qr_code'}
                            className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Also export with old name for backward compatibility
export { PositioningEditorModal as QRCodeEditorModal };
