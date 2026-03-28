import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

export type AppSettings = {
    // General
    enableUndo: boolean;
    enablePremove: boolean;
    autoPromoteToQueen: boolean;

    // Move Analysis
    enableAnalysis: boolean;
    showEngineReaction: boolean;
    showBookMoves: boolean;

    // Heatmaps
    isPinned: boolean;
    isOverdefended: boolean;
    isUnderdefended: boolean;
    isVulnerable: boolean;
    showCheckHighlights: boolean;
    showForks: boolean;
};

interface SettingsPanelProps {
    boardColors: { light: string; dark: string };
    onChangeColors: (colors: { light: string; dark: string }) => void;
    animationDuration: number;
    onChangeAnimation: (ms: number) => void;
    appSettings: AppSettings;
    onChangeSettings: (settings: AppSettings) => void;
    onClose: () => void;
}

type Tab = 'General' | 'Appearance' | 'Analysis' | 'Heatmap';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
    boardColors,
    onChangeColors,
    animationDuration,
    onChangeAnimation,
    appSettings,
    onChangeSettings,
    onClose
}) => {
    const [localColors, setLocalColors] = useState(boardColors);
    const [localAnimation, setLocalAnimation] = useState(animationDuration);
    const [localSettings, setLocalSettings] = useState(appSettings);
    const [activeTab, setActiveTab] = useState<Tab>('General');

    const updateSetting = (key: keyof AppSettings, value: boolean) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onChangeColors(localColors);
        onChangeAnimation(localAnimation);
        onChangeSettings(localSettings);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-neutral-200 font-sans">
            <div className="relative flex flex-row w-full max-w-[800px] h-[500px] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden">

                {/* Left Column: Navigation Tabs */}
                <div className="w-1/3 min-w-[200px] bg-neutral-950/50 border-r border-neutral-800 p-6 flex flex-col">
                    <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Settings</h2>

                    <nav className="flex flex-col gap-2 grow">
                        {(['General', 'Appearance', 'Analysis', 'Heatmap'] as Tab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-blue-600/10 text-zinc-600 border border-blue-500/20'
                                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>

                    <div className="mt-8">
                        <button
                            onClick={handleSave}
                            className="w-full mb-3 px-4 py-2.5 bg-zinc-600  text-white text-sm font-semibold rounded-lg transition-colors shadow-lg  shadow-zinc-700/40 "
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Right Column: Options */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    {/* Close Icon */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-neutral-500 hover:text-white transition-colors"
                    >
                        <IoClose size={24} />
                    </button>

                    <h3 className="text-xl font-semibold text-white mb-6 tracking-tight hidden md:block">
                        {activeTab} Options
                    </h3>

                    {activeTab === 'General' && (
                        <div className="space-y-6">
                            <Toggle label="Enable Undo Capability" description="Allow undoing moves during offline/engine analysis" checked={localSettings.enableUndo} onChange={(v) => updateSetting('enableUndo', v)} />
                            <Toggle label="Enable Premoves" description="Queue up responses before the opponent moves" checked={localSettings.enablePremove} onChange={(v) => updateSetting('enablePremove', v)} />
                            <Toggle label="Auto-Promote to Queen" description="Skip the promotion dialog entirely" checked={localSettings.autoPromoteToQueen} onChange={(v) => updateSetting('autoPromoteToQueen', v)} />
                        </div>
                    )}

                    {activeTab === 'Appearance' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Light Square Color</label>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={localColors.light} onChange={(e) => setLocalColors({ ...localColors, light: e.target.value })} className="w-12 h-12 p-0 border-0 rounded cursor-pointer bg-transparent" />
                                    <span className="text-sm font-mono text-neutral-500">{localColors.light}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Dark Square Color</label>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={localColors.dark} onChange={(e) => setLocalColors({ ...localColors, dark: e.target.value })} className="w-12 h-12 p-0 border-0 rounded cursor-pointer bg-transparent" />
                                    <span className="text-sm font-mono text-neutral-500">{localColors.dark}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-2">Animation Duration (ms)</label>
                                <input type="number" min={0} step={50} value={localAnimation} onChange={(e) => setLocalAnimation(Number(e.target.value))} className="w-full max-w-[200px] bg-neutral-950 border border-neutral-700 text-neutral-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'Analysis' && (
                        <div className="space-y-6">
                            <Toggle label="Enable Sidebar Analysis" description="Show the move analysis side panel" checked={localSettings.enableAnalysis} onChange={(v) => updateSetting('enableAnalysis', v)} />
                            {localSettings.enableAnalysis && (
                                <div className="pl-6 border-l-2 border-neutral-800 space-y-4 py-2 mt-4">
                                    <Toggle label="Show Engine Remarks" description="e.g. Blunder, Inaccuracy, Excellent" checked={localSettings.showEngineReaction} onChange={(v) => updateSetting('showEngineReaction', v)} />
                                    <Toggle label="Show Opening Theory" description="Display ECO book names and known next moves" checked={localSettings.showBookMoves} onChange={(v) => updateSetting('showBookMoves', v)} />
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'Heatmap' && (
                        <div className="space-y-6">
                            <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                                Highlight the physical chess board dynamically to spot tactics faster.
                            </p>
                            <Toggle label="Highlight Checks" description="Glow squares with pieces delivering check" checked={localSettings.showCheckHighlights} onChange={(v) => updateSetting('showCheckHighlights', v)} />
                            <Toggle label="Highlight Pins" description="Visualize active pins and their line of sight" checked={localSettings.isPinned} onChange={(v) => updateSetting('isPinned', v)} />
                            <Toggle label="Highlight Forks" description="Highlight pieces attacking multiple targets simultaneously" checked={localSettings.showForks} onChange={(v) => updateSetting('showForks', v)} />
                            <hr className="border-neutral-800 my-4" />
                            <Toggle label="Highlight Overdefended" description="Pieces with more defenders than attackers" checked={localSettings.isOverdefended} onChange={(v) => updateSetting('isOverdefended', v)} />
                            <Toggle label="Highlight Underdefended" description="Pieces with fewer defenders than attackers" checked={localSettings.isUnderdefended} onChange={(v) => updateSetting('isUnderdefended', v)} />
                            <Toggle label="Highlight Vulnerable" description="Pieces with neither defenders nor attackers" checked={localSettings.isVulnerable} onChange={(v) => updateSetting('isVulnerable', v)} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// Reusable toggle component for settings
function Toggle({ label, description, checked, onChange }: { label: string, description?: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <label className="flex items-start gap-4 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-800 "></div>
            </div>
            <div>
                <span className="block text-sm font-medium text-neutral-200 group-hover:text-white transition-colors">{label}</span>
                {description && <span className="block text-xs text-neutral-500 mt-0.5">{description}</span>}
            </div>
        </label>
    );
}
