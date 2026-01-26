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
    Eye
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
            { slug: 'content-blocks', title: 'All Content Blocks', description: 'Complete block reference', icon: Layers },
        ]
    },
    {
        title: 'Visitor Experience',
        icon: Smartphone,
        description: 'How visitors interact with your tours',
        items: [
            { slug: 'qr-codes', title: 'QR Codes', description: 'Print and display codes', icon: QrCode },
            { slug: 'visitor-view', title: 'The Visitor View', description: 'What visitors see', icon: Eye },
            { slug: 'multilingual', title: 'Multiple Languages', description: 'Reach all visitors', icon: Languages },
        ]
    },
    {
        title: 'AI Features',
        icon: Sparkles,
        description: 'Smart tools that save you time',
        items: [
            { slug: 'magic-translate', title: 'Magic Translate', description: 'One-click translation', icon: Globe },
            { slug: 'ai-audio', title: 'AI Audio Generation', description: 'Text-to-speech voices', icon: Mic },
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
                The complete platform for creating and managing museum audio tours.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">What is TourStack?</h2>
            <p className="text-neutral-300 mb-4">
                TourStack is an all-in-one tool that lets museum staff create self-guided tours
                for visitors. Instead of expensive audio guide equipment, visitors simply scan
                a QR code with their phone to access tour content.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-white/5 rounded-xl">
                    <Users className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">For Staff</h3>
                    <p className="text-sm text-neutral-400">Create and manage all tour content from one dashboard</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                    <Smartphone className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">For Visitors</h3>
                    <p className="text-sm text-neutral-400">Scan a QR code to get the tour on their phone</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                    <Globe className="w-6 h-6 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Any Language</h3>
                    <p className="text-sm text-neutral-400">Automatic translation to reach all visitors</p>
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
                            Each stop represents a location in your museum - an artwork, exhibit, or point of interest.
                            Stops contain the actual content visitors see: text, images, and audio.
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
                            Stops are built from blocks - reusable pieces of content you can add in any order.
                            Add a text block, then an image, then audio. Drag to reorder. Simple as that.
                        </p>
                    </div>
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
            <h2 className="text-xl font-semibold text-white mb-4">Downloading QR Codes</h2>
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
                            <h3 className="font-medium text-white mb-1">Go to Positioning Tab</h3>
                            <p className="text-sm text-neutral-400">Click the "Positioning" tab at the top of the stop editor</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">3</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Download PNG</h3>
                            <p className="text-sm text-neutral-400">Click "Download QR Code" to get a print-ready 500×500px PNG file</p>
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
                <h3 className="font-semibold text-white mb-1">Printing Tips</h3>
                <ul className="text-neutral-400 text-sm space-y-1">
                    <li>• Print at least 2 inches (5cm) square for reliable scanning</li>
                    <li>• Use matte finish to reduce glare from gallery lighting</li>
                    <li>• Test the QR code after printing to ensure it works</li>
                    <li>• Include the stop number below the QR code for reference</li>
                </ul>
            </div>
        </div>
    </div>
);

const VisitorViewPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">The Visitor View</h1>
            <p className="text-xl text-neutral-400">
                What visitors see when they scan a QR code and access your tour.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Clean Mobile Experience</h2>
            <p className="text-neutral-300 mb-4">
                The visitor view is designed for phones. It's clean, fast, and focused on the content.
                No app download required - it works in any mobile browser.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">What Visitors See</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li>✓ Stop title and description</li>
                        <li>✓ Images and galleries</li>
                        <li>✓ Audio player with controls</li>
                        <li>✓ Navigation to next/previous stops</li>
                        <li>✓ Language switcher (if enabled)</li>
                    </ul>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <h3 className="font-medium text-white mb-2">What's Hidden</h3>
                    <ul className="space-y-2 text-sm text-neutral-400">
                        <li>✗ Admin controls</li>
                        <li>✗ Edit buttons</li>
                        <li>✗ Draft content</li>
                        <li>✗ Analytics dashboard</li>
                        <li>✗ Settings menus</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Preview Before Publishing</h2>
            <p className="text-neutral-300 mb-4">
                Always preview your content before making it public. The preview shows exactly what visitors will see.
            </p>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-white" />
                    <div>
                        <h3 className="font-medium text-white">Click "Preview" in the Stop Editor</h3>
                        <p className="text-sm text-neutral-400">Opens a device-sized preview showing the mobile experience</p>
                    </div>
                </div>
            </div>
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
                Magic Translate uses AI to translate all your stop content - text, titles, and descriptions -
                into any language you need. No manual translation required.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Chinese', 'Korean'].map(lang => (
                    <div key={lang} className="p-3 bg-black/50 border border-white/10 rounded-lg text-center">
                        <span className="text-sm text-neutral-300">{lang}</span>
                    </div>
                ))}
            </div>
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
                            <h3 className="font-medium text-white mb-1">Look for the Magic Translate Button</h3>
                            <p className="text-sm text-neutral-400">It's marked with a sparkle icon ✨ in the toolbar</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">3</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Select Target Language</h3>
                            <p className="text-sm text-neutral-400">Choose the language you want to translate to</p>
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold">4</div>
                        <div>
                            <h3 className="font-medium text-white mb-1">Review & Save</h3>
                            <p className="text-sm text-neutral-400">Check the translation and make any needed edits</p>
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
                    <li>• Write clear, simple text in your primary language for best results</li>
                    <li>• Have a native speaker review translations for cultural accuracy</li>
                    <li>• Art-specific terminology may need manual adjustment</li>
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
                Convert your text content into professional narration automatically.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Two Audio Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Mic className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">Deepgram</h3>
                    <p className="text-sm text-neutral-400 mb-3">Fast, cost-effective text-to-speech with natural voices.</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• 7 languages</li>
                        <li>• 40+ voice options</li>
                        <li>• Quick generation</li>
                    </ul>
                </div>
                <div className="p-5 bg-black/50 border border-white/10 rounded-xl">
                    <Volume2 className="w-6 h-6 text-white mb-3" />
                    <h3 className="font-semibold text-white mb-2">ElevenLabs</h3>
                    <p className="text-sm text-neutral-400 mb-3">Premium quality with the most realistic voices available.</p>
                    <ul className="text-xs text-neutral-500 space-y-1">
                        <li>• 32+ languages</li>
                        <li>• Ultra-realistic voices</li>
                        <li>• Emotion control</li>
                    </ul>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Generating Audio</h2>
            <p className="text-neutral-300 mb-4">
                From any text block, you can generate audio narration with a single click.
            </p>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Open a stop and locate a text block</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Click the audio generation button (speaker icon)</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Choose your voice and language</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">Preview the audio, then save when satisfied</span>
                    </li>
                </ol>
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
                Add visual content to enhance the visitor experience.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Image Block Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Image className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Single Image</h3>
                    <p className="text-sm text-neutral-400">Full-width hero image with optional caption</p>
                </div>
                <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                    <Layers className="w-5 h-5 text-white mb-2" />
                    <h3 className="font-medium text-white mb-1">Gallery</h3>
                    <p className="text-sm text-neutral-400">Swipeable carousel of multiple images</p>
                </div>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Uploading Images</h2>
            <div className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <span className="text-neutral-300">Add an Image block to your stop</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <span className="text-neutral-300">Click the upload area or drag and drop an image file</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <span className="text-neutral-300">Add an optional caption</span>
                    </li>
                    <li className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-black text-xs font-bold shrink-0">4</span>
                        <span className="text-neutral-300">For galleries, repeat to add more images</span>
                    </li>
                </ol>
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
                    <li>• Include alt text for accessibility</li>
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
                Complete reference for every block type available in TourStack.
            </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
                { icon: Pencil, name: 'Text', desc: 'Rich formatted text with headers, lists, and links' },
                { icon: Image, name: 'Image', desc: 'Single image with caption' },
                { icon: Layers, name: 'Gallery', desc: 'Swipeable image carousel' },
                { icon: Volume2, name: 'Audio', desc: 'Audio player with controls' },
                { icon: Play, name: 'Timeline Gallery', desc: 'Audio-synced image slideshow' },
                { icon: MapIcon, name: 'Map', desc: 'Interactive map with markers' },
                { icon: FileText, name: 'Tour Block', desc: 'Full-screen tour introduction' },
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
    </div>
);

