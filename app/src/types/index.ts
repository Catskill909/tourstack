// Core TypeScript types for TourStack

// =============================================================================
// MUSEUM & USER
// =============================================================================
export interface Museum {
  id: string;
  name: string;
  location?: string;
  logo?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TEMPLATES
// =============================================================================
export type FieldType =
  | 'text'
  | 'textarea'
  | 'richtext'
  | 'number'
  | 'date'
  | 'image'
  | 'audio'
  | 'video'
  | 'url'
  | 'list'
  | 'tags'
  | 'quiz';

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // For select/radio fields
  unit?: string; // For number fields (e.g., "feet", "years")
  multilingual?: boolean; // If true, has content per language
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  builtIn: boolean;
  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// POSITIONING / TRIGGERS
// =============================================================================
export type PositioningMethod =
  | 'qr_code'
  | 'gps'
  | 'ble_beacon'
  | 'ble_virtual'
  | 'nfc'
  | 'rfid'
  | 'wifi'
  | 'uwb'
  | 'image_recognition'
  | 'audio_watermark'
  | 'manual';

export interface QRCodeConfig {
  method: 'qr_code';
  url: string;
  shortCode: string;
}

export interface GPSConfig {
  method: 'gps';
  latitude: number;
  longitude: number;
  radius: number; // meters
  elevation?: number;
  mapProvider: 'google' | 'openstreetmap';
}

export interface BLEBeaconConfig {
  method: 'ble_beacon' | 'ble_virtual';
  uuid: string;
  major: number;
  minor: number;
  txPower?: number;
  radius: number; // estimated trigger radius
}

export interface NFCConfig {
  method: 'nfc';
  tagId: string;
  tagType?: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'MIFARE';
}

export interface RFIDConfig {
  method: 'rfid';
  tagId: string;
  isActive: boolean;
  frequency?: 'LF' | 'HF' | 'UHF';
}

export interface WiFiConfig {
  method: 'wifi';
  accessPoints: Array<{
    bssid: string;
    ssid: string;
    signalThreshold: number;
  }>;
}

export interface UWBConfig {
  method: 'uwb';
  anchorId: string;
  x: number;
  y: number;
  z?: number;
  radius: number;
}

export interface ImageRecognitionConfig {
  method: 'image_recognition';
  referenceImageUrl: string;
  confidence: number; // 0-1
}

export interface AudioWatermarkConfig {
  method: 'audio_watermark';
  watermarkId: string;
  frequency: number; // Hz
}

export interface ManualConfig {
  method: 'manual';
  instructions?: string;
}

export type PositioningConfig =
  | QRCodeConfig
  | GPSConfig
  | BLEBeaconConfig
  | NFCConfig
  | RFIDConfig
  | WiFiConfig
  | UWBConfig
  | ImageRecognitionConfig
  | AudioWatermarkConfig
  | ManualConfig;

export interface TriggerSettings {
  entryTrigger: boolean;
  exitTrigger: boolean;
  dwellTimeMs?: number; // Time before triggering
  autoAdvanceMs?: number; // Auto-advance to next stop
  notification: {
    sound: 'none' | 'chime' | 'ding' | 'bell';
    vibration: 'none' | 'short' | 'long' | 'pattern';
    visual: 'none' | 'banner' | 'modal' | 'subtle';
  };
}

// =============================================================================
// CONTENT
// =============================================================================
export interface LocalizedContent {
  [languageCode: string]: {
    text: string;
    audioUrl?: string;
    audioTranscript?: string;
    audioDuration?: number; // seconds
    videoUrl?: string;
    images: Array<{
      url: string;
      alt: string;
      caption?: string;
    }>;
  };
}

export interface Quiz {
  question: { [lang: string]: string };
  options: { [lang: string]: string[] };
  correctIndex: number;
  explanation?: { [lang: string]: string };
  points?: number;
}

export interface InteractiveElements {
  quiz?: Quiz;
  poll?: {
    question: { [lang: string]: string };
    options: { [lang: string]: string[] };
    results: { [optionIndex: string]: number };
  };
  challenge?: {
    type: 'scavenger_hunt' | 'photo_upload' | 'find_object';
    instructions: { [lang: string]: string };
  };
  funFacts?: { [lang: string]: string[] };
  relatedStops?: string[]; // IDs of related stops
}

// =============================================================================
// STOP / BEACON
// =============================================================================
export type StopType = 'mandatory' | 'optional' | 'bonus' | 'secret';

export interface Stop {
  id: string;
  tourId: string;
  order: number;
  type: StopType;

