import { useEffect, useState, useRef } from 'react';
import { fenStringToPositionObject } from 'react-chessboard';
import type { PieceDropHandlerArgs, PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import type { PieceSymbol } from 'chess.js';

import { useChessGame } from './MainFunctions/useChessGame';
import { MoveHandler } from './MainFunctions/MoveHandler';
import { useBoardStyles } from './MainFunctions/useBoardStyles';

// Custom Hooks
import { useEvaluation } from './hooks/useEvaluation';
import { useEngine } from './hooks/useEngine';
import { useBookMoves } from './hooks/useBookMoves';

import EvalBar from './components/EvalBar';
import EngineControls from './components/EngineControls';
import AnalysisToggles from './components/AnalysisToggles';
import { PromotionDialog, BoardComponent } from './components/BoardComponents';
import MoveAnalysis from './components/MoveAnalysis';

import type { AnalysisState } from './types';

export default function App() {
  const game = useChessGame();


  // Logic Hooks
  const { currentEval, mateIn, diff, registerMoveForAnalysis, clearAnalysis } = useEvaluation(game.chessGame, game.position);
  const { elo, isRandom, isThinking, handleEloChange, handleModeToggle, makeEngineMove } = useEngine(game);
  const { openingName, bookMoves } = useBookMoves(game.position);



  const [analysis, setAnalysis] = useState<AnalysisState>({
    isPinned: false,
    isOverdefended: false,
    isUnderdefended: false,
    isVulnerable: false,
    showCheckHighlights: false,
    showForks: false,
  });

  const toggleAnalysis = (key: keyof AnalysisState) => setAnalysis(prev => ({ ...prev, [key]: !prev[key] }));

  const moveHandler = useRef(new MoveHandler(game.chessGame));

  useEffect(() => {
    moveHandler.current = new MoveHandler(game.chessGame);
  }, [game.chessGame]);

  // --- Board styling ---
  const visualStyles = useBoardStyles({
    chessGame: game.chessGame,
    ...analysis,
    optionSquares: game.optionSquares,
  });

  // --- Handlers ---
  const onPromotionSelect = (piece: PieceSymbol) => {
    if (!game.promotionMove) return;

    const oldEval = currentEval;
    moveHandler.current.executeMove(game.promotionMove.sourceSquare, game.promotionMove.targetSquare, piece);
    const newFen = game.chessGame.fen();
    game.updatePosition(newFen);

    registerMoveForAnalysis(newFen, oldEval, 'w');

    game.setPromotionMove(null);
    game.resetMoveState();
    setTimeout(() => makeEngineMove(onPieceDrop), 300);
  };

  const onPieceDrop = (args: PieceDropHandlerArgs): boolean => {
    const { sourceSquare, targetSquare, piece } = args;
    if (!targetSquare || sourceSquare === targetSquare) return false;
    if (piece.pieceType[0] !== 'w') return false;

    const oldEval = currentEval;

    if (moveHandler.current.isPromotionMove(sourceSquare, targetSquare)) {
      game.setPromotionMove({ sourceSquare, targetSquare });
      return true;
    }
    const pieceColor = piece.pieceType[0]; // 'w' or 'b'
    if (game.chessGame.turn() !== pieceColor) {
      game.premovesRef.current.push({
        sourceSquare,
        targetSquare,
        piece
      });
      game.setPremoves([...game.premovesRef.current]);
      // return early to stop processing the move and return true to not animate the move
      return true;
    }

    if (moveHandler.current.executeMove(sourceSquare, targetSquare, 'q')) {
      const newFen = game.chessGame.fen();
      game.updatePosition(newFen);

      registerMoveForAnalysis(newFen, oldEval, 'w');

      game.resetMoveState();
      setTimeout(() => makeEngineMove(onPieceDrop), 500);
      return true;
    }


    return false;
  };

  const onSquareClick = ({ square, piece }: SquareHandlerArgs) => {
    if (game.promotionMove) return;
    if (!game.moveFrom && piece && piece.pieceType[0] === game.chessGame.turn()) {
      game.setOptionSquares(moveHandler.current.getAvailableMovesSquares(square));
      game.setMoveFrom(square);
    } else if (game.moveFrom) {
      const legalMoves = moveHandler.current.getLegalMoves(game.moveFrom).map(m => m.to);
      if (legalMoves.includes(square as any)) {
        const pieceData = game.chessGame.get(game.moveFrom as any);
        if (pieceData) {
          onPieceDrop({
            sourceSquare: game.moveFrom,
            targetSquare: square as any,
            piece: { pieceType: `${pieceData.color}${pieceData.type.toUpperCase()}`, isSparePiece: false, position: square } as any
          });
        }
      }
      game.resetMoveState();
    }
  };

  const onSquareRightClick = () => {
    game.resetMoveState(true);
  };

  const handleUndo = () => {
    if (isThinking) return;
    const turn = game.chessGame.turn();
    const count = turn === 'b' ? 1 : 2;
    game.undo(count);
    clearAnalysis();
  };

  // --- UI Board Setup ---
  const currentPosition = fenStringToPositionObject(game.position, 8, 8);
  const finalSquareStyles: Record<string, React.CSSProperties> = {
    ...visualStyles.styles, // <-- use the styles object
  };
  game.premoves.forEach(p => {
    delete currentPosition[p.sourceSquare];
    currentPosition[p.targetSquare!] = { pieceType: p.piece.pieceType };
    finalSquareStyles[p.sourceSquare] = { backgroundColor: 'rgba(255,0,0,0.2)' };
    finalSquareStyles[p.targetSquare!] = { backgroundColor: 'rgba(255,0,0,0.2)' };
  });




  ////////////// Premoving logics

  function canDragPiece({
    piece
  }: PieceHandlerArgs) {
    return piece.pieceType[0] === 'w';
  }

  // create a position object from the fen string to split the premoves from the game state
  const position = fenStringToPositionObject(game.position, 8, 8);
  const squareStyles: Record<string, React.CSSProperties> = {};

  // add premoves to the position object to show them on the board
  for (const premove of game.premoves) {
    delete position[premove.sourceSquare];
    position[premove.targetSquare!] = {
      pieceType: premove.piece.pieceType
    };
    squareStyles[premove.sourceSquare] = {
      backgroundColor: 'rgba(255,0,0,0.2)'
    };
    squareStyles[premove.targetSquare!] = {
      backgroundColor: 'rgba(255,0,0,0.2)'
    };
  }




  return (
    <div className="flex w-screen min-h-screen items-center justify-center bg-black p-4 md:p-8 font-sans antialiased text-white">
      <div className="flex flex-col md:flex-row items-start justify-center gap-6 md:gap-10 w-full max-w-[1200px]">
        <EvalBar evaluation={currentEval} mate={mateIn} />

        <div className="relative w-full max-w-[460px] shrink-0 border-2 border-neutral-900 rounded shadow-2xl">
          <PromotionDialog
            promotionMove={game.promotionMove}
            turn={game.chessGame.turn()}
            onSelect={onPromotionSelect}
            onClose={() => game.setPromotionMove(null)}
          />
          <BoardComponent
            position={currentPosition}
            squareStyles={finalSquareStyles}
            onPieceDrop={onPieceDrop}
            onSquareClick={onSquareClick}
            onSquareRightClick={onSquareRightClick}
            arrows={visualStyles.arrows}
            canDragPieces={canDragPiece}
          />
          <MoveAnalysis
            diff={diff}
            mate={mateIn}
            openingName={openingName}
            bookMoves={bookMoves}
          />
        </div>

        <div className="flex flex-col gap-8 w-full md:w-64">
          <EngineControls
            elo={elo}
            isRandom={isRandom}
            isThinking={isThinking}
            canUndo={game.chessGame.history().length > 0}
            onEloChange={handleEloChange}
            onToggleMode={handleModeToggle}
            onUndo={handleUndo}
          />
          <AnalysisToggles state={analysis} onToggle={toggleAnalysis}        // pass state to AnalysisToggles
          />

        </div>
      </div>
    </div>
  );
}
