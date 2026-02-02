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
    Globe,
    User,
    Loader2,
    Import,
    Languages
} from 'lucide-react';
import * as conciergeService from '../lib/conciergeService';
import type { ParsedConciergeConfig, ParsedQuickAction } from '../lib/conciergeService';
import type { ConciergeKnowledge } from '../generated/prisma';
import { collectionService } from '../lib/collectionService';

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

export default function Concierge() {
    const [config, setConfig] = useState<ParsedConciergeConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [_saving, setSaving] = useState(false);
    const [testMessage, setTestMessage] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [testing, setTesting] = useState(false);
    const [collections, setCollections] = useState<{ id: string; name: string; type: string }[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [_editingAction, _setEditingAction] = useState<ParsedQuickAction | null>(null);
    const [newActionQuestion, setNewActionQuestion] = useState('');
    const [newActionCategory, setNewActionCategory] = useState('general');
    const [draggedActionId, setDraggedActionId] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [configData, collectionsData] = await Promise.all([
                conciergeService.getConfig(),
                collectionService.getAll(),
            ]);
            setConfig(configData);
            setCollections(collectionsData.filter((c: { type: string }) => c.type === 'document_collection'));
        } catch (error) {
            console.error('Failed to load concierge config:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleConfigUpdate(updates: Partial<ParsedConciergeConfig>) {
        if (!config) return;
        try {
            setSaving(true);
            const updated = await conciergeService.updateConfig({ id: config.id, ...updates });
            setConfig(updated);
        } catch (error) {
            console.error('Failed to update config:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleEnabled() {
        if (!config) return;
        await handleConfigUpdate({ enabled: !config.enabled });
    }

    async function handleImportCollection(collectionId: string) {
        if (!config) return;
        try {
            setImporting(true);
            await conciergeService.importDocumentCollection(collectionId, config.id);
            await loadData(); // Refresh to show new knowledge source
            setShowImportModal(false);
        } catch (error) {
            console.error('Failed to import collection:', error);
            alert(error instanceof Error ? error.message : 'Failed to import collection');
        } finally {
            setImporting(false);
        }
    }

    async function handleDeleteKnowledge(id: string) {
        if (!confirm('Delete this knowledge source?')) return;
        try {
            await conciergeService.deleteKnowledgeSource(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete knowledge:', error);
        }
    }

    async function handleToggleKnowledge(id: string, enabled: boolean) {
        try {
            await conciergeService.toggleKnowledgeSource(id, enabled);
            await loadData();
        } catch (error) {
            console.error('Failed to toggle knowledge:', error);
        }
    }

    async function handleAddQuickAction() {
        if (!config || !newActionQuestion.trim()) return;
        try {
            await conciergeService.addQuickAction({
                configId: config.id,
                question: { en: newActionQuestion },
                category: newActionCategory,
            });
            setNewActionQuestion('');
            await loadData();
        } catch (error) {
            console.error('Failed to add quick action:', error);
        }
    }

    async function handleDeleteQuickAction(id: string) {
        if (!confirm('Delete this quick action?')) return;
        try {
            await conciergeService.deleteQuickAction(id);
            await loadData();
        } catch (error) {
            console.error('Failed to delete quick action:', error);
        }
    }

    async function handleTestChat() {
        if (!testMessage.trim()) return;
        try {
            setTesting(true);
            const result = await conciergeService.previewChat(testMessage);
            setTestResponse(result.response);
        } catch (error) {
            console.error('Failed to test chat:', error);
            setTestResponse('Error: Failed to generate response');
        } finally {
            setTesting(false);
        }
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

    async function handleDrop(e: React.DragEvent, targetActionId: string) {
        e.preventDefault();
        if (!config || !draggedActionId || draggedActionId === targetActionId) {
            setDraggedActionId(null);
            return;
        }

        const actions = [...config.quickActions];
        const draggedIndex = actions.findIndex(a => a.id === draggedActionId);
        const targetIndex = actions.findIndex(a => a.id === targetActionId);

        if (draggedIndex === -1 || targetIndex === -1) {
            setDraggedActionId(null);
            return;
        }

        // Reorder the array
        const [draggedItem] = actions.splice(draggedIndex, 1);
        actions.splice(targetIndex, 0, draggedItem);

        // Update orders and send to API
        const reorderedActions = actions.map((a, index) => ({ id: a.id, order: index }));

        try {
            await conciergeService.reorderQuickActions(reorderedActions);
            await loadData();
        } catch (error) {
            console.error('Failed to reorder quick actions:', error);
        }

        setDraggedActionId(null);
    }

    function handleDragEnd() {
        setDraggedActionId(null);
    }

    async function handleTranslateAll() {
        if (!config) return;
        try {
            setTranslating(true);
            const result = await conciergeService.translateAllQuickActions(config.id);
            alert(`Translated ${result.translatedCount} quick actions to: ${result.languages.join(', ')}`);
            await loadData();
        } catch (error) {
            console.error('Failed to translate quick actions:', error);
            alert(error instanceof Error ? error.message : 'Failed to translate quick actions');
        } finally {
            setTranslating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto text-white/30 mb-4" />
                <p className="text-white/50">Failed to load concierge configuration</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <Bot className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">AI Concierge</h1>
                            <p className="text-white/50">Configure your museum's AI assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={handleToggleEnabled}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${config.enabled
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                            }`}
                    >
                        <Power className="w-4 h-4" />
                        {config.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Settings Sidebar */}
                    <div className="space-y-4">
                        {/* Persona */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-white/50" />
                                <h3 className="font-medium text-white">Persona</h3>
                            </div>
                            <select
                                value={config.persona}
                                onChange={(e) => handleConfigUpdate({ persona: e.target.value })}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white"
                            >
                                {conciergeService.PERSONAS.map(p => (
                                    <option key={p.id} value={p.id}>{p.label}</option>
                                ))}
                            </select>
                            <p className="mt-2 text-sm text-white/40">
                                {conciergeService.PERSONAS.find(p => p.id === config.persona)?.description}
                            </p>
                        </div>

                        {/* Languages */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="w-4 h-4 text-white/50" />
                                <h3 className="font-medium text-white">Languages</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {config.enabledLanguages.map(lang => (
                                    <span key={lang} className="px-2 py-1 bg-white/10 rounded text-sm text-white/70">
                                        {lang.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 mt-3 text-sm text-white/60">
                                <input
                                    type="checkbox"
                                    checked={config.autoTranslate}
                                    onChange={(e) => handleConfigUpdate({ autoTranslate: e.target.checked })}
                                    className="rounded"
                                />
                                Auto-translate responses
                            </label>
                        </div>

                        {/* Welcome Message */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageCircle className="w-4 h-4 text-white/50" />
                                <h3 className="font-medium text-white">Welcome Message</h3>
                            </div>
                            <textarea
                                value={config.welcomeMessage.en || ''}
                                onChange={(e) => handleConfigUpdate({
                                    welcomeMessage: { ...config.welcomeMessage, en: e.target.value }
                                })}
                                placeholder="Welcome to our museum! How can I help?"
                                rows={3}
                                className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                            />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Knowledge Sources */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-white/50" />
                                    <h3 className="font-medium text-white">Knowledge Sources</h3>
                                </div>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 text-sm"
                                >
                                    <Import className="w-4 h-4" />
                                    Import Collection
                                </button>
                            </div>

                            {config.knowledgeSources.length === 0 ? (
                                <div className="text-center py-8 text-white/40">
                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No knowledge sources yet</p>
                                    <p className="text-sm">Import a document collection to get started</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {config.knowledgeSources.map((source: ConciergeKnowledge) => (
                                        <div
                                            key={source.id}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${source.enabled
                                                ? 'bg-white/5 border-white/10'
                                                : 'bg-white/2 border-white/5 opacity-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileText className="w-5 h-5 text-white/40" />
                                                <div>
                                                    <p className="text-white font-medium">{source.title}</p>
                                                    <p className="text-sm text-white/40">
                                                        {source.characterCount.toLocaleString()} characters
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleKnowledge(source.id, !source.enabled)}
                                                    className={`p-2 rounded-lg ${source.enabled
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-white/10 text-white/40'
                                                        }`}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteKnowledge(source.id)}
                                                    className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="w-5 h-5 text-white/50" />
                                    <h3 className="font-medium text-white">Quick Actions</h3>
                                </div>
                                <button
                                    onClick={handleTranslateAll}
                                    disabled={translating || config.quickActions.length === 0}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 text-sm disabled:opacity-50"
                                    title="Translate all to enabled languages"
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
                                    className="bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
                                >
                                    {conciergeService.QUICK_ACTION_CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    value={newActionQuestion}
                                    onChange={(e) => setNewActionQuestion(e.target.value)}
                                    placeholder="What are your hours?"
                                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm"
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
                            <div className="space-y-2">
                                {config.quickActions.map((action) => {
                                    const CategoryIcon = CATEGORY_ICONS[action.category] || MessageCircle;
                                    return (
                                        <div
                                            key={action.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, action.id)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, action.id)}
                                            onDragEnd={handleDragEnd}
                                            className={`flex items-center gap-3 p-3 bg-white/5 rounded-lg border transition-all ${
                                                draggedActionId === action.id
                                                    ? 'border-purple-500/50 opacity-50'
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            <GripVertical className="w-4 h-4 text-white/30 cursor-grab active:cursor-grabbing" />
                                            <div className={`p-1.5 rounded ${CATEGORY_COLORS[action.category] || CATEGORY_COLORS.general}`}>
                                                <CategoryIcon className="w-4 h-4" />
                                            </div>
                                            <span className="flex-1 text-white">{action.question.en}</span>
                                            <button
                                                onClick={() => handleDeleteQuickAction(action.id)}
                                                className="p-1.5 text-white/30 hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Test Panel */}
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <div className="flex items-center gap-2 mb-4">
                                <Send className="w-5 h-5 text-white/50" />
                                <h3 className="font-medium text-white">Test Concierge</h3>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={testMessage}
                                    onChange={(e) => setTestMessage(e.target.value)}
                                    placeholder="Ask a question..."
                                    className="flex-1 bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleTestChat()}
                                />
                                <button
                                    onClick={handleTestChat}
                                    disabled={testing || !testMessage.trim()}
                                    className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 disabled:opacity-50"
                                >
                                    {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </div>

                            {testResponse && (
                                <div className="bg-white/5 rounded-lg p-4 text-white/80">
                                    <p className="text-sm text-white/40 mb-2">Response:</p>
                                    {testResponse}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-[#1a1a2e] rounded-xl p-6 w-full max-w-md border border-white/10">
                        <h3 className="text-xl font-bold text-white mb-4">Import Document Collection</h3>

                        {collections.length === 0 ? (
                            <p className="text-white/50 text-center py-8">
                                No document collections found. Create a Documents collection first.
                            </p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {collections.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => handleImportCollection(c.id)}
                                        disabled={importing}
                                        className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 text-left"
                                    >
                                        <FileText className="w-5 h-5 text-white/50" />
                                        <span className="text-white">{c.name}</span>
                                        {importing && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <button
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
