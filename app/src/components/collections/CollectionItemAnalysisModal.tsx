import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FileText,
  Palette,
  Eye,
  MapPin,
  Sun,
  Brush,
  Tag,
  Type,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import type { AIAnalysisResult } from '../../types/media';

interface CollectionItem {
  id: string;
  url: string;
  alt?: { [lang: string]: string };
  caption?: { [lang: string]: string };
  aiMetadata?: AIAnalysisResult;
}

interface CollectionItemAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CollectionItem | null;
  items?: CollectionItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
  onAnalyze?: (item: CollectionItem) => Promise<AIAnalysisResult | null>;
}

export function CollectionItemAnalysisModal({
  isOpen,
  onClose,
  item,
  items = [],
  currentIndex = 0,
  onNavigate,
  onAnalyze,
}: CollectionItemAnalysisModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [localAnalysis, setLocalAnalysis] = useState<AIAnalysisResult | null>(null);

  if (!isOpen || !item) return null;

  const analysis = localAnalysis || item.aiMetadata;
  const hasNavigation = items.length > 1 && onNavigate;
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < items.length - 1;

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!onNavigate) return;
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < items.length) {
      setLocalAnalysis(null);
      onNavigate(newIndex);
    }
  };

  const handleAnalyze = async () => {
    if (!onAnalyze || !item) return;
    setIsAnalyzing(true);
    try {
      const result = await onAnalyze(item);
      if (result) {
        setLocalAnalysis(result);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Navigation Arrows */}
        {hasNavigation && (
          <>
            <button
              onClick={() => handleNavigate('prev')}
              disabled={!canGoPrev}
              className={`
                absolute left-4 z-10 p-3 rounded-full transition-all
                ${canGoPrev
                  ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleNavigate('next')}
              disabled={!canGoNext}
              className={`
                absolute right-4 z-10 p-3 rounded-full transition-all
                ${canGoNext
                  ? 'bg-white/10 hover:bg-white/20 text-white cursor-pointer'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-5xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Image Section */}
          <div className="relative lg:w-1/2 bg-black flex items-center justify-center min-h-[300px] lg:min-h-full">
            <img
              src={item.url}
              alt={item.alt?.en || ''}
              className="max-w-full max-h-[50vh] lg:max-h-[80vh] object-contain"
            />
            {/* Image Counter */}
            {hasNavigation && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                {currentIndex + 1} / {items.length}
              </div>
            )}
          </div>

          {/* Analysis Section */}
          <div className="lg:w-1/2 flex flex-col max-h-[50vh] lg:max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-[var(--color-border-default)] flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Sparkles className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    AI Analysis
                  </h2>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Powered by Gemini Vision
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {!analysis ? (
                <div className="text-center py-8">
                  <Sparkles className="w-12 h-12 text-[var(--color-text-muted)] mx-auto mb-4" />
                  <p className="text-[var(--color-text-muted)] mb-4">
                    No analysis available for this image
                  </p>
                  {onAnalyze && (
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Analyze Image
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Suggested Title */}
                  {analysis.suggestedTitle && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Type className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Suggested Title
                        </label>
                      </div>
                      <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                        {analysis.suggestedTitle}
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  {analysis.description && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Description
                        </label>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                        {analysis.description}
                      </p>
                    </div>
                  )}

                  {/* Colors */}
                  {analysis.colors && analysis.colors.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Palette className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Dominant Colors
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.colors.map((color, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-bg-elevated)] rounded-lg"
                          >
                            <div
                              className="w-5 h-5 rounded-full border border-[var(--color-border-default)]"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className="text-sm text-[var(--color-text-secondary)]">{color.name}</span>
                            <span className="text-xs text-[var(--color-text-muted)]">{color.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Objects Detected */}
                  {analysis.objects && analysis.objects.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Objects Detected
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.objects.map((obj, i) => (
                          <span
                            key={i}
                            className="text-sm px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20"
                          >
                            {obj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visual DNA */}
                  {(analysis.mood || analysis.lighting || analysis.artStyle || analysis.estimatedLocation) && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Visual DNA
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {analysis.mood && (
                          <div className="p-3 bg-[var(--color-bg-elevated)] rounded-xl">
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Mood</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.mood}</p>
                          </div>
                        )}
                        {analysis.lighting && (
                          <div className="p-3 bg-[var(--color-bg-elevated)] rounded-xl">
                            <div className="flex items-center gap-1 mb-1">
                              <Sun className="w-3 h-3 text-[var(--color-text-muted)]" />
                              <p className="text-xs text-[var(--color-text-muted)]">Lighting</p>
                            </div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.lighting}</p>
                          </div>
                        )}
                        {analysis.artStyle && (
                          <div className="p-3 bg-[var(--color-bg-elevated)] rounded-xl">
                            <div className="flex items-center gap-1 mb-1">
                              <Brush className="w-3 h-3 text-[var(--color-text-muted)]" />
                              <p className="text-xs text-[var(--color-text-muted)]">Style</p>
                            </div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.artStyle}</p>
                          </div>
                        )}
                        {analysis.estimatedLocation && (
                          <div className="p-3 bg-[var(--color-bg-elevated)] rounded-xl">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-3 h-3 text-[var(--color-text-muted)]" />
                              <p className="text-xs text-[var(--color-text-muted)]">Context</p>
                            </div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.estimatedLocation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {analysis.tags && analysis.tags.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[var(--color-text-muted)]" />
                        <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          Visual Tags
                        </label>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-sm px-3 py-1.5 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-lg border border-[var(--color-accent-primary)]/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OCR Text */}
                  {analysis.text && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Text Found (OCR)
                      </label>
                      <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] p-4 rounded-xl font-mono whitespace-pre-wrap">
                        {analysis.text}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
