import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Navigation, Search, Crosshair, Map as MapIcon, Layers, Circle, RotateCcw } from 'lucide-react';
import type { MapBlockData, MapProvider, MapStyle } from '../../types';

interface MapEditorModalProps {
  data: MapBlockData;
  language: string;
  availableLanguages?: string[];
  onChange: (data: MapBlockData) => void;
  onClose: () => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any  
type LeafletMarker = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletCircle = any;

const MAP_STYLES: { value: MapStyle; label: string; osmOnly?: boolean }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'hybrid', label: 'Hybrid', osmOnly: false },
];

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // NYC
const DEFAULT_ZOOM = 15;

export function MapEditorModal({ data, language, onChange, onClose }: MapEditorModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const circleRef = useRef<LeafletCircle | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  
  // Ref to hold latest data/onChange for click handler
  const dataRef = useRef(data);
  const onChangeRef = useRef(onChange);
  
  // Keep refs updated
  useEffect(() => {
    dataRef.current = data;
    onChangeRef.current = onChange;
  }, [data, onChange]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Local state for form inputs
  const [latInput, setLatInput] = useState(data.latitude?.toString() || '');
  const [lngInput, setLngInput] = useState(data.longitude?.toString() || '');
  const [zoomInput, setZoomInput] = useState(data.zoom?.toString() || DEFAULT_ZOOM.toString());
  const [radiusInput, setRadiusInput] = useState(data.triggerRadius?.toString() || '25');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        leafletRef.current = L;

        // Clean up existing map if any (prevents "Map container is already initialized" error)
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Fix default marker icon
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const lat = data.latitude || DEFAULT_CENTER.lat;
        const lng = data.longitude || DEFAULT_CENTER.lng;
        const zoom = data.zoom || DEFAULT_ZOOM;

        const map = L.map(mapRef.current!, {
          center: [lat, lng],
          zoom: zoom,
          zoomControl: true,
        });

        // Add tile layer
        updateTileLayer(map, L, data.style || 'standard');

        // Store refs BEFORE adding click handler
        mapInstanceRef.current = map;
        leafletRef.current = L;

        // Add click handler to place marker
        map.on('click', (e: L.LeafletMouseEvent) => {
          const clickLat = Math.round(e.latlng.lat * 1000000) / 1000000;
          const clickLng = Math.round(e.latlng.lng * 1000000) / 1000000;
          
          setLatInput(clickLat.toString());
          setLngInput(clickLng.toString());
          
          // Remove existing marker if any
          if (markerRef.current) {
            map.removeLayer(markerRef.current);
            markerRef.current = null;
          }
          
          // Create custom icon to ensure visibility
          const customIcon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          
          // Create new marker with explicit icon
          const marker = L.marker([clickLat, clickLng], { 
            draggable: true,
            icon: customIcon
          }).addTo(map);
          
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            const dragLat = Math.round(pos.lat * 1000000) / 1000000;
            const dragLng = Math.round(pos.lng * 1000000) / 1000000;
            setLatInput(dragLat.toString());
            setLngInput(dragLng.toString());
            onChangeRef.current({
              ...dataRef.current,
              latitude: dragLat,
              longitude: dragLng,
              showMarker: true,
            });
          });
          markerRef.current = marker;
          
          // Remove existing circle if any
          if (circleRef.current) {
            map.removeLayer(circleRef.current);
            circleRef.current = null;
          }
          
          // Update trigger zone if enabled
          const currentData = dataRef.current;
          if (currentData.showTriggerZone && currentData.triggerRadius) {
            circleRef.current = L.circle([clickLat, clickLng], {
              radius: currentData.triggerRadius,
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.15,
              weight: 2,
            }).addTo(map);
          }
          
          onChangeRef.current({
            ...currentData,
            latitude: clickLat,
            longitude: clickLng,
            showMarker: true,
          });
        });

        // Track zoom changes
        map.on('zoomend', () => {
          const newZoom = map.getZoom();
          setZoomInput(newZoom.toString());
          onChange({ ...data, zoom: newZoom });
        });

        // Add initial marker if coordinates exist
        if (data.latitude && data.longitude) {
          addMarker(L, map, data.latitude, data.longitude);
          if (data.showTriggerZone && data.triggerRadius) {
            addCircle(L, map, data.latitude, data.longitude, data.triggerRadius);
          }
        }

        setIsMapReady(true);

        // Force resize after render
        setTimeout(() => map.invalidateSize(), 100);
      } catch (err) {
        console.error('Failed to initialize map:', err);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update tile layer based on style
  function updateTileLayer(map: LeafletMap, L: typeof import('leaflet'), style: MapStyle) {
    // Remove existing tile layers
    map.eachLayer((layer: { _url?: string }) => {
      if (layer._url) {
        map.removeLayer(layer);
      }
    });

    let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    if (style === 'satellite') {
      tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '© Esri';
    } else if (style === 'terrain') {
      tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      attribution = '© OpenTopoMap';
    }

    L.tileLayer(tileUrl, { attribution }).addTo(map);
  }

  // Add/update marker with explicit icon
  function addMarker(L: typeof import('leaflet'), map: LeafletMap, lat: number, lng: number) {
    // Remove existing marker
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    
    // Create custom icon to ensure visibility
    const customIcon = L.icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
    
    markerRef.current = L.marker([lat, lng], { 
      draggable: true,
      icon: customIcon
    }).addTo(map);
    
    markerRef.current.on('dragend', () => {
      const pos = markerRef.current.getLatLng();
      updateMarkerPosition(pos.lat, pos.lng, false);
    });
  }

  // Add/update trigger zone circle
  function addCircle(L: typeof import('leaflet'), map: LeafletMap, lat: number, lng: number, radius: number) {
    if (circleRef.current) {
      circleRef.current.setLatLng([lat, lng]);
      circleRef.current.setRadius(radius);
    } else {
      circleRef.current = L.circle([lat, lng], {
        radius,
        color: '#8b5cf6',
        fillColor: '#8b5cf6',
        fillOpacity: 0.15,
        weight: 2,
      }).addTo(map);
    }
  }

  
  // Update marker position and sync data
  const updateMarkerPosition = useCallback((lat: number, lng: number, panTo = true) => {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Round to 6 decimal places
    const roundedLat = Math.round(lat * 1000000) / 1000000;
    const roundedLng = Math.round(lng * 1000000) / 1000000;

    setLatInput(roundedLat.toString());
    setLngInput(roundedLng.toString());

    addMarker(L, map, roundedLat, roundedLng);

    if (data.showTriggerZone && data.triggerRadius) {
      addCircle(L, map, roundedLat, roundedLng, data.triggerRadius);
    }

    if (panTo) {
      map.panTo([roundedLat, roundedLng]);
    }

    onChange({
      ...data,
      latitude: roundedLat,
      longitude: roundedLng,
      showMarker: true,
    });
  }, [data, onChange]);

  // Handle manual coordinate input
  function handleCoordsSubmit() {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return; // Invalid coordinates
    }

    updateMarkerPosition(lat, lng);
  }

  // Handle zoom change
  function handleZoomChange(newZoom: number) {
    setZoomInput(newZoom.toString());
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(newZoom);
    }
    onChange({ ...data, zoom: newZoom });
  }

  // Handle radius change
  function handleRadiusChange(newRadius: number) {
    setRadiusInput(newRadius.toString());
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    
    if (L && map && data.latitude && data.longitude) {
      if (data.showTriggerZone) {
        addCircle(L, map, data.latitude, data.longitude, newRadius);
      }
    }
    
    onChange({ ...data, triggerRadius: newRadius });
  }

  // Toggle trigger zone visibility
  function handleToggleTriggerZone() {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    const newShow = !data.showTriggerZone;

    if (!newShow && circleRef.current && map) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    } else if (newShow && L && map && data.latitude && data.longitude) {
      const radius = data.triggerRadius || 25;
      addCircle(L, map, data.latitude, data.longitude, radius);
    }

    onChange({ ...data, showTriggerZone: newShow });
  }

  // Handle style change
  function handleStyleChange(style: MapStyle) {
    const L = leafletRef.current;
    const map = mapInstanceRef.current;
    if (L && map) {
      updateTileLayer(map, L, style);
    }
    onChange({ ...data, style });
  }

  // Handle provider change
  function handleProviderChange(provider: MapProvider) {
    onChange({ ...data, provider });
  }

  // Search for address using Nominatim
  async function handleSearch() {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'TourStack/1.0',
          },
        }
      );

      const results = await response.json();
      
      if (results.length > 0) {
        const { lat, lon } = results[0];
        updateMarkerPosition(parseFloat(lat), parseFloat(lon));
        
        // Zoom to reasonable level for address
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setZoom(17);
          setZoomInput('17');
          onChange({ ...data, zoom: 17 });
        }
      } else {
        setSearchError('Location not found');
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }

  // Get current location from device GPS
  async function handleGetCurrentLocation() {
    if (!navigator.geolocation) {
      setSearchError('Geolocation not supported');
      return;
    }

    setIsGettingLocation(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateMarkerPosition(position.coords.latitude, position.coords.longitude);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setSearchError('Could not get location. Please check permissions.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // Reset to default
  function handleReset() {
    const map = mapInstanceRef.current;

    if (markerRef.current && map) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (circleRef.current && map) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    setLatInput('');
    setLngInput('');
    setZoomInput(DEFAULT_ZOOM.toString());

    if (map) {
      map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM);
    }

    onChange({
      ...data,
      latitude: 0,
      longitude: 0,
      zoom: DEFAULT_ZOOM,
      showMarker: false,
    });
  }

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
            <p className="text-xs text-gray-400">Set location and trigger zone</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Provider Toggle - selects which map shows in preview/device */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => handleProviderChange('openstreetmap')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  data.provider === 'openstreetmap' || !data.provider
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                OpenStreetMap
              </button>
              <button
                onClick={() => handleProviderChange('google')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  data.provider === 'google'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Google Maps
              </button>
            </div>
            <span className="text-[10px] text-gray-500">For device preview</span>
          </div>

          {/* Style Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-400" />
            <select
              value={data.style || 'standard'}
              onChange={(e) => handleStyleChange(e.target.value as MapStyle)}
              className="bg-white/10 text-white text-sm rounded-lg px-3 py-1.5 border border-white/10 focus:border-emerald-500 focus:outline-none appearance-none cursor-pointer"
            >
              {MAP_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
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

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="absolute inset-0" />
          
          {/* Crosshair indicator when no marker */}
          {isMapReady && !data.latitude && !data.longitude && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex flex-col items-center gap-2 bg-black/70 px-4 py-3 rounded-xl">
                <Crosshair className="w-8 h-8 text-emerald-400" />
                <span className="text-sm text-white">Click map to place marker</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-[#111] border-l border-white/10 p-4 overflow-y-auto">
          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Search Address
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a place..."
                className="flex-1 px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isSearching ? '...' : <Search className="w-4 h-4" />}
              </button>
            </div>
            {searchError && (
              <p className="text-xs text-red-400 mt-1">{searchError}</p>
            )}
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-6 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Navigation className="w-4 h-4" />
            {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
          </button>

          {/* Manual Coordinates */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Coordinates
            </label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input
                  type="text"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  onBlur={handleCoordsSubmit}
                  placeholder="-90 to 90"
                  className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input
                  type="text"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  onBlur={handleCoordsSubmit}
                  placeholder="-180 to 180"
                  className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleCoordsSubmit}
              className="w-full px-3 py-1.5 text-sm bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
            >
              Go to Coordinates
            </button>
          </div>

          {/* Zoom */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Zoom Level: {zoomInput}
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={parseInt(zoomInput) || DEFAULT_ZOOM}
              onChange={(e) => handleZoomChange(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>World</span>
              <span>Street</span>
            </div>
          </div>

          {/* Trigger Zone */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Circle className="w-4 h-4" />
                Trigger Zone
              </label>
              <button
                onClick={handleToggleTriggerZone}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  data.showTriggerZone ? 'bg-emerald-500' : 'bg-white/20'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    data.showTriggerZone ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </div>
            
            {data.showTriggerZone && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Radius: {radiusInput}m
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  value={parseInt(radiusInput) || 25}
                  onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5m</span>
                  <span>200m</span>
                </div>
              </div>
            )}
          </div>

          {/* Display Size */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onChange({ ...data, size })}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    (data.size || 'medium') === size
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {data.size === 'small' && 'Compact view (150px)'}
              {data.size === 'large' && 'Full screen height'}
              {(!data.size || data.size === 'medium') && 'Standard view (250px)'}
            </p>
          </div>

          {/* Marker Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Marker Title (optional)
            </label>
            <input
              type="text"
              value={data.markerTitle?.[language] || ''}
              onChange={(e) => onChange({
                ...data,
                markerTitle: { ...data.markerTitle, [language]: e.target.value }
              })}
              placeholder="e.g., Main Entrance"
              className="w-full px-3 py-2 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none text-sm"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Location
          </button>

          {/* Info */}
          <div className="mt-6 p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <p className="text-xs text-emerald-300">
              <strong>Tip:</strong> Click anywhere on the map to place a marker, or drag the marker to adjust its position.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
