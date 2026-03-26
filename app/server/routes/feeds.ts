import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../db.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const router = Router();

// GET /api/feeds/openapi.json - Serve OpenAPI spec
router.get('/openapi.json', (_req: Request, res: Response) => {
    try {
        // Production: docs/ is at cwd (WORKDIR /app)
        // Local dev: cwd is app/, so docs/ is one level up
        let specPath = join(process.cwd(), 'docs/openapi-feeds.yaml');
        if (!existsSync(specPath)) {
            specPath = join(process.cwd(), '../docs/openapi-feeds.yaml');
        }
        const yaml = readFileSync(specPath, 'utf-8');
        res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
        res.send(yaml);
    } catch {
        res.status(404).json({ error: 'OpenAPI spec not found' });
    }
});

// Feed version for schema tracking
const FEED_VERSION = '2.0';

// Query parameter types
interface FeedQueryParams {
    lang?: string;           // Filter by language (e.g., ?lang=es)
    format?: 'full' | 'compact' | 'minimal';  // Output format
    status?: string;         // Filter by status (e.g., ?status=published)
    include_stops?: string;  // Include stops (default: true)
}

// Derive the public base URL from the incoming request.
// Works behind reverse proxies (Coolify) because trust proxy is set.
function getBaseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
}

// GET /api/feeds/tours - Get all tours as a feed
// Query params: ?lang=es&format=compact&status=published&include_stops=true
router.get('/tours', async (req: Request, res: Response) => {
    try {
        const { lang, format = 'full', status, include_stops } = req.query as FeedQueryParams;
        const includeStops = include_stops !== 'false';

        const tours = await prisma.tour.findMany({
            include: includeStops ? {
                stops: {
                    orderBy: { order: 'asc' },
                },
            } : undefined,
            orderBy: { updatedAt: 'desc' },
        });

        // Filter by status if provided
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let filteredTours = tours as any[];
        if (status) {
            filteredTours = filteredTours.filter(t => t.status === status);
        }

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            query: {
                language: lang || 'all',
                format,
                status: status || 'all',
                include_stops: includeStops,
            },
            base_url: getBaseUrl(req),
            total_tours: filteredTours.length,
            tours: filteredTours.map((tour) => formatTourForFeed(tour, lang, format, getBaseUrl(req))),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tours feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id - Get single tour feed
// Query params: ?lang=es&format=compact
router.get('/tours/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { lang, format = 'full' } = req.query as FeedQueryParams;

        const tour = await prisma.tour.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            query: {
                language: lang || 'all',
                format,
            },
            base_url: getBaseUrl(req),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tour: formatTourForFeed(tour as any, lang, format, getBaseUrl(req)),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating tour feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// GET /api/feeds/tours/:id/stops - Get tour stops only
// Query params: ?lang=es
router.get('/tours/:id/stops', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { lang } = req.query as FeedQueryParams;

        const tour = await prisma.tour.findUnique({
            where: { id },
            include: {
                stops: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!tour) {
            return res.status(404).json({ error: 'Tour not found' });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tourData = tour as any;
        const title = parseLocalizedField(tourData.title);
        const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;

        const feed = {
            version: FEED_VERSION,
            generated_at: new Date().toISOString(),
            query: {
                language: lang || 'all',
            },
            tour_id: tourData.id,
            tour_slug: tourData.slug,
            tour_title: localizedTitle,
            total_stops: tourData.stops?.length || 0,
            base_url: getBaseUrl(req),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            stops: (tourData.stops || []).map((stop: any) => formatStopForFeed(stop, lang, parseJsonArray(tourData.languages), getBaseUrl(req))),
        };

        res.json(feed);
    } catch (error) {
        console.error('Error generating stops feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// Helper: Parse JSON field safely
function parseLocalizedField(field: string | null): Record<string, string> {
    if (!field) return { en: '' };
    try {
        return JSON.parse(field);
    } catch {
        return { en: field };
    }
}

// Helper: Parse JSON array safely
function parseJsonArray(field: string | null): string[] {
    if (!field) return [];
    try {
        return JSON.parse(field);
    } catch {
        return [];
    }
}

// Helper: Convert any media field (image, audio, video) to proper URL
// Base64 data URIs are NOT included in feeds - they bloat the response
function formatMediaUrl(field: string | null, baseUrl?: string): string | null {
    if (!field) return null;

    // Strip base64 data URIs
    if (field.startsWith('data:')) {
        return null;
    }

    // Already a full URL — return as-is
    if (field.startsWith('http://') || field.startsWith('https://')) {
        return field;
    }

    // Relative path (e.g., /uploads/...) — prepend base URL if available
    if (field.startsWith('/')) {
        return baseUrl ? `${baseUrl}${field}` : field;
    }

    return field;
}

// Backward-compatible alias
const formatImageUrl = formatMediaUrl;

// Helper: Format tour for feed output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatTourForFeed(tour: any, lang?: string, format: string = 'full', baseUrl?: string) {
    const title = parseLocalizedField(tour.title);
    const description = parseLocalizedField(tour.description);

    // If language specified, return only that language's content
    const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;
    const localizedDescription = lang ? { [lang]: description[lang] || description['en'] || '' } : description;

    // Parse accessibility once
    let accessibility = null;
    try { accessibility = tour.accessibility ? JSON.parse(tour.accessibility) : null; } catch { /* */ }

    // Minimal format - just IDs and titles
    if (format === 'minimal') {
        return {
            id: tour.id,
            slug: tour.slug,
            title: localizedTitle,
            status: tour.status,
            stop_count: tour.stops?.length || 0,
        };
    }

    // Compact format - no stops content
    if (format === 'compact') {
        return {
            id: tour.id,
            slug: tour.slug,
            title: localizedTitle,
            description: localizedDescription,
            hero_image: formatImageUrl(tour.heroImage, baseUrl),
            status: tour.status,
            languages: parseJsonArray(tour.languages),
            primary_language: tour.primaryLanguage,
            estimated_duration: tour.duration || tour.estimatedDuration,
            difficulty: tour.difficulty,
            positioning_method: tour.primaryPositioningMethod,
            accessibility,
            concierge_enabled: tour.conciergeEnabled ?? false,
            stop_count: tour.stops?.length || 0,
            updated_at: tour.updatedAt.toISOString(),
        };
    }

    // Full format - everything
    return {
        id: tour.id,
        slug: tour.slug,
        title: localizedTitle,
        description: localizedDescription,
        hero_image: formatImageUrl(tour.heroImage, baseUrl),
        status: tour.status,
        languages: parseJsonArray(tour.languages),
        primary_language: tour.primaryLanguage,
        estimated_duration: tour.duration || tour.estimatedDuration,
        difficulty: tour.difficulty,
        positioning_method: tour.primaryPositioningMethod,
        backup_positioning_method: tour.backupPositioningMethod || null,
        accessibility,
        concierge_enabled: tour.conciergeEnabled ?? false,
        published_at: tour.publishedAt ? tour.publishedAt.toISOString() : null,
        created_at: tour.createdAt.toISOString(),
        updated_at: tour.updatedAt.toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stops: tour.stops?.map((stop: any) => formatStopForFeed(stop, lang, parseJsonArray(tour.languages), baseUrl)) || [],
        stop_count: tour.stops?.length || 0,
    };
}

// Helper: Recursively strip ALL base64 data URIs from any value.
// Walks the entire object/array tree — catches base64 in block.data.url,
// block.data.images[].url, nested hotspots, floor plans, etc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function stripBase64Deep(value: any): any {
    if (!value) return value;

    // String — strip if base64
    if (typeof value === 'string') {
        return value.startsWith('data:') ? null : value;
    }

    // Array — recurse and drop nulled-out string entries
    if (Array.isArray(value)) {
        return value.map(item => stripBase64Deep(item)).filter(item => item !== null || typeof item !== 'string');
    }

    // Object — recurse into every property
    if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = stripBase64Deep(v);
        }
        return result;
    }

    return value;
}

// Helper: Clean base64 data from content blocks (recursive — catches all nesting)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanContentBlocks(blocks: any[]): any[] {
    return blocks.map(block => stripBase64Deep(block));
}

// Helper: Recursively resolve relative /uploads/... URLs to absolute URLs.
// Walks the entire tree so it catches image, audio, and video URLs at any depth.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveUrlsDeep(value: any, baseUrl: string): any {
    if (!value) return value;

    if (typeof value === 'string') {
        if (value.startsWith('/uploads/')) {
            return `${baseUrl}${value}`;
        }
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => resolveUrlsDeep(item, baseUrl));
    }

    if (typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = resolveUrlsDeep(v, baseUrl);
        }
        return result;
    }

    return value;
}

// Helper: Filter a multilingual object to only include allowed languages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterLanguageKeys(obj: any, tourLanguages?: string[]): any {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj) || !tourLanguages) return obj;
    // Only filter if it looks like a language map (keys are 2-3 char language codes)
    const keys = Object.keys(obj);
    const looksLikeLangMap = keys.length > 0 && keys.every(k => /^[a-z]{2,3}$/.test(k));
    if (!looksLikeLangMap) return obj;
    const filtered: Record<string, unknown> = {};
    for (const lang of tourLanguages) {
        if (lang in obj) filtered[lang] = obj[lang];
    }
    // Always include 'en' as fallback if present
    if ('en' in obj && !('en' in filtered)) filtered['en'] = obj['en'];
    return filtered;
}

