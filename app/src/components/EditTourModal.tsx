import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import type { Tour, Template } from '../types';
import { ImageUpload } from './ImageUpload';

interface EditTourModalProps {
    isOpen: boolean;
    tour: Tour | null;
    template?: Template;
    onClose: () => void;
    onSave: (id: string, data: Partial<Tour>) => Promise<void>;
}

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
];

const durations = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2+ hours' },
];

export function EditTourModal({ isOpen, tour, template, onClose, onSave }: EditTourModalProps) {
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [primaryLanguage, setPrimaryLanguage] = useState('en');
    const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['en']);
    const [duration, setDuration] = useState(30);
    const [heroImage, setHeroImage] = useState<string>('');
    const [_imageFile, setImageFile] = useState<File | null>(null);

    // Populate form when tour changes
    useEffect(() => {
        if (tour) {
            const tourTitle = typeof tour.title === 'object'
                ? tour.title[tour.primaryLanguage] || tour.title.en || ''
                : tour.title;
            const tourDescription = typeof tour.description === 'object'
                ? tour.description[tour.primaryLanguage] || tour.description.en || ''
                : tour.description;

            setTitle(tourTitle);
            setDescription(tourDescription);
            setPrimaryLanguage(tour.primaryLanguage);
            setSupportedLanguages(tour.languages || [tour.primaryLanguage]);
            setDuration(tour.duration);
            setHeroImage(tour.heroImage || '');
        }
    }, [tour]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
            // Cmd/Ctrl + S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSave = async () => {
        if (!tour || !title.trim()) return;

        setIsSaving(true);
        try {
            await onSave(tour.id, {
                title: { [primaryLanguage]: title.trim() },
                description: { [primaryLanguage]: description.trim() },
                languages: supportedLanguages,
                primaryLanguage,
                duration,
                heroImage: heroImage || '',
            });
            onClose();
        } catch (error) {
            console.error('Failed to update tour:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !tour) return null;

    const canSave = title.trim().length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-default)]">
                    <div>
                        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                            Edit Tour
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Update tour details and settings
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--color-bg-hover)] transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-5">
                    {/* Template Info (Read-only) */}
                    <div className="p-4 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{template?.icon || '📍'}</div>
                            <div>
                                <p className="text-xs text-[var(--color-text-muted)]">Template</p>
                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                    {template?.name || 'Custom Template'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Tour Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Ancient Egypt Gallery"
                            autoFocus
                            className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of your tour..."
                            rows={3}
                            className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Hero Image */}
                    <ImageUpload
                        value={heroImage}
                        onChange={setImageFile}
                        onUrlChange={setHeroImage}
                        label="Tour Hero Image"
                        helpText="Drag & drop or click to upload. Supports JPG, PNG, WebP."
                    />

                    {/* Duration and Language */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Primary Language
                            </label>
                            <select
                                value={primaryLanguage}
                                onChange={(e) => {
                                    const newPrimary = e.target.value;
                                    setPrimaryLanguage(newPrimary);
                                    if (!supportedLanguages.includes(newPrimary)) {
                                        setSupportedLanguages([...supportedLanguages, newPrimary]);
                                    }
                                }}
                                className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                            >
                                {languages.map((lang) => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Estimated Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                            >
                                {durations.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Estimated Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none transition-colors"
                            >
                                {durations.map((d) => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Supported Languages */}
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                            Supported Languages
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {languages.map((lang) => {
                                const isSelected = supportedLanguages.includes(lang.code);
                                const isPrimary = lang.code === primaryLanguage;
                                return (
                                    <label
                                        key={lang.code}
                                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                                            ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]'
                                            } ${isPrimary ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                                if (isPrimary) return; // Cannot uncheck primary
                                                if (e.target.checked) {
                                                    setSupportedLanguages([...supportedLanguages, lang.code]);
                                                } else {
                                                    setSupportedLanguages(supportedLanguages.filter(l => l !== lang.code));
                                                }
                                            }}
                                            disabled={isPrimary}
                                            className="w-4 h-4 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                        />
                                        <span className={`text-sm ${isSelected ? 'font-medium text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                                            {lang.name}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                            Multi-language tours render translation tabs in the editor.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!canSave || isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Save Changes
                            </>
                        )}
                    </button>
                </div>

                {/* Keyboard Hint */}
                <div className="absolute bottom-16 right-6 text-xs text-[var(--color-text-muted)]">
                    Press <kbd className="px-1.5 py-0.5 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded">⌘S</kbd> to save
                </div>
            </div>
        </div>
    );
}
