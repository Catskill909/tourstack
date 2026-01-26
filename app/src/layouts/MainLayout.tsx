import { useState, useEffect, type ReactNode } from 'react';
import { Sidebar } from '../components/Sidebar.tsx';
import { Header } from '../components/Header.tsx';

interface MainLayoutProps {
    children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'tourstack-sidebar-collapsed';

export function MainLayout({ children }: MainLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        // Initialize from localStorage
        const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        return saved === 'true';
    });

    // Persist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
    }, [isSidebarCollapsed]);

    const handleToggleSidebar = () => {
        setIsSidebarCollapsed(prev => !prev);
    };

    return (
        <div className="flex h-screen bg-[var(--color-bg-primary)]">
            {/* Sidebar */}
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
