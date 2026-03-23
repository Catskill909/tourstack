import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle } from 'lucide-react';
import type { MapBlockData, MapMarker } from '../../types';

interface MapPreviewProps {
  data: MapBlockData;
  language: string;
  deviceType?: 'phone' | 'tablet' | 'kiosk';
  interactive?: boolean;
  className?: string;
  onStopNavigate?: (stopId: string) => void;
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

// Escape HTML to prevent XSS in popup content
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Generate marker HTML for Leaflet divIcon — shared with MapEditorModal
function previewMarkerIconHtml(marker: MapMarker): string {
  const color = marker.color || '#3b82f6';
  const icon = marker.icon || 'pin';
  if (icon === 'number') return `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">${marker.number || '?'}</div>`;
  if (icon === 'dot') return `<div style="width:16px;height:16px;border-radius:50%;background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"></div>`;
  if (icon === 'star') return `<div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"><svg width="20" height="20" viewBox="0 0 24 24" fill="${color}" stroke="#fff" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>`;
  const circleIcons: Record<string, string> = { info: 'ℹ️', accessibility: '♿', restroom: '🚻', stairs: '🪜', elevator: '🛗', exit: '🚪', cafe: '☕', 'gift-shop': '🎁', ticket: '🎫', camera: '📷', 'audio-guide': '🎧', parking: '🅿️' };
  if (circleIcons[icon]) return `<div style="width:28px;height:28px;border-radius:50%;background:${color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;">${circleIcons[icon]}</div>`;
  return `<div style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.3));"><svg width="24" height="32" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="#fff"/></svg></div>`;
}

// OpenStreetMap component using Leaflet
function OpenStreetMapView({ data, language, interactive, className, onStopNavigate }: { data: MapBlockData; language: string; interactive: boolean; className?: string; onStopNavigate?: (stopId: string) => void }) {
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
          mapInstanceRef.current = null;
        }

        // Bail if container was removed from DOM
        if (!mapRef.current) return;

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

