// TourStack Express API Server
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/tours', toursRouter);
app.use('/api/stops', stopsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/media', mediaRouter);
app.use('/api/translate', translateRouter);
app.use('/api/transcribe', transcribeRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/audio', audioRouter);
app.use('/api/elevenlabs', elevenlabsRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
