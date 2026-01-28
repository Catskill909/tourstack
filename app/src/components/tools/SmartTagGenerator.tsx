import { useState, useCallback } from 'react';
import { Upload, X, Copy, Check, FileText, Loader2, Image as ImageIcon, AlertCircle, Plus, Save } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';

export function SmartTagGenerator() {
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string | null>(null);
    const [visualTags, setVisualTags] = useState<string[]>([]);
    const [webReferences, setWebReferences] = useState<string[]>([]);
    const [bestGuess, setBestGuess] = useState<string | null>(null);
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
            setWebReferences([]);
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
            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(image);

            reader.onload = async () => {
                const base64String = reader.result?.toString().split(',')[1];

                try {
                    const response = await fetch('/api/vision/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            image: base64String,
                            features: ['TEXT_DETECTION']
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        // errorData.error is now the message string from the server
                        throw new Error(errorData.error || 'Failed to analyze image');
                    }

                    const data = await response.json();

                    if (data.fullTextAnnotation) {
                        setExtractedText(data.fullTextAnnotation.text);
                    } else if (data.textAnnotations && data.textAnnotations.length > 0) {
                        setExtractedText(data.textAnnotations[0].description);
                    } else {
                        setExtractedText(null);
                    }

                    // Process Tags
                    if (data.labelAnnotations) {
                        const labels = data.labelAnnotations.map((l: any) => l.description);
                        setVisualTags(labels.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)));
                    } else {
                        setVisualTags([]);
                    }

                    if (data.webDetection?.webEntities) {
                        const webEntities = data.webDetection.webEntities
                            .slice(0, 5) // Limit to top 5
                            .map((w: any) => w.description);
                        setWebReferences(webEntities.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)));
                    } else {
                        setWebReferences([]);
                    }

                    if (data.webDetection?.bestGuessLabels?.length > 0) {
                        setBestGuess(data.webDetection.bestGuessLabels[0].label);
                    } else {
                        setBestGuess(null);
                    }
                } catch (err) {
                    setError('Failed to analyze image. Please try again.');
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
        setWebReferences([]);
        setBestGuess(null);
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

                        {!isAnalyzing && !extractedText && (
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
                    ${(extractedText || bestGuess || visualTags.length > 0 || webReferences.length > 0)
                        ? 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)]'
                        : 'bg-[var(--color-bg-app)] border-[var(--color-border-default)] text-[var(--color-text-muted)] flex items-center justify-center italic'
                    }
                `}>
                    {error ? (
                        <div className="text-center text-red-400">
                            <AlertCircle className="w-10 h-10 mx-auto mb-3" />
                            <p>{error}</p>
                        </div>
                    ) : (extractedText || bestGuess || visualTags.length > 0 || webReferences.length > 0) ? (
                        <div className="space-y-8">
                            {/* Best Guess Title */}
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

                            {/* Extracted Text (OCR) */}
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
                        </div>
                    ) : (
                        "Upload an image and click 'Analyze Image' to see results"
                    )}
                </div>
            </div>
        </div>
    );
}
