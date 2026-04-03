import { useEffect, useState, useRef } from 'react';
import { fenStringToPositionObject } from 'react-chessboard';
import type { PieceDropHandlerArgs, PieceHandlerArgs, SquareHandlerArgs } from 'react-chessboard';
import type { PieceSymbol } from 'chess.js';
import "@radix-ui/themes/styles.css";

import { useChessGame } from './MainFunctions/useChessGame';
import { MoveHandler } from './MainFunctions/MoveHandler';
import { useBoardStyles } from './MainFunctions/useBoardStyles';

// Custom Hooks
import { useEvaluation } from './hooks/useEvaluation';
import { useEngine } from './hooks/useEngine';
import { useBookMoves } from './hooks/useBookMoves';

import EvalBar from './components/EvalBar';
import EngineControls, { Undobutton } from './components/EngineControls';
import { PromotionDialog, BoardComponent } from './components/BoardComponents';
import MoveAnalysis from './components/MoveAnalysis';


import { SettingsPanel, type AppSettings } from './components/SettingsPanel';

// Custom settings option///////////////
import { IoSettings } from "react-icons/io5";

//////////////////////////////////////////

import Hints from './components/Hints';
import GameHistory from './components/GameHistory';
export default function App() {
  const game = useChessGame();


  // Logic Hooks
  const { currentEval, mateIn, diff, hintData, registerMoveForAnalysis, clearAnalysis } = useEvaluation(game.chessGame, game.position);
  const { elo, isThinking, handleEloChange, handleModeToggle, makeEngineMove } = useEngine(game);
  const { openingName, bookMoves } = useBookMoves(game.position);

  const [boardColors, setBoardColors] = useState({ light: 'white', dark: 'rgb(64,64,64)' });
  const [animationDuration, setAnimationDuration] = useState(400);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    enableUndo: true,
    enablePremove: true,
    autoPromoteToQueen: false,
    enableAnalysis: true,
    showEngineReaction: true,
    showBookMoves: true,
    isPinned: false,
    isOverdefended: false,
    isUnderdefended: false,
    isVulnerable: false,
    showCheckHighlights: false,
    showForks: false,
  });

  const moveHandler = useRef(new MoveHandler(game.chessGame));

  useEffect(() => {
    moveHandler.current = new MoveHandler(game.chessGame);
  }, [game.chessGame]);

  // --- Board styling ---
  const visualStyles = useBoardStyles({
    chessGame: game.chessGame,
    ...appSettings,
    optionSquares: game.optionSquares,
  });

  // --- UI Board Setup ---
  const currentPosition = fenStringToPositionObject(game.position, 8, 8);
  const finalSquareStyles: Record<string, React.CSSProperties> = {
    ...visualStyles.styles,
  };
  game.premoves.forEach(p => {
    delete currentPosition[p.sourceSquare];
    currentPosition[p.targetSquare!] = { pieceType: p.piece.pieceType };
    finalSquareStyles[p.sourceSquare] = { backgroundColor: 'rgba(255,0,0,0.2)' };
    finalSquareStyles[p.targetSquare!] = { backgroundColor: 'rgba(255,0,0,0.2)' };
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
      if (!appSettings.autoPromoteToQueen) {
        game.setPromotionMove({ sourceSquare, targetSquare });
        return true;
      }
    }
    const pieceColor = piece.pieceType[0]; // 'w' or 'b'
    if (game.chessGame.turn() !== pieceColor) {
      if (!appSettings.enablePremove) return false;

      const type = piece.pieceType[1].toLowerCase();
      const color = piece.pieceType[0];
      const allowedMoves = moveHandler.current.getTheoreticalMoves(sourceSquare, type, color);
      if (!allowedMoves.includes(targetSquare as any)) {
        return false;
      }

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

    const isOurTurn = game.chessGame.turn() === 'w';
    const isOurPiece = piece && piece.pieceType[0] === 'w';

    if (!game.moveFrom && isOurPiece) {
      if (isOurTurn) {
        game.setOptionSquares(moveHandler.current.getAvailableMovesSquares(square));
      } else {
        if (appSettings.enablePremove) {
          game.setOptionSquares(moveHandler.current.getPremoveOptionSquares(square, piece.pieceType[1].toLowerCase(), 'w'));
        }
      }
      game.setMoveFrom(square);
    } else if (game.moveFrom) {
      let allowedMoves: string[] = [];
      const fromPieceStr = currentPosition[game.moveFrom]?.pieceType;

      if (isOurTurn) {
        allowedMoves = moveHandler.current.getLegalMoves(game.moveFrom).map(m => m.to);
      } else if (fromPieceStr) {
        const type = fromPieceStr[1].toLowerCase();
        const color = fromPieceStr[0];
        allowedMoves = moveHandler.current.getTheoreticalMoves(game.moveFrom, type, color);
      }

      if (allowedMoves.includes(square as any) && fromPieceStr) {
        onPieceDrop({
          sourceSquare: game.moveFrom,
          targetSquare: square as any,
          piece: { pieceType: fromPieceStr, isSparePiece: false, position: square } as any
        });
      }
      game.resetMoveState(false);
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



  function canDragPiece({
    piece
  }: PieceHandlerArgs) {
    return piece.pieceType[0] === 'w';
  }

  const [settingsOpen, setSettingsOpen] = useState(false);
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
            options={{
              darkSquareStyle: { backgroundColor: boardColors.dark },
              lightSquareStyle: { backgroundColor: boardColors.light },
              animationDurationInMs: animationDuration,
              showAnimations: true,
              id: 'chess-board'
            }}
          />


          <EngineControls
            elo={elo}

            isThinking={isThinking}

            onEloChange={handleEloChange}
            onToggleMode={handleModeToggle}

          />

        </div>

        <div className="flex flex-col gap-2 w-100! md:w-64">
          <GameHistory game={game} />

          <div className='flex items-center justify-between gap-12'>
            {appSettings.enableUndo && (
              <Undobutton canUndo={game.chessGame.history().length > 0} onUndo={handleUndo} isThinking={isThinking} />
            )}
            <button
              className="px-1 w-full flex gap-4 justify-center items-center h-12 bg-zinc-900!  text-white rounded-full z-50"
              onClick={() => setSettingsOpen(true)}
            >
              <IoSettings />
            </button><Hints game={game} hintData={hintData} /></div>
          {settingsOpen && (
            <SettingsPanel
              boardColors={boardColors}
              animationDuration={animationDuration}
              onChangeColors={setBoardColors}
              onChangeAnimation={setAnimationDuration}
              appSettings={appSettings}
              onChangeSettings={setAppSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}
          {appSettings.enableAnalysis && (
            <MoveAnalysis
              diff={diff}
              mate={mateIn}
              openingName={openingName}
              bookMoves={bookMoves}
              showEngineReaction={appSettings.showEngineReaction}
              showBookMoves={appSettings.showBookMoves}
            />
          )}



        </div>
      </div>
    </div>
  );
}
