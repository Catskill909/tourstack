/**
 * Tour Service - Data access layer for Tour CRUD operations
 * 
 * Calls the Express API endpoints for data persistence.
 */

import type { Tour, Template, TourStatus } from '../types';

const API_BASE = '/api';

export const tourService = {
    /**
     * Get all tours
     */
    async getAllTours(): Promise<Tour[]> {
        const response = await fetch(`${API_BASE}/tours`);
        if (!response.ok) {
            throw new Error('Failed to fetch tours');
        }
        return response.json();
    },

    /**
     * Get a single tour by ID
     */
    async getTourById(id: string): Promise<Tour | null> {
        const response = await fetch(`${API_BASE}/tours/${id}`);
        if (response.status === 404) {
            return null;
        }
        if (!response.ok) {
            throw new Error('Failed to fetch tour');
        }
        return response.json();
    },

    /**
     * Create a new tour
     */
    async createTour(data: Partial<Tour>): Promise<Tour> {
        const response = await fetch(`${API_BASE}/tours`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create tour');
        }
        return response.json();
    },

    /**
     * Update an existing tour
     */
    async updateTour(id: string, data: Partial<Tour>): Promise<Tour> {
        const response = await fetch(`${API_BASE}/tours/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update tour');
        }
        return response.json();
    },

    /**
     * Delete a tour
     */
    async deleteTour(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/tours/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete tour');
        }
    },

    /**
     * Get all available templates
     */
    async getTemplates(): Promise<Template[]> {
        const response = await fetch(`${API_BASE}/templates`);
        if (!response.ok) {
            throw new Error('Failed to fetch templates');
        }
        return response.json();
    },

    /**
     * Duplicate a tour
     */
    async duplicateTour(id: string): Promise<Tour> {
        const response = await fetch(`${API_BASE}/tours/${id}/duplicate`, {
            method: 'POST',
        });
        if (!response.ok) {
            throw new Error('Failed to duplicate tour');
        }
        return response.json();
    },

    /**
     * Update tour status
     */
    async updateStatus(id: string, status: TourStatus): Promise<Tour> {
        return this.updateTour(id, { status });
    },

    /**
     * Upload a file to the media library
     */
    async uploadFile(file: File): Promise<{ url: string; id: string }> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/media`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) {
            throw new Error('Failed to upload file');
        }
        return response.json();
    },

    /**
     * Create a new stop
     */
    async createStop(tourId: string, data: Record<string, unknown>): Promise<unknown> {
        const response = await fetch(`${API_BASE}/stops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tourId, ...data }),
        });
        if (!response.ok) {
            throw new Error('Failed to create stop');
        }
        return response.json();
    },

    /**
     * Update a stop
     */
    async updateStop(id: string, data: Record<string, unknown>): Promise<unknown> {
        const response = await fetch(`${API_BASE}/stops/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to update stop');
        }
        return response.json();
    },

    /**
     * Delete a stop
     */
    async deleteStop(id: string): Promise<void> {
        const response = await fetch(`${API_BASE}/stops/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error('Failed to delete stop');
        }
    },

    /**
     * Reorder stops
     */
    async reorderStops(tourId: string, stopIds: string[]): Promise<void> {
        const response = await fetch(`${API_BASE}/stops/reorder/${tourId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stopIds }),
        });
        if (!response.ok) {
            throw new Error('Failed to reorder stops');
        }
    },
};
