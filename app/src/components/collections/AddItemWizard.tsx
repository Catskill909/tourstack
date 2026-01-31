import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import type { AIAnalysisResult } from '../../types/media';
import type { ImageCollectionItem } from '../../lib/collectionService';

interface ImageUpload {
  id: string;
  file: File;
  previewUrl: string;
  analysis?: AIAnalysisResult;
  analysisStatus: 'pending' | 'analyzing' | 'complete' | 'error';
  error?: string;
}

interface AddItemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (items: Omit<ImageCollectionItem, 'id' | 'order'>[]) => Promise<void>;
  collectionName: string;
}

export function AddItemWizard({ isOpen, onClose, onAdd, collectionName }: AddItemWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [images, setImages] = useState<ImageUpload[]>([]);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropzone setup
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ImageUpload[] = acceptedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      analysisStatus: 'pending',
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    multiple: true,
    maxFiles: 50,
  });

  // Remove image
  const handleRemoveImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) {
        URL.revokeObjectURL(img.previewUrl);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  // Analyze single image
  const analyzeImage = async (image: ImageUpload): Promise<AIAnalysisResult | null> => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64String = reader.result?.toString().split(',')[1];
            const response = await fetch('/api/gemini/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64String }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Analysis failed');
            }

            const data = await response.json();
            resolve(data);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(image.file);
      });
    } catch (err) {
      return null;
    }
  };

  // Analyze all images
  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    setError(null);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.analysisStatus === 'complete') continue;

      // Update status to analyzing
      setImages((prev) =>
        prev.map((item) =>
          item.id === img.id ? { ...item, analysisStatus: 'analyzing' } : item
        )
      );

      try {
        const analysis = await analyzeImage(img);
        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, analysis: analysis || undefined, analysisStatus: analysis ? 'complete' : 'error' }
              : item
          )
        );
      } catch (err: any) {
        setImages((prev) =>
          prev.map((item) =>
            item.id === img.id
              ? { ...item, analysisStatus: 'error', error: err.message }
              : item
          )
        );
      }
    }

    setIsAnalyzingAll(false);
  };

  // Add items to collection
  const handleAdd = async () => {
    if (images.length === 0) return;

    setIsAdding(true);
    setError(null);

    try {
      // First, upload images to media library
      const uploadedItems = await Promise.all(
        images.map(async (img) => {
          const formData = new FormData();
          formData.append('file', img.file);

          const response = await fetch('/api/media', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload ${img.file.name}`);
          }

          const mediaData = await response.json();

          return {
            type: 'image' as const,
            url: mediaData.url,
            alt: img.analysis?.suggestedTitle ? { en: img.analysis.suggestedTitle } : undefined,
            caption: img.analysis?.description ? { en: img.analysis.description } : undefined,
            aiMetadata: img.analysis,
          };
        })
      );

      // Call the onAdd callback with the items
      await onAdd(uploadedItems);

      // Clean up preview URLs
      images.forEach((img) => URL.revokeObjectURL(img.previewUrl));

      // Reset and close
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add items');
    } finally {
      setIsAdding(false);
    }
  };

  // Reset wizard
  const handleClose = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setStep(1);
    setImages([]);
    setError(null);
    onClose();
  };

  // Navigation
  const canGoNext = () => {
    switch (step) {
      case 1:
        return images.length > 0;
      case 2:
        return true;
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

  const analyzedCount = images.filter((i) => i.analysisStatus === 'complete').length;
  const analyzingCount = images.filter((i) => i.analysisStatus === 'analyzing').length;

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
          className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-default)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Plus className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Add Items to Collection
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {collectionName} • Step {step} of 3
                </p>
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
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Upload */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    Upload Images
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Drag and drop images or click to browse
                  </p>
                </div>

                {/* Dropzone */}
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragActive
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[var(--color-border-default)] hover:border-blue-500/50 hover:bg-blue-500/5'
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-[var(--color-text-muted)]'}`} />
                  {isDragActive ? (
                    <p className="text-blue-500 font-medium">Drop the images here...</p>
                  ) : (
                    <>
                      <p className="text-[var(--color-text-primary)] font-medium">
                        Drag & drop images here
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">
                        or click to select files (PNG, JPG, GIF, WebP)
                      </p>
                    </>
                  )}
                </div>

                {/* Image Grid */}
                {images.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                        {images.length} image{images.length !== 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={() => setImages([])}
                        className="text-sm text-red-500 hover:text-red-400 transition-colors"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {images.map((img) => (
                        <div
                          key={img.id}
                          className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-elevated)]"
                        >
                          <img
                            src={img.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleRemoveImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: AI Analysis */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    AI Object Analysis
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Use AI to automatically analyze and tag your images
                  </p>
                </div>

                {/* Analysis Status */}
                <div className="bg-[var(--color-bg-elevated)] rounded-xl p-6 border border-[var(--color-border-default)]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          Gemini Vision Analysis
                        </p>
                        <p className="text-sm text-[var(--color-text-muted)]">
                          {analyzedCount} of {images.length} images analyzed
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleAnalyzeAll}
                      disabled={isAnalyzingAll || analyzedCount === images.length}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors
                        ${isAnalyzingAll || analyzedCount === images.length
                          ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                        }
                      `}
                    >
                      {isAnalyzingAll ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : analyzedCount === images.length ? (
                        <>
                          <Check className="w-4 h-4" />
                          Complete
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze All
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress */}
                  {isAnalyzingAll && (
                    <div className="mb-4">
                      <div className="h-2 bg-[var(--color-bg-surface)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${(analyzedCount / images.length) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center">
                        Analyzing image {analyzedCount + analyzingCount} of {images.length}...
                      </p>
                    </div>
                  )}

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      'Object Detection',
                      'Auto-Tagging',
                      'Color Analysis',
                      'OCR Text Extraction',
                      'Mood & Style',
                      'Description Generation',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-[var(--color-text-muted)]">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Analysis Status Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-elevated)]"
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {/* Status Badge */}
                      <div
                        className={`
                          absolute bottom-1 right-1 p-1 rounded-md
                          ${img.analysisStatus === 'complete' ? 'bg-green-500' : ''}
                          ${img.analysisStatus === 'analyzing' ? 'bg-blue-500' : ''}
                          ${img.analysisStatus === 'error' ? 'bg-red-500' : ''}
                          ${img.analysisStatus === 'pending' ? 'bg-gray-500' : ''}
                        `}
                      >
                        {img.analysisStatus === 'complete' && <Check className="w-3 h-3 text-white" />}
                        {img.analysisStatus === 'analyzing' && <Loader2 className="w-3 h-3 text-white animate-spin" />}
                        {img.analysisStatus === 'error' && <AlertCircle className="w-3 h-3 text-white" />}
                        {img.analysisStatus === 'pending' && <div className="w-3 h-3" />}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[var(--color-text-muted)] text-center">
                  AI analysis is optional. You can skip this step and analyze images later.
                </p>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                    Review & Add
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Review your images before adding to the collection
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-[var(--color-bg-elevated)] rounded-xl p-6 border border-[var(--color-border-default)]">
                  <div className="flex items-center gap-4 text-sm text-[var(--color-text-muted)]">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {images.length} images to add
                    </span>
                    {analyzedCount > 0 && (
                      <span className="flex items-center gap-1 text-green-500">
                        <Sparkles className="w-4 h-4" />
                        {analyzedCount} with AI analysis
                      </span>
                    )}
                  </div>
                </div>

                {/* Image Preview Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]"
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {img.analysisStatus === 'complete' && img.analysis && (
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity p-2 overflow-hidden">
                          <p className="text-white text-xs line-clamp-3">
                            {img.analysis.suggestedTitle || img.analysis.description}
                          </p>
                          {img.analysis.tags && img.analysis.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {img.analysis.tags.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-white/20 text-white px-1 py-0.5 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {img.analysisStatus === 'complete' && (
                        <div className="absolute top-1 right-1 p-1 bg-green-500 rounded-md">
                          <Sparkles className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-[var(--color-border-default)] bg-[var(--color-bg-elevated)] flex-shrink-0">
            <button
              onClick={step === 1 ? handleClose : goBack}
              className="flex items-center gap-2 px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {step === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </>
              )}
            </button>

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={!canGoNext()}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                  ${canGoNext()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] cursor-not-allowed'
                  }
                `}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className={`
                  flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors
                  ${isAdding
                    ? 'bg-blue-500/50 text-white cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }
                `}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add {images.length} Item{images.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
