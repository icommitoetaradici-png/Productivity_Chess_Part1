import React from 'react';

interface EngineControlsProps {
  elo: number;
  isRandom: boolean;
  isThinking: boolean;
  canUndo: boolean;
  onEloChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMode: () => void;
  onUndo: () => void;
}

const EngineControls: React.FC<EngineControlsProps> = ({
  elo,
  isRandom,
  isThinking,
  canUndo,
  onEloChange,
  onToggleMode,
  onUndo
}) => {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Opponent</h3>
      <button
        onClick={onToggleMode}
        className={`px-5 py-2 text-xs font-medium rounded transition-all duration-300 border ${isRandom
          ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          : 'bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200'
          }`}
        disabled={isThinking}
      >
        {isRandom ? 'Random Move Generator' : 'Stockfish 18 Engine'}
      </button>

      {!isRandom && (
        <div className="bg-neutral-900/50 p-5 rounded-xl border border-neutral-800 flex flex-col items-center gap-4">
          <div className="flex justify-between w-full items-baseline">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">ELO</span>
            <span className="text-3xl font-extralight text-white tabular-nums">{elo}</span>
          </div>

          <div className="w-full relative h-2 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-white transition-all duration-300"
              style={{ width: `${((elo - 1350) / (3190 - 1350)) * 100}%` }}
            />
            <input
              type="range" min="1350" max="3190" step="10" value={elo}
              onChange={onEloChange}
              disabled={isThinking}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <div className="flex justify-between w-full text-[9px] font-bold uppercase tracking-widest text-neutral-700">
            <span>Beginner</span>
            <span>Grandmaster</span>
          </div>
        </div>
      )}

      <button
        onClick={onUndo}
        className="px-5 py-2 text-xs font-medium rounded transition-all duration-300 border bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
        disabled={isThinking || !canUndo}
      >
        Undo Move
      </button>
    </div>
  );
};

export default EngineControls;
