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

  // --- All squares ---
  const squares = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: 8 }, (_, j) => getSquareAt(i, j))
      ).flat(),
    []
  );

  // --- Board map ---
  const boardMap = useMemo(() => {
    const map = new Map<Square, ReturnType<typeof chessGame.get>>();
    for (const sq of squares) {
      const piece = chessGame.get(sq);
      if (piece) map.set(sq, piece);
    }
    return map;
  }, [fen, squares]);

  // --- Attackers map (ALL squares) ---
  const attackersMap = useMemo(() => {
    const map = new Map<Square, { w: Square[]; b: Square[] }>();
    for (const sq of squares) {
      map.set(sq, {
        w: chessGame.attackers(sq, 'w'),
        b: chessGame.attackers(sq, 'b'),
      });
    }
    return map;
  }, [fen, squares]);
  const isSquareSafe = (game: Chess, square: Square, color: Color) => {
    const opponent = color === 'w' ? 'b' : 'w';

    const attackers = game.attackers(square, opponent);
    const defenders = game.attackers(square, color);

    // no one attacks → safe
    if (attackers.length === 0) return true;

    // simple heuristic: more defenders than attackers → safe
    if (defenders.length >= attackers.length) return true;

    return false;
  };

  // --- PIN DETECTION ---
  // --- POTENTIAL PINS ---
  const potentialPins = useMemo(() => {
    const map = new Map<
      Square,
      { pinSquares: Set<Square>; targets: Set<Square> }
    >();

    if (!isPinned) return map;

    const turn = chessGame.turn();

    const sliders = new Set(['b', 'r', 'q']);

    for (const [square, piece] of boardMap.entries()) {
      if (piece?.color !== turn) continue;
      if (!sliders.has(piece.type)) continue;

      const moves = chessGame.moves({ square, verbose: true });

      const pinSquares = new Set<Square>();
      const pinTargets = new Set<Square>();

      for (const move of moves) {
        const temp = new Chess();
        temp.load(fen);
        temp.move(move);
        const isSafe = isSquareSafe(temp, move.to as Square, turn);
        if (!isSafe) continue;
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
              if (!firstEnemy) {
                firstEnemy = sq;
              } else {
                // second piece in line
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
            } else {
              break;
            }
          }
        });
      }

      if (pinSquares.size) {
        map.set(square, {
          pinSquares,
          targets: pinTargets,
        });
      }
    }

    return map;
  }, [fen, isPinned, boardMap]);



  // --- CHECK HIGHLIGHTS ---
  const checkSquaresByPiece = useMemo(() => {
    const map = new Map<Square, Set<Square>>();
    if (!showCheckHighlights) return map;

    const turn = chessGame.turn();

    for (const [square, piece] of boardMap.entries()) {
      if (piece?.color !== turn) continue;

      const moves = chessGame.moves({ square, verbose: true });
      const checks = new Set<Square>();

      for (const move of moves) {
        const temp = new Chess(fen);
        temp.move(move);

        if (temp.inCheck()) {
          checks.add(move.to as Square);
        }
      }

      if (checks.size) map.set(square, checks);
    }

    return map;
  }, [fen, showCheckHighlights, boardMap]);

  // --- FORKS ---
  const forksByPiece = useMemo(() => {
    const map = new Map<
      Square,
      { forkSquares: Set<Square>; targets: Set<Square> }
    >();

    if (!showForks) return map;

    const turn = chessGame.turn();

    for (const [square, piece] of boardMap.entries()) {
      if (piece?.color !== turn) continue;
      if (piece.type === 'k') continue;

      const moves = chessGame.moves({ square, verbose: true });

      const forkSquares = new Set<Square>();
      const forkTargets = new Set<Square>();

      for (const move of moves) {
        const temp = new Chess(fen);
        temp.move(move);
        const isSafe = isSquareSafe(temp, move.to as Square, turn);
        if (!isSafe) continue;

        const attacked: Square[] = [];

        for (const target of squares) {
          const targetPiece = temp.get(target);
          if (!targetPiece || targetPiece.color === turn) continue;

          const attackers = temp.attackers(target, turn);

          if (!attackers.includes(move.to as Square)) continue;

          // --- DEFENSE LOGIC (your style) ---
          const myAttackers = temp.attackers(target, turn);
          const oppAttackers = temp.attackers(
            target,
            turn === 'w' ? 'b' : 'w'
          );

          const isUndefended = oppAttackers.length === 0;
          const isUnderdefended = oppAttackers.length < myAttackers.length;

          // 🎯 Only count meaningful fork targets
          if (isUndefended || isUnderdefended) {
            attacked.push(target);
          }
        }



        if (attacked.length >= 2) {
          forkSquares.add(move.to as Square);
          attacked.forEach(sq => forkTargets.add(sq));
        }
      }

      if (forkSquares.size) {
        map.set(square, { forkSquares, targets: forkTargets });
      }
    }

    return map;
  }, [fen, showForks, boardMap, squares]);

  // --- FINAL STYLES ---
  return useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {
      ...optionSquares,
    };

    for (const [square, piece] of boardMap.entries()) {
      if (piece) {
        const myColor = piece.color;
        const oppColor = myColor === 'w' ? 'b' : 'w';

        const myAttackers = attackersMap.get(square)?.[myColor] ?? [];
        const oppAttackers = attackersMap.get(square)?.[oppColor] ?? [];

        const pieceVal = PIECE_VALUES[piece.type];

        let bgColor: string | undefined;

        // Underdefended
        if (isUnderdefended && oppAttackers.length > myAttackers.length) {
          bgColor = 'rgba(255,0,0,0.6)';
        }

        // Overdefended
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
          bgColor = `rgba(0,255,0,${intensity})`;
        }

        // Vulnerable
        if (isVulnerable && myAttackers.length === 0 && oppAttackers.length === 0) {
          bgColor = 'rgba(128,0,128,0.35)';
        }

        styles[square] = {
          ...styles[square],
          ...(bgColor && { backgroundColor: bgColor }),
        };
      }
      // --- POTENTIAL PINS STYLING ---
      for (const [origin, { pinSquares, targets }] of potentialPins.entries()) {
        // piece that can create pin
        styles[origin] = {
          ...styles[origin],
          boxShadow: '0 0 10px orange',
        };

        // squares where pin happens
        pinSquares.forEach(sq => {
          styles[sq] = {
            ...styles[sq],
            border: '3px solid orange',
          };
        });

        // pieces that would get pinned
        targets.forEach(sq => {
          styles[sq] = {
            ...styles[sq],
            boxShadow: 'inset 0 0 15px orange',
          };
        });
      }
    }

    // --- Checks ---
    for (const [, squares] of checkSquaresByPiece.entries()) {
      for (const sq of squares) {
        styles[sq] = {
          ...styles[sq],
          boxShadow: 'inset 0 0 0 7px red',
        };
      }
    }

    // --- Forks ---
    for (const [origin, { forkSquares, targets }] of forksByPiece.entries()) {
      styles[origin] = {
        ...styles[origin],
        boxShadow: '0 0 10px cyan',
      };

      forkSquares.forEach(sq => {
        styles[sq] = {
          ...styles[sq],
          border: '3px solid cyan',
        };
      });

      targets.forEach(sq => {
        styles[sq] = {
          ...styles[sq],
          boxShadow: 'inset 0 0 20px cyan',
        };
      });
    }

    return styles;
  }, [
    fen,
    boardMap,
    attackersMap,
    potentialPins,
    checkSquaresByPiece,
    forksByPiece,
    isUnderdefended,
    isOverdefended,
    isVulnerable,
    isPinned,
    optionSquares,
  ]);
};
