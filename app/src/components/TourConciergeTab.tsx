import { useState, useEffect } from 'react';
import {
    Bot,
    Clock,
    Accessibility,
    HelpCircle,
    Image as ImageIcon,
    MessageCircle,
    Plus,
    Trash2,
    GripVertical,
    FileText,
    Send,
    Power,
    User,
    Loader2,
    Check,
    Info,
    Languages,
    Import,
} from 'lucide-react';
import type { Tour, TourQuickAction } from '../types';
import { collectionService } from '../lib/collectionService';
import * as conciergeService from '../lib/conciergeService';

interface TourConciergeTabProps {
    tour: Tour;
    onUpdate: (id: string, data: Partial<Tour>) => Promise<void>;
}

// Persona definitions (with inherit option for tours)
const PERSONAS = [
    { id: 'inherit', label: 'Inherit Museum Default', description: 'Use museum-wide AI settings' },
    ...conciergeService.PERSONAS,
];

// Category icons and colors (matching Concierge.tsx)
const CATEGORY_ICONS: Record<string, typeof Clock> = {
    hours: Clock,
    accessibility: Accessibility,
    services: HelpCircle,
    exhibitions: ImageIcon,
    general: MessageCircle,
};

const CATEGORY_COLORS: Record<string, string> = {
    hours: 'bg-blue-500/20 text-blue-400',
    accessibility: 'bg-purple-500/20 text-purple-400',
    services: 'bg-green-500/20 text-green-400',
    exhibitions: 'bg-orange-500/20 text-orange-400',
    general: 'bg-gray-500/20 text-gray-400',
};

interface Collection {
    id: string;
    name: string;
    type: string;
    description?: string;
}

