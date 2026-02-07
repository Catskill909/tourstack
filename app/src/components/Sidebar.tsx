import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    MapPin,
    FolderOpen,
    Settings,
    HelpCircle,
    Layers,
    Globe,
    BarChart3,
    QrCode,
    LayoutGrid,
    Volume2,
    Plug,
    Sparkles,
    Bot,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { useUnsavedChangesStore } from '../stores/useUnsavedChangesStore';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tours', icon: MapPin, label: 'Tours' },
    { to: '/collections', icon: LayoutGrid, label: 'Collections' },
    { to: '/templates', icon: Layers, label: 'Templates' },
    { to: '/media', icon: FolderOpen, label: 'Media Library' },
    { to: '/languages', icon: Globe, label: 'Languages' },
    { to: '/audio', icon: Volume2, label: 'Audio TTS' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/api', icon: Plug, label: 'API & Feeds' },
    { to: '/tools', icon: QrCode, label: 'Tools' },
    { to: '/ai-assistance', icon: Sparkles, label: 'AI Assistance' },
    { to: '/concierge', icon: Bot, label: 'AI Concierge' },
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/docs', icon: HelpCircle, label: 'Help & Docs' },
];

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDirty, setDirty } = useUnsavedChangesStore();
    const [pendingPath, setPendingPath] = useState<string | null>(null);

    const handleNavClick = (e: React.MouseEvent, to: string) => {
        // If we're already on this path, let it through
        if (location.pathname === to) return;

        if (isDirty) {
            e.preventDefault();
            setPendingPath(to);
        }
    };

    const handleDiscard = () => {
        setDirty(false);
        const path = pendingPath;
        setPendingPath(null);
        if (path) {
            navigate(path);
        }
    };

    return (
        <>
            <aside
                className={`
                    relative bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)]
                    flex flex-col transition-all duration-300 ease-in-out
                    ${isCollapsed ? 'w-[72px]' : 'w-64'}
                `}
            >
                {/* Collapse Handle - Material Design Style */}
                <button
                    onClick={onToggle}
                    className="
                        absolute -right-3 top-1/2 -translate-y-1/2 z-50
                        w-6 h-12
                        bg-[var(--color-bg-elevated)]
                        hover:bg-[var(--color-bg-hover)]
                        border border-[var(--color-border-default)]
                        hover:border-[var(--color-accent-primary)]/50
                        rounded-full
                        flex items-center justify-center
                        transition-all duration-200
                        shadow-lg shadow-black/30
                        hover:shadow-xl hover:shadow-black/40
                        group
                    "
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)] transition-colors" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-primary)] transition-colors" />
                    )}
                </button>

                {/* Logo */}
                <div className={`h-28 flex items-center border-b border-[var(--color-border-default)] ${isCollapsed ? 'px-3 justify-center' : 'px-6'}`}>
                    <div className="flex items-center justify-center w-full overflow-hidden">
                        <img
                            src="/tourstack-logo.png"
                            alt="TourStack"
                            className={`object-contain transition-all duration-300 ${isCollapsed ? 'h-12 w-12' : 'h-24 w-auto'}`}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 py-4 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {navItems.map((item) => {
                        const linkContent = (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={(e) => handleNavClick(e, item.to)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 py-2.5 rounded-lg transition-all duration-200 ${isCollapsed ? 'px-2.5 justify-center' : 'px-3'
                                    } ${isActive
                                        ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!isCollapsed && (
                                    <span className="font-medium whitespace-nowrap overflow-hidden">{item.label}</span>
                                )}
                            </NavLink>
                        );

                        if (isCollapsed) {
                            return (
                                <Tooltip key={item.to} content={item.label} side="right">
                                    {linkContent}
                                </Tooltip>
                            );
                        }

                        return <div key={item.to}>{linkContent}</div>;
                    })}
                </nav>

            </aside>

            {/* Unsaved Changes Modal */}
            <ConfirmationModal
                isOpen={pendingPath !== null}
                onClose={() => setPendingPath(null)}
                onConfirm={handleDiscard}
                title="Unsaved Changes"
                message="You have unsaved changes that will be lost if you leave this page. Would you like to discard your changes?"
                confirmText="Discard Changes"
                cancelText="Stay on Page"
                variant="warning"
            />
        </>
    );
}
