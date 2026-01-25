import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
    value?: string; // Current image URL or data URL
    onChange: (file: File | null) => void;
    onUrlChange?: (url: string) => void;
    maxSizeMB?: number;
    accept?: string;
    label?: string;
    helpText?: string;
}

export function ImageUpload({
    value,
    onChange,
    onUrlChange,
    maxSizeMB = 5,
    accept = 'image/jpeg,image/png,image/webp',
    label = 'Tour Hero Image',
    helpText = 'Drag & drop or click to upload. Supports JPG, PNG, WebP.'
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | undefined>(value);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const validateFile = (file: File): string | null => {
        // Check file type
        const acceptedTypes = accept.split(',').map(t => t.trim());
        if (!acceptedTypes.includes(file.type)) {
            return `Invalid file type. Please upload ${acceptedTypes.join(', ')}`;
        }

        // Check file size
        if (file.size > maxSizeBytes) {
            return `File too large. Maximum size is ${maxSizeMB}MB`;
        }

        return null;
    };

    const handleFile = async (file: File) => {
        setError(null);
        setIsLoading(true);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setIsLoading(false);
            return;
        }

        try {
            // Convert to base64 data URL
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                setPreview(dataUrl);
                if (onUrlChange) {
                    onUrlChange(dataUrl);
                }
                setIsLoading(false);
            };
            reader.onerror = () => {
                setError('Failed to read file');
                setIsLoading(false);
            };
            reader.readAsDataURL(file);

            // Also pass the file to parent
            onChange(file);
        } catch (_err) {
            setError('Failed to process image');
            setIsLoading(false);
        }
    };

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleRemove = () => {
        setPreview(undefined);
        setError(null);
        onChange(null);
        if (onUrlChange) {
            onUrlChange('');
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    {label}
                </label>
            )}

            <div
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden
                    ${isDragging
                        ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                        : error
                            ? 'border-red-400 bg-red-400/5'
                            : preview
                                ? 'border-[var(--color-border-default)] bg-[var(--color-bg-elevated)]'
                                : 'border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-hover)]'
                    }
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileInput}
                    className="hidden"
                />

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-[var(--color-accent-primary)] animate-spin mb-2" />
                        <p className="text-sm text-[var(--color-text-muted)]">Processing image...</p>
                    </div>
                ) : preview ? (
                    <div className="relative group">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemove();
                                }}
                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <X className="w-4 h-4" />
                                Remove Image
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDragging
                            ? 'bg-[var(--color-accent-primary)]/20'
                            : 'bg-[var(--color-bg-surface)]'
                            }`}>
                            {isDragging ? (
                                <Upload className="w-8 h-8 text-[var(--color-accent-primary)]" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-[var(--color-text-muted)]" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                            {isDragging ? 'Drop image here' : 'Drag & drop image here'}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                            or click to browse
                        </p>
                        {helpText && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {helpText}
                            </p>
                        )}
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Max size: {maxSizeMB}MB
                        </p>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                    <span>⚠️</span>
                    {error}
                </p>
            )}
        </div>
    );
}
