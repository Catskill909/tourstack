import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles, Clock, Accessibility, HelpCircle, Image as ImageIcon } from 'lucide-react';
import * as conciergeService from '../../lib/conciergeService';
import type { ParsedConciergeConfig, ParsedQuickAction } from '../../lib/conciergeService';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    language?: string;
    tourId?: string;  // Optional: pass to get tour-specific AI responses
}

// Category icons mapping
const CATEGORY_ICONS: Record<string, typeof Clock> = {
    hours: Clock,
    accessibility: Accessibility,
    services: HelpCircle,
    exhibitions: ImageIcon,
    general: MessageCircle,
};

// Default quick actions fallback
const DEFAULT_QUICK_ACTIONS = [
    { icon: '🚻', label: 'Restrooms', question: 'Where are the restrooms?' },
    { icon: '🍽️', label: 'Food & Drink', question: 'Is there a café or restaurant?' },
    { icon: '♿', label: 'Accessibility', question: 'What accessibility features do you have?' },
    { icon: '⏰', label: 'Hours', question: 'What are your opening hours?' },
    { icon: '🎫', label: 'Tickets', question: 'How much does admission cost?' },
    { icon: '🅿️', label: 'Parking', question: 'Where can I park?' },
];

export function ChatDrawer({ isOpen, onClose, language = 'en', tourId }: ChatDrawerProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<ParsedConciergeConfig | null>(null);
    const [configLoading, setConfigLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch concierge config
    useEffect(() => {
        async function loadConfig() {
            try {
                const data = await conciergeService.getConfig();
                setConfig(data);
            } catch (error) {
                console.error('Failed to load concierge config:', error);
            } finally {
                setConfigLoading(false);
            }
        }
        loadConfig();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when drawer opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Get welcome message for current language
    const welcomeMessage = config?.welcomeMessage?.[language] || config?.welcomeMessage?.en || "Hi! I'm your museum concierge.";

    // Get quick actions for current language
    const quickActions = config?.quickActions?.filter((a: ParsedQuickAction) => a.enabled !== false).map((action: ParsedQuickAction) => ({
        id: action.id,
        category: action.category,
        question: action.question[language] || action.question.en || '',
    })) || [];

    const sendMessage = async (text: string) => {
        if (!text.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, language, tourId })
            });

            if (!res.ok) throw new Error('Failed to get response');

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again or ask a staff member for help.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        }

        setLoading(false);
    };

    const handleQuickAction = (question: string) => {
        sendMessage(question);
    };

    const resetChat = () => {
        setMessages([]);
        setInput('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-zinc-900 border-l border-zinc-700 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-zinc-700 bg-zinc-800/50">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-400" />
                                <h2 className="text-lg font-medium text-white">Museum Concierge</h2>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button
                                        onClick={resetChat}
                                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white text-xs"
                                        title="New Chat"
                                    >
                                        New Chat
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 ? (
                                <>
                                    <div className="text-center py-4">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                                            <MessageCircle className="w-8 h-8 text-amber-400" />
                                        </div>
                                        <p className="text-zinc-300 mb-1">{welcomeMessage}</p>
                                        <p className="text-zinc-500 text-sm">How can I help you today?</p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Quick Questions</p>
                                        {configLoading ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                                            </div>
                                        ) : quickActions.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2">
                                                {quickActions.map(action => {
                                                    const CategoryIcon = CATEGORY_ICONS[action.category] || MessageCircle;
                                                    return (
                                                        <button
                                                            key={action.id}
                                                            onClick={() => handleQuickAction(action.question)}
                                                            className="flex items-center gap-3 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left text-sm transition-colors"
                                                        >
                                                            <CategoryIcon className="w-4 h-4 text-amber-400" />
                                                            <span className="text-zinc-300">{action.question}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {DEFAULT_QUICK_ACTIONS.map(action => (
                                                    <button
                                                        key={action.label}
                                                        onClick={() => handleQuickAction(action.question)}
                                                        className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-left text-sm transition-colors"
                                                    >
                                                        <span>{action.icon}</span>
                                                        <span className="text-zinc-300">{action.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.role === 'user'
                                                ? 'bg-amber-600 text-white rounded-br-md'
                                                : 'bg-zinc-800 text-zinc-100 rounded-bl-md'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3">
                                        <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                                    placeholder="Ask a question..."
                                    disabled={loading}
                                    className="flex-1 bg-zinc-700 text-white placeholder-zinc-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={loading || !input.trim()}
                                    className="p-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:text-zinc-500 rounded-xl transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

/**
 * Floating chat button for visitor pages
 */
export function ChatFloatingButton({ onClick }: { onClick: () => void }) {
    return (
        <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={onClick}
            className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-full shadow-lg shadow-amber-900/30 flex items-center justify-center z-30 transition-all hover:scale-105"
        >
            <MessageCircle className="w-6 h-6 text-white" />
        </motion.button>
    );
}
