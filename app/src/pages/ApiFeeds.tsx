import { useState, useEffect, useCallback } from 'react';
import {
    Plug,
    Rss,
    Key,
    Webhook,
    RefreshCw,
    Copy,
    ExternalLink,
    Check,
    AlertCircle,
    Activity,
    FileJson,
    Download,
    Eye,
    X,
    Lock,
    Play,
    ChevronDown,
    ChevronRight,
    Globe,
    BookOpen,
    Code,
    Layers,
} from 'lucide-react';

// Types
interface LocalizedText {
    [key: string]: string;
}

interface Tour {
    id: string;
    slug?: string;
    title: LocalizedText | string;
    description: LocalizedText | string | null;
    status: string;
    languages: string[] | string;
    primaryLanguage?: string;
    createdAt: string;
    updatedAt: string;
    stops?: Stop[];
}

interface Stop {
    id: string;
    title: string;
    order: number;
}

interface ApiStats {
    totalTours: number;
    publishedTours: number;
    totalStops: number;
    totalLanguages: number;
    allLanguages: string[];
}

function getDisplayTitle(title: LocalizedText | string): string {
    if (typeof title === 'string') {
        try {
            const parsed = JSON.parse(title);
            return parsed.en || parsed[Object.keys(parsed)[0]] || 'Untitled';
        } catch {
            return title || 'Untitled';
        }
    }
    return title.en || title[Object.keys(title)[0]] || 'Untitled';
}

function getLanguagesArray(languages: string[] | string): string[] {
    if (Array.isArray(languages)) return languages;
    try {
        return JSON.parse(languages);
    } catch {
        return ['en'];
    }
}

// Tab definitions
type TabId = 'overview' | 'feeds' | 'explorer' | 'keys' | 'webhooks';

interface Tab {
    id: TabId;
    name: string;
    icon: typeof Plug;
    status: 'active' | 'coming_soon';
}

const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: Activity, status: 'active' },
    { id: 'feeds', name: 'Feeds', icon: Rss, status: 'active' },
    { id: 'explorer', name: 'Explorer', icon: Code, status: 'active' },
    { id: 'keys', name: 'API Keys', icon: Key, status: 'coming_soon' },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook, status: 'coming_soon' },
];

