/**
 * Authentication Routes for TourStack
 *
 * Provides login, logout, and auth status check endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAdminPassword } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate with password
 */
router.post('/login', (req: Request, res: Response) => {
    const { password } = req.body;

    if (!password) {
        res.status(400).json({ error: 'Password required' });
        return;
    }

    if (password === getAdminPassword()) {
        req.session.isAuthenticated = true;
        req.session.loginTime = Date.now();
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

/**
 * POST /api/auth/logout
 * End the current session
 */
router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Failed to logout' });
            return;
        }
        res.clearCookie('tourstack.sid');
        res.json({ success: true });
    });
});

/**
 * GET /api/auth/check
 * Check current authentication status
 */
router.get('/check', (req: Request, res: Response) => {
    res.json({
        isAuthenticated: !!req.session?.isAuthenticated,
        loginTime: req.session?.loginTime || null,
    });
});

export default router;
