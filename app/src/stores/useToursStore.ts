import { create } from 'zustand';
import type { Tour, Template } from '../types';
import { tourService } from '../lib/tourService';

interface ToursState {
    tours: Tour[];
    templates: Template[];
    isLoading: boolean;
    error: string | null;
    selectedTourId: string | null;
}

interface ToursActions {
    fetchTours: () => Promise<void>;
    fetchTemplates: () => Promise<void>;
    createTour: (data: Partial<Tour>) => Promise<Tour>;
    updateTour: (id: string, data: Partial<Tour>) => Promise<void>;
    deleteTour: (id: string) => Promise<void>;
    setSelectedTour: (id: string | null) => void;
    clearError: () => void;
}

type ToursStore = ToursState & ToursActions;

export const useToursStore = create<ToursStore>((set) => ({
    // State
    tours: [],
    templates: [],
    isLoading: false,
    error: null,
    selectedTourId: null,

    // Actions
    fetchTours: async () => {
        set({ isLoading: true, error: null });
        try {
            const tours = await tourService.getAllTours();
            set({ tours, isLoading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch tours',
                isLoading: false
            });
        }
    },

    fetchTemplates: async () => {
        try {
            const templates = await tourService.getTemplates();
            set({ templates });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to fetch templates'
            });
        }
    },

    createTour: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const newTour = await tourService.createTour(data);
            set((state) => ({
                tours: [newTour, ...state.tours],
                isLoading: false
            }));
            return newTour;
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to create tour',
                isLoading: false
            });
            throw error;
        }
    },

    updateTour: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const updatedTour = await tourService.updateTour(id, data);
            set((state) => ({
                tours: state.tours.map(t => t.id === id ? updatedTour : t),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to update tour',
                isLoading: false
            });
            throw error;
        }
    },

    deleteTour: async (id) => {
        set({ isLoading: true, error: null });
        try {
            await tourService.deleteTour(id);
            set((state) => ({
                tours: state.tours.filter(t => t.id !== id),
                isLoading: false
            }));
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Failed to delete tour',
                isLoading: false
            });
            throw error;
        }
    },

    setSelectedTour: (id) => set({ selectedTourId: id }),

    clearError: () => set({ error: null }),
}));
