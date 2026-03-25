import { Chess } from 'chess.js';
import { type MoveEngine } from '../types';

export class RandomMoveEngine implements MoveEngine {
    getNextMove(chessGame: Chess): string | null {
        if (chessGame.isGameOver()) return null;
        const moves = chessGame.moves();
        if (moves.length === 0) return null;
        return moves[Math.floor(Math.random() * moves.length)];
    }
}

/**
 * Base class for engines using a Stockfish worker.
 */
abstract class BaseStockfishEngine {
    protected worker: Worker | null = null;
    protected isReady = false;

    constructor(workerPath: string) {
        try {
            this.worker = new Worker(workerPath);
            this.worker.onmessage = this.handleMessage.bind(this);
            this.postCommand('uci');
        } catch (error) {
            console.error(`❌ Failed to load Stockfish worker at ${workerPath}:`, error);
        }
    }

    protected abstract handleMessage(event: MessageEvent): void;

    protected postCommand(command: string) {
        if (this.worker) {
            this.worker.postMessage(command);
        } else {
            console.error('Stockfish worker not initialized');
        }
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
            this.isReady = false;
        }
    }
}

export class StockfishEngine extends BaseStockfishEngine implements MoveEngine {
    private bestMove: string | null = null;
    private moveResolver: ((move: string | null) => void) | null = null;
    private elo: number;

    constructor(stockfishPath = './stockfish-18-lite-single.js', elo = 1350) {
        super(stockfishPath);
        this.elo = elo;
    }

    protected handleMessage(event: MessageEvent) {
        const message = event.data;

        if (message === 'uciok') {
            this.isReady = true;
            this.updateConfiguration();
        }

        if (message === 'readyok') {
            this.isReady = true;
        }

        if (message.startsWith('bestmove')) {
            const parts = message.split(' ');
            this.bestMove = parts[1] || null;
            if (this.moveResolver) {
                this.moveResolver(this.bestMove);
                this.moveResolver = null;
            }
        }
    }

    private updateConfiguration() {
        this.postCommand('setoption name UCI_LimitStrength value true');
        this.postCommand(`setoption name UCI_Elo value ${Math.max(1320, this.elo)}`);
    }

    async getNextMove(chessGame: Chess): Promise<string | null> {
        if (!this.worker || chessGame.isGameOver()) return null;

        const moves = chessGame.moves({ verbose: true });
        if (moves.length === 0) return null;
        if (moves.length === 1) return moves[0].san;

        return new Promise((resolve) => {
            this.moveResolver = resolve;
            this.bestMove = null;

            this.postCommand(`position fen ${chessGame.fen()}`);
            this.postCommand('go depth 13');

            setTimeout(() => {
                if (this.moveResolver && !this.bestMove) {
                    console.warn('⏱️ Stockfish timeout, using fallback');
                    this.moveResolver(moves[0].san);
                    this.moveResolver = null;
                }
            }, 5000);
        });
    }

    setElo(elo: number) {
        this.elo = Math.max(250, Math.min(3190, elo));
        this.updateConfiguration();
    }

    getElo(): number {
        return this.elo;
    }
}

export class ChessApiEvalEngine {
    private onEvalUpdate: (evaluation: number, fen: string, mate?: number) => void;
    private abortController: AbortController | null = null;

    constructor(onEvalUpdate: (evaluation: number, fen: string, mate?: number) => void) {
        this.onEvalUpdate = onEvalUpdate;
    }

    public async evaluatePosition(fen: string) {
        if (this.abortController) this.abortController.abort();
        this.abortController = new AbortController();

        try {
            const response = await fetch("https://chess-api.com/v1", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fen }),
                signal: this.abortController.signal
            });

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();

            if (data.eval !== undefined) {
                const evalNum = parseFloat(data.eval); // numeric pawns
                const mate = data.mate ?? undefined;   // optional mate

                this.onEvalUpdate(evalNum, fen, mate);      // send numeric eval + fen + mate
            }
        } catch (error: any) {
            if (error.name === 'AbortError') return;
            console.error('❌ Chess API Error:', error);
        }
    }

    public terminate() {
        if (this.abortController) this.abortController.abort();
    }
}
