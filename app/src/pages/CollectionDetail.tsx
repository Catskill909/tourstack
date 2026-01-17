import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import { collectionService, type CollectionItem } from '../lib/collectionService';

export function CollectionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<CollectionItem[]>([]);

    // Edit item state
    const [showAddItem, setShowAddItem] = useState(false);
    const [newItemUrl, setNewItemUrl] = useState('');
    const [newItemCaption, setNewItemCaption] = useState('');

    useEffect(() => {
        if (id) loadCollection(id);
    }, [id]);

    async function loadCollection(collectionId: string) {
        try {
            const data = await collectionService.getById(collectionId);
            if (data) {
                setCollection(data);
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Failed to load collection:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSave() {
        if (!collection) return;
        try {
            await collectionService.update(collection.id, {
                items
            });
            alert('Collection saved successfully!');
        } catch (error) {
            console.error('Failed to save collection:', error);
            alert('Failed to save.');
        }
    }

    function handleAddItem(e: React.FormEvent) {
        e.preventDefault();
        const newItem: CollectionItem = {
            id: crypto.randomUUID(),
            type: 'image',
            url: newItemUrl,
            caption: newItemCaption,
            order: items.length
        };
        setItems([...items, newItem]);
        setNewItemUrl('');
        setNewItemCaption('');
        setShowAddItem(false);
    }

    function handleDeleteItem(itemId: string) {
        setItems(items.filter(item => item.id !== itemId));
    }

    if (isLoading) return <div className="p-6 text-center text-[var(--color-text-muted)]">Loading...</div>;
    if (!collection) return <div className="p-6 text-center text-red-500">Collection not found</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/collections')}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-secondary)] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{collection.name}</h1>
                        <p className="text-[var(--color-text-muted)] text-sm">
                            {items.length} items • {collection.type}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                </button>
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                    <div key={item.id} className="group relative bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl overflow-hidden aspect-square">
                        {item.type === 'image' ? (
                            <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-surface)]">
                                <span className="text-[var(--color-text-muted)]">{item.type}</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                            <p className="text-white text-sm font-medium truncate">{item.caption || 'No caption'}</p>
                            <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Item Button */}
                <button
                    onClick={() => setShowAddItem(true)}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--color-border-dash)] rounded-xl aspect-square hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/5 transition-all text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)]"
                >
                    <Plus className="w-8 h-8" />
                    <span className="font-medium">Add Item</span>
                </button>
            </div>

            {/* Add Item Modal */}
            {showAddItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Add Item</h2>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Image URL</label>
                                <input
                                    type="url"
                                    required
                                    value={newItemUrl}
                                    onChange={e => setNewItemUrl(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="https://..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Caption</label>
                                <input
                                    type="text"
                                    value={newItemCaption}
                                    onChange={e => setNewItemCaption(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="Optional caption"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddItem(false)}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