        // Add legacy single marker if enabled (backward compat)
        if (data.showMarker && (!data.markers || data.markers.length === 0)) {
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

        // Add custom markers
        if (data.markers && data.markers.length > 0) {
          const bounds = L.latLngBounds([]);

          data.markers.forEach((marker) => {
            const icon = L.divIcon({
              html: previewMarkerIconHtml(marker),
              className: 'map-custom-marker',
              iconSize: marker.icon === 'dot' ? [16, 16] : marker.icon === 'pin' ? [24, 32] : [28, 28],
              iconAnchor: marker.icon === 'pin' ? [12, 32] : marker.icon === 'dot' ? [8, 8] : [14, 14],
            });
            const latlng = L.latLng(marker.latitude, marker.longitude);
            bounds.extend(latlng);
            const leafletMarker = L.marker(latlng, { icon }).addTo(map);

            // Tooltip for label
            const label = marker.title?.[language] || marker.title?.en || '';
            if (label) {
              leafletMarker.bindTooltip(label, { permanent: !!data.showLabels, direction: 'top', offset: [0, -10] });
            }

            // Popup with info text or stop link
            const infoText = marker.infoText?.[language] || marker.infoText?.en || '';
            if (infoText || marker.stopId) {
              let popupHtml = '<div class="map-marker-popup">';
              if (label) popupHtml += `<strong>${escapeHtml(label)}</strong>`;
              if (infoText) popupHtml += `<p>${escapeHtml(infoText)}</p>`;
              if (marker.stopId) popupHtml += `<a href="#" class="map-stop-link" data-stop-id="${escapeHtml(marker.stopId)}">Go to stop &rarr;</a>`;
              popupHtml += '</div>';
              leafletMarker.bindPopup(popupHtml, { maxWidth: 260, minWidth: 80, closeButton: true, className: 'map-styled-popup', autoPanPadding: [20, 20] });
            }

            // Click with stop link navigation — direct click opens popup when popup exists, navigates when no popup
            if (marker.stopId && onStopNavigate) {
              leafletMarker.on('click', () => {
                if (!infoText) onStopNavigate(marker.stopId!);
              });
            }
          });

          // Handle stop link clicks in popups via event delegation
          if (onStopNavigate) {
            map.on('popupopen', (e: L.PopupEvent) => {
              const el = e.popup.getElement();
              if (!el) return;
              el.querySelectorAll('.map-stop-link').forEach((link: Element) => {
                (link as HTMLElement).addEventListener('click', (evt) => {
                  evt.preventDefault();
                  const stopId = (evt.currentTarget as HTMLElement).getAttribute('data-stop-id');
                  if (stopId) onStopNavigate(stopId);
                });
              });
            });
          }

          // Route lines
          if (data.showRouteLines && data.markers.length >= 2) {
            const latlngs = data.markers.map(m => [m.latitude, m.longitude] as [number, number]);
            L.polyline(latlngs, { color: '#8b5cf6', weight: 3, opacity: 0.6, dashArray: '8, 8' }).addTo(map);
          }

          // Fit bounds to show all markers (with padding) if more than 1 marker
          if (data.markers.length > 1 && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: data.zoom });
          }
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
  }, [data.latitude, data.longitude, data.zoom, data.style, data.showMarker, data.showTriggerZone, data.triggerRadius, data.markers, data.showLabels, data.showRouteLines, interactive, language, onStopNavigate]);

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
function GoogleMapView({ data, language, interactive, className, apiKey, onStopNavigate }: { data: MapBlockData; language: string; interactive: boolean; className?: string; apiKey: string; onStopNavigate?: (stopId: string) => void }) {
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

        // Add marker if enabled (legacy single marker)
        if (data.showMarker && (!data.markers || data.markers.length === 0)) {
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

        // Add custom markers with colored pins
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let activeInfoWindow: any = null;
        if (data.markers && data.markers.length > 0) {
          const bounds = new window.google!.maps.LatLngBounds();

          data.markers.forEach((marker) => {
            const color = marker.color || '#3b82f6';
            const pos = { lat: marker.latitude, lng: marker.longitude };
            bounds.extend(pos);
            const gMarker = new window.google!.maps.Marker({
              position: pos,
              map,
              icon: {
                path: window.google!.maps.SymbolPath.CIRCLE,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              },
              title: marker.title?.[language] || marker.title?.en || '',
            });

            // Info window
            const infoText = marker.infoText?.[language] || marker.infoText?.en || '';
            const label = marker.title?.[language] || marker.title?.en || '';
            if (infoText || label || marker.stopId) {
              let content = '<div style="padding:8px 10px;max-width:220px;font-family:system-ui,-apple-system,sans-serif;">';
              if (label) content += `<strong style="display:block;font-size:13px;font-weight:600;color:#f9fafb;margin-bottom:2px;">${escapeHtml(label)}</strong>`;
              if (infoText) content += `<p style="color:#9ca3af;font-size:12px;margin:2px 0 0;line-height:1.35;">${escapeHtml(infoText)}</p>`;
              if (marker.stopId) content += `<a href="#" class="gmap-stop-link" data-stop-id="${escapeHtml(marker.stopId)}" style="display:inline-block;margin-top:6px;padding:4px 10px;font-size:11.5px;font-weight:600;color:#e5e7eb;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:6px;text-decoration:none;">Go to stop &rarr;</a>`;
              content += '</div>';
              const infoWindow = new window.google!.maps.InfoWindow({ content });
              gMarker.addListener('click', () => {
                // Close any previously open InfoWindow
                if (activeInfoWindow) activeInfoWindow.close();
                infoWindow.open(map, gMarker);
                activeInfoWindow = infoWindow;
              });
              // Handle stop link clicks inside InfoWindow
              if (marker.stopId && onStopNavigate) {
                window.google!.maps.event.addListener(infoWindow, 'domready', () => {
                  const el = document.querySelector('.gmap-stop-link[data-stop-id]') as HTMLElement;
                  if (el) {
                    el.addEventListener('click', (evt) => {
                      evt.preventDefault();
                      const stopId = el.getAttribute('data-stop-id');
                      if (stopId) onStopNavigate(stopId);
                    });
                  }
                });
              }
            }
          });

          // Fit bounds for multi-markers
          if (data.markers.length > 1) {
            map.fitBounds(bounds, { padding: 30 });
          }

          // Route lines
          if (data.showRouteLines && data.markers.length >= 2) {
            const path = data.markers.map(m => ({ lat: m.latitude, lng: m.longitude }));
            new window.google!.maps.Polyline({
              path,
              map,
              strokeColor: '#8b5cf6',
              strokeOpacity: 0.6,
              strokeWeight: 3,
            });
          }
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
  }, [data.latitude, data.longitude, data.zoom, data.style, data.showMarker, data.showTriggerZone, data.triggerRadius, data.markers, data.showRouteLines, apiKey, interactive, language]);

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

export function MapPreview({ data, language, deviceType: _deviceType = 'phone', interactive = false, className = '', onStopNavigate }: MapPreviewProps) {
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
        <GoogleMapView data={data} language={language} interactive={interactive} apiKey={googleApiKey} onStopNavigate={onStopNavigate} />
        {markerTitle && (
          <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{markerTitle}</div>
        )}
        {data.showLegend && data.markers && data.markers.length > 0 && (
          <MapLegend markers={data.markers} language={language} />
        )}
      </div>
    );
  }

  // Default to OpenStreetMap
  return (
    <div className={containerClass}>
      <OpenStreetMapView data={data} language={language} interactive={interactive} onStopNavigate={onStopNavigate} />
      {markerTitle && (
        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{markerTitle}</div>
      )}
      {data.showLegend && data.markers && data.markers.length > 0 && (
        <MapLegend markers={data.markers} language={language} />
      )}
    </div>
  );
}

// Legend component
function MapLegend({ markers, language }: { markers: MapMarker[]; language: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2 px-1">
      {markers.map((marker, idx) => {
        const label = marker.title?.[language] || marker.title?.en || `Marker ${idx + 1}`;
        return (
          <div key={marker.id} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: marker.color || '#3b82f6' }} />
            <span>{label}</span>
          </div>
        );
      })}
    </div>
  );
}
