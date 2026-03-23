import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation, Search, Crosshair, Map as MapIcon, Layers, Circle, RotateCcw, Trash2, GripVertical, Link2, Type, Eye, Languages, Loader2, Check as CheckIcon, ChevronUp, Wand2 } from 'lucide-react';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ColorPicker } from '../ui/ColorPicker';
import { PreviewChoiceModal } from '../PreviewChoiceModal';
import { magicTranslate, type TranslationProvider } from '../../services/translationService';
import type { MapBlockData, MapMarker, MapMarkerIcon, MapProvider, MapStyle, Stop, Tour } from '../../types';

// --- Dirty-tracking via source hash (same pattern as ImageMap) ---
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash.toString(36);
}

function stampSourceHash(field: { [lang: string]: string }, primaryLang: string): { [lang: string]: string } {
  const src = field[primaryLang]?.trim();
  if (!src) return field;
  return { ...field, _sourceHash: simpleHash(src) };
}

interface MapEditorModalProps {
  data: MapBlockData;
  language: string;
  availableLanguages?: string[];
  allStops?: Stop[];
  translationProvider?: TranslationProvider;
  /** Current stop for preview */
  stop?: Stop;
  tourData?: Tour;
  onChange: (data: MapBlockData) => void;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any  
type LeafletMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletCircle = any;

const OSM_STYLES: { value: MapStyle; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
];

const GOOGLE_STYLES: { value: MapStyle; label: string }[] = [
  { value: 'standard', label: 'Roadmap' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'hybrid', label: 'Hybrid' },
];

const ICON_OPTIONS: { value: MapMarkerIcon; label: string; icon: string }[] = [
  { value: 'pin', label: 'Pin', icon: '📍' },
  { value: 'dot', label: 'Dot', icon: '⚫' },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'star', label: 'Star', icon: '⭐' },
  { value: 'info', label: 'Info', icon: 'ℹ️' },
  { value: 'accessibility', label: 'Accessible', icon: '♿' },
  { value: 'restroom', label: 'Restroom', icon: '🚻' },
  { value: 'stairs', label: 'Stairs', icon: '🪜' },
  { value: 'elevator', label: 'Elevator', icon: '🛗' },
  { value: 'exit', label: 'Exit', icon: '🚪' },
  { value: 'cafe', label: 'Café', icon: '☕' },
  { value: 'gift-shop', label: 'Gift Shop', icon: '🎁' },
  { value: 'ticket', label: 'Tickets', icon: '🎫' },
  { value: 'camera', label: 'Photo Spot', icon: '📷' },
  { value: 'audio-guide', label: 'Audio Guide', icon: '🎧' },
  { value: 'parking', label: 'Parking', icon: '🅿️' },
];

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // NYC
const DEFAULT_ZOOM = 15;

// Generate marker HTML for Leaflet L.divIcon
function markerIconHtml(marker: MapMarker): string {
  const color = marker.color || '#3b82f6';
  const icon = marker.icon || 'pin';

  if (icon === 'number') {
    return `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">${marker.number || '?'}</div>`;
  }
  if (icon === 'dot') {
    return `<div style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"></div>`;
  }
  if (icon === 'star') {
    return `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"><svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`;
  }
  // Circle-background icons
  const circleIcons: Record<string, string> = {
    info: 'ℹ️', accessibility: '♿', restroom: '🚻', stairs: '🪜', elevator: '🛗',
    exit: '🚪', cafe: '☕', 'gift-shop': '🎁', ticket: '🎫', camera: '📷',
    'audio-guide': '🎧', parking: '🅿️',
  };
  if (circleIcons[icon]) {
    return `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">${circleIcons[icon]}</div>`;
  }
  // Default: pin
  return `<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"><svg width="24" height="32" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div>`;
}

