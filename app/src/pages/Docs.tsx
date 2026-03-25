import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Book,
    Rocket,
    Map as MapIcon,
    Mic,
    QrCode,
    Layers,
    Globe,
    Image,
    Play,
    X,
    Menu,
    Lightbulb,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Users,
    FileText,
    Volume2,
    Languages,
    Smartphone,
    MousePointerClick,
    PlusCircle,
    Pencil,
    Eye,
    Monitor,
    Send,
    FolderOpen,
    Upload,
    Bot,
    Camera,
    MessageCircle,
    MapPin,
    Video,
    Quote,
    Clock,
    ArrowLeftRight,
    Radio,
    Settings,
    Navigation,
    Target,
    LayoutGrid,
    Crosshair,
    ZoomIn,
    Save,
    Crop
} from 'lucide-react';

// Types
interface DocPage {
    slug: string;
    title: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
}

interface DocSection {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    items: DocPage[];
}

// Documentation structure with descriptions
const docsStructure: DocSection[] = [
    {
        title: 'Getting Started',
        icon: Rocket,
        description: 'Learn the basics and create your first tour',
        items: [
            { slug: 'welcome', title: 'Welcome to TourStack', description: 'Everything you need to know', icon: Book },
            { slug: 'your-first-tour', title: 'Create Your First Tour', description: 'Step-by-step walkthrough', icon: MapIcon },
            { slug: 'understanding-stops', title: 'Understanding Stops', description: 'How stops work in tours', icon: Layers },
        ]
    },
    {
        title: 'Content Creation',
        icon: FileText,
        description: 'Build engaging tour experiences',
        items: [
            { slug: 'adding-text', title: 'Adding Text Content', description: 'Write compelling descriptions', icon: Pencil },
            { slug: 'images-galleries', title: 'Images & Galleries', description: 'Visual storytelling', icon: Image },
            { slug: 'audio-narration', title: 'Audio Narration', description: 'Voice guides for visitors', icon: Volume2 },
            { slug: 'timeline-gallery', title: 'Timeline Gallery', description: 'Audio-synced slideshows', icon: Play },
            { slug: 'maps-location', title: 'Maps & Location', description: 'Interactive maps with markers', icon: MapPin },
            { slug: 'content-blocks', title: 'All Content Blocks', description: 'Complete block reference', icon: Layers },
        ]
    },
    {
        title: 'Collections & Media',
        icon: FolderOpen,
        description: 'Organize and manage your assets',
        items: [
            { slug: 'media-library', title: 'Media Library', description: 'Upload and organize files', icon: Upload },
            { slug: 'collections', title: 'Collections', description: 'Image, audio & document groups', icon: FolderOpen },
        ]
    },
    {
        title: 'Visitor Experience',
        icon: Smartphone,
        description: 'How visitors interact with your tours',
        items: [
            { slug: 'qr-codes', title: 'QR Codes', description: 'Print and display codes', icon: QrCode },
            { slug: 'nfc-tags', title: 'NFC Tags', description: 'Tap-to-open with NFC cards', icon: Radio },
            { slug: 'gps-geofencing', title: 'GPS Geofencing', description: 'Auto-navigate with GPS location triggers', icon: Navigation },
            { slug: 'visitor-view', title: 'The Visitor View', description: 'What visitors see', icon: Eye },
            { slug: 'kiosk-mode', title: 'Kiosk Mode', description: 'Museum display & device options', icon: Monitor },
            { slug: 'staff-handoff', title: 'Staff Handoff', description: 'Hand devices to visitors with one tap', icon: Smartphone },
            { slug: 'offline-export', title: 'Offline Export', description: 'Download tours for no-WiFi devices', icon: Target },
            { slug: 'publishing', title: 'Publishing Your Tour', description: 'Draft to published workflow', icon: Send },
        ]
    },
    {
        title: 'Languages & Translation',
        icon: Languages,
        description: 'Reach visitors in any language',
        items: [
            { slug: 'multilingual', title: 'Multiple Languages', description: 'Reach all visitors', icon: Globe },
            { slug: 'magic-translate', title: 'Magic Translate', description: 'One-click AI translation', icon: Sparkles },
        ]
    },
    {
        title: 'AI Features',
        icon: Sparkles,
        description: 'Smart tools that save you time',
        items: [
            { slug: 'ai-audio', title: 'AI Audio Generation', description: 'Text-to-speech with 3 providers', icon: Mic },
            { slug: 'ai-image-analysis', title: 'AI Image Analysis', description: 'Smart tags and object detection', icon: Camera },
            { slug: 'ai-concierge', title: 'AI Concierge', description: 'Visitor chatbot assistant', icon: Bot },
        ]
    },
];

// Get all pages in order for navigation
const allPages = docsStructure.flatMap(section =>
    section.items.map(item => ({ ...item, section: section.title }))
);

// ============================================
// DOCUMENTATION CONTENT
// ============================================

