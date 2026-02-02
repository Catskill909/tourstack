import { X, Image, Volume2, Play, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type CollectionTypeOption = 'images' | 'audio' | 'video' | 'documents';

interface CollectionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: CollectionTypeOption) => void;
}

const COLLECTION_TYPES = [
  {
    id: 'images' as const,
    label: 'Images',
    description: 'Create a gallery with AI-powered object analysis',
    icon: Image,
    color: 'blue',
    bgColor: 'bg-blue-500/10',
    hoverBg: 'hover:bg-blue-500/20',
    textColor: 'text-blue-500',
    borderColor: 'border-blue-500/30',
    available: true,
    features: ['Drag & drop upload', 'AI object detection', 'Auto-tagging'],
  },
  {
    id: 'audio' as const,
    label: 'Audio',
    description: 'Generate multi-language TTS audio collections',
    icon: Volume2,
    color: 'purple',
    bgColor: 'bg-purple-500/10',
    hoverBg: 'hover:bg-purple-500/20',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-500/30',
    available: true,
    features: ['Text-to-speech', 'Multi-language', 'Voice selection'],
    redirectNote: 'Opens Audio TTS page',
  },
  {
    id: 'video' as const,
    label: 'Video',
    description: 'Video collections with scene detection',
    icon: Play,
    color: 'red',
    bgColor: 'bg-red-500/10',
    hoverBg: 'hover:bg-red-500/20',
    textColor: 'text-red-500',
    borderColor: 'border-red-500/30',
    available: false,
    features: ['Scene detection', 'Auto-captioning', 'Transcripts'],
  },
  {
    id: 'documents' as const,
    label: 'Documents',
    description: 'Document collections with AI analysis & summarization',
    icon: FileText,
    color: 'amber',
    bgColor: 'bg-amber-500/10',
    hoverBg: 'hover:bg-amber-500/20',
    textColor: 'text-amber-500',
    borderColor: 'border-amber-500/30',
    available: true,
    features: ['PDF/DOCX/TXT', 'AI Summarize', 'Extract Facts'],
  },
];

export function CollectionTypeModal({ isOpen, onClose, onSelect }: CollectionTypeModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--color-border-default)]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-accent-primary)]/10 rounded-lg">
                <Sparkles className="w-5 h-5 text-[var(--color-accent-primary)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Create New Collection
                </h2>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Choose the type of collection you want to create
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Collection Type Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLLECTION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => type.available && onSelect(type.id)}
                    disabled={!type.available}
                    className={`
                      relative group text-left p-5 rounded-xl border-2 transition-all duration-200
                      ${type.available
                        ? `${type.bgColor} ${type.hoverBg} ${type.borderColor} hover:border-opacity-60 cursor-pointer`
                        : 'bg-[var(--color-bg-elevated)] border-[var(--color-border-default)] opacity-60 cursor-not-allowed'
                      }
                    `}
                  >
                    {/* Coming Soon Badge */}
                    {!type.available && (
                      <div className="absolute top-3 right-3 px-2 py-0.5 bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] text-xs font-medium rounded-full border border-[var(--color-border-default)]">
                        Coming Soon
                      </div>
                    )}

                    {/* Icon */}
                    <div className={`inline-flex p-3 rounded-xl ${type.bgColor} mb-4`}>
                      <Icon className={`w-6 h-6 ${type.textColor}`} />
                    </div>

                    {/* Label & Description */}
                    <h3 className={`text-lg font-semibold mb-1 ${type.available ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-[var(--color-text-muted)] mb-3">
                      {type.description}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {type.features.map((feature, i) => (
                        <span
                          key={i}
                          className={`text-xs px-2 py-1 rounded-full ${type.available
                              ? `${type.bgColor} ${type.textColor}`
                              : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
                            }`}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Redirect Note or Arrow */}
                    {type.available && (
                      <div className={`flex items-center gap-1 text-sm ${type.textColor} mt-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {type.redirectNote ? (
                          <span className="text-xs">{type.redirectNote}</span>
                        ) : (
                          <>
                            <span>Get started</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[var(--color-bg-elevated)] border-t border-[var(--color-border-default)]">
            <p className="text-xs text-[var(--color-text-muted)] text-center">
              Collections help you organize and manage media assets for tours and exhibits
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
