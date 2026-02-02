import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    BookOpen,
    ListChecks,
    MessageSquareQuote,
    Tags,
    Loader2,
    Check,
    ChevronDown,
    FileText,
    Wand2,
    CheckSquare,
    Square,
} from 'lucide-react';
import type { DocumentCollectionItem } from '../../lib/collectionService';

interface AIResult {
    summary?: string;
    facts?: string[];
    faq?: Array<{ question: string; answer: string }>;
    tags?: string[];
}

interface DocumentAIToolsPanelProps {
    documents: DocumentCollectionItem[];
    selectedDocId: string | null;
    onUpdateDocument: (docId: string, aiAnalysis: AIResult) => void;
    onBatchUpdateDocuments: (updates: Array<{ id: string; aiAnalysis: AIResult }>) => void;
    fullWidth?: boolean;
}

type ToolType = 'summarize' | 'facts' | 'faq' | 'tags';

const TOOLS: { id: ToolType; label: string; description: string; icon: typeof BookOpen }[] = [
    { id: 'summarize', label: 'Summarize', description: 'Generate concise summary', icon: BookOpen },
    { id: 'facts', label: 'Extract Facts', description: 'Extract key facts & dates', icon: ListChecks },
    { id: 'faq', label: 'Generate FAQ', description: 'Create visitor Q&A', icon: MessageSquareQuote },
    { id: 'tags', label: 'Auto-Tag', description: 'Generate keyword tags', icon: Tags },
];