  // Base Template Fields (REQUIRED)
  title: { [lang: string]: string };
  image: string;
  description: { [lang: string]: string };

  // Custom Fields from Template
  customFieldValues: { [fieldId: string]: unknown };

  // Positioning
  primaryPositioning: PositioningConfig;
  backupPositioning?: PositioningConfig;
  triggers: TriggerSettings;

  // Content
  content: LocalizedContent;

  // Interactive
  interactive?: InteractiveElements;

  // Links
  links: Array<{
    label: string;
    url: string;
    type: 'website' | 'shop' | 'booking' | 'donation' | 'social';
    openInApp: boolean;
  }>;

  // Accessibility
  accessibility: {
    audioDescription?: string;
    tactileDescription?: string;
    largePrintAvailable: boolean;
    seatingNearby: boolean;
  };

  // Analytics (populated later)
  analytics?: {
    avgDwellTime: number;
    visitCount: number;
    interactionRate: number;
  };

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// TOUR
// =============================================================================
export type TourStatus = 'draft' | 'review' | 'testing' | 'scheduled' | 'published' | 'paused' | 'archived';
export type Difficulty = 'accessible' | 'family' | 'general' | 'academic' | 'children';

export interface Tour {
  id: string;
  museumId: string;
  templateId: string;
  status: TourStatus;

  // Base Template Fields (REQUIRED for all tours)
  title: { [lang: string]: string };
  heroImage: string;
  description: { [lang: string]: string };

  // Tour Settings
  languages: string[];
  primaryLanguage: string;
  duration: number; // minutes
  difficulty: Difficulty;

  // Positioning
  primaryPositioningMethod: PositioningMethod;
  backupPositioningMethod?: PositioningMethod;

  // Accessibility
  accessibility: {
    wheelchairAccessible: boolean;
    audioDescriptions: boolean;
    signLanguage: boolean;
    tactileElements: boolean;
    quietSpaceFriendly: boolean;
  };

  // Stops
  stops: string[]; // Stop IDs in order

  // Publishing
  publishedAt?: string;
  scheduledPublishAt?: string;
  version: number;

  // Analytics
  analytics?: {
    totalVisitors: number;
    completionRate: number;
    avgDuration: number;
    rating: number;
  };

  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// APP STATE
// =============================================================================
export interface AppState {
  currentMuseumId: string | null;
  tours: Tour[];
  stops: Stop[];
  templates: Template[];
  isLoading: boolean;
  error: string | null;
}

// =============================================================================
// APP SETTINGS
// =============================================================================
export interface MapAPISettings {
  googleMapsApiKey?: string;
  googleMapsEnabled: boolean;
  openStreetMapEnabled: boolean; // No API key needed for OSM
  defaultMapProvider: 'google' | 'openstreetmap';
}

export interface PositioningProviderSettings {
  estimoteApiKey?: string;
  kontaktApiKey?: string;
  customBleEnabled: boolean;
}

export interface MediaSettings {
  cloudinaryCloudName?: string;
  cloudinaryApiKey?: string;
  maxUploadSizeMb: number;
}

export interface AppSettings {
  id: string;
  museumId: string;

  // Map APIs
  maps: MapAPISettings;

  // Positioning Provider APIs (optional for advanced setups)
  positioning: PositioningProviderSettings;

  // Media Storage
  media: MediaSettings;

  // General Settings
  defaultLanguage: string;
  supportedLanguages: string[];
  analyticsEnabled: boolean;

  updatedAt: string;
}
