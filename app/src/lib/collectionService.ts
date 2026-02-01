import type { AIAnalysisResult, MultilingualAIAnalysis } from '../types/media';

// Base collection item interface
export interface BaseCollectionItem {
    id: string;
    order: number;
}

// Image collection item
export interface ImageCollectionItem extends BaseCollectionItem {
    type: 'image';
    url: string;
    alt?: { [lang: string]: string };
    caption?: { [lang: string]: string };
    credit?: string;
    aiMetadata?: AIAnalysisResult;
    /** Multilingual translations of AI analysis fields */
    aiTranslations?: MultilingualAIAnalysis;
}

// Audio collection item (for audio_collection type)
export interface AudioCollectionItem extends BaseCollectionItem {
    type: 'audio';
    url: string;
    language: string;
    voice: {
        id: string;
        name: string;
        gender?: 'male' | 'female' | 'neutral';
    };
    provider: 'deepgram' | 'elevenlabs';
    format: string;
    sampleRate?: number;
    fileSize: number;
    duration?: number;
    text: string;
}

// Legacy item type for backward compatibility
export interface LegacyCollectionItem extends BaseCollectionItem {
    type: 'video' | 'model';
    url: string;
    caption?: string;
}

export type CollectionItem = ImageCollectionItem | AudioCollectionItem | LegacyCollectionItem;

export type CollectionType = 'gallery' | 'dataset' | 'audio_collection';

// TTS settings for audio collections
export interface TTSSettings {
    provider: 'deepgram' | 'elevenlabs';
    format: string;
    sampleRate?: number;
    autoTranslate: boolean;
}

export interface Collection {
    id: string;
    museumId?: string;
    name: string;
    description?: string;
    type: CollectionType;
    items: CollectionItem[];
    // Audio collection specific
    sourceLanguage?: string;
    texts?: { [lang: string]: string };
    ttsSettings?: TTSSettings;
    createdAt: string;
    updatedAt: string;
}

// Create collection request
export interface CreateCollectionRequest {
    name: string;
    description?: string;
    type?: CollectionType;
    items?: CollectionItem[];
    sourceLanguage?: string;
    texts?: { [lang: string]: string };
    ttsSettings?: TTSSettings;
}

// Update collection request
export interface UpdateCollectionRequest {
    name?: string;
    description?: string;
    items?: CollectionItem[];
    texts?: { [lang: string]: string };
    ttsSettings?: TTSSettings;
}

const API_BASE = '/api/collections';

export const collectionService = {
    // Get all collections (with optional type filter)
    getAll: async (type?: CollectionType): Promise<Collection[]> => {
        const params = type ? `?type=${type}` : '';
        const response = await fetch(`${API_BASE}${params}`);
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        return response.json();
    },

    // Get collection by ID
    getById: async (id: string): Promise<Collection | null> => {
        const response = await fetch(`${API_BASE}/${id}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch collection');
        }
        return response.json();
    },

    // Create new collection
    create: async (data: CreateCollectionRequest): Promise<Collection> => {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create collection');
        }
        return response.json();
    },

    // Update collection
    update: async (id: string, data: UpdateCollectionRequest): Promise<Collection> => {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update collection');
        }
        return response.json();
    },

    // Delete collection
    delete: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete collection');
        }
    },

    // Add item to collection
    addItem: async (collectionId: string, item: Omit<CollectionItem, 'id' | 'order'>): Promise<Collection> => {
        const response = await fetch(`${API_BASE}/${collectionId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
        });
        if (!response.ok) {
            throw new Error('Failed to add item to collection');
        }
        return response.json();
    },

    // Remove item from collection
    removeItem: async (collectionId: string, itemId: string): Promise<Collection> => {
        const response = await fetch(`${API_BASE}/${collectionId}/items/${itemId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to remove item from collection');
        }
        return response.json();
    },

    // Get audio collections only
    getAudioCollections: async (): Promise<Collection[]> => {
        return collectionService.getAll('audio_collection');
    },

    // Get gallery collections only
    getGalleryCollections: async (): Promise<Collection[]> => {
        return collectionService.getAll('gallery');
    },
};
