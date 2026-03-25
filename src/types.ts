import type { Chess } from 'chess.js';

export interface PromotionMove {
  sourceSquare: string;
  targetSquare: string;
}

export interface MoveEngine {
  getNextMove(chessGame: Chess): string | null | Promise<string | null>;
  terminate?(): void;
  setElo?(elo: number): void;
}

export interface AnalysisState {
  isPinned: boolean;
  isOverdefended: boolean;
  isUnderdefended: boolean;
  isVulnerable: boolean;
  showCheckHighlights: boolean;
  showForks: boolean;
}
