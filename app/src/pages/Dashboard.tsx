import {
    Plus,
    MapPin,
    Eye,
    Clock,
    TrendingUp,
    Layers,
    Globe,
    QrCode
} from 'lucide-react';

// Stat card data
const stats = [
    { label: 'Total Tours', value: '0', icon: MapPin, trend: null },
    { label: 'Active Stops', value: '0', icon: Eye, trend: null },
    { label: 'Languages', value: '0', icon: Globe, trend: null },
    { label: 'Templates', value: '8', icon: Layers, trend: null },
];

// Quick actions
const quickActions = [
    { label: 'Create New Tour', icon: Plus, color: 'primary' },
    { label: 'Generate QR Codes', icon: QrCode, color: 'secondary' },
    { label: 'View Analytics', icon: TrendingUp, color: 'tertiary' },
];

export function Dashboard() {
    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Welcome to <span className="text-gradient">TourStack</span>
                </h1>
                <p className="mt-2 text-[var(--color-text-secondary)]">
                    Create interactive museum tours with any positioning technology
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 hover:border-[var(--color-border-hover)] transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-[var(--color-text-muted)]">{stat.label}</p>
                                <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{stat.value}</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-elevated)] flex items-center justify-center">
                                <stat.icon className="w-5 h-5 text-[var(--color-accent-primary)]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.map((action) => (
                        <button
                            key={action.label}
                            className={`flex items-center gap-4 p-5 rounded-xl border transition-all hover:scale-[1.02] ${action.color === 'primary'
                                    ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/30 hover:border-[var(--color-accent-primary)]'
                                    : action.color === 'secondary'
                                        ? 'bg-[var(--color-accent-secondary)]/10 border-[var(--color-accent-secondary)]/30 hover:border-[var(--color-accent-secondary)]'
                                        : 'bg-[var(--color-accent-tertiary)]/10 border-[var(--color-accent-tertiary)]/30 hover:border-[var(--color-accent-tertiary)]'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color === 'primary'
                                    ? 'bg-[var(--color-accent-primary)]/20'
                                    : action.color === 'secondary'
                                        ? 'bg-[var(--color-accent-secondary)]/20'
                                        : 'bg-[var(--color-accent-tertiary)]/20'
                                }`}>
                                <action.icon className={`w-6 h-6 ${action.color === 'primary'
                                        ? 'text-[var(--color-accent-primary)]'
                                        : action.color === 'secondary'
                                            ? 'text-[var(--color-accent-secondary)]'
                                            : 'text-[var(--color-accent-tertiary)]'
                                    }`} />
                            </div>
                            <span className="font-medium text-[var(--color-text-primary)]">{action.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Getting Started */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[var(--color-accent-secondary)]" />
                    Getting Started
                </h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[var(--color-accent-primary)]">1</span>
                        </div>
                        <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">Choose a Template</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Select from Artwork, Artifact, Science, Nature, or create custom</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent-secondary)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[var(--color-accent-secondary)]">2</span>
                        </div>
                        <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">Create Your Tour</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Add title, hero image, and description for your museum tour</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-accent-tertiary)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[var(--color-accent-tertiary)]">3</span>
                        </div>
                        <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">Add Tour Stops</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Configure positioning (QR, GPS, Beacons, NFC) and rich content</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-success)]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[var(--color-success)]">4</span>
                        </div>
                        <div>
                            <h3 className="font-medium text-[var(--color-text-primary)]">Export & Deploy</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">Generate JSON for apps, print QR codes, and go live!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
