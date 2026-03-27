import { useState, useEffect, useRef } from 'react';
import { ChessApiEvalEngine } from '../MainFunctions/MoveEngine';

interface PendingAnalysis {
    evalBeforeMove: number;
    side: 'w' | 'b';
}

export function useEvaluation(chessGame: any, position: string) {
    const [currentEval, setCurrentEval] = useState<number>(0);
    const [mateIn, setMateIn] = useState<number | null>(null);
    const [diff, setDiff] = useState<number | null>(null);

    const evalEngineRef = useRef<ChessApiEvalEngine | null>(null);
    const moveAnalysisRef = useRef<{
        pending: Record<string, PendingAnalysis>;
        id: number;
    }>({
        pending: {},
        id: 0,
    });

    useEffect(() => {
        const engineInstance = new ChessApiEvalEngine((evalNum: number, fen: string, mate?: number) => {
            // Only update current context if this evaluation is for the LATEST state
            if (fen === chessGame.fen()) {
                setCurrentEval(evalNum);
                setMateIn(mate ?? null);
            }

            // Check if we were specifically waiting for this FEN to complete move analysis
            const pending = moveAnalysisRef.current.pending[fen];
            if (pending) {
                const { evalBeforeMove: oldEval, side } = pending;
                const rawDiff = evalNum - oldEval;
                const normalizedDiff = side === 'w' ? rawDiff : -rawDiff;

                setDiff(normalizedDiff);
                delete moveAnalysisRef.current.pending[fen];
            }
        });

        evalEngineRef.current = engineInstance;
        return () => engineInstance.terminate();
    }, []);

    useEffect(() => {
        if (!evalEngineRef.current) return;
        const timer = setTimeout(() => evalEngineRef.current?.evaluatePosition(position), 100);
        return () => clearTimeout(timer);
    }, [position]);

    const registerMoveForAnalysis = (fen: string, evalBeforeMove: number, side: 'w' | 'b') => {
        moveAnalysisRef.current.id++;
        moveAnalysisRef.current.pending[fen] = { evalBeforeMove, side };
    };

    const clearAnalysis = () => {
        moveAnalysisRef.current.pending = {};
        setDiff(null);
    };

    return {
        currentEval,
        mateIn,
        diff,
        registerMoveForAnalysis,
        clearAnalysis
    };
}
