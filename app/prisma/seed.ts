import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma';

// Set up SQLite connection with the adapter - path is relative to app root
const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

// Built-in templates for different museum types
const builtInTemplates = [
    {
        name: 'Artwork',
        description: 'Perfect for art museums and galleries. Includes fields for artist, medium, dimensions, and provenance.',
        icon: '🎨',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'artist', name: 'artist', label: 'Artist', type: 'text', required: true },
            { id: 'year', name: 'year', label: 'Year Created', type: 'number', required: false, unit: 'year' },
            { id: 'medium', name: 'medium', label: 'Medium', type: 'text', required: false },
            { id: 'dimensions', name: 'dimensions', label: 'Dimensions', type: 'text', required: false },
            { id: 'provenance', name: 'provenance', label: 'Provenance', type: 'textarea', required: false },
            { id: 'movement', name: 'movement', label: 'Art Movement', type: 'text', required: false },
        ]),
    },
    {
        name: 'Artifact',
        description: 'For historical and archaeological museums. Includes fields for era, origin, and historical context.',
        icon: '🏺',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'era', name: 'era', label: 'Era/Period', type: 'text', required: true },
            { id: 'origin', name: 'origin', label: 'Place of Origin', type: 'text', required: true },
            { id: 'material', name: 'material', label: 'Material', type: 'text', required: false },
            { id: 'discovered', name: 'discovered', label: 'Date Discovered', type: 'date', required: false },
            { id: 'context', name: 'context', label: 'Historical Context', type: 'richtext', required: false },
        ]),
    },
    {
        name: 'Natural History',
        description: 'For natural history and science museums. Includes fields for species, habitat, and conservation status.',
        icon: '🦖',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'species', name: 'species', label: 'Species Name', type: 'text', required: true },
            { id: 'scientificName', name: 'scientificName', label: 'Scientific Name', type: 'text', required: true },
            { id: 'habitat', name: 'habitat', label: 'Habitat', type: 'text', required: false },
            { id: 'conservationStatus', name: 'conservationStatus', label: 'Conservation Status', type: 'text', required: false },
            { id: 'funFacts', name: 'funFacts', label: 'Fun Facts', type: 'list', required: false },
        ]),
    },
    {
        name: 'Interactive Science',
        description: 'For science centers with hands-on exhibits. Includes fields for experiments and learning objectives.',
        icon: '🔬',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'concept', name: 'concept', label: 'Scientific Concept', type: 'text', required: true },
            { id: 'instructions', name: 'instructions', label: 'How to Use', type: 'richtext', required: true },
            { id: 'learningObjectives', name: 'learningObjectives', label: 'Learning Objectives', type: 'list', required: false },
            { id: 'ageRange', name: 'ageRange', label: 'Recommended Age', type: 'text', required: false },
            { id: 'quiz', name: 'quiz', label: 'Quiz Question', type: 'quiz', required: false },
        ]),
    },
    {
        name: 'Historic Site',
        description: 'For outdoor historic sites and walking tours. Includes GPS and historical event fields.',
        icon: '🏛️',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'historicalEvent', name: 'historicalEvent', label: 'Historical Event', type: 'text', required: false },
            { id: 'date', name: 'date', label: 'Date', type: 'text', required: false },
            { id: 'significance', name: 'significance', label: 'Historical Significance', type: 'richtext', required: true },
            { id: 'thenAndNow', name: 'thenAndNow', label: 'Then & Now', type: 'textarea', required: false },
        ]),
    },
    {
        name: 'Botanical Garden',
        description: 'For botanical gardens and arboretums. Includes fields for plant species and care information.',
        icon: '🌿',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'commonName', name: 'commonName', label: 'Common Name', type: 'text', required: true },
            { id: 'scientificName', name: 'scientificName', label: 'Scientific Name', type: 'text', required: true },
            { id: 'family', name: 'family', label: 'Plant Family', type: 'text', required: false },
            { id: 'nativeRegion', name: 'nativeRegion', label: 'Native Region', type: 'text', required: false },
            { id: 'bloomingSeason', name: 'bloomingSeason', label: 'Blooming Season', type: 'text', required: false },
            { id: 'careInfo', name: 'careInfo', label: 'Care Information', type: 'textarea', required: false },
        ]),
    },
];

async function main() {
    console.log('🌱 Seeding database with built-in templates...');

    for (const template of builtInTemplates) {
        const existing = await prisma.template.findFirst({
            where: { name: template.name, builtIn: true },
        });

        if (!existing) {
            await prisma.template.create({
                data: template,
            });
            console.log(`  ✓ Created template: ${template.name}`);
        } else {
            console.log(`  ⏭ Template already exists: ${template.name}`);
        }
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
