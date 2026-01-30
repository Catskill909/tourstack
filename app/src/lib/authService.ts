/**
 * Authentication Service
 *
 * Handles authentication API calls for login, logout, and session checking.
 */

const API_BASE = '/api';

export interface AuthStatus {
    isAuthenticated: boolean;
    loginTime: number | null;
}

export const authService = {
    /**
     * Login with password
     */
    async login(password: string): Promise<{ success: boolean }> {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password }),
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    },

    /**
     * Logout and destroy session
     */
    async logout(): Promise<void> {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
    },

    /**
     * Check current authentication status
     */
    async checkAuth(): Promise<AuthStatus> {
        const response = await fetch(`${API_BASE}/auth/check`, {
            credentials: 'include',
        });
        return response.json();
    },
};
