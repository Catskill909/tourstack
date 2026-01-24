import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Volume2,
    Languages,
    FolderPlus,
    ChevronDown,
    FileAudio,
    HardDrive,
    Mic2,
    ExternalLink,
    Edit3,
} from 'lucide-react';
import { collectionService } from '../lib/collectionService';
import type { Voice } from '../services/audioService';
import * as elevenlabsService from '../services/elevenlabsService';

interface LanguageVoices {
    name: string;
    voices: Voice[];
}

// Generated item from API response
interface GeneratedItem {
    id: string;
    type: 'audio';
    url: string;
    language: string;
    voice: { id: string; name: string; gender?: string };
    provider: string;
    format: string;
    sampleRate?: number;
    fileSize: number;
    duration?: number;
    text: string;
    order: number;
}

interface AudioCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    text: string;
    provider: 'deepgram' | 'elevenlabs';
    voices: Record<string, LanguageVoices> | null;
    formats: { formats: { id: string; name: string }[]; sampleRates: { id: number; name: string }[] } | null;
    defaultFormat: string;
    defaultSampleRate: number;
    onSuccess?: (collectionId: string) => void;
}

interface LanguageSelection {
    code: string;
    name: string;
    enabled: boolean;
    voiceId: string;
    voiceName: string;
    translationAvailable: boolean;
}

interface GenerationResult {
    language: string;
    success: boolean;
    item?: GeneratedItem;
    error?: string;
}

const TRANSLATION_AVAILABLE = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'zh'];

// ElevenLabs supported languages (subset that LibreTranslate can handle)
const ELEVENLABS_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
];

// Default ElevenLabs formats (fallback if API fails)
const DEFAULT_ELEVENLABS_FORMATS = [
    { id: 'mp3_22050_32', name: 'MP3 22kHz 32kbps (Low)' },
    { id: 'mp3_44100_64', name: 'MP3 44kHz 64kbps (Medium)' },
    { id: 'mp3_44100_128', name: 'MP3 44kHz 128kbps (Standard)' },
    { id: 'mp3_44100_192', name: 'MP3 44kHz 192kbps (High)' },
    { id: 'pcm_16000', name: 'PCM 16kHz (Compact)' },
    { id: 'pcm_22050', name: 'PCM 22kHz' },
    { id: 'pcm_24000', name: 'PCM 24kHz' },
    { id: 'pcm_44100', name: 'PCM 44kHz (High Quality)' },
    { id: 'ulaw_8000', name: 'μ-law 8kHz (Telephony)' },
];

// Helper to format file size
function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Helper to format sample rate
function formatSampleRate(rate?: number): string {
    if (!rate) return '';
    return `${rate / 1000}kHz`;
}

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German',
    it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean',
    zh: 'Chinese', nl: 'Dutch',
};

