// Media Library Types

export interface Media {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  alt?: string;
  caption?: string;
  tags: string[];
  width?: number;    // Image width in pixels
  height?: number;   // Image height in pixels
  duration?: number; // Audio/video duration in seconds
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'image' | 'audio' | 'video' | 'document';

export type MediaSortOption = 'date' | 'name' | 'size';
export type MediaSortDirection = 'asc' | 'desc';

export interface MediaFilter {
  type?: MediaType | 'all';
  search?: string;
  sortBy?: MediaSortOption;
  sortDirection?: MediaSortDirection;
}

export interface MediaUsage {
  tours: Array<{
    id: string;
    title: Record<string, string>;
    slug: string | null;
    usageType: 'heroImage';
  }>;
  stops: Array<{
    id: string;
    title: Record<string, string>;
    slug: string | null;
    tourId: string;
    tourTitle?: Record<string, string>;
    usageType: 'image' | 'content';
  }>;
}

export interface AIAnalysisResult {
  description: string;
  tags: string[];
  objects: string[];
  text?: string;
  colors: Array<{ name: string; hex: string }>;
  suggestedTitle: string;
  mood?: string;
  lighting?: string;
  artStyle?: string;
  estimatedLocation?: string;
}

/**
 * Multilingual wrapper for AI analysis results.
 * Stores translations of translatable text fields from AIAnalysisResult.
 */
export interface MultilingualAIAnalysis {
  /** Original AI analysis (source language, typically English) */
  original: AIAnalysisResult;

  /** Source language code (defaults to 'en') */
  sourceLanguage: string;

  /** Languages this analysis has been translated to */
  translatedLanguages: string[];

  /** Translated titles by language code */
  suggestedTitle?: { [lang: string]: string };

  /** Translated descriptions by language code */
  description?: { [lang: string]: string };

  /** Translated tags by language code (array per language) */
  tags?: { [lang: string]: string[] };

  /** Translated mood by language code */
  mood?: { [lang: string]: string };

  /** Translated lighting by language code */
  lighting?: { [lang: string]: string };

  /** Translated artStyle by language code */
  artStyle?: { [lang: string]: string };

  /** Translated estimatedLocation by language code */
  estimatedLocation?: { [lang: string]: string };
}

// Helper to determine media type from MIME type
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'document';
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Format duration for display (seconds to MM:SS or HH:MM:SS)
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
