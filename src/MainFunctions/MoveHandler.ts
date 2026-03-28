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
                    ? 'radial-gradient(circle, rgba(0,0,0,.2) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 30%, transparent 30%)',
                borderRadius: '50%'
            };
        });

        squares[square] = { background: 'rgba(255, 255, 255, 0.4)' };
        return squares;
    }

    getTheoreticalMoves(square: string, pieceType: string, pieceColor: string): string[] {
        const file = square.charCodeAt(0);
        const rank = parseInt(square[1], 10);
        const moves: string[] = [];

        const addIfValid = (f: number, r: number) => {
            if (f >= 97 && f <= 104 && r >= 1 && r <= 8) {
                moves.push(`${String.fromCharCode(f)}${r}`);
            }
        };

        const pType = pieceType.toLowerCase();
        if (pType === 'p') {
            const direction = pieceColor === 'w' ? 1 : -1;
            const startRank = pieceColor === 'w' ? 2 : 7;
            addIfValid(file, rank + direction);
            if (rank === startRank) {
                addIfValid(file, rank + 2 * direction);
            }
            addIfValid(file - 1, rank + direction);
            addIfValid(file + 1, rank + direction);
        } else if (pType === 'n') {
            const kn = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
            kn.forEach(([df, dr]) => addIfValid(file + df, rank + dr));
        } else if (pType === 'b') {
            for (let i = 1; i <= 7; i++) {
                addIfValid(file + i, rank + i);
                addIfValid(file - i, rank + i);
                addIfValid(file + i, rank - i);
                addIfValid(file - i, rank - i);
            }
        } else if (pType === 'r') {
            for (let i = 1; i <= 7; i++) {
                addIfValid(file + i, rank);
                addIfValid(file - i, rank);
                addIfValid(file, rank + i);
                addIfValid(file, rank - i);
            }
        } else if (pType === 'q') {
            for (let i = 1; i <= 7; i++) {
                addIfValid(file + i, rank);
                addIfValid(file - i, rank);
                addIfValid(file, rank + i);
                addIfValid(file, rank - i);
                addIfValid(file + i, rank + i);
                addIfValid(file - i, rank + i);
                addIfValid(file + i, rank - i);
                addIfValid(file - i, rank - i);
            }
        } else if (pType === 'k') {
            const kn = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            kn.forEach(([df, dr]) => addIfValid(file + df, rank + dr));
            if (square === 'e1' && pieceColor === 'w') {
                addIfValid(file + 2, rank);
                addIfValid(file - 2, rank);
            }
            if (square === 'e8' && pieceColor === 'b') {
                addIfValid(file + 2, rank);
                addIfValid(file - 2, rank);
            }
        }

        return [...new Set(moves)];
    }

    getPremoveOptionSquares(square: string, pieceType: string, pieceColor: string) {
        const moves = this.getTheoreticalMoves(square, pieceType, pieceColor);
        const squares: Record<string, React.CSSProperties> = {};

        moves.forEach(m => {
            squares[m] = {
                background: this.chess.get(m as Square)
                    ? 'radial-gradient(circle, rgba(0,0,0,.2) 85%, transparent 85%)'
                    : 'radial-gradient(circle, rgba(0,0,0,.1) 30%, transparent 30%)',
                borderRadius: '50%'
            };
        });

        squares[square] = { background: 'rgba(0, 0, 0, 0)' };
        return squares;
    }
}