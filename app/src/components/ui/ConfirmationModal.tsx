import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

type ModalVariant = 'confirm' | 'success' | 'warning' | 'danger' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ModalVariant;
  showCancel?: boolean;
  isLoading?: boolean;
}

const VARIANT_CONFIG: Record<ModalVariant, {
  icon: typeof CheckCircle;
  iconBg: string;
  iconColor: string;
  buttonBg: string;
  buttonHover: string;
}> = {
  confirm: {
    icon: Info,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    buttonBg: 'bg-blue-500',
    buttonHover: 'hover:bg-blue-600',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
    buttonBg: 'bg-green-500',
    buttonHover: 'hover:bg-green-600',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    buttonBg: 'bg-amber-500',
    buttonHover: 'hover:bg-amber-600',
  },
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    buttonBg: 'bg-red-500',
    buttonHover: 'hover:bg-red-600',
  },
  info: {
    icon: Info,
    iconBg: 'bg-[var(--color-accent-primary)]/10',
    iconColor: 'text-[var(--color-accent-primary)]',
    buttonBg: 'bg-[var(--color-accent-primary)]',
    buttonHover: 'hover:bg-[var(--color-accent-primary)]/90',
  },
};

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'confirm',
  showCancel = true,
  isLoading = false,
}: ConfirmationModalProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative bg-[var(--color-bg-surface)] rounded-2xl border border-[var(--color-border-default)] w-full max-w-sm shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={`inline-flex p-4 rounded-full ${config.iconBg} mb-4`}>
              <Icon className={`w-8 h-8 ${config.iconColor}`} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              {message}
            </p>

            {/* Buttons */}
            <div className={`flex gap-3 ${showCancel ? '' : 'justify-center'}`}>
              {showCancel && (
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border-default)] text-[var(--color-text-secondary)] rounded-xl font-medium hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
              )}
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className={`${showCancel ? 'flex-1' : 'px-8'} px-4 py-2.5 ${config.buttonBg} text-white rounded-xl font-medium ${config.buttonHover} transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
