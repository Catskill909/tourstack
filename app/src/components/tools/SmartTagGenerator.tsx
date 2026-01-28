
import { useState, useCallback } from 'react';
import { Upload, X, Copy, Check, FileText, Loader2, Image as ImageIcon, AlertCircle, Plus, Save } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

export function SmartTagGenerator() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [visualTags, setVisualTags] = useState<string[]>([]);
    const [bestGuess, setBestGuess] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [objects, setObjects] = useState<string[]>([]);
    const [colors, setColors] = useState<{ name: string; hex: string }[]>([]);
    // New Visual Attributes
    const [mood, setMood] = useState<string | null>(null);
    const [lighting, setLighting] = useState<string | null>(null);
    const [artStyle, setArtStyle] = useState<string | null>(null);
    const [estimatedLocation, setEstimatedLocation] = useState<string | null>(null);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setExtractedText(null);
            setVisualTags([]);
            setDescription(null);
            setObjects([]);
            setColors([]);
            setBestGuess(null);
            setError(null);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false
    });

    const handleAnalyze = async () => {
        if (!image) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(image);

            reader.onload = async () => {
                const base64String = reader.result?.toString().split(',')[1];

                try {
                    const response = await fetch('/api/gemini/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: base64String })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to analyze image');
                    }

                    const data = await response.json();

                    // Map Gemini JSON response to state
                    setDescription(data.description || null);
                    setVisualTags(data.tags || []);
                    setObjects(data.objects || []);
                    setExtractedText(data.text || null);
                    setColors(data.colors || []);
                    setBestGuess(data.suggestedTitle || null);

                    // Set new attributes
                    setMood(data.mood || null);
                    setLighting(data.lighting || null);
                    setArtStyle(data.artStyle || null);
                    setEstimatedLocation(data.estimatedLocation || null);

                } catch (err: any) {
                    setError(err.message || 'Failed to analyze image. Please try again.');
                    console.error(err);
                } finally {
                    setIsAnalyzing(false);
                }
            };
        } catch (err) {
            setError('Failed to process image file.');
            setIsAnalyzing(false);
        }
    };

    const handleCopy = () => {
        if (extractedText) {
            navigator.clipboard.writeText(extractedText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const [newTagInput, setNewTagInput] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    const handleAddTag = (e?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent) => {
        if (e && 'key' in e && e.key !== 'Enter') return;

        if (newTagInput.trim()) {
            if (e) e.preventDefault();
            const tagToAdd = newTagInput.trim().charAt(0).toUpperCase() + newTagInput.trim().slice(1);
            if (!visualTags.includes(tagToAdd)) {
                setVisualTags([...visualTags, tagToAdd]);
            }
            setNewTagInput('');
            setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setVisualTags(visualTags.filter(t => t !== tagToRemove));
    };

    const handleClear = () => {
        setImage(null);
        setPreviewUrl(null);
        setExtractedText(null);
        setVisualTags([]);
        setDescription(null);
        setObjects([]);
        setColors([]);
        setBestGuess(null);
        setMood(null);
        setLighting(null);
        setArtStyle(null);
        setEstimatedLocation(null);
        setError(null);
        setNewTagInput('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Column: Upload & Preview */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-purple-400" />
                        Source Image
                    </h3>
                    {image && (
                        <button
                            onClick={handleClear}
                            className="text-sm text-[var(--color-text-muted)] hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>

                {!image ? (
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                            h-[400px] flex flex-col items-center justify-center
                            ${isDragActive
                                ? 'border-purple-500 bg-purple-500/10'
                                : 'border-[var(--color-border-default)] hover:border-purple-500/50 hover:bg-[var(--color-bg-elevated)]'
                            }
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="p-4 rounded-full bg-[var(--color-bg-elevated)] mb-4">
                            <Upload className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                            Drop image here
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            or click to browse
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden border border-[var(--color-border-default)] bg-[var(--color-bg-app)] h-[400px] group">
                            <img
                                src={previewUrl!}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                            {isAnalyzing && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white backdrop-blur-sm">
                                    <Loader2 className="w-10 h-10 animate-spin mb-3 text-purple-400" />
                                    <p className="font-medium">Analyzing image...</p>
                                </div>
                            )}
                        </div>

                        {!isAnalyzing && !extractedText && !description && (
                            <button
                                onClick={handleAnalyze}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-purple-500/25"
                            >
                                <FileText className="w-5 h-5" />
                                Analyze Image
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Right Column: Results */}
            <div className="space-y-4 flex flex-col h-full">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        Smart Analysis
                    </h3>
                    {extractedText && (
                        <button
                            onClick={handleCopy}
                            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border-default)] hover:border-[var(--color-border-hover)]"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy Text'}
                        </button>
                    )}
                </div>

                <div className={`
                    flex-1 rounded-xl border p-6 overflow-auto min-h-[400px]
                    ${(extractedText || bestGuess || visualTags.length > 0 || description)
                        ? 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)]'
                        : 'bg-[var(--color-bg-app)] border-[var(--color-border-default)] text-[var(--color-text-muted)] flex items-center justify-center italic'
                    }
                `}>
                    {error ? (
                        <div className="text-center text-red-400">
                            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                            <p>{error}</p>
                        </div>
                    ) : (extractedText || bestGuess || visualTags.length > 0 || description) ? (
                        <div className="space-y-8">
                            {/* Header Section: Title & Description */}
                            <div className="space-y-4">
                                {bestGuess && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                                            Suggested Title
                                        </h4>
                                        <p className="text-xl font-medium text-[var(--color-text-primary)] leading-tight capitalize">
                                            {bestGuess}
                                        </p>
                                    </div>
                                )}

                                {description && (
                                    <div>
                                        <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                                            Description
                                        </h4>
                                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Colors & Objects Row */}
                            {(colors.length > 0 || objects.length > 0) && (
                                <div className="grid grid-cols-2 gap-6">
                                    {colors.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                                Dominant Colors
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {colors.map((color, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-md px-2 py-1.5" title={color.hex}>
                                                        <div
                                                            className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                                                            style={{ backgroundColor: color.hex }}
                                                        />
                                                        <span className="text-xs text-[var(--color-text-secondary)] font-mono">{color.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {objects.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                                Objects Detected
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {objects.map((obj, i) => (
                                                    <span key={i} className="px-2 py-1 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        {obj}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Visual Attributes */}
                            {(mood || lighting || artStyle || estimatedLocation) && (
                                <div>
                                    <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                        Visual DNA
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 bg-[var(--color-bg-elevated)] rounded-xl p-4 border border-[var(--color-border-default)]">
                                        {mood && (
                                            <div>
                                                <span className="text-xs text-[var(--color-text-muted)] block mb-1">Mood</span>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{mood}</span>
                                            </div>
                                        )}
                                        {lighting && (
                                            <div>
                                                <span className="text-xs text-[var(--color-text-muted)] block mb-1">Lighting</span>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{lighting}</span>
                                            </div>
                                        )}
                                        {artStyle && (
                                            <div>
                                                <span className="text-xs text-[var(--color-text-muted)] block mb-1">Style</span>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{artStyle}</span>
                                            </div>
                                        )}
                                        {estimatedLocation && (
                                            <div>
                                                <span className="text-xs text-[var(--color-text-muted)] block mb-1">Context</span>
                                                <span className="text-sm font-medium text-[var(--color-text-primary)]">{estimatedLocation}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Visual Tags (High Confidence) */}
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                                    Visual Tags
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {visualTags.map((tag, i) => (
                                            <span
                                                key={i}
                                                className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)] text-sm hover:border-purple-500/30 hover:text-purple-300 transition-colors cursor-default"
                                            >
                                                {tag}
                                                <button
                                                    onClick={() => handleRemoveTag(tag)}
                                                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded-full hover:bg-red-500/20 text-red-400 transition-all"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>

                                    {/* Add Tag Button & Modal */}
                                    <div className="relative inline-block">
                                        <AnimatePresence mode="wait">
                                            {!isAddingTag ? (
                                                <motion.button
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.9 }}
                                                    onClick={() => setIsAddingTag(true)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-purple-500/50 hover:bg-purple-500/10 transition-all group"
                                                >
                                                    <div className="p-1 rounded-md bg-[var(--color-bg-app)] border border-[var(--color-border-default)] group-hover:border-purple-500/30">
                                                        <Plus className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium">Add Tag</span>
                                                </motion.button>
                                            ) : (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute top-0 left-0 z-10 w-[300px] p-4 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] shadow-xl shadow-black/50"
                                                >
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <h5 className="text-sm font-semibold text-[var(--color-text-primary)]">Add New Tag</h5>
                                                            <button
                                                                onClick={() => {
                                                                    setIsAddingTag(false);
                                                                    setNewTagInput('');
                                                                }}
                                                                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    autoFocus
                                                                    value={newTagInput}
                                                                    onChange={(e) => setNewTagInput(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleAddTag();
                                                                        if (e.key === 'Escape') setIsAddingTag(false);
                                                                    }}
                                                                    placeholder="Type tag name..."
                                                                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                                                />
                                                            </div>

                                                            <button
                                                                onClick={handleAddTag}
                                                                disabled={!newTagInput.trim()}
                                                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                                                            >
                                                                <Save className="w-4 h-4" />
                                                                Save Tag
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>

                            {/* Extracted Text (OCR) - Moved to bottom */}
                            {extractedText && (
                                <div>
                                    <h4 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
                                        Text Found in Image
                                    </h4>
                                    <div className="bg-[var(--color-bg-app)] rounded-lg p-4 border border-[var(--color-border-default)]">
                                        <p className="text-[var(--color-text-primary)] whitespace-pre-wrap leading-relaxed font-mono text-sm">
                                            {extractedText}
                                        </p>
                                    </div>
                                </div>
                            )}

                        </div>
                    ) : (
                        "Upload an image and click 'Analyze Image' to see results"
                    )}
                </div>
            </div>
        </div>
    );
}
