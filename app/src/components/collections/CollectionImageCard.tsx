import { Sparkles, Loader2, AlertCircle, X, Eye, Languages } from 'lucide-react';
import type { AIAnalysisResult, MultilingualAIAnalysis } from '../../types/media';

interface CollectionImageCardProps {
  imageUrl: string;
  alt?: string;
  aiMetadata?: AIAnalysisResult;
  aiTranslations?: MultilingualAIAnalysis;
  viewLanguage?: string;
  analysisStatus?: 'pending' | 'analyzing' | 'complete' | 'error';
  onClick?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CollectionImageCard({
  imageUrl,
  alt,
  aiMetadata,
  aiTranslations,
  viewLanguage = 'en',
  analysisStatus,
  onClick,
  onRemove,
  showRemove = false,
  size = 'md',
}: CollectionImageCardProps) {
  const sizeClasses = {
    sm: 'aspect-square',
    md: 'aspect-square',
    lg: 'aspect-[4/3]',
  };

  const hasAnalysis = aiMetadata && analysisStatus === 'complete';
  const hasTranslations = aiTranslations && aiTranslations.translatedLanguages.length > 1;

  // Get translated text with fallback to original
  const getTranslatedText = (field: keyof Pick<MultilingualAIAnalysis, 'suggestedTitle' | 'description' | 'mood' | 'artStyle'>) => {
    if (aiTranslations?.[field]?.[viewLanguage]) {
      return aiTranslations[field]![viewLanguage];
    }
    // Fallback to original
    if (aiMetadata && field in aiMetadata) {
      return aiMetadata[field as keyof AIAnalysisResult] as string | undefined;
    }
    return undefined;
  };

  // Get translated tags with fallback
  const getTranslatedTags = (): string[] => {
    if (aiTranslations?.tags?.[viewLanguage]) {
      return aiTranslations.tags[viewLanguage];
    }
    return aiMetadata?.tags || [];
  };

  return (
    <div
      className={`
        relative group rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]
        ${onClick ? 'cursor-pointer hover:border-[var(--color-accent-primary)] transition-colors' : ''}
        ${sizeClasses[size]}
      `}
      onClick={onClick}
    >
      {/* Image */}
      <img
        src={imageUrl}
        alt={alt || ''}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Hover Overlay with AI Metadata */}
      {hasAnalysis && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-3">
            {/* Title - with translation support */}
            {getTranslatedText('suggestedTitle') && (
              <p className="text-white text-sm font-medium line-clamp-1 mb-1">
                {getTranslatedText('suggestedTitle')}
              </p>
            )}

            {/* Tags - with translation support */}
            {getTranslatedTags().length > 0 && (
              <div className="flex flex-wrap gap-1">
                {getTranslatedTags().slice(0, 4).map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {getTranslatedTags().length > 4 && (
                  <span className="text-[10px] text-white/70">
                    +{getTranslatedTags().length - 4}
                  </span>
                )}
              </div>
            )}

            {/* Colors */}
            {aiMetadata.colors && aiMetadata.colors.length > 0 && (
              <div className="flex gap-1 mt-2">
                {aiMetadata.colors.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/30"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* View button */}
          {onClick && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Eye className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Badge */}
      {hasAnalysis && (
        <div className="absolute top-2 right-2 p-1.5 bg-green-500 rounded-lg shadow-lg">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Analysis Status Badge (for wizard) */}
      {analysisStatus && analysisStatus !== 'complete' && (
        <div
          className={`
            absolute top-2 right-2 p-1.5 rounded-lg shadow-lg
            ${analysisStatus === 'analyzing' ? 'bg-blue-500' : ''}
            ${analysisStatus === 'error' ? 'bg-red-500' : ''}
            ${analysisStatus === 'pending' ? 'bg-gray-500' : ''}
          `}
        >
          {analysisStatus === 'analyzing' && (
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          )}
          {analysisStatus === 'error' && (
            <AlertCircle className="w-3 h-3 text-white" />
          )}
          {analysisStatus === 'pending' && (
            <div className="w-3 h-3 rounded-full bg-white/50" />
          )}
        </div>
      )}

      {/* Remove Button */}
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Visual DNA indicators (compact) - with translation support */}
      {hasAnalysis && (getTranslatedText('mood') || getTranslatedText('artStyle')) && (
        <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {getTranslatedText('mood') && (
            <span className="text-[10px] bg-purple-500/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
              {getTranslatedText('mood')}
            </span>
          )}
          {getTranslatedText('artStyle') && (
            <span className="text-[10px] bg-amber-500/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
              {getTranslatedText('artStyle')}
            </span>
          )}
        </div>
      )}

      {/* Translation Badge */}
      {hasTranslations && (
        <div
          className="absolute top-2 right-10 p-1.5 bg-blue-500 rounded-lg shadow-lg"
          title={`Translated to ${aiTranslations.translatedLanguages.length} languages`}
        >
          <Languages className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}
