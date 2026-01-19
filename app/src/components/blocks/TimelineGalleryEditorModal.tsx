import { useState, useEffect } from 'react';
import { X, Music, Images, Plus, Trash2, Clock, Pencil, GripVertical } from 'lucide-react';
import { AudioWaveform } from './AudioWaveform';
import type { TimelineGalleryBlockData } from '../../types';

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
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [previewIndex, setPreviewIndex] = useState(0);
    const [editingImage, setEditingImage] = useState<TimelineGalleryImage | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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

    // Auto-advance preview based on time
    useEffect(() => {
        if (sortedImages.length === 0) return;
        for (let i = sortedImages.length - 1; i >= 0; i--) {
            if (sortedImages[i].timestamp <= currentTime) {
                const newIndex = images.findIndex(img => img.id === sortedImages[i].id);
                if (newIndex !== previewIndex) {
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
        if (selectedImageId === id) {
            setSelectedImageId(null);
        }
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

    // Drag and drop reordering
    function handleDragStart(index: number) {
        setDraggedIndex(index);
    }

    function handleDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        // Reorder the images array
        const newImages = [...images];
        const draggedImage = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedImage);

        // Get all existing timestamps and sort them
        const sortedTimestamps = images
            .map(img => img.timestamp)
            .sort((a, b) => a - b);

        // Assign the sorted timestamps to the new image order
        // This preserves your manually set timing "beats" but changes which image is at which beat
        const retimedImages = newImages.map((img, i) => ({
            ...img,
            timestamp: sortedTimestamps[i] || (i * (audioDuration / newImages.length)) // Fallback if something weird happens
        }));

        onChange({ ...data, images: retimedImages });
        setDraggedIndex(index);
    }

    function handleDragEnd() {
        setDraggedIndex(null);
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
                <div className="flex items-center gap-3">
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
                <div className="h-[40%] p-4 flex items-center justify-center bg-black shrink-0">
                    {currentImage ? (
                        <div className="relative max-w-full max-h-full aspect-video">
                            <img
                                src={currentImage.url}
                                alt={currentImage.alt[language] || ''}
                                className="w-full h-full object-contain rounded-lg"
                            />
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
                                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-white text-sm">{currentImage.caption[language]}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Images className="w-16 h-16 mx-auto mb-2 opacity-50" />
                            <p>No images added yet</p>
                        </div>
                    )}
                </div>

                {/* Section 2: Waveform Timeline */}
                <div className="h-[30%] p-4 bg-[#111] border-t border-white/10 shrink-0">
                    {data.audioUrl ? (
                        <AudioWaveform
                            audioUrl={data.audioUrl}
                            duration={audioDuration}
                            markers={images.map(img => ({
                                id: img.id,
                                timestamp: Math.min(img.timestamp, audioDuration),
                                label: img.caption[language] || img.alt[language]
                            }))}
                            onMarkerMove={handleMarkerMove}
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

                {/* Section 3: Image Strip */}
                <div className="h-[30%] p-4 bg-[#0d0d0d] border-t border-white/10 flex flex-col shrink-0">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-gray-300">Timeline Images</h3>
                        <span className="text-xs text-gray-500">Drag to reorder • Tap pencil to edit</span>
                    </div>

                    <div className="flex-1 overflow-x-auto overflow-y-hidden">
                        <div className="flex gap-3 h-full pb-2">
                            {/* Add Image Button */}
                            <label className="shrink-0 w-24 h-full flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all">
                                <Plus className="w-6 h-6 text-gray-400 mb-1" />
                                <span className="text-xs text-gray-500">Add</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* Image Thumbnails */}
                            {sortedImages.map((img, index) => (
                                <div
                                    key={img.id}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => {
                                        setSelectedImageId(img.id);
                                        setPreviewIndex(images.findIndex(i => i.id === img.id));
                                    }}
                                    className={`shrink-0 relative w-24 h-full rounded-xl overflow-hidden cursor-grab transition-all ${selectedImageId === img.id
                                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0d0d0d]'
                                        : 'hover:ring-2 hover:ring-white/30'
                                        } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Drag handle */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity">
                                        <GripVertical className="w-6 h-6 text-white drop-shadow-lg" />
                                    </div>
                                    {/* Timestamp */}
                                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
                                        <span className="text-white text-xs font-mono">
                                            {formatTime(img.timestamp)}
                                        </span>
                                    </div>
                                    {/* Edit button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingImage(img);
                                        }}
                                        className="absolute top-1 left-1 p-1 rounded-full bg-black/60 hover:bg-purple-500 text-white transition-colors"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(img.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-red-500 text-white transition-colors"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                    {/* Index badge */}
                                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-yellow-500 text-black text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
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

                        <button
                            onClick={() => setEditingImage(null)}
                            className="w-full mt-6 px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
