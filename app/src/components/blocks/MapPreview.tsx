import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import type { MapBlockData } from '../../types';

interface MapPreviewProps {
  data: MapBlockData;
  language: string;
  deviceType?: 'phone' | 'tablet';
  interactive?: boolean;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GoogleMapsAPI = any;

declare global {
  interface Window {
    google?: GoogleMapsAPI;
    initGoogleMaps?: () => void;
  }
}

// Load Google Maps script dynamically
let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  // If already loaded, resolve immediately
  if (window.google?.maps) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  // Create new loading promise
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    window.initGoogleMaps = () => {
      console.log('Google Maps loaded successfully');
      resolve();
    };

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      console.error('Failed to load Google Maps script:', e);
      googleMapsLoadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

// OpenStreetMap component using Leaflet
function OpenStreetMapView({ data, interactive, className }: { data: MapBlockData; interactive: boolean; className?: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle container resize (e.g., switching between phone/tablet preview)
  useEffect(() => {
    if (!mapRef.current) return;
    
    const container = mapRef.current;
    const resizeObserver = new ResizeObserver(() => {
      // Delay to allow CSS transitions to complete
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 150);
    });
    
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Dynamic import of Leaflet
    const initMap = async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');

        // Fix default marker icon issue with bundlers
        delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }

        // Create map
        const map = L.map(mapRef.current!, {
          center: [data.latitude, data.longitude],
          zoom: data.zoom,
          zoomControl: interactive,
          dragging: interactive,
          touchZoom: interactive,
          scrollWheelZoom: interactive,
          doubleClickZoom: interactive,
          boxZoom: interactive,
          keyboard: interactive,
        });

        // Add tile layer based on style
        let tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        let attribution = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

        if (data.style === 'satellite') {
          tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          attribution = '© Esri';
        } else if (data.style === 'terrain') {
          tileUrl = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
          attribution = '© OpenTopoMap';
        }

        L.tileLayer(tileUrl, { attribution }).addTo(map);

        // Add marker if enabled
        if (data.showMarker) {
          L.marker([data.latitude, data.longitude]).addTo(map);
        }

        // Add trigger zone circle if enabled
        if (data.showTriggerZone && data.triggerRadius) {
          L.circle([data.latitude, data.longitude], {
            radius: data.triggerRadius,
            color: '#8b5cf6',
            fillColor: '#8b5cf6',
            fillOpacity: 0.15,
            weight: 2,
          }).addTo(map);
        }

        // Add additional markers
        if (data.markers) {
          data.markers.forEach((marker) => {
            L.marker([marker.latitude, marker.longitude]).addTo(map);
          });
        }

        mapInstanceRef.current = map;

        // Force a resize after render - multiple times to catch layout shifts
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 300);
        setTimeout(() => map.invalidateSize(), 500);
      } catch (err) {
        console.error('Failed to load Leaflet:', err);
        setError('Failed to load map');
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [data.latitude, data.longitude, data.zoom, data.style, data.showMarker, data.showTriggerZone, data.triggerRadius, interactive]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[var(--color-bg-elevated)] rounded-lg ${className}`}>
        <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return <div ref={mapRef} className={`w-full h-full min-h-[200px] rounded-lg ${className}`} style={{ minHeight: '200px' }} />;
}

// Google Maps component
function GoogleMapView({ data, interactive, className, apiKey }: { data: MapBlockData; interactive: boolean; className?: string; apiKey: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !apiKey) {
      console.log('GoogleMapView: missing ref or apiKey', { hasRef: !!mapRef.current, hasKey: !!apiKey });
      return;
    }

    const initMap = async () => {
      try {
        console.log('GoogleMapView: loading script with key length:', apiKey.length);
        await loadGoogleMapsScript(apiKey);
        console.log('GoogleMapView: script loaded, window.google:', !!window.google);
        
        if (!window.google?.maps) {
          throw new Error('Google Maps API not available after script load');
        }

        const mapTypeId = {
          standard: 'roadmap',
          satellite: 'satellite',
          terrain: 'terrain',
          hybrid: 'hybrid',
        }[data.style] || 'roadmap';

        console.log('GoogleMapView: creating map at', data.latitude, data.longitude);
        const map = new window.google!.maps.Map(mapRef.current!, {
          center: { lat: data.latitude, lng: data.longitude },
          zoom: data.zoom,
          mapTypeId,
          disableDefaultUI: !interactive,
          gestureHandling: interactive ? 'auto' : 'none',
          zoomControl: interactive,
          scrollwheel: interactive,
          draggable: interactive,
        });

        // Add marker if enabled
        if (data.showMarker) {
          new window.google!.maps.Marker({
            position: { lat: data.latitude, lng: data.longitude },
            map,
          });
        }

        // Add trigger zone circle if enabled
        if (data.showTriggerZone && data.triggerRadius) {
          new window.google!.maps.Circle({
            center: { lat: data.latitude, lng: data.longitude },
            radius: data.triggerRadius,
            map,
            strokeColor: '#8b5cf6',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#8b5cf6',
            fillOpacity: 0.15,
          });
        }

        // Add additional markers
        if (data.markers) {
          data.markers.forEach((marker) => {
            new window.google!.maps.Marker({
              position: { lat: marker.latitude, lng: marker.longitude },
              map,
            });
          });
        }

        mapInstanceRef.current = map;
        setLoading(false);
        console.log('GoogleMapView: map created successfully');
      } catch (err) {
        console.error('Failed to load Google Maps:', err);
        setError('Failed to load Google Maps');
        setLoading(false);
      }
    };

    initMap();
  }, [data.latitude, data.longitude, data.zoom, data.style, data.showMarker, data.showTriggerZone, data.triggerRadius, apiKey, interactive]);

  // Always render the map container so ref is available
  return (
    <div className={`relative w-full h-full min-h-[200px] rounded-lg ${className}`} style={{ minHeight: '200px' }}>
      {/* Map container - always rendered for ref */}
      <div ref={mapRef} className="absolute inset-0 rounded-lg" />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-elevated)] rounded-lg">
          <div className="animate-pulse text-[var(--color-text-muted)]">Loading Google Maps...</div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-bg-elevated)] rounded-lg">
          <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

export function MapPreview({ data, language, deviceType: _deviceType = 'phone', interactive = false, className = '' }: MapPreviewProps) {
  void _deviceType; // Reserved for future tablet-specific styling
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);

  // Fetch Google Maps API key from settings if using Google provider
  useEffect(() => {
    if (data.provider === 'google') {
      // Try to get from localStorage or fetch from API
      const storedKey = localStorage.getItem('googleMapsApiKey');
      console.log('Google Maps: checking for API key, stored:', storedKey ? 'yes' : 'no');
      if (storedKey) {
        setGoogleApiKey(storedKey);
      } else {
        // Fetch from settings API
        console.log('Google Maps: fetching API key from /api/settings');
        fetch('/api/settings')
          .then(res => res.json())
          .then(settings => {
            console.log('Google Maps: settings response:', settings);
            if (settings?.maps?.googleMapsApiKey) {
              console.log('Google Maps: API key found, length:', settings.maps.googleMapsApiKey.length);
              setGoogleApiKey(settings.maps.googleMapsApiKey);
              localStorage.setItem('googleMapsApiKey', settings.maps.googleMapsApiKey);
            } else {
              console.log('Google Maps: No API key in settings');
            }
          })
          .catch(err => {
            console.error('Google Maps: Failed to fetch settings:', err);
          });
      }
    }
  }, [data.provider]);

  // Validate coordinates
  if (!data.latitude || !data.longitude || isNaN(data.latitude) || isNaN(data.longitude)) {
    return (
      <div className={`flex flex-col items-center justify-center bg-[var(--color-bg-elevated)] rounded-lg p-8 ${className}`}>
        <MapPin className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
        <p className="text-[var(--color-text-muted)] text-sm">No location set</p>
        <p className="text-[var(--color-text-muted)] text-xs mt-1">Add coordinates to display map</p>
      </div>
    );
  }

  // Use min-height to ensure map has space, and fill available height
  const containerClass = `w-full h-full min-h-[200px] ${className}`;
  const markerTitle = data.markerTitle?.[language] || data.markerTitle?.en;

  // Google Maps requires API key
  if (data.provider === 'google') {
    if (!googleApiKey) {
      return (
        <div className={`flex flex-col items-center justify-center bg-[var(--color-bg-elevated)] rounded-lg p-8 ${containerClass}`}>
          <AlertCircle className="w-8 h-8 text-yellow-400 mb-2" />
          <p className="text-[var(--color-text-secondary)] text-sm text-center">
            Google Maps API key required
          </p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1 text-center">
            Add your API key in Settings → Maps & Location
          </p>
        </div>
      );
    }

    return (
      <div className={containerClass}>
        <GoogleMapView data={data} interactive={interactive} apiKey={googleApiKey} />
        {markerTitle && (
          <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{markerTitle}</div>
        )}
      </div>
    );
  }

  // Default to OpenStreetMap
  return (
    <div className={containerClass}>
      <OpenStreetMapView data={data} interactive={interactive} />
      {markerTitle && (
        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{markerTitle}</div>
      )}
    </div>
  );
}
