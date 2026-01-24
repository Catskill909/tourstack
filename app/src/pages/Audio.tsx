import { useState, useEffect, useRef } from 'react';
import {
    Volume2,
    Mic,
    AudioWaveform,
    Settings2,
    Lock,
    Play,
    Pause,
    Download,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ChevronDown,
    User,
    Users,
    X,
    AlertTriangle,
    FolderPlus,
} from 'lucide-react';
import { AudioCollectionModal } from '../components/AudioCollectionModal';
import { TextPreviewModal } from '../components/TextPreviewModal';
import { translateText } from '../services/translationService';

// Languages supported by LibreTranslate for auto-translation
// Maps ElevenLabs language codes to LibreTranslate codes
const TRANSLATION_LANGUAGE_MAP: Record<string, string> = {
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
    'de': 'de',
    'it': 'it',
    'ja': 'ja',
    'ko': 'ko',
    'pt': 'pt',
    'zh': 'zh-Hans', // LibreTranslate uses zh-Hans for Chinese
};

// Helper to check if a language has translation available
const isTranslationAvailable = (langCode: string): boolean => {
    return langCode in TRANSLATION_LANGUAGE_MAP;
};

// Get display name with availability indicator
const getLanguageDisplayName = (name: string, code: string): string => {
    if (code === 'en') return name; // English doesn't need translation
    return isTranslationAvailable(code) ? `${name} ✓` : name;
};

import {
    getVoices,
    getFormats,
    getStatus,
    getAudioFiles,
    generateAudio,
    deleteAudioFile,
    getVoicePreview,
    formatFileSize,
    type VoicesResponse,
    type FormatsResponse,
    type GeneratedAudio,
    type AudioServiceStatus,
    type Voice
} from '../services/audioService';

import * as elevenlabsService from '../services/elevenlabsService';

type TabId = 'deepgram' | 'whisper' | 'elevenlabs';

interface Tab {
    id: TabId;
    name: string;
    icon: React.ElementType;
    status: 'active' | 'coming_soon';
    description: string;
}

const tabs: Tab[] = [
    {
        id: 'deepgram',
        name: 'Deepgram',
        icon: AudioWaveform,
        status: 'active',
        description: 'Aura TTS - High-quality neural text-to-speech'
    },
    {
        id: 'whisper',
        name: 'Whisper',
        icon: Mic,
        status: 'coming_soon',
        description: 'Self-hosted speech-to-text for transcription'
    },
    {
        id: 'elevenlabs',
        name: 'ElevenLabs',
        icon: Volume2,
        status: 'active',
        description: 'Premium voice cloning and synthesis'
    },
];

