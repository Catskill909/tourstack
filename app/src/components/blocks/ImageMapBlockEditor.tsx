import { useState } from 'react';
import { Upload, Layers, MapPin, Maximize2 } from 'lucide-react';
import { BlockMetadataEditor } from './BlockMetadataEditor';
import type { ImageMapBlockData, Stop } from '../../types';

interface ImageMapBlockEditorProps {
    data: ImageMapBlockData;
    language: string;
    availableLanguages?: string[];
    allStops?: Stop[];
    onChange: (data: ImageMapBlockData) => void;
    onOpenFullEditor?: () => void;
}

export function ImageMapBlockEditor({
    data,
    language,
    availableLanguages = ['en'],
    onChange,
    onOpenFullEditor,
}: ImageMapBlockEditorProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const markerCount = data.markers?.length || 0;
    const floorCount = data.floors?.length || (data.imageUrl ? 1 : 0);
    const linkedCount = (data.markers || []).filter(m => m.stopId).length;
    const infoCount = (data.markers || []).filter(m => m.infoText?.[language] || m.infoText?.en).length;

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onChange({ ...data, imageUrl: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            onChange({ ...data, imageUrl: event.target?.result as string });
        };
        reader.readAsDataURL(file);
    }

    return (
        <div className="space-y-4">
            <BlockMetadataEditor
                title={data.title}
                showTitle={data.showTitle}
                blockImage={data.blockImage}
                showBlockImage={data.showBlockImage}
                language={language}
                availableLanguages={availableLanguages}
                onChange={(metadata) => onChange({ ...data, ...metadata })}
            />

            {data.imageUrl ? (
                /* Summary card with thumbnail + stats */
                <div className="border border-[var(--color-border-default)] rounded-xl overflow-hidden bg-[var(--color-bg-elevated)]">
                    {/* Thumbnail preview */}
                    <div className="relative h-40 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                        <img
                            src={data.imageUrl}
                            alt="Floor plan preview"
                            className="w-full h-full object-contain"
                        />
                        {/* Marker count badge */}
                        {markerCount > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                                <MapPin className="w-3 h-3" />
                                {markerCount}
                            </div>
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="px-4 py-3 flex items-center gap-4 text-xs text-[var(--color-text-muted)]">
                        <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />
                            {floorCount} floor{floorCount !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {markerCount} marker{markerCount !== 1 ? 's' : ''}
                        </span>
                        {linkedCount > 0 && (
                            <span>{linkedCount} linked</span>
                        )}
                        {infoCount > 0 && (
                            <span>{infoCount} with info</span>
                        )}
                    </div>

                    {/* Open full editor button */}
                    {onOpenFullEditor && (
                        <div className="px-4 pb-3">
                            <button
                                onClick={onOpenFullEditor}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-blue-600 text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
                            >
                                <Maximize2 className="w-4 h-4" />
                                Open Image Map Editor
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                /* Upload area */
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragOver ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/5' : 'border-[var(--color-border-default)]'}`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-secondary)] mb-1">Upload a floor plan or custom map</p>
                    <p className="text-xs text-[var(--color-text-muted)] mb-3">Drag & drop or click to browse. JPG, PNG, WebP.</p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-lg cursor-pointer hover:opacity-90 text-sm">
                        <Upload className="w-4 h-4" />
                        Choose File
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>
            )}
        </div>
    );
}
