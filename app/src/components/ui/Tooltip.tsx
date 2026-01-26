import { useState, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: ReactNode;
    content: string;
    side?: 'top' | 'right' | 'bottom' | 'left';
    disabled?: boolean;
    delayMs?: number;
}

export function Tooltip({
    children,
    content,
    side = 'right',
    disabled = false,
    delayMs = 0 // No delay by default for instant tooltips
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isPreloaded, setIsPreloaded] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Preload tooltip on mount - render invisible to prime the DOM
    useEffect(() => {
        setIsPreloaded(true);
    }, []);

    const calculatePosition = () => {
        if (!triggerRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const offset = 8;

        let top = 0;
        let left = 0;

        switch (side) {
            case 'top':
                top = triggerRect.top - offset;
                left = triggerRect.left + triggerRect.width / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + offset;
                left = triggerRect.left + triggerRect.width / 2;
                break;
            case 'left':
                top = triggerRect.top + triggerRect.height / 2;
                left = triggerRect.left - offset;
                break;
            case 'right':
            default:
                top = triggerRect.top + triggerRect.height / 2;
                left = triggerRect.right + offset;
                break;
        }

        setPosition({ top, left });
    };

    const handleMouseEnter = () => {
        if (disabled) return;
        calculatePosition();

        if (delayMs > 0) {
            timeoutRef.current = setTimeout(() => {
                setIsVisible(true);
            }, delayMs);
        } else {
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Get transform based on side for animation origin
    const getTransform = () => {
        switch (side) {
            case 'top':
                return 'translate(-50%, -100%)';
            case 'bottom':
                return 'translate(-50%, 0)';
            case 'left':
                return 'translate(-100%, -50%)';
            case 'right':
            default:
                return 'translate(0, -50%)';
        }
    };

    // Get animation classes based on side
    const getAnimationClass = () => {
        const base = 'transition-all duration-150 ease-out';
        if (!isVisible) {
            return `${base} opacity-0 scale-95`;
        }
        return `${base} opacity-100 scale-100`;
    };

    const tooltipContent = (
        <div
            ref={tooltipRef}
            className={`
                fixed z-[9999] pointer-events-none
                ${getAnimationClass()}
            `}
            style={{
                top: position.top,
                left: position.left,
                transform: getTransform(),
            }}
        >
            <div className="
                px-3 py-2 
                bg-[#1a1a1a] 
                border border-[#333] 
                rounded-lg 
                shadow-xl shadow-black/40
                backdrop-blur-sm
            ">
                <span className="
                    text-sm font-medium 
                    text-[#e5e5e5] 
                    whitespace-nowrap
                ">
                    {content}
                </span>
            </div>
        </div>
    );

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-flex"
            >
                {children}
            </div>
            {isPreloaded && createPortal(tooltipContent, document.body)}
        </>
    );
}
