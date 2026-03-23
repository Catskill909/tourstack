import { useState, useEffect, useRef } from 'react';
import { X, FolderOpen, Volume2, Play, Pause, Check, Globe, Mic2, Search, AlertTriangle, Plus, ChevronRight } from 'lucide-react';
import {
    collectionService,
    type Collection,
    type AudioCollectionItem,
} from '../lib/collectionService';
import { getNativeLanguageName, getLanguageNameFromCode } from '../constants/languages';

// Language display names - Must match LT_LOAD_ONLY on LibreTranslate server
// Server loads: en,es,fr,de,ja,it,ko,zh,pt
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
};

// Helper to format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface ImportedAudioData {
    audioFiles: { [lang: string]: string };
    transcript: { [lang: string]: string };
    voiceInfo?: { [lang: string]: { name: string; provider: string } };
}

export interface CollectionPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: ImportedAudioData) => void;
    /** 'multi' imports all languages, 'single' lets user pick one language */
    mode: 'multi' | 'single';
    /** When mode='single', which field to populate */
    singleLanguageTarget?: string;
    /** Tour's current language list — used for reconciliation on multi-import */
    tourLanguages?: string[];
    /** Called when user opts to add extra collection languages to the tour */
    onLanguagesChanged?: (newLanguages: string[]) => void;
}

