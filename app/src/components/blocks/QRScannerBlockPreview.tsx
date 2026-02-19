import { useState, useEffect, useRef, useCallback } from 'react';
import QrScanner from 'qr-scanner';
import { ScanLine, Camera, CameraOff, Keyboard, X, CheckCircle2, XCircle, ArrowRight, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import type { QRScannerBlockData, Stop } from '../../types';
import {
    parseTourStackUrl,
    isTourStackUrl,
    lookupShortCode,
    fetchStopInfo,
    recordScan,
    getScanHistory,
    isStopScanned,
} from '../../lib/qrScannerUtils';

interface QRScannerBlockPreviewProps {
    data: QRScannerBlockData;
    language: string;
    tourId?: string;
    tourSlug?: string;
    allStops?: Stop[];
    onNavigateToStop?: (stopSlug: string) => void;
}

type ScanStatus =
    | { type: 'idle' }
    | { type: 'scanning' }
    | { type: 'requesting' }
    | { type: 'success'; message: string; stopTitle?: string; stopSlug?: string }
    | { type: 'wrong'; message: string }
    | { type: 'error'; message: string }
    | { type: 'info'; title: string; description: string; image?: string; stopSlug?: string };

export function QRScannerBlockPreview({
    data,
    language,
    tourId,
    tourSlug,
    allStops = [],
    onNavigateToStop,
}: QRScannerBlockPreviewProps) {
    const [scanStatus, setScanStatus] = useState<ScanStatus>({ type: 'idle' });
    const [showShortCode, setShowShortCode] = useState(false);
    const [shortCodeInput, setShortCodeInput] = useState('');
    const [shortCodeLoading, setShortCodeLoading] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [scanCount, setScanCount] = useState(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    const qrScannerRef = useRef<QrScanner | null>(null);
    const processingRef = useRef(false);

    const scannerSize = data.scannerSize || 'medium';
    const viewfinderStyle = data.viewfinderStyle || 'rounded';

    const sizeClasses = {
        small: 'w-48 h-48',
        medium: 'w-64 h-64',
        large: 'w-80 h-80',
    };

    const roundingClasses = {
        rounded: 'rounded-2xl',
        square: 'rounded-none',
        minimal: 'rounded-lg',
    };

    // Update scan count from history
    useEffect(() => {
        if (tourId && data.showScanHistory) {
            const history = getScanHistory(tourId);
            setScanCount(history.scannedStops.length);
        }
    }, [tourId, data.showScanHistory]);

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            cleanupScanner();
        };
    }, []);

    function cleanupScanner() {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop();
            qrScannerRef.current.destroy();
            qrScannerRef.current = null;
        }
        setCameraActive(false);
    }

    const stopScanner = useCallback(() => {
        cleanupScanner();
    }, []);

    const startScanner = useCallback(async () => {
        if (!videoRef.current) return;

        setCameraError(null);
        setScanStatus({ type: 'requesting' });

        try {
            // nimiq/qr-scanner handles getUserMedia internally and correctly on iOS Safari.
            // It sets playsinline, autoplay, and muted on the video element.
            const qrScanner = new QrScanner(
                videoRef.current,
                (result) => {
                    if (!processingRef.current) {
                        processingRef.current = true;
                        handleScanResult(result.data);
                        setTimeout(() => { processingRef.current = false; }, 2000);
                    }
                },
                {
                    preferredCamera: data.cameraFacing === 'user' ? 'user' : 'environment',
                    highlightScanRegion: false,
                    highlightCodeOutline: false,
                    returnDetailedScanResult: true,
                }
            );
            qrScannerRef.current = qrScanner;

            // Remove the overlay and mark scanning BEFORE start().
            // The video is never display:none so qr-scanner can always access it.
            setCameraActive(true);
            setScanStatus({ type: 'scanning' });

            // Wait for React to paint (remove overlay) before starting scanner
            await new Promise(resolve => requestAnimationFrame(resolve));
            await qrScanner.start();
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (message.includes('NotAllowed') || message.includes('Permission') || message.includes('denied')) {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings, then tap again.');
            } else if (message.includes('NotFound') || message.includes('DevicesNotFound') || message.includes('Requested device not found')) {
                setCameraError('No camera found on this device. Use "Enter code manually" below.');
            } else if (message.includes('NotReadableError') || message.includes('Could not start')) {
                setCameraError('Camera is in use by another app. Close other camera apps and try again.');
            } else {
                setCameraError(`Camera error: ${message}`);
            }
            setCameraActive(false);
            setScanStatus({ type: 'idle' });
        }
    }, [data.cameraFacing]);

    async function handleScanResult(scannedText: string) {
        if (isTourStackUrl(scannedText)) {
            const parsed = parseTourStackUrl(scannedText);
            if (!parsed) {
                setScanStatus({ type: 'error', message: 'Could not parse QR code URL.' });
                return;
            }
            await handleStopFound(parsed.tourSlug, parsed.stopSlug);
        } else {
            setScanStatus({
                type: 'error',
                message: 'This QR code is not part of the tour system. Look for QR codes on exhibit labels.',
            });
        }
    }

    async function handleStopFound(scannedTourSlug: string, stopSlug: string) {
        if (data.restrictToTour && tourSlug && scannedTourSlug !== tourSlug) {
            setScanStatus({
                type: 'error',
                message: 'This QR code belongs to a different tour.',
            });
            return;
        }

        const matchedStop = allStops.find(s => s.slug === stopSlug || s.id === stopSlug);
        const stopTitle = matchedStop ? getStopTitle(matchedStop) : stopSlug;

        switch (data.mode) {
            case 'navigate':
                if (data.showConfirmation) {
                    setScanStatus({
                        type: 'success',
                        message: `Navigate to "${stopTitle}"?`,
                        stopTitle,
                        stopSlug,
                    });
                } else {
                    if (tourId && matchedStop) {
                        recordScan(tourId, { stopId: matchedStop.id, stopSlug, stopTitle });
                    }
                    onNavigateToStop?.(stopSlug);
                }
                break;

            case 'checkin':
                if (tourId && matchedStop) {
                    if (isStopScanned(tourId, matchedStop.id)) {
                        setScanStatus({
                            type: 'success',
                            message: `Already visited "${stopTitle}"!`,
                            stopTitle,
                        });
                    } else {
                        recordScan(tourId, { stopId: matchedStop.id, stopSlug, stopTitle });
                        setScanCount(prev => prev + 1);
                        setScanStatus({
                            type: 'success',
                            message: `Checked in at "${stopTitle}"!`,
                            stopTitle,
                        });
                    }
                } else {
                    setScanStatus({ type: 'success', message: `Visited: ${stopTitle}`, stopTitle });
                }
                break;

            case 'scavenger':
                if (data.expectedStopId && matchedStop) {
                    if (matchedStop.id === data.expectedStopId || matchedStop.slug === data.expectedStopId) {
                        if (tourId) {
                            recordScan(tourId, { stopId: matchedStop.id, stopSlug, stopTitle });
                            setScanCount(prev => prev + 1);
                        }
                        setScanStatus({
                            type: 'success',
                            message: data.successMessage?.[language] || data.successMessage?.en || `Correct! You found "${stopTitle}"!`,
                            stopTitle,
                        });
                    } else {
                        setScanStatus({
                            type: 'wrong',
                            message: data.wrongCodeMessage?.[language] || data.wrongCodeMessage?.en || "That's not the right code. Keep looking!",
                        });
                    }
                } else {
                    setScanStatus({ type: 'error', message: 'Scavenger hunt not configured properly.' });
                }
                break;

            case 'info': {
                const info = await fetchStopInfo(scannedTourSlug, stopSlug);
                if (info) {
                    setScanStatus({
                        type: 'info',
                        title: info.title?.[language] || info.title?.en || stopSlug,
                        description: info.description?.[language] || info.description?.en || '',
                        image: info.image || undefined,
                        stopSlug,
                    });
                } else {
                    setScanStatus({
                        type: 'info',
                        title: stopTitle,
                        description: '',
                        stopSlug,
                    });
                }
                break;
            }
        }

        stopScanner();
    }

    async function handleShortCodeSubmit() {
        if (!shortCodeInput.trim()) return;
        setShortCodeLoading(true);
        const result = await lookupShortCode(shortCodeInput.trim());
        setShortCodeLoading(false);

        if (result) {
            await handleStopFound(result.tourSlug, result.stopSlug);
        } else {
            setScanStatus({ type: 'error', message: 'Short code not found. Check the code and try again.' });
        }
    }

    function handleDismiss() {
        setScanStatus({ type: 'idle' });
    }

    function handleNavigateFromResult(slug: string) {
        if (tourId) {
            const matchedStop = allStops.find(s => s.slug === slug || s.id === slug);
            if (matchedStop) {
                recordScan(tourId, { stopId: matchedStop.id, stopSlug: slug, stopTitle: getStopTitle(matchedStop) });
            }
        }
        onNavigateToStop?.(slug);
    }

    function getStopTitle(stop: Stop): string {
        const title = typeof stop.title === 'string'
            ? (() => { try { return JSON.parse(stop.title); } catch { return { en: stop.title }; } })()
            : stop.title;
        return title?.[language] || title?.en || stop.slug || stop.id;
    }

    const promptText = data.promptText?.[language] || data.promptText?.en || '';

    return (
        <div className="space-y-4">
            {/* Prompt text */}
            {promptText && (
                <p className="text-sm text-[var(--color-text-secondary)] text-center">
                    {promptText}
                </p>
            )}

            {/* Scanner area */}
            <div className="flex flex-col items-center gap-3">
                {/* Status messages overlay */}
                {scanStatus.type !== 'idle' && scanStatus.type !== 'scanning' && scanStatus.type !== 'requesting' && (
                    <div className={`w-full max-w-sm rounded-xl p-4 text-center space-y-3 ${
                        scanStatus.type === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                        scanStatus.type === 'wrong' ? 'bg-orange-500/10 border border-orange-500/30' :
                        scanStatus.type === 'error' ? 'bg-red-500/10 border border-red-500/30' :
                        'bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)]'
                    }`}>
                        {scanStatus.type === 'success' && (
                            <>
                                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                                <p className="text-sm font-medium text-green-400">{scanStatus.message}</p>
                                {scanStatus.stopSlug && data.mode === 'navigate' && (
                                    <button
                                        onClick={() => handleNavigateFromResult(scanStatus.stopSlug!)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
                                    >
                                        Go to Stop <ArrowRight className="w-4 h-4" />
                                    </button>
                                )}
                            </>
                        )}
                        {scanStatus.type === 'wrong' && (
                            <>
                                <XCircle className="w-10 h-10 text-orange-500 mx-auto" />
                                <p className="text-sm font-medium text-orange-400">{scanStatus.message}</p>
                            </>
                        )}
                        {scanStatus.type === 'error' && (
                            <>
                                <XCircle className="w-10 h-10 text-red-500 mx-auto" />
                                <p className="text-sm text-red-400">{scanStatus.message}</p>
                            </>
                        )}
                        {scanStatus.type === 'info' && (
                            <div className="text-left space-y-2">
                                {scanStatus.image && (
                                    <img src={scanStatus.image} alt="" className="w-full h-32 object-cover rounded-lg" />
                                )}
                                <h4 className="font-medium text-[var(--color-text-primary)]">{scanStatus.title}</h4>
                                {scanStatus.description && (
                                    <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">{scanStatus.description}</p>
                                )}
                                {scanStatus.stopSlug && (
                                    <button
                                        onClick={() => handleNavigateFromResult(scanStatus.stopSlug!)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Visit this stop <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            onClick={handleDismiss}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <RotateCcw className="w-3 h-3" /> Scan Again
                        </button>
                    </div>
                )}

                {/* Camera viewfinder — single persistent video element to avoid React unmount issues */}
                {(scanStatus.type === 'idle' || scanStatus.type === 'scanning' || scanStatus.type === 'requesting') && (
                    <div className={`relative overflow-hidden ${sizeClasses[scannerSize]} ${roundingClasses[viewfinderStyle]}`}>
                        {/* Video element — NEVER use display:none (hidden class) as qr-scanner
                            fights React for control and Safari stops playback on hidden videos.
                            The overlay button covers it when camera is inactive. */}
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            style={{ background: '#000' }}
                            playsInline
                            muted
                            autoPlay
                        />

                        {/* Tap-to-scan overlay (shown when camera is not active) */}
                        {!cameraActive && (
                            <button
                                onClick={startScanner}
                                disabled={scanStatus.type === 'requesting'}
                                className={`absolute inset-0 ${sizeClasses[scannerSize]} bg-gray-900 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors border-2 border-dashed border-gray-700 disabled:opacity-70 ${roundingClasses[viewfinderStyle]}`}
                            >
                                {scanStatus.type === 'requesting' ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-[var(--color-accent-primary)] animate-spin" />
                                        <span className="text-sm text-gray-400">Requesting camera...</span>
                                    </>
                                ) : cameraError ? (
                                    <>
                                        <CameraOff className="w-10 h-10 text-red-400" />
                                        <span className="text-xs text-red-400 text-center px-4">{cameraError}</span>
                                        <span className="text-xs text-gray-500 mt-1">Tap to try again</span>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="w-10 h-10 text-[var(--color-accent-primary)]" />
                                        <span className="text-sm text-gray-400">Tap to scan QR code</span>
                                    </>
                                )}
                            </button>
                        )}

                        {/* Viewfinder overlay corners (shown when camera is active) */}
                        {cameraActive && viewfinderStyle !== 'minimal' && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[var(--color-accent-primary)]" />
                                <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[var(--color-accent-primary)]" />
                                <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[var(--color-accent-primary)]" />
                                <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[var(--color-accent-primary)]" />
                            </div>
                        )}

                        {/* Stop button (shown when camera is active) */}
                        {cameraActive && (
                            <button
                                onClick={stopScanner}
                                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors z-10"
                            >
                                <X className="w-4 h-4 text-white" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Short code entry */}
            {(data.showShortCodeEntry !== false) && (
                <div className="flex flex-col items-center gap-2">
                    {showShortCode ? (
                        <div className="flex gap-2 w-full max-w-xs">
                            <input
                                type="text"
                                value={shortCodeInput}
                                onChange={(e) => setShortCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                                onKeyDown={(e) => e.key === 'Enter' && handleShortCodeSubmit()}
                                placeholder="ABC123"
                                maxLength={6}
                                className="flex-1 px-3 py-2 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm font-mono uppercase text-center tracking-widest focus:border-[var(--color-accent-primary)] focus:outline-none"
                                autoFocus
                            />
                            <button
                                onClick={handleShortCodeSubmit}
                                disabled={shortCodeInput.length < 6 || shortCodeLoading}
                                className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
                            >
                                {shortCodeLoading ? '...' : 'Go'}
                            </button>
                            <button
                                onClick={() => { setShowShortCode(false); setShortCodeInput(''); }}
                                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowShortCode(true)}
                            className="inline-flex items-center gap-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        >
                            <Keyboard className="w-3.5 h-3.5" />
                            Enter code manually
                        </button>
                    )}
                </div>
            )}

            {/* Scan history */}
            {data.showScanHistory && tourId && allStops.length > 0 && (
                <div className="bg-[var(--color-bg-elevated)] rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {data.mode === 'scavenger' ? 'Scavenger Hunt Progress' : 'Visited Stops'}
                        </h4>
                        <span className="text-xs text-[var(--color-accent-primary)] font-medium">
                            {scanCount} / {allStops.length}
                        </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[var(--color-bg-surface)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-accent-primary)] rounded-full transition-all duration-500"
                            style={{ width: `${allStops.length > 0 ? (scanCount / allStops.length) * 100 : 0}%` }}
                        />
                    </div>
                    {/* Stop list */}
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                        {allStops.map((stop) => {
                            const visited = isStopScanned(tourId, stop.id);
                            const title = getStopTitle(stop);
                            return (
                                <div key={stop.id} className="flex items-center gap-2 py-1">
                                    {visited ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-[var(--color-border-default)] shrink-0" />
                                    )}
                                    <span className={`text-xs ${visited ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}`}>
                                        {title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Mode indicator badge */}
            <div className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-default)] rounded-full text-xs text-[var(--color-text-muted)]">
                    <ScanLine className="w-3 h-3" />
                    {data.mode === 'navigate' && 'Navigation Scanner'}
                    {data.mode === 'checkin' && 'Check-in Scanner'}
                    {data.mode === 'scavenger' && 'Scavenger Hunt'}
                    {data.mode === 'info' && 'Info Scanner'}
                </span>
            </div>
        </div>
    );
}
