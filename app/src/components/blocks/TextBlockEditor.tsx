import { useState } from 'react';
import type { TextBlockData } from '../../types';

interface TextBlockEditorProps {
    data: TextBlockData;
    language: string;
    onChange: (data: TextBlockData) => void;
}

export function TextBlockEditor({ data, language, onChange }: TextBlockEditorProps) {
    const [content, setContent] = useState(data.content[language] || data.content.en || '');

    function handleContentChange(value: string) {
        setContent(value);
        onChange({
            ...data,
            content: {
                ...data.content,
                [language]: value,
            },
        });
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Content ({language.toUpperCase()})
                </label>
                <textarea
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y"
                    placeholder="Enter text content..."
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    HTML formatting is supported (e.g., &lt;b&gt;, &lt;i&gt;, &lt;p&gt;)
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Style
                </label>
                <div className="flex gap-2">
                    {(['normal', 'callout', 'sidebar'] as const).map((style) => (
                        <button
                            key={style}
                            type="button"
                            onClick={() => onChange({ ...data, style })}
                            className={`px-3 py-2 rounded-lg border transition-colors capitalize ${data.style === style
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
