import { Maximize2, Map as MapIcon, MapPin } from 'lucide-react';
import type { MapBlockData } from '../../types';

interface MapBlockEditorProps {
  data: MapBlockData;
  language: string;
  availableLanguages?: string[];
  onChange: (data: MapBlockData) => void;
  onOpenFullEditor: () => void;
}

export function MapBlockEditor({ data, language: _language, onChange: _onChange, onOpenFullEditor }: MapBlockEditorProps) {
  void _language; // Reserved for multilingual marker titles
  void _onChange; // Changes handled in full editor modal
  const hasLocation = data.latitude && data.longitude && !isNaN(data.latitude) && !isNaN(data.longitude);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] rounded-xl p-6 border border-[var(--color-border-default)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
            <MapIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-[var(--color-text-primary)]">Map Block</h4>
            <p className="text-sm text-[var(--color-text-muted)]">
              {hasLocation ? (
                <>
                  <MapPin className="w-3 h-3 inline mr-1" />
                  {data.latitude?.toFixed(6)}, {data.longitude?.toFixed(6)}
                </>
              ) : (
                'No location set'
              )}
            </p>
          </div>
        </div>

        {/* Quick Preview */}
        {hasLocation && (
          <div className="mb-4 rounded-lg overflow-hidden border border-[var(--color-border-default)] bg-gradient-to-br from-emerald-900/20 to-teal-900/20 h-32 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
              <p className="text-xs text-[var(--color-text-muted)]">
                {data.latitude?.toFixed(4)}, {data.longitude?.toFixed(4)}
              </p>
              <p className="text-xs text-emerald-400/70">Click to edit in full map</p>
            </div>
          </div>
        )}

        {/* Settings Summary */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            {data.provider === 'google' ? 'Google Maps' : 'OpenStreetMap'}
          </span>
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            {data.style || 'Standard'} style
          </span>
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            Zoom: {data.zoom || 15}
          </span>
          {data.showTriggerZone && data.triggerRadius && (
            <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300">
              Trigger: {data.triggerRadius}m
            </span>
          )}
        </div>

        <button
          onClick={onOpenFullEditor}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:scale-[1.02] transition-all"
        >
          <Maximize2 className="w-5 h-5" />
          Open Map Editor
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] text-center">
        Use the full-screen editor to set location, adjust zoom, and configure trigger zones
      </p>
    </div>
  );
}
