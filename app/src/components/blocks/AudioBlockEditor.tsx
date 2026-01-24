import { useState } from 'react';
import { Maximize2, Minus, Circle, Mic, Loader2, Languages, FolderOpen } from 'lucide-react';
import type { AudioBlockData } from '../../types';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';
import { transcribeAudio } from '../../services/transcriptionService';
import { magicTranslate } from '../../services/translationService';
import { CollectionPickerModal, type ImportedAudioData } from '../CollectionPickerModal';

const SIZE_OPTIONS: { value: AudioBlockData['size']; label: string; icon: typeof Maximize2 }[] = [
    { value: 'large', label: 'Large', icon: Maximize2 },
    { value: 'medium', label: 'Medium', icon: Minus },
    { value: 'small', label: 'Small', icon: Circle },
];

interface AudioBlockEditorProps {
    data: AudioBlockData;
    language: string;
    availableLanguages?: string[];
    onChange: (data: AudioBlockData) => void;
}

export function AudioBlockEditor({ data, language, availableLanguages = ['en'], onChange }: AudioBlockEditorProps) {
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcribeError, setTranscribeError] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showTranslationSuccess, setShowTranslationSuccess] = useState(false);
    const [showCollectionPicker, setShowCollectionPicker] = useState(false);

    // Target languages for translation (all except current)
    const targetLangs = availableLanguages.filter(l => l !== language);

    async function handleTranscribe() {
        const audioUrl = data.audioFiles[language];
        if (!audioUrl) return;

        setIsTranscribing(true);
        setTranscribeError(null);

        try {
            // Fetch the audio file
            const response = await fetch(audioUrl);
            const audioBlob = await response.blob();

            // Transcribe using Deepgram
            const result = await transcribeAudio(audioBlob, {
                provider: 'deepgram',
                language: language === 'en' ? 'en' : language,
            });

            // Update transcript with result and word timestamps
            onChange({
                ...data,
                transcript: { ...data.transcript, [language]: result.text },
                transcriptWords: result.words,
                showTranscript: true,
                showCaptions: true,
            });
        } catch (error) {
            console.error('Transcription error:', error);
            setTranscribeError(error instanceof Error ? error.message : 'Transcription failed');
        } finally {
            setIsTranscribing(false);
        }
    }

    // Handle transcript translation to all languages
    async function handleTranslateTranscript() {
        const sourceText = data.transcript?.[language];
        if (!sourceText || targetLangs.length === 0) return;

        setIsTranslating(true);
        try {
            const translations = await magicTranslate(sourceText, language, targetLangs);
            onChange({
                ...data,
                transcript: { ...data.transcript, ...translations },
            });
            setShowTranslationSuccess(true);
        } catch (error) {
            console.error('Translation error:', error);
        } finally {
            setIsTranslating(false);
        }
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                onChange({
                    ...data,
                    audioFiles: { ...data.audioFiles, [language]: url }
                });
            };
            reader.readAsDataURL(file);
        }
    }

    // Handle import from collection (all languages)
    function handleImportFromCollection(importData: ImportedAudioData) {
        onChange({
            ...data,
            audioFiles: { ...data.audioFiles, ...importData.audioFiles },
            transcript: { ...data.transcript, ...importData.transcript },
        });
    }

    return (
        <div className="space-y-4">
            {/* Title */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Title ({language.toUpperCase()})
                </label>
                <input
                    type="text"
                    value={data.title[language] || data.title.en || ''}
                    onChange={(e) => onChange({
                        ...data,
                        title: { ...data.title, [language]: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    placeholder="Audio title..."
                />
            </div>

            {/* Audio file */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Audio File ({language.toUpperCase()})
                </label>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="inline-block px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors">
                            Choose Audio File
                            <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                        </label>
                        <span className="text-[var(--color-text-muted)] text-sm">or</span>
                        <button
                            type="button"
                            onClick={() => setShowCollectionPicker(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 transition-colors"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Import from Collection
                        </button>
                    </div>
                    {data.audioFiles[language] && (
                        <div>
                            <CustomAudioPlayer
                                src={data.audioFiles[language]!}
                                title={(data.size === 'large' && (data.showTitle ?? true)) ? (data.title[language] || data.title.en) : undefined}
                                size={data.size || 'large'}
                                autoplay={false}
                                transcriptWords={data.transcriptWords}
                                transcript={data.transcript?.[language]}
                                showCaptions={data.showCaptions}
                                onCaptionsToggle={(show) => onChange({ ...data, showCaptions: show })}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Player Size */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Player Size
                </label>
                <div className="inline-flex bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg p-1 gap-1">
                    {SIZE_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => onChange({ ...data, size: value })}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${data.size === value
                                    ? 'bg-[var(--color-accent-primary)] text-white shadow-sm'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Transcript */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Transcript ({language.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                    </label>
                    <div className="flex items-center gap-2">
                        {/* Translate Button */}
                        {data.transcript?.[language] && targetLangs.length > 0 && (
                            <button
                                onClick={handleTranslateTranscript}
                                disabled={isTranslating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isTranslating ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Translating...
                                    </>
                                ) : (
                                    <>
                                        <Languages className="w-3.5 h-3.5" />
                                        {targetLangs.some(lang => data.transcript?.[lang]) ? 'Re-Translate' : 'Translate'}
                                    </>
                                )}
                            </button>
                        )}
                        {/* Transcribe Button */}
                        {data.audioFiles[language] && (
                            <button
                                onClick={handleTranscribe}
                                disabled={isTranscribing}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {isTranscribing ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Transcribing...
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-3.5 h-3.5" />
                                        Transcribe
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
                {transcribeError && (
                    <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                        {transcribeError}
                    </div>
                )}
                <textarea
                    value={data.transcript?.[language] || data.transcript?.en || ''}
                    onChange={(e) => onChange({
                        ...data,
                        transcript: { ...data.transcript, [language]: e.target.value }
                    })}
                    rows={4}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y"
                    placeholder="Audio transcript..."
                />
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
                {data.size === 'large' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.showTitle ?? true}
                            onChange={(e) => onChange({ ...data, showTitle: e.target.checked })}
                            className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">Show Title</span>
                    </label>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.autoplay}
                        onChange={(e) => onChange({ ...data, autoplay: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">Autoplay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={data.showTranscript}
                        onChange={(e) => onChange({ ...data, showTranscript: e.target.checked })}
                        className="w-4 h-4 rounded border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">Show Transcript</span>
                </label>
            </div>

            {/* Translation Success Modal */}
            {showTranslationSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-[var(--color-bg-surface)] rounded-2xl border border-green-500/30 p-6 w-full max-w-sm shadow-2xl mx-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <Languages className="w-7 h-7 text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                Translation Complete
                            </h3>
                            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
                                Transcript translated to {targetLangs.length} language{targetLangs.length > 1 ? 's' : ''}.
                                Remember to <span className="text-yellow-400 font-medium">save your changes</span> for translations to appear in preview.
                            </p>
                            <button
                                onClick={() => setShowTranslationSuccess(false)}
                                className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Collection Picker Modal */}
            <CollectionPickerModal
                isOpen={showCollectionPicker}
                onClose={() => setShowCollectionPicker(false)}
                onImport={handleImportFromCollection}
                mode="multi"
            />
        </div>
    );
}

