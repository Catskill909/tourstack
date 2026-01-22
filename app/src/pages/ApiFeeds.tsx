import { useState, useEffect } from 'react';
import {
    Plug,
    Rss,
    Key,
    Webhook,
    TestTube,
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
    Lock
} from 'lucide-react';

// Types
interface Tour {
    id: string;
    title: string;
    description: string | null;
    status: string;
    languages: string[];
    createdAt: string;
    updatedAt: string;
    stops?: Stop[];
}

interface Stop {
    id: string;
    title: string;
    order: number;
}

interface FeedInfo {
    id: string;
    name: string;
    url: string;
    type: 'all-tours' | 'single-tour';
    tourId?: string;
    stopCount?: number;
    languages?: string[];
    lastUpdated: string;
    size?: string;
}

interface ApiStats {
    totalTours: number;
    publishedTours: number;
    totalStops: number;
    totalLanguages: number;
    lastUpdated: string;
}

// Tab definitions
type TabId = 'overview' | 'feeds' | 'keys' | 'webhooks' | 'testing';

interface Tab {
    id: TabId;
    name: string;
    icon: typeof Plug;
    status: 'active' | 'coming_soon';
}

const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: Activity, status: 'active' },
    { id: 'feeds', name: 'Feeds', icon: Rss, status: 'active' },
    { id: 'keys', name: 'API Keys', icon: Key, status: 'coming_soon' },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook, status: 'coming_soon' },
    { id: 'testing', name: 'Testing', icon: TestTube, status: 'coming_soon' },
];

export function ApiFeeds() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [tours, setTours] = useState<Tour[]>([]);
    const [stats, setStats] = useState<ApiStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load data
    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                setError(null);

                const response = await fetch('/api/tours');
                if (!response.ok) throw new Error('Failed to load tours');
                const toursData = await response.json();
                setTours(toursData);

                // Calculate stats
                const languages = new Set<string>();
                let totalStops = 0;
                toursData.forEach((tour: Tour) => {
                    tour.languages?.forEach(lang => languages.add(lang));
                    totalStops += tour.stops?.length || 0;
                });

                setStats({
                    totalTours: toursData.length,
                    publishedTours: toursData.filter((t: Tour) => t.status === 'published').length,
                    totalStops,
                    totalLanguages: languages.size,
                    lastUpdated: new Date().toISOString(),
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
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                        <Plug className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">API & Feeds</h1>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Manage tour data feeds and API access
                        </p>
                    </div>
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
                            {tab.status === 'coming_soon' && (
                                <Lock className="w-3 h-3 ml-1" />
                            )}
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
                    <FeedsTab tours={tours} />
                ) : (
                    <ComingSoonTab tab={tabs.find(t => t.id === activeTab)!} />
                )}
            </div>
        </div>
    );
}