export function Audio() {
    const [activeTab, setActiveTab] = useState<TabId>('deepgram');
    const [status, setStatus] = useState<AudioServiceStatus | null>(null);
    const [voices, setVoices] = useState<VoicesResponse | null>(null);
    const [formats, setFormats] = useState<FormatsResponse | null>(null);
    const [audioFiles, setAudioFiles] = useState<GeneratedAudio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generator state
    const [text, setText] = useState('');
    const [selectedVoice, setSelectedVoice] = useState('aura-2-thalia-en');
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [selectedFormat, setSelectedFormat] = useState('mp3');
    const [selectedSampleRate, setSelectedSampleRate] = useState(24000);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [autoTranslate, setAutoTranslate] = useState(true);
    const [isTranslating, setIsTranslating] = useState(false);

    // Preview state
    const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
    const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

    // Player state
    const [playingId, setPlayingId] = useState<string | null>(null);
    const [playerAudio, setPlayerAudio] = useState<HTMLAudioElement | null>(null);

    // Success modal state
    const [successModal, setSuccessModal] = useState<GeneratedAudio | null>(null);

    // Ref for scrolling to generated files
    const generatedFilesRef = useRef<HTMLDivElement>(null);

    // ElevenLabs state
    const [elStatus, setElStatus] = useState<elevenlabsService.ElevenLabsStatus | null>(null);
    const [elVoices, setElVoices] = useState<elevenlabsService.ElevenLabsVoice[]>([]);
    const [elModels, setElModels] = useState<elevenlabsService.ElevenLabsModel[]>([]);
    const [elFormats, setElFormats] = useState<elevenlabsService.ElevenLabsFormat[]>([]);
    const [elLanguages, setElLanguages] = useState<elevenlabsService.ElevenLabsLanguage[]>([]);
    const [elAudioFiles, setElAudioFiles] = useState<elevenlabsService.GeneratedAudio[]>([]);
    const [elText, setElText] = useState('');
    const [elSelectedVoice, setElSelectedVoice] = useState<string>('');
    const [elSelectedVoiceName, setElSelectedVoiceName] = useState<string>('');
    const [elSelectedModel, setElSelectedModel] = useState('eleven_multilingual_v2');
    const [elSelectedFormat, setElSelectedFormat] = useState('mp3_44100_128');
    const [elSelectedLanguage, setElSelectedLanguage] = useState('en');
    const [elStability, setElStability] = useState(0.5);
    const [elSimilarityBoost, setElSimilarityBoost] = useState(0.75);
    const [elIsGenerating, setElIsGenerating] = useState(false);
    const [elGenerateError, setElGenerateError] = useState<string | null>(null);
    const [elPreviewingVoice, setElPreviewingVoice] = useState<string | null>(null);
    const [elPlayingId, setElPlayingId] = useState<string | null>(null);
    const [elPlayerAudio, setElPlayerAudio] = useState<HTMLAudioElement | null>(null);
    const [elSuccessModal, setElSuccessModal] = useState<elevenlabsService.GeneratedAudio | null>(null);
    const elGeneratedFilesRef = useRef<HTMLDivElement>(null);

    // Unavailable language modal state
    const [unavailableLangModal, setUnavailableLangModal] = useState<{ name: string; code: string } | null>(null);

    // Audio Collection Modal state
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [collectionModalProvider, setCollectionModalProvider] = useState<'deepgram' | 'elevenlabs'>('deepgram');

    // Text Preview Modal state
    const [textPreviewModal, setTextPreviewModal] = useState<{
        title: string;
        text: string;
        language?: string;
        voiceName?: string;
    } | null>(null);

    // Load initial data
    useEffect(() => {
        async function loadData() {
            try {
                setIsLoading(true);
                // Load Deepgram data
                const [statusData, voicesData, formatsData, filesData] = await Promise.all([
                    getStatus(),
                    getVoices(),
                    getFormats(),
                    getAudioFiles(),
                ]);
                setStatus(statusData);
                setVoices(voicesData);
                setFormats(formatsData);
                setAudioFiles(filesData);

                // Load ElevenLabs data (don't fail if not configured)
                try {
                    const [elStatusData, elVoicesData, elModelsData, elFormatsData, elLanguagesData, elFilesData] = await Promise.all([
                        elevenlabsService.getStatus(),
                        elevenlabsService.getVoices('en').catch(() => ({ voices: [], language: 'en' })),
                        elevenlabsService.getModels(),
                        elevenlabsService.getFormats(),
                        elevenlabsService.getLanguages(),
                        elevenlabsService.getAudioFiles(),
                    ]);
                    setElStatus(elStatusData);
                    setElVoices(elVoicesData.voices);
                    setElModels(elModelsData);
                    setElFormats(elFormatsData);
                    setElLanguages(elLanguagesData);
                    setElAudioFiles(elFilesData);
                    // Set default voice if available
                    if (elVoicesData.voices.length > 0) {
                        setElSelectedVoice(elVoicesData.voices[0].id);
                        setElSelectedVoiceName(elVoicesData.voices[0].name);
                    }
                } catch (elErr) {
                    console.log('ElevenLabs not configured or error:', elErr);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load audio data');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            if (previewAudio) {
                previewAudio.pause();
                URL.revokeObjectURL(previewAudio.src);
            }
            if (playerAudio) {
                playerAudio.pause();
            }
        };
    }, [previewAudio, playerAudio]);

    // Handle voice preview
    const handlePreviewVoice = async (voiceId: string) => {
        try {
            // Stop any existing preview
            if (previewAudio) {
                previewAudio.pause();
                URL.revokeObjectURL(previewAudio.src);
            }

            setPreviewingVoice(voiceId);
            const audioUrl = await getVoicePreview(voiceId);
            const audio = new window.Audio(audioUrl);

            audio.onended = () => {
                setPreviewingVoice(null);
                URL.revokeObjectURL(audioUrl);
            };

            audio.onerror = () => {
                setPreviewingVoice(null);
                URL.revokeObjectURL(audioUrl);
            };

            setPreviewAudio(audio);
            await audio.play();
        } catch (err) {
            console.error('Preview error:', err);
            setPreviewingVoice(null);
        }
    };

    // Handle generation
    const handleGenerate = async () => {
        if (!text.trim()) return;

        try {
            setIsGenerating(true);
            setGenerateError(null);

            let textToSpeak = text.trim();

            // Auto-translate if enabled, not English, and language is supported
            if (autoTranslate && selectedLanguage !== 'en' && selectedLanguage in TRANSLATION_LANGUAGE_MAP) {
                setIsTranslating(true);
                try {
                    const response = await fetch('/api/translate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            text: textToSpeak,
                            sourceLang: 'en',
                            targetLang: selectedLanguage,
                        }),
                    });
                    if (!response.ok) {
                        throw new Error('Translation failed');
                    }
                    const data = await response.json();
                    textToSpeak = data.translatedText;
                } catch (translationErr) {
                    console.error('Translation error:', translationErr);
                    setGenerateError('Translation failed. Please provide text in the target language or disable auto-translate.');
                    setIsTranslating(false);
                    setIsGenerating(false);
                    return;
                }
                setIsTranslating(false);
            }

            const result = await generateAudio({
                text: textToSpeak,
                voice: selectedVoice,
                encoding: selectedFormat,
                sampleRate: selectedSampleRate,
            });

            setAudioFiles(prev => [result, ...prev]);
            setText('');

            // Show success modal
            setSuccessModal(result);
        } catch (err) {
            setGenerateError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    // Close success modal and scroll to files
    const handleCloseSuccessModal = () => {
        setSuccessModal(null);
        // Scroll to generated files section
        setTimeout(() => {
            generatedFilesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Handle file playback
    const handlePlayFile = async (file: GeneratedAudio) => {
        // Stop any existing playback
        if (playerAudio) {
            playerAudio.pause();
        }

        if (playingId === file.id) {
            setPlayingId(null);
            return;
        }

        const audio = new window.Audio(file.fileUrl);
        audio.onended = () => setPlayingId(null);
        audio.onerror = () => setPlayingId(null);

        setPlayerAudio(audio);
        setPlayingId(file.id);
        await audio.play();
    };

    // Handle file deletion
    const handleDeleteFile = async (id: string) => {
        if (!confirm('Are you sure you want to delete this audio file?')) return;

        try {
            await deleteAudioFile(id);
            setAudioFiles(prev => prev.filter(f => f.id !== id));
            if (playingId === id && playerAudio) {
                playerAudio.pause();
                setPlayingId(null);
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // Refresh files list
    const handleRefresh = async () => {
        try {
            const files = await getAudioFiles();
            setAudioFiles(files);
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    // Get voices for selected language
    const currentLanguageVoices = voices?.[selectedLanguage]?.voices || [];

    // Handle language change
    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        // Auto-select first featured voice in new language
        const langVoices = voices?.[lang]?.voices || [];
        const featured = langVoices.find(v => v.featured);
        if (featured) {
            setSelectedVoice(featured.id);
        } else if (langVoices.length > 0) {
            setSelectedVoice(langVoices[0].id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <AlertCircle className="w-12 h-12 text-[var(--color-error)]" />
                <p className="text-[var(--color-text-muted)]">{error}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Success Modal */}
            {successModal && (
                <SuccessModal
                    audio={successModal}
                    voices={voices}
                    onClose={handleCloseSuccessModal}
                    onPlay={() => handlePlayFile(successModal)}
                    isPlaying={playingId === successModal.id}
                />
            )}

            {/* Unavailable Language Modal */}
            {unavailableLangModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Translation Not Available
                                </h3>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    {unavailableLangModal.name}
                                </p>
                            </div>
                        </div>

                        <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 mb-4">
                            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                                Auto-translation to <strong>{unavailableLangModal.name}</strong> is not configured on this server.
                            </p>
                            <p className="text-sm text-[var(--color-text-muted)] mb-3">
                                Available languages with auto-translation:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(TRANSLATION_LANGUAGE_MAP).filter(l => l !== 'en').map(code => (
                                    <span key={code} className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium">
                                        {code.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-[var(--color-text-muted)] mb-4">
                            You can still use this language, but you'll need to provide your text already translated to {unavailableLangModal.name}.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setUnavailableLangModal(null)}
                                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors font-medium"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="px-6 py-4 border-b border-[var(--color-border-default)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                            <Volume2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Audio</h1>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Text-to-Speech generation and management
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 border-b border-[var(--color-border-default)]">
                <div className="flex gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={tab.status === 'coming_soon'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-[var(--color-accent-primary)] text-white'
                                : tab.status === 'coming_soon'
                                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] cursor-not-allowed'
                                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.name}
                            {tab.status === 'coming_soon' && (
                                <Lock className="w-3 h-3 ml-1" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'deepgram' ? (
                    <DeepgramTab
                        status={status}
                        voices={voices}
                        formats={formats}
                        audioFiles={audioFiles}
                        text={text}
                        setText={setText}
                        selectedVoice={selectedVoice}
                        setSelectedVoice={setSelectedVoice}
                        selectedLanguage={selectedLanguage}
                        handleLanguageChange={handleLanguageChange}
                        selectedFormat={selectedFormat}
                        setSelectedFormat={setSelectedFormat}
                        selectedSampleRate={selectedSampleRate}
                        setSelectedSampleRate={setSelectedSampleRate}
                        isGenerating={isGenerating}
                        generateError={generateError}
                        previewingVoice={previewingVoice}
                        playingId={playingId}
                        currentLanguageVoices={currentLanguageVoices}
                        handleGenerate={handleGenerate}
                        handlePreviewVoice={handlePreviewVoice}
                        handlePlayFile={handlePlayFile}
                        handleDeleteFile={handleDeleteFile}
                        handleRefresh={handleRefresh}
                        generatedFilesRef={generatedFilesRef}
                        autoTranslate={autoTranslate}
                        setAutoTranslate={setAutoTranslate}
                        isTranslating={isTranslating}
                        onUnavailableLanguage={setUnavailableLangModal}
                        onOpenCollectionModal={() => {
                            setCollectionModalProvider('deepgram');
                            setShowCollectionModal(true);
                        }}
                        onShowTextPreview={(data) => setTextPreviewModal(data)}
                    />
                ) : activeTab === 'elevenlabs' ? (
                    <ElevenLabsTab
                        status={elStatus}
                        voices={elVoices}
                        setVoices={setElVoices}
                        models={elModels}
                        formats={elFormats}
                        languages={elLanguages}
                        audioFiles={elAudioFiles}
                        text={elText}
                        setText={setElText}
                        selectedVoice={elSelectedVoice}
                        setSelectedVoice={setElSelectedVoice}
                        selectedVoiceName={elSelectedVoiceName}
                        setSelectedVoiceName={setElSelectedVoiceName}
                        selectedModel={elSelectedModel}
                        setSelectedModel={setElSelectedModel}
                        selectedFormat={elSelectedFormat}
                        setSelectedFormat={setElSelectedFormat}
                        selectedLanguage={elSelectedLanguage}
                        setSelectedLanguage={setElSelectedLanguage}
                        stability={elStability}
                        setStability={setElStability}
                        similarityBoost={elSimilarityBoost}
                        setSimilarityBoost={setElSimilarityBoost}
                        isGenerating={elIsGenerating}
                        setIsGenerating={setElIsGenerating}
                        generateError={elGenerateError}
                        setGenerateError={setElGenerateError}
                        previewingVoice={elPreviewingVoice}
                        setPreviewingVoice={setElPreviewingVoice}
                        playingId={elPlayingId}
                        setPlayingId={setElPlayingId}
                        playerAudio={elPlayerAudio}
                        setPlayerAudio={setElPlayerAudio}
                        successModal={elSuccessModal}
                        setSuccessModal={setElSuccessModal}
                        setAudioFiles={setElAudioFiles}
                        generatedFilesRef={elGeneratedFilesRef}
                        onUnavailableLanguage={setUnavailableLangModal}
                        onOpenCollectionModal={() => {
                            setCollectionModalProvider('elevenlabs');
                            setShowCollectionModal(true);
                        }}
                        onShowTextPreview={(data) => setTextPreviewModal(data)}
                    />
                ) : (
                    <ComingSoonTab tab={tabs.find(t => t.id === activeTab)!} />
                )}
            </div>

            {/* Audio Collection Modal */}
            <AudioCollectionModal
                isOpen={showCollectionModal}
                onClose={() => setShowCollectionModal(false)}
                text={collectionModalProvider === 'deepgram' ? text : elText}
                provider={collectionModalProvider}
                voices={collectionModalProvider === 'deepgram' ? voices : null}
                formats={collectionModalProvider === 'deepgram' ? formats : null}
                defaultFormat={collectionModalProvider === 'deepgram' ? selectedFormat : elSelectedFormat}
                defaultSampleRate={collectionModalProvider === 'deepgram' ? selectedSampleRate : 44100}
                onSuccess={(collectionId) => {
                    // Don't close modal here - let the success state show first
                    // Modal will close when user clicks "Stay & Continue" or navigates to collection
                    console.log('Collection created:', collectionId);
                }}
            />

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

// Deepgram Tab Component
interface DeepgramTabProps {
    status: AudioServiceStatus | null;
    voices: VoicesResponse | null;
    formats: FormatsResponse | null;
    audioFiles: GeneratedAudio[];
    text: string;
    setText: (text: string) => void;
    selectedVoice: string;
    setSelectedVoice: (voice: string) => void;
    selectedLanguage: string;
    handleLanguageChange: (lang: string) => void;
    selectedFormat: string;
    setSelectedFormat: (format: string) => void;
    selectedSampleRate: number;
    setSelectedSampleRate: (rate: number) => void;
    isGenerating: boolean;
    generateError: string | null;
    previewingVoice: string | null;
    playingId: string | null;
    currentLanguageVoices: Voice[];
    handleGenerate: () => void;
    handlePreviewVoice: (voiceId: string) => void;
    handlePlayFile: (file: GeneratedAudio) => void;
    handleDeleteFile: (id: string) => void;
    handleRefresh: () => void;
    generatedFilesRef: React.RefObject<HTMLDivElement | null>;
    autoTranslate: boolean;
    setAutoTranslate: (value: boolean) => void;
    isTranslating: boolean;
    onUnavailableLanguage: (lang: { name: string; code: string }) => void;
    onOpenCollectionModal: () => void;
    onShowTextPreview: (data: { title: string; text: string; language?: string; voiceName?: string }) => void;
}

function DeepgramTab({
    status,
    voices,
    formats,
    audioFiles,
    text,
    setText,
    selectedVoice,
    setSelectedVoice,
    selectedLanguage,
    handleLanguageChange,
    selectedFormat,
    setSelectedFormat,
    selectedSampleRate,
    setSelectedSampleRate,
    isGenerating,
    generateError,
    previewingVoice,
    playingId,
    currentLanguageVoices,
    handleGenerate,
    handlePreviewVoice,
    handlePlayFile,
    handleDeleteFile,
    handleRefresh,
    generatedFilesRef,
    autoTranslate,
    setAutoTranslate,
    isTranslating,
    onUnavailableLanguage,
    onOpenCollectionModal,
    onShowTextPreview,
}: DeepgramTabProps) {
    const isConfigured = status?.deepgram?.configured;

    if (!isConfigured) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Settings2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    Deepgram Not Configured
                </h2>
                <p className="text-[var(--color-text-muted)] text-center max-w-md">
                    To use Deepgram text-to-speech, you need to configure your API key in Settings.
                </p>
                <a
                    href="/settings"
                    className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors"
                >
                    Go to Settings
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Generator Card */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <AudioWaveform className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-[var(--color-text-primary)]">Text-to-Speech Generator</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">Deepgram Aura-2 Neural TTS</p>
                    </div>
                </div>

                {/* Text Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Text to Convert
                    </label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Enter the text you want to convert to speech..."
                        rows={4}
                        className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)] transition-all resize-none"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 text-right">
                        {text.length} characters
                    </p>
                </div>

                {/* Voice Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Language */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Language
                        </label>
                        <div className="relative">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => {
                                    const newLang = e.target.value;
                                    const langName = voices?.[newLang]?.name || newLang;
                                    if (newLang !== 'en' && !isTranslationAvailable(newLang)) {
                                        onUnavailableLanguage({ name: langName, code: newLang });
                                    }
                                    handleLanguageChange(newLang);
                                }}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            >
                                {voices && Object.entries(voices).map(([code, lang]) => (
                                    <option key={code} value={code}>
                                        {getLanguageDisplayName(lang.name, code)} ({lang.voices.length} voices)
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>

                    {/* Voice */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Voice
                        </label>
                        <div className="relative">
                            <select
                                value={selectedVoice}
                                onChange={(e) => setSelectedVoice(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            >
                                {currentLanguageVoices.filter(v => v.featured).length > 0 && (
                                    <optgroup label="Featured Voices">
                                        {currentLanguageVoices.filter(v => v.featured).map((voice) => (
                                            <option key={voice.id} value={voice.id}>
                                                {voice.name} ({voice.gender})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                                {currentLanguageVoices.filter(v => !v.featured).length > 0 && (
                                    <optgroup label="All Voices">
                                        {currentLanguageVoices.filter(v => !v.featured).map((voice) => (
                                            <option key={voice.id} value={voice.id}>
                                                {voice.name} ({voice.gender})
                                            </option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Format
                        </label>
                        <div className="relative">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            >
                                {formats?.formats.map((fmt) => (
                                    <option key={fmt.id} value={fmt.id}>
                                        {fmt.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>

                    {/* Sample Rate */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Sample Rate
                        </label>
                        <div className="relative">
                            <select
                                value={selectedSampleRate}
                                onChange={(e) => setSelectedSampleRate(Number(e.target.value))}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            >
                                {formats?.sampleRates.map((rate) => (
                                    <option key={rate.id} value={rate.id}>
                                        {rate.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Auto-Translate Toggle */}
                {selectedLanguage !== 'en' && (
                    (selectedLanguage in TRANSLATION_LANGUAGE_MAP) ? (
                        <div className="flex items-center justify-between p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <span className="text-blue-500 text-sm font-bold">A</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                        Auto-translate to {voices?.[selectedLanguage]?.name || selectedLanguage}
                                    </p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        Automatically translate your English text before generating audio
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setAutoTranslate(!autoTranslate)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${autoTranslate ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-hover)]'
                                    }`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoTranslate ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-amber-500">
                                    Auto-translate not available for {voices?.[selectedLanguage]?.name || selectedLanguage}
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    Please provide your text already translated to {voices?.[selectedLanguage]?.name || selectedLanguage}
                                </p>
                            </div>
                        </div>
                    )
                )}

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handlePreviewVoice(selectedVoice)}
                        disabled={previewingVoice === selectedVoice}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                    >
                        {previewingVoice === selectedVoice ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Preview Voice
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!text.trim() || isGenerating || isTranslating}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Translating...
                            </>
                        ) : isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-4 h-4" />
                                Generate Audio
                            </>
                        )}
                    </button>
                    <button
                        onClick={onOpenCollectionModal}
                        disabled={!text.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title="Create a collection with audio in multiple languages"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Create Collection
                    </button>
                </div>

                {generateError && (
                    <div className="mt-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg flex items-center gap-2 text-[var(--color-error)]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{generateError}</p>
                    </div>
                )}
            </div>

            {/* Voice Gallery */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-[var(--color-text-primary)]">Voice Gallery</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {currentLanguageVoices.length} voices available in {voices?.[selectedLanguage]?.name || selectedLanguage}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {currentLanguageVoices.map((voice) => (
                        <div
                            key={voice.id}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${selectedVoice === voice.id
                                ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                : 'border-transparent bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-default)]'
                                }`}
                            onClick={() => setSelectedVoice(voice.id)}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${voice.gender === 'female'
                                    ? 'bg-pink-500/20 text-pink-500'
                                    : 'bg-blue-500/20 text-blue-500'
                                    }`}>
                                    {voice.gender === 'female' ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                </div>
                                {voice.featured && (
                                    <span className="text-xs bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                                        Featured
                                    </span>
                                )}
                            </div>
                            <p className="font-medium text-[var(--color-text-primary)] text-sm">{voice.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] capitalize">{voice.gender}</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePreviewVoice(voice.id);
                                }}
                                disabled={previewingVoice === voice.id}
                                className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs bg-[var(--color-bg-hover)] rounded hover:bg-[var(--color-bg-surface)] transition-colors disabled:opacity-50"
                            >
                                {previewingVoice === voice.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Play className="w-3 h-3" />
                                )}
                                Preview
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Generated Files */}
            <div ref={generatedFilesRef} className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-[var(--color-text-primary)]">Generated Audio Files</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {audioFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <Volume2 className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" />
                        <p className="text-[var(--color-text-muted)]">No audio files generated yet</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Use the generator above to create your first audio file
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {audioFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                            >
                                {/* Play button */}
                                <button
                                    onClick={() => handlePlayFile(file)}
                                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--color-accent-primary)] text-white rounded-full hover:bg-[var(--color-accent-primary)]/80 transition-colors"
                                >
                                    {playingId === file.id ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                </button>

                                {/* File info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--color-text-primary)] truncate">
                                        {file.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                                            {voices?.[file.language]?.name || file.language.toUpperCase()}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                                            {file.encoding.toUpperCase()}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                                            {(file.sampleRate / 1000).toFixed(0)}kHz
                                        </span>
                                        <span className="text-xs text-[var(--color-text-muted)]">
                                            {formatFileSize(file.fileSize)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                        Voice: {file.voiceName}
                                    </p>
                                </div>

                                    {/* Text preview - click to see full */}
                                    <button
                                        onClick={() => onShowTextPreview({
                                            title: file.name,
                                            text: file.text,
                                            language: voices?.[file.language]?.name || file.language.toUpperCase(),
                                            voiceName: file.voiceName,
                                        })}
                                        className="hidden lg:block flex-1 max-w-md text-left hover:bg-[var(--color-bg-hover)] rounded-lg p-2 -m-2 transition-colors"
                                        title="Click to see full text"
                                    >
                                        <p className="text-sm text-[var(--color-text-muted)] truncate italic">
                                            "{file.text}"
                                        </p>
                                    </button>

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    <a
                                        href={file.fileUrl}
                                        download
                                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4 text-[var(--color-text-muted)]" />
                                    </a>
                                    <button
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Success Modal Component
interface SuccessModalProps {
    audio: GeneratedAudio;
    voices: VoicesResponse | null;
    onClose: () => void;
    onPlay: () => void;
    isPlaying: boolean;
}

function SuccessModal({ audio, voices, onClose, onPlay, isPlaying }: SuccessModalProps) {
    const languageName = voices?.[audio.language]?.name || audio.language;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                                    Audio Generated!
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Your audio file is ready
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-4">
                    {/* Audio Preview */}
                    <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg mb-4">
                        <button
                            onClick={onPlay}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--color-accent-primary)] text-white rounded-full hover:bg-[var(--color-accent-primary)]/80 transition-colors"
                        >
                            {isPlaying ? (
                                <Pause className="w-4 h-4" />
                            ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                            )}
                        </button>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--color-text-primary)] truncate text-sm">
                                {audio.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {formatFileSize(audio.fileSize)}
                            </p>
                        </div>
                    </div>

                    {/* Settings Used */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-[var(--color-border-default)]">
                            <span className="text-[var(--color-text-muted)]">Voice</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{audio.voiceName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--color-border-default)]">
                            <span className="text-[var(--color-text-muted)]">Language</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{languageName}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-[var(--color-border-default)]">
                            <span className="text-[var(--color-text-muted)]">Format</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{audio.encoding.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-[var(--color-text-muted)]">Characters</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{audio.text.length}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-default)] flex gap-3">
                    <a
                        href={audio.fileUrl}
                        download
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </a>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors font-medium"
                    >
                        View All Files
                    </button>
                </div>
            </div>
        </div>
    );
}

// ElevenLabs Tab Component
interface ElevenLabsTabProps {
    status: elevenlabsService.ElevenLabsStatus | null;
    voices: elevenlabsService.ElevenLabsVoice[];
    setVoices: React.Dispatch<React.SetStateAction<elevenlabsService.ElevenLabsVoice[]>>;
    models: elevenlabsService.ElevenLabsModel[];
    formats: elevenlabsService.ElevenLabsFormat[];
    languages: elevenlabsService.ElevenLabsLanguage[];
    audioFiles: elevenlabsService.GeneratedAudio[];
    text: string;
    setText: (text: string) => void;
    selectedVoice: string;
    setSelectedVoice: (voice: string) => void;
    selectedVoiceName: string;
    setSelectedVoiceName: (name: string) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    selectedFormat: string;
    setSelectedFormat: (format: string) => void;
    selectedLanguage: string;
    setSelectedLanguage: (language: string) => void;
    stability: number;
    setStability: (value: number) => void;
    similarityBoost: number;
    setSimilarityBoost: (value: number) => void;
    isGenerating: boolean;
    setIsGenerating: (value: boolean) => void;
    generateError: string | null;
    setGenerateError: (error: string | null) => void;
    previewingVoice: string | null;
    setPreviewingVoice: (voice: string | null) => void;
    playingId: string | null;
    setPlayingId: (id: string | null) => void;
    playerAudio: HTMLAudioElement | null;
    setPlayerAudio: (audio: HTMLAudioElement | null) => void;
    successModal: elevenlabsService.GeneratedAudio | null;
    setSuccessModal: (audio: elevenlabsService.GeneratedAudio | null) => void;
    setAudioFiles: React.Dispatch<React.SetStateAction<elevenlabsService.GeneratedAudio[]>>;
    generatedFilesRef: React.RefObject<HTMLDivElement | null>;
    onUnavailableLanguage: (lang: { name: string; code: string }) => void;
    onOpenCollectionModal: () => void;
    onShowTextPreview: (data: { title: string; text: string; language?: string; voiceName?: string }) => void;
}

function ElevenLabsTab({
    status,
    voices,
    setVoices,
    models,
    formats,
    languages,
    audioFiles,
    text,
    setText,
    selectedVoice,
    setSelectedVoice,
    selectedVoiceName,
    setSelectedVoiceName,
    selectedModel,
    setSelectedModel,
    selectedFormat,
    setSelectedFormat,
    selectedLanguage,
    setSelectedLanguage,
    stability,
    setStability,
    similarityBoost,
    setSimilarityBoost,
    isGenerating,
    setIsGenerating,
    generateError,
    setGenerateError,
    previewingVoice,
    setPreviewingVoice,
    playingId,
    setPlayingId,
    playerAudio,
    setPlayerAudio,
    successModal,
    setSuccessModal,
    setAudioFiles,
    generatedFilesRef,
    onUnavailableLanguage,
    onOpenCollectionModal,
    onShowTextPreview,
}: ElevenLabsTabProps) {
    const isConfigured = status?.configured && status?.valid;
    const [isLoadingVoices, setIsLoadingVoices] = useState(false);

    // Reload voices when language changes - get native language voices
    useEffect(() => {
        async function loadVoicesForLanguage() {
            if (!isConfigured) return;

            setIsLoadingVoices(true);
            try {
                const result = await elevenlabsService.getVoices(selectedLanguage);
                setVoices(result.voices);
                // Select first voice for the new language
                if (result.voices.length > 0) {
                    setSelectedVoice(result.voices[0].id);
                    setSelectedVoiceName(result.voices[0].name);
                }
            } catch (err) {
                console.error('Error loading voices for language:', err);
            } finally {
                setIsLoadingVoices(false);
            }
        }
        loadVoicesForLanguage();
    }, [selectedLanguage, isConfigured]);

    // Show all loaded voices (they're already filtered by language from API)
    const filteredVoices = voices;

    // Handle voice selection
    const handleVoiceSelect = (voice: elevenlabsService.ElevenLabsVoice) => {
        setSelectedVoice(voice.id);
        setSelectedVoiceName(voice.name);
    };

    // Handle generate with auto-translation
    const handleGenerate = async () => {
        if (!text.trim() || !selectedVoice) return;

        try {
            setIsGenerating(true);
            setGenerateError(null);

            let textToSpeak = text.trim();

            // Auto-translate if target language is different from English
            // and the language is supported by LibreTranslate
            if (selectedLanguage !== 'en' && selectedLanguage in TRANSLATION_LANGUAGE_MAP) {
                try {
                    const targetLang = TRANSLATION_LANGUAGE_MAP[selectedLanguage];
                    console.log(`Translating text from English to ${targetLang}...`);
                    textToSpeak = await translateText(text.trim(), 'en', targetLang);
                    console.log('Translated text:', textToSpeak);
                } catch (translateErr) {
                    console.warn('Translation failed, using original text:', translateErr);
                    // Continue with original text if translation fails
                }
            }

            const result = await elevenlabsService.generateAudio({
                text: textToSpeak,
                voiceId: selectedVoice,
                voiceName: selectedVoiceName,
                modelId: selectedModel,
                outputFormat: selectedFormat,
                stability,
                similarityBoost,
            });

            setAudioFiles(prev => [result, ...prev]);
            setText('');
            setSuccessModal(result);

            // Scroll to files
            setTimeout(() => {
                generatedFilesRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 300);
        } catch (err) {
            setGenerateError(err instanceof Error ? err.message : 'Generation failed');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle preview - use the pre-hosted preview_url from ElevenLabs (no API auth needed)
    const handlePreviewVoice = async (voiceId: string) => {
        try {
            setPreviewingVoice(voiceId);

            // Find the voice and use its preview_url (pre-hosted by ElevenLabs)
            const voice = voices.find(v => v.id === voiceId);
            if (voice?.preview_url) {
                const audio = document.createElement('audio');
                audio.src = voice.preview_url;
                audio.play();
                audio.onended = () => setPreviewingVoice(null);
                audio.onerror = () => {
                    console.error('Preview audio failed to load');
                    setPreviewingVoice(null);
                };
            } else {
                // Fallback to API if no preview_url (shouldn't happen normally)
                const audioBlob = await elevenlabsService.previewVoice(voiceId);
                const audioUrl = URL.createObjectURL(audioBlob);
                const audio = document.createElement('audio');
                audio.src = audioUrl;
                audio.play();
                audio.onended = () => {
                    setPreviewingVoice(null);
                    URL.revokeObjectURL(audioUrl);
                };
            }
        } catch (err) {
            console.error('Preview error:', err);
            setPreviewingVoice(null);
        }
    };

    // Handle play file
    const handlePlayFile = (file: elevenlabsService.GeneratedAudio) => {
        if (playerAudio) {
            playerAudio.pause();
        }

        if (playingId === file.id) {
            setPlayingId(null);
            return;
        }

        const audio = document.createElement('audio');
        audio.src = file.fileUrl;
        audio.play();
        audio.onended = () => setPlayingId(null);
        setPlayerAudio(audio);
        setPlayingId(file.id);
    };

    // Handle delete
    const handleDeleteFile = async (id: string) => {
        try {
            await elevenlabsService.deleteAudioFile(id);
            setAudioFiles(prev => prev.filter(f => f.id !== id));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    // Handle refresh
    const handleRefresh = async () => {
        try {
            const files = await elevenlabsService.getAudioFiles();
            setAudioFiles(files);
        } catch (err) {
            console.error('Refresh error:', err);
        }
    };

    if (!isConfigured) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Settings2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                    ElevenLabs Not Configured
                </h2>
                <p className="text-[var(--color-text-muted)] text-center max-w-md">
                    {status?.error || 'To use ElevenLabs premium text-to-speech, you need to configure your API key.'}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                    Set <code className="px-1.5 py-0.5 bg-[var(--color-bg-elevated)] rounded">ELEVENLABS_API_KEY</code> environment variable
                </p>
            </div>
        );
    }

    const selectedModelInfo = models.find(m => m.id === selectedModel);

    return (
        <div className="space-y-6">
            {/* Success Modal */}
            {successModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] shadow-2xl max-w-md w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Audio Generated!</h2>
                                <p className="text-sm text-[var(--color-text-muted)]">via ElevenLabs</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between py-2 border-b border-[var(--color-border-default)]">
                                <span className="text-[var(--color-text-muted)]">Voice</span>
                                <span className="text-[var(--color-text-primary)] font-medium">{successModal.voiceName}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-[var(--color-border-default)]">
                                <span className="text-[var(--color-text-muted)]">Model</span>
                                <span className="text-[var(--color-text-primary)] font-medium">{successModal.modelName}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-[var(--color-text-muted)]">Size</span>
                                <span className="text-[var(--color-text-primary)] font-medium">{elevenlabsService.formatFileSize(successModal.fileSize)}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a
                                href={successModal.fileUrl}
                                download
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors font-medium"
                            >
                                <Download className="w-4 h-4" />
                                Download
                            </a>
                            <button
                                onClick={() => setSuccessModal(null)}
                                className="flex-1 px-4 py-2.5 bg-[var(--color-accent-primary)] text-white rounded-lg hover:bg-[var(--color-accent-primary)]/90 transition-colors font-medium"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generator */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Volume2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">ElevenLabs TTS</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">Premium voice synthesis</p>
                    </div>
                    {status?.subscription && (
                        <div className="ml-auto text-right">
                            <p className="text-xs text-[var(--color-text-muted)]">Characters used</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                {status.subscription.character_count.toLocaleString()} / {status.subscription.character_limit.toLocaleString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Text Input */}
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter text to convert to speech..."
                    rows={4}
                    maxLength={selectedModelInfo?.charLimit || 10000}
                    className="w-full p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)] resize-none mb-4"
                />
                <div className="flex justify-between text-xs text-[var(--color-text-muted)] mb-4">
                    <span>{text.length} characters</span>
                    <span>Max: {(selectedModelInfo?.charLimit || 10000).toLocaleString()}</span>
                </div>

                {/* Settings Row 1 - Language, Model, Format */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Language */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Language</label>
                        <div className="relative">
                            <select
                                value={selectedLanguage}
                                onChange={(e) => {
                                    const newLang = e.target.value;
                                    const langName = languages.find(l => l.code === newLang)?.name || newLang;
                                    if (newLang !== 'en' && !isTranslationAvailable(newLang)) {
                                        onUnavailableLanguage({ name: langName, code: newLang });
                                    }
                                    setSelectedLanguage(newLang);
                                }}
                                className="w-full appearance-none p-3 pr-10 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {getLanguageDisplayName(lang.name, lang.code)}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{languages.length} languages supported</p>
                    </div>

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Model</label>
                        <div className="relative">
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full appearance-none p-3 pr-10 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            >
                                {models.map((model) => (
                                    <option key={model.id} value={model.id}>
                                        {model.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{selectedModelInfo?.description}</p>
                    </div>

                    {/* Format */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Format / Quality</label>
                        <div className="relative">
                            <select
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="w-full appearance-none p-3 pr-10 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-primary)]"
                            >
                                {formats.map((format) => (
                                    <option key={format.id} value={format.id}>
                                        {format.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Voice Settings Sliders */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Stability: {stability.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={stability}
                            onChange={(e) => setStability(parseFloat(e.target.value))}
                            className="w-full accent-[var(--color-accent-primary)]"
                        />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Lower = more expressive, Higher = more consistent</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Similarity: {similarityBoost.toFixed(2)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={similarityBoost}
                            onChange={(e) => setSimilarityBoost(parseFloat(e.target.value))}
                            className="w-full accent-[var(--color-accent-primary)]"
                        />
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Higher = more similar to original voice</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => selectedVoice && handlePreviewVoice(selectedVoice)}
                        disabled={!selectedVoice || previewingVoice === selectedVoice}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                    >
                        {previewingVoice === selectedVoice ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Preview Voice
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={!text.trim() || !selectedVoice || isGenerating}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Volume2 className="w-4 h-4" />
                                Generate Audio
                            </>
                        )}
                    </button>
                    <button
                        onClick={onOpenCollectionModal}
                        disabled={!text.trim()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        title="Create a collection with audio in multiple languages"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Create Collection
                    </button>
                </div>

                {generateError && (
                    <div className="mt-4 p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg flex items-center gap-2 text-[var(--color-error)]">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p className="text-sm">{generateError}</p>
                    </div>
                )}
            </div>

            {/* Voice Gallery - Native Language Voices */}
            <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Voice Gallery</h3>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        {isLoadingVoices ? 'Loading...' : `${filteredVoices.length} native ${languages.find(l => l.code === selectedLanguage)?.name || 'English'} voices`}
                    </p>
                </div>
                {isLoadingVoices ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent-primary)]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto p-1">
                        {filteredVoices.map((voice) => {
                            const isFeatured = voice.category === 'professional' || voice.category === 'premade';
                            const gender = voice.labels?.gender || 'neutral';

                            return (
                                <div
                                    key={voice.id}
                                    onClick={() => handleVoiceSelect(voice)}
                                    className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedVoice === voice.id
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 shadow-lg'
                                        : 'border-transparent bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] hover:shadow-md'
                                        }`}
                                >
                                    {/* Featured Badge */}
                                    {isFeatured && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                                            Featured
                                        </span>
                                    )}

                                    <div className="flex flex-col items-center text-center pt-1">
                                        {/* Avatar */}
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${gender === 'female'
                                            ? 'bg-gradient-to-br from-pink-400 to-rose-500'
                                            : gender === 'male'
                                                ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                                : 'bg-gradient-to-br from-purple-400 to-violet-500'
                                            }`}>
                                            <User className="w-6 h-6 text-white" />
                                        </div>

                                        {/* Name */}
                                        <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate w-full mb-0.5">
                                            {voice.name.split(' - ')[0]}
                                        </span>

                                        {/* Gender */}
                                        <span className="text-xs text-[var(--color-text-muted)] capitalize mb-2">
                                            {gender}
                                        </span>

                                        {/* Preview Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreviewVoice(voice.id);
                                            }}
                                            disabled={previewingVoice === voice.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg hover:bg-[var(--color-bg-hover)] transition-all disabled:opacity-50"
                                        >
                                            {previewingVoice === voice.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Play className="w-3 h-3" />
                                            )}
                                            Preview
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Generated Files - Matching Deepgram Style */}
            <div ref={generatedFilesRef} className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-[var(--color-text-primary)]">Generated Audio Files</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {audioFiles.length} file{audioFiles.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {audioFiles.length === 0 ? (
                    <div className="text-center py-12">
                        <Volume2 className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-3" />
                        <p className="text-[var(--color-text-muted)]">No audio files generated yet</p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Use the generator above to create your first audio file
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {audioFiles.map((file) => {
                            // Extract format info from outputFormat (e.g., "mp3_44100_128")
                            const formatParts = file.outputFormat?.split('_') || [];
                            const encoding = formatParts[0]?.toUpperCase() || 'MP3';
                            const sampleRate = formatParts[1] ? `${parseInt(formatParts[1]) / 1000}kHz` : '';

                            return (
                                <div
                                    key={file.id}
                                    className="flex items-center gap-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                                >
                                    {/* Play button */}
                                    <button
                                        onClick={() => handlePlayFile(file)}
                                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-[var(--color-accent-primary)] text-white rounded-full hover:bg-[var(--color-accent-primary)]/80 transition-colors"
                                    >
                                        {playingId === file.id ? (
                                            <Pause className="w-4 h-4" />
                                        ) : (
                                            <Play className="w-4 h-4 ml-0.5" />
                                        )}
                                    </button>

                                    {/* File info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-[var(--color-text-primary)] truncate">
                                            {file.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                                                {encoding}
                                            </span>
                                            {sampleRate && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">
                                                    {sampleRate}
                                                </span>
                                            )}
                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                {elevenlabsService.formatFileSize(file.fileSize)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                                            Voice: {file.voiceName}
                                        </p>
                                    </div>

                                    {/* Text preview - click to see full */}
                                    <button
                                        onClick={() => onShowTextPreview({
                                            title: file.name,
                                            text: file.text,
                                            voiceName: file.voiceName,
                                        })}
                                        className="hidden lg:block flex-1 max-w-md text-left hover:bg-[var(--color-bg-hover)] rounded-lg p-2 -m-2 transition-colors"
                                        title="Click to see full text"
                                    >
                                        <p className="text-sm text-[var(--color-text-muted)] truncate italic">
                                            "{file.text}"
                                        </p>
                                    </button>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={file.fileUrl}
                                            download
                                            className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4 text-[var(--color-text-muted)]" />
                                        </a>
                                        <button
                                            onClick={() => handleDeleteFile(file.id)}
                                            className="p-2 hover:bg-[var(--color-error)]/10 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4 text-[var(--color-error)]" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Coming Soon Tab Component
function ComingSoonTab({ tab }: { tab: Tab }) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-[var(--color-text-muted)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                    {tab.name}
                </h2>
                <p className="text-lg text-[var(--color-accent-primary)] font-medium mb-4">
                    Coming Soon
                </p>
                <p className="text-[var(--color-text-muted)]">
                    {tab.description}
                </p>
                <div className="mt-6 p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                    <div className="flex items-center justify-center gap-2 text-[var(--color-text-muted)]">
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" />
                        <span>We're working on this feature</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
