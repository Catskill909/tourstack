import { useState } from 'react';
import { ScanLine, Navigation, CheckCircle2, Search, Info, Smartphone } from 'lucide-react';
import type { QRScannerBlockData, QRScannerMode, QRScannerSize, QRViewfinderStyle, Stop } from '../../types';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import type { TranslationProvider } from '../../services/translationService';

interface QRScannerBlockEditorProps {
    data: QRScannerBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    allStops?: Stop[];
    onChange: (data: QRScannerBlockData) => void;
}

const MODE_OPTIONS: { value: QRScannerMode; label: string; icon: typeof ScanLine; description: string }[] = [
    { value: 'navigate', label: 'Navigate', icon: Navigation, description: 'Scan → go to that stop' },
    { value: 'checkin', label: 'Check-in', icon: CheckCircle2, description: 'Scan → mark as visited' },
    { value: 'scavenger', label: 'Scavenger Hunt', icon: Search, description: 'Scan → validate correct code' },
    { value: 'info', label: 'Info Popup', icon: Info, description: 'Scan → preview stop info' },
];

const SIZE_OPTIONS: { value: QRScannerSize; label: string }[] = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
];

const VIEWFINDER_OPTIONS: { value: QRViewfinderStyle; label: string }[] = [
    { value: 'rounded', label: 'Rounded' },
    { value: 'square', label: 'Square' },
    { value: 'minimal', label: 'Minimal' },
];

