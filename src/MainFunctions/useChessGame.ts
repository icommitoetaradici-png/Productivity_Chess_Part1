import { useRef, useState } from 'react';
import { Chess, type PieceSymbol } from 'chess.js';
import type { PieceDropHandlerArgs } from 'react-chessboard';

export function useChessGame() {
    const chessGameRef = useRef(new Chess());
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

        resetMoveState();
        setPosition(chessGame.fen());
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

// "8/8/8/4k3/8/8/4P3/4K3 w - - 0 1",      # Distant Opposition
// "3k4/3P4/3K4/8/8/8/8/8 w - - 0 1",      # Key Squares
// "8/8/8/k7/P7/1P6/8/K7 w - - 0 1",       # Protected Passed Pawn
// "8/8/8/k2P4/8/8/8/K7 w - - 0 1",        # The Square (Basic)
// "8/8/8/k2P4/8/8/8/2K5 w - - 0 1",       # The Square (Intermediate)
// "8/7p/5k1P/8/8/8/5K2/8 w - - 0 1",      # Bahr's Rule (Pawn Race)
// "8/8/4k3/4P3/8/5K2/8/8 w - - 0 1",      # Short Side/Long Side basic
//
// # --- ROOK ENDGAMES (Lucena, Bridge, etc.) ---
// "1K6/1P1r4/8/k7/8/8/2R5/8 w - - 0 1",    # Lucena Position (The Bridge)
// "R7/8/8/8/8/k7/1p6/1K6 w - - 0 1",      # Skewer Win
// "8/5k2/8/R7/8/4P3/4K3/8 w - - 0 1",     # Rook behind passed pawn
// "7k/R7/4P3/8/8/8/8/K7 w - - 0 1",       # 7th rank rook + pawn
// "8/8/1r6/k1P5/8/1R6/8/K7 w - - 0 1",    # Rook vs Pawn (Cutting off the King)
//
// # --- MINOR PIECE ENDGAMES ---
// "8/8/8/8/4k1p1/8/5NK1/8 w - - 0 1",      # Knight vs Pawn
// "8/8/8/8/8/2B5/k1P5/2K5 w - - 0 1",      # Bishop + Pawn (Wrong corner avoidance)
// "8/8/2n5/8/8/2k5/2P5/2K5 w - - 0 1",    # Pawn vs Knight
// "8/8/8/8/2b5/2k5/2P5/2K5 w - - 0 1",    # Pawn vs Bishop

//# --- QUEEN ENDGAMES ---
//"8/8/8/Q7/k7/1p6/8/K7 w - - 0 1",       # Queen vs Pawn on 7th (Winning case)
//"2Q5/8/8/8/8/1k6/1p6/1K6 w - - 0 1",    # Queen vs Pawn on 7th (Knight pawn)

//# --- MULTI-PIECE (7 or fewer) ---
//"8/8/8/8/4k3/1r6/1P1R4/1K6 w - - 0 1",  # Rook/Pawn vs Rook
//"8/8/8/8/k7/1p6/1B1R4/1K6 w - - 0 1",  # Rook/Bishop vs Rook
//"4k3/4P3/4K3/1B6/8/8/8/8 w - - 0 1",    # Bishop/Pawn Mate pattern
//"8/k1P5/8/1N6/8/8/8/K7 w - - 0 1",      # Knight/Pawn vs King
// "8/8/k1P5/1B6/8/8/8/K7 w - - 0 1",      # Bishop/Pawn vs King
//   "3k4/1P6/3K4/1N6/8/8/8/8 w - - 0 1",    # Knight + Pawn winning setup