// Helper: Recursively filter all multilingual fields in any value to tour languages.
// Walks objects and arrays, applying filterLanguageKeys to every object that looks
// like a language map (keys are 2-3 char codes). This handles nested structures like
// accordion items, gallery image captions, map markers, timeline events, etc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterLanguagesDeep(value: any, tourLanguages: string[]): any {
    if (!value || typeof value !== 'object') return value;

    if (Array.isArray(value)) {
        return value.map(item => filterLanguagesDeep(item, tourLanguages));
    }

    // Check if this object itself is a language map
    const keys = Object.keys(value);
    const looksLikeLangMap = keys.length > 0 && keys.every(k => /^[a-z]{2,3}$/.test(k));
    if (looksLikeLangMap) {
        return filterLanguageKeys(value, tourLanguages);
    }

    // Otherwise recurse into each property
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
        result[k] = filterLanguagesDeep(v, tourLanguages);
    }
    return result;
}

// Helper: Filter all multilingual fields in a content block's data to tour languages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterBlockLanguages(block: any, tourLanguages?: string[]): any {
    if (!block || !tourLanguages) return block;
    const cleaned = { ...block };
    if (cleaned.data && typeof cleaned.data === 'object') {
        cleaned.data = filterLanguagesDeep(cleaned.data, tourLanguages);
    }
    return cleaned;
}