export function AudioCollectionModal({
    isOpen,
    onClose,
    text,
    provider,
    voices,
    formats,
    defaultFormat,
    defaultSampleRate,
    onSuccess,
}: AudioCollectionModalProps) {
    // Collection metadata
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');

    // Generation settings
    const [format, setFormat] = useState(defaultFormat);
    const [sampleRate, setSampleRate] = useState(defaultSampleRate);
    const [autoTranslate, setAutoTranslate] = useState(true);

    // Language selections
    const [languages, setLanguages] = useState<LanguageSelection[]>([]);

    // ElevenLabs voice state (for when provider is elevenlabs)
    const [elVoices, setElVoices] = useState<elevenlabsService.ElevenLabsVoice[]>([]);
    const [elFormats, setElFormats] = useState<{ id: string; name: string }[]>(DEFAULT_ELEVENLABS_FORMATS);
    const [isLoadingVoices, setIsLoadingVoices] = useState(false);
    const [elSelectedFormat, setElSelectedFormat] = useState('mp3_44100_128');

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResults, setGenerationResults] = useState<GenerationResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [createdCollectionId, setCreatedCollectionId] = useState<string | null>(null);

    // Initialize languages from voices (Deepgram) or static list (ElevenLabs)
    useEffect(() => {
        if (!isOpen) return;

        if (provider === 'deepgram' && voices) {
            // Deepgram: use voice data per language
            const langSelections: LanguageSelection[] = Object.entries(voices).map(([code, data]) => {
                const defaultVoice = data.voices.find(v => v.featured) || data.voices[0];
                return {
                    code,
                    name: data.name,
                    enabled: code === 'en', // Default only English enabled
                    voiceId: defaultVoice?.id || '',
                    voiceName: defaultVoice?.name || '',
                    translationAvailable: TRANSLATION_AVAILABLE.includes(code),
                };
            });
            setLanguages(langSelections);
        } else if (provider === 'elevenlabs') {
            // ElevenLabs: Fetch voices and assign DIFFERENT default voice to each language
            setIsLoadingVoices(true);
            elevenlabsService.getVoices('en').then(result => {
                setElVoices(result.voices);
                const voices = result.voices;
                
                // Assign different voices to each language (cycle through available voices)
                if (voices.length > 0) {
                    setLanguages(prev => prev.map((lang, index) => {
                        const voiceIndex = index % voices.length; // Cycle through voices
                        const voice = voices[voiceIndex];
                        return {
                            ...lang,
                            voiceId: voice.id,
                            voiceName: voice.name,
                        };
                    }));
                }
            }).catch(err => {
                console.error('Failed to load ElevenLabs voices:', err);
            }).finally(() => {
                setIsLoadingVoices(false);
            });

            // Fetch ElevenLabs formats (use defaults as fallback, already set in state init)
            elevenlabsService.getFormats().then(formats => {
                if (formats && formats.length > 0) {
                    setElFormats(formats);
                }
                // If empty or fails, DEFAULT_ELEVENLABS_FORMATS is already set
            }).catch(err => {
                console.error('Failed to load ElevenLabs formats:', err);
                // Keep using DEFAULT_ELEVENLABS_FORMATS which is already set
            });

            // Initialize languages (voices will be set when fetched above)
            const langSelections: LanguageSelection[] = ELEVENLABS_LANGUAGES.map(lang => ({
                code: lang.code,
                name: lang.name,
                enabled: lang.code === 'en',
                voiceId: '', // Will be set when voices load
                voiceName: '',
                translationAvailable: TRANSLATION_AVAILABLE.includes(lang.code),
            }));
            setLanguages(langSelections);
        }

        // Reset state
        setCollectionName('');
        setCollectionDescription('');
        setFormat(defaultFormat);
        setSampleRate(defaultSampleRate);
        setElSelectedFormat('mp3_44100_128');
        setAutoTranslate(true);
        setIsGenerating(false);
        setGenerationResults([]);
        setError(null);
        setSuccess(false);
        setCreatedCollectionId(null);
    }, [voices, isOpen, defaultFormat, defaultSampleRate, provider]);

    const toggleLanguage = (code: string) => {
        setLanguages(prev => prev.map(lang =>
            lang.code === code ? { ...lang, enabled: !lang.enabled } : lang
        ));
    };

    const updateVoice = (code: string, voiceId: string, voiceName: string) => {
        setLanguages(prev => prev.map(lang =>
            lang.code === code ? { ...lang, voiceId, voiceName } : lang
        ));
    };

    const enabledLanguages = languages.filter(l => l.enabled);
    const estimatedFiles = enabledLanguages.length;

    const handleGenerate = async () => {
        if (!collectionName.trim()) {
            setError('Please enter a collection name');
            return;
        }

        if (enabledLanguages.length === 0) {
            setError('Please select at least one language');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setGenerationResults([]);

        try {
            // Call appropriate batch generation endpoint based on provider
            const endpoint = provider === 'elevenlabs'
                ? '/api/elevenlabs/generate-batch'
                : '/api/audio/generate-batch';

            // Build request body based on provider
            const requestBody = provider === 'elevenlabs'
                ? {
                    text,
                    collectionName: collectionName.trim(),
                    collectionDescription: collectionDescription.trim(),
                    outputFormat: elSelectedFormat,
                    autoTranslate,
                    sourceLanguage: 'en',
                    languages: enabledLanguages.map(l => ({
                        code: l.code,
                        voiceId: l.voiceId,
                        voiceName: l.voiceName,
                    })),
                }
                : {
                    text,
                    collectionName: collectionName.trim(),
                    collectionDescription: collectionDescription.trim(),
                    provider,
                    format,
                    sampleRate,
                    autoTranslate,
                    sourceLanguage: 'en',
                    languages: enabledLanguages.map(l => ({
                        code: l.code,
                        voiceId: l.voiceId,
                        voiceName: l.voiceName,
                    })),
                };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Generation failed');
            }

            const data = await response.json();

            // Update results
            setGenerationResults(data.results);

            // Save collection to database
            if (data.collection && data.summary.successful > 0) {
                const savedCollection = await collectionService.create({
                    name: data.collection.name,
                    description: data.collection.description,
                    type: 'audio_collection',
                    items: data.collection.items,
                    sourceLanguage: data.collection.sourceLanguage,
                    texts: data.collection.texts,
                    ttsSettings: data.collection.ttsSettings,
                });

                setCreatedCollectionId(savedCollection.id);
                setSuccess(true);

                if (onSuccess) {
                    onSuccess(savedCollection.id);
                }
            } else if (data.summary.successful === 0) {
                setError('All generations failed. Please check your settings and try again.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-default)]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                            <FolderPlus className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                Create Audio Collection
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Generate TTS audio in multiple languages
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isGenerating}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg text-[var(--color-text-muted)] transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {success ? (
                        // Success state with detailed metadata
                        <div className="space-y-6">
                            {/* Success Header */}
                            <div className="text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                                    Collection Created Successfully!
                                </h3>
                                <p className="text-[var(--color-text-secondary)]">
                                    <span className="font-medium text-[var(--color-text-primary)]">{collectionName}</span>
                                </p>
                            </div>

                            {/* Summary Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)] text-center">
                                    <FileAudio className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                        {generationResults.filter(r => r.success).length}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Files Generated</p>
                                </div>
                                <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)] text-center">
                                    <HardDrive className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                                        {formatFileSize(
                                            generationResults
                                                .filter(r => r.success && r.item)
                                                .reduce((sum, r) => sum + (r.item?.fileSize || 0), 0)
                                        )}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Total Size</p>
                                </div>
                                <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)] text-center">
                                    <Mic2 className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-[var(--color-text-primary)] capitalize">
                                        {provider}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Provider</p>
                                </div>
                            </div>

                            {/* Generated Files List */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                                    <Languages className="w-4 h-4" />
                                    Generated Audio Files
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {generationResults.map((result) => (
                                        <div
                                            key={result.language}
                                            className={`p-3 rounded-lg border ${result.success
                                                ? 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]'
                                                : 'bg-red-500/10 border-red-500/20'
                                                }`}
                                        >
                                            {result.success && result.item ? (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-blue-500 uppercase">
                                                                {result.language}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                                {LANGUAGE_NAMES[result.language] || result.language}
                                                            </p>
                                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                                {result.item.voice.name}
                                                                {result.item.voice.gender && ` (${result.item.voice.gender})`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex gap-1.5">
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-purple-500/20 text-purple-400 rounded">
                                                                {result.item.format.toUpperCase()}
                                                            </span>
                                                            {result.item.sampleRate && (
                                                                <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded">
                                                                    {formatSampleRate(result.item.sampleRate)}
                                                                </span>
                                                            )}
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-500/20 text-gray-400 rounded">
                                                                {formatFileSize(result.item.fileSize)}
                                                            </span>
                                                        </div>
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                    <span className="text-sm text-red-400">
                                                        {LANGUAGE_NAMES[result.language] || result.language}: {result.error || 'Failed'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* TTS Settings Summary */}
                            <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                                <h4 className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
                                    Generation Settings
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 text-xs bg-[var(--color-bg-surface)] rounded text-[var(--color-text-secondary)]">
                                        Provider: <span className="font-medium capitalize">{provider}</span>
                                    </span>
                                    <span className="px-2 py-1 text-xs bg-[var(--color-bg-surface)] rounded text-[var(--color-text-secondary)]">
                                        Format: <span className="font-medium uppercase">{format}</span>
                                    </span>
                                    {provider === 'deepgram' && (
                                        <span className="px-2 py-1 text-xs bg-[var(--color-bg-surface)] rounded text-[var(--color-text-secondary)]">
                                            Sample Rate: <span className="font-medium">{formatSampleRate(sampleRate)}</span>
                                        </span>
                                    )}
                                    <span className="px-2 py-1 text-xs bg-[var(--color-bg-surface)] rounded text-[var(--color-text-secondary)]">
                                        Auto-Translate: <span className="font-medium">{autoTranslate ? 'Yes' : 'No'}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Stay & Continue Editing
                                </button>
                                <a
                                    href={`/collections/${createdCollectionId}`}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all font-medium"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    View Collection
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Collection Details */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                                    <FolderPlus className="w-4 h-4" />
                                    Collection Details
                                </h3>
                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                            Collection Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={collectionName}
                                            onChange={(e) => setCollectionName(e.target.value)}
                                            placeholder="e.g., Museum Introduction Narration"
                                            disabled={isGenerating}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                            Description (optional)
                                        </label>
                                        <textarea
                                            value={collectionDescription}
                                            onChange={(e) => setCollectionDescription(e.target.value)}
                                            placeholder="Brief description of this audio collection..."
                                            rows={2}
                                            disabled={isGenerating}
                                            className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-none disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Generation Settings */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    Generation Settings
                                </h3>

                                {/* ElevenLabs: Audio Quality only (voice is per-language below) */}
                                {provider === 'elevenlabs' && (
                                    <div>
                                        <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                            Audio Quality
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={elSelectedFormat}
                                                onChange={(e) => setElSelectedFormat(e.target.value)}
                                                disabled={isGenerating}
                                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50"
                                            >
                                                {elFormats.map((fmt) => (
                                                    <option key={fmt.id} value={fmt.id}>{fmt.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {/* Deepgram: Format and Sample Rate */}
                                {provider === 'deepgram' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                                Format
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={format}
                                                    onChange={(e) => setFormat(e.target.value)}
                                                    disabled={isGenerating}
                                                    className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50"
                                                >
                                                    {formats?.formats.map((fmt) => (
                                                        <option key={fmt.id} value={fmt.id}>{fmt.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm text-[var(--color-text-muted)] mb-1">
                                                Sample Rate
                                            </label>
                                            <div className="relative">
                                                <select
                                                    value={sampleRate}
                                                    onChange={(e) => setSampleRate(Number(e.target.value))}
                                                    disabled={isGenerating}
                                                    className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50"
                                                >
                                                    {formats?.sampleRates.map((rate) => (
                                                        <option key={rate.id} value={rate.id}>{rate.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Auto-translate toggle */}
                                <div className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Languages className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                Auto-translate from English
                                            </p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                Automatically translate text for each language
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoTranslate(!autoTranslate)}
                                        disabled={isGenerating}
                                        className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 ${autoTranslate ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-hover)]'
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoTranslate ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Language Selection */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-2">
                                    <Languages className="w-4 h-4" />
                                    Languages to Generate ({enabledLanguages.length} selected)
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {languages.map((lang) => (
                                        <div
                                            key={lang.code}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${lang.enabled
                                                ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/30'
                                                : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)]'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={lang.enabled}
                                                    onChange={() => toggleLanguage(lang.code)}
                                                    disabled={isGenerating}
                                                    className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                                />
                                                <div>
                                                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                                        {lang.name}
                                                    </span>
                                                    {lang.code !== 'en' && (
                                                        <span className={`ml-2 text-xs ${lang.translationAvailable ? 'text-green-500' : 'text-amber-500'
                                                            }`}>
                                                            {lang.translationAvailable ? '✓ Translation available' : '⚠ No auto-translation'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Show voice dropdown for Deepgram */}
                                            {provider === 'deepgram' && voices && voices[lang.code] && (
                                                <div className="relative">
                                                    <select
                                                        value={lang.voiceId}
                                                        onChange={(e) => {
                                                            const voice = voices[lang.code]?.voices.find(v => v.id === e.target.value);
                                                            if (voice) {
                                                                updateVoice(lang.code, voice.id, voice.name);
                                                            }
                                                        }}
                                                        disabled={isGenerating || !lang.enabled}
                                                        className={`pl-3 pr-8 py-1.5 text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50 ${!lang.enabled ? 'opacity-50' : ''}`}
                                                    >
                                                        {voices[lang.code]?.voices.map((voice) => (
                                                            <option key={voice.id} value={voice.id}>
                                                                {voice.name} ({voice.gender})
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)] pointer-events-none" />
                                                </div>
                                            )}
                                            {/* Show voice dropdown for ElevenLabs (same voices for all languages) */}
                                            {provider === 'elevenlabs' && elVoices.length > 0 && (
                                                <div className="relative">
                                                    <select
                                                        value={lang.voiceId}
                                                        onChange={(e) => {
                                                            const voice = elVoices.find(v => v.id === e.target.value);
                                                            if (voice) {
                                                                updateVoice(lang.code, voice.id, voice.name);
                                                            }
                                                        }}
                                                        disabled={isGenerating || !lang.enabled || isLoadingVoices}
                                                        className={`pl-3 pr-8 py-1.5 text-sm bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:outline-none disabled:opacity-50 ${!lang.enabled ? 'opacity-50' : ''}`}
                                                    >
                                                        {elVoices.map((voice) => (
                                                            <option key={voice.id} value={voice.id}>
                                                                {voice.name} {voice.labels?.gender ? `(${voice.labels.gender})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--color-text-muted)] pointer-events-none" />
                                                </div>
                                            )}
                                            {/* Show loading state for ElevenLabs voices */}
                                            {provider === 'elevenlabs' && isLoadingVoices && (
                                                <span className="text-xs text-[var(--color-text-muted)]">Loading voices...</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Generation Progress */}
                            {isGenerating && (
                                <div className="space-y-3 p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-[var(--color-accent-primary)]" />
                                        <span className="text-sm text-[var(--color-text-primary)]">
                                            Generating audio files...
                                        </span>
                                    </div>
                                    {generationResults.length > 0 && (
                                        <div className="space-y-1">
                                            {generationResults.map((result) => (
                                                <div key={result.language} className="flex items-center gap-2 text-sm">
                                                    {result.success ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    )}
                                                    <span className={result.success ? 'text-green-500' : 'text-red-500'}>
                                                        {languages.find(l => l.code === result.language)?.name || result.language}
                                                        {!result.success && result.error && `: ${result.error}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="flex items-center justify-between p-6 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                        <div className="text-sm text-[var(--color-text-muted)]">
                            {estimatedFiles > 0 ? (
                                <span>
                                    📊 {estimatedFiles} audio file{estimatedFiles > 1 ? 's' : ''} will be generated
                                </span>
                            ) : (
                                <span>Select languages to generate</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-4 py-2.5 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || enabledLanguages.length === 0 || !collectionName.trim()}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-4 h-4" />
                                        Generate {estimatedFiles} File{estimatedFiles > 1 ? 's' : ''}
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
