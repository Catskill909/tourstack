export interface CollectionItem {
    id: string;
    type: 'image' | 'audio' | 'video' | 'model';
    url: string;
    caption?: string;
    order: number;
}

export type CollectionType = 'gallery' | 'dataset';

export interface Collection {
    id: string;
    museumId?: string;
    name: string;
    description?: string;
    type: CollectionType;
    items: CollectionItem[];
    createdAt: string;
    updatedAt: string;
}

const COLLECTIONS_STORAGE_KEY = 'tourstack_collections';

export const collectionService = {
    // Get all collections
    getAll: async (): Promise<Collection[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        try {
            const stored = localStorage.getItem(COLLECTIONS_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    },

    // Get collection by ID
    getById: async (id: string): Promise<Collection | null> => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const collections = await collectionService.getAll();
        return collections.find(c => c.id === id) || null;
    },

    // Create new collection
    create: async (data: { name: string; description?: string; type?: CollectionType; items?: CollectionItem[] }): Promise<Collection> => {
        await new Promise(resolve => setTimeout(resolve, 300));

        const now = new Date().toISOString();
        const newCollection: Collection = {
            id: `col_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: data.name,
            description: data.description || '',
            type: data.type || 'gallery',
            items: data.items || [],
            createdAt: now,
            updatedAt: now
        };

        const collections = await collectionService.getAll();
        collections.unshift(newCollection);
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));

        return newCollection;
    },

    // Update collection
    update: async (id: string, data: { name?: string; description?: string; items?: CollectionItem[] }): Promise<Collection> => {
        await new Promise(resolve => setTimeout(resolve, 200));

        const collections = await collectionService.getAll();
        const index = collections.findIndex(c => c.id === id);

        if (index === -1) throw new Error('Collection not found');

        const updated: Collection = {
            ...collections[index],
            ...data,
            updatedAt: new Date().toISOString()
        };

        collections[index] = updated;
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));

        return updated;
    },

    // Delete collection
    delete: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        const collections = await collectionService.getAll();
        const filtered = collections.filter(c => c.id !== id);
        localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(filtered));
    },

    // Add item to collection
    addItem: async (collectionId: string, item: CollectionItem): Promise<Collection> => {
        const collection = await collectionService.getById(collectionId);
        if (!collection) throw new Error('Collection not found');

        const newItems = [...collection.items, item];
        return await collectionService.update(collectionId, { items: newItems });
    }
};
