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

// Built-in templates (matches prisma/seed.ts)
const builtInTemplates: Template[] = [
    {
        id: 'tpl_artwork',
        name: 'Artwork',
        description: 'Perfect for art museums and galleries. Includes fields for artist, medium, dimensions, and provenance.',
        icon: '🎨',
        builtIn: true,
        customFields: [
            { id: 'artist', name: 'artist', label: 'Artist', type: 'text', required: true },
            { id: 'year', name: 'year', label: 'Year Created', type: 'number', required: false, unit: 'year' },
            { id: 'medium', name: 'medium', label: 'Medium', type: 'text', required: false },
            { id: 'dimensions', name: 'dimensions', label: 'Dimensions', type: 'text', required: false },
            { id: 'provenance', name: 'provenance', label: 'Provenance', type: 'textarea', required: false },
            { id: 'movement', name: 'movement', label: 'Art Movement', type: 'text', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_artifact',
        name: 'Artifact',
        description: 'For historical and archaeological museums. Includes fields for era, origin, and historical context.',
        icon: '🏺',
        builtIn: true,
        customFields: [
            { id: 'era', name: 'era', label: 'Era/Period', type: 'text', required: true },
            { id: 'origin', name: 'origin', label: 'Place of Origin', type: 'text', required: true },
            { id: 'material', name: 'material', label: 'Material', type: 'text', required: false },
            { id: 'discovered', name: 'discovered', label: 'Date Discovered', type: 'date', required: false },
            { id: 'context', name: 'context', label: 'Historical Context', type: 'richtext', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_natural_history',
        name: 'Natural History',
        description: 'For natural history and science museums. Includes fields for species, habitat, and conservation status.',
        icon: '🦖',
        builtIn: true,
        customFields: [
            { id: 'species', name: 'species', label: 'Species Name', type: 'text', required: true },
            { id: 'scientificName', name: 'scientificName', label: 'Scientific Name', type: 'text', required: true },
            { id: 'habitat', name: 'habitat', label: 'Habitat', type: 'text', required: false },
            { id: 'conservationStatus', name: 'conservationStatus', label: 'Conservation Status', type: 'text', required: false },
            { id: 'funFacts', name: 'funFacts', label: 'Fun Facts', type: 'list', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_science',
        name: 'Interactive Science',
        description: 'For science centers with hands-on exhibits. Includes fields for experiments and learning objectives.',
        icon: '🔬',
        builtIn: true,
        customFields: [
            { id: 'concept', name: 'concept', label: 'Scientific Concept', type: 'text', required: true },
            { id: 'instructions', name: 'instructions', label: 'How to Use', type: 'richtext', required: true },
            { id: 'learningObjectives', name: 'learningObjectives', label: 'Learning Objectives', type: 'list', required: false },
            { id: 'ageRange', name: 'ageRange', label: 'Recommended Age', type: 'text', required: false },
            { id: 'quiz', name: 'quiz', label: 'Quiz Question', type: 'quiz', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_historic',
        name: 'Historic Site',
        description: 'For outdoor historic sites and walking tours. Includes GPS and historical event fields.',
        icon: '🏛️',
        builtIn: true,
        customFields: [
            { id: 'historicalEvent', name: 'historicalEvent', label: 'Historical Event', type: 'text', required: false },
            { id: 'date', name: 'date', label: 'Date', type: 'text', required: false },
            { id: 'significance', name: 'significance', label: 'Historical Significance', type: 'richtext', required: true },
            { id: 'thenAndNow', name: 'thenAndNow', label: 'Then & Now', type: 'textarea', required: false },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'tpl_botanical',
        name: 'Botanical Garden',
        description: 'For botanical gardens and arboretums. Includes fields for plant species and care information.',
        icon: '🌿',
        builtIn: true,
        customFields: [
            { id: 'commonName', name: 'commonName', label: 'Common Name', type: 'text', required: true },
            { id: 'scientificName', name: 'scientificName', label: 'Scientific Name', type: 'text', required: true },
            { id: 'family', name: 'family', label: 'Plant Family', type: 'text', required: false },
            { id: 'nativeRegion', name: 'nativeRegion', label: 'Native Region', type: 'text', required: false },
            { id: 'bloomingSeason', name: 'bloomingSeason', label: 'Blooming Season', type: 'text', required: false },
            { id: 'careInfo', name: 'careInfo', label: 'Care Information', type: 'textarea', required: false },
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
            templateId: data.templateId || 'tpl_artwork',
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
