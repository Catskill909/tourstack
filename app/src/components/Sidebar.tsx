import { NavLink } from 'react-router-dom';
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
    LayoutGrid
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tours', icon: MapPin, label: 'Tours' },
    { to: '/collections', icon: LayoutGrid, label: 'Collections' },
    { to: '/templates', icon: Layers, label: 'Templates' },
    { to: '/media', icon: FolderOpen, label: 'Media Library' },
    { to: '/languages', icon: Globe, label: 'Languages' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/tools', icon: QrCode, label: 'Tools' },
];

const bottomNavItems = [
    { to: '/settings', icon: Settings, label: 'Settings' },
    { to: '/help', icon: HelpCircle, label: 'Help' },
];

export function Sidebar() {
    return (
        <aside className="w-64 bg-[var(--color-bg-surface)] border-r border-[var(--color-border-default)] flex flex-col">
            {/* Logo */}
            <div className="h-28 flex items-center px-6 border-b border-[var(--color-border-default)]">
                <div className="flex items-center justify-center w-full">
                    <img src="/tourstack-logo.png" alt="TourStack" className="h-24 w-auto" />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div className="py-4 px-3 border-t border-[var(--color-border-default)] space-y-1">
                {bottomNavItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]'
                            }`
                        }
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </aside>
    );
}