export function QRScannerBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    allStops = [],
    onChange,
}: QRScannerBlockEditorProps) {
    const [activeSection, setActiveSection] = useState<'mode' | 'settings' | 'style'>('mode');

    function updateField<K extends keyof QRScannerBlockData>(field: K, value: QRScannerBlockData[K]) {
        onChange({ ...data, [field]: value });
    }

    function updateMultilingualField(field: 'promptText' | 'successMessage' | 'wrongCodeMessage', value: string) {
        onChange({
            ...data,
            [field]: { ...data[field], [language]: value },
        });
    }

    return (
        <div className="space-y-5">
            {/* Block Metadata (Title & Image) */}
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={language}
                availableLanguages={availableLanguages}
                translationProvider={translationProvider}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {/* Section Tabs */}
            <div className="flex gap-1 bg-[var(--color-bg-elevated)] rounded-lg p-1">
                {(['mode', 'settings', 'style'] as const).map((section) => (
                    <button
                        key={section}
                        type="button"
                        onClick={() => setActiveSection(section)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeSection === section
                                ? 'bg-[var(--color-accent-primary)] text-white'
                                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                    >
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                    </button>
                ))}
            </div>

            {/* Mode Section */}
            {activeSection === 'mode' && (
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                        Scanner Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {MODE_OPTIONS.map((option) => {
                            const Icon = option.icon;
                            const isSelected = data.mode === option.value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateField('mode', option.value)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors text-left ${
                                        isSelected
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                                            : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`} />
                                    <span className={`text-sm font-medium ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                                        {option.label}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-muted)] text-center">
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Mode-specific settings */}
                    {data.mode === 'navigate' && (
                        <div className="space-y-3 mt-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.restrictToTour ?? true}
                                    onChange={(e) => updateField('restrictToTour', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">Restrict to stops in this tour only</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.showConfirmation ?? true}
                                    onChange={(e) => updateField('showConfirmation', e.target.checked)}
                                    className="rounded"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">Show confirmation before navigating</span>
                            </label>
                        </div>
                    )}

                    {data.mode === 'scavenger' && (
                        <div className="space-y-3 mt-4 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Expected Stop
                                </label>
                                <select
                                    value={data.expectedStopId || ''}
                                    onChange={(e) => updateField('expectedStopId', e.target.value || undefined)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm"
                                >
                                    <option value="">Select the stop to scan...</option>
                                    {allStops.map((stop) => {
                                        const title = typeof stop.title === 'string'
                                            ? (() => { try { return JSON.parse(stop.title); } catch { return { en: stop.title }; } })()
                                            : stop.title;
                                        return (
                                            <option key={stop.id} value={stop.id}>
                                                Stop {stop.order}: {title?.[language] || title?.en || stop.id}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Success Message ({language.toUpperCase()})
                                </label>
                                <input
                                    type="text"
                                    value={data.successMessage?.[language] || ''}
                                    onChange={(e) => updateMultilingualField('successMessage', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm"
                                    placeholder="Great job! You found the right exhibit!"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                                    Wrong Code Message ({language.toUpperCase()})
                                </label>
                                <input
                                    type="text"
                                    value={data.wrongCodeMessage?.[language] || ''}
                                    onChange={(e) => updateMultilingualField('wrongCodeMessage', e.target.value)}
                                    className="w-full px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm"
                                    placeholder="That's not the right code. Keep looking!"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Settings Section */}
            {activeSection === 'settings' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Prompt Text ({language.toUpperCase()})
                        </label>
                        <textarea
                            value={data.promptText?.[language] || ''}
                            onChange={(e) => updateMultilingualField('promptText', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm resize-none"
                            placeholder="Scan the QR code at the next exhibit to continue..."
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.showShortCodeEntry ?? true}
                                onChange={(e) => updateField('showShortCodeEntry', e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-[var(--color-text-primary)]">Show short code entry (accessibility fallback)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.showScanHistory ?? false}
                                onChange={(e) => updateField('showScanHistory', e.target.checked)}
                                className="rounded"
                            />
                            <span className="text-sm text-[var(--color-text-primary)]">Show scan history (visited stops)</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                            Camera
                        </label>
                        <div className="flex gap-2">
                            {(['environment', 'user'] as const).map((facing) => (
                                <button
                                    key={facing}
                                    type="button"
                                    onClick={() => updateField('cameraFacing', facing)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                                        (data.cameraFacing || 'environment') === facing
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    <Smartphone className="w-4 h-4" />
                                    {facing === 'environment' ? 'Rear Camera' : 'Front Camera'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Style Section */}
            {activeSection === 'style' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Scanner Size
                        </label>
                        <div className="flex gap-2">
                            {SIZE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateField('scannerSize', option.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        (data.scannerSize || 'medium') === option.value
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Viewfinder Style
                        </label>
                        <div className="flex gap-2">
                            {VIEWFINDER_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateField('viewfinderStyle', option.value)}
                                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        (data.viewfinderStyle || 'rounded') === option.value
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview of what the scanner looks like */}
                    <div className="p-4 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-3 text-center">Preview (scanner is only active for visitors)</p>
                        <div className="flex justify-center">
                            <div className={`bg-gray-900 flex items-center justify-center ${
                                data.scannerSize === 'small' ? 'w-32 h-32' :
                                data.scannerSize === 'large' ? 'w-56 h-56' :
                                'w-44 h-44'
                            } ${
                                data.viewfinderStyle === 'rounded' ? 'rounded-2xl' :
                                data.viewfinderStyle === 'minimal' ? 'rounded-lg' :
                                'rounded-none'
                            }`}>
                                <ScanLine className="w-12 h-12 text-[var(--color-accent-primary)] opacity-60" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="bg-[var(--color-accent-primary)]/5 border border-[var(--color-accent-primary)]/20 rounded-lg p-3">
                <h4 className="text-xs font-medium text-[var(--color-accent-primary)] mb-2">
                    {data.mode === 'navigate' && '🧭 Navigation Scanner'}
                    {data.mode === 'checkin' && '✅ Check-in Scanner'}
                    {data.mode === 'scavenger' && '🔍 Scavenger Hunt'}
                    {data.mode === 'info' && 'ℹ️ Info Scanner'}
                </h4>
                <ul className="text-xs text-[var(--color-text-muted)] space-y-1">
                    {data.mode === 'navigate' && (
                        <>
                            <li>• Visitors scan any stop's QR code to navigate there</li>
                            <li>• Enable "Restrict to tour" to prevent jumping to other tours</li>
                            <li>• Short code entry provides an accessibility fallback</li>
                        </>
                    )}
                    {data.mode === 'checkin' && (
                        <>
                            <li>• Visitors scan to mark a stop as visited</li>
                            <li>• Check-in history persists across browser sessions</li>
                            <li>• Great for tracking tour completion</li>
                        </>
                    )}
                    {data.mode === 'scavenger' && (
                        <>
                            <li>• Set the expected stop visitors should find and scan</li>
                            <li>• Custom success/wrong messages make it engaging</li>
                            <li>• Perfect for school groups and children's programs</li>
                        </>
                    )}
                    {data.mode === 'info' && (
                        <>
                            <li>• Scan any exhibit's QR to see a preview without leaving</li>
                            <li>• Shows title, image, and description in a popup</li>
                            <li>• Visitors can then choose to navigate or dismiss</li>
                        </>
                    )}
                </ul>
            </div>
        </div>
    );
}
