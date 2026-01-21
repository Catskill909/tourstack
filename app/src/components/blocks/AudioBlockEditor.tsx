import { Maximize2, Minus, Circle } from 'lucide-react';
import type { AudioBlockData } from '../../types';
import { CustomAudioPlayer } from '../ui/CustomAudioPlayer';

const SIZE_OPTIONS: { value: AudioBlockData['size']; label: string; icon: typeof Maximize2 }[] = [
    { value: 'large', label: 'Large', icon: Maximize2 },
    { value: 'medium', label: 'Medium', icon: Minus },
    { value: 'small', label: 'Small', icon: Circle },
];

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
                    <div>
                        <label className="inline-block px-4 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg cursor-pointer hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors">
                            Choose Audio File
                            <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                        </label>
                    </div>
                    {data.audioFiles[language] && (
                        <div>
                            <CustomAudioPlayer
                                src={data.audioFiles[language]!}
                                title={(data.size === 'large' && (data.showTitle ?? true)) ? (data.title[language] || data.title.en) : undefined}
                                size={data.size || 'large'}
                                autoplay={false}
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
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                                data.size === value
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
        </div>
    );
}