export function DocumentAIToolsPanel({
    documents,
    selectedDocId,
    onUpdateDocument,
    onBatchUpdateDocuments,
    fullWidth = false,
}: DocumentAIToolsPanelProps) {
    const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
    const [runningTool, setRunningTool] = useState<ToolType | null>(null);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
    const [results, setResults] = useState<AIResult | null>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('summary');

    // Batch selection state
    const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());
    const [batchResults, setBatchResults] = useState<Array<{ id: string; fileName: string; success: boolean; tool: ToolType }>>([]);

    const selectedDoc = selectedDocId ? documents.find((d) => d.id === selectedDocId) : null;
    const docsWithText = documents.filter((d) => d.metadata.extractedText);

    // Toggle document selection for batch
    const toggleBatchSelection = (docId: string) => {
        setSelectedForBatch(prev => {
            const next = new Set(prev);
            if (next.has(docId)) {
                next.delete(docId);
            } else {
                next.add(docId);
            }
            return next;
        });
    };

    // Select/deselect all for batch
    const toggleSelectAll = () => {
        if (selectedForBatch.size === docsWithText.length) {
            setSelectedForBatch(new Set());
        } else {
            setSelectedForBatch(new Set(docsWithText.map(d => d.id)));
        }
    };

    // Run AI tool on single document
    const runToolOnDocument = async (doc: DocumentCollectionItem, tool: ToolType): Promise<AIResult | null> => {
        if (!doc.metadata.extractedText) return null;

        try {
            const response = await fetch('/api/gemini/analyze-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: doc.metadata.extractedText,
                    tool,
                }),
            });

            if (!response.ok) {
                console.error('AI analysis failed:', response.statusText);
                return null;
            }

            const data = await response.json();
            return { [tool === 'summarize' ? 'summary' : tool]: data.result };
        } catch (error) {
            console.error('AI analysis error:', error);
            return null;
        }
    };

    // Run tool on selected document
    const handleRunTool = async (tool: ToolType) => {
        if (!selectedDoc || !selectedDoc.metadata.extractedText) return;

        setRunningTool(tool);
        setResults(null);

        const result = await runToolOnDocument(selectedDoc, tool);
        if (result) {
            setResults((prev) => ({ ...prev, ...result }));
            const existingAnalysis = selectedDoc.metadata.aiAnalysis || {};
            onUpdateDocument(selectedDoc.id, { ...existingAnalysis, ...result });
        }

        setRunningTool(null);
    };

    // Run all tools on selected document
    const handleRunAllTools = async () => {
        if (!selectedDoc || !selectedDoc.metadata.extractedText) return;

        setRunningTool('summarize');
        const allResults: AIResult = {};

        for (const tool of TOOLS) {
            setRunningTool(tool.id);
            const result = await runToolOnDocument(selectedDoc, tool.id);
            if (result) {
                Object.assign(allResults, result);
            }
        }

        setResults(allResults);
        onUpdateDocument(selectedDoc.id, allResults);
        setRunningTool(null);
    };

    // Batch process selected documents
    const handleBatchAnalyze = async (tool: ToolType) => {
        const docsToProcess = docsWithText.filter(d => selectedForBatch.has(d.id));
        console.log('Starting batch analyze:', tool, 'docs:', docsToProcess.length);
        if (docsToProcess.length === 0) return;

        setRunningTool(tool);
        setBatchProgress({ current: 0, total: docsToProcess.length });
        setBatchResults([]);

        const updates: Array<{ id: string; aiAnalysis: AIResult }> = [];
        const newResults: Array<{ id: string; fileName: string; success: boolean; tool: ToolType }> = [];

        for (let i = 0; i < docsToProcess.length; i++) {
            const doc = docsToProcess[i];
            setBatchProgress({ current: i + 1, total: docsToProcess.length });

            const result = await runToolOnDocument(doc, tool);
            console.log('Batch doc result:', doc.metadata.fileName, result ? 'success' : 'failed');
            if (result) {
                const existingAnalysis = doc.metadata.aiAnalysis || {};
                updates.push({ id: doc.id, aiAnalysis: { ...existingAnalysis, ...result } });
                newResults.push({ id: doc.id, fileName: doc.metadata.fileName, success: true, tool });
            } else {
                newResults.push({ id: doc.id, fileName: doc.metadata.fileName, success: false, tool });
            }
        }

        console.log('Batch complete. Updates:', updates.length, 'Results:', newResults);
        onBatchUpdateDocuments(updates);
        setBatchResults(newResults);
        setRunningTool(null);
        setBatchProgress({ current: 0, total: 0 });
    };

    const displayData = selectedDoc?.metadata.aiAnalysis || results;

    // Render a result section (collapsible)
    const renderResultSection = (key: string, title: string, content: React.ReactNode) => (
        <div className="border border-[var(--color-border-default)] rounded-lg overflow-hidden">
            <button
                onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--color-bg-hover)]"
            >
                <span className="font-medium text-sm text-emerald-500">{title}</span>
                <ChevronDown
                    className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expandedSection === key ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {expandedSection === key && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--color-border-default)]"
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <div className="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border-default)] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border-default)] flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-[var(--color-text-primary)]">AI Document Tools</h3>
                    <p className="text-xs text-[var(--color-text-muted)]">Powered by Gemini</p>
                </div>
                {/* Tab Switcher - Inline in Header for fullWidth */}
                {fullWidth && (
                    <div className="flex gap-1 bg-[var(--color-bg-elevated)] rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('single')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'single'
                                ? 'bg-emerald-500 text-white'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            Single
                        </button>
                        <button
                            onClick={() => setActiveTab('batch')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'batch'
                                ? 'bg-emerald-500 text-white'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            Batch ({docsWithText.length})
                        </button>
                    </div>
                )}
            </div>

            {/* Tab Switcher - Full row for narrow mode */}
            {!fullWidth && (
                <div className="flex border-b border-[var(--color-border-default)]">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'single'
                            ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Single Document
                    </button>
                    <button
                        onClick={() => setActiveTab('batch')}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'batch'
                            ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5'
                            : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                            }`}
                    >
                        Batch ({docsWithText.length})
                    </button>
                </div>
            )}

            <div className="p-4">
                {/* Single Document Mode */}
                {activeTab === 'single' && (
                    <div className={fullWidth ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                        {/* Left Column: Selected Doc & Tools */}
                        <div className="space-y-4">
                            {selectedDoc ? (
                                <>
                                    {/* Selected doc info */}
                                    <div className="flex items-center gap-3 p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                                        <FileText className="w-5 h-5 text-amber-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                                                {selectedDoc.metadata.fileName}
                                            </p>
                                            {selectedDoc.metadata.extractedText ? (
                                                <p className="text-xs text-green-500">
                                                    {selectedDoc.metadata.extractedText.length.toLocaleString()} characters extracted
                                                </p>
                                            ) : (
                                                <p className="text-xs text-amber-500">No text available</p>
                                            )}
                                        </div>
                                    </div>

                                    {selectedDoc.metadata.extractedText ? (
                                        <>
                                            {/* Tool Buttons Grid - 4 columns in fullWidth, 2 in narrow */}
                                            <div className={`grid gap-2 ${fullWidth ? 'grid-cols-4' : 'grid-cols-2'}`}>
                                                {TOOLS.map((tool) => (
                                                    <button
                                                        key={tool.id}
                                                        onClick={() => handleRunTool(tool.id)}
                                                        disabled={!!runningTool}
                                                        className={`
                                                            flex items-center gap-2 p-3 rounded-lg border transition-all text-left
                                                            ${displayData?.[tool.id === 'summarize' ? 'summary' : tool.id]
                                                                ? 'border-green-500/50 bg-green-500/5'
                                                                : 'border-[var(--color-border-default)] hover:border-emerald-500/50 hover:bg-emerald-500/5'
                                                            }
                                                            ${runningTool ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                    >
                                                        {runningTool === tool.id ? (
                                                            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                                        ) : displayData?.[tool.id === 'summarize' ? 'summary' : tool.id] ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <tool.icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                                {tool.label}
                                                            </p>
                                                            <p className="text-xs text-[var(--color-text-muted)] hidden lg:block">
                                                                {tool.description}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Run All Button */}
                                            <button
                                                onClick={handleRunAllTools}
                                                disabled={!!runningTool}
                                                className={`
                                                    w-full flex items-center justify-center gap-2 p-3 rounded-lg font-medium transition-colors
                                                    ${runningTool
                                                        ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed'
                                                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                    }
                                                `}
                                            >
                                                {runningTool ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Running...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Wand2 className="w-4 h-4" />
                                                        Run All Tools
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-sm text-[var(--color-text-muted)] text-center py-4">
                                            This document doesn't have extracted text for AI analysis.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-[var(--color-text-muted)]">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Select a document above to analyze</p>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Results (only in fullWidth when we have data) */}
                        {fullWidth && displayData && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-[var(--color-text-primary)] text-sm">Analysis Results</h4>
                                {displayData.summary && renderResultSection(
                                    'summary',
                                    'Summary',
                                    <p className="p-3 text-sm text-[var(--color-text-secondary)]">{displayData.summary}</p>
                                )}
                                {displayData.facts && displayData.facts.length > 0 && renderResultSection(
                                    'facts',
                                    `Facts (${displayData.facts.length})`,
                                    <ul className="p-3 space-y-2">
                                        {displayData.facts.map((fact, i) => (
                                            <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                                                <span className="text-emerald-500">•</span>
                                                {fact}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {displayData.faq && displayData.faq.length > 0 && renderResultSection(
                                    'faq',
                                    `FAQ (${displayData.faq.length})`,
                                    <div className="p-3 space-y-3">
                                        {displayData.faq.map((item, i) => (
                                            <div key={i}>
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">Q: {item.question}</p>
                                                <p className="text-sm text-[var(--color-text-secondary)] mt-1">A: {item.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {displayData.tags && displayData.tags.length > 0 && renderResultSection(
                                    'tags',
                                    `Tags (${displayData.tags.length})`,
                                    <div className="p-3 flex flex-wrap gap-2">
                                        {displayData.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Results in narrow mode - below tools */}
                        {!fullWidth && displayData && (
                            <div className="space-y-2 mt-4">
                                {displayData.summary && renderResultSection(
                                    'summary',
                                    'Summary',
                                    <p className="p-3 text-sm text-[var(--color-text-secondary)]">{displayData.summary}</p>
                                )}
                                {displayData.facts && displayData.facts.length > 0 && renderResultSection(
                                    'facts',
                                    `Facts (${displayData.facts.length})`,
                                    <ul className="p-3 space-y-2">
                                        {displayData.facts.map((fact, i) => (
                                            <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-start gap-2">
                                                <span className="text-emerald-500">•</span>
                                                {fact}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {displayData.tags && displayData.tags.length > 0 && renderResultSection(
                                    'tags',
                                    `Tags (${displayData.tags.length})`,
                                    <div className="p-3 flex flex-wrap gap-2">
                                        {displayData.tags.map((tag, i) => (
                                            <span key={i} className="px-2 py-1 text-xs bg-emerald-500/10 text-emerald-500 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Batch Mode */}
                {activeTab === 'batch' && (
                    <div className={fullWidth ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
                        {/* Left: Document Selection */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Select documents to process ({selectedForBatch.size} of {docsWithText.length})
                                </p>
                                <button
                                    onClick={toggleSelectAll}
                                    className="text-xs text-emerald-500 hover:text-emerald-400 font-medium"
                                >
                                    {selectedForBatch.size === docsWithText.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            {docsWithText.length > 0 ? (
                                <>
                                    {/* Document checklist */}
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {docsWithText.map((doc) => {
                                            const isSelected = selectedForBatch.has(doc.id);
                                            const hasAI = doc.metadata.aiAnalysis;
                                            return (
                                                <button
                                                    key={doc.id}
                                                    onClick={() => toggleBatchSelection(doc.id)}
                                                    className={`
                                                        w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left
                                                        ${isSelected
                                                            ? 'border-emerald-500/50 bg-emerald-500/5'
                                                            : 'border-[var(--color-border-default)] hover:border-emerald-500/30'
                                                        }
                                                    `}
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <Square className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
                                                    )}
                                                    <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                                                        {doc.metadata.fileName}
                                                    </span>
                                                    {hasAI && (
                                                        <span className="text-xs text-green-500 shrink-0">AI ✓</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Tool Buttons */}
                                    <div className={`grid gap-2 ${fullWidth ? 'grid-cols-2' : 'grid-cols-2'}`}>
                                        {TOOLS.map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => handleBatchAnalyze(tool.id)}
                                                disabled={!!runningTool || selectedForBatch.size === 0}
                                                className={`
                                                    flex items-center gap-2 p-3 rounded-lg border transition-all text-left
                                                    border-[var(--color-border-default)] hover:border-emerald-500/50 hover:bg-emerald-500/5
                                                    ${runningTool || selectedForBatch.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                                                `}
                                            >
                                                {runningTool === tool.id ? (
                                                    <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                                                ) : (
                                                    <tool.icon className="w-4 h-4 text-[var(--color-text-muted)]" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                        {tool.label}
                                                    </p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {selectedForBatch.size} docs
                                                    </p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Progress indicator */}
                                    {runningTool && batchProgress.total > 0 && (
                                        <div className="p-3 bg-[var(--color-bg-elevated)] rounded-lg">
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-[var(--color-text-muted)]">Processing...</span>
                                                <span className="text-emerald-500">
                                                    {batchProgress.current} / {batchProgress.total}
                                                </span>
                                            </div>
                                            <div className="h-2 bg-[var(--color-bg-surface)] rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500 transition-all"
                                                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-8 text-[var(--color-text-muted)]">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No documents with extracted text</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Batch Results */}
                        {fullWidth && batchResults.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-[var(--color-text-primary)] text-sm">
                                    Batch Results ({batchResults.filter(r => r.success).length}/{batchResults.length} successful)
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {batchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className={`
                                                flex items-center gap-3 p-2 rounded-lg border
                                                ${result.success
                                                    ? 'border-green-500/30 bg-green-500/5'
                                                    : 'border-red-500/30 bg-red-500/5'
                                                }
                                            `}
                                        >
                                            {result.success ? (
                                                <Check className="w-4 h-4 text-green-500 shrink-0" />
                                            ) : (
                                                <span className="w-4 h-4 text-red-500 shrink-0">✗</span>
                                            )}
                                            <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                                                {result.fileName}
                                            </span>
                                            <span className="text-xs text-[var(--color-text-muted)]">
                                                {TOOLS.find(t => t.id === result.tool)?.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Batch results in narrow mode */}
                        {!fullWidth && batchResults.length > 0 && (
                            <div className="space-y-2 mt-4">
                                <h4 className="font-medium text-[var(--color-text-primary)] text-sm">
                                    Results ({batchResults.filter(r => r.success).length}/{batchResults.length})
                                </h4>
                                <div className="space-y-1">
                                    {batchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            {result.success ? (
                                                <Check className="w-3 h-3 text-green-500" />
                                            ) : (
                                                <span className="w-3 h-3 text-red-500">✗</span>
                                            )}
                                            <span className="text-[var(--color-text-secondary)] truncate">
                                                {result.fileName}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
