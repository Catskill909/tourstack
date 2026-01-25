import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, X, Type, AlignLeft } from 'lucide-react';
import { ModernToggle } from './ui/ModernToggle';

export interface DisplaySettings {
    showTitles: boolean;
    showDescriptions: boolean;
}

interface DisplaySettingsPanelProps {
    settings: DisplaySettings;
    onChange: (settings: DisplaySettings) => void;
    /** Position of the FAB */
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    /** Show a subtle label next to FAB */
    showLabel?: boolean;
}

/**
 * DisplaySettingsPanel - Floating Action Button with slide-up settings panel
 * 
 * Modern Material Design 3 inspired UI for controlling content visibility
 * in preview and visitor tour views.
 */
export function DisplaySettingsPanel({
    settings,
    onChange,
    position = 'bottom-right',
    showLabel = false,
}: DisplaySettingsPanelProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Position classes for the FAB container
    const positionClasses = {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
    };

    // Panel animation variants
    const panelVariants = {
        hidden: {
            opacity: 0,
            y: 20,
            scale: 0.95,
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 400,
                damping: 25,
            },
        },
        exit: {
            opacity: 0,
            y: 10,
            scale: 0.95,
            transition: {
                duration: 0.15,
            },
        },
    };

    // FAB animation variants
    const fabVariants = {
        rest: { scale: 1, rotate: 0 },
        hover: { scale: 1.05 },
        tap: { scale: 0.95 },
        open: { rotate: 45 },
    };

    const handleToggleTitles = (checked: boolean) => {
        onChange({ ...settings, showTitles: checked });
    };

    const handleToggleDescriptions = (checked: boolean) => {
        onChange({ ...settings, showDescriptions: checked });
    };

    // Count active settings for badge
    const activeCount = [settings.showTitles, settings.showDescriptions].filter(Boolean).length;
    const totalCount = 2;

    return (
        <div className={`fixed ${positionClasses[position]} z-50`}>
            {/* Backdrop when panel is open */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        style={{ zIndex: -1 }}
                    />
                )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="absolute bottom-16 right-0 w-72 bg-[var(--color-bg-surface)] rounded-2xl shadow-2xl border border-[var(--color-border-default)] overflow-hidden"
                        variants={panelVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-bg-elevated)] border-b border-[var(--color-border-default)]">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-primary)]/10 flex items-center justify-center">
                                    <Settings2 className="w-4 h-4 text-[var(--color-accent-primary)]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                                        Display Settings
                                    </h3>
                                    <p className="text-[10px] text-[var(--color-text-muted)]">
                                        {activeCount}/{totalCount} visible
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Panel Content */}
                        <div className="p-4 space-y-4">
                            {/* Show Titles Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${settings.showTitles
                                            ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'
                                        }`}>
                                        <Type className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            Show Titles
                                        </p>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">
                                            Stop & block titles
                                        </p>
                                    </div>
                                </div>
                                <ModernToggle
                                    checked={settings.showTitles}
                                    onChange={handleToggleTitles}
                                    size="sm"
                                />
                            </div>

                            {/* Show Descriptions Toggle */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${settings.showDescriptions
                                            ? 'bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]'
                                            : 'bg-[var(--color-bg-hover)] text-[var(--color-text-muted)]'
                                        }`}>
                                        <AlignLeft className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                            Show Descriptions
                                        </p>
                                        <p className="text-[10px] text-[var(--color-text-muted)]">
                                            Stop & block descriptions
                                        </p>
                                    </div>
                                </div>
                                <ModernToggle
                                    checked={settings.showDescriptions}
                                    onChange={handleToggleDescriptions}
                                    size="sm"
                                />
                            </div>

                            {/* Divider */}
                            <div className="border-t border-[var(--color-border-default)] pt-3">
                                <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                                    Controls how content appears to visitors
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Action Button */}
            <div className="flex items-center gap-2">
                {showLabel && !isOpen && (
                    <motion.span
                        className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)]/90 backdrop-blur-sm px-2 py-1 rounded-full border border-[var(--color-border-default)]"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        Display
                    </motion.span>
                )}
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
                        relative w-12 h-12 rounded-full shadow-lg
                        flex items-center justify-center
                        transition-colors duration-200
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2
                        ${isOpen
                            ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)]'
                            : 'bg-[var(--color-accent-primary)] text-white hover:brightness-110'
                        }
                    `}
                    variants={fabVariants}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                    animate={isOpen ? 'open' : 'rest'}
                >
                    {isOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Settings2 className="w-5 h-5" />
                    )}

                    {/* Badge showing active count when not all are on */}
                    {!isOpen && activeCount < totalCount && (
                        <motion.span
                            className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                            {activeCount}
                        </motion.span>
                    )}
                </motion.button>
            </div>
        </div>
    );
}

export default DisplaySettingsPanel;
