import { useState } from 'react';
import { StockfishEngine } from '../MainFunctions/MoveEngine';
import type { MoveEngine } from '../types';

export function useEngine(game: any) {
    const [elo, setElo] = useState(1350);
    const [isRandom, setIsRandom] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [engine, setEngine] = useState<MoveEngine>(() => new StockfishEngine('/stockfish-18-lite-single.js', 1350));

    const handleEloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newElo = parseInt(e.target.value, 10);
        setElo(newElo);
        engine.setElo?.(newElo);
    };

    const handleModeToggle = () => {
        setIsRandom(prev => !prev);
        engine.terminate?.();
        setEngine(new StockfishEngine('/stockfish-18-lite-single.js', elo));
    };

    const makeEngineMove = async (onPieceDrop: (args: any) => boolean) => {
        setIsThinking(true);
        const startFen = game.chessGame.fen();
        const move = await Promise.resolve(engine.getNextMove(game.chessGame));
        setIsThinking(false);

        if (!move || game.chessGame.fen() !== startFen) return;

        game.chessGame.move(move);
        const newFen = game.chessGame.fen();
        game.updatePosition(newFen);

        // handle premoves
        if (game.premovesRef.current.length > 0) {
            const nextPlayerPremove = game.premovesRef.current[0];
            game.premovesRef.current.splice(0, 1);

            // wait for CPU move animation to complete
            setTimeout(() => {
                // execute the premove
                const premoveSuccessful = onPieceDrop(nextPlayerPremove);

                // if the premove was not successful, clear all premoves
                if (!premoveSuccessful) {
                    game.premovesRef.current = [];
                }

                // update the premoves state
                game.setPremoves([...game.premovesRef.current]);

                // disable animations while clearing premoves
                game.setShowAnimations(false);

                // re-enable animations after a short delay
                setTimeout(() => {
                    game.setShowAnimations(true);
                }, 50);
            }, 300);
        }
    };

    return {
        elo,
        isRandom,
        isThinking,
        handleEloChange,
        handleModeToggle,
        makeEngineMove,
        terminate: () => engine.terminate?.()
    };
}
