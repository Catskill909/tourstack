/**
 * Authentication Store
 *
 * Zustand store for managing authentication state.
 */

import { create } from 'zustand';
import { authService } from '../lib/authService';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    loginTime: number | null;
}

interface AuthActions {
    checkAuth: () => Promise<void>;
    login: (password: string) => Promise<boolean>;
    logout: () => Promise<void>;
    clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
    // State
    isAuthenticated: false,
    isLoading: true, // Start loading until we check auth
    error: null,
    loginTime: null,

    // Actions
    checkAuth: async () => {
        set({ isLoading: true });
        try {
            const status = await authService.checkAuth();
            set({
                isAuthenticated: status.isAuthenticated,
                loginTime: status.loginTime,
                isLoading: false,
            });
        } catch {
            set({ isAuthenticated: false, isLoading: false });
        }
    },

    login: async (password: string) => {
        set({ isLoading: true, error: null });
        try {
            await authService.login(password);
            set({
                isAuthenticated: true,
                loginTime: Date.now(),
                isLoading: false,
            });
            return true;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Login failed',
                isLoading: false,
            });
            return false;
        }
    },

    logout: async () => {
        await authService.logout();
        set({
            isAuthenticated: false,
            loginTime: null,
        });
    },

    clearError: () => set({ error: null }),
}));
