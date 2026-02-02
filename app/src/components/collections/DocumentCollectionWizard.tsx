import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Upload,
    FileText,
    Loader2,
    Check,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { collectionService } from '../../lib/collectionService';

interface DocumentUpload {
    id: string;
    file: File;
    fileName: string;
    fileSize: number;
    extractedText?: string;
    extractionStatus: 'pending' | 'extracting' | 'complete' | 'error';
    error?: string;
}

interface DocumentCollectionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (collectionId: string) => void;
}

export function DocumentCollectionWizard({ isOpen, onClose, onSuccess }: DocumentCollectionWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [collectionName, setCollectionName] = useState('');
    const [collectionDescription, setCollectionDescription] = useState('');
    const [documents, setDocuments] = useState<DocumentUpload[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dropzone setup
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newDocs: DocumentUpload[] = acceptedFiles.map((file) => ({
            id: crypto.randomUUID(),
            file,
            fileName: file.name,
            fileSize: file.size,
            extractionStatus: 'pending',
        }));
        setDocuments((prev) => [...prev, ...newDocs]);

        // Auto-extract text from documents
        newDocs.forEach((doc) => extractText(doc));
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/rtf': ['.rtf'],
            'text/rtf': ['.rtf'],
            'application/vnd.oasis.opendocument.text': ['.odt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        },
        multiple: true,
        maxFiles: 20,
    });

    // Extract text from document using server API
    const extractText = async (doc: DocumentUpload) => {
        setDocuments((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, extractionStatus: 'extracting' } : d))
        );

        try {
            // For .txt files, read directly in browser
            if (doc.file.name.toLowerCase().endsWith('.txt')) {
                const text = await doc.file.text();
                setDocuments((prev) =>
                    prev.map((d) =>
                        d.id === doc.id ? { ...d, extractedText: text, extractionStatus: 'complete' } : d
                    )
                );
                return;
            }

            // For all other files (PDF, DOCX, DOC, RTF, ODT, PPTX), use server API
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];

                    const response = await fetch('/api/documents/extract-text-base64', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            data: base64Data,
                            fileName: doc.file.name,
                            mimeType: doc.file.type,
                        }),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setDocuments((prev) =>
                            prev.map((d) =>
                                d.id === doc.id
                                    ? { ...d, extractedText: result.text, extractionStatus: 'complete' }
                                    : d
                            )
                        );
                    } else {
                        const error = await response.json();
                        setDocuments((prev) =>
                            prev.map((d) =>
                                d.id === doc.id
                                    ? { ...d, extractionStatus: 'error', error: error.details || error.message || 'Failed to extract text' }
                                    : d
                            )
                        );
                    }
                } catch (err: any) {
                    setDocuments((prev) =>
                        prev.map((d) =>
                            d.id === doc.id ? { ...d, extractionStatus: 'error', error: err.message } : d
                        )
                    );
                }
            };
            reader.readAsDataURL(doc.file);
        } catch (err: any) {
            setDocuments((prev) =>
                prev.map((d) =>
                    d.id === doc.id ? { ...d, extractionStatus: 'error', error: err.message } : d
                )
            );
        }
    };

    // Remove document
    const handleRemoveDoc = (id: string) => {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
    };

    // Create collection
    const handleCreate = async () => {
        if (!collectionName.trim() || documents.length === 0) return;

        setIsCreating(true);
        setError(null);

        try {
            // Create collection items from documents
            const items = documents.map((doc, index) => ({
                id: crypto.randomUUID(),
                type: 'document' as const,
                url: URL.createObjectURL(doc.file),
                order: index,
                metadata: {
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    extractedText: doc.extractedText,
                },
            }));

            // Create the collection
            const collection = await collectionService.create({
                name: collectionName.trim(),
                description: collectionDescription.trim() || undefined,
                type: 'document_collection',
                items,
            });

            onSuccess(collection.id);
        } catch (err: any) {
            setError(err.message || 'Failed to create collection');
        } finally {
            setIsCreating(false);
        }
    };

    // Reset wizard
    const handleClose = () => {
        setStep(1);
        setCollectionName('');
        setCollectionDescription('');
        setDocuments([]);
        setError(null);
        onClose();
    };

    // Navigation
    const canGoNext = () => {
        switch (step) {
            case 1:
                return collectionName.trim().length > 0;
            case 2:
                return documents.length > 0;
            default:
                return false;
        }
    };

    const goNext = () => {
        if (step < 3 && canGoNext()) {
            setStep((s) => (s + 1) as 1 | 2 | 3);
        }
    };

    const goBack = () => {
        if (step > 1) {
            setStep((s) => (s - 1) as 1 | 2 | 3);
        }
    };

    if (!isOpen) return null;

    const extractedCount = documents.filter((d) => d.extractionStatus === 'complete').length;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-2xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-default)] flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <FileText className="w-5 h-5 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                    Create Document Collection
                                </h2>
                                <p className="text-sm text-[var(--color-text-muted)]">Step {step} of 3</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 bg-[var(--color-bg-elevated)] flex-shrink-0">
                        <div
                            className="h-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Step 1: Details */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                        Collection Details
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Give your document collection a name and description
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={collectionName}
                                            onChange={(e) => setCollectionName(e.target.value)}
                                            placeholder="e.g. Exhibition Research Documents"
                                            className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            value={collectionDescription}
                                            onChange={(e) => setCollectionDescription(e.target.value)}
                                            placeholder="Optional description for this collection..."
                                            rows={4}
                                            className="w-full px-4 py-3 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Upload */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                        Upload Documents
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Drag and drop documents or click to browse
                                    </p>
                                </div>

                                {/* Dropzone */}
                                <div
                                    {...getRootProps()}
                                    className={`
                                        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                                        ${isDragActive
                                            ? 'border-amber-500 bg-amber-500/10'
                                            : 'border-[var(--color-border-default)] hover:border-amber-500/50 hover:bg-amber-500/5'
                                        }
                                    `}
                                >
                                    <input {...getInputProps()} />
                                    <Upload
                                        className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-amber-500' : 'text-[var(--color-text-muted)]'}`}
                                    />
                                    {isDragActive ? (
                                        <p className="text-amber-500 font-medium">Drop the files here...</p>
                                    ) : (
                                        <>
                                            <p className="text-[var(--color-text-primary)] font-medium">
                                                Drag & drop documents here
                                            </p>
                                            <p className="text-sm text-[var(--color-text-muted)] mt-1">
                                                TXT, PDF, DOC, DOCX (max 20 files)
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Document List */}
                                {documents.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                                                {documents.length} document{documents.length !== 1 ? 's' : ''} selected
                                            </span>
                                            <button
                                                onClick={() => setDocuments([])}
                                                className="text-sm text-red-500 hover:text-red-400 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {documents.map((doc) => (
                                                <div
                                                    key={doc.id}
                                                    className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                                                >
                                                    <div
                                                        className={`p-2 rounded-lg ${doc.extractionStatus === 'complete'
                                                            ? 'bg-green-500/10'
                                                            : doc.extractionStatus === 'error'
                                                                ? 'bg-red-500/10'
                                                                : 'bg-amber-500/10'
                                                            }`}
                                                    >
                                                        {doc.extractionStatus === 'extracting' ? (
                                                            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                                        ) : doc.extractionStatus === 'complete' ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : doc.extractionStatus === 'error' ? (
                                                            <AlertCircle className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <FileText className="w-4 h-4 text-amber-500" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                                            {doc.fileName}
                                                        </p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {(doc.fileSize / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveDoc(doc.id)}
                                                        className="p-1 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                                        Review & Create
                                    </h3>
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        Review your collection before creating. AI tools will be available after import.
                                    </p>
                                </div>

                                {/* Collection Summary */}
                                <div className="bg-[var(--color-bg-elevated)] rounded-xl p-6 border border-[var(--color-border-default)]">
                                    <h4 className="font-semibold text-[var(--color-text-primary)] text-lg mb-1">
                                        {collectionName}
                                    </h4>
                                    {collectionDescription && (
                                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                            {collectionDescription}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {documents.length} documents
                                        </span>
                                        <span className="flex items-center gap-1 text-green-500">
                                            <Check className="w-4 h-4" />
                                            {extractedCount} ready
                                        </span>
                                    </div>
                                </div>

                                {/* Tip about AI tools */}
                                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                    <p className="text-sm text-amber-500">
                                        <strong>Tip:</strong> After creating this collection, use AI Tools in the collection view to summarize, extract facts, generate FAQ, and auto-tag your documents.
                                    </p>
                                </div>

                                {/* Document Preview List */}
                                <div className="space-y-2">
                                    {documents.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg border border-[var(--color-border-default)]"
                                        >
                                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                                <FileText className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                                    {doc.fileName}
                                                </p>
                                                <p className="text-xs text-[var(--color-text-muted)]">
                                                    {(doc.fileSize / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                            {doc.extractionStatus === 'complete' && (
                                                <Check className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                                        {error}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between p-6 border-t border-[var(--color-border-default)] flex-shrink-0 bg-[var(--color-bg-elevated)]">
                        <button
                            onClick={step === 1 ? handleClose : goBack}
                            className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        <div className="flex items-center gap-3">
                            {step < 3 ? (
                                <button
                                    onClick={goNext}
                                    disabled={!canGoNext()}
                                    className={`
                                        flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                                        ${canGoNext()
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
                                        }
                                    `}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreate}
                                    disabled={isCreating || documents.length === 0}
                                    className={`
                                        flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                                        ${isCreating || documents.length === 0
                                            ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
                                            : 'bg-amber-500 text-white hover:bg-amber-600'
                                        }
                                    `}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Create Collection
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
