import { useRef } from 'react';

const PRESET_COLORS = [
    { value: '#3b82f6', label: 'Blue' },
    { value: '#ef4444', label: 'Red' },
    { value: '#22c55e', label: 'Green' },
    { value: '#f97316', label: 'Orange' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#6b7280', label: 'Gray' },
];

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    /** Compact size for inline/bulk contexts */
    size?: 'sm' | 'md';
    presets?: { value: string; label: string }[];
}

export function ColorPicker({ value, onChange, size = 'md', presets = PRESET_COLORS }: ColorPickerProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const swatchSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    const customSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    const gap = size === 'sm' ? 'gap-1' : 'gap-1.5';

    const isCustom = !presets.some(p => p.value === value);

    return (
        <div className={`flex items-center ${gap} flex-wrap`}>
            {presets.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`${swatchSize} rounded-full transition-all shrink-0 ${
                        value === opt.value
                            ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface)] ring-white/70 scale-110'
                            : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: opt.value }}
                    title={opt.label}
                />
            ))}

            {/* Custom color picker */}
            <button
                onClick={() => inputRef.current?.click()}
                className={`${customSize} rounded-full shrink-0 transition-all relative overflow-hidden ${
                    isCustom
                        ? 'ring-2 ring-offset-2 ring-offset-[var(--color-bg-surface)] ring-white/70 scale-110'
                        : 'hover:scale-110'
                }`}
                style={{
                    background: isCustom
                        ? value
                        : 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
                }}
                title="Custom color"
            >
                <input
                    ref={inputRef}
                    type="color"
                    value={value || '#3b82f6'}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    tabIndex={-1}
                />
            </button>
        </div>
    );
}

export { PRESET_COLORS };
