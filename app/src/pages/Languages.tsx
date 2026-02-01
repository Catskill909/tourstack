import { useState, useEffect } from 'react';
import {
    Languages as LanguagesIcon,
    Globe,
    ArrowRightLeft,
    Copy,
    X,
    FileText,
    Loader2,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ExternalLink,
    Sparkles,
    Clock,
    Zap,
    Server,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type TabId =
    | 'libretranslate'
    | 'deepl'
    | 'google'
    | 'azure'
    | 'amazon'
    | 'argos'
    | 'opennmt'
    | 'bergamot'
    | 'marian';

interface Tab {
    id: TabId;
    name: string;
    icon: React.ElementType;
    status: 'active' | 'coming_soon';
    description: string;
    type: 'paid' | 'free';
    docUrl?: string;
    features?: string[];
    pricing?: string;
    apiUrl?: string;
}

interface Language {
    code: string;
    name: string;
}

interface TranslationHistoryItem {
    id: string;
    sourceText: string;
    sourceLang: string;
    targetLang: string;
    translatedText: string;
    timestamp: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Supported languages on our LibreTranslate server (LT_LOAD_ONLY env var)
const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
];

// Quick phrases for museum staff
const QUICK_PHRASES = [
    { category: 'Wayfinding', phrases: ['Welcome to the museum', 'Exit this way', 'Restrooms', 'Gift Shop', 'Elevator', 'Stairs'] },
    { category: 'Safety', phrases: ['Please do not touch', 'No flash photography', 'Keep a safe distance', 'No food or drinks'] },
    { category: 'Audio Guide', phrases: ['Audio guide available', 'Press play to listen', 'Scan QR code', 'Available in multiple languages'] },
    { category: 'Accessibility', phrases: ['Wheelchair accessible', 'Assistance available', 'Service animals welcome', 'Large print available'] },
];

// Tab configuration - ACTIVE services listed first
const tabs: Tab[] = [
    // === ACTIVE PROVIDERS ===
    {
        id: 'google',
        name: 'Google Cloud',
        icon: Globe,
        status: 'active',
        description: 'Google Cloud Translation API - 135+ languages',
        type: 'paid',
        docUrl: 'https://cloud.google.com/translate/docs',
        features: ['135+ Languages', 'Neural MT', 'Auto-Detect', 'Batch Translation'],
        pricing: 'Free: 500K chars/mo, then $20/million',
        apiUrl: 'translation.googleapis.com/language/translate/v2',
    },
    {
        id: 'libretranslate',
        name: 'LibreTranslate',
        icon: Globe,
        status: 'active',
        description: 'Self-hosted open source translation - 9 languages configured',
        type: 'free',
        docUrl: 'https://github.com/LibreTranslate/LibreTranslate',
        features: ['Self-Hosted', '9 Languages', 'No API Fees', 'File Translation'],
        pricing: 'Free (self-hosted)',
        apiUrl: 'translate.supersoul.top',
    },
    // === PAID CLOUD PROVIDERS (Coming Soon) ===
    {
        id: 'deepl',
        name: 'DeepL',
        icon: Sparkles,
        status: 'coming_soon',
        description: 'Industry-leading translation quality - 500K chars/month free',
        type: 'paid',
        docUrl: 'https://www.deepl.com/docs-api',
        features: ['31 Languages', 'Best Quality', 'Formality Control', 'Glossaries'],
        pricing: 'Free: 500K chars/mo, Pro: $5.49/mo',
        apiUrl: 'api-free.deepl.com/v2/translate',
    },
    {
        id: 'azure',
        name: 'Microsoft Azure',
        icon: Globe,
        status: 'coming_soon',
        description: 'Azure Translator - 100+ languages, 2M chars/month free',
        type: 'paid',
        docUrl: 'https://docs.microsoft.com/azure/cognitive-services/translator/',
        features: ['100+ Languages', 'Custom Translator', 'Document Translation', 'Batch'],
        pricing: '2M chars free/month, then $10/million',
        apiUrl: 'api.cognitive.microsofttranslator.com',
    },
    {
        id: 'amazon',
        name: 'Amazon Translate',
        icon: Globe,
        status: 'coming_soon',
        description: 'AWS Translate - Neural machine translation',
        type: 'paid',
        docUrl: 'https://docs.aws.amazon.com/translate/',
        features: ['75+ Languages', 'Neural MT', 'AWS Integration', 'Custom Terminology'],
        pricing: '2M chars free first year, then $15/million',
        apiUrl: 'translate.{region}.amazonaws.com',
    },
    // === OPEN SOURCE / SELF-HOSTED ===
    {
        id: 'argos',
        name: 'Argos Translate',
        icon: Server,
        status: 'coming_soon',
        description: 'Offline neural translation - Python library',
        type: 'free',
        docUrl: 'https://github.com/argosopentech/argos-translate',
        features: ['Offline', 'Neural Quality', 'Python API', 'Privacy-First'],
        pricing: 'Free (self-hosted)',
    },
    {
        id: 'opennmt',
        name: 'OpenNMT',
        icon: Server,
        status: 'coming_soon',
        description: 'Open-source neural machine translation toolkit',
        type: 'free',
        docUrl: 'https://opennmt.net/',
        features: ['PyTorch/TensorFlow', 'Custom Models', 'Research Grade', 'Flexible'],
        pricing: 'Free (self-hosted)',
        apiUrl: 'localhost:5000/translator/translate',
    },
    {
        id: 'bergamot',
        name: 'Bergamot',
        icon: Server,
        status: 'coming_soon',
        description: 'Client-side translation - Browser WASM',
        type: 'free',
        docUrl: 'https://github.com/browsermt/bergamot-translator',
        features: ['In-Browser', 'WebAssembly', 'Firefox Models', 'Privacy'],
        pricing: 'Free (client-side)',
    },
    {
        id: 'marian',
        name: 'Marian NMT',
        icon: Server,
        status: 'coming_soon',
        description: 'Efficient C++ neural MT - Opus-MT models',
        type: 'free',
        docUrl: 'https://marian-nmt.github.io/',
        features: ['C++ Speed', 'Opus-MT Models', 'Helsinki-NLP', 'Production Ready'],
        pricing: 'Free (self-hosted)',
    },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Languages() {
    const [activeTab, setActiveTab] = useState<TabId>('libretranslate');
    const [error, setError] = useState<string | null>(null);

    // Translation state
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('en');
    const [targetLang, setTargetLang] = useState('es');
    const [isTranslating, setIsTranslating] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Translation history (session-based)
    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);

    // Sub-tab state for LibreTranslate
    const [activeSubTab, setActiveSubTab] = useState<'text' | 'files'>('text');

    // Handle translation
    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setIsTranslating(true);
        setError(null);

        try {
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sourceText,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Translation failed');
            }

            const data = await response.json();
            setTranslatedText(data.translatedText);

            // Add to history
            setHistory(prev => [{
                id: Date.now().toString(),
                sourceText: sourceText,
                sourceLang,
                targetLang,
                translatedText: data.translatedText,
                timestamp: new Date(),
            }, ...prev.slice(0, 9)]); // Keep last 10

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    // Auto-translate on language change (if text exists)
    useEffect(() => {
        if (sourceText.trim() && translatedText) {
            handleTranslate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceLang, targetLang]);

    // Swap languages
    const handleSwapLanguages = () => {
        const tempLang = sourceLang;
        const tempText = sourceText;
        setSourceLang(targetLang);
        setTargetLang(tempLang);
        setSourceText(translatedText);
        setTranslatedText(tempText);
    };

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(translatedText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    // Use quick phrase
    const handleQuickPhrase = (phrase: string) => {
        setSourceText(phrase);
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header with inline Provider Selector */}
            <div className="px-6 py-4 border-b border-[var(--color-border-default)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <LanguagesIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Translation Tools</h1>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Text translation for museum tour content
                            </p>
                        </div>
                    </div>
                    {/* Provider Selector - right side of header */}
                    <ProviderSelector
                        tabs={tabs}
                        activeTab={activeTab}
                        onSelectTab={setActiveTab}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'libretranslate' ? (
                    <LibreTranslateTab
                        sourceText={sourceText}
                        setSourceText={setSourceText}
                        translatedText={translatedText}
                        sourceLang={sourceLang}
                        setSourceLang={setSourceLang}
                        targetLang={targetLang}
                        setTargetLang={setTargetLang}
                        isTranslating={isTranslating}
                        error={error}
                        copySuccess={copySuccess}
                        history={history}
                        activeSubTab={activeSubTab}
                        setActiveSubTab={setActiveSubTab}
                        onTranslate={handleTranslate}
                        onSwapLanguages={handleSwapLanguages}
                        onCopy={handleCopy}
                        onQuickPhrase={handleQuickPhrase}
                        onClearSource={() => { setSourceText(''); setTranslatedText(''); }}
                    />
                ) : activeTab === 'google' ? (
                    <GoogleCloudTab />
                ) : (
                    <ComingSoonTab tab={tabs.find(t => t.id === activeTab)!} />
                )}
            </div>
        </div>
    );
}

// ============================================================================
// PROVIDER SELECTOR COMPONENT
// ============================================================================

interface ProviderSelectorProps {
    tabs: Tab[];
    activeTab: TabId;
    onSelectTab: (id: TabId) => void;
}

function ProviderSelector({ tabs, activeTab, onSelectTab }: ProviderSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const activeProvider = tabs.find(t => t.id === activeTab);

    const typeColors = {
        paid: 'from-violet-500 to-purple-600',
        free: 'from-emerald-500 to-teal-600',
    };

    const typeLabels = {
        paid: 'Cloud API',
        free: 'Self-Hosted',
    };

    // Group tabs by type
    const paidTabs = tabs.filter(t => t.type === 'paid');
    const freeTabs = tabs.filter(t => t.type === 'free');

    const handleSelect = (tabId: TabId) => {
        onSelectTab(tabId);
        setIsOpen(false);
    };

    return (
        <>
            {/* Provider Selection Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-3 px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] rounded-xl transition-all group"
            >
                {activeProvider && (
                    <>
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${typeColors[activeProvider.type]} flex items-center justify-center shadow-sm`}>
                            <activeProvider.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-[var(--color-text-primary)]">
                                    {activeProvider.name}
                                </span>
                                {activeProvider.status === 'active' ? (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-medium rounded">
                                        ACTIVE
                                    </span>
                                ) : (
                                    <span className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] text-[10px] font-medium rounded">
                                        SOON
                                    </span>
                                )}
                            </div>
                            <span className="text-xs text-[var(--color-text-muted)]">
                                {typeLabels[activeProvider.type]}
                            </span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors ml-2" />
                    </>
                )}
            </button>

            {/* Provider Selection Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal */}
                    <div className="relative w-full max-w-5xl max-h-[85vh] overflow-hidden bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[var(--color-border-default)] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Select Translation Provider
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Choose a translation service
                                </p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:text-white transition-all duration-300 hover:rotate-90 group shadow-sm"
                                aria-label="Close modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Cloud API Services */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                        <Zap className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                        Cloud API Services
                                    </h3>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        Pay-per-use, high quality
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {paidTabs.map((tab) => (
                                        <ProviderCard
                                            key={tab.id}
                                            tab={tab}
                                            isActive={activeTab === tab.id}
                                            typeColors={typeColors}
                                            onSelect={() => handleSelect(tab.id)}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Self-Hosted Services */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                        <Server className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                        Self-Hosted (Free)
                                    </h3>
                                    <span className="text-xs text-[var(--color-text-muted)]">
                                        No API fees, privacy-first
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {freeTabs.map((tab) => (
                                        <ProviderCard
                                            key={tab.id}
                                            tab={tab}
                                            isActive={activeTab === tab.id}
                                            typeColors={typeColors}
                                            onSelect={() => handleSelect(tab.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ============================================================================
// PROVIDER CARD COMPONENT
// ============================================================================

interface ProviderCardProps {
    tab: Tab;
    isActive: boolean;
    typeColors: Record<string, string>;
    onSelect: () => void;
}

function ProviderCard({ tab, isActive, typeColors, onSelect }: ProviderCardProps) {
    const isActiveProvider = tab.status === 'active';

    return (
        <button
            onClick={onSelect}
            className={`
                flex items-start gap-3 p-3 rounded-xl border transition-all text-left w-full relative
                ${isActive
                    ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/40 ring-2 ring-[var(--color-accent-primary)]/30'
                    : isActiveProvider
                        ? 'bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500/50'
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)] opacity-75'
                }
            `}
        >
            {/* Active glow indicator */}
            {isActiveProvider && !isActive && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
            )}
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[tab.type]} flex items-center justify-center flex-shrink-0 shadow-sm ${isActiveProvider ? 'ring-2 ring-emerald-400/40' : ''}`}>
                <tab.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 relative">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium truncate ${isActiveProvider ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                        {tab.name}
                    </span>
                    {tab.status === 'active' ? (
                        <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded flex-shrink-0 animate-pulse">
                            ACTIVE
                        </span>
                    ) : (
                        <span className="px-1.5 py-0.5 bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] text-[10px] font-medium rounded flex-shrink-0">
                            SOON
                        </span>
                    )}
                </div>
                <p className={`text-xs line-clamp-2 ${isActiveProvider ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-muted)]'}`}>
                    {tab.description}
                </p>
                {tab.pricing && (
                    <p className={`text-xs mt-1 font-medium ${isActiveProvider ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'}`}>
                        {tab.pricing}
                    </p>
                )}
            </div>
        </button>
    );
}

// ============================================================================
// LIBRETRANSLATE TAB COMPONENT
// ============================================================================

interface LibreTranslateTabProps {
    sourceText: string;
    setSourceText: (text: string) => void;
    translatedText: string;
    sourceLang: string;
    setSourceLang: (lang: string) => void;
    targetLang: string;
    setTargetLang: (lang: string) => void;
    isTranslating: boolean;
    error: string | null;
    copySuccess: boolean;
    history: TranslationHistoryItem[];
    activeSubTab: 'text' | 'files';
    setActiveSubTab: (tab: 'text' | 'files') => void;
    onTranslate: () => void;
    onSwapLanguages: () => void;
    onCopy: () => void;
    onQuickPhrase: (phrase: string) => void;
    onClearSource: () => void;
}

function LibreTranslateTab({
    sourceText,
    setSourceText,
    translatedText,
    sourceLang,
    setSourceLang,
    targetLang,
    setTargetLang,
    isTranslating,
    error,
    copySuccess,
    history,
    activeSubTab,
    setActiveSubTab,
    onTranslate,
    onSwapLanguages,
    onCopy,
    onQuickPhrase,
    onClearSource,
}: LibreTranslateTabProps) {
    const getLanguageName = (code: string) => {
        return SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Sub-tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveSubTab('text')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                        ${activeSubTab === 'text'
                            ? 'bg-[var(--color-accent-primary)] text-white'
                            : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                        }
                    `}
                >
                    <LanguagesIcon className="w-4 h-4" />
                    Translate Text
                </button>
                <button
                    onClick={() => setActiveSubTab('files')}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
                        ${activeSubTab === 'files'
                            ? 'bg-[var(--color-accent-primary)] text-white'
                            : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                        }
                    `}
                >
                    <FileText className="w-4 h-4" />
                    Translate Files
                </button>
            </div>

            {activeSubTab === 'text' ? (
                <>
                    {/* Language Selectors */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Translate from
                            </label>
                            <select
                                value={sourceLang}
                                onChange={(e) => setSourceLang(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={onSwapLanguages}
                            className="mt-6 p-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
                            title="Swap languages"
                        >
                            <ArrowRightLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
                        </button>

                        <div className="flex-1">
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Translate into
                            </label>
                            <select
                                value={targetLang}
                                onChange={(e) => setTargetLang(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            >
                                {SUPPORTED_LANGUAGES.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Translation Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Source Text */}
                        <div className="relative">
                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Enter text to translate..."
                                className="w-full h-64 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none"
                            />
                            {sourceText && (
                                <button
                                    onClick={onClearSource}
                                    className="absolute top-3 right-3 p-1.5 bg-[var(--color-bg-surface)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
                                    title="Clear text"
                                >
                                    <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </button>
                            )}
                            <div className="absolute bottom-3 left-4 text-xs text-[var(--color-text-muted)]">
                                {sourceText.length} / 5000
                            </div>
                        </div>

                        {/* Translated Text */}
                        <div className="relative">
                            <div className="w-full h-64 p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl overflow-auto">
                                {isTranslating ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent-primary)]" />
                                    </div>
                                ) : error ? (
                                    <div className="flex items-center gap-2 text-red-400">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                ) : translatedText ? (
                                    <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{translatedText}</p>
                                ) : (
                                    <p className="text-[var(--color-text-muted)]">Translation will appear here...</p>
                                )}
                            </div>
                            {translatedText && !isTranslating && (
                                <button
                                    onClick={onCopy}
                                    className="absolute top-3 right-3 p-1.5 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all flex items-center gap-1.5"
                                    title="Copy to clipboard"
                                >
                                    {copySuccess ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            <span className="text-xs text-emerald-400">Copied!</span>
                                        </>
                                    ) : (
                                        <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Translate Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={onTranslate}
                            disabled={!sourceText.trim() || isTranslating}
                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
                        >
                            {isTranslating ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Translating...
                                </span>
                            ) : (
                                'Translate'
                            )}
                        </button>
                    </div>

                    {/* Quick Phrases */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                            Quick Phrases for Museums
                        </h3>
                        <div className="space-y-3">
                            {QUICK_PHRASES.map((category) => (
                                <div key={category.category}>
                                    <p className="text-xs text-[var(--color-text-muted)] mb-2">{category.category}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {category.phrases.map((phrase) => (
                                            <button
                                                key={phrase}
                                                onClick={() => onQuickPhrase(phrase)}
                                                className="px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-border-hover)] transition-all"
                                            >
                                                {phrase}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Translation History */}
                    {history.length > 0 && (
                        <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                    Recent Translations
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {history.slice(0, 5).map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setSourceText(item.sourceText);
                                            setSourceLang(item.sourceLang);
                                            setTargetLang(item.targetLang);
                                        }}
                                        className="w-full text-left p-3 bg-[var(--color-bg-surface)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded">
                                                {getLanguageName(item.sourceLang)}
                                            </span>
                                            <span className="text-[var(--color-text-muted)]">→</span>
                                            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded">
                                                {getLanguageName(item.targetLang)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-primary)] truncate">
                                            "{item.sourceText}" → "{item.translatedText}"
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <FileTranslationTab />
            )}
        </div>
    );
}

// ============================================================================
// FILE TRANSLATION TAB COMPONENT
// ============================================================================

function FileTranslationTab() {
    const [file, setFile] = useState<File | null>(null);
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('es');
    const [isTranslating, setIsTranslating] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setResult(null);
            setError(null);
        }
    };

    const handleTranslate = async () => {
        if (!file) return;

        setIsTranslating(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('sourceLang', sourceLang);
            formData.append('targetLang', targetLang);

            const response = await fetch('/api/translate/file', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'File translation failed');
            }

            const data = await response.json();
            setResult(data.translatedText);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'File translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Supported Formats */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-300">
                    <strong>Supported formats:</strong> .txt, .odt, .odp, .docx, .pptx, .epub, .html, .srt, .pdf
                </p>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-[var(--color-border-default)] rounded-xl p-8 text-center">
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".txt,.odt,.odp,.docx,.pptx,.epub,.html,.srt,.pdf"
                    className="hidden"
                    id="file-upload"
                />
                <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                >
                    <FileText className="w-12 h-12 text-[var(--color-text-muted)]" />
                    <div>
                        <p className="text-[var(--color-text-primary)] font-medium">
                            {file ? file.name : 'Click to upload a file'}
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Maximum 10MB'}
                        </p>
                    </div>
                </label>
            </div>

            {/* Language Selectors */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Source Language
                    </label>
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)]"
                    >
                        <option value="auto">Auto Detect</option>
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Target Language
                    </label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)]"
                    >
                        {SUPPORTED_LANGUAGES.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Translate Button */}
            <button
                onClick={handleTranslate}
                disabled={!file || isTranslating}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isTranslating ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Translating file...
                    </span>
                ) : (
                    'Translate File'
                )}
            </button>

            {/* Result */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {result && (
                <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
                    <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                        Translated Content
                    </h3>
                    <div className="max-h-96 overflow-auto p-4 bg-[var(--color-bg-surface)] rounded-lg">
                        <pre className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">{result}</pre>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// GOOGLE CLOUD TAB COMPONENT
// ============================================================================

interface GoogleLanguage {
    code: string;
    name: string;
}

function GoogleCloudTab() {
    const [sourceText, setSourceText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('auto');
    const [targetLang, setTargetLang] = useState('es');
    const [isTranslating, setIsTranslating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [autoDetectedLang, setAutoDetectedLang] = useState<string | null>(null);
    const [languages, setLanguages] = useState<GoogleLanguage[]>([]);
    const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);
    const [apiStatus, setApiStatus] = useState<{ available: boolean; reason?: string } | null>(null);
    const [charCount, setCharCount] = useState(0);
    const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
    const [apiNeedsSetup, setApiNeedsSetup] = useState(false);

    // Fallback languages when API key doesn't have Translation API enabled
    const FALLBACK_LANGUAGES: GoogleLanguage[] = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'ru', name: 'Russian' },
        { code: 'nl', name: 'Dutch' },
        { code: 'pl', name: 'Polish' },
        { code: 'tr', name: 'Turkish' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'th', name: 'Thai' },
        { code: 'el', name: 'Greek' },
        { code: 'he', name: 'Hebrew' },
        { code: 'id', name: 'Indonesian' },
    ];

    // Fetch supported languages on mount
    useEffect(() => {
        const fetchLanguages = async () => {
            try {
                const response = await fetch('/api/google-translate/languages');
                if (response.ok) {
                    const data = await response.json();
                    setLanguages(data.languages || []);
                    setApiStatus({ available: true });
                } else {
                    // API not enabled - use fallback languages
                    console.warn('Google Translate API not available, using fallback languages');
                    setLanguages(FALLBACK_LANGUAGES);
                    setApiNeedsSetup(true);
                    setApiStatus({ available: true }); // Still allow translation attempts
                }
            } catch (err) {
                console.error('Failed to fetch languages:', err);
                setLanguages(FALLBACK_LANGUAGES);
                setApiNeedsSetup(true);
                setApiStatus({ available: true });
            } finally {
                setIsLoadingLanguages(false);
            }
        };

        fetchLanguages();
    }, []);

    // Track character count
    useEffect(() => {
        setCharCount(sourceText.length);
    }, [sourceText]);

    const handleTranslate = async () => {
        if (!sourceText.trim()) return;

        setIsTranslating(true);
        setError(null);
        setAutoDetectedLang(null);

        try {
            const response = await fetch('/api/google-translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: sourceText,
                    sourceLang: sourceLang,
                    targetLang: targetLang,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Translation failed');
            }

            const data = await response.json();
            setTranslatedText(data.translatedText);

            if (data.detectedSourceLanguage) {
                setAutoDetectedLang(data.detectedSourceLanguage);
            }

            // Add to history
            setHistory(prev => [{
                id: Date.now().toString(),
                sourceText: sourceText,
                sourceLang: data.detectedSourceLanguage || sourceLang,
                targetLang,
                translatedText: data.translatedText,
                timestamp: new Date(),
            }, ...prev.slice(0, 9)]);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Translation failed');
        } finally {
            setIsTranslating(false);
        }
    };

    const handleSwapLanguages = () => {
        if (sourceLang === 'auto') return; // Can't swap with auto-detect
        const tempLang = sourceLang;
        const tempText = sourceText;
        setSourceLang(targetLang);
        setTargetLang(tempLang);
        setSourceText(translatedText);
        setTranslatedText(tempText);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(translatedText);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    };

    const handleQuickPhrase = (phrase: string) => {
        setSourceText(phrase);
    };

    const getLanguageName = (code: string) => {
        if (code === 'auto') return 'Auto-Detect';
        const lang = languages.find(l => l.code === code);
        return lang?.name || code;
    };

    // Show error if API not available
    if (apiStatus && !apiStatus.available) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                        Google Translate API Not Available
                    </h3>
                    <p className="text-[var(--color-text-muted)]">
                        {apiStatus.reason || 'Please check your GOOGLE_VISION_API_KEY configuration.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* API Setup Warning */}
            {apiNeedsSetup && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-amber-400 mb-1">Enable Cloud Translation API</h4>
                            <p className="text-sm text-[var(--color-text-muted)] mb-2">
                                To use Google Cloud Translation, enable the <b>Cloud Translation API</b> in your Google Cloud Console
                                and update your API key restrictions to include it.
                            </p>
                            <a
                                href="https://console.cloud.google.com/apis/library/translate.googleapis.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300"
                            >
                                Open Google Cloud Console <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* API Status Banner */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${apiNeedsSetup ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                        Google Cloud Translation API - {languages.length} languages {apiNeedsSetup && '(using fallback list)'}
                    </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                    <span>Free tier: 500K chars/month</span>
                    <span className="px-2 py-0.5 bg-[var(--color-bg-surface)] rounded">
                        {charCount.toLocaleString()} chars
                    </span>
                </div>
            </div>

            {/* Language Selectors */}
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Translate from
                    </label>
                    <select
                        value={sourceLang}
                        onChange={(e) => setSourceLang(e.target.value)}
                        disabled={isLoadingLanguages}
                        className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <option value="auto">🔍 Auto-Detect</option>
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                    {autoDetectedLang && sourceLang === 'auto' && (
                        <p className="mt-1 text-xs text-violet-400">
                            Detected: {getLanguageName(autoDetectedLang)}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleSwapLanguages}
                    disabled={sourceLang === 'auto'}
                    className="mt-6 p-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title={sourceLang === 'auto' ? "Can't swap with auto-detect" : "Swap languages"}
                >
                    <ArrowRightLeft className="w-5 h-5 text-[var(--color-text-secondary)]" />
                </button>

                <div className="flex-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Translate into
                    </label>
                    <select
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value)}
                        disabled={isLoadingLanguages}
                        className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Translation Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Source Text */}
                <div className="relative">
                    <textarea
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Enter text to translate..."
                        className="w-full h-64 p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                    />
                    {sourceText && (
                        <button
                            onClick={() => { setSourceText(''); setTranslatedText(''); }}
                            className="absolute top-3 right-3 p-1.5 bg-[var(--color-bg-surface)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
                            title="Clear text"
                        >
                            <X className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </button>
                    )}
                    <div className="absolute bottom-3 left-4 text-xs text-[var(--color-text-muted)]">
                        {sourceText.length.toLocaleString()} characters
                    </div>
                </div>

                {/* Translated Text */}
                <div className="relative">
                    <div className="w-full h-64 p-4 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl overflow-auto">
                        {isTranslating ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center gap-2 text-red-400">
                                <AlertCircle className="w-5 h-5" />
                                <span>{error}</span>
                            </div>
                        ) : translatedText ? (
                            <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">{translatedText}</p>
                        ) : (
                            <p className="text-[var(--color-text-muted)]">Translation will appear here...</p>
                        )}
                    </div>
                    {translatedText && !isTranslating && (
                        <button
                            onClick={handleCopy}
                            className="absolute top-3 right-3 p-1.5 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all flex items-center gap-1.5"
                            title="Copy to clipboard"
                        >
                            {copySuccess ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-emerald-400">Copied!</span>
                                </>
                            ) : (
                                <Copy className="w-4 h-4 text-[var(--color-text-muted)]" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Translate Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleTranslate}
                    disabled={!sourceText.trim() || isTranslating}
                    className="px-8 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20"
                >
                    {isTranslating ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Translating...
                        </span>
                    ) : (
                        'Translate with Google Cloud'
                    )}
                </button>
            </div>

            {/* Quick Phrases */}
            <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
                <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                    Quick Phrases for Museums
                </h3>
                <div className="space-y-3">
                    {QUICK_PHRASES.map((category) => (
                        <div key={category.category}>
                            <p className="text-xs text-[var(--color-text-muted)] mb-2">{category.category}</p>
                            <div className="flex flex-wrap gap-2">
                                {category.phrases.map((phrase) => (
                                    <button
                                        key={phrase}
                                        onClick={() => handleQuickPhrase(phrase)}
                                        className="px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:border-violet-500/30 transition-all"
                                    >
                                        {phrase}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Translation History */}
            {
                history.length > 0 && (
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                Recent Translations
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {history.slice(0, 5).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setSourceText(item.sourceText);
                                        setSourceLang(item.sourceLang);
                                        setTargetLang(item.targetLang);
                                    }}
                                    className="w-full text-left p-3 bg-[var(--color-bg-surface)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-medium rounded">
                                            {getLanguageName(item.sourceLang)}
                                        </span>
                                        <span className="text-[var(--color-text-muted)]">→</span>
                                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded">
                                            {getLanguageName(item.targetLang)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--color-text-primary)] truncate">
                                        "{item.sourceText}" → "{item.translatedText}"
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// ============================================================================
// COMING SOON TAB COMPONENT
// ============================================================================

function ComingSoonTab({ tab }: { tab: Tab }) {
    const typeColors = {
        paid: 'from-violet-500 to-purple-600',
        free: 'from-emerald-500 to-teal-600',
    };

    const typeLabels = {
        paid: 'Cloud API',
        free: 'Self-Hosted',
    };

    const typeBadgeColors = {
        paid: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
        free: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    };

    // Implementation details for each provider
    const implementationDetails: Record<string, {
        envVars: string[];
        apiEndpoint?: string;
        notes?: string[];
    }> = {
        deepl: {
            envVars: ['DEEPL_API_KEY'],
            apiEndpoint: 'api-free.deepl.com/v2/translate',
            notes: [
                'Free tier: 500,000 chars/month',
                'Pro tier starts at $5.49/month for 1M chars',
                'Best overall translation quality',
                'Supports formality control for some languages',
            ],
        },
        google: {
            envVars: ['GOOGLE_TRANSLATE_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'],
            apiEndpoint: 'translation.googleapis.com/language/translate/v2',
            notes: [
                'Requires GCP project with Translation API enabled',
                'Pricing: $20 per million characters',
                'Neural Machine Translation for 100+ languages',
                'AutoML for custom domain-specific models',
            ],
        },
        azure: {
            envVars: ['AZURE_TRANSLATOR_KEY', 'AZURE_TRANSLATOR_REGION'],
            apiEndpoint: 'api.cognitive.microsofttranslator.com/translate',
            notes: [
                'Free tier: 2M chars/month',
                'Paid: $10 per million chars',
                'Custom Translator for domain-specific models',
                'Document Translation for batch processing',
            ],
        },
        amazon: {
            envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'],
            apiEndpoint: 'translate.{region}.amazonaws.com',
            notes: [
                'Free tier: 2M chars/month for first 12 months',
                'Standard: $15 per million chars',
                'Active Custom Translation for terminology',
                'Deep integration with AWS services',
            ],
        },
        argos: {
            envVars: ['ARGOS_TRANSLATE_PATH'],
            notes: [
                'Fully offline translation',
                'Python library: pip install argostranslate',
                'Download language models separately',
                'Good for privacy-sensitive deployments',
            ],
        },
        opennmt: {
            envVars: ['OPENNMT_SERVER_URL'],
            apiEndpoint: 'localhost:5000/translator/translate',
            notes: [
                'PyTorch-based neural MT framework',
                'Requires training your own models',
                'Highly customizable for specific domains',
                'Research-grade flexibility',
            ],
        },
        bergamot: {
            envVars: [],
            notes: [
                'Client-side translation via WebAssembly',
                'Uses Firefox Translations models',
                'Zero server cost - runs in browser',
                'Good for offline/privacy use cases',
            ],
        },
        marian: {
            envVars: ['MARIAN_SERVER_URL'],
            notes: [
                'C++ implementation, very efficient',
                'Uses Helsinki-NLP Opus-MT models',
                'Production-ready performance',
                'WebSocket server available',
            ],
        },
    };

    const details = implementationDetails[tab.id] || {};

    return (
        <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto py-8 px-4">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${typeColors[tab.type]} flex items-center justify-center mb-4 shadow-lg`}>
                        <tab.icon className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                        {tab.name}
                    </h2>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeBadgeColors[tab.type]}`}>
                        {typeLabels[tab.type]}
                    </span>
                    <p className="text-[var(--color-text-muted)] mt-4 max-w-md mx-auto">
                        {tab.description}
                    </p>
                </div>

                {/* Status Banner */}
                <div className="flex items-center justify-center gap-3 p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)] mb-8">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[var(--color-text-secondary)] font-medium">
                        Integration Coming Soon
                    </span>
                </div>

                {/* Pricing */}
                {tab.pricing && (
                    <div className="mb-6 p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">
                            💰 Pricing
                        </h3>
                        <p className="text-[var(--color-text-primary)]">{tab.pricing}</p>
                    </div>
                )}

                {/* Features */}
                {tab.features && tab.features.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                            Key Features
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {tab.features.map((feature, idx) => (
                                <div
                                    key={idx}
                                    className={`px-3 py-2 rounded-lg text-sm text-center ${typeBadgeColors[tab.type]}`}
                                >
                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Implementation Guide */}
                <div className="space-y-6">
                    {/* Documentation */}
                    {tab.docUrl && (
                        <div className="p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                                📚 Documentation
                            </h3>
                            <a
                                href={tab.docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[var(--color-accent-primary)] hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                {tab.docUrl}
                            </a>
                        </div>
                    )}

                    {/* Environment Variables */}
                    {details.envVars && details.envVars.length > 0 && (
                        <div className="p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                                🔑 Environment Variables
                            </h3>
                            <div className="space-y-2">
                                {details.envVars.map((envVar, idx) => (
                                    <code
                                        key={idx}
                                        className="block px-3 py-2 bg-black/30 rounded-lg text-sm text-emerald-400 font-mono"
                                    >
                                        {envVar}=your_value_here
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* API Endpoint */}
                    {details.apiEndpoint && (
                        <div className="p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                                🔗 API Endpoint
                            </h3>
                            <code className="block px-3 py-2 bg-black/30 rounded-lg text-sm text-pink-400 font-mono">
                                {details.apiEndpoint}
                            </code>
                        </div>
                    )}

                    {/* Implementation Notes */}
                    {details.notes && details.notes.length > 0 && (
                        <div className="p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-3">
                                📝 Implementation Notes
                            </h3>
                            <ul className="space-y-2">
                                {details.notes.map((note, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                                        <span className="text-[var(--color-text-secondary)] mt-0.5">•</span>
                                        {note}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* TourStack Integration Path */}
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-600/10 rounded-xl border border-blue-500/20">
                        <h3 className="text-sm font-semibold text-blue-300 uppercase tracking-wide mb-3">
                            🚀 TourStack Integration Path
                        </h3>
                        <ol className="space-y-2 text-sm text-[var(--color-text-muted)]">
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center">1</span>
                                <span>Add provider to <code className="text-blue-300">server/routes/translate.ts</code></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center">2</span>
                                <span>Create translation function with API authentication</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center">3</span>
                                <span>Add environment variables to Settings page</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center justify-center">4</span>
                                <span>Update tab status from <code className="text-blue-300">coming_soon</code> to <code className="text-blue-300">active</code></span>
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
}