// Overview Tab
function OverviewTab({ stats, tours }: { stats: ApiStats | null; tours: Tour[] }) {
    const baseUrl = window.location.origin;

    return (
        <div className="space-y-6">
            {/* API Status */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">API Status</h2>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm text-emerald-500 font-medium">Healthy</span>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    <StatCard label="Total Tours" value={stats?.totalTours || 0} icon={FileJson} />
                    <StatCard label="Published" value={stats?.publishedTours || 0} icon={Check} color="emerald" />
                    <StatCard label="Total Stops" value={stats?.totalStops || 0} icon={Activity} />
                    <StatCard label="Languages" value={stats?.totalLanguages || 0} icon={Plug} color="blue" />
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
                <div className="flex gap-3">
                    <CopyButton text={`${baseUrl}/api/feeds/tours`} label="Copy All Tours Feed URL" />
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors">
                        <Download className="w-4 h-4" />
                        Export All Tours
                    </button>
                    <a
                        href="/api/feeds/tours"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        View Raw Feed
                    </a>
                </div>
            </div>

            {/* Recent Tours */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Available Tours</h2>
                {tours.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        <FileJson className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No tours available yet</p>
                        <p className="text-sm">Create a tour to generate feeds</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tours.slice(0, 5).map((tour) => (
                            <div
                                key={tour.id}
                                className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${
                                        tour.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`} />
                                    <div>
                                        <p className="font-medium text-[var(--color-text-primary)]">{tour.title}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {tour.stops?.length || 0} stops • {tour.languages?.join(', ') || 'en'}
                                        </p>
                                    </div>
                                </div>
                                <CopyButton text={`${baseUrl}/api/feeds/tours/${tour.id}`} label="Copy URL" small />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Feeds Tab
function FeedsTab({ tours }: { tours: Tour[] }) {
    const [selectedFeed, setSelectedFeed] = useState<FeedInfo | null>(null);
    const [feedContent, setFeedContent] = useState<string | null>(null);
    const [isLoadingFeed, setIsLoadingFeed] = useState(false);
    const baseUrl = window.location.origin;

    // Generate feed list
    const feeds: FeedInfo[] = [
        {
            id: 'all-tours',
            name: 'All Tours Feed',
            url: `${baseUrl}/api/feeds/tours`,
            type: 'all-tours',
            lastUpdated: new Date().toISOString(),
        },
        ...tours.map(tour => ({
            id: tour.id,
            name: tour.title,
            url: `${baseUrl}/api/feeds/tours/${tour.id}`,
            type: 'single-tour' as const,
            tourId: tour.id,
            stopCount: tour.stops?.length || 0,
            languages: tour.languages,
            lastUpdated: tour.updatedAt,
        })),
    ];

    const handleViewFeed = async (feed: FeedInfo) => {
        setSelectedFeed(feed);
        setIsLoadingFeed(true);
        try {
            const response = await fetch(feed.url.replace(baseUrl, ''));
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
            {/* Query Parameters Info */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Query Parameters</h2>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    All feed endpoints support the following query parameters:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
                        <code className="text-sm text-blue-400">?lang=es</code>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Filter content to a specific language (e.g., es, fr, de)
                        </p>
                    </div>
                    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
                        <code className="text-sm text-purple-400">?format=compact</code>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Output format: full (default), compact, or minimal
                        </p>
                    </div>
                    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
                        <code className="text-sm text-emerald-400">?status=published</code>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Filter by tour status (published, draft, archived)
                        </p>
                    </div>
                    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
                        <code className="text-sm text-amber-400">?include_stops=false</code>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Exclude stops from response (default: true)
                        </p>
                    </div>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-4">
                    Example: <code className="text-[var(--color-text-secondary)]">/api/feeds/tours?lang=es&format=compact&status=published</code>
                </p>
            </div>

            {/* Feed List */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Available Feeds</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">{feeds.length} feeds available</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                <div className="space-y-2">
                    {feeds.map((feed) => (
                        <div
                            key={feed.id}
                            className="flex items-center justify-between p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    feed.type === 'all-tours'
                                        ? 'bg-blue-500/20'
                                        : 'bg-purple-500/20'
                                }`}>
                                    {feed.type === 'all-tours' ? (
                                        <Rss className="w-5 h-5 text-blue-500" />
                                    ) : (
                                        <FileJson className="w-5 h-5 text-purple-500" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-[var(--color-text-primary)]">{feed.name}</p>
                                    <p className="text-xs text-[var(--color-text-muted)] font-mono">
                                        {feed.url.replace(baseUrl, '')}
                                    </p>
                                    {feed.type === 'single-tour' && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                                {feed.stopCount} stops
                                            </span>
                                            {feed.languages?.map(lang => (
                                                <span key={lang} className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                                    {lang.toUpperCase()}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleViewFeed(feed)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <CopyButton text={feed.url} label="Copy" small />
                                <a
                                    href={feed.url.replace(baseUrl, '')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feed Preview Modal */}
            {selectedFeed && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col border border-[var(--color-border-default)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)]">
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Feed Preview: {selectedFeed.name}
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)] font-mono">
                                    {selectedFeed.url.replace(baseUrl, '')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <CopyButton text={feedContent || ''} label="Copy JSON" />
                                <button
                                    onClick={() => setSelectedFeed(null)}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-auto p-4">
                            {isLoadingFeed ? (
                                <div className="flex items-center justify-center h-64">
                                    <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-text-muted)]" />
                                </div>
                            ) : (
                                <pre className="text-sm text-[var(--color-text-secondary)] font-mono whitespace-pre-wrap bg-[var(--color-bg-elevated)] p-4 rounded-lg overflow-auto">
                                    {feedContent}
                                </pre>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between p-4 border-t border-[var(--color-border-default)]">
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Size: {feedContent ? `${(feedContent.length / 1024).toFixed(1)} KB` : '—'}
                            </p>
                            <div className="flex gap-2">
                                <a
                                    href={selectedFeed.url.replace(baseUrl, '')}
                                    download={`${selectedFeed.id}.json`}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </a>
                                <button
                                    onClick={() => setSelectedFeed(null)}
                                    className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Coming Soon Tab
function ComingSoonTab({ tab }: { tab: Tab }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] flex items-center justify-center">
                <Lock className="w-8 h-8 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {tab.name}
            </h2>
            <p className="text-[var(--color-text-muted)] text-center max-w-md">
                {tab.id === 'keys' && 'API key management for secure access to your tour feeds.'}
                {tab.id === 'webhooks' && 'Configure webhooks to receive notifications when tours are updated.'}
                {tab.id === 'testing' && 'Test API endpoints and preview responses in real-time.'}
            </p>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-sm font-medium">
                Coming Soon
            </span>
        </div>
    );
}

// Stat Card Component
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
        <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
                </div>
            </div>
        </div>
    );
}

// Copy Button Component
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
                small
                    ? 'px-3 py-1.5 text-sm'
                    : 'px-4 py-2.5'
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
