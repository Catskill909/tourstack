import { Sparkles, ImageIcon, FileText, PenTool, Archive, Wand2, BookOpen, Tags } from 'lucide-react';

const aiTools = [
    {
        icon: ImageIcon,
        title: 'Image to Text',
        description: 'Extract descriptions from artwork and artifact images using AI vision',
        status: 'coming-soon'
    },
    {
        icon: Tags,
        title: 'Smart Cataloging',
        description: 'Automatically categorize and tag museum items with AI-powered classification',
        status: 'coming-soon'
    },
    {
        icon: PenTool,
        title: 'Content Writing',
        description: 'Generate engaging exhibit descriptions and educational content',
        status: 'coming-soon'
    },
    {
        icon: Archive,
        title: 'Collection Analysis',
        description: 'Analyze your collection for patterns, themes, and curatorial insights',
        status: 'coming-soon'
    },
    {
        icon: Wand2,
        title: 'Caption Generator',
        description: 'Create accessible alt-text and captions for all media',
        status: 'coming-soon'
    },
    {
        icon: BookOpen,
        title: 'Educational Scripts',
        description: 'Generate age-appropriate educational content for different audiences',
        status: 'coming-soon'
    },
    {
        icon: FileText,
        title: 'Metadata Enrichment',
        description: 'Enhance item records with AI-suggested metadata and cross-references',
        status: 'coming-soon'
    },
];

export function AIAssistance() {
    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        AI Assistance
                    </h1>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                        Intelligent tools to help museums create, catalog, and curate
                    </p>
                </div>
            </div>

            {/* Beta Notice */}
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Wand2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                            AI Features Coming Soon
                        </h3>
                        <p className="text-[var(--color-text-secondary)] text-sm">
                            We're building powerful AI tools specifically designed for museums and cultural institutions.
                            These features will help you streamline cataloging, generate engaging content, and enhance
                            visitor experiences with minimal effort.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tools Grid */}
            <div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Upcoming AI Tools
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {aiTools.map((tool) => (
                        <div
                            key={tool.title}
                            className="group relative bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-5 hover:border-purple-500/30 transition-all duration-300"
                        >
                            {/* Coming Soon Badge */}
                            <div className="absolute top-4 right-4">
                                <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-300 rounded-full">
                                    Coming Soon
                                </span>
                            </div>

                            <div className="p-2.5 w-fit rounded-lg bg-[var(--color-bg-elevated)] group-hover:bg-purple-500/10 transition-colors mb-4">
                                <tool.icon className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-purple-400 transition-colors" />
                            </div>

                            <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                                {tool.title}
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                {tool.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Request Feature */}
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-default)] rounded-xl p-6">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                    Have an idea for an AI tool?
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                    We're actively developing new features based on museum needs. Let us know what AI capabilities would help your institution the most.
                </p>
                <button
                    className="px-4 py-2 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-default)] rounded-lg text-[var(--color-text-primary)] text-sm font-medium transition-colors"
                    onClick={() => window.open('mailto:feedback@tourstack.app?subject=AI%20Feature%20Request', '_blank')}
                >
                    Request a Feature
                </button>
            </div>
        </div>
    );
}
