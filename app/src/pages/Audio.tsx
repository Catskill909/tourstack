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
} from 'lucide-react';

// Languages supported by LibreTranslate for auto-translation
const TRANSLATION_SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'pt', 'zh'];
// Note: Dutch (nl) is NOT supported by LibreTranslate

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
    const [elAudioFiles, setElAudioFiles] = useState<elevenlabsService.GeneratedAudio[]>([]);
    const [elText, setElText] = useState('');
    const [elSelectedVoice, setElSelectedVoice] = useState<string>('');
    const [elSelectedVoiceName, setElSelectedVoiceName] = useState<string>('');
    const [elSelectedModel, setElSelectedModel] = useState('eleven_multilingual_v2');
    const [elSelectedFormat, setElSelectedFormat] = useState('mp3_44100_128');
    const [elStability, setElStability] = useState(0.5);
    const [elSimilarityBoost, setElSimilarityBoost] = useState(0.75);
    const [elIsGenerating, setElIsGenerating] = useState(false);
    const [elGenerateError, setElGenerateError] = useState<string | null>(null);
    const [elPreviewingVoice, setElPreviewingVoice] = useState<string | null>(null);
    const [elPlayingId, setElPlayingId] = useState<string | null>(null);
    const [elPlayerAudio, setElPlayerAudio] = useState<HTMLAudioElement | null>(null);
    const [elSuccessModal, setElSuccessModal] = useState<elevenlabsService.GeneratedAudio | null>(null);
    const elGeneratedFilesRef = useRef<HTMLDivElement>(null);

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
                    const [elStatusData, elVoicesData, elModelsData, elFormatsData, elFilesData] = await Promise.all([
                        elevenlabsService.getStatus(),
                        elevenlabsService.getVoices().catch(() => ({ voices: [] })),
                        elevenlabsService.getModels(),
                        elevenlabsService.getFormats(),
                        elevenlabsService.getAudioFiles(),
                    ]);
                    setElStatus(elStatusData);
                    setElVoices(elVoicesData.voices);
                    setElModels(elModelsData);
                    setElFormats(elFormatsData);
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
            if (autoTranslate && selectedLanguage !== 'en' && TRANSLATION_SUPPORTED_LANGUAGES.includes(selectedLanguage)) {
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
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                activeTab === tab.id
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
                    />
                ) : activeTab === 'elevenlabs' ? (
                    <ElevenLabsTab
                        status={elStatus}
                        voices={elVoices}
                        models={elModels}
                        formats={elFormats}
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
                    />
                ) : (
                    <ComingSoonTab tab={tabs.find(t => t.id === activeTab)!} />
                )}
            </div>
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
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                className="w-full px-4 py-2.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] appearance-none cursor-pointer focus:border-[var(--color-accent-primary)] focus:ring-1 focus:ring-[var(--color-accent-primary)]"
                            >
                                {voices && Object.entries(voices).map(([code, lang]) => (
                                    <option key={code} value={code}>
                                        {lang.name} ({lang.voices.length} voices)
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
                    TRANSLATION_SUPPORTED_LANGUAGES.includes(selectedLanguage) ? (
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
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                    autoTranslate ? 'bg-[var(--color-accent-primary)]' : 'bg-[var(--color-bg-hover)]'
                                }`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                        autoTranslate ? 'translate-x-5' : 'translate-x-0'
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
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                selectedVoice === voice.id
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                    : 'border-transparent bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-default)]'
                            }`}
                            onClick={() => setSelectedVoice(voice.id)}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    voice.gender === 'female' 
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

                                {/* Text preview */}
                                <div className="hidden lg:block flex-1 max-w-md">
                                    <p className="text-sm text-[var(--color-text-muted)] truncate italic">
                                        "{file.text}"
                                    </p>
                                </div>

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
    models: elevenlabsService.ElevenLabsModel[];
    formats: elevenlabsService.ElevenLabsFormat[];
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
}

function ElevenLabsTab({
    status,
    voices,
    models,
    formats,
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
}: ElevenLabsTabProps) {
    const isConfigured = status?.configured && status?.valid;

    // Handle voice selection
    const handleVoiceSelect = (voice: elevenlabsService.ElevenLabsVoice) => {
        setSelectedVoice(voice.id);
        setSelectedVoiceName(voice.name);
    };

    // Handle generate
    const handleGenerate = async () => {
        if (!text.trim() || !selectedVoice) return;

        try {
            setIsGenerating(true);
            setGenerateError(null);

            const result = await elevenlabsService.generateAudio({
                text: text.trim(),
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

    // Handle preview
    const handlePreviewVoice = async (voiceId: string) => {
        try {
            setPreviewingVoice(voiceId);
            const audioBlob = await elevenlabsService.previewVoice(voiceId);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = document.createElement('audio');
            audio.src = audioUrl;
            audio.play();
            audio.onended = () => {
                setPreviewingVoice(null);
                URL.revokeObjectURL(audioUrl);
            };
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

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Format</label>
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
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Voice Library</h3>
                    <span className="text-sm text-[var(--color-text-muted)]">{voices.length} voices</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto">
                    {voices.map((voice) => (
                        <button
                            key={voice.id}
                            onClick={() => handleVoiceSelect(voice)}
                            className={`p-3 rounded-lg border transition-all text-left ${
                                selectedVoice === voice.id
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                    : 'border-transparent bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-[var(--color-text-muted)]" />
                                <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">{voice.name}</span>
                            </div>
                            <span className="text-xs text-[var(--color-text-muted)] capitalize">{voice.category}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Generated Files */}
            <div ref={generatedFilesRef} className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Generated Audio</h3>
                    <button
                        onClick={handleRefresh}
                        className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {audioFiles.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-muted)]">
                        <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No ElevenLabs audio files generated yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {audioFiles.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg"
                            >
                                <button
                                    onClick={() => handlePlayFile(file)}
                                    className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full hover:opacity-80 transition-opacity"
                                >
                                    {playingId === file.id ? (
                                        <Pause className="w-4 h-4" />
                                    ) : (
                                        <Play className="w-4 h-4 ml-0.5" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                                        <span>{file.voiceName}</span>
                                        <span>•</span>
                                        <span>{file.modelName}</span>
                                        <span>•</span>
                                        <span>{elevenlabsService.formatFileSize(file.fileSize)}</span>
                                    </div>
                                </div>
                                <a
                                    href={file.fileUrl}
                                    download
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                >
                                    <Download className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </a>
                                <button
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-2 hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4 text-[var(--color-text-muted)]" />
                                </button>
                            </div>
                        ))}
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
