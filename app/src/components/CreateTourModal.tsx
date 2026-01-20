import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import type { Template, Tour } from '../types';
import { ImageUpload } from './ImageUpload';

interface CreateTourModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: Partial<Tour>) => Promise<void>;
    templates: Template[];
}

type Step = 'template' | 'info' | 'review';

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

export function CreateTourModal({ isOpen, onClose, onCreate, templates }: CreateTourModalProps) {
    const [step, setStep] = useState<Step>('template');
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [primaryLanguage, setPrimaryLanguage] = useState('en');
    const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['en']);
    const [duration, setDuration] = useState(30);
    const [heroImage, setHeroImage] = useState<string>('');
    const [_imageFile, setImageFile] = useState<File | null>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('template');
            setSelectedTemplate(null);
            setTitle('');
            setDescription('');
            setPrimaryLanguage('en');
            setSupportedLanguages(['en']);
            setDuration(30);
            setHeroImage('');
            setImageFile(null);
        }
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (!isOpen) return;
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleNext = useCallback(() => {
        if (step === 'template' && selectedTemplate) {
            setStep('info');
        } else if (step === 'info' && title.trim()) {
            setStep('review');
        }
    }, [step, selectedTemplate, title]);

    const handleBack = useCallback(() => {
        if (step === 'info') setStep('template');
        else if (step === 'review') setStep('info');
    }, [step]);

    const handleCreate = async () => {
        if (!selectedTemplate || !title.trim()) return;

        setIsCreating(true);
        try {
            await onCreate({
                templateId: selectedTemplate.id,
                title: { [primaryLanguage]: title.trim() },
                description: { [primaryLanguage]: description.trim() },
                primaryLanguage,
                languages: supportedLanguages,
                duration,
                heroImage: heroImage || '',
            });
            onClose();
        } catch (error) {
            console.error('Failed to create tour:', error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    const canProceed = (step === 'template' && selectedTemplate) ||
        (step === 'info' && title.trim()) ||
        (step === 'review');

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
                            Create New Tour
                        </h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {step === 'template' && 'Step 1: Choose a template'}
                            {step === 'info' && 'Step 2: Tour details'}
                            {step === 'review' && 'Step 3: Review & create'}
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

                {/* Progress Bar */}
                <div className="flex gap-2 px-6 py-3 bg-[var(--color-bg-elevated)]">
                    {['template', 'info', 'review'].map((s, i) => (
                        <div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${['template', 'info', 'review'].indexOf(step) >= i
                                ? 'bg-[var(--color-accent-primary)]'
                                : 'bg-[var(--color-bg-hover)]'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Step 1: Template Selection */}
                    {step === 'template' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => setSelectedTemplate(template)}
                                    className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${selectedTemplate?.id === template.id
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                        : 'border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">{template.icon}</div>
                                    <h3 className="font-medium text-[var(--color-text-primary)]">{template.name}</h3>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">
                                        {template.description}
                                    </p>
                                    {selectedTemplate?.id === template.id && (
                                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Basic Info */}
                    {step === 'info' && (
                        <div className="space-y-5">
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

                            <ImageUpload
                                value={heroImage}
                                onChange={setImageFile}
                                onUrlChange={setHeroImage}
                                label="Tour Hero Image (Optional)"
                                helpText="Drag & drop or click to upload. Supports JPG, PNG, WebP."
                            />

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
                            </div>

                            {/* Supported Languages */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                                    Supported Languages
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {languages.map((lang) => {
                                        const isSelected = supportedLanguages.includes(lang.code);
                                        const isPrimary = lang.code === primaryLanguage;
                                        return (
                                            <label
                                                key={lang.code}
                                                className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                                                    isSelected
                                                        ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]'
                                                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] hover:border-[var(--color-text-muted)]'
                                                } ${isPrimary ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) => {
                                                        if (isPrimary) return;
                                                        if (e.target.checked) {
                                                            setSupportedLanguages([...supportedLanguages, lang.code]);
                                                        } else {
                                                            setSupportedLanguages(supportedLanguages.filter(l => l !== lang.code));
                                                        }
                                                    }}
                                                    disabled={isPrimary}
                                                    className="w-3.5 h-3.5 rounded border-[var(--color-border-default)] text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)]"
                                                />
                                                <span className={isSelected ? 'font-medium text-[var(--color-accent-primary)]' : 'text-[var(--color-text-secondary)]'}>
                                                    {lang.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                                    Select multiple languages to enable the "Translate to All" feature in content editors.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {step === 'review' && selectedTemplate && (
                        <div className="space-y-6">
                            <div className="p-5 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]">
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{selectedTemplate.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
                                        {description && (
                                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-text-muted)]">
                                            <span>Template: {selectedTemplate.name}</span>
                                            <span>•</span>
                                            <span>{supportedLanguages.length} language{supportedLanguages.length > 1 ? 's' : ''}</span>
                                            <span>•</span>
                                            <span>{duration} min</span>
                                        </div>
                                        {supportedLanguages.length > 1 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {supportedLanguages.map(code => (
                                                    <span key={code} className="px-2 py-0.5 text-xs rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]">
                                                        {languages.find(l => l.code === code)?.name || code.toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--color-text-muted)] text-center">
                                Your tour will be created as a <span className="text-amber-400 font-medium">Draft</span>.
                                You can add stops and publish it when ready.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]">
                    <button
                        onClick={step === 'template' ? onClose : handleBack}
                        className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {step === 'template' ? 'Cancel' : 'Back'}
                    </button>

                    {step === 'review' ? (
                        <button
                            onClick={handleCreate}
                            disabled={isCreating}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Create Tour
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-primary)]/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
