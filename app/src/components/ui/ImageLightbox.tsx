import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ImageLightboxProps {
    isOpen: boolean;
    src: string;
    alt?: string;
    caption?: string;
    credit?: string;
    onClose: () => void;
}

export function ImageLightbox({ isOpen, src, alt = '', caption, credit, onClose }: ImageLightboxProps) {
    const [scale, setScale] = useState(1);
    const [translate, setTranslate] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
    const lastPinchDistRef = useRef<number | null>(null);
    const lastTapRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset zoom when opened/closed
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setTranslate({ x: 0, y: 0 });
        }
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDistRef.current = Math.sqrt(dx * dx + dy * dy);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        e.preventDefault();
        if (e.touches.length === 2 && lastPinchDistRef.current !== null) {
            // Pinch to zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const delta = dist / lastPinchDistRef.current;
            setScale(prev => Math.max(1, Math.min(5, prev * delta)));
            lastPinchDistRef.current = dist;
        } else if (e.touches.length === 1 && lastTouchRef.current && scale > 1) {
            // Pan when zoomed
            const dx = e.touches[0].clientX - lastTouchRef.current.x;
            const dy = e.touches[0].clientY - lastTouchRef.current.y;
            setTranslate(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            setIsDragging(true);
        } else if (e.touches.length === 1 && lastTouchRef.current && scale === 1) {
            // Swipe down to dismiss
            const dy = e.touches[0].clientY - lastTouchRef.current.y;
            if (dy > 0) {
                setTranslate(prev => ({ ...prev, y: prev.y + dy }));
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                setIsDragging(true);
            }
        }
    }, [scale]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        // Swipe down dismiss threshold
        if (scale === 1 && translate.y > 100) {
            onClose();
            return;
        }
        // Snap back if not dismissed
        if (scale === 1) {
            setTranslate({ x: 0, y: 0 });
        }

        // Double-tap to zoom
        if (e.changedTouches.length === 1 && !isDragging) {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
                if (scale > 1) {
                    setScale(1);
                    setTranslate({ x: 0, y: 0 });
                } else {
                    setScale(2.5);
                }
                lastTapRef.current = 0;
            } else {
                lastTapRef.current = now;
            }
        }

        lastTouchRef.current = null;
        lastPinchDistRef.current = null;
        setIsDragging(false);
    }, [scale, translate.y, isDragging, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={containerRef}
                    className="fixed inset-0 z-[200] flex flex-col bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Image area */}
                    <div
                        className="flex-1 flex items-center justify-center overflow-hidden"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                            // Click backdrop to close (not when zoomed/dragging)
                            if (e.target === e.currentTarget && scale === 1) onClose();
                        }}
                    >
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-full object-contain select-none"
                            draggable={false}
                            style={{
                                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                                transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                            }}
                        />
                    </div>

                    {/* Caption/credit overlay */}
                    {(caption || credit) && (
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                        >
                            {caption && (
                                <p className="text-white text-sm text-center">{caption}</p>
                            )}
                            {credit && (
                                <p className="text-white/60 text-xs text-center mt-1">{credit}</p>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
