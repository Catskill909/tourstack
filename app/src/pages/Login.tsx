/**
 * Login Page
 *
 * Simple, clean dark mode Material Design login page with password field.
 */

import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import logo from '../assets/tourstack-logo.png';

export function Login() {
    const navigate = useNavigate();
    const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Clear error when password changes
    useEffect(() => {
        if (error) clearError();
    }, [password, clearError, error]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const success = await login(password);
        if (success) {
            navigate('/', { replace: true });
        }
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="flex justify-center mb-12">
                    <img
                        src={logo}
                        alt="TourStack"
                        className="h-40 w-auto"
                    />
                </div>

                {/* Login Card */}
                <div className="bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-5">
                            <Lock className="w-8 h-8 text-white/80" />
                        </div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">
                            Admin Login
                        </h1>
                        <p className="text-sm text-[#737373] mt-2">
                            Enter your password to continue
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Password Field */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[#a3a3a3] mb-2"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    autoFocus
                                    disabled={isLoading}
                                    className="w-full px-4 py-3.5 bg-[#0a0a0a] border border-[#333333] rounded-xl text-white placeholder:text-[#525252] focus:border-white/40 focus:ring-1 focus:ring-white/40 focus:outline-none transition-all pr-12 disabled:opacity-50 font-medium"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#525252] hover:text-white/70 transition-colors p-1"
                                    tabIndex={-1}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-sm text-red-400 font-medium">
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-[#525252] mt-8">
                    TourStack Admin Panel
                </p>
            </div>
        </div>
    );
}
