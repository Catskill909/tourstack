// Positioning Config Validation — Zod schemas matching TypeScript interfaces
// Used by stops.ts (write validation) and visitor.ts (safe parse on read)
import { z } from 'zod';

export const QRCodeConfigSchema = z.object({
    method: z.literal('qr_code'),
    url: z.string(),
    shortCode: z.string().min(1).max(10),
});

export const NFCConfigSchema = z.object({
    method: z.literal('nfc'),
    tagId: z.string(),
    tagType: z.enum(['NTAG213', 'NTAG215', 'NTAG216', 'MIFARE']).optional(),
});

export const GPSConfigSchema = z.object({
    method: z.literal('gps'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radius: z.number().min(1).max(1000),
    elevation: z.number().optional(),
    mapProvider: z.enum(['google', 'openstreetmap']),
});

export const BLEBeaconConfigSchema = z.object({
    method: z.enum(['ble_beacon', 'ble_virtual']),
    uuid: z.string().min(1),
    major: z.number().int().min(0).max(65535),
    minor: z.number().int().min(0).max(65535),
    txPower: z.number().optional(),
    radius: z.number().min(0),
});

export const RFIDConfigSchema = z.object({
    method: z.literal('rfid'),
    tagId: z.string(),
    isActive: z.boolean(),
    frequency: z.enum(['LF', 'HF', 'UHF']).optional(),
});

export const WiFiConfigSchema = z.object({
    method: z.literal('wifi'),
    accessPoints: z.array(z.object({
        bssid: z.string(),
        ssid: z.string(),
        signalThreshold: z.number(),
    })),
});

export const UWBConfigSchema = z.object({
    method: z.literal('uwb'),
    anchorId: z.string(),
    x: z.number(),
    y: z.number(),
    z: z.number().optional(),
    radius: z.number().min(0),
});

export const ImageRecognitionConfigSchema = z.object({
    method: z.literal('image_recognition'),
    referenceImageUrl: z.string(),
    confidence: z.number().min(0).max(1),
});

export const AudioWatermarkConfigSchema = z.object({
    method: z.literal('audio_watermark'),
    watermarkId: z.string(),
    frequency: z.number(),
});

export const ManualConfigSchema = z.object({
    method: z.literal('manual'),
    instructions: z.string().optional(),
});

// Union discriminated by `method` field
export const PositioningConfigSchema = z.discriminatedUnion('method', [
    QRCodeConfigSchema,
    NFCConfigSchema,
    GPSConfigSchema,
    BLEBeaconConfigSchema,
    RFIDConfigSchema,
    WiFiConfigSchema,
    UWBConfigSchema,
    ImageRecognitionConfigSchema,
    AudioWatermarkConfigSchema,
    ManualConfigSchema,
]);

export type PositioningConfig = z.infer<typeof PositioningConfigSchema>;

// Safe parse helper — returns parsed data or null (never throws)
export function safeParsePositioning(json: string): PositioningConfig | null {
    try {
        const raw = JSON.parse(json);
        const result = PositioningConfigSchema.safeParse(raw);
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}
