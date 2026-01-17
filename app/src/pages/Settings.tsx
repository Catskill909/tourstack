import { useState } from 'react';
import type { MapAPISettings } from '../types';

// Icons
const MapIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
);

const KeyIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const GlobeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
);

const CogIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EyeOffIcon = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

type TabId = 'maps' | 'positioning' | 'general';

interface Tab {
    id: TabId;
    label: string;
    icon: React.ReactNode;
}

const tabs: Tab[] = [
    { id: 'maps', label: 'Maps & Location', icon: <MapIcon /> },
    { id: 'positioning', label: 'Positioning APIs', icon: <KeyIcon /> },
    { id: 'general', label: 'General', icon: <CogIcon /> },
];

export function Settings() {
    const [activeTab, setActiveTab] = useState<TabId>('maps');
    const [saved, setSaved] = useState(false);

    // Map Settings State
    const [mapSettings, setMapSettings] = useState<MapAPISettings>({
        googleMapsApiKey: '',
        googleMapsEnabled: false,
        openStreetMapEnabled: true,
        defaultMapProvider: 'openstreetmap',
    });

    // Show/hide API keys
    const [showGoogleKey, setShowGoogleKey] = useState(false);

    // Positioning API Keys
    const [estimoteKey, setEstimoteKey] = useState('');
    const [kontaktKey, setKontaktKey] = useState('');
    const [showEstimoteKey, setShowEstimoteKey] = useState(false);
    const [showKontaktKey, setShowKontaktKey] = useState(false);

    // General Settings
    const [defaultLanguage, setDefaultLanguage] = useState('en');
    const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

    const handleSave = () => {
        // TODO: Save to database/localStorage
        console.log('Saving settings:', { mapSettings, estimoteKey, kontaktKey, defaultLanguage, analyticsEnabled });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">Settings</h1>
                <p className="text-[var(--color-text-secondary)]">
                    Configure API keys and app preferences
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-[var(--color-bg-surface)] p-1 rounded-xl w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all
              ${activeTab === tab.id
                                ? 'bg-[var(--color-accent-primary)] text-black shadow-lg'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                            }
            `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-[var(--color-bg-surface)] rounded-2xl p-6 border border-[var(--color-border-default)]">

                {/* Maps Tab */}
                {activeTab === 'maps' && (
                    <div className="space-y-6">
                        <div className="border-b border-[var(--color-border-default)] pb-4 mb-6">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                <MapIcon />
                                Maps & Location Services
                            </h2>
                            <p className="text-[var(--color-text-muted)] mt-1">
                                Configure map providers for GPS-based tour positioning
                            </p>
                        </div>

                        {/* OpenStreetMap Section */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                                        <GlobeIcon />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)]">OpenStreetMap</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">Free, open-source maps • No API key required</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mapSettings.openStreetMapEnabled}
                                        onChange={(e) => setMapSettings({ ...mapSettings, openStreetMapEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--color-bg-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent-primary)]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-secondary)]"></div>
                                </label>
                            </div>
                            {mapSettings.openStreetMapEnabled && (
                                <div className="mt-4 p-3 bg-[var(--color-success)]/10 rounded-lg border border-[var(--color-success)]/20">
                                    <p className="text-sm text-[var(--color-success)] flex items-center gap-2">
                                        <CheckIcon />
                                        OpenStreetMap is ready to use — no configuration needed!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Google Maps Section */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-red-500 rounded-xl flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)]">Google Maps</h3>
                                        <p className="text-sm text-[var(--color-text-muted)]">Premium maps • Requires API key</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={mapSettings.googleMapsEnabled}
                                        onChange={(e) => setMapSettings({ ...mapSettings, googleMapsEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--color-bg-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent-primary)]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                                </label>
                            </div>

                            {mapSettings.googleMapsEnabled && (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                            Google Maps API Key
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showGoogleKey ? 'text' : 'password'}
                                                value={mapSettings.googleMapsApiKey}
                                                onChange={(e) => setMapSettings({ ...mapSettings, googleMapsApiKey: e.target.value })}
                                                placeholder="AIzaSy..."
                                                className="w-full px-4 py-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all pr-12"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowGoogleKey(!showGoogleKey)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                            >
                                                {showGoogleKey ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                            Get your API key from the{' '}
                                            <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent-primary)] hover:underline">
                                                Google Cloud Console
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Default Map Provider */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Default Map Provider</h3>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setMapSettings({ ...mapSettings, defaultMapProvider: 'openstreetmap' })}
                                    disabled={!mapSettings.openStreetMapEnabled}
                                    className={`
                    flex-1 p-4 rounded-xl border-2 transition-all
                    ${mapSettings.defaultMapProvider === 'openstreetmap'
                                            ? 'border-[var(--color-accent-secondary)] bg-[var(--color-accent-secondary)]/10'
                                            : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                                        }
                    ${!mapSettings.openStreetMapEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mapSettings.defaultMapProvider === 'openstreetmap' ? 'border-[var(--color-accent-secondary)]' : 'border-[var(--color-text-muted)]'}`}>
                                            {mapSettings.defaultMapProvider === 'openstreetmap' && <div className="w-2 h-2 rounded-full bg-[var(--color-accent-secondary)]" />}
                                        </div>
                                        <span className="font-medium text-[var(--color-text-primary)]">OpenStreetMap</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setMapSettings({ ...mapSettings, defaultMapProvider: 'google' })}
                                    disabled={!mapSettings.googleMapsEnabled || !mapSettings.googleMapsApiKey}
                                    className={`
                    flex-1 p-4 rounded-xl border-2 transition-all
                    ${mapSettings.defaultMapProvider === 'google'
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                            : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                                        }
                    ${(!mapSettings.googleMapsEnabled || !mapSettings.googleMapsApiKey) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${mapSettings.defaultMapProvider === 'google' ? 'border-[var(--color-accent-primary)]' : 'border-[var(--color-text-muted)]'}`}>
                                            {mapSettings.defaultMapProvider === 'google' && <div className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)]" />}
                                        </div>
                                        <span className="font-medium text-[var(--color-text-primary)]">Google Maps</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Positioning APIs Tab */}
                {activeTab === 'positioning' && (
                    <div className="space-y-6">
                        <div className="border-b border-[var(--color-border-default)] pb-4 mb-6">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                <KeyIcon />
                                Positioning Provider APIs
                            </h2>
                            <p className="text-[var(--color-text-muted)] mt-1">
                                Optional: Connect to beacon management platforms for advanced BLE positioning
                            </p>
                        </div>

                        {/* Estimote */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                    E
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)]">Estimote Cloud</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">Manage Estimote beacons and analytics</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Estimote App Token
                                </label>
                                <div className="relative">
                                    <input
                                        type={showEstimoteKey ? 'text' : 'password'}
                                        value={estimoteKey}
                                        onChange={(e) => setEstimoteKey(e.target.value)}
                                        placeholder="Enter your Estimote app token..."
                                        className="w-full px-4 py-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEstimoteKey(!showEstimoteKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                    >
                                        {showEstimoteKey ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Kontakt.io */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold">
                                    K
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)]">Kontakt.io</h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">Enterprise beacon management platform</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    Kontakt.io API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showKontaktKey ? 'text' : 'password'}
                                        value={kontaktKey}
                                        onChange={(e) => setKontaktKey(e.target.value)}
                                        placeholder="Enter your Kontakt.io API key..."
                                        className="w-full px-4 py-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKontaktKey(!showKontaktKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                    >
                                        {showKontaktKey ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--color-info)]/10 rounded-lg border border-[var(--color-info)]/20">
                            <p className="text-sm text-[var(--color-info)]">
                                💡 <strong>Tip:</strong> These APIs are optional. You can manually configure beacons without connecting to these platforms.
                            </p>
                        </div>
                    </div>
                )}

                {/* General Tab */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div className="border-b border-[var(--color-border-default)] pb-4 mb-6">
                            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                                <CogIcon />
                                General Settings
                            </h2>
                            <p className="text-[var(--color-text-muted)] mt-1">
                                Configure default language and other preferences
                            </p>
                        </div>

                        {/* Default Language */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-3">Default Language</h3>
                            <select
                                value={defaultLanguage}
                                onChange={(e) => setDefaultLanguage(e.target.value)}
                                className="w-full md:w-64 px-4 py-3 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="it">Italiano</option>
                                <option value="pt">Português</option>
                                <option value="zh">中文</option>
                                <option value="ja">日本語</option>
                                <option value="ko">한국어</option>
                            </select>
                            <p className="text-xs text-[var(--color-text-muted)] mt-2">
                                Default language for new tours. Additional languages can be added per tour.
                            </p>
                        </div>

                        {/* Analytics Toggle */}
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-[var(--color-text-primary)]">Usage Analytics</h3>
                                    <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                        Collect anonymized usage data to help improve TourStack
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={analyticsEnabled}
                                        onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-[var(--color-bg-hover)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-accent-primary)]/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-accent-primary)]"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="mt-6 flex items-center justify-end gap-4">
                {saved && (
                    <span className="text-[var(--color-success)] flex items-center gap-2 animate-pulse">
                        <CheckIcon /> Settings saved
                    </span>
                )}
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] text-black font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-xl glow-primary"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
}
