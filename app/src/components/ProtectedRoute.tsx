/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Shows loading state while checking auth, redirects to login if not authenticated.
 */

import { type ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';

interface ProtectedRouteProps {
    children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    // Check auth status on mount
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-white/60 mx-auto mb-4" />
                    <p className="text-[#737373]">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}
