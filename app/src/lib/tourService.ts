/**
 * Tour Service - Data access layer for Tour CRUD operations
 * 
 * NOTE: This is a client-side mock service for development.
 * In production, this would call API endpoints that use Prisma on the server.
 * We're using localStorage for persistence during development.
 */

import type { Tour, Template, TourStatus, Difficulty, PositioningMethod } from '../types';

// Storage keys
const TOURS_STORAGE_KEY = 'tourstack_tours';

// Built-in templates based on positioning technology
const builtInTemplates: Template[] = [
    {
        id: 'tpl_qr_code',
        name: 'QR Code',
        description: 'Zero hardware cost. Visitors scan codes with their camera. Perfect for getting started quickly.',
        icon: '📱',
        builtIn: true,
        customFields: [
            { id: 'qrSize', name: 'qrSize', label: 'QR Code Size', type: 'text', required: false },
            { id: 'placement', name: 'placement', label: 'Placement Notes', type: 'textarea', required: false },
            { id: 'shortCode', name: 'shortCode', label: 'Short URL Code', type: 'text', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_gps',
        name: 'GPS / Lat-Long',
        description: 'For outdoor exhibits, sculpture gardens, and archaeological sites. Uses device GPS with geofencing.',
        icon: '📍',
        builtIn: true,
        customFields: [
            { id: 'latitude', name: 'latitude', label: 'Latitude', type: 'number', required: true },
            { id: 'longitude', name: 'longitude', label: 'Longitude', type: 'number', required: true },
            { id: 'radius', name: 'radius', label: 'Trigger Radius (meters)', type: 'number', required: true, unit: 'm' },
            { id: 'elevation', name: 'elevation', label: 'Elevation', type: 'number', required: false, unit: 'm' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_ble_beacon',
        name: 'BLE Beacon',
        description: 'Indoor positioning using Bluetooth Low Energy beacons. ±1.5-3 meter accuracy with triangulation.',
        icon: '📶',
        builtIn: true,
        customFields: [
            { id: 'uuid', name: 'uuid', label: 'Beacon UUID', type: 'text', required: true },
            { id: 'major', name: 'major', label: 'Major Value', type: 'number', required: true },
            { id: 'minor', name: 'minor', label: 'Minor Value', type: 'number', required: true },
            { id: 'txPower', name: 'txPower', label: 'TX Power', type: 'number', required: false },
            { id: 'triggerRadius', name: 'triggerRadius', label: 'Trigger Radius (m)', type: 'number', required: false, unit: 'm' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_nfc',
        name: 'NFC',
        description: 'Tap-to-trigger with Near Field Communication. Ultra-short range, no battery, very cost-effective.',
        icon: '📲',
        builtIn: true,
        customFields: [
            { id: 'tagId', name: 'tagId', label: 'NFC Tag ID', type: 'text', required: true },
            { id: 'tagType', name: 'tagType', label: 'Tag Type', type: 'text', required: false },
            { id: 'tapInstructions', name: 'tapInstructions', label: 'Tap Instructions', type: 'textarea', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_rfid',
        name: 'RFID',
        description: 'Radio Frequency Identification for medium-range tracking. Great for artifact tracking + triggers.',
        icon: '🔖',
        builtIn: true,
        customFields: [
            { id: 'tagId', name: 'tagId', label: 'RFID Tag ID', type: 'text', required: true },
            { id: 'frequency', name: 'frequency', label: 'Frequency (LF/HF/UHF)', type: 'text', required: false },
            { id: 'isActive', name: 'isActive', label: 'Active Tag?', type: 'text', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_wifi',
        name: 'WiFi Positioning',
        description: 'Uses existing WiFi infrastructure for triangulation. 5-15m accuracy, lower cost if WiFi installed.',
        icon: '📡',
        builtIn: true,
        customFields: [
            { id: 'accessPoints', name: 'accessPoints', label: 'Access Point BSSIDs', type: 'textarea', required: true },
            { id: 'signalThreshold', name: 'signalThreshold', label: 'Signal Threshold (dBm)', type: 'number', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_uwb',
        name: 'Ultra-Wideband (UWB)',
        description: 'Highest accuracy at ±10-50cm. Real-time positioning for premium installations.',
        icon: '🎯',
        builtIn: true,
        customFields: [
            { id: 'anchorId', name: 'anchorId', label: 'UWB Anchor ID', type: 'text', required: true },
            { id: 'xCoord', name: 'xCoord', label: 'X Coordinate', type: 'number', required: true },
            { id: 'yCoord', name: 'yCoord', label: 'Y Coordinate', type: 'number', required: true },
            { id: 'zCoord', name: 'zCoord', label: 'Z Coordinate', type: 'number', required: false },
            { id: 'radius', name: 'radius', label: 'Trigger Radius (cm)', type: 'number', required: false, unit: 'cm' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

// Helper to generate unique IDs
function generateId(): string {
    return `tour_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load tours from localStorage
function loadTours(): Tour[] {
    try {
        const stored = localStorage.getItem(TOURS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Save tours to localStorage
function saveTours(tours: Tour[]): void {
    localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
}

export const tourService = {
    /**
     * Get all tours
     */
    async getAllTours(): Promise<Tour[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return loadTours();
    },

    /**
     * Get a single tour by ID
     */
    async getTourById(id: string): Promise<Tour | null> {
        await new Promise(resolve => setTimeout(resolve, 100));
        const tours = loadTours();
        return tours.find(t => t.id === id) || null;
    },

    /**
     * Create a new tour
     */
    async createTour(data: Partial<Tour>): Promise<Tour> {
        await new Promise(resolve => setTimeout(resolve, 300));

        const now = new Date().toISOString();
        const newTour: Tour = {
            id: generateId(),
            museumId: 'default_museum',
            templateId: data.templateId || 'tpl_qr_code',
            status: 'draft' as TourStatus,
            title: data.title || { en: 'Untitled Tour' },
            heroImage: data.heroImage || '',
            description: data.description || { en: '' },
            languages: data.languages || ['en'],
            primaryLanguage: data.primaryLanguage || 'en',
            duration: data.duration || 30,
            difficulty: (data.difficulty || 'general') as Difficulty,
            primaryPositioningMethod: (data.primaryPositioningMethod || 'qr_code') as PositioningMethod,
            backupPositioningMethod: data.backupPositioningMethod as PositioningMethod | undefined,
            accessibility: data.accessibility || {
                wheelchairAccessible: true,
                audioDescriptions: false,
                signLanguage: false,
                tactileElements: false,
                quietSpaceFriendly: false,
            },
            stops: [],
            version: 1,
            createdAt: now,
            updatedAt: now,
        };

        const tours = loadTours();
        tours.unshift(newTour);
        saveTours(tours);

        return newTour;
    },

    /**
     * Update an existing tour
     */
    async updateTour(id: string, data: Partial<Tour>): Promise<Tour> {
        await new Promise(resolve => setTimeout(resolve, 200));

        const tours = loadTours();
        const index = tours.findIndex(t => t.id === id);

        if (index === -1) {
            throw new Error('Tour not found');
        }

        const updatedTour: Tour = {
            ...tours[index],
            ...data,
            updatedAt: new Date().toISOString(),
        };

        tours[index] = updatedTour;
        saveTours(tours);

        return updatedTour;
    },

    /**
     * Delete a tour
     */
    async deleteTour(id: string): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, 200));

        const tours = loadTours();
        const filtered = tours.filter(t => t.id !== id);
        saveTours(filtered);
    },

    /**
     * Get all available templates
     */
    async getTemplates(): Promise<Template[]> {
        await new Promise(resolve => setTimeout(resolve, 100));
        return builtInTemplates;
    },

    /**
     * Duplicate a tour
     */
    async duplicateTour(id: string): Promise<Tour> {
        const original = await this.getTourById(id);
        if (!original) {
            throw new Error('Tour not found');
        }

        const title = { ...original.title };
        // Add "Copy" suffix to title in all languages
        Object.keys(title).forEach(lang => {
            title[lang] = `${title[lang]} (Copy)`;
        });

        return this.createTour({
            ...original,
            id: undefined,
            title,
            status: 'draft',
        });
    },

    /**
     * Update tour status
     */
    async updateStatus(id: string, status: TourStatus): Promise<Tour> {
        const tour = await this.getTourById(id);
        if (!tour) {
            throw new Error('Tour not found');
        }

        const updates: Partial<Tour> = { status };

        if (status === 'published' && !tour.publishedAt) {
            updates.publishedAt = new Date().toISOString();
        }

        return this.updateTour(id, updates);
    },
};
