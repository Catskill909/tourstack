import { useMemo } from 'react';

interface TranscriptWord {
    word: string;
    start: number;
    end: number;
    confidence: number;
}

interface ClosedCaptionsProps {
    words: TranscriptWord[];
    currentTime: number;
    isVisible?: boolean;
    maxWords?: number;
    className?: string;
    size?: 'small' | 'normal';
}

export function ClosedCaptions({
    words,
    currentTime,
    isVisible = true,
    maxWords = 12,
    className = '',
    size = 'normal',
}: ClosedCaptionsProps) {
    // Build sentences from words and find current sentence
    const currentSentence = useMemo(() => {
        if (!words || words.length === 0) return null;

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
    }, [words, currentTime, maxWords]);

    if (!isVisible || !currentSentence) return null;

    const textSize = size === 'small' ? 'text-sm' : 'text-base';
    const padding = size === 'small' ? 'px-3 py-2' : 'px-4 py-3';

    return (
        <div className={`${padding} bg-black/80 backdrop-blur-sm rounded-lg ${className}`}>
            <p className={`text-center text-white ${textSize} leading-relaxed`}>
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
