// Image Analysis Panel - AI-powered image analysis
import { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, Tag, FileText, Palette, Eye, MapPin, Sun, Brush } from 'lucide-react';
import { mediaService } from '../../lib/mediaService';
import type { AIAnalysisResult } from '../../types/media';

interface ImageAnalysisPanelProps {
  imageUrl: string;
  /** Existing AI analysis (loaded from database) */
  initialAnalysis?: AIAnalysisResult;
  onApplyTags?: (tags: string[]) => void;
  onApplyDescription?: (description: string) => void;
  onApplyTitle?: (title: string) => void;
  /** Callback when analysis is complete - use to persist to database */
  onAnalysisComplete?: (analysis: AIAnalysisResult) => void;
}

export function ImageAnalysisPanel({
  imageUrl,
  initialAnalysis,
  onApplyTags,
  onApplyDescription,
  onApplyTitle,
  onAnalysisComplete,
}: ImageAnalysisPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(initialAnalysis || null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);
      setError(null);
      const result = await mediaService.analyzeImage(imageUrl);
      setAnalysis(result);
      // Notify parent so they can persist the analysis
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      setError('Failed to analyze image. Make sure the Gemini API key is configured.');
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-accent-tertiary)]" />
          <span className="font-medium text-[var(--color-text-primary)]">AI Analysis</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-[var(--color-border-default)] space-y-4">
          {/* Analyze Button */}
          {!analysis && (
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--color-accent-tertiary)] to-[var(--color-accent-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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

          {/* Error */}
          {error && (
            <div className="p-3 bg-[var(--color-status-error)]/10 border border-[var(--color-status-error)]/30 rounded-lg">
              <p className="text-sm text-[var(--color-status-error)]">{error}</p>
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Suggested Title */}
              {analysis.suggestedTitle && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                      Suggested Title
                    </label>
                    {onApplyTitle && (
                      <button
                        onClick={() => onApplyTitle(analysis.suggestedTitle)}
                        className="text-xs text-[var(--color-accent-primary)] hover:underline"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {analysis.suggestedTitle}
                  </p>
                </div>
              )}

              {/* Description */}
              {analysis.description && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Description
                      </label>
                    </div>
                    {onApplyDescription && (
                      <button
                        onClick={() => onApplyDescription(analysis.description)}
                        className="text-xs text-[var(--color-accent-primary)] hover:underline"
                      >
                        Apply as Caption
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {analysis.description}
                  </p>
                </div>
              )}

              {/* Colors */}
              {analysis.colors && analysis.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                      Dominant Colors
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-2 py-1 bg-[var(--color-bg-surface)] rounded-lg"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-[var(--color-border-default)]"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">{color.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Objects Detected */}
              {analysis.objects && analysis.objects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                      Objects Detected
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.objects.map((obj, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20"
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
                  <div className="grid grid-cols-2 gap-2">
                    {analysis.mood && (
                      <div className="p-2 bg-[var(--color-bg-surface)] rounded-lg">
                        <p className="text-xs text-[var(--color-text-muted)]">Mood</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.mood}</p>
                      </div>
                    )}
                    {analysis.lighting && (
                      <div className="p-2 bg-[var(--color-bg-surface)] rounded-lg">
                        <div className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-[var(--color-text-muted)]" />
                          <p className="text-xs text-[var(--color-text-muted)]">Lighting</p>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.lighting}</p>
                      </div>
                    )}
                    {analysis.artStyle && (
                      <div className="p-2 bg-[var(--color-bg-surface)] rounded-lg">
                        <div className="flex items-center gap-1">
                          <Brush className="w-3 h-3 text-[var(--color-text-muted)]" />
                          <p className="text-xs text-[var(--color-text-muted)]">Style</p>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">{analysis.artStyle}</p>
                      </div>
                    )}
                    {analysis.estimatedLocation && (
                      <div className="p-2 bg-[var(--color-bg-surface)] rounded-lg">
                        <div className="flex items-center gap-1">
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <label className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                        Visual Tags
                      </label>
                    </div>
                    {onApplyTags && (
                      <button
                        onClick={() => onApplyTags(analysis.tags)}
                        className="text-xs text-[var(--color-accent-primary)] hover:underline"
                      >
                        Apply All
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] rounded-md border border-[var(--color-accent-primary)]/20"
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
                  <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-surface)] p-3 rounded-lg font-mono">
                    {analysis.text}
                  </p>
                </div>
              )}

              {/* Re-analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-lg text-sm hover:border-[var(--color-border-hover)] transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                Re-analyze
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
