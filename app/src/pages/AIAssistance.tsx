import { useState } from 'react';
import {
    Sparkles,
    Image as ImageIcon,
    Type,
    Tags,
    MessageSquare,
    FileText,
    Play,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmartTagGenerator } from '../components/tools/SmartTagGenerator';

type ToolId = 'image-to-text' | 'caption-generator' | 'smart-cataloging' | 'content-writing' | null;

export function AIAssistance() {
    const [activeTool, setActiveTool] = useState<ToolId>(null);

    const tools = [
        {
            id: 'image-to-text',
            title: 'AI Object Analysis',
            description: 'Generate detailed captions, extract text (OCR), and analyze visual DNA (mood, lighting, style).',
            icon: ImageIcon,
            status: 'beta' as const,
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20'
        },
        {
            id: 'smart-cataloging',
            title: 'Smart Cataloging',
            description: 'Automatically categorize and tag museum items with AI-powered classification',
            icon: Tags,
            status: 'coming-soon' as const,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20'
        },
        {
            id: 'content-writing',
            title: 'Content Writing',
            description: 'Generate engaging exhibit descriptions and educational content',
            icon: FileText,
            status: 'coming-soon' as const,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-400/20'
        },
        {
            id: 'collection-analysis',
            title: 'Collection Analysis',
            description: 'Analyze your collection for patterns, themes, and curatorial insights',
            icon: Type, // Placeholder
            status: 'coming-soon' as const,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20'
        },
        {
            id: 'caption-writer',
            title: 'Caption Writer',
            description: 'Generate descriptive natural language captions for your artifacts (Coming Soon).',
            icon: MessageSquare,
            status: 'coming-soon' as const,
            color: 'text-pink-400',
            bg: 'bg-pink-400/10',
            border: 'border-pink-400/20'
        },
        {
            id: 'educational-scripts',
            title: 'Educational Scripts',
            description: 'Generate age-appropriate educational content for different audiences',
            icon: Play, // Placeholder
            status: 'coming-soon' as const,
            color: 'text-cyan-400',
            bg: 'bg-cyan-400/10',
            border: 'border-cyan-400/20'
        }
    ];

    return (
        // Root container with negative margin to counteract MainLayout padding
        // This allows the sticky header to sit flush with the viewport top
        <div className="min-h-full -m-6 flex flex-col">
            {/* Tool View Header - Sticky */}
            {/* Rendered outside AnimatePresence to ensure position:sticky works (avoids stacking context issues) */}
            {activeTool && (
                <div className="sticky -top-6 z-40 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-default)] px-6 py-4 shadow-md">
                    <div className="max-w-6xl mx-auto flex items-center gap-4">
                        <button
                            onClick={() => setActiveTool(null)}
                            className="p-2.5 rounded-lg bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 transition-all font-medium"
                            title="Back to Tools"
                        >
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                AI Object Analysis
                            </h2>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {activeTool ? (
                        <motion.div
                            key="tool-view"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6"
                        >
                            <div className="max-w-6xl mx-auto">
                                <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] p-6 min-h-[600px]">
                                    {activeTool === 'image-to-text' && <SmartTagGenerator />}
                                    {activeTool !== 'image-to-text' && (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-12">
                                            <div className="p-4 rounded-full bg-[var(--color-bg-elevated)] mb-4">
                                                <Sparkles className="w-8 h-8 text-[var(--color-text-muted)]" />
                                            </div>
                                            <h3 className="text-xl font-medium text-[var(--color-text-primary)] mb-2">
                                                Coming Soon
                                            </h3>
                                            <p className="text-[var(--color-text-muted)] max-w-md">
                                                This AI tool is currently in development. Check back soon for updates.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6 space-y-8 max-w-6xl mx-auto"
                        >

                            {/* Header - Only visible in Dashboard */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">AI Assistance</h1>
                                        <p className="text-[var(--color-text-muted)] text-lg">
                                            Intelligent tools to help museums create, catalog, and curate
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Featured Banner */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 p-8">
                                <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[100px] rounded-full" />

                                <div className="relative z-10 max-w-2xl space-y-4">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        AI Features Coming Soon
                                    </div>
                                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                                        We're building powerful AI tools specifically designed for museums and cultural institutions.
                                        These features will help you streamline cataloging, generate engaging content, and enhance
                                        visitor experiences with minimal effort.
                                    </p>
                                </div>
                            </div>

                            {/* Tools Grid */}
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Upcoming AI Tools</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => {
                                                if (tool.status === 'beta') {
                                                    setActiveTool(tool.id as ToolId);
                                                }
                                            }}
                                            disabled={tool.status === 'coming-soon'}
                                            className={`
                                            group relative p-6 rounded-xl border text-left transition-all duration-300
                                            flex flex-col h-full
                                            ${tool.status === 'coming-soon'
                                                    ? 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] opacity-60 cursor-not-allowed'
                                                    : 'bg-[var(--color-bg-surface)] border-[var(--color-border-default)] hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer'
                                                }
                                        `}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`p-3 rounded-lg ${tool.bg} ${tool.color}`}>
                                                    <tool.icon className="w-6 h-6" />
                                                </div>
                                                <span className={`
                                                text-xs font-medium px-2 py-1 rounded-full border
                                                ${tool.status === 'coming-soon'
                                                        ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border-default)]'
                                                        : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    }
                                            `}>
                                                    {tool.status === 'coming-soon' ? 'Coming Soon' : 'Beta Access'}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 group-hover:text-purple-400 transition-colors">
                                                {tool.title}
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                                                {tool.description}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )
                    }
                </AnimatePresence>
            </div>
        </div>
    );
}
