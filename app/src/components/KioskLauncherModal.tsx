import { useState, useEffect } from 'react';
import {
    X, Monitor, Play, Globe, MapPin, Maximize, Navigation, RotateCcw,
    Lock, MessageCircle, Tablet, Download, Loader2, Package, ChevronRight,
    Wifi, WifiOff, CheckCircle2
} from 'lucide-react';
import type { Tour, Stop, KioskSettings } from '../types';

interface KioskLauncherModalProps {
    isOpen: boolean;
    tour: Tour;
    stops: Stop[];
    onClose: () => void;
}

type LaunchMode = 'kiosk' | 'handoff' | 'export';

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    ja: '日本語',
    ko: '한국어',
    zh: '中文',
};

const LANGUAGE_FLAGS: Record<string, string> = {
    en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
    pt: '🇵🇹', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳', ar: '🇸🇦',
    ru: '🇷🇺', hi: '🇮🇳',
};

// Default kiosk settings
const DEFAULT_KIOSK_SETTINGS: KioskSettings = {
    fullscreen: true,
    hideNav: false,
    autoRestart: true,
    lockToTour: false,
    showChatbot: true,
    idleTimeoutMinutes: 5,
    staffPinEnabled: false,
};

export function KioskLauncherModal({ isOpen, tour, stops, onClose }: KioskLauncherModalProps) {
    const [mode, setMode] = useState<LaunchMode>('kiosk');
    const [language, setLanguage] = useState(tour.primaryLanguage || 'en');
    const [startStopId, setStartStopId] = useState<string>('');
    const [settings, setSettings] = useState<KioskSettings>(DEFAULT_KIOSK_SETTINGS);
    const [isExporting, setIsExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);

    const sortedStops = [...stops].sort((a, b) => a.order - b.order);

    useEffect(() => {
        if (sortedStops.length > 0 && !startStopId) {
            setStartStopId(sortedStops[0].id);
        }
    }, [sortedStops, startStopId]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset export state when switching modes
    useEffect(() => {
        setExportDone(false);
    }, [mode]);

    function getStopTitle(stop: Stop): string {
        const title = typeof stop.title === 'object'
            ? stop.title[language] || stop.title['en'] || Object.values(stop.title)[0]
            : stop.title;
        return title || 'Untitled Stop';
    }

    function handleLaunchKiosk() {
        if (!startStopId) return;
        const params = new URLSearchParams();
        params.set('lang', language);
        if (settings.fullscreen) params.set('fullscreen', 'true');
        if (settings.hideNav) params.set('hideNav', 'true');
        if (settings.autoRestart) params.set('autoRestart', 'true');
        if (settings.lockToTour) params.set('kiosk', 'true');
        if (settings.showChatbot) params.set('showChat', 'true');
        const visitorUrl = `/visitor/tour/${tour.id}/stop/${startStopId}?${params.toString()}`;
        window.open(visitorUrl, '_blank');
        onClose();
    }

    function handleLaunchHandoff() {
        const slug = tour.slug || tour.id;
        window.open(`/kiosk/tour/${slug}`, '_blank');
        onClose();
    }

    async function handleExport() {
        setIsExporting(true);
        setExportDone(false);
        try {
            const res = await fetch(`/api/export/${tour.id}`);
            if (!res.ok) throw new Error('Export failed');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tourstack-${tour.slug || tour.id}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportDone(true);
        } catch (err) {
            console.error('Export error:', err);
            alert('Failed to export tour. Please try again.');
        }
        setIsExporting(false);
    }

    function updateSetting<K extends keyof KioskSettings>(key: K, value: KioskSettings[K]) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    if (!isOpen) return null;

    const tourTitle = typeof tour.title === 'object'
        ? tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled Tour'
        : tour.title;

    const modes: { id: LaunchMode; label: string; icon: typeof Monitor; description: string }[] = [
        { id: 'kiosk', label: 'Kiosk Mode', icon: Monitor, description: 'WiFi display with options' },
        { id: 'handoff', label: 'Staff Handoff', icon: Tablet, description: 'Pick language, hand to visitor' },
        { id: 'export', label: 'Export Offline', icon: Download, description: 'Download ZIP package' },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Device & Display
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {tourTitle}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors" aria-label="Close">
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b border-[var(--color-border-default)]">
                    {modes.map(m => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id)}
                            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative
                                ${mode === m.id
                                    ? 'text-[var(--color-accent-primary)]'
                                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                                }`}
                        >
                            <m.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{m.label}</span>
                            {mode === m.id && (
                                <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--color-accent-primary)] rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[55vh] space-y-5">

                    {/* ====== KIOSK MODE ====== */}
                    {mode === 'kiosk' && (
                        <>
                            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                                <div className="flex items-start gap-3">
                                    <Wifi className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Requires WiFi connection</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Opens the tour in a browser tab with display options. Best for wall-mounted displays, lobby kiosks, or tablets connected to WiFi.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Language */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <Globe className="w-4 h-4" />
                                    Language
                                </label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                                >
                                    {(tour.languages || ['en']).map((lang) => (
                                        <option key={lang} value={lang}>
                                            {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Stop */}
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    <MapPin className="w-4 h-4" />
                                    Start From
                                </label>
                                <select
                                    value={startStopId}
                                    onChange={(e) => setStartStopId(e.target.value)}
                                    className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                                >
                                    {sortedStops.map((stop, index) => (
                                        <option key={stop.id} value={stop.id}>
                                            {index + 1}. {getStopTitle(stop)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Options */}
                            <div className="pt-2">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                                    <Monitor className="w-4 h-4" />
                                    Options
                                </h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                        <input type="checkbox" checked={settings.fullscreen} onChange={(e) => updateSetting('fullscreen', e.target.checked)} className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                        <Maximize className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Full-screen mode</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Request browser fullscreen on launch</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                        <input type="checkbox" checked={settings.hideNav} onChange={(e) => updateSetting('hideNav', e.target.checked)} className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                        <Navigation className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Hide navigation controls</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Remove prev/next buttons for linear tours</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                        <input type="checkbox" checked={settings.autoRestart} onChange={(e) => updateSetting('autoRestart', e.target.checked)} className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                        <RotateCcw className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Auto-restart when complete</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Return to first stop when tour ends</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                        <input type="checkbox" checked={settings.lockToTour} onChange={(e) => updateSetting('lockToTour', e.target.checked)} className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                        <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Lock to this tour</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Kiosk mode - prevent browsing other content</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                        <input type="checkbox" checked={settings.showChatbot} onChange={(e) => updateSetting('showChatbot', e.target.checked)} className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]" />
                                        <MessageCircle className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">Show AI Concierge</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">Display chat assistant for visitor questions</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ====== STAFF HANDOFF ====== */}
                    {mode === 'handoff' && (
                        <>
                            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                                <div className="flex items-start gap-3">
                                    <Tablet className="w-5 h-5 text-[var(--color-accent-primary)] mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">Museum device handoff</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            Opens a staff-facing loading screen. Staff picks the language, taps "Start Tour," and hands the device to the visitor. After 5 minutes of inactivity, it resets automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* How it works */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">How it works</h3>
                                <div className="space-y-2">
                                    {[
                                        { step: '1', text: 'Staff sees the loading screen with tour info and device status' },
                                        { step: '2', text: 'Staff selects the visitor\'s language' },
                                        { step: '3', text: 'Staff taps "Start Tour" — device locks into visitor mode' },
                                        { step: '4', text: 'Visitor explores the tour in their language, fullscreen' },
                                        { step: '5', text: 'After inactivity, device auto-resets to the staff screen' },
                                    ].map(item => (
                                        <div key={item.step} className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[var(--color-accent-primary)]/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-xs font-bold text-[var(--color-accent-primary)]">{item.step}</span>
                                            </div>
                                            <p className="text-sm text-[var(--color-text-secondary)]">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Preview info */}
                            <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Tour Details</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">Stops</span>
                                        <span className="text-[var(--color-text-secondary)]">{sortedStops.length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">Languages</span>
                                        <span className="text-[var(--color-text-secondary)]">
                                            {(tour.languages || ['en']).map(l => LANGUAGE_FLAGS[l] || l).join(' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">Duration</span>
                                        <span className="text-[var(--color-text-secondary)]">{tour.duration || '—'} min</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[var(--color-text-muted)]">Auto-reset</span>
                                        <span className="text-[var(--color-text-secondary)]">5 min idle</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ====== EXPORT OFFLINE ====== */}
                    {mode === 'export' && (
                        <>
                            <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                                <div className="flex items-start gap-3">
                                    <WifiOff className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">No WiFi required</p>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            Downloads the tour as a ZIP file with all data, images, and audio. Can be loaded onto museum devices for fully offline use.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Package contents */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Package contents</h3>
                                <div className="p-4 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] font-mono text-xs text-[var(--color-text-muted)] space-y-1">
                                    <p className="text-[var(--color-text-secondary)]">tourstack-{tour.slug || tour.id}.zip</p>
                                    <p className="pl-4">manifest.json</p>
                                    <p className="pl-4">data/tour.json <span className="text-[var(--color-text-disabled)]">— all stops & content</span></p>
                                    <p className="pl-4">media/images/ <span className="text-[var(--color-text-disabled)]">— all referenced images</span></p>
                                    <p className="pl-4">media/audio/ <span className="text-[var(--color-text-disabled)]">— all narration files</span></p>
                                </div>
                            </div>

                            {/* What's included */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)]">Included in export</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {[
                                        { label: 'All languages', ok: true },
                                        { label: 'Images & galleries', ok: true },
                                        { label: 'Audio narration', ok: true },
                                        { label: 'Stop content', ok: true },
                                        { label: 'YouTube/Vimeo', ok: false },
                                        { label: 'AI Concierge', ok: false },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2">
                                            {item.ok ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-success)]" />
                                            ) : (
                                                <X className="w-3.5 h-3.5 text-[var(--color-text-disabled)]" />
                                            )}
                                            <span className={item.ok ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-disabled)]'}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {exportDone && (
                                <div className="p-3 rounded-lg bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-[var(--color-success)]" />
                                    <p className="text-sm text-[var(--color-success)]">Download started! Check your downloads folder.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>

                    {mode === 'kiosk' && (
                        <button
                            onClick={handleLaunchKiosk}
                            disabled={!startStopId || sortedStops.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play className="w-4 h-4" />
                            Launch Kiosk
                        </button>
                    )}

                    {mode === 'handoff' && (
                        <button
                            onClick={handleLaunchHandoff}
                            disabled={sortedStops.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent-primary)] text-[#1a1a1a] font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Tablet className="w-4 h-4" />
                            Open Staff Screen
                        </button>
                    )}

                    {mode === 'export' && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting || sortedStops.length === 0}
                            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#1a1a1a] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Packaging...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download ZIP
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
