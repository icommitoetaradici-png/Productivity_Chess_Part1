import { useRef, useState } from 'react';
import { Chess, type PieceSymbol } from 'chess.js';
import type { PieceDropHandlerArgs } from 'react-chessboard';

export function useChessGame() {
    const chessGameRef = useRef(new Chess('8/3k4/4r3/5p2/8/3N1B1P/5K2/8 w - -'));
    const chessGame = chessGameRef.current;

    const [position, setPosition] = useState(chessGame.fen());
    const [moveFrom, setMoveFrom] = useState('');
    const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
    const [promotionMove, setPromotionMove] = useState<{ sourceSquare: string; targetSquare: string } | null>(null);
    const [premoves, setPremoves] = useState<PieceDropHandlerArgs[]>([]);
    const [_showAnimations, setShowAnimations] = useState(true);
    const premovesRef = useRef<PieceDropHandlerArgs[]>([]);


    const clearPremoves = () => {
        premovesRef.current = [];
        setPremoves([...premovesRef.current]);
    };

    const resetMoveState = (shouldClearPremoves: boolean = false) => {
        setMoveFrom('');
        setOptionSquares({});
        setPromotionMove(null);
        if (shouldClearPremoves) {
            clearPremoves();
        }
        setShowAnimations(false);

        // re-enable animations after a short delay
        setTimeout(() => {
            setShowAnimations(true);
        }, 50);

    };

    const updatePosition = (newFen: string) => {
        setPosition(newFen);
        console.log(newFen);
    };


    const getGameState = () => ({
        fen: chessGame.fen(),
        isGameOver: chessGame.isGameOver(),
        turn: chessGame.turn(),
        moves: chessGame.moves({ verbose: true })
    });

    const makeMove = (from: string, to: string, promotion?: PieceSymbol): boolean => {
        try {
            chessGame.move({ from, to, promotion } as any);
            setPosition(chessGame.fen());
            resetMoveState();
            return true;
        } catch {
            return false;
        }
    };

    const undo = (count = 1) => {
        for (let i = 0; i < count; i++) {
            chessGame.undo();
        }
        setPosition(chessGame.fen());
        resetMoveState();
    };

    return {
        chessGame,
        position,
        moveFrom,
        optionSquares,

        promotionMove,
        premoves,
        premovesRef,
        setPosition,
        setMoveFrom,
        setOptionSquares,
        setPromotionMove,
        setPremoves,
        resetMoveState,
        updatePosition,
        getGameState,
        makeMove,
        undo
    };
}