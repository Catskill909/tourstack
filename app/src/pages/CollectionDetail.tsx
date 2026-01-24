import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Play, Pause, Volume2, Download, Globe, Mic2, Eye } from 'lucide-react';
import { collectionService, type CollectionItem } from '../lib/collectionService';
import { TextPreviewModal } from '../components/TextPreviewModal';

// Helper to format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Language name mapping
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    nl: 'Dutch',
};

// Audio item type for audio collections
interface AudioCollectionItem extends CollectionItem {
    type: 'audio';
    language?: string;
    voice?: { id: string; name: string; gender?: string };
    provider?: string;
    format?: string;
    fileSize?: number;
    text?: string;
}

export function CollectionDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [collection, setCollection] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [items, setItems] = useState<CollectionItem[]>([]);

    // Audio playback state
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Text preview modal state
    const [textPreviewModal, setTextPreviewModal] = useState<{
        title: string;
        text: string;
        language?: string;
        voiceName?: string;
    } | null>(null);

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

    // Audio playback
    function handlePlayAudio(item: AudioCollectionItem) {
        if (playingId === item.id) {
            // Stop playing
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }

        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
        }

        // Create new audio element
        const audio = new Audio(item.url);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play();
        audioRef.current = audio;
        setPlayingId(item.id);
    }

    if (isLoading) return <div className="p-6 text-center text-[var(--color-text-muted)]">Loading...</div>;
    if (!collection) return <div className="p-6 text-center text-red-500">Collection not found</div>;

    const isAudioCollection = collection.type === 'audio_collection';

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
                            {items.length} items • {isAudioCollection ? 'Audio Collection' : collection.type}
                        </p>
                    </div>
                </div>
                {!isAudioCollection && (
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                    </button>
                )}
            </div>

            {/* Audio Collection: Source Text */}
            {isAudioCollection && collection.texts?.en && (
                <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-4">
                    <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">Source Text (English)</h3>
                    <p className="text-[var(--color-text-primary)]">{collection.texts.en}</p>
                </div>
            )}

            {/* Audio Collection: TTS Settings */}
            {isAudioCollection && collection.ttsSettings && (
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                        {collection.ttsSettings.provider === 'elevenlabs' ? 'ElevenLabs' : 'Deepgram'}
                    </span>
                    {collection.ttsSettings.modelName && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                            {collection.ttsSettings.modelName}
                        </span>
                    )}
                    {collection.ttsSettings.format && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                            {collection.ttsSettings.format.toUpperCase()}
                        </span>
                    )}
                </div>
            )}

            {/* Items Grid - Audio Collection */}
            {isAudioCollection ? (
                <div className="space-y-3">
                    {(items as AudioCollectionItem[]).map((item) => (
                        <div
                            key={item.id}
                            className="bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl p-4 flex items-center gap-4"
                        >
                            {/* Play Button */}
                            <button
                                onClick={() => handlePlayAudio(item)}
                                className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${playingId === item.id
                                        ? 'bg-[var(--color-accent-primary)] text-white'
                                        : 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-primary)]/20 hover:text-[var(--color-accent-primary)]'
                                    }`}
                            >
                                {playingId === item.id ? (
                                    <Pause className="w-5 h-5" />
                                ) : (
                                    <Play className="w-5 h-5 ml-0.5" />
                                )}
                            </button>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Language Badge */}
                                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium flex items-center gap-1">
                                        <Globe className="w-3 h-3" />
                                        {LANGUAGE_NAMES[item.language || 'en'] || item.language}
                                    </span>
                                    {/* Voice Badge */}
                                    {item.voice?.name && (
                                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium flex items-center gap-1">
                                            <Mic2 className="w-3 h-3" />
                                            {item.voice.name}
                                        </span>
                                    )}
                                    {/* File Size */}
                                    {item.fileSize && (
                                        <span className="px-2.5 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">
                                            {formatFileSize(item.fileSize)}
                                        </span>
                                    )}
                                </div>
                                {/* Translated Text Preview - Clickable */}
                                {item.text && (
                                    <button
                                        onClick={() => setTextPreviewModal({
                                            title: LANGUAGE_NAMES[item.language || 'en'] || item.language || 'Audio',
                                            text: item.text || '',
                                            language: LANGUAGE_NAMES[item.language || 'en'] || item.language,
                                            voiceName: item.voice?.name,
                                        })}
                                        className="w-full text-left mt-2 flex items-center gap-2 group cursor-pointer hover:bg-[var(--color-bg-hover)] rounded-lg p-1.5 -m-1.5 transition-colors"
                                        title="Click to see full text"
                                    >
                                        <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 group-hover:text-[var(--color-accent-primary)] group-hover:underline transition-colors">
                                            {item.text}
                                        </p>
                                        <Eye className="w-4 h-4 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <a
                                    href={item.url}
                                    download
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Items Grid - Image Gallery */
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
            )}

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

            {/* Text Preview Modal */}
            <TextPreviewModal
                isOpen={textPreviewModal !== null}
                onClose={() => setTextPreviewModal(null)}
                title={textPreviewModal?.title || ''}
                text={textPreviewModal?.text || ''}
                language={textPreviewModal?.language}
                voiceName={textPreviewModal?.voiceName}
            />
        </div>
    );
}
