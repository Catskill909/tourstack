/**
 * Authentication Middleware for TourStack
 *
 * Provides session-based authentication using express-session.
 * Password is configured via ADMIN_PASSWORD environment variable.
 */

import session from 'express-session';
import BetterSqlite3 from 'better-sqlite3';
import BetterSqlite3StoreFactory from 'better-sqlite3-session-store';
import crypto from 'crypto';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';

const BetterSqlite3Store = BetterSqlite3StoreFactory(session);

// Extend session type to include our custom properties
declare module 'express-session' {
    interface SessionData {
        isAuthenticated: boolean;
        loginTime: number;
    }
}

/**
 * Generate a default session secret with warning
 */
function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        console.warn('⚠️  WARNING: SESSION_SECRET not set. Using generated secret (sessions will not persist across restarts).');
        return crypto.randomBytes(32).toString('hex');
    }
    return secret;
}

/**
 * Get admin password from environment
 */
export function getAdminPassword(): string {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        console.warn('⚠️  WARNING: ADMIN_PASSWORD not set. Using "admin" as default (NOT SECURE FOR PRODUCTION).');
        return 'admin';
    }
    return password;
}

/**
 * Session middleware configuration
 */
// Store sessions in a separate SQLite database (NOT the main app database)
const dbDir = process.env.DATABASE_URL
    ? process.env.DATABASE_URL.replace('file:', '').replace(/\/[^/]+$/, '')
    : path.join(process.cwd(), 'data');
const sessionDb = new BetterSqlite3(path.join(dbDir, 'sessions.db'));

export const sessionMiddleware = session({
    store: new BetterSqlite3Store({
        client: sessionDb,
        expired: {
            clear: true,
            intervalMs: 15 * 60 * 1000, // Clear expired sessions every 15 min
        },
    }),
    secret: getSessionSecret(),
    resave: false,
    saveUninitialized: false,
    proxy: process.env.NODE_ENV === 'production', // Trust reverse proxy (Coolify)
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
    name: 'tourstack.sid',
});

/**
 * Middleware to require authentication for protected routes
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    if (req.session?.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}