// Helper: Format stop for feed output
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatStopForFeed(stop: any, lang?: string, tourLanguages?: string[], baseUrl?: string) {
    const title = parseLocalizedField(stop.title);
    const localizedTitle = lang ? { [lang]: title[lang] || title['en'] || '' } : title;

    const description = parseLocalizedField(stop.description);
    const localizedDescription = lang ? { [lang]: description[lang] || description['en'] || '' } : description;

    // Parse image field - handle both old string format and new object format
    let heroImage = null;
    try {
        if (stop.image) {
            const parsed = typeof stop.image === 'string' && stop.image.startsWith('{')
                ? JSON.parse(stop.image)
                : stop.image;

            // If it's an object (new format), include caption and credit
            if (typeof parsed === 'object' && parsed.url) {
                const imageUrl = formatImageUrl(parsed.url, baseUrl);
                if (imageUrl) {
                    heroImage = {
                        url: imageUrl,
                        caption: lang && parsed.caption ? { [lang]: parsed.caption[lang] || parsed.caption['en'] || '' } : parsed.caption,
                        credit: lang && parsed.credit ? { [lang]: parsed.credit[lang] || parsed.credit['en'] || '' } : parsed.credit,
                    };
                }
            } else if (typeof parsed === 'string') {
                // Legacy format - just a URL string
                const imageUrl = formatImageUrl(parsed, baseUrl);
                if (imageUrl) {
                    heroImage = { url: imageUrl };
                }
            }
        }
    } catch {
        heroImage = null;
    }

    let contentBlocks = [];
    try {
        const parsed = stop.content ? JSON.parse(stop.content) : [];
        const cleaned = cleanContentBlocks(parsed);
        // Filter block language keys to only include tour languages
        contentBlocks = tourLanguages
            ? cleaned.map((b: any) => filterBlockLanguages(b, tourLanguages))
            : cleaned;

        // Resolve timelineGallery audioUrl from audioFiles when language is requested
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        contentBlocks = contentBlocks.map((b: any) => {
            if (b.type === 'timelineGallery' && b.data?.audioFiles && lang) {
                const resolved = b.data.audioFiles[lang] || b.data.audioFiles['en'] || b.data.audioUrl;
                if (resolved) {
                    return { ...b, data: { ...b.data, audioUrl: formatMediaUrl(resolved, baseUrl) } };
                }
            }
            return b;
        });

        // Resolve all relative /uploads/... URLs to absolute URLs
        if (baseUrl) {
            contentBlocks = contentBlocks.map((b: any) => resolveUrlsDeep(b, baseUrl));
        }
    } catch {
        contentBlocks = [];
    }

    let positioning = null;
    try {
        positioning = stop.positioning ? JSON.parse(stop.positioning) : null;
    } catch {
        positioning = null;
    }

    // Parse primaryPositioning (QR code, NFC, etc.)
    let primaryPositioning = null;
    try {
        primaryPositioning = stop.primaryPositioning ? JSON.parse(stop.primaryPositioning) : null;
    } catch {
        primaryPositioning = null;
    }

    // Parse links
    let links = [];
    try { links = stop.links ? JSON.parse(stop.links) : []; } catch { /* */ }

    // Parse accessibility
    let stopAccessibility = null;
    try { stopAccessibility = stop.accessibility ? JSON.parse(stop.accessibility) : null; } catch { /* */ }

    return {
        id: stop.id,
        slug: stop.slug,
        short_code: stop.shortCode || (primaryPositioning?.shortCode ?? null),
        type: stop.type,
        title: localizedTitle,
        description: localizedDescription,
        hero_image: heroImage,
        order: stop.order,
        show_title: stop.showTitle ?? true,
        show_image: stop.showImage ?? true,
        show_description: stop.showDescription ?? true,
        content_blocks: contentBlocks,
        positioning: positioning,
        primary_positioning: primaryPositioning,
        links,
        accessibility: stopAccessibility,
        created_at: stop.createdAt.toISOString(),
        updated_at: stop.updatedAt.toISOString(),
    };
}

export default router;
