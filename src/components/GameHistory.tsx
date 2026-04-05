import { useEffect, useRef } from 'react';

interface GameHistoryProps {
  game: any;
}

export default function GameHistory({ game }: GameHistoryProps) {
  const gameState = game.getGameState();
  const history = game.chessGame.history();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history.length]);


  const newGame = () => {
    game.chessGame.reset();
    game.updatePosition(game.chessGame.fen());
    game.resetMoveState(true);
  };

  const regenerate = () => {
    game.chessGame.reset();
    game.updatePosition(game.chessGame.fen());
    game.resetMoveState(true);
  };

  const copyFEN = () => {
    navigator.clipboard.writeText(game.chessGame.fen());
  };

  // Determine game result
  let resultStr = "Game Over";
  let reasonStr = "";
  if (gameState.isGameOver) {
    if (game.chessGame.isCheckmate()) {
      resultStr = game.chessGame.turn() === 'w' ? "Black Wins" : "White Wins";
      reasonStr = "by Checkmate";
    } else if (game.chessGame.isDraw()) {
      resultStr = "Draw";
      if (game.chessGame.isStalemate()) reasonStr = "by Stalemate";
      else if (game.chessGame.isThreefoldRepetition()) reasonStr = "by Repetition";
      else if (game.chessGame.isInsufficientMaterial()) reasonStr = "by Insufficient Material";
      else reasonStr = "by 50-move rule";
    }
  }

  const customGameState = {
    isGameOver: gameState.isGameOver,
    result: resultStr,
    reason: reasonStr
  };

  return (
    <div className="w-100! xl:w-80 bg-neutral-900/40 border border-neutral-800 rounded-xl p-5 flex flex-col h-[300px] backdrop-blur-sm shadow-2xl">
      <h3 className="font-semibold text-lg tracking-tight mb-4 border-b border-neutral-800 pb-2">Game History</h3>

      {/* Scrollable History List */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-1 pr-12 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-neutral-700"
      >
        {history.reduce((result: any[], move: string, index: number) => {
          if (index % 2 === 0) {
            result.push([move]);
          } else {
            result[result.length - 1].push(move);
          }
          return result;
        }, []).map((pair: string[], i: number) => (
          <div key={i} className="flex items-center justify-between text-sm px-2 py-1.5 rounded hover:bg-white/5  transition-colors group">
            <span className="text-neutral-500 font-mono text-xs w-6">{i + 1}.</span>
            <div className="flex gap-6 font-mono text-neutral-200">
              <span className="w-15 text-right group-hover:text-white transition-colors">{pair[0]}</span>
              <span className="w-15 text-right group-hover:text-white transition-colors">{pair[1] || ''}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Game Result Display */}
      {customGameState.isGameOver && (
        <div className="mb-4 p-4 bg-linear-to-r from-neutral-800 to-neutral-900 border-2 border-white/20 rounded-lg text-center">
          <div className="text-xl font-bold text-white mb-1">{customGameState.result}</div>
          <div className="text-sm text-neutral-400">{customGameState.reason}</div>
        </div>
      )}

      {/* History Footer Actions */}
      <div className="mt-4 pt-4 border-t border-neutral-800 flex flex-col gap-2">
        {customGameState.isGameOver ? (
          <button
            onClick={newGame}
            className="w-full px-4 py-2 bg-black! text-black hover:bg-neutral-200 rounded text-sm font-bold transition-colors border border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            New Game
          </button>
        ) : (
          <button
            onClick={regenerate}
            className="w-full px-4 py-2 bg-zinc-900! hover:bg-neutral-700 text-white rounded text-sm font-medium transition-colors border border-neutral-700"
          >
            Regenerate
          </button>
        )}
        <button
          onClick={copyFEN}
          className="w-full px-4 py-2 bg-zinc-900! hover:bg-neutral-700 text-white rounded text-sm font-medium transition-colors border border-neutral-700"
        >
          Copy FEN
        </button>
      </div>
    </div>
  );
}