const DocsHome = () => {
    const navigate = useNavigate();

    return (
        <div className="space-y-12">
            {/* Hero */}
            <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
                    <Book className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">
                    TourStack Help Center
                </h1>
                <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
                    Everything you need to create amazing museum tours.
                    Simple guides for curators, docents, and museum staff.
                </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/docs/your-first-tour')}
                    className="group p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm text-neutral-500">5 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:translate-x-1 transition-transform">
                        Create Your First Tour
                    </h3>
                    <p className="text-neutral-400 text-sm">
                        Start here. We'll walk you through creating a complete tour step by step.
                    </p>
                </button>

                <button
                    onClick={() => navigate('/docs/qr-codes')}
                    className="group p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <QrCode className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm text-neutral-500">3 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:translate-x-1 transition-transform">
                        Set Up QR Codes
                    </h3>
                    <p className="text-neutral-400 text-sm">
                        Print QR codes so visitors can access tour content on their phones.
                    </p>
                </button>

                <button
                    onClick={() => navigate('/docs/magic-translate')}
                    className="group p-6 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 hover:border-white/20 rounded-2xl text-left transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-sm text-neutral-500">2 min read</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:translate-x-1 transition-transform">
                        Translate in Seconds
                    </h3>
                    <p className="text-neutral-400 text-sm">
                        Use AI to instantly translate your tour into multiple languages.
                    </p>
                </button>
            </div>

            {/* Browse by Topic */}
            <div>
                <h2 className="text-2xl font-semibold text-white mb-6">Browse by Topic</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {docsStructure.map(section => (
                        <div
                            key={section.title}
                            className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <section.icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{section.title}</h3>
                                    <p className="text-sm text-neutral-500">{section.description}</p>
                                </div>
                            </div>
                            <ul className="space-y-2">
                                {section.items.map(item => (
                                    <li key={item.slug}>
                                        <Link
                                            to={`/docs/${item.slug}`}
                                            className="flex items-center justify-between py-2 px-3 -mx-3 rounded-lg hover:bg-white/5 text-neutral-400 hover:text-white transition-colors group"
                                        >
                                            <span>{item.title}</span>
                                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tips Banner */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/5 shrink-0">
                        <Lightbulb className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-1">Tip: Use Keyboard Shortcuts</h3>
                        <p className="text-neutral-400 text-sm">
                            Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs mx-1">⌘K</kbd> anywhere to search the docs.
                            Use <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs mx-1">←</kbd> <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs mx-1">→</kbd> arrow keys to navigate between pages.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Individual page content components
const WelcomePage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to TourStack</h1>
            <p className="text-xl text-neutral-400">
                The complete platform for creating and managing museum tours with AI-powered tools.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is TourStack?</h2>
            <p className="text-neutral-300 mb-4">
                TourStack is an all-in-one platform for museum staff to create self-guided tours.
                Visitors scan a QR code with their phone to access rich multimedia content -
                no app download required. It works in any mobile browser.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white/5 rounded-xl">
                    <Users className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">For Staff</h3>
                    <p className="text-sm text-neutral-400">Create and manage tours, collections, and media from one dashboard</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                    <Smartphone className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">For Visitors</h3>
                    <p className="text-sm text-neutral-400">Scan a QR code to access the tour on any phone or tablet</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                    <Globe className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">195+ Languages</h3>
                    <p className="text-sm text-neutral-400">AI translation with Google Cloud or LibreTranslate</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Key Concepts</h2>
            <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="p-2 h-fit rounded-lg bg-white/5">
                        <MapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white mb-1">Tours</h3>
                        <p className="text-neutral-400 text-sm">
                            A tour is a collection of stops. Think of it like a gallery walk or a themed path
                            through your museum. Examples: "Highlights Tour", "Family Discovery Trail", "Impressionist Gallery".
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="p-2 h-fit rounded-lg bg-white/5">
                        <Layers className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white mb-1">Stops</h3>
                        <p className="text-neutral-400 text-sm">
                            Each stop represents a location - an artwork, exhibit, or point of interest.
                            Stops contain content blocks: text, images, audio, video, maps, and more.
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="p-2 h-fit rounded-lg bg-white/5">
                        <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-medium text-white mb-1">Content Blocks</h3>
                        <p className="text-neutral-400 text-sm">
                            Stops are built from 13 block types - text, images, galleries, audio, video,
                            timeline galleries, maps, image maps, quotes, and more. Drag to reorder. Mix and match freely.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">AI Audio (3 Providers)</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Generate narration with Deepgram, ElevenLabs, or Google Cloud TTS in 32+ languages</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <FolderOpen className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">Collections</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Organize images, audio, and documents into collections with AI analysis</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Upload className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">Media Library</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Central hub for all uploaded files with search, tags, and AI analysis</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">Kiosk Mode</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Deploy tours on museum kiosks with fullscreen, auto-restart, and chatbot</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Camera className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">AI Image Analysis</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Object detection, OCR, color palettes, and smart tagging via Google Vision</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="w-4 h-4 text-white" />
                        <h3 className="font-medium text-white text-sm">AI Concierge</h3>
                    </div>
                    <p className="text-xs text-neutral-400">Visitor chatbot powered by Gemini AI with custom knowledge sources</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-3 rounded-xl bg-white/5">
                <Rocket className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Ready to start?</h3>
                <p className="text-neutral-400 text-sm">Create your first tour in just 5 minutes.</p>
            </div>
            <Link
                to="/docs/your-first-tour"
                className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
            >
                Get Started
            </Link>
        </div>
    </div>
);

const FirstTourPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Create Your First Tour</h1>
            <p className="text-xl text-neutral-400">
                Follow this step-by-step guide to create a complete tour in about 5 minutes.
            </p>
        </header>

        {/* Progress Steps */}
        <div className="space-y-6">
            {/* Step 1 */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold text-sm">
                        1
                    </div>
                    <h2 className="text-xl font-semibold text-white">Create a New Tour</h2>
                </div>
                <div className="ml-12 space-y-4">
                    <p className="text-neutral-300">
                        From the Dashboard, click the <strong className="text-white">"Create Tour"</strong> button in the top right corner.
                    </p>
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                        <p className="text-sm text-neutral-400 mb-2">Fill in the details:</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-neutral-300"><strong className="text-white">Title:</strong> Give your tour a name (e.g., "Highlights Tour")</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-neutral-300"><strong className="text-white">Description:</strong> Brief overview of what visitors will see</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-neutral-300"><strong className="text-white">Language:</strong> Pick your primary language</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold text-sm">
                        2
                    </div>
                    <h2 className="text-xl font-semibold text-white">Add Your First Stop</h2>
                </div>
                <div className="ml-12 space-y-4">
                    <p className="text-neutral-300">
                        After creating the tour, you'll see the tour detail page. Click <strong className="text-white">"Add Stop"</strong> to create your first location.
                    </p>
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                        <p className="text-sm text-neutral-400 mb-2">Enter stop information:</p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-neutral-300"><strong className="text-white">Title:</strong> The name of the artwork or exhibit</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                                <span className="text-neutral-300"><strong className="text-white">Stop Number:</strong> Order in the tour (1, 2, 3...)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold text-sm">
                        3
                    </div>
                    <h2 className="text-xl font-semibold text-white">Add Content to the Stop</h2>
                </div>
                <div className="ml-12 space-y-4">
                    <p className="text-neutral-300">
                        Click on your new stop to open the editor. Click <strong className="text-white">"Add Block"</strong> to add content.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                            <Pencil className="w-5 h-5 text-white mb-2" />
                            <h4 className="font-medium text-white text-sm mb-1">Text Block</h4>
                            <p className="text-xs text-neutral-500">Write about the artwork - history, artist, interesting facts</p>
                        </div>
                        <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                            <Image className="w-5 h-5 text-white mb-2" />
                            <h4 className="font-medium text-white text-sm mb-1">Image Block</h4>
                            <p className="text-xs text-neutral-500">Upload photos or detail shots</p>
                        </div>
                        <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                            <Volume2 className="w-5 h-5 text-white mb-2" />
                            <h4 className="font-medium text-white text-sm mb-1">Audio Block</h4>
                            <p className="text-xs text-neutral-500">Add narration or commentary</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black font-bold text-sm">
                        4
                    </div>
                    <h2 className="text-xl font-semibold text-white">Preview & Print QR Code</h2>
                </div>
                <div className="ml-12 space-y-4">
                    <p className="text-neutral-300">
                        Click the <strong className="text-white">"Preview"</strong> button to see exactly what visitors will see on their phones.
                        When you're happy with it, go to the Positioning tab to download the QR code.
                    </p>
                    <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <p className="text-green-300 text-sm">
                            That's it! Print the QR code and place it near the artwork. Visitors scan it to access your tour.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Pro Tip</h3>
                <p className="text-neutral-400 text-sm">
                    Start with just 3-5 stops for your first tour. You can always add more later.
                    It's better to have a few well-crafted stops than many incomplete ones.
                </p>
            </div>
        </div>
    </div>
);

const UnderstandingStopsPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Understanding Stops</h1>
            <p className="text-xl text-neutral-400">
                Stops are the building blocks of every tour. Each stop represents one location or artwork.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is a Stop?</h2>
            <p className="text-neutral-300 mb-4">
                Think of a stop as one "page" in your tour that visitors see when they scan a QR code.
                Each stop can contain multiple pieces of content - text, images, audio - arranged however you like.
            </p>
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                <p className="text-sm text-neutral-400">Example stops in an art museum:</p>
                <ul className="mt-2 space-y-1 text-sm text-neutral-300">
                    <li>• Stop 1: Mona Lisa - Main Gallery</li>
                    <li>• Stop 2: Starry Night - Impressionist Wing</li>
                    <li>• Stop 3: The Scream - Modern Art Section</li>
                </ul>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Anatomy of a Stop</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Basic Info</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li><span className="text-white">Title:</span> Name of the artwork/exhibit</li>
                        <li><span className="text-white">Stop Number:</span> Position in tour order</li>
                        <li><span className="text-white">Description:</span> Brief summary</li>
                    </ul>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Content Blocks</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li><span className="text-white">Text:</span> Written content</li>
                        <li><span className="text-white">Images:</span> Photos and galleries</li>
                        <li><span className="text-white">Audio:</span> Narration and sounds</li>
                    </ul>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Positioning</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li><span className="text-white">QR Code:</span> Unique scannable code</li>
                        <li><span className="text-white">Short Code:</span> 6-character ID</li>
                    </ul>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Status</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li><span className="text-white">Draft:</span> Only visible to staff</li>
                        <li><span className="text-white">Published:</span> Visible to visitors</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const QRCodesPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">QR Codes</h1>
            <p className="text-xl text-neutral-400">
                QR codes let visitors access your tour content instantly on their phones.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <QrCode className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">1. Download</h3>
                    <p className="text-sm text-neutral-400">Get the QR code from the stop's Positioning tab</p>
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="6" y="3" width="12" height="18" rx="2" />
                            <line x1="9" y1="18" x2="15" y2="18" />
                        </svg>
                    </div>
                    <h3 className="font-medium text-white mb-1">2. Print & Display</h3>
                    <p className="text-sm text-neutral-400">Print and place near the artwork</p>
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <MousePointerClick className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">3. Visitors Scan</h3>
                    <p className="text-sm text-neutral-400">Content opens instantly on their phone</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Accessing QR Codes</h2>
            <div className="space-y-4">
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">1</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Open the Stop</h3>
                            <p className="text-sm text-neutral-400">Navigate to Tours → Select Tour → Click on the Stop</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">2</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Click Positioning Settings</h3>
                            <p className="text-sm text-neutral-400">Click the QR code icon button on the stop card, or use the Positioning Settings button</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">3</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Go to QR Code Tab</h3>
                            <p className="text-sm text-neutral-400">Select the "QR Code" tab in the Positioning Settings modal</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">4</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Download PNG</h3>
                            <p className="text-sm text-neutral-400">Click "Download QR Code" to get a print-ready 500×500px PNG file</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">QR Code Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Unique URLs</h3>
                    <p className="text-sm text-neutral-400">
                        Each stop gets a unique URL with a tracking token. This allows you to track which QR codes are being scanned.
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Short Codes</h3>
                    <p className="text-sm text-neutral-400">
                        Every QR code includes a 6-character short code (e.g., "ABC123") that visitors can type manually if scanning fails.
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Regenerate</h3>
                    <p className="text-sm text-neutral-400">
                        Click "Regenerate" to create a completely new QR code with a fresh URL and short code. Useful if a code is compromised.
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Test Button</h3>
                    <p className="text-sm text-neutral-400">
                        Click "Test" to open the visitor URL in a new tab and verify the QR code works correctly before printing.
                    </p>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Printing Tips</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Print at least 2 inches (5cm) square for reliable scanning</li>
                    <li>• Use matte finish to reduce glare from gallery lighting</li>
                    <li>• Test the QR code after printing to ensure it works</li>
                    <li>• Include the short code below the QR code as a backup</li>
                    <li>• Place at eye level, 3-4 feet from the exhibit</li>
                </ul>
            </div>
        </div>

        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <h3 className="font-semibold text-blue-400 mb-2">💡 Also Consider: NFC Tags</h3>
            <p className="text-neutral-300 text-sm mb-3">
                For a more seamless experience, you can also use NFC tags alongside QR codes. Visitors simply tap their phone
                on the tag — no camera needed. NFC tags are small, discreet, and feel magical to use.
            </p>
            <a href="/docs/nfc-tags" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                Learn about NFC Tags <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    </div>
);

const NFCTagsPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">NFC Tags</h1>
            <p className="text-xl text-neutral-400">
                Let visitors tap their phone on an NFC sticker or card to instantly open tour content.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is NFC?</h2>
            <p className="text-neutral-300 mb-4">
                NFC (Near Field Communication) allows phones to read data from small tags when held close (within 1-4cm).
                Unlike QR codes which require pointing a camera, NFC is a simple tap gesture that feels magical to visitors.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <h3 className="font-medium text-white text-sm">Tap to Open</h3>
                    <p className="text-xs text-neutral-400">No camera needed</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl mb-2">⚡</div>
                    <h3 className="font-medium text-white text-sm">Instant</h3>
                    <p className="text-xs text-neutral-400">Opens in under 1 second</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl text-center">
                    <div className="text-2xl mb-2">🎯</div>
                    <h3 className="font-medium text-white text-sm">Discreet</h3>
                    <p className="text-xs text-neutral-400">Small stickers or cards</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Programming NFC Tags</h2>
            <p className="text-neutral-300 mb-4">
                TourStack provides two methods to program NFC tags with your tour stop URLs:
            </p>

            <div className="space-y-4">
                <div className="p-5 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/20 text-green-400 text-sm font-bold">1</div>
                        <div>
                            <h3 className="font-medium text-green-400 mb-1">Direct Write (Chrome Android)</h3>
                            <p className="text-sm text-neutral-400 mb-2">
                                If you're using Chrome on an Android phone, you can write directly to NFC tags from TourStack:
                            </p>
                            <ol className="text-sm text-neutral-400 space-y-1 ml-4">
                                <li>1. Open the stop → Positioning Settings → NFC tab</li>
                                <li>2. Click <strong className="text-white">"Write to NFC Tag"</strong></li>
                                <li>3. Hold your NFC tag to the back of your phone</li>
                                <li>4. Wait for the success confirmation</li>
                            </ol>
                            <p className="text-xs text-amber-400 mt-3">
                                ⚠️ Only works on Chrome for Android. Not available on iPhone, desktop, or other browsers.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">2</div>
                        <div>
                            <h3 className="font-medium text-blue-400 mb-1">NFC Tools App (Any Phone)</h3>
                            <p className="text-sm text-neutral-400 mb-2">
                                Works on both iPhone and Android using the free NFC Tools app:
                            </p>
                            <ol className="text-sm text-neutral-400 space-y-1 ml-4">
                                <li>1. Download <strong className="text-white">NFC Tools</strong> (free on App Store / Play Store)</li>
                                <li>2. In TourStack, go to NFC tab and click <strong className="text-white">"Copy URL"</strong></li>
                                <li>3. In NFC Tools: <strong className="text-white">Write → Add a record → URL/URI</strong></li>
                                <li>4. Paste the URL and tap <strong className="text-white">Write</strong></li>
                                <li>5. Hold your NFC tag to your phone</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Testing NFC Tags</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <p className="text-neutral-300 mb-4">
                    After programming, test your tag by tapping it with a phone:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                        <h3 className="font-medium text-white mb-2">iPhone (XS and newer)</h3>
                        <ul className="space-y-1 text-sm text-neutral-400">
                            <li>• Tap tag near top of phone</li>
                            <li>• Notification banner appears</li>
                            <li>• Tap banner to open Safari</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                        <h3 className="font-medium text-white mb-2">Android</h3>
                        <ul className="space-y-1 text-sm text-neutral-400">
                            <li>• Tap tag on back of phone</li>
                            <li>• Browser opens automatically</li>
                            <li>• No extra steps needed</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recommended NFC Tags</h2>
            <div className="space-y-3">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">NTAG213</h3>
                            <p className="text-sm text-neutral-400">144 bytes — Best for TourStack URLs</p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">Recommended</span>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">NTAG215</h3>
                            <p className="text-sm text-neutral-400">504 bytes — Longer URLs if needed</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">NTAG216</h3>
                            <p className="text-sm text-neutral-400">888 bytes — Complex data, vCards</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Placement Tips</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Place tags at waist-to-chest height for easy tapping</li>
                    <li>• Use anti-metal tags if mounting on metal surfaces</li>
                    <li>• Add a small "Tap here" icon or text near the tag</li>
                    <li>• Test each tag after installation</li>
                    <li>• Consider pairing with QR code for maximum compatibility</li>
                </ul>
            </div>
        </div>

        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <h3 className="font-semibold text-amber-400 mb-2">Device Compatibility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <h4 className="font-medium text-white mb-2">✅ Works Great</h4>
                    <ul className="text-neutral-400 space-y-1">
                        <li>• iPhone XS, XR, 11, 12, 13, 14, 15+</li>
                        <li>• Most Android phones (2015+)</li>
                        <li>• Samsung Galaxy S/Note series</li>
                        <li>• Google Pixel phones</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-medium text-white mb-2">⚠️ Limited Support</h4>
                    <ul className="text-neutral-400 space-y-1">
                        <li>• iPhone 7, 8, X — need NFC reader app open</li>
                        <li>• iPhone 6 and older — no NFC</li>
                        <li>• Budget Android phones — check specs</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const GPSGeofencingPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">GPS Geofencing</h1>
            <p className="text-xl text-neutral-400">
                Automatically trigger stop content when visitors walk into a GPS-defined zone. Perfect for outdoor tours, sculpture gardens, and archaeological sites.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">1. Set Location</h3>
                    <p className="text-sm text-neutral-400">Place a pin on the map and set a trigger radius around each stop</p>
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <Navigation className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">2. Visitors Walk</h3>
                    <p className="text-sm text-neutral-400">The visitor's phone monitors their GPS location as they explore</p>
                </div>
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-white mb-1">3. Auto-Navigate</h3>
                    <p className="text-sm text-neutral-400">When they enter a geofence zone, the stop content opens automatically</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Setting Up GPS Positioning</h2>
            <div className="space-y-4">
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">1</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Open Positioning Settings</h3>
                            <p className="text-sm text-neutral-400">Navigate to Tours → Select Tour → Click the positioning icon on any stop</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">2</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Select GPS Tab</h3>
                            <p className="text-sm text-neutral-400">Click the "GPS" tab in the Positioning Settings modal</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">3</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Set Coordinates</h3>
                            <p className="text-sm text-neutral-400">Use "Use My Location" for your current position, or "Open Map Editor" to search for an address and click to place a pin</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">4</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Set Trigger Radius</h3>
                            <p className="text-sm text-neutral-400">Use the slider to set how close a visitor must be (5m–200m) before the stop triggers</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">5</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Save Changes</h3>
                            <p className="text-sm text-neutral-400">Click "Save Changes" to store the GPS configuration for this stop</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">GPS Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Trigger Radius</h3>
                    <p className="text-sm text-neutral-400">
                        How close visitors must be to trigger the stop. Smaller radius (5–25m) for precise spots, larger (50–200m) for open outdoor areas.
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Map Provider</h3>
                    <p className="text-sm text-neutral-400">
                        Choose OpenStreetMap (free, no API key) or Google Maps (satellite views, requires API key in Settings).
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Map Editor</h3>
                    <p className="text-sm text-neutral-400">
                        Full-screen map with address search, click-to-place pins, drag markers, zoom controls, and a visual trigger zone circle.
                    </p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Use My Location</h3>
                    <p className="text-sm text-neutral-400">
                        One-click to set the stop's coordinates to your current GPS position. Great when you're on-site at the exhibit.
                    </p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Visitor Experience</h2>
            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl space-y-4">
                <p className="text-neutral-300">
                    When a visitor opens any stop on a GPS-enabled tour, they'll see a prompt to enable location services:
                </p>
                <div className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-green-500/10 shrink-0">
                            <Navigation className="w-4 h-4 text-green-400" />
                        </div>
                        <p className="text-sm text-neutral-400">
                            <strong className="text-white">Location prompt</strong> — A banner asks visitors to enable GPS for auto-navigation between stops
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-purple-500/10 shrink-0">
                            <Target className="w-4 h-4 text-purple-400" />
                        </div>
                        <p className="text-sm text-neutral-400">
                            <strong className="text-white">Geofence monitoring</strong> — Their phone continuously checks GPS position against all stop zones
                        </p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-sm text-neutral-400">
                            <strong className="text-white">Auto-navigate</strong> — When they walk into a geofence zone, the app automatically opens that stop's content
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Best Practices</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Use 25–50m radius for outdoor sculptures and garden stops</li>
                    <li>• Use 10–25m radius for clustered stops like building entrances</li>
                    <li>• GPS works best outdoors — for indoor use, consider QR codes or NFC instead</li>
                    <li>• Test the trigger radius on-site before publishing</li>
                    <li>• GPS accuracy varies by device — a wider radius is more forgiving</li>
                </ul>
            </div>
        </div>

        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
            <h3 className="font-semibold text-blue-400 mb-2">💡 Combine Methods</h3>
            <p className="text-neutral-300 text-sm mb-3">
                GPS works great alongside QR codes. Set GPS as the primary method for hands-free navigation,
                and QR codes as a backup for visitors who prefer to scan. Both can be configured on the same stop.
            </p>
            <a href="/docs/qr-codes" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
                Learn about QR Codes <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    </div>
);

const VisitorViewPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">The Visitor View</h1>
            <p className="text-xl text-neutral-400">
                What visitors see when they scan a QR code or tap an NFC tag to access your tour.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Clean Mobile Experience</h2>
            <p className="text-neutral-300 mb-4">
                The visitor view is designed for phones and tablets. It's clean, fast, and focused on content.
                No app download required - it works in any mobile browser.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">What Visitors See</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li>✓ Stop title and all content blocks</li>
                        <li>✓ Images, galleries, and video</li>
                        <li>✓ Audio player with controls</li>
                        <li>✓ Previous / Next stop navigation</li>
                        <li>✓ Progress dots showing position in tour</li>
                        <li>✓ Language switcher dropdown</li>
                    </ul>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">What's Hidden</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li>✗ Admin controls and edit buttons</li>
                        <li>✗ Draft / unpublished content</li>
                        <li>✗ Settings and configuration</li>
                        <li>✗ Analytics and media library</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Device Preview</h2>
            <p className="text-neutral-300 mb-4">
                Preview your content at real device resolutions before publishing. The admin preview
                renders at actual device pixels - what you see IS what visitors see.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                    <Smartphone className="w-6 h-6 text-white mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm">Phone</h3>
                    <p className="text-xs text-neutral-500">375 x 812px (iPhone)</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                    <Layers className="w-6 h-6 text-white mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm">Tablet</h3>
                    <p className="text-xs text-neutral-500">820 x 1180px (iPad)</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl text-center">
                    <Monitor className="w-6 h-6 text-white mx-auto mb-2" />
                    <h3 className="font-medium text-white text-sm">Kiosk</h3>
                    <p className="text-xs text-neutral-500">Frameless, fills available space</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Staff Preview Mode</h2>
            <p className="text-neutral-300 mb-4">
                When logged-in staff access visitor pages, they see a <strong className="text-white">"Back to Admin"</strong> banner
                at the top. Staff can also preview draft (unpublished) tours that visitors cannot see.
            </p>
        </div>
    </div>
);

const MagicTranslatePage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Magic Translate</h1>
            <p className="text-xl text-neutral-400">
                Instantly translate your tour content into multiple languages with AI.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-white" />
                <h2 className="text-xl font-semibold text-white">One-Click Translation</h2>
            </div>
            <p className="text-neutral-300 mb-4">
                Magic Translate uses AI to translate all your stop content - text, titles, descriptions,
                and captions - into any language. The sparkle button appears throughout the editor
                wherever translatable content exists.
            </p>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Translation Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <Globe className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-semibold text-white mb-1">Google Cloud Translation</h3>
                    <p className="text-sm text-neutral-400 mb-2">195+ languages, fast cloud API. Recommended for most museums.</p>
                    <p className="text-xs text-neutral-500">Requires GOOGLE_VISION_API_KEY (shared with Vision & TTS)</p>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <Languages className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-semibold text-white mb-1">LibreTranslate</h3>
                    <p className="text-sm text-neutral-400 mb-2">9 languages, self-hosted option. Free and open-source.</p>
                    <p className="text-xs text-neutral-500">Languages: EN, ES, FR, DE, IT, PT, JA, KO, ZH</p>
                </div>
            </div>
            <p className="text-sm text-neutral-400 mt-3">
                Choose your default provider in <strong className="text-white">Settings &gt; Translation</strong>.
            </p>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">How to Use</h2>
            <div className="space-y-4">
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">1</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Open a Stop</h3>
                            <p className="text-sm text-neutral-400">Navigate to the stop you want to translate</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">2</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Click the Magic Translate Button</h3>
                            <p className="text-sm text-neutral-400">Look for the sparkle icon next to any text field or in the toolbar</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">3</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Select Target Language</h3>
                            <p className="text-sm text-neutral-400">Choose from all languages available from your active translation provider</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">4</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Review & Save</h3>
                            <p className="text-sm text-neutral-400">Switch to the translated language to review, edit if needed, then save</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Translation Tips</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Write clear, simple text in your primary language for best AI results</li>
                    <li>• Have a native speaker review translations for cultural accuracy</li>
                    <li>• Art-specific terminology may need manual adjustment</li>
                    <li>• Translation also works in collection AI analysis and concierge setup</li>
                </ul>
            </div>
        </div>
    </div>
);

const AIAudioPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">AI Audio Generation</h1>
            <p className="text-xl text-neutral-400">
                Convert text into professional narration with three TTS providers.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Three Audio Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Mic className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Deepgram</h3>
                    <p className="text-sm text-neutral-400 mb-3">Fast, cost-effective TTS with natural voices.</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• 7 languages</li>
                        <li>• 40+ voice options</li>
                        <li>• MP3, WAV, OGG, FLAC output</li>
                        <li>• Multiple sample rates</li>
                    </ul>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Volume2 className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">ElevenLabs</h3>
                    <p className="text-sm text-neutral-400 mb-3">Premium quality, most realistic voices available.</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• 32+ languages</li>
                        <li>• 21 premade voices</li>
                        <li>• Stability & similarity controls</li>
                        <li>• Multilingual v2 model</li>
                    </ul>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Globe className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Google Cloud TTS</h3>
                    <p className="text-sm text-neutral-400 mb-3">Neural voices with fine-grained controls.</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• 10 languages</li>
                        <li>• Neural2 + Standard voices</li>
                        <li>• Speaking rate & pitch control</li>
                        <li>• MP3, WAV, OGG Opus output</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">How to Generate Audio</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Go to the <strong className="text-white">Audio</strong> page from the main navigation</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Choose a provider tab (Deepgram, ElevenLabs, or Google Cloud)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Enter your text, select a language, and pick a voice</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Preview voices before generating, then click Generate</span>
                    </li>
                </ol>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Batch Audio Collections</h2>
            <p className="text-neutral-300 mb-4">
                Need the same text narrated in multiple languages? Create an <strong className="text-white">Audio Collection</strong> to
                generate all languages at once. TourStack auto-translates your text and generates audio for each language in a single batch.
            </p>
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                <p className="text-sm text-neutral-400">
                    Audio collections can be imported directly into Audio Blocks and Timeline Gallery blocks in your stops.
                </p>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">API Keys Required</h3>
                <p className="text-neutral-400 text-sm">
                    Each provider needs its own API key configured in <strong className="text-white">Settings</strong>.
                    Deepgram and ElevenLabs use dedicated keys. Google Cloud TTS shares the same key as Google Vision and Google Translate.
                </p>
            </div>
        </div>
    </div>
);

const AddingTextPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Adding Text Content</h1>
            <p className="text-xl text-neutral-400">
                Write compelling descriptions that bring your exhibits to life.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Creating a Text Block</h2>
            <ol className="space-y-4">
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                    <div>
                        <h3 className="font-medium text-white mb-1">Open Stop Editor</h3>
                        <p className="text-sm text-neutral-400">Click on any stop to open the content editor</p>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                    <div>
                        <h3 className="font-medium text-white mb-1">Click "Add Block"</h3>
                        <p className="text-sm text-neutral-400">Look for the + button in the content area</p>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                    <div>
                        <h3 className="font-medium text-white mb-1">Select "Text"</h3>
                        <p className="text-sm text-neutral-400">Choose the text block from the block picker</p>
                    </div>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                    <div>
                        <h3 className="font-medium text-white mb-1">Write Your Content</h3>
                        <p className="text-sm text-neutral-400">Use the editor to add formatted text</p>
                    </div>
                </li>
            </ol>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Writing Tips</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">✓ Do</h3>
                    <ul className="text-sm text-neutral-400 space-y-2">
                        <li>• Keep it concise (150-200 words max)</li>
                        <li>• Start with something engaging</li>
                        <li>• Include one surprising fact</li>
                        <li>• Use simple, accessible language</li>
                    </ul>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">✗ Avoid</h3>
                    <ul className="text-sm text-neutral-400 space-y-2">
                        <li>• Wall of text - break it up</li>
                        <li>• Academic jargon</li>
                        <li>• Long lists of dates</li>
                        <li>• Content that needs updating often</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const ImagesGalleriesPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Images & Galleries</h1>
            <p className="text-xl text-neutral-400">
                Rich image editing with focal point control, hotspots, lightbox, comparison, and full translation support.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Image Block Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Image className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Single Image</h3>
                    <p className="text-sm text-neutral-400">Full-width image with caption, credit, and alt text — all translatable</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Layers className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Gallery</h3>
                    <p className="text-sm text-neutral-400">Swipeable carousel of multiple images</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <ArrowLeftRight className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Comparison</h3>
                    <p className="text-sm text-neutral-400">Before/after slider for comparing two images side by side</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <LayoutGrid className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Image Map</h3>
                    <p className="text-sm text-neutral-400">Floor plans with tappable markers for indoor navigation</p>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Image Editor Tools</h2>
            <p className="text-sm text-neutral-400 mb-4">
                The Image Block editor opens in a wide 2-column layout. Image preview and controls on the left, text fields and tools on the right.
            </p>
            <ul className="space-y-3">
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Crosshair className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Focal Point</h3>
                        <p className="text-sm text-neutral-400">Click anywhere on the image to set the focal point. When the image is cropped (e.g., in a card or thumbnail), it will always center on this point.</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Crop className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Format &amp; Crop</h3>
                        <p className="text-sm text-neutral-400">Choose between Cropped (fixed aspect ratio, edge-to-edge) and Full (shows the entire image). Cropped mode uses the focal point to determine which part of the image is visible.</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <ZoomIn className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Lightbox</h3>
                        <p className="text-sm text-neutral-400">Visitors can tap any image to open a fullscreen lightbox view. Fills the device screen with pinch-to-zoom support.</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <MousePointerClick className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Hotspots</h3>
                        <p className="text-sm text-neutral-400">Add interactive markers to your image. Each hotspot can show a tooltip, navigate to another stop, or open an external URL. Choose from 5 icon styles and 7+ colors.</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Languages className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Translation</h3>
                        <p className="text-sm text-neutral-400">Language pills let you switch between languages for caption, credit, and alt text. Use the translate button to auto-translate to all tour languages at once.</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Eye className="w-5 h-5 text-white mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-medium text-white">Alt Text</h3>
                        <p className="text-sm text-neutral-400">Add accessibility descriptions per language. Screen readers use this to describe the image to visually impaired visitors.</p>
                    </div>
                </li>
            </ul>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Hotspot Editor</h2>
            <p className="text-sm text-neutral-400 mb-4">
                Click "Edit Hotspots" to open the full-screen hotspot editor.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Target className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Place Markers</h3>
                    <p className="text-sm text-neutral-400">Click on the image to add hotspot markers. Drag them to reposition. All markers stay visible in the sidebar while editing.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Settings className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Configure Actions</h3>
                    <p className="text-sm text-neutral-400">Each hotspot can: show a tooltip with text, navigate to another stop in the tour, or open an external URL.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Languages className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Translate Labels</h3>
                    <p className="text-sm text-neutral-400">Language pills at the top let you edit each hotspot label per language. "Translate All" translates every hotspot label at once.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Save className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Save Options</h3>
                    <p className="text-sm text-neutral-400">Save button offers "Save &amp; Continue Editing" to keep working, or "Save &amp; Exit" to save and close the editor.</p>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Image Best Practices</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Use high-resolution images (at least 1200px wide)</li>
                    <li>• JPG for photos, PNG for graphics with transparency</li>
                    <li>• Keep file sizes under 2MB for fast loading</li>
                    <li>• Always set a focal point — it controls cropping in cards and thumbnails</li>
                    <li>• Include alt text for accessibility in every language</li>
                    <li>• Use "Full" format for artwork that should never be cropped</li>
                    <li>• Use hotspots to highlight details visitors might miss</li>
                </ul>
            </div>
        </div>
    </div>
);

const AudioNarrationPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Audio Narration</h1>
            <p className="text-xl text-neutral-400">
                Add voice guides to create an immersive audio tour experience.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Two Ways to Add Audio</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <PlusCircle className="w-5 h-5 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Upload Recording</h3>
                    <p className="text-sm text-neutral-400">
                        Upload your own audio files - perfect if you have professional recordings
                        or want to use staff voices.
                    </p>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Sparkles className="w-5 h-5 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">AI Generation</h3>
                    <p className="text-sm text-neutral-400">
                        Generate audio from text using AI voices - fast and available in
                        multiple languages.
                    </p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Audio Block Features</h2>
            <ul className="space-y-3">
                <li className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <Play className="w-5 h-5 text-white mt-0.5" />
                    <div>
                        <h3 className="font-medium text-white">Play Controls</h3>
                        <p className="text-sm text-neutral-400">Play, pause, and scrub through audio</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <FileText className="w-5 h-5 text-white mt-0.5" />
                    <div>
                        <h3 className="font-medium text-white">Transcripts</h3>
                        <p className="text-sm text-neutral-400">Add text transcripts for accessibility</p>
                    </div>
                </li>
                <li className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <Languages className="w-5 h-5 text-white mt-0.5" />
                    <div>
                        <h3 className="font-medium text-white">Multi-Language</h3>
                        <p className="text-sm text-neutral-400">Different audio for each language</p>
                    </div>
                </li>
            </ul>
        </div>
    </div>
);

const ContentBlocksPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">All Content Blocks</h1>
            <p className="text-xl text-neutral-400">
                Complete reference for every block type available in TourStack. Mix and match to create rich stop experiences.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { icon: Pencil, name: 'Text', desc: 'Rich formatted text with multilingual support' },
                { icon: Image, name: 'Image', desc: 'Image with focal point, crop, hotspots, lightbox, and translation' },
                { icon: Layers, name: 'Gallery', desc: 'Carousel, grid, or masonry image layouts' },
                { icon: Play, name: 'Timeline Gallery', desc: 'Audio-synced slideshow with waveform editor' },
                { icon: Volume2, name: 'Audio', desc: 'Audio player in 3 sizes with multi-language support' },
                { icon: Video, name: 'Video', desc: 'YouTube, Vimeo embeds or direct video upload' },
                { icon: Quote, name: 'Quote', desc: 'Styled quotation with attribution' },
                { icon: Clock, name: 'Timeline', desc: 'Chronological events with dates and descriptions' },
                { icon: ArrowLeftRight, name: 'Comparison', desc: 'Side-by-side before/after image comparison' },
                { icon: Radio, name: 'Positioning', desc: 'QR code, GPS, BLE beacon, NFC configuration' },
                { icon: MapPin, name: 'Map', desc: 'Interactive OpenStreetMap or Google Maps with markers' },
                { icon: LayoutGrid, name: 'Image Map', desc: 'Upload floor plans with tappable markers for indoor navigation' },
                { icon: FileText, name: 'Tour Intro', desc: 'Full-screen hero with image, title, and CTA button' },
            ].map(block => (
                <div key={block.name} className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                            <block.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-medium text-white">{block.name}</h3>
                            <p className="text-sm text-neutral-400">{block.desc}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Adding Blocks</h3>
                <p className="text-neutral-400 text-sm">
                    Open any stop, click <strong className="text-white">"Add Block"</strong>, and choose a block type.
                    Blocks can be reordered by dragging, and each block supports multilingual content via the language switcher.
                </p>
            </div>
        </div>
    </div>
);

const MultilingualPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Multiple Languages</h1>
            <p className="text-xl text-neutral-400">
                Make your tours accessible to international visitors in 195+ languages.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
            <p className="text-neutral-300 mb-4">
                Every text field in TourStack stores content per-language. When you create a tour,
                you choose which languages to support. Visitors see a language dropdown and all content
                switches instantly - text, audio, and captions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">What Switches</h3>
                    <ul className="space-y-1 text-sm text-neutral-400">
                        <li>✓ All text blocks and titles</li>
                        <li>✓ Audio narration (if multi-language audio exists)</li>
                        <li>✓ Image captions and alt text</li>
                        <li>✓ Tour intro text and CTA buttons</li>
                        <li>✓ Transcripts</li>
                    </ul>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Translation Providers</h3>
                    <ul className="space-y-1 text-sm text-neutral-400">
                        <li><span className="text-white">Google Cloud:</span> 195+ languages</li>
                        <li><span className="text-white">LibreTranslate:</span> 9 languages (free)</li>
                        <li className="text-xs text-neutral-500 pt-1">Set your provider in Settings &gt; Translation</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Setting Up Languages</h2>
            <ol className="space-y-4">
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Choose Languages When Creating a Tour</h3>
                            <p className="text-sm text-neutral-400">Select supported languages in the Create Tour wizard. You can add more later via Edit Tour.</p>
                        </div>
                    </div>
                </li>
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Write Content in Your Primary Language</h3>
                            <p className="text-sm text-neutral-400">Create all text in your museum's main language first</p>
                        </div>
                    </div>
                </li>
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Use Magic Translate</h3>
                            <p className="text-sm text-neutral-400">Click the sparkle button to AI-translate content to other languages. Review and edit as needed.</p>
                        </div>
                    </div>
                </li>
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Generate Multi-Language Audio</h3>
                            <p className="text-sm text-neutral-400">Use Audio Collections to batch-generate narration in all tour languages at once</p>
                        </div>
                    </div>
                </li>
            </ol>
        </div>
    </div>
);

const TimelineGalleryPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Timeline Gallery</h1>
            <p className="text-xl text-neutral-400">
                Create audio-synced image slideshows with waveform editing.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is a Timeline Gallery?</h2>
            <p className="text-neutral-300 mb-4">
                A Timeline Gallery synchronizes images with an audio track. As the audio plays, images
                transition automatically at timestamps you set. Perfect for narrated walkthroughs,
                artwork detail exploration, or historical photo sequences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Volume2 className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white text-sm">Audio Waveform</h3>
                    <p className="text-xs text-neutral-400">Visual waveform with playback controls</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Image className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white text-sm">Thumbnail Markers</h3>
                    <p className="text-xs text-neutral-400">64px thumbnails placed on the waveform timeline</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Play className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white text-sm">Smooth Transitions</h3>
                    <p className="text-xs text-neutral-400">Crossfade transitions with adjustable duration</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Creating a Timeline Gallery</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Add a <strong className="text-white">Timeline Gallery</strong> block to your stop</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Upload an audio file (or import from an audio collection)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Upload images and drag their thumbnails to positions on the waveform</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Click thumbnails to edit captions, alt text, and credits</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">5</span>
                        <span className="text-neutral-300">Set transition duration (0.1s - 1.5s) and preview the result</span>
                    </li>
                </ol>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Tips</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Use 4-8 images per audio track for best pacing</li>
                    <li>• Drag thumbnail markers on the waveform to adjust timing</li>
                    <li>• The editor auto-saves, but look for the unsaved changes warning before closing</li>
                </ul>
            </div>
        </div>
    </div>
);

const MapsLocationPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Maps & Location</h1>
            <p className="text-xl text-neutral-400">
                Add interactive maps with markers, styles, and geofencing.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Map Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <MapPin className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">OpenStreetMap</h3>
                    <p className="text-sm text-neutral-400 mb-2">Free, no API key required. Great for getting started.</p>
                    <p className="text-xs text-neutral-500">Powered by Leaflet.js</p>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <MapIcon className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Google Maps</h3>
                    <p className="text-sm text-neutral-400 mb-2">Premium maps with satellite, terrain, and hybrid views.</p>
                    <p className="text-xs text-neutral-500">Requires GOOGLE_MAPS_API_KEY in Settings</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Map Block Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Marker Placement</h3>
                    <p className="text-sm text-neutral-400">Click the map to place markers, or use address search and "Get Current Location"</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Map Styles</h3>
                    <p className="text-sm text-neutral-400">Standard, Satellite, Terrain, and Hybrid views</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Size Options</h3>
                    <p className="text-sm text-neutral-400">Small (150px), Medium (250px), or Large (full height)</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Trigger Zones</h3>
                    <p className="text-sm text-neutral-400">Configurable radius for geofencing around locations</p>
                </div>
            </div>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Image Map Block</h2>
            <p className="text-neutral-300 mb-4">
                For indoor spaces where GPS doesn't work, the Image Map block lets you upload a floor plan
                and place tappable markers directly on it. Perfect for museums, galleries, and multi-floor buildings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Floor Plan Upload</h3>
                    <p className="text-sm text-neutral-400">Upload any image as your base map — architectural drawings, custom illustrations, or photos</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Click-to-Place Markers</h3>
                    <p className="text-sm text-neutral-400">Click anywhere on the image to add markers. Drag to reposition. 5 icon styles and 7+ colors</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Multi-Floor Support</h3>
                    <p className="text-sm text-neutral-400">Add multiple floors, each with its own image and markers. Visitors switch floors with tabs</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">Info Popups & Stop Links</h3>
                    <p className="text-sm text-neutral-400">Markers can show info text popups or navigate visitors directly to a linked stop</p>
                </div>
            </div>
        </div>
    </div>
);

const MediaLibraryPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Media Library</h1>
            <p className="text-xl text-neutral-400">
                Central hub for all your uploaded images, audio, video, and documents.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Overview</h2>
            <p className="text-neutral-300 mb-4">
                The Media Library collects all files uploaded across your tours and stops.
                Search, filter, tag, and organize your assets. See where each file is used across your tours.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-black/50 border border-white/10 rounded-lg text-center">
                    <Image className="w-5 h-5 text-white mx-auto mb-1" />
                    <span className="text-xs text-neutral-400">Images</span>
                </div>
                <div className="p-3 bg-black/50 border border-white/10 rounded-lg text-center">
                    <Volume2 className="w-5 h-5 text-white mx-auto mb-1" />
                    <span className="text-xs text-neutral-400">Audio</span>
                </div>
                <div className="p-3 bg-black/50 border border-white/10 rounded-lg text-center">
                    <Video className="w-5 h-5 text-white mx-auto mb-1" />
                    <span className="text-xs text-neutral-400">Video</span>
                </div>
                <div className="p-3 bg-black/50 border border-white/10 rounded-lg text-center">
                    <FileText className="w-5 h-5 text-white mx-auto mb-1" />
                    <span className="text-xs text-neutral-400">Documents</span>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
            <div className="space-y-3">
                {[
                    { title: 'Smart Search', desc: 'Filter by filename, alt text, caption, or tags' },
                    { title: 'Type Filtering', desc: 'Tabs for All, Images, Audio, Video, Documents' },
                    { title: 'Sort Options', desc: 'By date, name, or size (ascending or descending)' },
                    { title: 'Bulk Operations', desc: 'Multi-select files for bulk delete or bulk tagging' },
                    { title: 'Where Used', desc: 'See which tours and stops use each media file' },
                    { title: 'AI Analysis', desc: 'Run Gemini AI analysis on images to generate descriptions and tags' },
                    { title: 'Metadata Editing', desc: 'Update alt text, caption, and tags for any file' },
                ].map(f => (
                    <div key={f.title} className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                        <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                        <div>
                            <span className="text-white text-sm font-medium">{f.title}</span>
                            <span className="text-neutral-400 text-sm"> - {f.desc}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Sync Feature</h3>
                <p className="text-neutral-400 text-sm">
                    Click <strong className="text-white">"Sync"</strong> to scan your uploads folder and populate the Media Library
                    with any files that were uploaded before the library existed.
                </p>
            </div>
        </div>
    </div>
);

const CollectionsPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Collections</h1>
            <p className="text-xl text-neutral-400">
                Group images, audio, and documents into organized collections with AI analysis.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Three Collection Types</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Image className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Image Collections</h3>
                    <p className="text-sm text-neutral-400 mb-2">Upload images, run AI analysis, translate descriptions.</p>
                    <p className="text-xs text-neutral-500">4-step wizard: Details, Upload, AI Analysis, Review</p>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Volume2 className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Audio Collections</h3>
                    <p className="text-sm text-neutral-400 mb-2">Batch-generate TTS narration in multiple languages.</p>
                    <p className="text-xs text-neutral-500">Uses Deepgram, ElevenLabs, or Google Cloud TTS</p>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <FileText className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Document Collections</h3>
                    <p className="text-sm text-neutral-400 mb-2">Upload PDFs, DOCX, and more. Extract text for AI tools.</p>
                    <p className="text-xs text-neutral-500">AI: Summarize, Extract Facts, Generate FAQ, Auto-Tag</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Image Collection Workflow</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Click <strong className="text-white">"New Collection"</strong> and choose Images</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Drag and drop your images (multi-upload supported)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Click <strong className="text-white">"Analyze All"</strong> to run Gemini AI on every image</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Optionally translate AI descriptions to other languages</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">5</span>
                        <span className="text-neutral-300">Save - AI metadata automatically syncs to the Media Library</span>
                    </li>
                </ol>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Audio Collection Workflow</h2>
            <p className="text-neutral-300 mb-4">
                Audio collections let you generate the same narration text in multiple languages at once.
                Enter your text, select languages, pick a voice, and TourStack auto-translates and generates all audio files.
            </p>
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                <p className="text-sm text-neutral-400">
                    Audio collections can be <strong className="text-white">imported into Audio Blocks</strong> in your stops.
                    When a visitor switches language, both the audio and transcript switch automatically.
                </p>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Document Collection AI Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Summarize', 'Extract Facts', 'Generate FAQ', 'Auto-Tag'].map(tool => (
                    <div key={tool} className="p-3 bg-white/[0.02] border border-white/10 rounded-lg text-center">
                        <Sparkles className="w-4 h-4 text-white mx-auto mb-1" />
                        <span className="text-sm text-neutral-300">{tool}</span>
                    </div>
                ))}
            </div>
            <p className="text-sm text-neutral-400 mt-3">
                Supported formats: PDF, DOCX, DOC, RTF, ODT, PPTX, TXT
            </p>
        </div>
    </div>
);