export function ApiFeeds() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [tours, setTours] = useState<Tour[]>([]);
    const [stats, setStats] = useState<ApiStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetch('/api/tours');
                if (!response.ok) throw new Error('Failed to load tours');
                const toursData = await response.json();
                setTours(toursData);

                const languages = new Set<string>();
                let totalStops = 0;
                toursData.forEach((tour: Tour) => {
                    const tourLangs = getLanguagesArray(tour.languages);
                    tourLangs.forEach((lang: string) => languages.add(lang));
                    totalStops += tour.stops?.length || 0;
                });

                setStats({
                    totalTours: toursData.length,
                    publishedTours: toursData.filter((t: Tour) => t.status === 'published').length,
                    totalStops,
                    totalLanguages: languages.size,
                    allLanguages: Array.from(languages),
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="h-full flex flex-col bg-[var(--color-bg-primary)]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border-default)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                            <Plug className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">API & Feeds</h1>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Feed v2.0 — Tour data, content blocks, multilingual, absolute media URLs
                            </p>
                        </div>
                    </div>
                    <a
                        href="/api/feeds/openapi.json"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                        <BookOpen className="w-4 h-4" />
                        OpenAPI Spec
                    </a>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 border-b border-[var(--color-border-default)]">
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => tab.status === 'active' && setActiveTab(tab.id)}
                            disabled={tab.status === 'coming_soon'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-[var(--color-accent-primary)] text-white'
                                    : tab.status === 'coming_soon'
                                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-not-allowed'
                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                            {tab.status === 'coming_soon' && <Lock className="w-3 h-3 ml-1" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4">
                        <AlertCircle className="w-12 h-12 text-[var(--color-error)]" />
                        <p className="text-[var(--color-error)]">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg"
                        >
                            Retry
                        </button>
                    </div>
                ) : activeTab === 'overview' ? (
                    <OverviewTab stats={stats} tours={tours} />
                ) : activeTab === 'feeds' ? (
                    <FeedsTab tours={tours} stats={stats} />
                ) : activeTab === 'explorer' ? (
                    <ExplorerTab tours={tours} stats={stats} />
                ) : (
                    <ComingSoonTab tab={tabs.find(t => t.id === activeTab)!} />
                )}
            </div>
        </div>
    );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ stats, tours }: { stats: ApiStats | null; tours: Tour[] }) {
    const baseUrl = window.location.origin;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Tours" value={stats?.totalTours || 0} icon={FileJson} />
                <StatCard label="Published" value={stats?.publishedTours || 0} icon={Check} color="emerald" />
                <StatCard label="Total Stops" value={stats?.totalStops || 0} icon={Layers} />
                <StatCard label="Languages" value={stats?.totalLanguages || 0} icon={Globe} color="blue" />
            </div>

            {/* Endpoints */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Endpoints</h2>
                <div className="space-y-3">
                    <EndpointRow
                        method="GET"
                        path="/api/feeds/tours"
                        description="All tours with stops and content blocks"
                        copyUrl={`${baseUrl}/api/feeds/tours`}
                    />
                    <EndpointRow
                        method="GET"
                        path="/api/feeds/tours/:id"
                        description="Single tour by ID"
                    />
                    <EndpointRow
                        method="GET"
                        path="/api/feeds/tours/:id/stops"
                        description="Stops only for a specific tour"
                    />
                    <EndpointRow
                        method="GET"
                        path="/api/feeds/openapi.json"
                        description="OpenAPI 3.0 specification"
                        copyUrl={`${baseUrl}/api/feeds/openapi.json`}
                    />
                </div>
            </div>

            {/* Feed Features */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Feed v2.0 Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'Absolute media URLs', desc: 'All image/audio/video URLs fully resolved' },
                        { label: 'Language filtering', desc: '?lang=es returns single-language content' },
                        { label: '3 output formats', desc: 'full, compact, or minimal' },
                        { label: '17 content block types', desc: 'text, image, audio, gallery, accordion, map, etc.' },
                        { label: 'Recursive lang filtering', desc: 'Nested captions, markers, accordion items all filtered' },
                        { label: 'No base64 data', desc: 'All inline data URIs stripped from responses' },
                        { label: 'Stop metadata', desc: 'slug, type, shortCode, display flags included' },
                        { label: 'Accessibility data', desc: 'Tour and stop accessibility settings' },
                    ].map((f) => (
                        <div key={f.label} className="flex items-start gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">{f.label}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Available Tours */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Available Tours</h2>
                {tours.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        <FileJson className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No tours available yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tours.map((tour) => (
                            <div
                                key={tour.id}
                                className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        tour.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                    <div>
                                        <p className="font-medium text-[var(--color-text-primary)]">{getDisplayTitle(tour.title)}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {tour.stops?.length || 0} stops · {getLanguagesArray(tour.languages).join(', ')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs text-[var(--color-text-muted)] font-mono hidden md:block">
                                        {tour.id.slice(0, 12)}…
                                    </code>
                                    <CopyButton text={`${baseUrl}/api/feeds/tours/${tour.id}`} label="Copy URL" small />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Feeds Tab ───────────────────────────────────────────────────────────────

function FeedsTab({ tours, stats }: { tours: Tour[]; stats: ApiStats | null }) {
    const [previewFeed, setPreviewFeed] = useState<{ name: string; url: string } | null>(null);
    const [feedContent, setFeedContent] = useState<string | null>(null);
    const [isLoadingFeed, setIsLoadingFeed] = useState(false);
    const baseUrl = window.location.origin;

    const handlePreview = async (name: string, url: string) => {
        setPreviewFeed({ name, url });
        setIsLoadingFeed(true);
        try {
            const response = await fetch(url);
            const data = await response.json();
            setFeedContent(JSON.stringify(data, null, 2));
        } catch {
            setFeedContent('Error loading feed');
        } finally {
            setIsLoadingFeed(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Query Parameters */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Query Parameters</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ParamCard
                        param="?lang=es"
                        description="Filter to a single language. Falls back to English."
                        color="blue"
                        example={`/api/feeds/tours?lang=es`}
                    />
                    <ParamCard
                        param="?format=compact"
                        description="Output detail: full (default), compact, or minimal."
                        color="purple"
                        example={`/api/feeds/tours?format=minimal`}
                    />
                    <ParamCard
                        param="?status=published"
                        description="Filter tours by status."
                        color="emerald"
                        example={`/api/feeds/tours?status=published`}
                    />
                    <ParamCard
                        param="?include_stops=false"
                        description="Omit stops from the response."
                        color="amber"
                        example={`/api/feeds/tours?include_stops=false`}
                    />
                </div>
                <div className="mt-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                    <p className="text-xs text-[var(--color-text-muted)]">
                        Combine params: <code className="text-[var(--color-text-secondary)]">/api/feeds/tours?lang=es&format=compact&status=published</code>
                    </p>
                </div>
            </div>

            {/* All Tours Feed */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">All Tours Feed</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePreview('All Tours', '/api/feeds/tours')}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                            Preview
                        </button>
                        <CopyButton text={`${baseUrl}/api/feeds/tours`} label="Copy URL" small />
                        <a href="/api/feeds/tours" target="_blank" rel="noopener noreferrer"
                           className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                        </a>
                    </div>
                </div>
                <code className="text-sm text-[var(--color-text-muted)] font-mono block mb-3">
                    GET /api/feeds/tours
                </code>
                <p className="text-sm text-[var(--color-text-muted)]">
                    Returns all {stats?.totalTours || 0} tours with stops, content blocks, and metadata.
                    {stats && stats.allLanguages.length > 0 && (
                        <> Available languages: {stats.allLanguages.map(l => l.toUpperCase()).join(', ')}.</>
                    )}
                </p>
            </div>

            {/* Per-Tour Feeds */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                    Tour Feeds
                    <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">{tours.length} available</span>
                </h2>
                <div className="space-y-2">
                    {tours.map((tour) => {
                        const langs = getLanguagesArray(tour.languages);
                        return (
                            <div
                                key={tour.id}
                                className="flex items-center justify-between p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
                                        <FileJson className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-[var(--color-text-primary)]">{getDisplayTitle(tour.title)}</p>
                                        <code className="text-xs text-[var(--color-text-muted)] font-mono">
                                            /api/feeds/tours/{tour.id}
                                        </code>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                                {tour.stops?.length || 0} stops
                                            </span>
                                            {langs.map(lang => (
                                                <span key={lang} className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                                    {lang.toUpperCase()}
                                                </span>
                                            ))}
                                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                                                tour.status === 'published'
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {tour.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePreview(getDisplayTitle(tour.title), `/api/feeds/tours/${tour.id}`)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => handlePreview(`${getDisplayTitle(tour.title)} — Stops`, `/api/feeds/tours/${tour.id}/stops`)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                    >
                                        <Layers className="w-4 h-4" />
                                        Stops
                                    </button>
                                    <CopyButton text={`${baseUrl}/api/feeds/tours/${tour.id}`} label="Copy" small />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preview Modal */}
            {previewFeed && (
                <FeedPreviewModal
                    name={previewFeed.name}
                    url={previewFeed.url}
                    content={feedContent}
                    isLoading={isLoadingFeed}
                    onClose={() => setPreviewFeed(null)}
                />
            )}
        </div>
    );
}

// ─── Explorer Tab ────────────────────────────────────────────────────────────

function ExplorerTab({ tours, stats }: { tours: Tour[]; stats: ApiStats | null }) {
    const [endpoint, setEndpoint] = useState<'all' | 'single' | 'stops'>('all');
    const [selectedTourId, setSelectedTourId] = useState<string>(tours[0]?.id || '');
    const [lang, setLang] = useState<string>('');
    const [format, setFormat] = useState<string>('full');
    const [status, setStatus] = useState<string>('');
    const [includeStops, setIncludeStops] = useState(true);
    const [response, setResponse] = useState<string | null>(null);
    const [responseTime, setResponseTime] = useState<number | null>(null);
    const [responseSize, setResponseSize] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

    const baseUrl = window.location.origin;

    // Build the URL from current params
    const buildUrl = useCallback(() => {
        let path = '/api/feeds/tours';
        if (endpoint === 'single' && selectedTourId) {
            path = `/api/feeds/tours/${selectedTourId}`;
        } else if (endpoint === 'stops' && selectedTourId) {
            path = `/api/feeds/tours/${selectedTourId}/stops`;
        }

        const params = new URLSearchParams();
        if (lang) params.set('lang', lang);
        if (endpoint !== 'stops' && format !== 'full') params.set('format', format);
        if (endpoint === 'all' && status) params.set('status', status);
        if (endpoint === 'all' && !includeStops) params.set('include_stops', 'false');

        const qs = params.toString();
        return qs ? `${path}?${qs}` : path;
    }, [endpoint, selectedTourId, lang, format, status, includeStops]);

    const currentUrl = buildUrl();

    const handleRun = async () => {
        setIsLoading(true);
        setResponse(null);
        const start = performance.now();
        try {
            const res = await fetch(currentUrl);
            const data = await res.json();
            const elapsed = Math.round(performance.now() - start);
            const text = JSON.stringify(data, null, 2);
            setResponse(text);
            setResponseTime(elapsed);
            setResponseSize(new Blob([text]).size);
        } catch {
            setResponse('Error fetching feed');
            setResponseTime(null);
            setResponseSize(null);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBlock = (key: string) => {
        setExpandedBlocks(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    // Parse response for structured view
    let parsedResponse: Record<string, unknown> | null = null;
    try {
        if (response) parsedResponse = JSON.parse(response);
    } catch { /* keep null */ }

    return (
        <div className="space-y-6">
            {/* Request Builder */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Request Builder</h2>

                {/* Endpoint selector */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                        { id: 'all' as const, label: 'All Tours', path: '/api/feeds/tours' },
                        { id: 'single' as const, label: 'Single Tour', path: '/api/feeds/tours/:id' },
                        { id: 'stops' as const, label: 'Stops Only', path: '/api/feeds/tours/:id/stops' },
                    ].map((ep) => (
                        <button
                            key={ep.id}
                            onClick={() => setEndpoint(ep.id)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                                endpoint === ep.id
                                    ? 'bg-[var(--color-accent-primary)]/15 border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]'
                                    : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                        >
                            <p className="font-medium text-sm">{ep.label}</p>
                            <code className="text-xs opacity-60">{ep.path}</code>
                        </button>
                    ))}
                </div>

                {/* Params */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {/* Tour selector (for single/stops) */}
                    {(endpoint === 'single' || endpoint === 'stops') && (
                        <div className="col-span-2">
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Tour</label>
                            <select
                                value={selectedTourId}
                                onChange={(e) => setSelectedTourId(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                            >
                                {tours.map(t => (
                                    <option key={t.id} value={t.id}>{getDisplayTitle(t.title)}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Language */}
                    <div>
                        <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Language</label>
                        <select
                            value={lang}
                            onChange={(e) => setLang(e.target.value)}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                        >
                            <option value="">All languages</option>
                            {stats?.allLanguages.map(l => (
                                <option key={l} value={l}>{l.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>

                    {/* Format (not for stops endpoint) */}
                    {endpoint !== 'stops' && (
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                            >
                                <option value="full">Full</option>
                                <option value="compact">Compact</option>
                                <option value="minimal">Minimal</option>
                            </select>
                        </div>
                    )}

                    {/* Status (all tours only) */}
                    {endpoint === 'all' && (
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-primary)]"
                            >
                                <option value="">All</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    )}

                    {/* Include stops toggle (all tours only) */}
                    {endpoint === 'all' && (
                        <div>
                            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Include Stops</label>
                            <button
                                onClick={() => setIncludeStops(!includeStops)}
                                className={`w-full px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                    includeStops
                                        ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                                }`}
                            >
                                {includeStops ? 'Yes' : 'No'}
                            </button>
                        </div>
                    )}
                </div>

                {/* URL display + Run button */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg font-mono text-sm overflow-hidden">
                        <span className="text-emerald-400 font-bold shrink-0">GET</span>
                        <span className="text-[var(--color-text-secondary)] truncate">{currentUrl}</span>
                    </div>
                    <CopyButton text={`${baseUrl}${currentUrl}`} label="Copy" small />
                    <button
                        onClick={handleRun}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-primary)]/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                        {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Run
                    </button>
                </div>
            </div>

            {/* Response */}
            {response && (
                <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
                    {/* Response header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border-default)]">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Response</h2>
                            {responseTime !== null && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                    {responseTime}ms
                                </span>
                            )}
                            {responseSize !== null && (
                                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                    {(responseSize / 1024).toFixed(1)} KB
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <CopyButton text={response} label="Copy JSON" small />
                            <a
                                href={currentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                            >
                                <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                            </a>
                        </div>
                    </div>

                    {/* Structured view for top-level keys */}
                    {parsedResponse && (
                        <div className="px-6 py-3 border-b border-[var(--color-border-default)]">
                            <div className="flex flex-wrap gap-3">
                                {Object.entries(parsedResponse).map(([key, value]) => {
                                    if (key === 'tours' || key === 'stops' || key === 'tour') return null;
                                    const display = typeof value === 'object' ? JSON.stringify(value) : String(value);
                                    return (
                                        <div key={key} className="flex items-center gap-1.5">
                                            <span className="text-xs text-[var(--color-text-muted)]">{key}:</span>
                                            <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                                                {display.length > 40 ? display.slice(0, 40) + '…' : display}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Collapsible tour/stop sections */}
                    {parsedResponse && (
                        <div className="px-6 py-3 border-b border-[var(--color-border-default)] space-y-1">
                            {/* Tours array */}
                            {Array.isArray(parsedResponse.tours) && (parsedResponse.tours as Record<string, unknown>[]).map((tour: Record<string, unknown>, i: number) => (
                                <CollapsibleBlock
                                    key={String(tour.id || i)}
                                    label={`Tour: ${getNestedTitle(tour.title)} ${tour.status ? `(${tour.status})` : ''}`}
                                    badge={tour.stop_count !== undefined ? `${tour.stop_count} stops` : undefined}
                                    isOpen={expandedBlocks.has(`tour-${i}`)}
                                    onToggle={() => toggleBlock(`tour-${i}`)}
                                    json={tour}
                                />
                            ))}

                            {/* Single tour */}
                            {parsedResponse.tour && typeof parsedResponse.tour === 'object' && !Array.isArray(parsedResponse.tour) && (
                                <CollapsibleBlock
                                    label={`Tour: ${getNestedTitle((parsedResponse.tour as Record<string, unknown>).title)}`}
                                    isOpen={expandedBlocks.has('tour-single')}
                                    onToggle={() => toggleBlock('tour-single')}
                                    json={parsedResponse.tour as Record<string, unknown>}
                                />
                            )}

                            {/* Stops array */}
                            {Array.isArray(parsedResponse.stops) && (parsedResponse.stops as Record<string, unknown>[]).map((stop: Record<string, unknown>, i: number) => (
                                <CollapsibleBlock
                                    key={String(stop.id || i)}
                                    label={`Stop ${(stop.order as number ?? i) + 1}: ${getNestedTitle(stop.title)}`}
                                    badge={stop.type as string | undefined}
                                    isOpen={expandedBlocks.has(`stop-${i}`)}
                                    onToggle={() => toggleBlock(`stop-${i}`)}
                                    json={stop}
                                />
                            ))}
                        </div>
                    )}

                    {/* Raw JSON */}
                    <details className="group">
                        <summary className="px-6 py-3 text-sm text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text-secondary)] transition-colors">
                            Raw JSON
                        </summary>
                        <div className="px-6 pb-4">
                            <pre className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap bg-[var(--color-bg-primary)] p-4 rounded-lg overflow-auto max-h-[50vh]">
                                {response}
                            </pre>
                        </div>
                    </details>
                </div>
            )}

            {/* Empty state */}
            {!response && !isLoading && (
                <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-12 text-center">
                    <Code className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] opacity-30" />
                    <p className="text-[var(--color-text-muted)]">Configure your request above and click <strong>Run</strong></p>
                </div>
            )}
        </div>
    );
}

// ─── Helper Components ───────────────────────────────────────────────────────

function getNestedTitle(title: unknown): string {
    if (!title) return 'Untitled';
    if (typeof title === 'string') return title;
    if (typeof title === 'object') {
        const obj = title as Record<string, string>;
        return obj.en || obj[Object.keys(obj)[0]] || 'Untitled';
    }
    return 'Untitled';
}

function CollapsibleBlock({ label, badge, isOpen, onToggle, json }: {
    label: string;
    badge?: string;
    isOpen: boolean;
    onToggle: () => void;
    json: Record<string, unknown>;
}) {
    return (
        <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                    )}
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{label}</span>
                </div>
                {badge && (
                    <span className="text-xs px-1.5 py-0.5 bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] rounded">
                        {badge}
                    </span>
                )}
            </button>
            {isOpen && (
                <pre className="text-xs text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap bg-[var(--color-bg-primary)] p-4 overflow-auto max-h-[40vh]">
                    {JSON.stringify(json, null, 2)}
                </pre>
            )}
        </div>
    );
}

function EndpointRow({ method, path, description, copyUrl }: {
    method: string;
    path: string;
    description: string;
    copyUrl?: string;
}) {
    return (
        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg">
            <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded font-mono">
                    {method}
                </span>
                <code className="text-sm text-[var(--color-text-secondary)] font-mono">{path}</code>
                <span className="text-sm text-[var(--color-text-muted)] hidden md:inline">— {description}</span>
            </div>
            {copyUrl && <CopyButton text={copyUrl} label="Copy" small />}
        </div>
    );
}

function ParamCard({ param, description, color, example }: {
    param: string;
    description: string;
    color: string;
    example: string;
}) {
    const colorClass = {
        blue: 'text-blue-400',
        purple: 'text-purple-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
    }[color] || 'text-[var(--color-text-secondary)]';

    return (
        <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
            <code className={`text-sm font-mono ${colorClass}`}>{param}</code>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
            <code className="text-xs text-[var(--color-text-muted)] opacity-60 mt-1 block truncate">{example}</code>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color = 'default' }: {
    label: string;
    value: number;
    icon: typeof Activity;
    color?: 'default' | 'emerald' | 'blue';
}) {
    const colorClasses = {
        default: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]',
        emerald: 'bg-emerald-500/20 text-emerald-500',
        blue: 'bg-blue-500/20 text-blue-500',
    };

    return (
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

function CopyButton({ text, label, small = false }: { text: string; label: string; small?: boolean }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className={`flex items-center gap-2 ${
                small ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5'
            } bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors`}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-500">Copied!</span>
                </>
            ) : (
                <>
                    <Copy className="w-4 h-4" />
                    {label}
                </>
            )}
        </button>
    );
}

function FeedPreviewModal({ name, url, content, isLoading, onClose }: {
    name: string;
    url: string;
    content: string | null;
    isLoading: boolean;
    onClose: () => void;
}) {
    const baseUrl = window.location.origin;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-[var(--color-border-default)]">
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)]">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{name}</h3>
                        <code className="text-sm text-[var(--color-text-muted)] font-mono">{url}</code>
                    </div>
                    <div className="flex items-center gap-2">
                        <CopyButton text={content || ''} label="Copy JSON" small />
                        <button onClick={onClose} className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors">
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                        </div>
                    ) : (
                        <pre className="text-sm text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap bg-[var(--color-bg-elevated)] p-4 rounded-lg overflow-auto">
                            {content}
                        </pre>
                    )}
                </div>
                <div className="flex items-center justify-between p-4 border-t border-[var(--color-border-default)]">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {content ? `${(content.length / 1024).toFixed(1)} KB` : '—'}
                    </p>
                    <div className="flex gap-2">
                        <a
                            href={url}
                            download
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ComingSoonTab({ tab }: { tab: Tab }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
                <Lock className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">{tab.name}</h2>
            <p className="text-[var(--color-text-muted)] text-center max-w-md">
                {tab.id === 'keys' && 'API key management for secure access to your tour feeds.'}
                {tab.id === 'webhooks' && 'Configure webhooks to receive notifications when tours are updated.'}
            </p>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm font-medium">
                Coming Soon
            </span>
        </div>
    );
}
