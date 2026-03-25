import { Chess, type Square, type PieceSymbol } from 'chess.js';

export class MoveHandler {
    private chess: Chess;
    constructor(chess: Chess) {
        this.chess = chess;
    }

    getLegalMoves(square: string) {
        return this.chess.moves({ square: square as Square, verbose: true });
    }

    isPromotionMove(from: string, to: string): boolean {
        const moves = this.getLegalMoves(from);
        return moves.some(m => m.to === to && m.flags.includes('p'));
    }

    /**
     * Checks if it's the turn of the piece being moved.
     */
    isMyTurn(piece: { pieceType: string }): boolean {
        return this.chess.turn() === piece.pieceType[0];
    }

    executeMove(from: string, to: string, promotion?: PieceSymbol): boolean {
        try {
            this.chess.move({ from, to, promotion });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns visual styles for available moves for a given square.
     */
    getAvailableMovesSquares(square: string) {
        const moves = this.getLegalMoves(square);
        const squares: Record<string, React.CSSProperties> = {};

        moves.forEach(m => {
            squares[m.to] = {
                background: this.chess.get(m.to as Square)
                    ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
                borderRadius: '50%'
            };
        });

        squares[square] = { background: 'rgba(255, 255, 0, 0.4)' };
        return squares;
    }
}