export function CollectionPickerModal({
    isOpen,
    onClose,
    onImport,
    mode,
    tourLanguages,
    onLanguagesChanged,
}: CollectionPickerModalProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('en');

    // Language reconciliation state (multi-import mode)
    const [showReconciliation, setShowReconciliation] = useState(false);
    const [languagesToAdd, setLanguagesToAdd] = useState<Set<string>>(new Set());

    // Audio preview state
    const [playingId, setPlayingId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Load audio collections on mount
    useEffect(() => {
        if (isOpen) {
            loadCollections();
        }
        return () => {
            // Cleanup audio on unmount
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [isOpen]);

    async function loadCollections() {
        setIsLoading(true);
        try {
            const data = await collectionService.getAudioCollections();
            setCollections(data);
        } catch (error) {
            console.error('Failed to load collections:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Filter collections by search
    const filteredCollections = collections.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get audio items from selected collection
    const audioItems = (selectedCollection?.items || []).filter(
        (item): item is AudioCollectionItem => item.type === 'audio'
    );

    // Get available languages from selected collection
    const availableLanguages = [...new Set(audioItems.map(item => item.language))];

    // Play/pause audio preview
    function handlePlayAudio(item: AudioCollectionItem) {
        if (playingId === item.id) {
            audioRef.current?.pause();
            setPlayingId(null);
            return;
        }

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(item.url);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);
        audio.play();
        audioRef.current = audio;
        setPlayingId(item.id);
    }

    // Compute language mismatch for multi-import mode
    const collectionLanguages = [...new Set(audioItems.map(i => i.language))];
    const extraLanguages = tourLanguages
        ? collectionLanguages.filter(l => !tourLanguages.includes(l))
        : [];
    const missingLanguages = tourLanguages
        ? tourLanguages.filter(l => !collectionLanguages.includes(l))
        : [];
    const hasLanguageMismatch = mode === 'multi' && tourLanguages && (extraLanguages.length > 0 || missingLanguages.length > 0);

    // Handle the import button click — check for mismatch first
    function handleImportClick() {
        if (!selectedCollection) return;

        // In multi mode with tour context, check for language mismatch
        if (mode === 'multi' && tourLanguages && extraLanguages.length > 0) {
            // Default: pre-select all extra languages for addition
            setLanguagesToAdd(new Set(extraLanguages));
            setShowReconciliation(true);
            return;
        }

        // No mismatch (or single mode) — import directly
        executeImport();
    }

    // Execute the actual import with the resolved language set
    function executeImport(addLanguages?: string[]) {
        if (!selectedCollection) return;

        const audioFiles: { [lang: string]: string } = {};
        const transcript: { [lang: string]: string } = {};
        const voiceInfo: { [lang: string]: { name: string; provider: string } } = {};

        if (mode === 'multi') {
            // Determine which languages to include
            const approvedLanguages = tourLanguages
                ? [...tourLanguages, ...(addLanguages || [])]
                : collectionLanguages;

            audioItems
                .filter(item => approvedLanguages.includes(item.language))
                .forEach(item => {
                    audioFiles[item.language] = item.url;
                    transcript[item.language] = item.text;
                    voiceInfo[item.language] = {
                        name: item.voice.name,
                        provider: item.provider,
                    };
                });

            // Notify parent to update tour languages if any were added
            if (addLanguages && addLanguages.length > 0 && onLanguagesChanged) {
                onLanguagesChanged([...tourLanguages!, ...addLanguages]);
            }
        } else {
            // Import ALL audio files and transcripts for Timeline Gallery
            // Timeline Gallery uses single audioUrl for playback but stores all for display/switching
            audioItems.forEach(item => {
                audioFiles[item.language] = item.url;
                transcript[item.language] = item.text;
                voiceInfo[item.language] = {
                    name: item.voice.name,
                    provider: item.provider,
                };
            });
        }

        onImport({ audioFiles, transcript, voiceInfo });
        setShowReconciliation(false);
        handleClose();
    }

    // Toggle a language in the add-set during reconciliation
    function toggleLanguageToAdd(lang: string) {
        setLanguagesToAdd(prev => {
            const next = new Set(prev);
            if (next.has(lang)) next.delete(lang);
            else next.add(lang);
            return next;
        });
    }

    function handleClose() {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setPlayingId(null);
        setSelectedCollection(null);
        setSelectedLanguage('en');
        setSearchQuery('');
        setShowReconciliation(false);
        setLanguagesToAdd(new Set());
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                            <FolderOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                Import from Collection
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {mode === 'multi'
                                    ? 'Select a collection to import all languages'
                                    : 'Select a collection and language to import'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-secondary)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!selectedCollection ? (
                        /* Collection List View */
                        <div className="space-y-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Search collections..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm focus:outline-none focus:border-[var(--color-accent-primary)]"
                                />
                            </div>

                            {/* Collection Cards */}
                            {isLoading ? (
                                <div className="text-center py-12 text-[var(--color-text-muted)]">
                                    Loading collections...
                                </div>
                            ) : filteredCollections.length === 0 ? (
                                <div className="text-center py-12">
                                    <Volume2 className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-50" />
                                    <h3 className="text-[var(--color-text-primary)] font-medium mb-2">
                                        No Audio Collections Found
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Create audio collections from the Audio page using "Create Collection"
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredCollections.map(collection => {
                                        const items = (collection.items || []).filter(
                                            (i): i is AudioCollectionItem => i.type === 'audio'
                                        );
                                        const languages = [...new Set(items.map(i => i.language))];
                                        const totalSize = items.reduce((sum, i) => sum + (i.fileSize || 0), 0);

                                        return (
                                            <button
                                                key={collection.id}
                                                onClick={() => setSelectedCollection(collection)}
                                                className="w-full text-left p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl hover:border-[var(--color-accent-primary)] hover:bg-[var(--color-bg-hover)] transition-all group"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                                        <Volume2 className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-primary)] transition-colors">
                                                            {collection.name}
                                                        </h3>
                                                        {collection.description && (
                                                            <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
                                                                {collection.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-muted)]">
                                                            <span className="flex items-center gap-1">
                                                                <Globe className="w-3.5 h-3.5" />
                                                                {languages.length} language{languages.length !== 1 ? 's' : ''}
                                                            </span>
                                                            <span>{formatFileSize(totalSize)}</span>
                                                            <span>
                                                                {new Date(collection.updatedAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        {/* Language badges — color-coded for tour match */}
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {languages.map(lang => {
                                                                const inTour = !tourLanguages || tourLanguages.includes(lang);
                                                                return (
                                                                    <span
                                                                        key={lang}
                                                                        className={`px-2 py-0.5 text-xs rounded-full border ${
                                                                            inTour
                                                                                ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-default)]'
                                                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                        }`}
                                                                    >
                                                                        {!inTour && '+ '}{LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Collection Detail View */
                        <div className="space-y-4">
                            {/* Back button and title */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedCollection(null)}
                                    className="text-sm text-[var(--color-accent-primary)] hover:underline"
                                >
                                    ← Back to collections
                                </button>
                            </div>

                            <div className="p-4 bg-[var(--color-bg-elevated)] rounded-xl border border-[var(--color-border-default)]">
                                <div className="flex items-start gap-3">
                                    <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Volume2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                                            {selectedCollection.name}
                                        </h3>
                                        {selectedCollection.description && (
                                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                                {selectedCollection.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Single language mode: Language selector */}
                            {mode === 'single' && availableLanguages.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                        Select Language to Import
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {availableLanguages.map(lang => (
                                            <button
                                                key={lang}
                                                onClick={() => setSelectedLanguage(lang)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${selectedLanguage === lang
                                                    ? 'bg-[var(--color-accent-primary)] text-white border-[var(--color-accent-primary)]'
                                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border-[var(--color-border-default)] hover:border-[var(--color-accent-primary)]'
                                                    }`}
                                            >
                                                {selectedLanguage === lang && <Check className="w-4 h-4" />}
                                                {LANGUAGE_NAMES[lang] || lang.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Audio items preview */}
                            <div>
                                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                    {mode === 'multi' ? 'Audio Files to Import' : 'Preview'}
                                </h4>
                                <div className="space-y-2">
                                    {audioItems
                                        .filter(item => mode === 'multi' || item.language === selectedLanguage)
                                        .map(item => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                                            >
                                                {/* Play button */}
                                                <button
                                                    onClick={() => handlePlayAudio(item)}
                                                    className="p-2 rounded-full bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-colors"
                                                >
                                                    {playingId === item.id ? (
                                                        <Pause className="w-4 h-4" />
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                </button>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs font-medium rounded-full">
                                                            {LANGUAGE_NAMES[item.language] || item.language.toUpperCase()}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                                                            <Mic2 className="w-3 h-3" />
                                                            {item.voice.name}
                                                        </span>
                                                        <span className="text-xs text-[var(--color-text-muted)]">
                                                            {formatFileSize(item.fileSize)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--color-text-secondary)] mt-1 line-clamp-1">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Language Reconciliation Overlay */}
                {showReconciliation && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
                        <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-md mx-6 shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400">
                                        <AlertTriangle className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                        Language Mismatch
                                    </h3>
                                </div>
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                    This collection has languages that aren't in your tour yet.
                                    Choose which to add:
                                </p>
                            </div>

                            {/* Extra languages (in collection, not in tour) */}
                            <div className="px-6 pb-4 space-y-2">
                                <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                                    New languages from collection
                                </div>
                                {extraLanguages.map(lang => {
                                    const selected = languagesToAdd.has(lang);
                                    return (
                                        <button
                                            key={lang}
                                            onClick={() => toggleLanguageToAdd(lang)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                                                selected
                                                    ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/40 text-[var(--color-text-primary)]'
                                                    : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]'
                                            }`}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                                selected
                                                    ? 'bg-[var(--color-accent-primary)] border-[var(--color-accent-primary)]'
                                                    : 'border-[var(--color-border-default)]'
                                            }`}>
                                                {selected && <Check className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <span className="font-medium">{getLanguageNameFromCode(lang)}</span>
                                                <span className="text-[var(--color-text-muted)] ml-2 text-sm">
                                                    {getNativeLanguageName(lang)}
                                                </span>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border-default)]">
                                                {lang.toUpperCase()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Missing languages warning */}
                            {missingLanguages.length > 0 && (
                                <div className="px-6 pb-4">
                                    <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                        <p className="text-xs text-amber-400/90">
                                            <span className="font-medium">Note:</span> Your tour includes{' '}
                                            {missingLanguages.map(l => getLanguageNameFromCode(l)).join(', ')}{' '}
                                            but this collection doesn't have audio for {missingLanguages.length === 1 ? 'it' : 'them'}.
                                            Those slots will remain empty.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Tour languages summary */}
                            <div className="px-6 pb-4">
                                <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-2 flex-wrap">
                                    <span>Tour languages:</span>
                                    {tourLanguages?.map(lang => (
                                        <span key={lang} className="px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-default)]">
                                            {lang.toUpperCase()}
                                        </span>
                                    ))}
                                    {[...languagesToAdd].map(lang => (
                                        <span key={lang} className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                                            + {lang.toUpperCase()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="px-6 py-4 border-t border-[var(--color-border-default)] flex gap-3">
                                <button
                                    onClick={() => {
                                        // Import only tour languages (skip extras)
                                        executeImport([]);
                                    }}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    Skip extras
                                </button>
                                <button
                                    onClick={() => {
                                        executeImport([...languagesToAdd]);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-[var(--color-accent-primary)] text-white rounded-xl hover:opacity-90 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    {languagesToAdd.size > 0
                                        ? `Add ${languagesToAdd.size} & Import`
                                        : 'Import'
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!showReconciliation && (
                    <div className="px-6 py-4 border-t border-[var(--color-border-default)] flex items-center justify-between gap-3">
                        {/* Language match indicator for multi mode */}
                        <div className="flex-1 min-w-0">
                            {selectedCollection && mode === 'multi' && tourLanguages && (
                                hasLanguageMismatch ? (
                                    <div className="flex items-center gap-2 text-xs text-amber-400">
                                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>
                                            {extraLanguages.length > 0 && `${extraLanguages.length} extra language${extraLanguages.length > 1 ? 's' : ''}`}
                                            {extraLanguages.length > 0 && missingLanguages.length > 0 && ' · '}
                                            {missingLanguages.length > 0 && `${missingLanguages.length} missing`}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-green-400">
                                        <Check className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Languages match your tour</span>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImportClick}
                                disabled={!selectedCollection || (mode === 'single' && !audioItems.find(i => i.language === selectedLanguage))}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {mode === 'multi' && hasLanguageMismatch ? (
                                    <>
                                        <ChevronRight className="w-4 h-4" />
                                        Review & Import
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        {mode === 'multi'
                                            ? `Import ${audioItems.length} Files`
                                            : 'Import Selected'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
