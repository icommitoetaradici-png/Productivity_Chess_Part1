'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BookMove } from '../hooks/useBookMoves';

interface MoveAnalysisProps {
    diff: number | null;
    mate: number | null;
    openingName?: string | null;
    bookMoves?: BookMove[];
    showEngineReaction: boolean;
    showBookMoves: boolean;
}

// Enhanced AnimatedText component
// Added 'key' in usage to restart animation when text changes
const AnimatedText = ({ text, className }: { text: string; className?: string }) => {
    if (!text) return null;

    return (
        <span className="inline-flex flex-wrap justify-center">
            {text.split('').map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03, ease: "easeOut" }}
                    className={className}
                >
                    {char === ' ' ? '\u00A0' : char}
                </motion.span>
            ))}
        </span>
    );
};

const MoveAnalysis = ({ diff, mate, openingName, bookMoves, showEngineReaction, showBookMoves }: MoveAnalysisProps) => {
    const isBookMove = !!openingName && showBookMoves;

    const engineRemark = useMemo(() => {
        if (mate !== null) return mate > 0 ? 'Winning!' : 'Tough Spot';
        if (diff === null) return 'Analyzing...';
        if (diff >= 0.05) return 'Best Move';
        if (diff >= -0.15) return 'Excellent';
        if (diff >= -0.45) return 'Good';
        if (diff >= -0.90) return 'Inaccuracy';
        if (diff >= -2.00) return 'Mistake';
        return 'Blunder';
    }, [diff, mate]);

    const diffDisplay = useMemo(() => {
        if (mate !== null) return mate > 0 ? `M${mate}` : `M${mate}`;
        return diff === null ? '—' : (diff > 0 ? '+' : '') + diff.toFixed(2);
    }, [diff, mate]);

    if (!showEngineReaction && !showBookMoves) return null;
    
    // If we're not supposed to show engine, and there are no book moves we shouldn't render the main box either
    const showMainSection = isBookMove || showEngineReaction;

    return (
        <div className="w-full max-w-sm mx-auto bg-neutral-900 border border-neutral-800 rounded-xl text-white overflow-hidden shadow-xl">

            {/* Main Analysis Section */}
            {showMainSection && (
                <div className="p-5 text-center">
                    <AnimatePresence mode="wait">
                        {isBookMove ? (
                            <motion.div
                                key="book-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-2"
                            >
                                <div className="inline-block px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                                    {/* Key prop ensures animation replays if text changes */}
                                    <AnimatedText key="book-label" text="Book Move" />
                                </div>
                                <div className="text-base font-semibold text-white leading-tight">
                                    <AnimatedText key={openingName} text={openingName || ''} />
                                </div>
                            </motion.div>
                        ) : showEngineReaction ? (
                            <motion.div
                                key="engine-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-1"
                            >
                                <p className="text-xs uppercase tracking-wider text-neutral-500">
                                    <AnimatedText key="quality-label" text="Move Quality" />
                                </p>
                                <h3 className="text-xl font-bold text-white">
                                    <AnimatedText key={engineRemark} text={engineRemark} />
                                </h3>
                                <p className="text-xs text-neutral-400 font-mono h-4">
                                    <AnimatedText key={diffDisplay} text={diffDisplay} />
                                </p>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            )}

            {/* Theory Section */}
            {showBookMoves && bookMoves && bookMoves.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="border-t border-neutral-800 bg-neutral-900/50 p-4"
                >
                    <p className="text-[10px] uppercase text-neutral-600 font-bold tracking-widest mb-3 text-center">
                        <AnimatedText key="theory-label" text="Theory" />
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {bookMoves.map((m, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + (i * 0.05), duration: 0.2 }}
                                className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-md text-xs text-neutral-300 font-mono"
                            >
                                {m.san}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default MoveAnalysis;