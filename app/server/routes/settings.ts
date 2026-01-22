// Settings API routes
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Settings file path
const SETTINGS_FILE = path.join(__dirname, '../../data/settings.json');

// Ensure data directory exists
const dataDir = path.dirname(SETTINGS_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Default settings - merge with env vars for production
const DEFAULT_SETTINGS = {
    maps: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        googleMapsEnabled: !!process.env.GOOGLE_MAPS_API_KEY,
        openStreetMapEnabled: true,
        defaultMapProvider: process.env.GOOGLE_MAPS_API_KEY ? 'google' : 'openstreetmap',
    },
    positioning: {
        estimoteKey: '',
        kontaktKey: '',
    },
    transcription: {
        deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
        deepgramEnabled: !!process.env.DEEPGRAM_API_KEY,
        whisperEnabled: false,
        whisperEndpoint: '',
        elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
        elevenLabsEnabled: !!process.env.ELEVENLABS_API_KEY,
        defaultProvider: process.env.DEEPGRAM_API_KEY ? 'deepgram' : 'none',
    },
    translation: {
        libreTranslateUrl: 'https://translate.supersoul.top/translate',
        libreTranslateApiKey: '',
        libreTranslateEnabled: true,
        deepgramEnabled: false,
        defaultProvider: 'libretranslate', // 'libretranslate' | 'deepgram'
    },
    general: {
        defaultLanguage: 'en',
        analyticsEnabled: true,
    },
};

// Load settings from file, with env var overrides for production
function loadSettings() {
    let settings = { ...DEFAULT_SETTINGS };
    
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
            const fileSettings = JSON.parse(data);
            settings = { ...settings, ...fileSettings };
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
    
    // Env vars always override file settings (for Coolify production)
    if (process.env.GOOGLE_MAPS_API_KEY) {
        settings.maps.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        settings.maps.googleMapsEnabled = true;
    }
    
    if (process.env.DEEPGRAM_API_KEY) {
        settings.transcription.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
        settings.transcription.deepgramEnabled = true;
    }
    
    if (process.env.ELEVENLABS_API_KEY) {
        settings.transcription.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
        settings.transcription.elevenLabsEnabled = true;
    }
    
    return settings;
}

// Save settings to file
function saveSettings(settings: typeof DEFAULT_SETTINGS) {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        return false;
    }
}

// GET /api/settings - Get all settings
router.get('/', (_req, res) => {
    const settings = loadSettings();
    res.json(settings);
});

// PUT /api/settings - Update all settings
router.put('/', (req, res) => {
    const currentSettings = loadSettings();
    const newSettings = { ...currentSettings, ...req.body };
    
    if (saveSettings(newSettings)) {
        res.json({ success: true, settings: newSettings });
    } else {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

// PATCH /api/settings/:section - Update a specific section
router.patch('/:section', (req, res) => {
    const { section } = req.params;
    const currentSettings = loadSettings();
    
    if (!(section in currentSettings)) {
        return res.status(400).json({ error: `Unknown section: ${section}` });
    }
    
    (currentSettings as Record<string, unknown>)[section] = {
        ...(currentSettings as Record<string, unknown>)[section] as object,
        ...req.body,
    };
    
    if (saveSettings(currentSettings)) {
        res.json({ success: true, settings: currentSettings });
    } else {
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;
