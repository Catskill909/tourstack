import { useState, useEffect } from 'react';
import { Plus, Search, LayoutGrid, Image as ImageIcon, Trash2, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collectionService } from '../lib/collectionService';

export function Collections() {
    const navigate = useNavigate();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    // New Collection State
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDesc, setNewCollectionDesc] = useState('');

    useEffect(() => {
        loadCollections();
    }, []);

    async function loadCollections() {
        try {
            const data = await collectionService.getAll();
            setCollections(data);
        } catch (error) {
            console.error('Failed to load collections:', error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        try {
            await collectionService.create({
                name: newCollectionName,
                description: newCollectionDesc,
                type: 'gallery'
            });
            setShowCreateModal(false);
            setNewCollectionName('');
            setNewCollectionDesc('');
            loadCollections();
        } catch (error) {
            console.error('Failed to create collection:', error);
        }
    }

    async function handleDelete(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this collection?')) {
            try {
                await collectionService.delete(id);
                loadCollections();
            } catch (error) {
                console.error('Failed to delete collection:', error);
            }
        }
    }

    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Collections</h1>
                    <p className="text-[var(--color-text-muted)] mt-1">Manage reusable content galleries and datasets</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span>New Collection</span>
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                    type="text"
                    placeholder="Search collections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-[var(--color-text-muted)]">Loading...</div>
                ) : filteredCollections.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-dash)] border-dashed">
                        <LayoutGrid className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-[var(--color-text-primary)]">No collections found</h3>
                        <p className="text-[var(--color-text-muted)] mt-1">Create a collection to get started</p>
                    </div>
                ) : (
                    filteredCollections.map(collection => (
                        <div
                            key={collection.id}
                            onClick={() => navigate(`/collections/${collection.id}`)}
                            className="group relative bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl p-5 hover:border-[var(--color-accent-primary)] transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-3 rounded-lg ${collection.type === 'audio_collection'
                                        ? 'bg-purple-500/10 text-purple-500'
                                        : 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    }`}>
                                    {collection.type === 'audio_collection' ? (
                                        <Volume2 className="w-6 h-6" />
                                    ) : collection.type === 'dataset' ? (
                                        <LayoutGrid className="w-6 h-6" />
                                    ) : (
                                        <ImageIcon className="w-6 h-6" />
                                    )}
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => handleDelete(collection.id, e)}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1 group-hover:text-[var(--color-accent-primary)] transition-colors">
                                {collection.name}
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 min-h-[2.5em]">
                                {collection.description || 'No description'}
                            </p>

                            <div className="mt-4 pt-4 border-t border-[var(--color-border-default)] flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                                <span>{collection.items?.length || 0} items</span>
                                <span>Updated {new Date(collection.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-4">Create New Collection</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newCollectionName}
                                    onChange={e => setNewCollectionName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="e.g. Ancient Pottery"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                                <textarea
                                    value={newCollectionDesc}
                                    onChange={e => setNewCollectionDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none h-24 resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90"
                                >
                                    Create Collection
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
