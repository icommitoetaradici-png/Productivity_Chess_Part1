import { useMemo } from 'react';
import { Chess, type Color, type Square } from 'chess.js';

interface BoardStylesParams {
  chessGame: Chess;
  isUnderdefended: boolean;
  isOverdefended: boolean;
  isVulnerable: boolean;
  showCheckHighlights: boolean;
  isPinned: boolean;
  showForks: boolean;
  optionSquares: Record<string, React.CSSProperties>;
}

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 1000,
};

const getSquareAt = (i: number, j: number): Square => {
  const file = 'abcdefgh'[j];
  const rank = 8 - i;
  return `${file}${rank}` as Square;
};

export const useBoardStyles = ({
  chessGame,
  isUnderdefended,
  isOverdefended,
  isVulnerable,
  showCheckHighlights,
  isPinned,
  showForks,
  optionSquares,
}: BoardStylesParams) => {
  const fen = chessGame.fen();

  return useMemo(() => {
    // --- Generate board squares ---
    const squares = Array.from({ length: 8 }, (_, i) =>
      Array.from({ length: 8 }, (_, j) => getSquareAt(i, j))
    ).flat();

    // --- Map squares to pieces ---
    const boardMap = new Map<Square, ReturnType<typeof chessGame.get>>();
    for (const sq of squares) {
      const piece = chessGame.get(sq);
      if (piece) boardMap.set(sq, piece);
    }

    // --- Attackers map ---
    const attackersMap = new Map<Square, { w: Square[]; b: Square[] }>();
    for (const sq of squares) {
      attackersMap.set(sq, {
        w: chessGame.attackers(sq, 'w'),
        b: chessGame.attackers(sq, 'b'),
      });
    }

    const isSquareSafe = (game: Chess, square: Square, color: Color) => {
      const opponent = color === 'w' ? 'b' : 'w';
      const attackers = game.attackers(square, opponent);
      const defenders = game.attackers(square, color);
      if (attackers.length === 0) return true;
      if (defenders.length >= attackers.length) return true;
      return false;
    };

    // --- PIN DETECTION ---
    const potentialPins = new Map<Square, { pinSquares: Set<Square>; targets: Set<Square> }>();

    if (isPinned) {
      const turn = chessGame.turn();
      const sliders = new Set(['b', 'r', 'q']);

      for (const [square, piece] of boardMap.entries()) {
        if (!piece || piece.color !== turn || !sliders.has(piece.type)) continue;

        const moves = chessGame.moves({ square, verbose: true });
        const pinSquares = new Set<Square>();
        const pinTargets = new Set<Square>();

        for (const move of moves) {
          const temp = new Chess(fen);
          temp.move(move);
          if (!isSquareSafe(temp, move.to as Square, turn)) continue;

          const board = temp.board();
          const dirs = [
            [1, 0], [-1, 0], [0, 1], [0, -1],
            [1, 1], [1, -1], [-1, 1], [-1, -1],
          ];

          const fromI = 8 - Number(move.to[1]);
          const fromJ = 'abcdefgh'.indexOf(move.to[0]);

          dirs.forEach(([di, dj]) => {
            let firstEnemy: Square | null = null;
            for (let step = 1; step < 8; step++) {
              const ni = fromI + di * step;
              const nj = fromJ + dj * step;
              if (ni < 0 || ni >= 8 || nj < 0 || nj >= 8) break;

              const p = board[ni][nj];
              if (!p) continue;

              const sq = `${'abcdefgh'[nj]}${8 - ni}` as Square;

              if (p.color !== turn) {
                if (!firstEnemy) firstEnemy = sq;
                else {
                  const valuable = ['k', 'q', 'r'].includes(p.type);
                  const isDiag = di !== 0 && dj !== 0;
                  const validSlider =
                    (isDiag && ['b', 'q'].includes(piece.type)) ||
                    (!isDiag && ['r', 'q'].includes(piece.type));

                  if (valuable && validSlider) {
                    pinSquares.add(move.to as Square);
                    pinTargets.add(firstEnemy);
                  }
                  break;
                }
              } else break;
            }
          });
        }

        if (pinSquares.size) {
          potentialPins.set(square, { pinSquares, targets: pinTargets });
        }
      }
    }

    // --- CHECKS ---
    const checkSquaresByPiece = new Map<Square, Set<Square>>();
    if (showCheckHighlights) {
      const turn = chessGame.turn();
      for (const [square, piece] of boardMap.entries()) {
        if (!piece || piece.color !== turn) continue;
        const moves = chessGame.moves({ square, verbose: true });
        const checks = new Set<Square>();
        for (const move of moves) {
          const temp = new Chess(fen);
          temp.move(move);
          if (temp.inCheck()) checks.add(move.to as Square);
        }
        if (checks.size) checkSquaresByPiece.set(square, checks);
      }
    }

    // --- FORKS ---
    // --- FORKS ---
    const forksByPiece = new Map<Square, { forkSquares: Set<Square>; targets: Set<Square> }>();
    if (showForks) {
      const turn = chessGame.turn();

      for (const [square, piece] of boardMap.entries()) {
        if (!piece || piece.color !== turn || piece.type === 'k') continue;

        const moves = chessGame.moves({ square, verbose: true });
        const forkSquares = new Set<Square>();
        const forkTargets = new Set<Square>();

        for (const move of moves) {
          const temp = new Chess(fen);
          temp.move(move);

          const attackedTargets: Square[] = [];
          for (const targetSq of squares) {
            const targetPiece = temp.get(targetSq);
            if (!targetPiece || targetPiece.color === turn) continue;

            // If the moved piece is attacking this opponent piece
            const attackers = temp.attackers(targetSq, turn);
            if (attackers.includes(move.to as Square)) attackedTargets.push(targetSq);
          }

          if (attackedTargets.length >= 2) {
            forkSquares.add(move.to as Square);
            attackedTargets.forEach(sq => forkTargets.add(sq));
          }
        }

        if (forkSquares.size) forksByPiece.set(square, { forkSquares, targets: forkTargets });
      }
    }

    // --- STYLES ---
    const styles: Record<string, React.CSSProperties> = { ...optionSquares };

    for (const [square, piece] of boardMap.entries()) {
      if (!piece) continue;

      const myColor = piece.color;
      const oppColor = myColor === 'w' ? 'b' : 'w';
      const myAttackers = attackersMap.get(square)?.[myColor] ?? [];
      const oppAttackers = attackersMap.get(square)?.[oppColor] ?? [];

      const pieceVal = PIECE_VALUES[piece.type];
      let shadow: string | undefined;

      if (isUnderdefended && oppAttackers.length > myAttackers.length) shadow = 'inset 0 0 30px rgba(255,0,0,1)';
      if (isOverdefended && myAttackers.length > oppAttackers.length + 1) {
        const myVal = myAttackers.reduce((sum, sq) => {
          const p = boardMap.get(sq);
          return sum + (p ? PIECE_VALUES[p.type] : 0);
        }, 0);
        const oppVal = oppAttackers.reduce((sum, sq) => {
          const p = boardMap.get(sq);
          return sum + (p ? PIECE_VALUES[p.type] : 0);
        }, 0);
        const intensity = Math.min((myVal - oppVal) / pieceVal, 0.6);
        shadow = `inset 0 0 ${intensity * 40}px green`;
      }
      if (isVulnerable && myAttackers.length === 0 && oppAttackers.length === 0) shadow = 'inset 0 0 30px black';
      if (shadow) styles[square] = { ...styles[square], boxShadow: shadow };
    }

    // Pins, checks, forks visual styles
    for (const [origin, { pinSquares, targets }] of potentialPins.entries()) {
      styles[origin] = { ...styles[origin], boxShadow: 'inset 0 0 30px orange' };
      pinSquares.forEach(sq => (styles[sq] = { ...styles[sq], border: '3px solid orange' }));
      targets.forEach(sq => (styles[sq] = { ...styles[sq], boxShadow: 'inset 0 0 15px orange' }));
    }

    for (const [, squares] of checkSquaresByPiece.entries()) {
      squares.forEach(sq => (styles[sq] = { ...styles[sq], boxShadow: 'inset 0 0 0 7px red' }));
    }

    for (const [origin, { forkSquares, targets }] of forksByPiece.entries()) {
      styles[origin] = { ...styles[origin], boxShadow: '0 0 10px cyan' };
      forkSquares.forEach(sq => (styles[sq] = { ...styles[sq], border: '3px solid cyan' }));
      targets.forEach(sq => (styles[sq] = { ...styles[sq], boxShadow: 'inset 0 0 20px cyan' }));
    }

    // --- ARROWS ---
    const arrows: Array<{ startSquare: string; endSquare: string; color: string }> = [];

    // Pins arrows: pin square → pinned piece, pinned piece → piece behind
    for (const [_, { pinSquares, targets }] of potentialPins.entries()) {
      pinSquares.forEach(pinSq => {
        targets.forEach(target => {
          arrows.push({ startSquare: pinSq, endSquare: target, color: 'orange' });

        });
      });
    }

    // Forks arrows
    for (const [origin, { forkSquares, targets }] of forksByPiece.entries()) {
      forkSquares.forEach(fksq => {
        targets.forEach(target =>
          arrows.push({ startSquare: fksq, endSquare: target, color: 'cyan' }
          )
        );
      })

    }

    return { styles, arrows };
  }, [
    fen,
    chessGame,
    isUnderdefended,
    isOverdefended,
    isVulnerable,
    isPinned,
    showCheckHighlights,
    showForks,
    optionSquares,
  ]);
};
