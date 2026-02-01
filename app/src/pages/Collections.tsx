import { useState, useEffect } from 'react';
import { Plus, Search, LayoutGrid, Image as ImageIcon, Trash2, Volume2, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collectionService, type Collection } from '../lib/collectionService';
import { CollectionTypeModal, ImageCollectionWizard, type CollectionTypeOption } from '../components/collections';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';

export function Collections() {
    const navigate = useNavigate();
    const [collections, setCollections] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Collection Creation State
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [showImageWizard, setShowImageWizard] = useState(false);
    const [showPlaceholderModal, setShowPlaceholderModal] = useState<'video' | 'documents' | null>(null);

    // Edit Collection State
    const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    // Delete Confirmation State
    const [deleteTarget, setDeleteTarget] = useState<Collection | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    function handleTypeSelect(type: CollectionTypeOption) {
        setShowTypeModal(false);
        switch (type) {
            case 'images':
                setShowImageWizard(true);
                break;
            case 'audio':
                // Navigate to Audio TTS page for audio collection creation
                navigate('/audio');
                break;
            case 'video':
            case 'documents':
                setShowPlaceholderModal(type);
                break;
        }
    }

    function handleCollectionCreated(collectionId: string) {
        setShowImageWizard(false);
        loadCollections();
        navigate(`/collections/${collectionId}`);
    }

    function handleDelete(collection: Collection, e: React.MouseEvent) {
        e.stopPropagation();
        setDeleteTarget(collection);
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await collectionService.delete(deleteTarget.id);
            setDeleteTarget(null);
            loadCollections();
        } catch (error) {
            console.error('Failed to delete collection:', error);
        } finally {
            setIsDeleting(false);
        }
    }

    function openEditModal(collection: Collection, e: React.MouseEvent) {
        e.stopPropagation();
        setEditingCollection(collection);
        setEditName(collection.name);
        setEditDesc(collection.description || '');
    }

    function closeEditModal() {
        setEditingCollection(null);
        setEditName('');
        setEditDesc('');
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        if (!editingCollection) return;
        try {
            await collectionService.update(editingCollection.id, {
                name: editName,
                description: editDesc,
            });
            closeEditModal();
            loadCollections();
        } catch (error) {
            console.error('Failed to update collection:', error);
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
                    onClick={() => setShowTypeModal(true)}
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
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => openEditModal(collection, e)}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/10 rounded-lg transition-colors"
                                        title="Edit collection"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(collection, e)}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete collection"
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

            {/* Collection Type Selection Modal */}
            <CollectionTypeModal
                isOpen={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                onSelect={handleTypeSelect}
            />

            {/* Image Collection Wizard */}
            <ImageCollectionWizard
                isOpen={showImageWizard}
                onClose={() => setShowImageWizard(false)}
                onSuccess={handleCollectionCreated}
            />

            {/* Placeholder Modal for Video/Documents */}
            {showPlaceholderModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-md p-6 shadow-xl text-center">
                        <div className={`inline-flex p-4 rounded-xl mb-4 ${
                            showPlaceholderModal === 'video' ? 'bg-red-500/10' : 'bg-gray-500/10'
                        }`}>
                            {showPlaceholderModal === 'video' ? (
                                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                            {showPlaceholderModal === 'video' ? 'Video Collections' : 'Document Collections'}
                        </h2>
                        <p className="text-[var(--color-text-muted)] mb-6">
                            {showPlaceholderModal === 'video'
                                ? 'Video collection features including scene detection, auto-captioning, and transcript generation are coming soon.'
                                : 'Document collection features including PDF support, OCR extraction, and AI summarization are coming soon.'
                            }
                        </p>
                        <button
                            onClick={() => setShowPlaceholderModal(null)}
                            className="px-6 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingCollection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] w-full max-w-md shadow-xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-default)]">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${editingCollection.type === 'audio_collection'
                                        ? 'bg-purple-500/10 text-purple-500'
                                        : 'bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    }`}>
                                    {editingCollection.type === 'audio_collection' ? (
                                        <Volume2 className="w-5 h-5" />
                                    ) : editingCollection.type === 'dataset' ? (
                                        <LayoutGrid className="w-5 h-5" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5" />
                                    )}
                                </div>
                                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Edit Collection</h2>
                            </div>
                            <button
                                onClick={closeEditModal}
                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleUpdate} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                                    placeholder="Collection name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                                <textarea
                                    value={editDesc}
                                    onChange={e => setEditDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none h-24 resize-none"
                                    placeholder="Optional description..."
                                />
                            </div>

                            {/* Collection Info */}
                            <div className="pt-2 border-t border-[var(--color-border-default)]">
                                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                                    <span>{editingCollection.items?.length || 0} items</span>
                                    <span>Updated {new Date(editingCollection.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        closeEditModal();
                                        navigate(`/collections/${editingCollection.id}`);
                                    }}
                                    className="flex-1 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    View Items
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
                title="Delete Collection"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently remove all ${deleteTarget?.items?.length || 0} items in this collection.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
