import { useState, useEffect } from 'react';
import { X, Monitor, Play, Globe, MapPin, Maximize, Navigation, RotateCcw, Lock } from 'lucide-react';
import type { Tour, Stop, KioskSettings } from '../types';

interface KioskLauncherModalProps {
    isOpen: boolean;
    tour: Tour;
    stops: Stop[];
    onClose: () => void;
}

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

// Default kiosk settings
const DEFAULT_KIOSK_SETTINGS: KioskSettings = {
    fullscreen: true,
    hideNav: false,
    autoRestart: true,
    lockToTour: false,
    idleTimeoutMinutes: 5,
    staffPinEnabled: false,
};

export function KioskLauncherModal({ isOpen, tour, stops, onClose }: KioskLauncherModalProps) {
    // Selected options
    const [language, setLanguage] = useState(tour.primaryLanguage || 'en');
    const [startStopId, setStartStopId] = useState<string>('');
    const [settings, setSettings] = useState<KioskSettings>(DEFAULT_KIOSK_SETTINGS);

    // Sort stops by order
    const sortedStops = [...stops].sort((a, b) => a.order - b.order);

    // Initialize start stop to first stop
    useEffect(() => {
        if (sortedStops.length > 0 && !startStopId) {
            setStartStopId(sortedStops[0].id);
        }
    }, [sortedStops, startStopId]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    function getStopTitle(stop: Stop): string {
        const title = typeof stop.title === 'object'
            ? stop.title[language] || stop.title['en'] || Object.values(stop.title)[0]
            : stop.title;
        return title || 'Untitled Stop';
    }

    function handleLaunch() {
        if (!startStopId) return;

        // Build URL with kiosk parameters
        const params = new URLSearchParams();
        params.set('lang', language);

        if (settings.fullscreen) params.set('fullscreen', 'true');
        if (settings.hideNav) params.set('hideNav', 'true');
        if (settings.autoRestart) params.set('autoRestart', 'true');
        if (settings.lockToTour) params.set('kiosk', 'true');

        const visitorUrl = `/visitor/tour/${tour.id}/stop/${startStopId}?${params.toString()}`;

        // Open in new tab
        window.open(visitorUrl, '_blank');
        onClose();
    }

    function updateSetting<K extends keyof KioskSettings>(key: K, value: KioskSettings[K]) {
        setSettings(prev => ({ ...prev, [key]: value }));
    }

    if (!isOpen) return null;

    const tourTitle = typeof tour.title === 'object'
        ? tour.title[tour.primaryLanguage] || tour.title.en || 'Untitled Tour'
        : tour.title;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Launch Kiosk Mode
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Configure display settings
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                    {/* Tour Info (Read-only) */}
                    <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Tour</p>
                        <p className="font-medium text-[var(--color-text-primary)]">{tourTitle}</p>
                        <p className="text-sm text-[var(--color-text-muted)] mt-1">
                            {sortedStops.length} stops • {tour.languages?.length || 1} languages
                        </p>
                    </div>

                    {/* Language Selection */}
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

                    {/* Start Stop Selection */}
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

                    {/* Kiosk Options */}
                    <div className="pt-2">
                        <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3 flex items-center gap-2">
                            <Monitor className="w-4 h-4" />
                            Kiosk Options
                        </h3>
                        <div className="space-y-3">
                            {/* Fullscreen */}
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={settings.fullscreen}
                                    onChange={(e) => updateSetting('fullscreen', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                />
                                <Maximize className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Full-screen mode</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Request browser fullscreen on launch</p>
                                </div>
                            </label>

                            {/* Hide Navigation */}
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={settings.hideNav}
                                    onChange={(e) => updateSetting('hideNav', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                />
                                <Navigation className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Hide navigation controls</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Remove prev/next buttons for linear tours</p>
                                </div>
                            </label>

                            {/* Auto-restart */}
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={settings.autoRestart}
                                    onChange={(e) => updateSetting('autoRestart', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                />
                                <RotateCcw className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Auto-restart when complete</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Return to first stop when tour ends</p>
                                </div>
                            </label>

                            {/* Lock to Tour */}
                            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] cursor-pointer hover:border-[var(--color-border-hover)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={settings.lockToTour}
                                    onChange={(e) => updateSetting('lockToTour', e.target.checked)}
                                    className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                />
                                <Lock className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">Lock to this tour</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Kiosk mode - prevent browsing other content</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* URL Preview */}
                    <div className="p-3 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-default)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Launch URL Preview</p>
                        <code className="text-xs text-[var(--color-text-secondary)] break-all">
                            /visitor/tour/{tour.id}/stop/{startStopId || '...'}
                            ?lang={language}
                            {settings.fullscreen && '&fullscreen=true'}
                            {settings.hideNav && '&hideNav=true'}
                            {settings.autoRestart && '&autoRestart=true'}
                            {settings.lockToTour && '&kiosk=true'}
                        </code>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleLaunch}
                        disabled={!startStopId || sortedStops.length === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Play className="w-4 h-4" />
                        Launch Kiosk
                    </button>
                </div>
            </div>
        </div>
    );
}