export function MapEditorModal({
  data,
  language,
  availableLanguages = ['en'],
  allStops = [],
  translationProvider = 'libretranslate',
  stop,
  tourData,
  onChange,
  onClose,
}: MapEditorModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const markersLayerRef = useRef<LeafletMarker[]>([]);
  const circleRef = useRef<LeafletCircle | null>(null);
  const routeLineRef = useRef<LeafletMarker | null>(null);

  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  useEffect(() => { dataRef.current = data; onChangeRef.current = onChange; }, [data, onChange]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState<'markers' | 'settings'>('markers');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [editLanguage, setEditLanguage] = useState(language);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateStatus, setTranslateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showBulkTools, setShowBulkTools] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [latInput, setLatInput] = useState(data.latitude?.toString() || '');
  const [lngInput, setLngInput] = useState(data.longitude?.toString() || '');
  const [zoomInput, setZoomInput] = useState(data.zoom?.toString() || DEFAULT_ZOOM.toString());
  const [radiusInput, setRadiusInput] = useState(data.triggerRadius?.toString() || '25');

  const markers = data.markers || [];
  const primaryLang = availableLanguages[0] || 'en';
  const secondaryLangs = availableLanguages.filter(l => l !== primaryLang);

  // Translation stats
  const translationCount = markers.reduce((acc, m) => {
    let total = 0, translated = 0;
    if (m.title?.[primaryLang]) {
      secondaryLangs.forEach(l => { total++; if (m.title?.[l]) translated++; });
    }
    if (m.infoText?.[primaryLang]) {
      secondaryLangs.forEach(l => { total++; if (m.infoText?.[l]) translated++; });
    }
    return { total: acc.total + total, translated: acc.translated + translated };
  }, { total: 0, translated: 0 });

  // --- Marker CRUD ---
  const updateMarker = useCallback((markerId: string, updates: Partial<MapMarker>) => {
    const newMarkers = (dataRef.current.markers || []).map(m =>
      m.id === markerId ? { ...m, ...updates } : m
    );
    onChangeRef.current({ ...dataRef.current, markers: newMarkers });
  }, []);

  const deleteMarker = useCallback((markerId: string) => {
    const newMarkers = (dataRef.current.markers || []).filter(m => m.id !== markerId);
    onChangeRef.current({ ...dataRef.current, markers: newMarkers });
    if (selectedMarkerId === markerId) setSelectedMarkerId(null);
  }, [selectedMarkerId]);

  // --- Leaflet init ---
  useEffect(() => {
    if (!mapRef.current) return;
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        leafletRef.current = L;
        if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        const lat = data.latitude || DEFAULT_CENTER.lat;
        const lng = data.longitude || DEFAULT_CENTER.lng;
        const zoom = data.zoom || DEFAULT_ZOOM;
        const map = L.map(mapRef.current!, { center: [lat, lng], zoom, zoomControl: true });
        updateTileLayer(map, L, data.style || 'standard', data.provider || 'openstreetmap');
        mapInstanceRef.current = map;

        // Click: place new marker
        map.on('click', (e: L.LeafletMouseEvent) => {
          const clickLat = Math.round(e.latlng.lat * 1000000) / 1000000;
          const clickLng = Math.round(e.latlng.lng * 1000000) / 1000000;
          const currentData = dataRef.current;
          const newMarker: MapMarker = {
            id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            latitude: clickLat,
            longitude: clickLng,
            title: { [primaryLang]: '' },
            icon: 'pin',
            color: '#3b82f6',
            number: (currentData.markers || []).length + 1,
          };
          const newMarkers = [...(currentData.markers || []), newMarker];
          onChangeRef.current({
            ...currentData,
            markers: newMarkers,
            latitude: currentData.latitude || clickLat,
            longitude: currentData.longitude || clickLng,
          });
          setSelectedMarkerId(newMarker.id);
        });

        map.on('zoomend', () => {
          const newZoom = map.getZoom();
          setZoomInput(newZoom.toString());
          onChangeRef.current({ ...dataRef.current, zoom: newZoom });
        });

        setIsMapReady(true);
        setTimeout(() => map.invalidateSize(), 100);
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };
    initMap();
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Sync markers to Leaflet ---
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map || !isMapReady) return;

    // Clear previous
    markersLayerRef.current.forEach(m => map.removeLayer(m));
    markersLayerRef.current = [];
    if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }

    const currentMarkers = data.markers || [];
    currentMarkers.forEach((marker) => {
      const icon = L.divIcon({
        html: markerIconHtml(marker),
        className: 'map-custom-marker',
        iconSize: marker.icon === 'dot' ? [16, 16] : marker.icon === 'pin' ? [24, 32] : [28, 28],
        iconAnchor: marker.icon === 'pin' ? [12, 32] : marker.icon === 'dot' ? [8, 8] : [14, 14],
      });
      const leafletMarker = L.marker([marker.latitude, marker.longitude], { draggable: true, icon }).addTo(map);

      const label = marker.title?.[editLanguage] || marker.title?.[primaryLang] || '';
      if (label) {
        leafletMarker.bindTooltip(label, { permanent: data.showLabels, direction: 'top', offset: [0, -10] });
      }

      leafletMarker.on('click', () => setSelectedMarkerId(marker.id));
      leafletMarker.on('dragend', () => {
        const pos = leafletMarker.getLatLng();
        const dragLat = Math.round(pos.lat * 1000000) / 1000000;
        const dragLng = Math.round(pos.lng * 1000000) / 1000000;
        const newMarkers = (dataRef.current.markers || []).map(m =>
          m.id === marker.id ? { ...m, latitude: dragLat, longitude: dragLng } : m
        );
        onChangeRef.current({ ...dataRef.current, markers: newMarkers });
      });

      if (marker.id === selectedMarkerId) leafletMarker.setZIndexOffset(1000);
      markersLayerRef.current.push(leafletMarker);
    });

    // Route lines
    if (data.showRouteLines && currentMarkers.length >= 2) {
      const latlngs = currentMarkers.map(m => [m.latitude, m.longitude] as [number, number]);
      routeLineRef.current = L.polyline(latlngs, { color: '#8b5cf6', weight: 3, opacity: 0.6, dashArray: '8, 8' }).addTo(map);
    }

    // Trigger zone
    if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    if (data.showTriggerZone && data.triggerRadius && data.latitude && data.longitude) {
      circleRef.current = L.circle([data.latitude, data.longitude], {
        radius: data.triggerRadius, color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.15, weight: 2,
      }).addTo(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.markers, data.showLabels, data.showRouteLines, data.showTriggerZone, data.triggerRadius, data.latitude, data.longitude, selectedMarkerId, editLanguage, isMapReady]);

  // --- Tile layer ---
  function updateTileLayer(map: LeafletMap, L: typeof import('leaflet'), style: MapStyle, provider: MapProvider = 'openstreetmap') {
    map.eachLayer((layer: { _url?: string }) => { if (layer._url) map.removeLayer(layer); });
    if (provider === 'google') {
      const subdomains = 'mt0 mt1 mt2 mt3'.split(' ');
      const urls: Record<string, string> = {
        satellite: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        hybrid: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        terrain: 'https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
        standard: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      };
      L.tileLayer(urls[style] || urls.standard, { attribution: '© Google', subdomains }).addTo(map);
    } else {
      const tiles: Record<string, { url: string; attr: string }> = {
        standard: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
        satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: '© Esri' },
        terrain: { url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: '© OpenTopoMap' },
      };
      const t = tiles[style] || tiles.standard;
      L.tileLayer(t.url, { attribution: t.attr }).addTo(map);
    }
  }

  // --- Actions ---
  function handleStyleChange(style: MapStyle) {
    const L = leafletRef.current; const map = mapInstanceRef.current;
    if (L && map) updateTileLayer(map, L, style, data.provider || 'openstreetmap');
    onChange({ ...data, style });
  }

  function handleProviderChange(provider: MapProvider) {
    const style = data.style || (provider === 'google' ? 'satellite' : 'standard');
    onChange({ ...data, provider, style });
    const L = leafletRef.current; const map = mapInstanceRef.current;
    if (L && map) updateTileLayer(map, L, style, provider);
  }

  function handleZoomChange(newZoom: number) {
    setZoomInput(newZoom.toString());
    if (mapInstanceRef.current) mapInstanceRef.current.setZoom(newZoom);
    onChange({ ...data, zoom: newZoom });
  }

  function handleRadiusChange(newRadius: number) {
    setRadiusInput(newRadius.toString());
    onChange({ ...data, triggerRadius: newRadius });
  }

  function handleToggleTriggerZone() {
    onChange({ ...data, showTriggerZone: !data.showTriggerZone });
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSearchError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'TourStack/1.0' } }
      );
      const results = await response.json();
      if (results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        onChange({ ...data, latitude: lat, longitude: lng, zoom: 17 });
        setLatInput(lat.toString()); setLngInput(lng.toString()); setZoomInput('17');
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], 17);
      } else { setSearchError('Location not found'); }
    } catch { setSearchError('Search failed. Please try again.'); }
    finally { setIsSearching(false); }
  }

  async function handleGetCurrentLocation() {
    if (!navigator.geolocation) { setSearchError('Geolocation not supported'); return; }
    setIsGettingLocation(true); setSearchError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude, lng = position.coords.longitude;
        onChange({ ...data, latitude: lat, longitude: lng });
        setLatInput(lat.toString()); setLngInput(lng.toString());
        if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], data.zoom);
        setIsGettingLocation(false);
      },
      () => { setSearchError('Could not get location. Please check permissions.'); setIsGettingLocation(false); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function handleCoordsSubmit() {
    const lat = parseFloat(latInput), lng = parseFloat(lngInput);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return;
    onChange({ ...data, latitude: lat, longitude: lng });
    if (mapInstanceRef.current) mapInstanceRef.current.setView([lat, lng], data.zoom);
  }

  function handleFitBounds() {
    const map = mapInstanceRef.current; const L = leafletRef.current;
    if (!map || !L || !markers.length) return;
    const bounds = L.latLngBounds(markers.map(m => [m.latitude, m.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }

  function handleReset() {
    if (mapInstanceRef.current) mapInstanceRef.current.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
    setLatInput(''); setLngInput(''); setZoomInput(DEFAULT_ZOOM.toString());
    onChange({ ...data, latitude: 0, longitude: 0, zoom: DEFAULT_ZOOM, showMarker: false, markers: [] });
    setSelectedMarkerId(null);
  }

  // --- Translation ---
  async function handleTranslateAll() {
    if (secondaryLangs.length === 0 || isTranslating) return;
    setIsTranslating(true); setTranslateStatus('idle');
    try {
      const currentMarkers = [...(data.markers || [])];
      for (const marker of currentMarkers) {
        if (marker.title?.[primaryLang]?.trim()) {
          const translations = await magicTranslate(marker.title[primaryLang], primaryLang, secondaryLangs, undefined, translationProvider);
          marker.title = stampSourceHash({ ...marker.title, ...translations }, primaryLang);
        }
        if (marker.infoText?.[primaryLang]?.trim()) {
          const translations = await magicTranslate(marker.infoText[primaryLang], primaryLang, secondaryLangs, undefined, translationProvider);
          marker.infoText = stampSourceHash({ ...marker.infoText, ...translations }, primaryLang);
        }
      }
      onChange({ ...data, markers: currentMarkers });
      setTranslateStatus('success');
      setTimeout(() => setTranslateStatus('idle'), 3000);
    } catch { setTranslateStatus('error'); setTimeout(() => setTranslateStatus('idle'), 3000); }
    finally { setIsTranslating(false); }
  }

  // --- Bulk ---
  function handleBulkIcon(icon: MapMarkerIcon) { onChange({ ...data, markers: markers.map(m => ({ ...m, icon })) }); }
  function handleBulkColor(color: string) { onChange({ ...data, markers: markers.map(m => ({ ...m, color })) }); }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <MapIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Map Editor</h2>
            <p className="text-xs text-gray-400">
              {markers.length} marker{markers.length !== 1 ? 's' : ''}
              {translationCount.total > 0 && ` · ${translationCount.translated}/${translationCount.total} translated`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {availableLanguages.length > 1 && (
            <LanguageSwitcher availableLanguages={availableLanguages} activeLanguage={editLanguage} onChange={setEditLanguage} size="sm" />
          )}
          {secondaryLangs.length > 0 && markers.length > 0 && (
            <button
              onClick={handleTranslateAll}
              disabled={isTranslating}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${translateStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' : translateStatus === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-white/10 hover:bg-white/15 text-gray-300'}`}
            >
              {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : translateStatus === 'success' ? <CheckIcon className="w-4 h-4" /> : <Languages className="w-4 h-4" />}
              {isTranslating ? 'Translating...' : translateStatus === 'success' ? 'Done' : 'Translate All'}
            </button>
          )}
          {stop && tourData && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/10 hover:bg-white/15 text-gray-300 transition-colors"
            >
              <Eye className="w-4 h-4" />Preview
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors">Save & Close</button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Main */}
      <div className="flex-1 flex min-h-0">
        {/* Map Canvas */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          {/* Provider & Style overlay */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg p-1 shadow-lg">
              <button onClick={() => handleProviderChange('openstreetmap')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${data.provider === 'openstreetmap' || !data.provider ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>OpenStreetMap</button>
              <button onClick={() => handleProviderChange('google')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${data.provider === 'google' ? 'bg-emerald-500 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'}`}>Google Maps</button>
            </div>
            <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg">
              <Layers className="w-4 h-4 text-gray-300" />
              <select value={data.style || 'standard'} onChange={(e) => handleStyleChange(e.target.value as MapStyle)} className="bg-transparent text-white text-sm py-1.5 focus:outline-none appearance-none cursor-pointer pr-1">
                {(data.provider === 'google' ? GOOGLE_STYLES : OSM_STYLES).map((s) => (
                  <option key={s.value} value={s.value} className="bg-gray-900 text-white">{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Hint */}
          {isMapReady && markers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 bg-black/70 px-4 py-3 rounded-xl">
                <Crosshair className="w-8 h-8 text-emerald-400" />
                <span className="text-sm text-white">Click map to place markers</span>
              </div>
            </div>
          )}
          {/* Fit bounds */}
          {markers.length >= 2 && (
            <button onClick={handleFitBounds} className="absolute bottom-4 left-4 z-[1000] px-3 py-2 bg-black/70 backdrop-blur-sm text-white text-sm rounded-lg hover:bg-black/80 transition-colors shadow-lg">
              <Eye className="w-4 h-4 inline mr-1.5" />Fit All Markers
            </button>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-[#111] border-l border-white/10 flex flex-col min-h-0">
          <div className="flex border-b border-white/10 shrink-0">
            <button onClick={() => setActiveTab('markers')} className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'markers' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}>
              <MapPin className="w-4 h-4 inline mr-1.5" />Markers ({markers.length})
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-gray-400 hover:text-gray-200'}`}>
              <Layers className="w-4 h-4 inline mr-1.5" />Settings
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'markers' ? (
              <MarkersTab markers={markers} selectedMarkerId={selectedMarkerId} editLanguage={editLanguage} primaryLang={primaryLang} availableLanguages={availableLanguages} allStops={allStops} showBulkTools={showBulkTools} setShowBulkTools={setShowBulkTools} onSelect={setSelectedMarkerId} onUpdate={updateMarker} onDelete={deleteMarker} onBulkIcon={handleBulkIcon} onBulkColor={handleBulkColor} />
            ) : (
              <SettingsTab data={data} latInput={latInput} lngInput={lngInput} zoomInput={zoomInput} radiusInput={radiusInput} searchQuery={searchQuery} isSearching={isSearching} searchError={searchError} isGettingLocation={isGettingLocation} setLatInput={setLatInput} setLngInput={setLngInput} setSearchQuery={setSearchQuery} onSearch={handleSearch} onGetLocation={handleGetCurrentLocation} onCoordsSubmit={handleCoordsSubmit} onZoomChange={handleZoomChange} onRadiusChange={handleRadiusChange} onToggleTriggerZone={handleToggleTriggerZone} onReset={handleReset} onChange={onChange} />
            )}
          </div>
        </div>
      </div>
      {/* Preview Choice Modal — portal to document.body to escape Leaflet z-index stacking context */}
      {showPreview && stop && tourData && (() => {
        // Build a preview stop with the current (possibly unsaved) map block data
        const previewStop = {
          ...stop,
          contentBlocks: (stop.contentBlocks || []).map((b: { type: string; data: unknown }) =>
            b.type === 'map' ? { ...b, data } : b
          ),
        };
        return createPortal(
          <PreviewChoiceModal
            isOpen={showPreview}
            tour={tourData}
            stops={allStops}
            initialStop={previewStop}
            availableLanguages={availableLanguages}
            onClose={() => setShowPreview(false)}
          />,
          document.body
        );
      })()}
    </div>
  );
}

// ==========================================================
// Markers Tab
// ==========================================================
function MarkersTab({ markers, selectedMarkerId, editLanguage, primaryLang, availableLanguages, allStops, showBulkTools, setShowBulkTools, onSelect, onUpdate, onDelete, onBulkIcon, onBulkColor }: {
  markers: MapMarker[]; selectedMarkerId: string | null; editLanguage: string; primaryLang: string; availableLanguages: string[]; allStops: Stop[];
  showBulkTools: boolean; setShowBulkTools: (v: boolean) => void;
  onSelect: (id: string | null) => void; onUpdate: (id: string, u: Partial<MapMarker>) => void; onDelete: (id: string) => void;
  onBulkIcon: (icon: MapMarkerIcon) => void; onBulkColor: (color: string) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the inline editor when a marker is selected
  useEffect(() => {
    if (selectedMarkerId && editorRef.current) {
      editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedMarkerId]);

  return (
    <div className="space-y-4">
      {/* Bulk tools */}
      {markers.length >= 2 && (
        <button onClick={() => setShowBulkTools(!showBulkTools)} className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-200 bg-white/5 rounded-lg transition-colors">
          <span><Wand2 className="w-3.5 h-3.5 inline mr-1" />Apply to all markers</span>
          <ChevronUp className={`w-4 h-4 transition-transform ${showBulkTools ? '' : 'rotate-180'}`} />
        </button>
      )}
      {showBulkTools && markers.length >= 2 && (
        <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Set all icons</label>
            <div className="flex flex-wrap gap-1">
              {ICON_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => onBulkIcon(opt.value)} className="px-2 py-1 text-xs bg-white/5 hover:bg-white/15 rounded text-gray-300 transition-colors" title={opt.label}>{opt.icon}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Set all colors</label>
            <ColorPicker value="#3b82f6" onChange={onBulkColor} size="sm" />
          </div>
        </div>
      )}

      {/* Marker list with inline editing */}
      <div className="space-y-1">
        {markers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No markers yet</p>
            <p className="text-xs mt-1">Click on the map to place markers</p>
          </div>
        )}
        {markers.map((marker, idx) => {
          const isSelected = marker.id === selectedMarkerId;
          return (
            <div key={marker.id}>
              <button onClick={() => onSelect(isSelected ? null : marker.id)} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${isSelected ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'}`}>
                <GripVertical className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: marker.color || '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{marker.title?.[editLanguage] || marker.title?.[primaryLang] || `Marker ${idx + 1}`}</p>
                  <p className="text-[10px] text-gray-500">
                    {marker.latitude.toFixed(4)}, {marker.longitude.toFixed(4)}
                    {marker.stopId && <span className="ml-1 text-emerald-400">· Linked</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400">{ICON_OPTIONS.find(o => o.value === (marker.icon || 'pin'))?.icon || '📍'}</span>
              </button>
              {/* Inline editor expands below the selected marker */}
              {isSelected && (
                <div ref={editorRef} className="mt-1 mb-2">
                  <MarkerEditor marker={marker} editLanguage={editLanguage} primaryLang={primaryLang} availableLanguages={availableLanguages} allStops={allStops} onUpdate={onUpdate} onDelete={onDelete} onDeselect={() => onSelect(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==========================================================
// Marker Editor Panel
// ==========================================================
function MarkerEditor({ marker, editLanguage, primaryLang, availableLanguages, allStops, onUpdate, onDelete, onDeselect }: {
  marker: MapMarker; editLanguage: string; primaryLang: string; availableLanguages: string[]; allStops: Stop[];
  onUpdate: (id: string, u: Partial<MapMarker>) => void; onDelete: (id: string) => void; onDeselect: () => void;
}) {
  void availableLanguages; // reserved for future per-field status
  return (
    <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: marker.color || '#3b82f6' }} />
          Edit Marker
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={onDeselect} className="p-1 hover:bg-white/10 rounded text-gray-400" title="Close"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={() => onDelete(marker.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400" title="Delete marker"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
      {/* Label */}
      <div>
        <label className="block text-xs text-gray-500 mb-1"><Type className="w-3 h-3 inline mr-0.5" /> Label ({editLanguage.toUpperCase()})</label>
        <input type="text" value={marker.title?.[editLanguage] || ''} onChange={(e) => onUpdate(marker.id, { title: { ...marker.title, [editLanguage]: e.target.value } })} placeholder="e.g., Main Entrance" className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm" />
      </div>
      {/* Icon */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Icon</label>
        <div className="flex flex-wrap gap-1">
          {ICON_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => onUpdate(marker.id, { icon: opt.value })} className={`px-2 py-1 text-xs rounded transition-colors ${(marker.icon || 'pin') === opt.value ? 'bg-emerald-500 text-white' : 'bg-white/5 hover:bg-white/15 text-gray-300'}`} title={opt.label}>{opt.icon}</button>
          ))}
        </div>
      </div>
      {/* Number */}
      {marker.icon === 'number' && (
        <div>
          <label className="block text-xs text-gray-500 mb-1"># Number</label>
          <input type="number" value={marker.number || ''} onChange={(e) => onUpdate(marker.id, { number: parseInt(e.target.value) || undefined })} className="w-20 px-2.5 py-1.5 bg-black/50 border border-white/20 rounded-lg text-white focus:border-emerald-500 focus:outline-none text-sm" />
        </div>
      )}
      {/* Color */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Color</label>
        <ColorPicker value={marker.color || '#3b82f6'} onChange={(c) => onUpdate(marker.id, { color: c })} size="sm" />
      </div>
      {/* Stop Link */}
      <div>
        <label className="block text-xs text-gray-500 mb-1"><Link2 className="w-3 h-3 inline mr-0.5" /> Link to Stop</label>
        <select value={marker.stopId || ''} onChange={(e) => onUpdate(marker.id, { stopId: e.target.value || undefined })} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 rounded-lg text-white focus:border-emerald-500 focus:outline-none text-sm">
          <option value="" className="bg-gray-900">None (info popup only)</option>
          {allStops.map(stop => (
            <option key={stop.id} value={stop.id} className="bg-gray-900">{stop.title?.[editLanguage] || stop.title?.[primaryLang] || stop.title?.en || `Stop ${stop.id}`}</option>
          ))}
        </select>
      </div>
      {/* Info Text */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Info Description ({editLanguage.toUpperCase()})</label>
        <textarea value={marker.infoText?.[editLanguage] || ''} onChange={(e) => onUpdate(marker.id, { infoText: { ...marker.infoText, [editLanguage]: e.target.value } })} placeholder="Shown in popup when visitor taps marker" rows={3} className="w-full px-2.5 py-1.5 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm resize-none" />
      </div>
      {/* Coords */}
      <div className="flex gap-2 text-xs text-gray-500">
        <span>Lat: {marker.latitude.toFixed(6)}</span>
        <span>Lng: {marker.longitude.toFixed(6)}</span>
      </div>
    </div>
  );
}

// ==========================================================
// Settings Tab
// ==========================================================
function SettingsTab({ data, latInput, lngInput, zoomInput, radiusInput, searchQuery, isSearching, searchError, isGettingLocation, setLatInput, setLngInput, setSearchQuery, onSearch, onGetLocation, onCoordsSubmit, onZoomChange, onRadiusChange, onToggleTriggerZone, onReset, onChange }: {
  data: MapBlockData; latInput: string; lngInput: string; zoomInput: string; radiusInput: string;
  searchQuery: string; isSearching: boolean; searchError: string | null; isGettingLocation: boolean;
  setLatInput: (v: string) => void; setLngInput: (v: string) => void; setSearchQuery: (v: string) => void;
  onSearch: () => void; onGetLocation: () => void; onCoordsSubmit: () => void;
  onZoomChange: (z: number) => void; onRadiusChange: (r: number) => void; onToggleTriggerZone: () => void;
  onReset: () => void; onChange: (d: MapBlockData) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2"><Search className="w-4 h-4 inline mr-1" /> Search Address</label>
        <div className="flex gap-2">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()} placeholder="Search for a place..." className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm" />
          <button onClick={onSearch} disabled={isSearching} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors">{isSearching ? '...' : <Search className="w-4 h-4" />}</button>
        </div>
        {searchError && <p className="text-xs text-red-400 mt-1">{searchError}</p>}
      </div>
      {/* Current Location */}
      <button onClick={onGetLocation} disabled={isGettingLocation} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors disabled:opacity-50">
        <Navigation className="w-4 h-4" />{isGettingLocation ? 'Getting location...' : 'Use Current Location'}
      </button>
      {/* Coordinates */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2"><MapPin className="w-4 h-4 inline mr-1" /> Map Center</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div><label className="block text-xs text-gray-500 mb-1">Latitude</label><input type="text" value={latInput} onChange={(e) => setLatInput(e.target.value)} onBlur={onCoordsSubmit} placeholder="-90 to 90" className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm font-mono" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">Longitude</label><input type="text" value={lngInput} onChange={(e) => setLngInput(e.target.value)} onBlur={onCoordsSubmit} placeholder="-180 to 180" className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm font-mono" /></div>
        </div>
        <button onClick={onCoordsSubmit} className="w-full px-3 py-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors">Go to Coordinates</button>
      </div>
      {/* Zoom */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Zoom Level: {zoomInput}</label>
        <input type="range" min="1" max="20" value={parseInt(zoomInput) || DEFAULT_ZOOM} onChange={(e) => onZoomChange(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
        <div className="flex justify-between text-xs text-gray-500 mt-1"><span>World</span><span>Street</span></div>
      </div>
      {/* Trigger Zone */}
      <div className="p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-300"><Circle className="w-4 h-4" /> Trigger Zone</label>
          <button onClick={onToggleTriggerZone} className={`relative w-10 h-6 rounded-full transition-colors ${data.showTriggerZone ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.showTriggerZone ? 'left-5' : 'left-1'}`} /></button>
        </div>
        {data.showTriggerZone && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Radius: {radiusInput}m</label>
            <input type="range" min="5" max="200" value={parseInt(radiusInput) || 25} onChange={(e) => onRadiusChange(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            <div className="flex justify-between text-xs text-gray-500 mt-1"><span>5m</span><span>200m</span></div>
          </div>
        )}
      </div>
      {/* Display Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Display Size</label>
        <div className="grid grid-cols-3 gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button key={size} onClick={() => onChange({ ...data, size })} className={`px-3 py-2 text-sm rounded-lg border transition-colors ${(data.size || 'medium') === size ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'}`}>{size.charAt(0).toUpperCase() + size.slice(1)}</button>
          ))}
        </div>
      </div>
      {/* Display Toggles */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">Display Options</label>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Show Labels</span>
          <button onClick={() => onChange({ ...data, showLabels: !data.showLabels })} className={`relative w-10 h-6 rounded-full transition-colors ${data.showLabels ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.showLabels ? 'left-5' : 'left-1'}`} /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Show Legend</span>
          <button onClick={() => onChange({ ...data, showLegend: !data.showLegend })} className={`relative w-10 h-6 rounded-full transition-colors ${data.showLegend ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.showLegend ? 'left-5' : 'left-1'}`} /></button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Route Lines</span>
          <button onClick={() => onChange({ ...data, showRouteLines: !data.showRouteLines })} className={`relative w-10 h-6 rounded-full transition-colors ${data.showRouteLines ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.showRouteLines ? 'left-5' : 'left-1'}`} /></button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-400">Allow Pinch/Zoom</span>
            <p className="text-xs text-gray-500">Let visitors drag, pinch, and zoom the map</p>
          </div>
          <button onClick={() => onChange({ ...data, allowInteraction: data.allowInteraction === false ? true : false })} className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ml-3 ${data.allowInteraction !== false ? 'bg-emerald-500' : 'bg-white/20'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data.allowInteraction !== false ? 'left-5' : 'left-1'}`} /></button>
        </div>
      </div>
      {/* Reset */}
      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><RotateCcw className="w-4 h-4" /> Reset All</button>
      {/* Tip */}
      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
        <p className="text-xs text-emerald-300"><strong>Tip:</strong> Click anywhere on the map to place markers. Drag markers to reposition. Use the Markers tab to edit labels, icons, colors, and link to tour stops.</p>
      </div>
    </div>
  );
}
