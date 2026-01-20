/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma';
import path from 'path';

// Set up SQLite connection - use data directory for Docker compatibility
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`,
        },
    },
});

// Built-in templates based on positioning technology
const builtInTemplates = [
    {
        name: 'QR Code',
        description: 'Zero hardware cost. Visitors scan codes with their camera. Perfect for getting started quickly.',
        icon: '📱',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'qrSize', name: 'qrSize', label: 'QR Code Size', type: 'text', required: false },
            { id: 'placement', name: 'placement', label: 'Placement Notes', type: 'textarea', required: false },
            { id: 'shortCode', name: 'shortCode', label: 'Short URL Code', type: 'text', required: false },
        ]),
    },
    {
        name: 'GPS / Lat-Long',
        description: 'For outdoor exhibits, sculpture gardens, and archaeological sites. Uses device GPS with geofencing.',
        icon: '📍',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'latitude', name: 'latitude', label: 'Latitude', type: 'number', required: true },
            { id: 'longitude', name: 'longitude', label: 'Longitude', type: 'number', required: true },
            { id: 'radius', name: 'radius', label: 'Trigger Radius (meters)', type: 'number', required: true, unit: 'm' },
            { id: 'elevation', name: 'elevation', label: 'Elevation', type: 'number', required: false, unit: 'm' },
        ]),
    },
    {
        name: 'BLE Beacon',
        description: 'Indoor positioning using Bluetooth Low Energy beacons. ±1.5-3 meter accuracy with triangulation.',
        icon: '📶',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'uuid', name: 'uuid', label: 'Beacon UUID', type: 'text', required: true },
            { id: 'major', name: 'major', label: 'Major Value', type: 'number', required: true },
            { id: 'minor', name: 'minor', label: 'Minor Value', type: 'number', required: true },
            { id: 'txPower', name: 'txPower', label: 'TX Power', type: 'number', required: false },
            { id: 'triggerRadius', name: 'triggerRadius', label: 'Trigger Radius (m)', type: 'number', required: false, unit: 'm' },
        ]),
    },
    {
        name: 'NFC',
        description: 'Tap-to-trigger with Near Field Communication. Ultra-short range, no battery required, very cost-effective.',
        icon: '📲',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'tagId', name: 'tagId', label: 'NFC Tag ID', type: 'text', required: true },
            { id: 'tagType', name: 'tagType', label: 'Tag Type', type: 'text', required: false },
            { id: 'tapInstructions', name: 'tapInstructions', label: 'Tap Instructions', type: 'textarea', required: false },
        ]),
    },
    {
        name: 'RFID',
        description: 'Radio Frequency Identification for medium-range tracking. Great for artifact tracking + visitor triggers.',
        icon: '🔖',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'tagId', name: 'tagId', label: 'RFID Tag ID', type: 'text', required: true },
            { id: 'frequency', name: 'frequency', label: 'Frequency (LF/HF/UHF)', type: 'text', required: false },
            { id: 'isActive', name: 'isActive', label: 'Active Tag?', type: 'text', required: false },
        ]),
    },
    {
        name: 'WiFi Positioning',
        description: 'Uses existing WiFi infrastructure for triangulation. 5-15 meter accuracy, lower cost if WiFi installed.',
        icon: '📡',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'accessPoints', name: 'accessPoints', label: 'Access Point BSSIDs', type: 'textarea', required: true },
            { id: 'signalThreshold', name: 'signalThreshold', label: 'Signal Threshold (dBm)', type: 'number', required: false },
        ]),
    },
    {
        name: 'Ultra-Wideband (UWB)',
        description: 'Highest accuracy at ±10-50cm. Real-time positioning for premium installations.',
        icon: '🎯',
        builtIn: true,
        customFields: JSON.stringify([
            { id: 'anchorId', name: 'anchorId', label: 'UWB Anchor ID', type: 'text', required: true },
            { id: 'xCoord', name: 'xCoord', label: 'X Coordinate', type: 'number', required: true },
            { id: 'yCoord', name: 'yCoord', label: 'Y Coordinate', type: 'number', required: true },
            { id: 'zCoord', name: 'zCoord', label: 'Z Coordinate', type: 'number', required: false },
            { id: 'radius', name: 'radius', label: 'Trigger Radius (cm)', type: 'number', required: false, unit: 'cm' },
        ]),
    },
];

async function main() {
    console.log('🌱 Seeding database with technology-based templates...');

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