export function TourConciergeTab({ tour, onUpdate }: TourConciergeTabProps) {
    const [saving, setSaving] = useState(false);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(true);
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testing, setTesting] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // Quick action form state
    const [newActionQuestion, setNewActionQuestion] = useState('');
    const [newActionCategory, setNewActionCategory] = useState('general');
    const [draggedActionId, setDraggedActionId] = useState<string | null>(null);

    // Local state for form fields
    const [enabled, setEnabled] = useState(tour.conciergeEnabled ?? true);
    const [persona, setPersona] = useState(tour.conciergePersona || 'inherit');
    const [welcomeMessage, setWelcomeMessage] = useState(
        tour.conciergeWelcome?.[tour.primaryLanguage] || tour.conciergeWelcome?.en || ''
    );
    const [linkedCollections, setLinkedCollections] = useState<string[]>(
        tour.conciergeCollections || []
    );
    const [quickActions, setQuickActions] = useState<TourQuickAction[]>(
        tour.conciergeQuickActions || []
    );

    // Load document collections
    useEffect(() => {
        async function loadCollections() {
            try {
                const all = await collectionService.getAll();
                setCollections(all.filter((c: Collection) => c.type === 'document_collection'));
            } catch (error) {
                console.error('Failed to load collections:', error);
            } finally {
                setLoadingCollections(false);
            }
        }
        loadCollections();
    }, []);

    // Generate unique ID for quick actions
    function generateId() {
        return `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async function handleSave() {
        setSaving(true);
        try {
            await onUpdate(tour.id, {
                conciergeEnabled: enabled,
                conciergePersona: persona === 'inherit' ? null : persona,
                conciergeWelcome: welcomeMessage ? { [tour.primaryLanguage]: welcomeMessage } : undefined,
                conciergeCollections: linkedCollections,
                conciergeQuickActions: quickActions,
            });
        } catch (error) {
            console.error('Failed to save concierge settings:', error);
        } finally {
            setSaving(false);
        }
    }

    function handleAddQuickAction() {
        if (!newActionQuestion.trim()) return;
        const newAction: TourQuickAction = {
            id: generateId(),
            question: { en: newActionQuestion },
            category: newActionCategory as TourQuickAction['category'],
            order: quickActions.length,
            enabled: true,
        };
        setQuickActions([...quickActions, newAction]);
        setNewActionQuestion('');
    }

    function handleDeleteQuickAction(id: string) {
        if (!confirm('Delete this quick action?')) return;
        setQuickActions(quickActions.filter(a => a.id !== id));
    }

    function handleDragStart(e: React.DragEvent, actionId: string) {
        setDraggedActionId(actionId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', actionId);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    function handleDrop(e: React.DragEvent, targetActionId: string) {
        e.preventDefault();
        if (!draggedActionId || draggedActionId === targetActionId) {
            setDraggedActionId(null);
            return;
        }

        const actions = [...quickActions];
        const draggedIndex = actions.findIndex(a => a.id === draggedActionId);
        const targetIndex = actions.findIndex(a => a.id === targetActionId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedActionId(null);
            return;
        }

        // Reorder the array
        const [draggedItem] = actions.splice(draggedIndex, 1);
        actions.splice(targetIndex, 0, draggedItem);

        // Update order values
        const reorderedActions = actions.map((a, index) => ({ ...a, order: index }));
        setQuickActions(reorderedActions);
        setDraggedActionId(null);
    }

    function handleDragEnd() {
        setDraggedActionId(null);
    }

    async function handleTranslateAll() {
        if (quickActions.length === 0) return;
        setTranslating(true);
        try {
            // Get tour's enabled languages
            const languages = tour.languages || ['en'];
            const targetLangs = languages.filter(l => l !== 'en');

            if (targetLangs.length === 0) {
                alert('No additional languages to translate to. Add languages to this tour first.');
                setTranslating(false);
                return;
            }

            // Translate each quick action
            const translatedActions = await Promise.all(
                quickActions.map(async (action) => {
                    const translations = { ...action.question };
                    for (const lang of targetLangs) {
                        if (!translations[lang] && translations.en) {
                            try {
                                const res = await fetch('/api/translate', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        text: translations.en,
                                        targetLang: lang,
                                    }),
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    translations[lang] = data.translatedText;
                                }
                            } catch (e) {
                                console.error(`Failed to translate to ${lang}:`, e);
                            }
                        }
                    }
                    return { ...action, question: translations };
                })
            );

            setQuickActions(translatedActions);
            alert(`Translated ${quickActions.length} quick actions to: ${targetLangs.join(', ')}`);
        } catch (error) {
            console.error('Failed to translate:', error);
            alert('Failed to translate quick actions');
        } finally {
            setTranslating(false);
        }
    }

    function handleToggleCollection(collectionId: string) {
        if (linkedCollections.includes(collectionId)) {
            setLinkedCollections(linkedCollections.filter(id => id !== collectionId));
        } else {
            setLinkedCollections([...linkedCollections, collectionId]);
        }
    }

    async function handleTestChat() {
        if (!testMessage.trim()) return;
        setTesting(true);
        setTestResponse('');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: testMessage,
                    language: tour.primaryLanguage,
                    tourId: tour.id,
                }),
            });

            if (!res.ok) throw new Error('Failed to get response');
            const data = await res.json();
            setTestResponse(data.response);
        } catch (error) {
            console.error('Chat test failed:', error);
            setTestResponse('Error: Failed to generate response');
        } finally {
            setTesting(false);
        }
    }

    // Check if there are unsaved changes
    const hasChanges =
        enabled !== (tour.conciergeEnabled ?? true) ||
        (persona === 'inherit' ? null : persona) !== tour.conciergePersona ||
        welcomeMessage !== (tour.conciergeWelcome?.[tour.primaryLanguage] || tour.conciergeWelcome?.en || '') ||
        JSON.stringify(linkedCollections) !== JSON.stringify(tour.conciergeCollections || []) ||
        JSON.stringify(quickActions) !== JSON.stringify(tour.conciergeQuickActions || []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <Bot className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                            AI Chatbot
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Configure the AI assistant for this tour
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${enabled
                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                    >
                        <Power className="w-4 h-4" />
                        {enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50"
                        >
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Tour-Specific AI Assistant</p>
                    <p className="text-blue-300/80">
                        This AI knows about this tour's content, including all stops and any linked document collections.
                        Visitors using this tour will get context-aware responses specific to the tour content.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Column */}
                <div className="space-y-4">
                    {/* Persona */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-2 mb-3">
                            <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <h3 className="font-medium text-[var(--color-text-primary)]">Persona</h3>
                        </div>
                        <select
                            value={persona}
                            onChange={(e) => setPersona(e.target.value)}
                            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]"
                        >
                            {PERSONAS.map(p => (
                                <option key={p.id} value={p.id}>{p.label}</option>
                            ))}
                        </select>
                        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                            {PERSONAS.find(p => p.id === persona)?.description}
                        </p>
                    </div>

                    {/* Welcome Message */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageCircle className="w-4 h-4 text-[var(--color-text-muted)]" />
                            <h3 className="font-medium text-[var(--color-text-primary)]">Welcome Message</h3>
                        </div>
                        <textarea
                            value={welcomeMessage}
                            onChange={(e) => setWelcomeMessage(e.target.value)}
                            placeholder={`Welcome to the ${typeof tour.title === 'object' ? tour.title.en || Object.values(tour.title)[0] : tour.title} tour! Ask me anything about what you'll see.`}
                            rows={3}
                            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-sm"
                        />
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            Leave empty to use museum default
                        </p>
                    </div>

                    {/* Linked Collections */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <h3 className="font-medium text-[var(--color-text-primary)]">Knowledge Sources</h3>
                            </div>
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-1 px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                            >
                                <Import className="w-3 h-3" />
                                Import
                            </button>
                        </div>

                        {loadingCollections ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-[var(--color-text-muted)]" />
                            </div>
                        ) : linkedCollections.length === 0 ? (
                            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                                No knowledge sources linked. Click Import to add.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {linkedCollections.map((collId) => {
                                    const coll = collections.find(c => c.id === collId);
                                    return coll ? (
                                        <div
                                            key={collId}
                                            className="flex items-center justify-between p-2 bg-[var(--color-bg-surface)] rounded-lg"
                                        >
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-purple-400" />
                                                <span className="text-sm text-[var(--color-text-primary)]">{coll.name}</span>
                                            </div>
                                            <button
                                                onClick={() => handleToggleCollection(collId)}
                                                className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        )}
                        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                            The AI automatically knows about this tour's stops and content.
                        </p>
                    </div>
                </div>

                {/* Main Content - Quick Actions & Test */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[var(--color-text-muted)]" />
                                <h3 className="font-medium text-[var(--color-text-primary)]">Quick Actions</h3>
                            </div>
                            <button
                                onClick={handleTranslateAll}
                                disabled={translating || quickActions.length === 0}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] text-sm disabled:opacity-50"
                                title="Translate all to tour's languages"
                            >
                                {translating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                {translating ? 'Translating...' : 'Translate All'}
                            </button>
                        </div>

                        {/* Add new action */}
                        <div className="flex gap-2 mb-4">
                            <select
                                value={newActionCategory}
                                onChange={(e) => setNewActionCategory(e.target.value)}
                                className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-sm"
                            >
                                {conciergeService.QUICK_ACTION_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                            <input
                                type="text"
                                value={newActionQuestion}
                                onChange={(e) => setNewActionQuestion(e.target.value)}
                                placeholder="What time does this tour start?"
                                className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddQuickAction()}
                            />
                            <button
                                onClick={handleAddQuickAction}
                                disabled={!newActionQuestion.trim()}
                                className="px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Action list */}
                        {quickActions.length === 0 ? (
                            <div className="text-center py-6 text-[var(--color-text-muted)]">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p>No quick actions yet</p>
                                <p className="text-sm">Add common questions visitors might ask about this tour</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {quickActions.map((action) => {
                                    const CategoryIcon = CATEGORY_ICONS[action.category] || MessageCircle;
                                    return (
                                        <div
                                            key={action.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, action.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, action.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-3 p-3 bg-[var(--color-bg-surface)] rounded-lg border transition-all ${draggedActionId === action.id
                                                    ? 'border-purple-500/50 opacity-50'
                                                    : 'border-[var(--color-border-default)] hover:border-[var(--color-border-subtle)]'
                                                }`}
                                        >
                                            <GripVertical className="w-4 h-4 text-[var(--color-text-muted)] cursor-grab active:cursor-grabbing" />
                                            <div className={`p-1.5 rounded ${CATEGORY_COLORS[action.category] || CATEGORY_COLORS.general}`}>
                                                <CategoryIcon className="w-4 h-4" />
                                            </div>
                                            <span className="flex-1 text-[var(--color-text-primary)]">{action.question.en}</span>
                                            <button
                                                onClick={() => handleDeleteQuickAction(action.id)}
                                                className="p-1.5 text-[var(--color-text-muted)] hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Test Chat */}
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-2 mb-4">
                            <Send className="w-5 h-5 text-[var(--color-text-muted)]" />
                            <h3 className="font-medium text-[var(--color-text-primary)]">Test Chatbot</h3>
                        </div>

                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                                placeholder="Ask a question about this tour..."
                                className="flex-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-[var(--color-text-primary)]"
                            />
                            <button
                                onClick={handleTestChat}
                                disabled={!testMessage.trim() || testing}
                                className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50"
                            >
                                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>

                        {testResponse && (
                            <div className="p-3 bg-[var(--color-bg-surface)] rounded-lg border border-[var(--color-border-default)]">
                                <p className="text-xs text-[var(--color-text-muted)] mb-2">Response:</p>
                                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap">
                                    {testResponse}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Import Collection Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-6 w-full max-w-md border border-[var(--color-border-default)]">
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">
                            Link Document Collection
                        </h3>

                        {collections.length === 0 ? (
                            <p className="text-[var(--color-text-muted)] text-center py-8">
                                No document collections found. Create a Documents collection first.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {collections.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            handleToggleCollection(c.id);
                                            setShowImportModal(false);
                                        }}
                                        disabled={linkedCollections.includes(c.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${linkedCollections.includes(c.id)
                                                ? 'bg-purple-500/20 border border-purple-500/30'
                                                : 'bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
                                            }`}
                                    >
                                        <FileText className="w-5 h-5 text-[var(--color-text-muted)]" />
                                        <div className="flex-1">
                                            <span className="text-[var(--color-text-primary)]">{c.name}</span>
                                            {linkedCollections.includes(c.id) && (
                                                <span className="ml-2 text-xs text-purple-400">Linked</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
