// Concierge Service - API client for AI Museum Concierge
import type { ConciergeConfig, ConciergeKnowledge, ConciergeQuickAction } from '../generated/prisma';

const API_BASE = '/api/concierge';

// Extended types with parsed JSON fields
export interface ParsedConciergeConfig extends Omit<ConciergeConfig, 'welcomeMessage' | 'enabledLanguages'> {
    welcomeMessage: Record<string, string>;
    enabledLanguages: string[];
    knowledgeSources: ConciergeKnowledge[];
    quickActions: ParsedQuickAction[];
}

export interface ParsedQuickAction extends Omit<ConciergeQuickAction, 'question'> {
    question: Record<string, string>;
}

// Category definitions
export const QUICK_ACTION_CATEGORIES = [
    { id: 'hours', label: 'Hours & Admission', icon: 'Clock', color: 'blue' },
    { id: 'accessibility', label: 'Accessibility', icon: 'Accessibility', color: 'purple' },
    { id: 'services', label: 'Visitor Services', icon: 'HelpCircle', color: 'green' },
    { id: 'exhibitions', label: 'Exhibitions', icon: 'ImageIcon', color: 'orange' },
    { id: 'general', label: 'General', icon: 'MessageCircle', color: 'gray' },
] as const;

// Persona definitions
export const PERSONAS = [
    { id: 'friendly', label: 'Friendly Docent', description: 'Warm and welcoming' },
    { id: 'professional', label: 'Professional Guide', description: 'Formal and precise' },
    { id: 'fun', label: 'Family-Friendly', description: 'Playful and simple' },
    { id: 'scholarly', label: 'Expert Scholar', description: 'Academic and detailed' },
    { id: 'custom', label: 'Custom', description: 'Your own persona' },
] as const;

// =============================================================================
// CONFIG
// =============================================================================

export async function getConfig(): Promise<ParsedConciergeConfig> {
    const res = await fetch(`${API_BASE}/config`, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to get config');
    return res.json();
}

export async function updateConfig(data: Partial<ParsedConciergeConfig>): Promise<ParsedConciergeConfig> {
    const res = await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update config');
    return res.json();
}

// =============================================================================
// KNOWLEDGE SOURCES
// =============================================================================

export async function getKnowledgeSources(configId?: string): Promise<ConciergeKnowledge[]> {
    const url = configId
        ? `${API_BASE}/knowledge?configId=${configId}`
        : `${API_BASE}/knowledge`;
    const res = await fetch(url, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to get knowledge sources');
    return res.json();
}

export async function addKnowledgeSource(data: {
    configId: string;
    sourceType: string;
    sourceId?: string;
    title: string;
    content: string;
    priority?: number;
}): Promise<ConciergeKnowledge> {
    const res = await fetch(`${API_BASE}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add knowledge source');
    return res.json();
}

export async function importDocumentCollection(
    collectionId: string,
    configId: string
): Promise<ConciergeKnowledge & { isUpdate?: boolean }> {
    const res = await fetch(`${API_BASE}/knowledge/import/${collectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ configId }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to import collection');
    }
    return res.json();
}

export async function deleteKnowledgeSource(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/knowledge/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete knowledge source');
}

export async function toggleKnowledgeSource(
    id: string,
    enabled: boolean
): Promise<ConciergeKnowledge> {
    const res = await fetch(`${API_BASE}/knowledge/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
    });
    if (!res.ok) throw new Error('Failed to toggle knowledge source');
    return res.json();
}

// =============================================================================
// QUICK ACTIONS
// =============================================================================

export async function getQuickActions(configId?: string): Promise<ParsedQuickAction[]> {
    const url = configId
        ? `${API_BASE}/quick-actions?configId=${configId}`
        : `${API_BASE}/quick-actions`;
    const res = await fetch(url, {
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to get quick actions');
    return res.json();
}

export async function addQuickAction(data: {
    configId: string;
    question: Record<string, string>;
    category: string;
    icon?: string;
    order?: number;
}): Promise<ParsedQuickAction> {
    const res = await fetch(`${API_BASE}/quick-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add quick action');
    return res.json();
}

export async function updateQuickAction(
    id: string,
    data: Partial<{
        question: Record<string, string>;
        category: string;
        icon: string;
        enabled: boolean;
        order: number;
    }>
): Promise<ParsedQuickAction> {
    const res = await fetch(`${API_BASE}/quick-actions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update quick action');
    return res.json();
}

export async function deleteQuickAction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/quick-actions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete quick action');
}

export async function reorderQuickActions(
    actions: Array<{ id: string; order: number }>
): Promise<void> {
    const res = await fetch(`${API_BASE}/quick-actions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ actions }),
    });
    if (!res.ok) throw new Error('Failed to reorder quick actions');
}

export async function translateAllQuickActions(
    configId: string
): Promise<{ success: boolean; translatedCount: number; languages: string[] }> {
    const res = await fetch(`${API_BASE}/quick-actions/translate-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ configId }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to translate quick actions');
    }
    return res.json();
}

// =============================================================================
// CHAT PREVIEW
// =============================================================================

export async function previewChat(
    message: string,
    language?: string
): Promise<{ response: string; sources: string[] }> {
    const res = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, language }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate response');
    }
    return res.json();
}
