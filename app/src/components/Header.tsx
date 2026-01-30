import { Bell, Search, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';

export function Header() {
    const navigate = useNavigate();
    const { logout } = useAuthStore();

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <header className="h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border-default)] flex items-center justify-between px-6">
            {/* Search */}
            <div className="flex-1 max-w-xl">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        placeholder="Search tours, stops, media..."
                        className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all"
                    />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4 ml-6">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors">
                    <Bell className="w-5 h-5 text-[var(--color-text-secondary)]" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-accent-tertiary)] rounded-full" />
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3 p-2 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                        <User className="w-4 h-4 text-[var(--color-bg-primary)]" />
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-secondary)]">Admin</span>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
