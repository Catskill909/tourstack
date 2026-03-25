import { useState, useEffect } from 'react';
import { Code, Globe, Link, FileCode, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import type { HtmlBlockData } from '../../types';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { MagicTranslateButton } from '../MagicTranslateButton';
import type { TranslationProvider } from '../../services/translationService';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import { detectProvider, getProviderName, getDefaultAspectRatio, generateEmbedUrl } from '../../lib/embedProviders';
import { sanitizeHtml, extractIframeSrc } from '../../lib/htmlSanitizer';

interface HtmlBlockEditorProps {
    data: HtmlBlockData;
    language: string;
    availableLanguages?: string[];
    translationProvider?: TranslationProvider;
    onChange: (data: HtmlBlockData) => void;
}

const MODES = [
    { key: 'embed' as const, label: 'Embed Code', icon: Code },
    { key: 'url' as const, label: 'URL', icon: Link },
    { key: 'html' as const, label: 'Raw HTML', icon: FileCode },
];

const ASPECT_RATIOS = [
    { key: '16:9' as const, label: '16:9' },
    { key: '4:3' as const, label: '4:3' },
    { key: '1:1' as const, label: '1:1' },
    { key: '9:16' as const, label: '9:16' },
    { key: 'auto' as const, label: 'Auto' },
];

const MAX_WIDTHS = [
    { key: 'small' as const, label: 'Small' },
    { key: 'medium' as const, label: 'Medium' },
    { key: 'large' as const, label: 'Large' },
    { key: 'full' as const, label: 'Full' },
];

const SIZING_OPTIONS = [
    { key: 'fill' as const, label: 'Fill Screen', description: 'Fills available device height (iPhone, iPad, kiosk)' },
    { key: 'fixed' as const, label: 'Fixed Height', description: 'Set a specific pixel height' },
    { key: 'auto' as const, label: 'Auto', description: 'Height determined by aspect ratio or content' },
];

export function HtmlBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    translationProvider = 'libretranslate',
    onChange,
}: HtmlBlockEditorProps) {
    const [activeLanguage, setActiveLanguage] = useState(language);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        setActiveLanguage(language);
    }, [language]);

    // Auto-detect provider when URL changes
    function handleUrlChange(url: string) {
        const provider = detectProvider(url);
        const aspectRatio = provider !== 'custom' ? getDefaultAspectRatio(provider) : data.aspectRatio;
        onChange({ ...data, url, provider, aspectRatio });
    }

    // Translation handlers for multilingual fields
    function handleHtmlContentTranslations(translations: { [lang: string]: string }) {
        onChange({ ...data, htmlContent: { ...data.htmlContent, ...translations } });
    }

    // Get primary language for translation
    const primaryLang = availableLanguages[0] || 'en';

    // Build preview content
    function getPreviewContent(): { type: 'iframe' | 'html' | 'none'; src?: string; html?: string } {
        if (data.mode === 'url' && data.url) {
            const provider = data.provider || detectProvider(data.url);
            return { type: 'iframe', src: generateEmbedUrl(data.url, provider) };
        }
        if (data.mode === 'embed' && data.embedCode) {
            const iframeSrc = extractIframeSrc(data.embedCode);
            if (iframeSrc) return { type: 'iframe', src: iframeSrc };
            return { type: 'html', html: sanitizeHtml(data.embedCode, true) };
        }
        if (data.mode === 'html') {
            const content = data.htmlContent?.[activeLanguage] || data.htmlContent?.en || '';
            if (content) return { type: 'html', html: sanitizeHtml(content, false, true) };
        }
        return { type: 'none' };
    }

    const preview = getPreviewContent();

    // Aspect ratio class for preview
    const aspectClass = {
        '16:9': 'aspect-video',
        '4:3': 'aspect-[4/3]',
        '1:1': 'aspect-square',
        '9:16': 'aspect-[9/16]',
        '21:9': 'aspect-[21/9]',
        'auto': 'min-h-[200px]',
    }[data.aspectRatio] || 'aspect-video';

    return (
        <div className="space-y-5">
            {/* Block Metadata (Title & Image) */}
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={activeLanguage}
                availableLanguages={availableLanguages}
                translationProvider={translationProvider}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {/* Mode Selector */}
            <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    Content Source
                </label>
                <div className="flex gap-2">
                    {MODES.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onChange({ ...data, mode: key })}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                                data.mode === key
                                    ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                    : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mode-specific input */}
            {data.mode === 'embed' && (
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        Embed Code
                    </label>
                    <textarea
                        value={data.embedCode || ''}
                        onChange={(e) => onChange({ ...data, embedCode: e.target.value })}
                        rows={5}
                        className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y font-mono text-sm"
                        placeholder='<iframe src="https://sketchfab.com/models/..." width="100%" height="400" frameborder="0" allowfullscreen></iframe>'
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Paste the embed code from Sketchfab, Matterport, YouTube, or any provider.
                    </p>
                </div>
            )}

            {data.mode === 'url' && (
                <div>
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        URL
                    </label>
                    <input
                        type="url"
                        value={data.url || ''}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none text-sm"
                        placeholder="https://sketchfab.com/3d-models/..."
                    />
                    {data.url && data.provider && data.provider !== 'custom' && (
                        <div className="flex items-center gap-2 mt-2 text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-green-400">Detected: {getProviderName(data.provider)}</span>
                        </div>
                    )}
                    {data.url && data.provider === 'custom' && (
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            URL will be loaded in an iframe. For best results, use a direct embed URL.
                        </p>
                    )}
                </div>
            )}

            {data.mode === 'html' && (
                <div>
                    {/* Language Controls for Raw HTML */}
                    {availableLanguages.length > 1 && (
                        <div className="flex flex-wrap items-center gap-3 pb-3 mb-3 border-b border-[var(--color-border-default)]">
                            <div className="flex-1 min-w-0">
                                <LanguageSwitcher
                                    availableLanguages={availableLanguages}
                                    activeLanguage={activeLanguage}
                                    onChange={setActiveLanguage}
                                    contentMap={data.htmlContent || {}}
                                    size="sm"
                                    showStatus={true}
                                />
                            </div>
                            <MagicTranslateButton
                                sourceText={data.htmlContent?.[primaryLang] || ''}
                                sourceLang={primaryLang}
                                targetLangs={availableLanguages.filter(l => l !== primaryLang)}
                                onTranslate={handleHtmlContentTranslations}
                                provider={translationProvider}
                                size="sm"
                                disabled={!data.htmlContent?.[primaryLang]?.trim()}
                            />
                        </div>
                    )}

                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                        HTML Content ({activeLanguage.toUpperCase()})
                    </label>
                    <textarea
                        value={data.htmlContent?.[activeLanguage] || ''}
                        onChange={(e) => onChange({
                            ...data,
                            htmlContent: { ...data.htmlContent, [activeLanguage]: e.target.value },
                        })}
                        rows={8}
                        className="w-full px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] focus:border-[var(--color-accent-primary)] focus:outline-none resize-y font-mono text-sm"
                        placeholder="<div>Your HTML content here...</div>"
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Supports HTML, CSS, Google Fonts, and JavaScript — rendered in a sandboxed iframe for security.
                    </p>
                </div>
            )}

            {/* Display Settings */}
            <div className="space-y-3 pt-2 border-t border-[var(--color-border-default)]">
                <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">Display Settings</h4>

                {/* Sizing Mode */}
                <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Height</label>
                    <div className="flex gap-1.5">
                        {SIZING_OPTIONS.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onChange({ ...data, sizing: key })}
                                className={`px-2.5 py-1.5 rounded border text-xs transition-colors ${
                                    (data.sizing || 'fill') === key
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                        : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {SIZING_OPTIONS.find(o => o.key === (data.sizing || 'fill'))?.description}
                    </p>
                </div>

                {/* Fixed Height Slider (only for fixed sizing) */}
                {(data.sizing || 'fill') === 'fixed' && (
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1">
                            Height: {data.height || 500}px
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={200}
                                max={800}
                                step={50}
                                value={data.height || 500}
                                onChange={(e) => onChange({ ...data, height: parseInt(e.target.value) })}
                                className="flex-1 max-w-xs"
                            />
                            <span className="text-xs text-[var(--color-text-muted)] w-12 text-right">{data.height || 500}px</span>
                        </div>
                    </div>
                )}

                {/* Aspect Ratio (only for auto sizing) */}
                {(data.sizing || 'fill') === 'auto' && (
                    <div>
                        <label className="block text-xs text-[var(--color-text-muted)] mb-1">Aspect Ratio</label>
                        <div className="flex gap-1.5">
                            {ASPECT_RATIOS.map(({ key, label }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => onChange({ ...data, aspectRatio: key })}
                                    className={`px-2.5 py-1.5 rounded border text-xs transition-colors ${
                                        data.aspectRatio === key
                                            ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                            : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Max Width */}
                <div>
                    <label className="block text-xs text-[var(--color-text-muted)] mb-1">Max Width</label>
                    <div className="flex gap-1.5">
                        {MAX_WIDTHS.map(({ key, label }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => onChange({ ...data, maxWidth: key })}
                                className={`px-2.5 py-1.5 rounded border text-xs transition-colors ${
                                    (data.maxWidth || 'large') === key
                                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)]'
                                        : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.borderRadius}
                            onChange={(e) => onChange({ ...data, borderRadius: e.target.checked })}
                            className="rounded"
                        />
                        Rounded corners
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.lazyLoad !== false}
                            onChange={(e) => onChange({ ...data, lazyLoad: e.target.checked })}
                            className="rounded"
                        />
                        Lazy load
                    </label>
                    <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={data.allowInteraction !== false}
                            onChange={(e) => onChange({ ...data, allowInteraction: e.target.checked })}
                            className="rounded"
                        />
                        Allow interaction
                    </label>
                </div>
            </div>

            {/* Live Preview Toggle */}
            <div className="pt-2 border-t border-[var(--color-border-default)]">
                <button
                    type="button"
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                    {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>

                {showPreview && (
                    <div className={`mt-3 overflow-hidden ${data.borderRadius ? 'rounded-lg' : ''} bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]`}>
                        {preview.type === 'iframe' && preview.src ? (
                            <div
                                className={(data.sizing || 'fill') === 'auto' && data.aspectRatio !== 'auto' ? aspectClass : ''}
                                style={{
                                    height: (data.sizing || 'fill') === 'fixed'
                                        ? `${Math.min(data.height || 500, 500)}px`
                                        : (data.sizing || 'fill') === 'fill'
                                            ? '400px'
                                            : undefined,
                                    minHeight: '200px',
                                }}
                            >
                                <iframe
                                    src={preview.src}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts allow-same-origin allow-popups"
                                    loading="lazy"
                                    allowFullScreen
                                />
                            </div>
                        ) : preview.type === 'html' && preview.html ? (
                            <iframe
                                srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{height:100%;min-height:100%}body{font-family:system-ui,-apple-system,sans-serif;color:#e5e5e5;background:#111;overflow-x:hidden}a{color:#60a5fa}</style></head><body>${preview.html}</body></html>`}
                                className="w-full border-0"
                                style={{ minHeight: '300px', background: 'transparent' }}
                                sandbox="allow-scripts allow-same-origin allow-popups"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-32 text-[var(--color-text-muted)]">
                                <div className="text-center">
                                    <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No content to preview</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