const MultilingualPage = () => (
    <div className="space-y-8">
        <header>
            <h1 className="text-3xl font-bold text-white mb-4">Multiple Languages</h1>
            <p className="text-xl text-neutral-400">
                Make your tours accessible to international visitors.
            </p>
        </header>

        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">Language Support</h2>
            <p className="text-neutral-300 mb-4">
                TourStack supports multiple languages for every piece of content. Visitors can switch
                languages on their phone, and all content updates instantly.
            </p>
            <div className="p-4 bg-black/50 border border-white/10 rounded-xl">
                <h3 className="font-medium text-white mb-2">How Visitors Switch Languages</h3>
                <p className="text-sm text-neutral-400">
                    A language switcher appears in the visitor view. When they tap it, all text, audio,
                    and other content switches to their selected language.
                </p>
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold text-white mb-4">Setting Up Languages</h2>
            <ol className="space-y-4">
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">1</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Create Content in Primary Language</h3>
                            <p className="text-sm text-neutral-400">Write all your text in your museum's main language first</p>
                        </div>
                    </div>
                </li>
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">2</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Add Additional Languages</h3>
                            <p className="text-sm text-neutral-400">Go to Settings → Languages to enable more languages</p>
                        </div>
                    </div>
                </li>
                <li className="p-5 bg-white/[0.02] border border-white/10 rounded-xl">
                    <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black text-xs font-bold shrink-0">3</span>
                        <div>
                            <h3 className="font-medium text-white mb-1">Translate Content</h3>
                            <p className="text-sm text-neutral-400">Use Magic Translate or add translations manually</p>
                        </div>
                    </div>
                </li>
            </ol>
        </div>
    </div>
);

// Page content mapping
const pageComponents: Record<string, React.ComponentType> = {
    'welcome': WelcomePage,
    'your-first-tour': FirstTourPage,
    'understanding-stops': UnderstandingStopsPage,
    'qr-codes': QRCodesPage,
    'visitor-view': VisitorViewPage,
    'magic-translate': MagicTranslatePage,
    'ai-audio': AIAudioPage,
    'adding-text': AddingTextPage,
    'images-galleries': ImagesGalleriesPage,
    'audio-narration': AudioNarrationPage,
    'content-blocks': ContentBlocksPage,
    'multilingual': MultilingualPage,
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
