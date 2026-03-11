import { useState, useEffect, useRef, useCallback } from 'react';
import { isInsideGeofence } from '../lib/geo';
import type { GPSConfig } from '../types';

export interface GeofenceTarget {
    id: string; // stop id
    lat: number;
    lng: number;
    radius: number; // meters
}

export type GeoPermission = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface GeofenceState {
    /** Current permission state */
    permission: GeoPermission;
    /** Whether the watcher is actively running */
    watching: boolean;
    /** Current user position (null until first fix) */
    position: { lat: number; lng: number; accuracy: number } | null;
    /** Set of stop IDs currently inside their geofence */
    insideIds: Set<string>;
    /** Most recently entered stop ID (for auto-navigation) */
    lastEnteredId: string | null;
    /** Request permission and start watching */
    start: () => void;
    /** Stop watching */
    stop: () => void;
}

/**
 * Hook that monitors the user's position against a list of GPS geofences.
 * Fires when the user enters/exits a geofence zone.
 */
export function useGeofenceMonitor(
    targets: GeofenceTarget[],
    onEnter?: (stopId: string) => void,
): GeofenceState {
    const [permission, setPermission] = useState<GeoPermission>('prompt');
    const [watching, setWatching] = useState(false);
    const [position, setPosition] = useState<GeofenceState['position']>(null);
    const [insideIds, setInsideIds] = useState<Set<string>>(new Set());
    const [lastEnteredId, setLastEnteredId] = useState<string | null>(null);

    const watchIdRef = useRef<number | null>(null);
    const prevInsideRef = useRef<Set<string>>(new Set());
    const onEnterRef = useRef(onEnter);
    onEnterRef.current = onEnter;
    const targetsRef = useRef(targets);
    targetsRef.current = targets;

    // Check initial permission state
    useEffect(() => {
        if (!navigator.geolocation) {
            setPermission('unavailable');
            return;
        }
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setPermission(result.state as GeoPermission);
                result.addEventListener('change', () => {
                    setPermission(result.state as GeoPermission);
                });
            });
        }
    }, []);

    const handlePosition = useCallback((pos: GeolocationPosition) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setPosition({ lat, lng, accuracy });

        const currentTargets = targetsRef.current;
        const nowInside = new Set<string>();

        for (const t of currentTargets) {
            if (isInsideGeofence(lat, lng, t.lat, t.lng, t.radius)) {
                nowInside.add(t.id);
            }
        }

        // Detect new entries
        const prev = prevInsideRef.current;
        for (const id of nowInside) {
            if (!prev.has(id)) {
                setLastEnteredId(id);
                onEnterRef.current?.(id);
            }
        }

        prevInsideRef.current = nowInside;
        setInsideIds(nowInside);
    }, []);

    const start = useCallback(() => {
        if (!navigator.geolocation) {
            setPermission('unavailable');
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                setPermission('granted');
                setWatching(true);
                handlePosition(pos);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setPermission('denied');
                }
                setWatching(false);
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
        );
    }, [handlePosition]);

    const stop = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setWatching(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return { permission, watching, position, insideIds, lastEnteredId, start, stop };
}

/** Convert a stop's GPS positioning config into a GeofenceTarget. */
export function gpsConfigToTarget(stopId: string, config: GPSConfig): GeofenceTarget {
    return {
        id: stopId,
        lat: config.latitude,
        lng: config.longitude,
        radius: config.radius,
    };
}
