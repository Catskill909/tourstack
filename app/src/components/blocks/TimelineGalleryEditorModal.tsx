import { useState, useEffect } from 'react';
import { X, Music, Images, Clock, Sliders, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveform } from './AudioWaveform';
import type { TimelineGalleryBlockData, TransitionType } from '../../types';

interface TimelineGalleryImage {
    id: string;
    url: string;
    alt: { [lang: string]: string };
    caption: { [lang: string]: string };
    credit?: { [lang: string]: string };
    timestamp: number;
}

interface TimelineGalleryEditorModalProps {
    data: TimelineGalleryBlockData;
    language: string;
    onChange: (data: TimelineGalleryBlockData) => void;
    onClose: () => void;
}

function generateId(): string {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TimelineGalleryEditorModal({ data, language, onChange, onClose }: TimelineGalleryEditorModalProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [editingImage, setEditingImage] = useState<TimelineGalleryImage | null>(null);

    const audioDuration = data.audioDuration || 0;

    // Normalize images and CLAMP timestamps to audio duration
    const images: TimelineGalleryImage[] = (data.images || []).map((img, idx) => ({
        id: img.id || `img_legacy_${idx}`,
        url: img.url,
        alt: img.alt || { [language]: '' },
        caption: img.caption || { [language]: '' },
        credit: img.credit,
        timestamp: Math.min(Math.max(0, img.timestamp || 0), audioDuration || Infinity)
    }));

    // Sort by timestamp for timeline display
    const sortedImages = [...images].sort((a, b) => a.timestamp - b.timestamp);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _transitionType = data.transitionType || 'fade'; // TODO: Use for slide/zoom variants
    void _transitionType; // Suppress unused warning - planned for future transition variants
    const transitionDuration = (data.crossfadeDuration || 500) / 1000; // Convert to seconds for Framer Motion

    // Auto-advance preview based on time
    useEffect(() => {
        if (sortedImages.length === 0) return;
        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if (sortedImages[i].timestamp <= currentTime) {
                const newIndex = images.findIndex(img => img.id === sortedImages[i].id);
                if (newIndex !== previewIndex && newIndex >= 0) {
                    setPreviewIndex(newIndex);
                }
                break;
            }
        }
    }, [currentTime, sortedImages.length]);

    // Auto-clamp existing images when audio duration changes
    useEffect(() => {
        if (audioDuration > 0 && images.some(img => img.timestamp > audioDuration)) {
            onChange({
                ...data,
                images: images.map(img => ({
                    ...img,
                    timestamp: Math.min(img.timestamp, audioDuration)
                }))
            });
        }
    }, [audioDuration]);

    const currentImage = images[previewIndex];

    // Handle audio upload via server API
    async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('audio/')) return;

        try {
            // Upload to server
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();

            // Get audio duration from the uploaded file
            const audio = new Audio(url);
            audio.onloadedmetadata = () => {
                onChange({
                    ...data,
                    audioUrl: url,
                    audioDuration: audio.duration
                });
            };
            audio.onerror = () => {
                // If we can't get duration from URL, use the file directly
                const objectUrl = URL.createObjectURL(file);
                const tempAudio = new Audio(objectUrl);
                tempAudio.onloadedmetadata = () => {
                    onChange({
                        ...data,
                        audioUrl: url,
                        audioDuration: tempAudio.duration
                    });
                    URL.revokeObjectURL(objectUrl);
                };
            };
        } catch (error) {
            console.error('Audio upload failed:', error);
            alert('Failed to upload audio. Please try again.');
        }
    }

    // Handle image upload via server API - distribute timestamps evenly
    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const files = e.target.files;
        if (!files) return;

        const validFiles = Array.from(files).filter(file =>
            file.type.startsWith('image/') && file.size <= 50 * 1024 * 1024 // 50MB limit now
        );

        if (validFiles.length === 0) return;

        const existingCount = images.length;
        const newCount = validFiles.length;
        const totalCount = existingCount + newCount;
        const interval = audioDuration / Math.max(totalCount, 1);

        try {
            const uploadPromises = validFiles.map(async (file, idx) => {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/media/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`Upload failed for ${file.name}`);
                }

                const { url } = await response.json();
                const timestamp = Math.min((existingCount + idx) * interval, audioDuration);

                return {
                    id: generateId(),
                    url,
                    alt: { [language]: file.name.replace(/\.[^/.]+$/, '') },
                    caption: { [language]: '' },
                    credit: { [language]: '' },
                    timestamp
                } as TimelineGalleryImage;
            });

            const newImages = await Promise.all(uploadPromises);
            onChange({
                ...data,
                images: [...images, ...newImages]
            });
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload images. Please try again.');
        }
    }

    // Handle marker move from waveform - clamp to duration
    function handleMarkerMove(id: string, newTimestamp: number) {
        const clampedTimestamp = Math.max(0, Math.min(newTimestamp, audioDuration));
        onChange({
            ...data,
            images: images.map(img =>
                img.id === id ? { ...img, timestamp: clampedTimestamp } : img
            )
        });
    }

    // Handle image delete
    function handleDeleteImage(id: string) {
        onChange({
            ...data,
            images: images.filter(img => img.id !== id)
        });
    }

    // Handle image update (from edit modal)
    function handleUpdateImage(id: string, updates: Partial<TimelineGalleryImage>) {
        onChange({
            ...data,
            images: images.map(img =>
                img.id === id ? { ...img, ...updates } : img
            )
        });
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ backgroundColor: '#0a0a0a' }}
        >
            {/* Header */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111] shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700">
                        <Music className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Timeline Gallery Editor</h2>
                        <p className="text-xs text-gray-400">Sync images to audio narration</p>
                    </div>
                </div>

                {/* Effects Controls - Modular section for future expansion */}
                <div className="flex items-center gap-4">
                    {/* Transition Type */}
                    <div className="flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-gray-400" />
                        <select
                            value={data.transitionType || 'fade'}
                            onChange={(e) => onChange({ ...data, transitionType: e.target.value as TransitionType })}
                            className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:border-purple-500 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="fade">Fade</option>
                            <option value="cut">Cut</option>
                            <option value="slideLeft">Slide Left</option>
                            <option value="slideRight">Slide Right</option>
                            <option value="zoom">Zoom</option>
                        </select>
                    </div>

                    {/* Transition Duration */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Duration</span>
                        <input
                            type="range"
                            min="100"
                            max="1500"
                            step="100"
                            value={data.crossfadeDuration || 500}
                            onChange={(e) => onChange({ ...data, crossfadeDuration: parseInt(e.target.value) })}
                            className="w-20 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-xs text-gray-300 font-mono w-12">
                            {((data.crossfadeDuration || 500) / 1000).toFixed(1)}s
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-white/10" />

                    {/* Image count */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
                        <Images className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">{images.length} images</span>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Done
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                {/* Section 1: Preview Canvas */}
                <div className="h-[55%] p-4 flex items-center justify-center bg-black shrink-0 overflow-hidden">
                    {images.length > 0 && currentImage ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* Animated image with Framer Motion - simultaneous crossfade */}
                            <AnimatePresence initial={false}>
                                <motion.img
                                    key={currentImage.id}
                                    src={currentImage.url}
                                    alt={currentImage.alt[language] || ''}
                                    className="absolute max-w-full max-h-full object-contain rounded-lg"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: transitionDuration, ease: 'easeInOut' }}
                                />
                            </AnimatePresence>

                            {/* Overlay badges */}
                            <div className="absolute inset-0 z-20 pointer-events-none">
                                {/* Timestamp badge */}
                                <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-yellow-500 text-black text-xs font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatTime(currentImage.timestamp)}
                                </div>
                                {/* Counter badge */}
                                <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-xs font-medium">
                                    {previewIndex + 1} / {images.length}
                                </div>
                                {/* Caption */}
                                {currentImage.caption[language] && (
                                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent rounded-b-lg">
                                        <p className="text-white text-sm">{currentImage.caption[language]}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Images className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p>No images added yet</p>
                        </div>
                    )}
                </div>

                {/* Section 2: Waveform Timeline with Thumbnail Markers */}
                <div className="h-[45%] pt-20 px-4 pb-4 bg-[#111] border-t border-white/10 shrink-0 overflow-visible">
                    {data.audioUrl ? (
                        <AudioWaveform
                            audioUrl={data.audioUrl}
                            duration={audioDuration}
                            markers={sortedImages.map(img => ({
                                id: img.id,
                                timestamp: Math.min(img.timestamp, audioDuration),
                                label: img.caption[language] || img.alt[language],
                                thumbnailUrl: img.url
                            }))}
                            onMarkerMove={handleMarkerMove}
                            onMarkerClick={(id) => {
                                const img = images.find(i => i.id === id);
                                if (img) {
                                    setEditingImage(img);
                                }
                            }}
                            onAddImage={() => {
                                // Trigger file input click
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (e) => handleImageUpload(e as unknown as React.ChangeEvent<HTMLInputElement>);
                                input.click();
                            }}
                            onTimeUpdate={(time) => setCurrentTime(time)}
                            onReady={(newDuration) => {
                                if (newDuration !== audioDuration) {
                                    onChange({ ...data, audioDuration: newDuration });
                                }
                            }}
                        />
                    ) : (
                        <label className="flex flex-col items-center justify-center h-full border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                            <div className="p-3 rounded-full bg-purple-500/10 mb-2">
                                <Music className="w-8 h-8 text-purple-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Upload audio narration</span>
                            <span className="text-gray-500 text-xs mt-1">MP3, WAV, M4A</span>
                            <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                        </label>
                    )}
                </div>
            </div>

            {/* Edit Image Modal */}
            {editingImage && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setEditingImage(null)}
                >
                    <div
                        className="bg-[#1a1a1a] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start gap-4 mb-6">
                            <img
                                src={editingImage.url}
                                alt=""
                                className="w-20 h-20 rounded-lg object-cover"
                            />
                            <div>
                                <h3 className="text-lg font-bold text-white">Edit Image</h3>
                                <p className="text-sm text-gray-400">
                                    Appears at {formatTime(editingImage.timestamp)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Caption
                                </label>
                                <textarea
                                    value={editingImage.caption[language] || ''}
                                    onChange={(e) => {
                                        const updated = {
                                            ...editingImage,
                                            caption: { ...editingImage.caption, [language]: e.target.value }
                                        };
                                        setEditingImage(updated);
                                        handleUpdateImage(editingImage.id, { caption: updated.caption });
                                    }}
                                    rows={2}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
                                    placeholder="Describe what's shown in this image..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Alt Text (Accessibility)
                                </label>
                                <input
                                    type="text"
                                    value={editingImage.alt[language] || ''}
                                    onChange={(e) => {
                                        const updated = {
                                            ...editingImage,
                                            alt: { ...editingImage.alt, [language]: e.target.value }
                                        };
                                        setEditingImage(updated);
                                        handleUpdateImage(editingImage.id, { alt: updated.alt });
                                    }}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                    placeholder="Brief description for screen readers..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                    Credit / Attribution
                                </label>
                                <input
                                    type="text"
                                    value={editingImage.credit?.[language] || ''}
                                    onChange={(e) => {
                                        const updated = {
                                            ...editingImage,
                                            credit: { ...editingImage.credit, [language]: e.target.value }
                                        };
                                        setEditingImage(updated);
                                        handleUpdateImage(editingImage.id, { credit: updated.credit });
                                    }}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
                                    placeholder="© Photographer name..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    handleDeleteImage(editingImage.id);
                                    setEditingImage(null);
                                }}
                                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                            <button
                                onClick={() => setEditingImage(null)}
                                className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
