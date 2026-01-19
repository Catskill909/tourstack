import type { AudioBlockData } from '../../types';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';

interface AudioBlockEditorProps {
    data: AudioBlockData;
    language: string;
    onChange: (data: AudioBlockData) => void;
}

export function AudioBlockEditor({ data, language, onChange }: AudioBlockEditorProps) {
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
                    <label className="inline-block px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors">
                        Choose Audio File
                        <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                    </label>
                    {data.audioFiles[language] && (
                        <CustomAudioPlayer
                            src={data.audioFiles[language]!}
                            title={data.title[language] || data.title.en}
                            autoplay={false}
                        />
                    )}
                </div>
            </div>

            {/* Duration */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Duration (seconds)
                </label>
                <input
                    type="number"
                    value={data.duration || 0}
                    onChange={(e) => onChange({ ...data, duration: parseInt(e.target.value) || 0 })}
                    className="w-32 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none"
                    min={0}
                />
            </div>

            {/* Transcript */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Transcript ({language.toUpperCase()}) <span className="text-[var(--color-text-muted)] font-normal">Optional</span>
                </label>
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
            <div className="flex gap-4">
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
        </div>
    );
}
