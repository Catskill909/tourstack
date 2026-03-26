import { useMemo } from 'react';

interface TranscriptWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

interface ClosedCaptionsProps {
    words?: TranscriptWord[];
    transcript?: string;  // Full transcript text for translated languages
    currentTime: number;
    duration?: number;    // Audio duration for time-based display of translated text
    isVisible?: boolean;
    maxWords?: number;
    className?: string;
    size?: 'small' | 'normal';
}

// Helper: Split text into chunks of roughly equal size (~5 lines worth)
// Handles both Western languages (split by words) and CJK (split by characters)
function splitIntoChunks(text: string, maxCharsPerChunk: number): string[] {
    if (!text) return [];
    
    // Detect if text contains CJK characters (Chinese, Japanese, Korean)
    const hasCJK = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(text);
    
    if (hasCJK) {
        // For CJK: split by character count, try to break at punctuation
        const chunks: string[] = [];
        let remaining = text;
        
        while (remaining.length > 0) {
            if (remaining.length <= maxCharsPerChunk) {
                chunks.push(remaining.trim());
                break;
            }
            
            // Find a good break point (punctuation) within the chunk
            let breakPoint = maxCharsPerChunk;
            const punctuation = /[。！？，、；：""''（）\.\!\?\,\;\:]/;
            
            // Look backwards from maxCharsPerChunk for punctuation
            for (let i = maxCharsPerChunk; i > maxCharsPerChunk * 0.6; i--) {
                if (punctuation.test(remaining[i])) {
                    breakPoint = i + 1;
                    break;
                }
            }
            
            chunks.push(remaining.slice(0, breakPoint).trim());
            remaining = remaining.slice(breakPoint).trim();
        }
        
        return chunks;
    } else {
        // For Western languages: split by sentences first, then combine/split to fit
        const sentenceRegex = /[^.!?]*[.!?]+/g;
        const sentences = text.match(sentenceRegex) || [text];
        const chunks: string[] = [];
        let currentChunk = '';
        
        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;
            
            // If adding this sentence would exceed limit, start new chunk
            if (currentChunk.length + trimmed.length > maxCharsPerChunk && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = trimmed;
            } else {
                currentChunk += (currentChunk ? ' ' : '') + trimmed;
            }
            
            // If current chunk is already too long, split it
            if (currentChunk.length > maxCharsPerChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }
}

export function ClosedCaptions({
    words,
    transcript,
    currentTime,
    duration = 0,
    isVisible = true,
    maxWords = 12,
    className = '',
    size = 'normal',
}: ClosedCaptionsProps) {
    // ~150 chars = ~5 lines on mobile (30 chars per line)
    // For CJK, use ~75 chars (characters are wider)
    const maxCharsPerChunk = 150;
    
    // Build sentences from words (if available) or from transcript text
    const currentSentence = useMemo(() => {
        // If transcript is provided, prefer it (used for translated languages)
        // Only use word-level timestamps if no transcript is provided
        if (transcript && duration > 0) {
            // Split transcript into consistent-sized chunks
            const chunks = splitIntoChunks(transcript, maxCharsPerChunk);
            
            if (chunks.length === 0) return null;
            
            // Calculate which chunk to show based on time
            const timePerChunk = duration / chunks.length;
            const chunkIndex = Math.min(
                Math.floor(currentTime / timePerChunk),
                chunks.length - 1
            );
            
            return chunks[chunkIndex] || null;
        }

        // Fallback: If we have word-level timestamps and no transcript, use them
        if (words && words.length > 0) {
            // Build sentences by detecting sentence boundaries (., !, ?)
            const sentences: { text: string; start: number; end: number }[] = [];
            let currentSentenceWords: TranscriptWord[] = [];
            
            for (let i = 0; i < words.length; i++) {
                currentSentenceWords.push(words[i]);
                const word = words[i].word;
                
                // Check if this word ends a sentence
                const endsWithPunctuation = /[.!?]$/.test(word);
                const isLastWord = i === words.length - 1;
                const sentenceTooLong = currentSentenceWords.length >= maxWords;
                
                if (endsWithPunctuation || isLastWord || sentenceTooLong) {
                    sentences.push({
                        text: currentSentenceWords.map(w => w.word).join(' '),
                        start: currentSentenceWords[0].start,
                        end: currentSentenceWords[currentSentenceWords.length - 1].end,
                    });
                    currentSentenceWords = [];
                }
            }

            // Find the sentence that contains the current time
            for (const sentence of sentences) {
                if (currentTime >= sentence.start && currentTime <= sentence.end + 0.5) {
                    return sentence.text;
                }
            }

            // If between sentences, show nothing or the upcoming one
            for (const sentence of sentences) {
                if (currentTime < sentence.start) {
                    // Show upcoming sentence if we're close (within 0.3s)
                    if (sentence.start - currentTime < 0.3) {
                        return sentence.text;
                    }
                    break;
                }
            }

            return null;
        }

        return null;
    }, [words, transcript, currentTime, duration, maxWords]);

    if (!isVisible || !currentSentence) return null;

    const textSize = size === 'small' ? 'text-sm' : 'text-base';
    const padding = size === 'small' ? 'px-3 py-2' : 'px-4 py-3';

    return (
        <div className={`${padding} bg-black/80 backdrop-blur-sm rounded-lg ${className}`}>
            <p className={`text-left text-white ${textSize} leading-relaxed`}>
                {currentSentence}
            </p>
        </div>
    );
}

interface FullTranscriptProps {
    words: TranscriptWord[];
    currentTime: number;
    isVisible?: boolean;
    className?: string;
    onWordClick?: (time: number) => void;
}

export function FullTranscript({
    words,
    currentTime,
    isVisible = true,
    className = '',
    onWordClick,
}: FullTranscriptProps) {
    if (!isVisible || !words || words.length === 0) return null;

    return (
        <div className={`p-4 bg-black/60 backdrop-blur-sm rounded-xl overflow-y-auto ${className}`}>
            <p className="text-white leading-loose">
                {words.map((word, idx) => {
                    const isCurrentWord = word.start <= currentTime && word.end >= currentTime;
                    const isPastWord = word.end < currentTime;

                    return (
                        <span
                            key={`${idx}-${word.start}`}
                            onClick={() => onWordClick?.(word.start)}
                            className={`inline cursor-pointer hover:bg-white/10 rounded px-0.5 transition-all ${
                                isCurrentWord
                                    ? 'text-yellow-400 font-semibold bg-yellow-400/20'
                                    : isPastWord
                                    ? 'text-gray-400'
                                    : 'text-white/80'
                            }`}
                        >
                            {word.word}{' '}
                        </span>
                    );
                })}
            </p>
        </div>
    );
}
