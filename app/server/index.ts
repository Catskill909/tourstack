// TourStack Express API Server
import 'dotenv/config';
import express from 'express';
// TourStack Server Entry Point - Trigger Fresh Build
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import toursRouter from './routes/tours.js';
import stopsRouter from './routes/stops.js';
import templatesRouter from './routes/templates.js';
import mediaRouter from './routes/media.js';
import translateRouter from './routes/translate.js';
import transcribeRouter from './routes/transcribe.js';
import settingsRouter from './routes/settings.js';
import audioRouter from './routes/audio.js';
import elevenlabsRouter from './routes/elevenlabs.js';
import feedsRouter from './routes/feeds.js';
import collectionsRouter from './routes/collections.js';
import visitorRouter from './routes/visitor.js';
import visionRouter from './routes/vision.js';
import geminiRouter from './routes/gemini.js';
import googleTranslateRouter from './routes/google-translate.js';
import chatRouter from './routes/chat.js';
import documentsRouter from './routes/documents.js';
import authRouter from './routes/auth.js';
import { sessionMiddleware, requireAuth } from './middleware/auth.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy (Coolify/nginx) for secure cookies
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middleware
app.use(cors({
    origin: true,
    credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(sessionMiddleware);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public API routes (no auth required)
app.use('/api/auth', authRouter);
app.use('/api/visitor', visitorRouter);
app.use('/api/chat', chatRouter); // Museum concierge - public for visitors

// Health check (public)
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected API routes (auth required)
app.use('/api/tours', requireAuth, toursRouter);
app.use('/api/stops', requireAuth, stopsRouter);
app.use('/api/templates', requireAuth, templatesRouter);
app.use('/api/media', requireAuth, mediaRouter);
app.use('/api/translate', requireAuth, translateRouter);
app.use('/api/transcribe', requireAuth, transcribeRouter);
app.use('/api/settings', requireAuth, settingsRouter);
app.use('/api/audio', requireAuth, audioRouter);
app.use('/api/elevenlabs', requireAuth, elevenlabsRouter);
app.use('/api/feeds', requireAuth, feedsRouter);
app.use('/api/collections', requireAuth, collectionsRouter);
app.use('/api/vision', requireAuth, visionRouter);
app.use('/api/gemini', requireAuth, geminiRouter);
app.use('/api/documents', requireAuth, documentsRouter);
app.use('/api/google-translate', requireAuth, googleTranslateRouter);

// In production, serve the built frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));

    // SPA fallback - serve index.html for all non-API routes
    // Express 5 requires named parameter syntax for wildcards
    app.get('/{*splat}', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile(path.join(__dirname, '../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`🚀 TourStack API server running on http://localhost:${PORT}`);
    console.log(`📁 Uploads served from /uploads`);
});
