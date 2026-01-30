// Media Library Service
import type { Media, MediaUsage, AIAnalysisResult } from '../types/media';

const API_BASE = '/api/media';

export const mediaService = {
  // Get all media
  async getAll(): Promise<Media[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch media');
    }
    return response.json();
  },

  // Get single media item by ID
  async getById(id: string): Promise<Media> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch media item');
    }
    return response.json();
  },

  // Update media metadata
  async update(id: string, data: Partial<Pick<Media, 'alt' | 'caption' | 'tags'>>): Promise<Media> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update media');
    }
    return response.json();
  },

  // Delete single media item
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete media');
    }
  },

  // Upload new media file
  async upload(
    file: File,
    metadata?: { alt?: string; caption?: string; tags?: string[] }
  ): Promise<Media> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.alt) formData.append('alt', metadata.alt);
    if (metadata?.caption) formData.append('caption', metadata.caption);
    if (metadata?.tags) formData.append('tags', JSON.stringify(metadata.tags));

    const response = await fetch(API_BASE, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      throw new Error('Failed to upload media');
    }
    return response.json();
  },

  // Get usage information for a media item
  async getUsage(id: string): Promise<MediaUsage> {
    const response = await fetch(`${API_BASE}/${id}/usage`);
    if (!response.ok) {
      throw new Error('Failed to fetch media usage');
    }
    return response.json();
  },

  // Bulk delete media items
  async bulkDelete(ids: string[]): Promise<void> {
    const response = await fetch(`${API_BASE}/bulk`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to delete media items');
    }
  },

  // Bulk add/replace tags
  async bulkTags(
    ids: string[],
    tags: string[],
    mode: 'add' | 'replace' = 'add'
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/bulk/tags`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, tags, mode }),
    });
    if (!response.ok) {
      throw new Error('Failed to update tags');
    }
  },

  // Analyze image using Gemini API
  async analyzeImage(imageUrl: string): Promise<AIAnalysisResult> {
    // Fetch the image and convert to base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];

          const analysisResponse = await fetch('/api/gemini/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 }),
          });

          if (!analysisResponse.ok) {
            throw new Error('Failed to analyze image');
          }

          const data = await analysisResponse.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(blob);
    });
  },
};
