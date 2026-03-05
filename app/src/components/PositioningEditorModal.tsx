import { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
    X, QrCode, RefreshCw, Copy, Check, ExternalLink, Download,
    MapPin, Radio, Smartphone, Scan, Wifi, Target, Clock, HelpCircle,
    Nfc, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import type { Stop, PositioningConfig, QRCodeConfig, PositioningMethod } from '../types';

interface PositioningEditorModalProps {
    stop: Stop;
    tourId: string;
    tourSlug?: string;  // URL-friendly tour identifier
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
        id: 'nfc',
        label: 'NFC',
        icon: Smartphone,
        implemented: true,
        description: 'Tap-to-trigger with near-field communication',
        useCases: ['Artifact labels', "Kids' zones", 'Accessibility stations']
    },
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


export function PositioningEditorModal({ stop, tourId, tourSlug, onSave, onClose }: PositioningEditorModalProps) {
    const [activeTab, setActiveTab] = useState<PositioningMethod>('nfc');
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

    // Use slugs for cleaner URLs, fall back to IDs
    const tourIdentifier = tourSlug || tourId;
    const stopIdentifier = stop.slug || stop.id;
    
    // Canonical visitor URL for this stop - this is what NFC tags should point to
    const visitorUrl = `${defaultBaseUrl}/visitor/tour/${tourIdentifier}/stop/${stopIdentifier}`;
    
    // NFC URL is just the visitor URL (optionally with source tracking)
    const nfcUrl = `${visitorUrl}?src=nfc`;
    
    // Extract existing token from saved URL or generate new one (for QR tracking)
    const getInitialUrl = () => {
        if (qrConfig.url) return qrConfig.url;
        return `${visitorUrl}?t=${generateToken()}`;
    };

    const [targetUrl, setTargetUrl] = useState(getInitialUrl);
    const [shortCode, setShortCode] = useState(qrConfig.shortCode || generateShortCode());
    
    // NFC-specific state
    const [nfcCopied, setNfcCopied] = useState(false);
    const [nfcTagType, setNfcTagType] = useState<'NTAG213' | 'NTAG215' | 'NTAG216'>('NTAG213');
    const [nfcTagId, setNfcTagId] = useState('');
    const [showNfcHelp, setShowNfcHelp] = useState(false);
    const [nfcWriteStatus, setNfcWriteStatus] = useState<'idle' | 'waiting' | 'writing' | 'success' | 'error'>('idle');
    const [nfcWriteError, setNfcWriteError] = useState<string | null>(null);
    
    // Check if Web NFC is available (Chrome Android only)
    const hasWebNfc = typeof window !== 'undefined' && 'NDEFReader' in window;
    
    function handleCopyNfcUrl() {
        navigator.clipboard.writeText(nfcUrl);
        setNfcCopied(true);
        setTimeout(() => setNfcCopied(false), 2000);
    }
    
    // Web NFC Write function
    async function handleWriteNfcTag() {
        if (!hasWebNfc) {
            setNfcWriteError('Web NFC not supported. Use Chrome on Android, or copy the URL and use NFC Tools app.');
            return;
        }
        
        setNfcWriteStatus('waiting');
        setNfcWriteError(null);
        
        try {
            // @ts-ignore - NDEFReader is not in TypeScript types yet
            const ndef = new window.NDEFReader();
            
            setNfcWriteStatus('writing');
            
            await ndef.write({
                records: [{ recordType: 'url', data: nfcUrl }]
            });
            
            
            setNfcWriteStatus('success');
            setTimeout(() => setNfcWriteStatus('idle'), 3000);
        } catch (error: any) {
            setNfcWriteStatus('error');
            setNfcWriteError(error.message || 'Failed to write to NFC tag');
        }
    }

    // Regenerate creates a COMPLETELY NEW QR code with new token + short code
    const handleRegenerate = useCallback(() => {
        setIsRegenerating(true);

        // Generate new short code
        const newShortCode = generateShortCode();
        setShortCode(newShortCode);

        // Generate new URL with fresh token - THIS changes the QR code!
        const newToken = generateToken();
        const newUrl = `${defaultBaseUrl}/visitor/tour/${tourIdentifier}/stop/${stopIdentifier}?t=${newToken}`;
        setTargetUrl(newUrl);

        // Visual feedback
        setTimeout(() => setIsRegenerating(false), 500);
    }, [defaultBaseUrl, tourIdentifier, stopIdentifier]);

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

        // NFC tab - fully implemented
        if (activeTab === 'nfc') {
            return (
                <div className="p-6">
                    {/* NFC Help Modal */}
                    {showNfcHelp && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-lg shadow-2xl">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-default)]">
                                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                                        <Nfc className="w-5 h-5 text-[var(--color-accent-primary)]" />
                                        NFC Pairing Guide
                                    </h3>
                                    <button onClick={() => setShowNfcHelp(false)} className="p-1 hover:bg-[var(--color-bg-hover)] rounded">
                                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                                    </button>
                                </div>
                                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
                                    {/* Method 1: Web NFC */}
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs">1</span>
                                            Direct Write (Chrome Android)
                                        </h4>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-2">
                                            If you're using <strong>Chrome on an Android phone</strong>, you can write directly to NFC tags from this page:
                                        </p>
                                        <ol className="text-xs text-[var(--color-text-muted)] space-y-1 ml-4">
                                            <li>1. Click the <strong>"Write to NFC Tag"</strong> button</li>
                                            <li>2. Hold your NFC tag to the back of your phone</li>
                                            <li>3. Wait for the success confirmation</li>
                                        </ol>
                                        <p className="text-xs text-amber-400 mt-2">
                                            ⚠️ Only works on Chrome for Android. Not supported on iPhone, desktop, or other browsers.
                                        </p>
                                    </div>
                                    
                                    {/* Method 2: NFC Tools App */}
                                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">2</span>
                                            NFC Tools App (Any Phone)
                                        </h4>
                                        <p className="text-xs text-[var(--color-text-muted)] mb-2">
                                            Works on <strong>iPhone and Android</strong>:
                                        </p>
                                        <ol className="text-xs text-[var(--color-text-muted)] space-y-1 ml-4">
                                            <li>1. Download <strong>NFC Tools</strong> (free on App Store / Play Store)</li>
                                            <li>2. Click <strong>"Copy URL"</strong> in TourStack</li>
                                            <li>3. In NFC Tools: <strong>Write → Add a record → URL/URI</strong></li>
                                            <li>4. Paste the URL and tap <strong>Write</strong></li>
                                            <li>5. Hold your NFC tag to your phone</li>
                                        </ol>
                                    </div>
                                    
                                    {/* Testing */}
                                    <div className="bg-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/20 rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-[var(--color-accent-primary)] mb-2">🧪 Testing Your Tag</h4>
                                        <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                                            <li><strong>iPhone XS+:</strong> Tap tag → notification banner → tap to open</li>
                                            <li><strong>Android:</strong> Tap tag → browser opens automatically</li>
                                            <li><strong>iPhone 7/8/X:</strong> Open NFC reader app first, then tap</li>
                                        </ul>
                                    </div>
                                    
                                    {/* Tag Types */}
                                    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
                                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">📋 Tag Types</h4>
                                        <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                                            <li><strong>NTAG213:</strong> Most common, 144 bytes (~132 char URLs)</li>
                                            <li><strong>NTAG215:</strong> Larger, 504 bytes (~480 char URLs)</li>
                                            <li><strong>NTAG216:</strong> Largest, 888 bytes (vCards, complex data)</li>
                                        </ul>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                            TourStack URLs are short — NTAG213 works perfectly.
                                        </p>
                                    </div>
                                </div>
                                <div className="px-5 py-4 border-t border-[var(--color-border-default)] flex justify-end">
                                    <button
                                        onClick={() => setShowNfcHelp(false)}
                                        className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                                    >
                                        Got it
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-5">
                        {/* Header with Help Button */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Pair NFC Tag to This Stop</h3>
                                <p className="text-xs text-[var(--color-text-muted)]">Write the tour stop URL to your NFC card or sticker</p>
                            </div>
                            <button
                                onClick={() => setShowNfcHelp(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                How to Pair
                            </button>
                        </div>
                        
                        {/* Method 1: Direct NFC Write (always shown, grayed out if unavailable) */}
                        <div className={`bg-[var(--color-bg-elevated)] border rounded-xl p-5 ${hasWebNfc ? 'border-green-500/30' : 'border-[var(--color-border-default)] opacity-60'}`}>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasWebNfc ? 'bg-green-500/10' : 'bg-[var(--color-bg-base)]'}`}>
                                        <Nfc className={`w-6 h-6 ${hasWebNfc ? 'text-green-400' : 'text-[var(--color-text-muted)]'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Direct NFC Write</h4>
                                            {hasWebNfc ? (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded">Available</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">Chrome Android Only</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {hasWebNfc ? 'Write URL directly to your NFC tag' : 'Open this page in Chrome on Android to enable'}
                                        </p>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={handleWriteNfcTag}
                                    disabled={!hasWebNfc || nfcWriteStatus === 'waiting' || nfcWriteStatus === 'writing'}
                                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors ${
                                        !hasWebNfc
                                            ? 'bg-[var(--color-bg-base)] text-[var(--color-text-muted)] border border-[var(--color-border-default)] cursor-not-allowed'
                                            : nfcWriteStatus === 'success' 
                                            ? 'bg-green-500 text-white' 
                                            : nfcWriteStatus === 'error'
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary)]/90'
                                    } disabled:opacity-50`}
                                >
                                    {!hasWebNfc ? (
                                        <><Nfc className="w-5 h-5" /> Write to NFC Tag</>
                                    ) : nfcWriteStatus === 'idle' ? (
                                        <><Nfc className="w-5 h-5" /> Write to NFC Tag</>
                                    ) : nfcWriteStatus === 'waiting' ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Hold tag to phone...</>
                                    ) : nfcWriteStatus === 'writing' ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Writing...</>
                                    ) : nfcWriteStatus === 'success' ? (
                                        <><CheckCircle2 className="w-5 h-5" /> Tag Written Successfully!</>
                                    ) : (
                                        <><AlertCircle className="w-5 h-5" /> Write Failed</>
                                    )}
                                </button>
                                
                                {nfcWriteError && (
                                    <p className="text-xs text-red-400 text-center">{nfcWriteError}</p>
                                )}
                                
                                {!hasWebNfc && (
                                    <p className="text-xs text-[var(--color-text-muted)] text-center">
                                        Web NFC requires <strong>Chrome on Android</strong>. Not available on iPhone, desktop, or other browsers.
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* Method 2: Copy URL (always available) */}
                        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl p-5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Copy className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">Copy URL for NFC Tools App</h4>
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded">Any Phone</span>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)]">Works on iPhone and Android with free NFC Tools app</p>
                                    </div>
                                </div>
                                
                                <div className="bg-[var(--color-bg-base)] rounded-lg p-3 font-mono text-xs text-[var(--color-text-secondary)] break-all">
                                    {nfcUrl}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopyNfcUrl}
                                        className="flex-1 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 flex items-center justify-center gap-2 font-medium"
                                    >
                                        {nfcCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {nfcCopied ? 'Copied!' : 'Copy URL'}
                                    </button>
                                    <a
                                        href={nfcUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2.5 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Test
                                    </a>
                                </div>
                            </div>
                        </div>
                        
                        
                        {/* Tag Info (collapsible details) */}
                        <details className="group">
                            <summary className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                                <span className="text-xs">▶</span>
                                <span className="group-open:hidden">Show tag details</span>
                                <span className="hidden group-open:inline">Hide tag details</span>
                            </summary>
                            <div className="mt-3 space-y-3 pl-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Tag Type</label>
                                        <select
                                            value={nfcTagType}
                                            onChange={(e) => setNfcTagType(e.target.value as 'NTAG213' | 'NTAG215' | 'NTAG216')}
                                            className="w-full px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] text-xs"
                                        >
                                            <option value="NTAG213">NTAG213</option>
                                            <option value="NTAG215">NTAG215</option>
                                            <option value="NTAG216">NTAG216</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Tag ID (optional)</label>
                                        <input
                                            type="text"
                                            value={nfcTagId}
                                            onChange={(e) => setNfcTagId(e.target.value.toUpperCase())}
                                            placeholder="Auto-filled on write"
                                            className="w-full px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] text-xs font-mono"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1">Short Code (fallback)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={shortCode}
                                            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                                            className="w-24 px-2 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded text-[var(--color-text-primary)] text-xs font-mono uppercase"
                                            maxLength={8}
                                        />
                                        <button
                                            onClick={handleGenerateNewShortCode}
                                            className="px-2 py-1.5 text-xs bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded hover:bg-[var(--color-bg-hover)]"
                                        >
                                            New
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </details>
                        
                        {/* Quick tip */}
                        <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <span className="text-amber-400 text-sm">💡</span>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                <strong className="text-amber-400">Tip:</strong> After programming, test by tapping the tag with your phone. The tour stop should open automatically.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

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
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive
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

                {/* Tab Content - scrollable */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {renderTabContent()}
                </div>

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
                    ) : activeTab === 'nfc' ? (
                        <a
                            href="https://apps.apple.com/app/nfc-tools/id1252962749"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Get NFC Tools App
                        </a>
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
                            disabled={activeTab !== 'qr_code' && activeTab !== 'nfc'}
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
