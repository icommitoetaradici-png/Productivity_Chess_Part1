import React from 'react';
import type { AnalysisState } from '../types';

interface AnalysisTogglesProps {
  state: AnalysisState;
  onToggle: (key: keyof AnalysisState) => void;

}

const AnalysisToggles: React.FC<AnalysisTogglesProps> = ({ state, onToggle }) => {
  const toggles = [
    { id: 'over', key: 'isOverdefended' as const, label: 'Overdefended', color: 'bg-green-500/20 border-green-500/50' },
    { id: 'under', key: 'isUnderdefended' as const, label: 'Underdefended', color: 'bg-red-500/20 border-red-500/50' },
    { id: 'vulnerable', key: 'isVulnerable' as const, label: 'Vulnerable', color: 'bg-purple-500/20 border-purple-500/50' },
    { id: 'check', key: 'showCheckHighlights' as const, label: 'Highlight Checks', color: 'bg-red-600/30 border-red-600/70' },
    { id: 'pin', key: 'isPinned' as const, label: 'Pins', color: 'border-blue-400' },
    { id: 'fork', key: 'showForks' as const, label: 'Forks', color: 'border-red-400' }
  ];

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Analysis</h3>

      {toggles.map(toggle => (
        <label key={toggle.id} className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={state[toggle.key]}
              onChange={() => onToggle(toggle.key)}
              className="sr-only"
            />
            <div className={`w-10 h-5 rounded-full transition-colors ${state[toggle.key] ? 'bg-white' : 'bg-neutral-800'}`}>
              <div className={`absolute top-1 left-1 w-3 h-3 rounded-full transition-transform ${state[toggle.key] ? 'translate-x-5 bg-black' : 'bg-neutral-500'}`} />
            </div>
          </div>
          <span className="text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors">
            {toggle.label}
          </span>
        </label>
      ))}
    </div>
  );
};

export default AnalysisToggles;

