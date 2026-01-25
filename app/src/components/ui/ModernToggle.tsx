import { motion } from 'framer-motion';

interface ModernToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    className?: string;
}

/**
 * ModernToggle - Material Design 3 inspired toggle switch
 * 
 * Features:
 * - Smooth spring animations via Framer Motion
 * - Multiple sizes (sm, md, lg)
 * - Optional label and description
 * - Accessible with proper ARIA attributes
 * - Dark mode optimized
 */
export function ModernToggle({
    checked,
    onChange,
    label,
    description,
    size = 'md',
    disabled = false,
    className = '',
}: ModernToggleProps) {
    // Size configurations
    const sizes = {
        sm: {
            track: 'w-9 h-5',
            thumb: 'w-4 h-4',
            thumbTranslate: checked ? 'translateX(16px)' : 'translateX(2px)',
            iconSize: 'w-2.5 h-2.5',
        },
        md: {
            track: 'w-12 h-7',
            thumb: 'w-5 h-5',
            thumbTranslate: checked ? 'translateX(22px)' : 'translateX(3px)',
            iconSize: 'w-3 h-3',
        },
        lg: {
            track: 'w-14 h-8',
            thumb: 'w-6 h-6',
            thumbTranslate: checked ? 'translateX(26px)' : 'translateX(3px)',
            iconSize: 'w-3.5 h-3.5',
        },
    };

    const sizeConfig = sizes[size];

    return (
        <label
            className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}
        >
            {/* Toggle Track */}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`
                    relative inline-flex items-center shrink-0 rounded-full
                    transition-colors duration-200 ease-in-out
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-surface)]
                    ${sizeConfig.track}
                    ${checked
                        ? 'bg-[var(--color-accent-primary)]'
                        : 'bg-[var(--color-bg-hover)] border border-[var(--color-border-default)]'
                    }
                `}
            >
                {/* Animated Thumb */}
                <motion.span
                    className={`
                        inline-flex items-center justify-center rounded-full shadow-md
                        ${sizeConfig.thumb}
                        ${checked
                            ? 'bg-white'
                            : 'bg-[var(--color-text-muted)]'
                        }
                    `}
                    initial={false}
                    animate={{
                        x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 24) : 2,
                        scale: 1,
                    }}
                    whileTap={{ scale: 0.9 }}
                    transition={{
                        type: 'spring',
                        stiffness: 500,
                        damping: 30,
                    }}
                >
                    {/* Check/X Icon inside thumb */}
                    <motion.svg
                        className={sizeConfig.iconSize}
                        viewBox="0 0 12 12"
                        fill="none"
                        initial={false}
                        animate={{
                            opacity: checked ? 1 : 0,
                            scale: checked ? 1 : 0.5,
                        }}
                        transition={{ duration: 0.15 }}
                    >
                        <path
                            d="M3.5 6L5.5 8L8.5 4"
                            stroke="var(--color-accent-primary)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </motion.svg>
                </motion.span>
            </button>

            {/* Label and Description */}
            {(label || description) && (
                <div className="flex flex-col">
                    {label && (
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {label}
                        </span>
                    )}
                    {description && (
                        <span className="text-xs text-[var(--color-text-muted)]">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </label>
    );
}

export default ModernToggle;
