import React from 'react';

interface EngineControlsProps {
  elo: number;

  isThinking: boolean;

  onEloChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleMode: () => void;

}
interface UndoBT {


  isThinking: boolean;
  canUndo: boolean;


  onUndo: () => void;
}

const EngineControls: React.FC<EngineControlsProps> = ({
  elo,
  isThinking,

  onEloChange,

}) => {
  return (
    <div className="bg-neutral-900 p-4 rounded-xl w-full">
      {/* Header: Tightened margin */}
      <div className="flex justify-between items-baseline mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
          ELO / Strength
        </span>
        {/* Reduced text size to minimize vertical space */}
        <span className="text-2xl font-extralight text-white tabular-nums tracking-tight">
          {elo}
        </span>
      </div>

      {/* Slider Track: Thinner handle for a sleeker look */}
      <div className="relative group mb-2">
        <div className="w-full h-1 bg-neutral-800 rounded-full" />

        <div
          className="absolute top-0 left-0 h-1 bg-neutral-400 rounded-full transition-all duration-150"
          style={{ width: `${((elo - 1350) / (3190 - 1350)) * 100}%` }}
        />

        {/* Smaller thumb (w-2.5 h-2.5) to match the slimmer profile */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-sm transition-transform duration-150 group-hover:scale-125 pointer-events-none"
          style={{ left: `calc(${((elo - 1350) / (3190 - 1350)) * 100}% - 5px)` }}
        />

        <input
          type="range"
          min="1350"
          max="3190"
          step="10"
          value={elo}
          onChange={onEloChange}
          disabled={isThinking}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
      </div>

      {/* Footer: Tighter margin */}
      <div className="flex justify-between text-[9px] font-medium text-neutral-600 tabular-nums">
        <span>1,350</span>
        <span>3,190</span>
      </div>
    </div>
  );
};

export default EngineControls;
export const Undobutton: React.FC<UndoBT> = ({ canUndo, onUndo, isThinking }) => {
  return (
    <button
      onClick={onUndo}
      className="px-5 py-2 text-xs font-medium rounded transition-all duration-300 border bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
      disabled={isThinking || !canUndo}>
      Undo Move
    </button >)
}
