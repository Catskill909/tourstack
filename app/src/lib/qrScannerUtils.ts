// QR Scanner utilities for TourStack

/** Parsed result from a TourStack QR code URL */
export interface ParsedTourStackUrl {
  tourSlug: string;
  stopSlug: string;
  token?: string;
}

/** Scan history entry for a single stop */
export interface ScanHistoryEntry {
  stopId: string;
  stopSlug: string;
  stopTitle: string;
  scannedAt: string; // ISO timestamp
}

/** Full scan history for a tour */
export interface ScanHistory {
  tourId: string;
  scannedStops: ScanHistoryEntry[];
}

/**
 * Parse a TourStack visitor URL to extract tour/stop slugs and token.
 * Supports both slug-based and ID-based URLs.
 *
 * Examples:
 *   /visitor/tour/museum-tour/stop/rosetta-stone?t=abc123
 *   http://localhost:5173/visitor/tour/abc/stop/def
 */
export function parseTourStackUrl(url: string): ParsedTourStackUrl | null {
  try {
    // Handle relative URLs by prepending a base
    const fullUrl = url.startsWith('http') ? url : `https://placeholder.com${url.startsWith('/') ? '' : '/'}${url}`;
    const parsed = new URL(fullUrl);
    const match = parsed.pathname.match(/\/visitor\/tour\/([^/]+)\/stop\/([^/?]+)/);
    if (!match) return null;
    return {
      tourSlug: decodeURIComponent(match[1]),
      stopSlug: decodeURIComponent(match[2]),
      token: parsed.searchParams.get('t') || undefined,
    };
  } catch {
    // Try regex-only as fallback for malformed URLs
    const match = url.match(/\/visitor\/tour\/([^/]+)\/stop\/([^/?#]+)/);
    if (!match) return null;
    return {
      tourSlug: decodeURIComponent(match[1]),
      stopSlug: decodeURIComponent(match[2]),
    };
  }
}

/**
 * Check if a scanned URL/text looks like a TourStack URL
 */
export function isTourStackUrl(text: string): boolean {
  return /\/visitor\/tour\/[^/]+\/stop\/[^/?#]+/.test(text);
}

/**
 * Extract a short code from scanned text.
 * Short codes are 6 uppercase alphanumeric characters.
 */
export function extractShortCode(text: string): string | null {
  const trimmed = text.trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(trimmed)) return trimmed;
  return null;
}

// --- Scan History (localStorage) ---

const HISTORY_KEY_PREFIX = 'tourstack-scan-history-';

function getHistoryKey(tourId: string): string {
  return `${HISTORY_KEY_PREFIX}${tourId}`;
}

/** Get scan history for a tour */
export function getScanHistory(tourId: string): ScanHistory {
  try {
    const raw = localStorage.getItem(getHistoryKey(tourId));
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { tourId, scannedStops: [] };
}

/** Record a scan in history */
export function recordScan(tourId: string, entry: Omit<ScanHistoryEntry, 'scannedAt'>): void {
  const history = getScanHistory(tourId);
  // Don't duplicate
  if (history.scannedStops.some(s => s.stopId === entry.stopId)) return;
  history.scannedStops.push({ ...entry, scannedAt: new Date().toISOString() });
  try {
    localStorage.setItem(getHistoryKey(tourId), JSON.stringify(history));
  } catch { /* ignore quota errors */ }
}

/** Check if a stop has been scanned/visited */
export function isStopScanned(tourId: string, stopId: string): boolean {
  return getScanHistory(tourId).scannedStops.some(s => s.stopId === stopId);
}

/** Clear scan history for a tour */
export function clearScanHistory(tourId: string): void {
  try {
    localStorage.removeItem(getHistoryKey(tourId));
  } catch { /* ignore */ }
}

/**
 * Look up a short code via the API
 */
export async function lookupShortCode(shortCode: string): Promise<{ redirectUrl: string; tourSlug: string; stopSlug: string } | null> {
  try {
    const res = await fetch(`/api/visitor/s/${encodeURIComponent(shortCode)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetch lightweight stop info for info popup mode
 */
export async function fetchStopInfo(tourSlug: string, stopSlug: string): Promise<{
  id: string;
  title: Record<string, string>;
  description: Record<string, string>;
  image: string;
  order: number;
} | null> {
  try {
    const res = await fetch(`/api/visitor/tour/${encodeURIComponent(tourSlug)}/stop/${encodeURIComponent(stopSlug)}/info`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