const KioskModePage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Kiosk & Device Modes</h1>
            <p className="text-xl text-neutral-400">
                Three ways to deploy tours on museum devices — from WiFi displays to fully offline tablets.
            </p>
        </header>

        {/* Overview of the three modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
                { title: 'Kiosk Mode', desc: 'WiFi-connected display with full options. Best for wall-mounted screens and lobby kiosks.', icon: '🖥️' },
                { title: 'Staff Handoff', desc: 'Staff picks a language, taps Start, hands device to visitor. Auto-resets when idle.', icon: '📱' },
                { title: 'Offline Export', desc: 'Download a ZIP with all tour data and media. No WiFi needed on the device.', icon: '📦' },
            ].map(m => (
                <div key={m.title} className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="text-2xl mb-3">{m.icon}</div>
                    <h3 className="font-semibold text-white mb-2">{m.title}</h3>
                    <p className="text-xs text-neutral-400">{m.desc}</p>
                </div>
            ))}
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How to Access</h2>
            <p className="text-neutral-300 mb-4">
                All three modes are accessed from the same place:
            </p>
            <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Open any tour from the <strong className="text-white">Tours</strong> page</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Click the <strong className="text-white">monitor icon</strong> in the header bar</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Choose a tab: <strong className="text-white">Kiosk Mode</strong>, <strong className="text-white">Staff Handoff</strong>, or <strong className="text-white">Export Offline</strong></span>
                    </li>
                </ol>
            </div>
            <p className="text-neutral-400 text-sm mt-4">
                The <strong className="text-white">Run</strong> / <strong className="text-white">Preview</strong> button also opens the Staff Handoff screen directly — the quickest way to launch a tour.
            </p>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Kiosk Mode Options</h2>
            <p className="text-neutral-300 mb-4">
                Kiosk mode is for WiFi-connected displays. It opens the tour in a new browser tab with these options:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { title: 'Language', desc: 'Pre-select the language for the kiosk display' },
                    { title: 'Fullscreen', desc: 'Launch in browser fullscreen mode' },
                    { title: 'Hide Navigation', desc: 'Remove prev/next buttons for linear tours' },
                    { title: 'Auto-Restart', desc: '"Start Over" button appears at tour end' },
                    { title: 'Start Stop', desc: 'Choose which stop to begin on' },
                    { title: 'Show Chatbot', desc: 'Enable the AI concierge chat button' },
                ].map(opt => (
                    <div key={opt.title} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                        <h3 className="font-medium text-white text-sm mb-1">{opt.title}</h3>
                        <p className="text-xs text-neutral-400">{opt.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Which mode should I use?</h3>
                <p className="text-neutral-400 text-sm">
                    <strong className="text-neutral-300">WiFi available?</strong> Use Kiosk Mode for full control, or Staff Handoff for the simplest visitor experience.
                    <br />
                    <strong className="text-neutral-300">No WiFi?</strong> Use Export Offline to download the tour, then load it onto devices via USB or a local network.
                </p>
            </div>
        </div>
    </div>
);

const StaffHandoffPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Staff Handoff</h1>
            <p className="text-xl text-neutral-400">
                The simplest way to hand a tour device to a visitor. Pick a language, tap Start, done.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
            <div className="space-y-4">
                {[
                    { step: '1', title: 'Staff sees the loading screen', desc: 'Shows the tour name, hero image, stop count, duration, and device status (battery, WiFi, cache).' },
                    { step: '2', title: 'Staff picks the visitor\'s language', desc: 'Large flag buttons with native language names. One tap to select.' },
                    { step: '3', title: 'Staff taps "Start Tour"', desc: 'Device enters fullscreen visitor mode, locked to that language. No settings, no distractions.' },
                    { step: '4', title: 'Visitor explores the tour', desc: 'Single-language experience — audio, text, and UI all in their language. Navigation between stops works normally.' },
                    { step: '5', title: 'Device auto-resets', desc: 'After 5 minutes of no interaction, a "Still exploring?" prompt appears. If no response in 30 seconds, device returns to the staff screen.' },
                ].map(item => (
                    <div key={item.step} className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-white">{item.step}</span>
                        </div>
                        <div>
                            <h3 className="font-medium text-white text-sm">{item.title}</h3>
                            <p className="text-xs text-neutral-400 mt-1">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Accessing the Staff Screen</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <p className="text-sm text-neutral-300 mb-3">Two ways to open it:</p>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-neutral-300"><strong className="text-white">Run / Preview button</strong> — on any tour detail page, this opens the staff handoff screen directly</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
                        <span className="text-neutral-300"><strong className="text-white">Monitor icon → Staff Handoff tab</strong> — the second tab in the Device & Display modal</span>
                    </li>
                </ul>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Staff Screen Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { title: 'Device Status Bar', desc: 'Shows WiFi connection, battery level, and whether the tour is cached and ready' },
                    { title: 'Language Buttons', desc: 'Large, clear buttons with flag emoji and native language name. One tap to select.' },
                    { title: 'Tour Info', desc: 'Hero image, title, description, stop count, and duration — confirms the right tour is loaded' },
                    { title: 'PIN-Protected Settings', desc: 'Tap the gear icon and enter the staff PIN (default: 0000) to access device settings' },
                    { title: 'Inactivity Reset', desc: '5 minutes idle → "Still exploring?" prompt → 30 second countdown → auto-return to staff screen' },
                    { title: '"Return Device" Button', desc: 'Visitors or staff can also manually return to the staff screen from the reset prompt' },
                ].map(f => (
                    <div key={f.title} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                        <h3 className="font-medium text-white text-sm mb-1">{f.title}</h3>
                        <p className="text-xs text-neutral-400">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Best for museum device racks</h3>
                <p className="text-neutral-400 text-sm">
                    The staff handoff screen is designed for museums with a rack of tablets at the entrance.
                    Staff grabs a device, picks the visitor's language, taps Start, and hands it over.
                    When the visitor returns the device, it resets automatically — ready for the next visitor.
                </p>
            </div>
        </div>
    </div>
);

const OfflineExportPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Offline Export</h1>
            <p className="text-xl text-neutral-400">
                Download your tour as a ZIP file with all data, images, and audio — no WiFi needed on the device.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">How to Export</h2>
            <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Open any tour from the <strong className="text-white">Tours</strong> page</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Click the <strong className="text-white">monitor icon</strong> in the header</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Select the <strong className="text-white">Export Offline</strong> tab</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Click <strong className="text-white">Download ZIP</strong> — the file saves to your downloads folder</span>
                    </li>
                </ol>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">What's in the ZIP</h2>
            <div className="p-5 bg-black/50 border border-white/10 rounded-xl font-mono text-sm space-y-1">
                <p className="text-white">tourstack-your-tour.zip</p>
                <p className="text-neutral-400 pl-4">manifest.json <span className="text-neutral-600">— export metadata</span></p>
                <p className="text-neutral-400 pl-4">data/tour.json <span className="text-neutral-600">— all stops, content blocks, and settings</span></p>
                <p className="text-neutral-400 pl-4">media/images/ <span className="text-neutral-600">— every referenced image</span></p>
                <p className="text-neutral-400 pl-4">media/audio/ <span className="text-neutral-600">— all narration audio files</span></p>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { title: 'All languages', included: true, desc: 'Every translation of every stop is included' },
                    { title: 'Images & galleries', included: true, desc: 'Hero images, gallery images, timeline images' },
                    { title: 'Audio narration', included: true, desc: 'All audio files for every language' },
                    { title: 'Stop content', included: true, desc: 'Text, quotes, timelines, comparisons — everything' },
                    { title: 'YouTube / Vimeo', included: false, desc: 'External video embeds require internet' },
                    { title: 'AI Concierge chat', included: false, desc: 'Requires a live AI connection' },
                ].map(item => (
                    <div key={item.title} className={`p-4 rounded-xl border ${item.included ? 'bg-white/[0.02] border-white/10' : 'bg-white/[0.01] border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                            {item.included ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                            ) : (
                                <X className="w-4 h-4 text-neutral-600" />
                            )}
                            <h3 className={`font-medium text-sm ${item.included ? 'text-white' : 'text-neutral-500'}`}>{item.title}</h3>
                        </div>
                        <p className={`text-xs ${item.included ? 'text-neutral-400' : 'text-neutral-600'}`}>{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Loading onto Devices</h2>
            <p className="text-neutral-300 mb-4">
                Once you have the ZIP file, you can transfer it to museum devices via:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { title: 'USB transfer', desc: 'Connect the device and copy the extracted folder directly' },
                    { title: 'Local WiFi', desc: 'Set up a local network (no internet needed) and serve from a laptop or Raspberry Pi' },
                    { title: 'AirDrop / Bluetooth', desc: 'Share the ZIP wirelessly for small device fleets' },
                    { title: 'MDM / Fleet management', desc: 'For larger deployments, push via Jamf, Google Workspace, etc.' },
                ].map(m => (
                    <div key={m.title} className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                        <h3 className="font-medium text-white text-sm mb-1">{m.title}</h3>
                        <p className="text-xs text-neutral-400">{m.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">URL Rewriting</h3>
                <p className="text-neutral-400 text-sm">
                    The export automatically rewrites all media URLs from <code className="text-neutral-300 bg-white/5 px-1 rounded">/uploads/images/...</code> to
                    relative <code className="text-neutral-300 bg-white/5 px-1 rounded">./media/images/...</code> paths, so everything works from a local folder.
                </p>
            </div>
        </div>
    </div>
);

const PublishingPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Publishing Your Tour</h1>
            <p className="text-xl text-neutral-400">
                Understand the draft-to-published workflow and how to make tours live.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Draft vs Published</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Pencil className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-semibold text-white mb-2">Draft</h3>
                    <ul className="text-sm text-neutral-400 space-y-1">
                        <li>• Only visible to logged-in staff</li>
                        <li>• Can be freely edited</li>
                        <li>• Visitors cannot see this tour</li>
                        <li>• Shows "Preview" button on tour card</li>
                    </ul>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Send className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-semibold text-white mb-2">Published</h3>
                    <ul className="text-sm text-neutral-400 space-y-1">
                        <li>• Visible to everyone (visitors)</li>
                        <li>• QR codes work for public access</li>
                        <li>• Can still be edited</li>
                        <li>• Shows green "Run Tour" button</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">How to Publish</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Open the tour detail page</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Click <strong className="text-white">"Edit Tour"</strong> to open the tour settings</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Change the status from <strong className="text-white">Draft</strong> to <strong className="text-white">Published</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Save - the tour is now live and QR codes will work for visitors</span>
                    </li>
                </ol>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Running a Tour</h2>
            <p className="text-neutral-300 mb-4">
                Once published, a green <strong className="text-white">"Run Tour"</strong> button appears on the tour card.
                Clicking it opens the visitor view starting at the first stop. This is how you can
                quickly test or demonstrate the tour to stakeholders.
            </p>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Before Publishing</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Preview all stops on phone and tablet device sizes</li>
                    <li>• Test QR codes by scanning them with your phone</li>
                    <li>• Check translations are complete for all languages</li>
                    <li>• Verify audio playback works for each language</li>
                </ul>
            </div>
        </div>
    </div>
);

const AIImageAnalysisPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">AI Image Analysis</h1>
            <p className="text-xl text-neutral-400">
                Use Google Vision and Gemini AI to analyze images, detect objects, and generate smart tags.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                    { icon: Eye, title: 'Visual DNA', desc: 'Deep analysis of mood, lighting, style, and artistic context' },
                    { icon: Camera, title: 'Object Detection', desc: 'Identifies specific objects and artifacts within images' },
                    { icon: Layers, title: 'Dominant Colors', desc: 'Full color palette extraction with HEX codes and names' },
                    { icon: FileText, title: 'OCR Text', desc: 'High-precision text recognition from labels and plaques' },
                    { icon: Globe, title: 'Web Detection', desc: '"Best Guess" identification of famous artworks and landmarks' },
                    { icon: Sparkles, title: 'Smart Tags', desc: 'AI-generated tags you can add, remove, or edit' },
                ].map(cap => (
                    <div key={cap.title} className="p-4 bg-black/50 border border-white/10 rounded-xl">
                        <cap.icon className="w-5 h-5 text-white mb-2" />
                        <h3 className="font-medium text-white text-sm mb-1">{cap.title}</h3>
                        <p className="text-xs text-neutral-400">{cap.desc}</p>
                    </div>
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Where to Use AI Analysis</h2>
            <div className="space-y-3">
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white text-sm mb-1">AI Assistance Page</h3>
                    <p className="text-xs text-neutral-400">Upload any image for standalone analysis from the AI Assistance dashboard</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white text-sm mb-1">Media Library</h3>
                    <p className="text-xs text-neutral-400">Open any image's detail modal and click "Analyze" to generate descriptions and tags</p>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white text-sm mb-1">Image Collections</h3>
                    <p className="text-xs text-neutral-400">Batch analyze all images in a collection with "Analyze All" and translate results</p>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">API Keys Required</h3>
                <p className="text-neutral-400 text-sm">
                    Image analysis requires <strong className="text-white">GOOGLE_VISION_API_KEY</strong> for Vision features
                    and <strong className="text-white">GEMINI_API_KEY</strong> for Visual DNA and advanced analysis.
                    Configure these in Settings or as environment variables.
                </p>
            </div>
        </div>
    </div>
);

const AIConciergePage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">AI Concierge</h1>
            <p className="text-xl text-neutral-400">
                Set up an AI-powered chatbot that answers visitor questions about your museum.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is the AI Concierge?</h2>
            <p className="text-neutral-300 mb-4">
                The AI Concierge is a chatbot that visitors can interact with during their tour.
                It's powered by Google Gemini AI and can answer questions based on knowledge sources
                you configure - like museum documents, exhibit information, and visitor FAQs.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Bot className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white text-sm">For Visitors</h3>
                    <p className="text-xs text-neutral-400">Chat button appears in kiosk mode. Visitors ask questions and get instant answers.</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Settings className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white text-sm">For Staff</h3>
                    <p className="text-xs text-neutral-400">Configure persona, knowledge sources, welcome messages, and quick actions.</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Setting Up the Concierge</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Go to the <strong className="text-white">Concierge</strong> page from the main navigation</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Choose a persona (Friendly, Professional, Fun, Scholarly, or Custom)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Set a welcome message (multilingual) and enable languages</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Import knowledge sources from your document collections</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">5</span>
                        <span className="text-neutral-300">Add quick action buttons (common visitor questions)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">6</span>
                        <span className="text-neutral-300">Use <strong className="text-white">"Test Concierge"</strong> to preview chat responses</span>
                    </li>
                </ol>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            <p className="text-neutral-300 mb-3">
                Quick actions are pre-defined buttons that appear in the chat. Visitors tap them instead
                of typing. Great for common questions like "Where are the restrooms?" or "What are today's hours?"
            </p>
            <div className="grid grid-cols-2 gap-3">
                {['Museum Hours', 'Restroom Location', 'Gift Shop Info', 'Accessibility Help'].map(action => (
                    <div key={action} className="p-3 bg-white/[0.02] border border-white/10 rounded-lg text-center">
                        <MessageCircle className="w-4 h-4 text-white mx-auto mb-1" />
                        <span className="text-xs text-neutral-300">{action}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex items-start gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
                <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
                <h3 className="font-semibold text-white mb-1">Enabling in Kiosk Mode</h3>
                <p className="text-neutral-400 text-sm">
                    To show the chatbot on kiosks, enable <strong className="text-white">"Show Chatbot"</strong> in the
                    Kiosk Launcher modal. A chat button will appear in the bottom-right corner of the kiosk display.
                </p>
            </div>
        </div>
    </div>
);

// Page content mapping
const pageComponents: Record<string, React.ComponentType> = {
    'welcome': WelcomePage,
    'your-first-tour': FirstTourPage,
    'understanding-stops': UnderstandingStopsPage,
    'adding-text': AddingTextPage,
    'images-galleries': ImagesGalleriesPage,
    'audio-narration': AudioNarrationPage,
    'timeline-gallery': TimelineGalleryPage,
    'maps-location': MapsLocationPage,
    'content-blocks': ContentBlocksPage,
    'media-library': MediaLibraryPage,
    'collections': CollectionsPage,
    'qr-codes': QRCodesPage,
    'nfc-tags': NFCTagsPage,
    'gps-geofencing': GPSGeofencingPage,
    'visitor-view': VisitorViewPage,
    'kiosk-mode': KioskModePage,
    'staff-handoff': StaffHandoffPage,
    'offline-export': OfflineExportPage,
    'publishing': PublishingPage,
    'multilingual': MultilingualPage,
    'magic-translate': MagicTranslatePage,
    'ai-audio': AIAudioPage,
    'ai-image-analysis': AIImageAnalysisPage,
    'ai-concierge': AIConciergePage,
};

// Main Docs Component
export function Docs() {
    const { section, page } = useParams();
    const navigate = useNavigate();
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Determine current page
    const currentSlug = page || section || '';
    const isHome = !currentSlug;

    // Find current page for navigation
    const currentIndex = allPages.findIndex(p => p.slug === currentSlug);
    const prevPage = currentIndex > 0 ? allPages[currentIndex - 1] : null;
    const nextPage = currentIndex >= 0 && currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : (isHome ? allPages[0] : null);

    // Get the component for current page
    const PageComponent = pageComponents[currentSlug];

    // Scroll to top when page changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentSlug]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') {
                setSearchOpen(false);
            }
            if (e.key === 'ArrowLeft' && prevPage && !searchOpen) {
                navigate(`/docs/${prevPage.slug}`);
            }
            if (e.key === 'ArrowRight' && nextPage && !searchOpen) {
                navigate(`/docs/${nextPage.slug}`);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [prevPage, nextPage, navigate, searchOpen]);

    // Filter pages for search
    const searchResults = searchQuery
        ? allPages.filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center justify-between px-4 md:px-6 h-16">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <Link to="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-sm font-medium">Back to App</span>
                        </Link>
                        <span className="hidden md:block w-px h-5 bg-white/10" />
                        <Link to="/docs" className="hidden md:flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-white/5">
                                <Book className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-semibold">Help Center</span>
                        </Link>
                    </div>

                    <button
                        onClick={() => setSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-neutral-400 hover:text-white transition-all"
                    >
                        <Search className="w-4 h-4" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden sm:inline ml-2 px-1.5 py-0.5 bg-white/10 rounded text-xs font-mono">⌘K</kbd>
                    </button>
                </div>
            </header>

            {/* Search Modal */}
            {searchOpen && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-start justify-center pt-24">
                    <div className="w-full max-w-2xl mx-4 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                            <Search className="w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search help articles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-white text-lg placeholder-neutral-500 outline-none"
                                autoFocus
                            />
                            <button onClick={() => setSearchOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-neutral-400" />
                            </button>
                        </div>
                        {searchQuery && (
                            <div className="max-h-96 overflow-y-auto">
                                {searchResults.length > 0 ? (
                                    <div className="p-2">
                                        {searchResults.map(result => (
                                            <button
                                                key={result.slug}
                                                onClick={() => {
                                                    navigate(`/docs/${result.slug}`);
                                                    setSearchOpen(false);
                                                    setSearchQuery('');
                                                }}
                                                className="w-full text-left p-4 hover:bg-white/5 rounded-xl transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-medium text-white group-hover:text-white">{result.title}</div>
                                                        <div className="text-sm text-neutral-500">{result.description}</div>
                                                    </div>
                                                    <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-5 py-12 text-center text-neutral-500">
                                        No results found for "{searchQuery}"
                                    </div>
                                )}
                            </div>
                        )}
                        {!searchQuery && (
                            <div className="px-5 py-8 text-center text-neutral-500 text-sm">
                                Start typing to search...
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex pt-16">
                {/* Sidebar */}
                <aside className={`
          fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 
          bg-black border-r border-white/10 overflow-y-auto
          transform transition-transform duration-200
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                    <nav className="p-5 space-y-6">
                        {/* Home link */}
                        <Link
                            to="/docs"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isHome ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Book className="w-5 h-5" />
                            <span className="font-medium">Help Home</span>
                        </Link>

                        {docsStructure.map(section => (
                            <div key={section.title}>
                                <div className="flex items-center gap-2 text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-3 px-3">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </div>
                                <ul className="space-y-1">
                                    {section.items.map(item => (
                                        <li key={item.slug}>
                                            <Link
                                                to={`/docs/${item.slug}`}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`
                          block py-2.5 px-3 rounded-lg text-sm transition-colors
                          ${currentSlug === item.slug
                                                        ? 'bg-white/10 text-white font-medium'
                                                        : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                                    }
                        `}
                                            >
                                                {item.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Mobile overlay */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/50 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 min-h-[calc(100vh-4rem)] px-6 md:px-12 lg:px-16 py-10 max-w-4xl">
                    {/* Render page content */}
                    {isHome ? (
                        <DocsHome />
                    ) : PageComponent ? (
                        <PageComponent />
                    ) : (
                        <div className="text-center py-20">
                            <h1 className="text-2xl font-bold text-white mb-4">Page Not Found</h1>
                            <p className="text-neutral-400 mb-8">This help article doesn't exist yet.</p>
                            <Link
                                to="/docs"
                                className="px-4 py-2 bg-white text-black font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                                Go to Help Home
                            </Link>
                        </div>
                    )}

                    {/* Prev/Next Navigation */}
                    {!isHome && (prevPage || nextPage) && (
                        <nav className="flex items-center justify-between mt-16 pt-8 border-t border-white/10">
                            {prevPage ? (
                                <Link
                                    to={`/docs/${prevPage.slug}`}
                                    className="group flex items-center gap-3 p-4 -m-4 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-1">Previous</div>
                                        <div className="font-medium text-neutral-400 group-hover:text-white transition-colors">{prevPage.title}</div>
                                    </div>
                                </Link>
                            ) : <div />}

                            {nextPage ? (
                                <Link
                                    to={`/docs/${nextPage.slug}`}
                                    className="group flex items-center gap-3 p-4 -m-4 rounded-xl hover:bg-white/5 transition-colors text-right"
                                >
                                    <div>
                                        <div className="text-xs text-neutral-500 mb-1">Next</div>
                                        <div className="font-medium text-neutral-400 group-hover:text-white transition-colors">{nextPage.title}</div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
                                </Link>
                            ) : <div />}
                        </nav>
                    )}
                </main>
            </div>
        </div>
    );
}
