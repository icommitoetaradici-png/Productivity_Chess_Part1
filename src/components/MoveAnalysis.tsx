import { useMemo } from 'react';
import type { BookMove } from '../hooks/useBookMoves';

interface MoveAnalysisProps {
    diff: number | null;
    mate: number | null;
    openingName?: string | null;
    bookMoves?: BookMove[];
}

const MoveAnalysis = ({ diff, mate, openingName, bookMoves }: MoveAnalysisProps) => {
    const remark = useMemo(() => {
        if (mate !== null) {
            return mate > 0 ? 'Winning Performance!' : 'Tough Spot...';
        }
        if (diff === null) return 'Analyzing...';

        if (diff >= 0.05) return 'Best Move';
        if (diff >= -0.15) return 'Excellent Move';
        if (diff >= -0.45) return 'Good Move';
        if (diff >= -0.90) return 'Inaccuracy';
        if (diff >= -2.00) return 'Mistake';
        return 'Blunder';
    }, [diff, mate]);

    const diffDisplay = useMemo(() => {
        if (mate !== null) return mate > 0 ? `Mate in ${mate}` : `Mate in ${Math.abs(mate)}`;
        return diff === null ? '—' : (diff > 0 ? '+' : '') + diff.toFixed(2);
    }, [diff, mate]);

    return (
        <div className="p-4 rounded border border-neutral-700 bg-neutral-900 text-center border-l-4 border-l-blue-500">
            {openingName && (
                <div className="mb-3 pb-2 border-b border-neutral-800">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Opening</p>
                    <p className="text-sm font-medium text-blue-400">{openingName}</p>
                </div>
            )}

            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
                Your Move Analysis
            </p>
            <p className="text-lg font-bold text-white mb-1">{remark}</p>
            <p className="text-[10px] text-neutral-400 mb-2">
                Eval change: <span className="font-mono text-neutral-200">{diffDisplay}</span>
            </p>

            {bookMoves && bookMoves.length > 0 && (
                <div className="mt-3 pt-2 border-t border-neutral-800">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1 tracking-widest">Book Moves</p>
                    <div className="flex flex-wrap justify-center gap-1">
                        {bookMoves.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-neutral-800 rounded text-[10px] text-neutral-300 font-mono">
                                {m.san}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoveAnalysis;
