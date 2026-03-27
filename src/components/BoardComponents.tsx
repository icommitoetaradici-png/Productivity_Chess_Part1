import { Chessboard, chessColumnToColumnIndex, defaultPieces } from 'react-chessboard';
import type { PieceSymbol } from 'chess.js';
import type { PieceDropHandlerArgs, PieceRenderObject } from 'react-chessboard';
import React from 'react';
import type { PromotionMove } from '../types';


interface PromotionDialogProps {
    promotionMove: PromotionMove | null;
    turn: 'w' | 'b';
    onSelect: (piece: PieceSymbol) => void;
    onClose: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
    promotionMove,
    turn,
    onSelect,
    onClose
}) => {
    if (!promotionMove) return null;

    const pieces: PieceSymbol[] = ['q', 'r', 'n', 'b'];
    const isBottom = promotionMove.targetSquare.endsWith('8');
    const colIndex = chessColumnToColumnIndex(promotionMove.targetSquare[0], 8, 'white');


    return (
        <>
            <div className="absolute inset-0 bg-black/20 z-10" onClick={onClose} />
            <div
                className="absolute z-20 bg-white shadow-2xl flex flex-col border border-neutral-300 overflow-hidden"
                style={{
                    width: '12.5%',
                    left: `${(colIndex / 8) * 100}%`,
                    [isBottom ? 'top' : 'bottom']: 0,
                }}
            >
                {pieces.map((piece) => {
                    const PieceComponent = defaultPieces[`${turn}${piece.toUpperCase()}` as keyof PieceRenderObject];

                    return (
                        <button
                            key={piece}
                            onClick={() => onSelect(piece)}
                            className="flex-1 hover:bg-neutral-100 border-b last:border-b-0 border-neutral-200 cursor-pointer transition-colors"
                        >
                            {PieceComponent && <PieceComponent svgStyle={{ width: '100%', height: '100%' }} />}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

interface BoardProps {
    position: Record<string, { pieceType: string }>;
    squareStyles: Record<string, React.CSSProperties>;
    onPieceDrop: (args: PieceDropHandlerArgs) => boolean;
    onSquareClick: (args: any) => void;
    onSquareRightClick: () => void;
    arrows: any;
    canDragPieces: any,
}

export const BoardComponent: React.FC<BoardProps> = (props) => (


    <Chessboard options={{ ...props, showAnimations: true, id: 'chess-board', darkSquareStyle: { backgroundColor: 'rgb(64,64,64)' }, lightSquareStyle: { backgroundColor: 'white' }, animationDurationInMs: 400, }} />

);
