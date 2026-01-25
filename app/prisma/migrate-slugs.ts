// Migration script to add slugs to existing tours and stops
// Run with: npx tsx prisma/migrate-slugs.ts

import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

// Generate URL-friendly slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
        .replace(/\s+/g, '-')          // Spaces to hyphens
        .replace(/-+/g, '-')           // Multiple hyphens to single
        .substring(0, 50)              // Limit length
        .replace(/^-|-$/g, '') || 'untitled'; // Trim hyphens
}

async function migrateSlugs() {
    console.log('🔄 Migrating slugs for existing tours and stops...\n');

    // Migrate tours
    const tours = await prisma.tour.findMany();
    const tourSlugs = new Set<string>();

    for (const tour of tours) {
        if (tour.slug && tour.slug.length > 0) {
            tourSlugs.add(tour.slug);
            console.log(`  ✓ Tour "${tour.id}" already has slug: ${tour.slug}`);
            continue;
        }

        const title = JSON.parse(tour.title);
        const titleText = title.en || Object.values(title)[0] || 'Untitled';
        let baseSlug = generateSlug(titleText);
        let slug = baseSlug;
        let counter = 1;

        // Ensure unique
        while (tourSlugs.has(slug)) {
            slug = `${baseSlug}-${counter++}`;
        }
        tourSlugs.add(slug);

        await prisma.tour.update({
            where: { id: tour.id },
            data: { slug },
        });

        console.log(`  ✅ Tour "${titleText}" → ${slug}`);
    }

    // Migrate stops
    const stops = await prisma.stop.findMany({ include: { tour: true } });
    const stopSlugsPerTour = new Map<string, Set<string>>();

    for (const stop of stops) {
        if (!stopSlugsPerTour.has(stop.tourId)) {
            stopSlugsPerTour.set(stop.tourId, new Set());
        }
        const tourStopSlugs = stopSlugsPerTour.get(stop.tourId)!;

        if (stop.slug && stop.slug.length > 0) {
            tourStopSlugs.add(stop.slug);
            console.log(`  ✓ Stop "${stop.id}" already has slug: ${stop.slug}`);
            continue;
        }

        const title = JSON.parse(stop.title);
        const titleText = title.en || Object.values(title)[0] || 'Untitled';
        let baseSlug = generateSlug(titleText);
        let slug = baseSlug;
        let counter = 1;

        // Ensure unique within tour
        while (tourStopSlugs.has(slug)) {
            slug = `${baseSlug}-${counter++}`;
        }
        tourStopSlugs.add(slug);

        // Also update the URL in primaryPositioning
        const positioning = JSON.parse(stop.primaryPositioning);
        if (positioning.url && stop.tour) {
            // Get tour slug
            const tourSlug = stop.tour.slug || 'unknown';
            const baseUrl = positioning.url.split('/visitor/')[0];
            const token = positioning.url.includes('?t=')
                ? positioning.url.split('?t=')[1]
                : Math.random().toString(36).substring(2, 10);
            positioning.url = `${baseUrl}/visitor/tour/${tourSlug}/stop/${slug}?t=${token}`;
        }

        await prisma.stop.update({
            where: { id: stop.id },
            data: {
                slug,
                primaryPositioning: JSON.stringify(positioning),
            },
        });

        console.log(`  ✅ Stop "${titleText}" → ${slug} (URL updated)`);
    }

    console.log('\n✨ Migration complete!');
}

migrateSlugs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
