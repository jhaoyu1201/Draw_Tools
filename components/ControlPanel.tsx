
import React from 'react';
import { PerspectiveMode } from '../types';

interface ControlPanelProps {
  mode: PerspectiveMode;
  setMode: (mode: PerspectiveMode) => void;
  lineDensity: number;
  setLineDensity: (val: number) => void;
  lineColor: string;
  setLineColor: (val: string) => void;
  lineWidth: number;
  setLineWidth: (val: number) => void;
  workspaceZoom: number;
  setWorkspaceZoom: (val: number) => void;
  enableSnapping: boolean;
  setEnableSnapping: (val: boolean) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  isExporting: boolean;
  hasImage: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  setMode,
  lineDensity,
  setLineDensity,
  lineColor,
  setLineColor,
  lineWidth,
  setLineWidth,
  workspaceZoom,
  setWorkspaceZoom,
  enableSnapping,
  setEnableSnapping,
  onImageUpload,
  onExport,
  isExporting,
  hasImage
}) => {
  return (
    <aside className="w-80 bg-slate-950 border-r border-slate-800 p-6 flex flex-col gap-6 overflow-y-auto">
      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">檔案管理</h3>
        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-slate-900 transition-all duration-200 group">
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm text-slate-400 group-hover:text-slate-300 font-medium">{hasImage ? "更換參考圖" : "上傳參考圖"}</p>
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={onImageUpload} />
        </label>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">視角控制</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-slate-300">工作區縮放</label>
              <span className="text-xs font-mono text-blue-400">{Math.round(workspaceZoom * 100)}%</span>
            </div>
            <input
              type="range" min="0.1" max="1.5" step="0.05"
              value={workspaceZoom}
              onChange={(e) => setWorkspaceZoom(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
            <label className="text-sm text-slate-300 cursor-pointer" htmlFor="snap-toggle">自動吸附對齊</label>
            <button 
              id="snap-toggle"
              onClick={() => setEnableSnapping(!enableSnapping)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enableSnapping ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableSnapping ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">透視模式</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: PerspectiveMode.ONE_POINT, label: '1點透視' },
            { id: PerspectiveMode.TWO_POINT, label: '2點透視' },
            { id: PerspectiveMode.THREE_POINT, label: '3點透視' },
            { id: PerspectiveMode.FOUR_POINT, label: '4點透視' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">線條設定</h3>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-300">密集度</label>
            <span className="text-xs font-mono text-blue-400">{lineDensity}</span>
          </div>
          <input
            type="range" min="1" max="18" step="1"
            value={lineDensity}
            onChange={(e) => setLineDensity(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-slate-300">粗細</label>
            <span className="text-xs font-mono text-blue-400">{lineWidth}px</span>
          </div>
          <input
            type="range" min="0.5" max="5" step="0.5"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-slate-300 mb-2 block">顏色</label>
          <input
            type="color" value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer bg-slate-900 border-none p-1"
          />
        </div>
      </section>

      <section className="mt-auto">
        <button
          onClick={onExport}
          disabled={!hasImage || isExporting}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-200 ${
            !hasImage || isExporting ? 'bg-slate-800 text-slate-600' : 'bg-green-600 text-white hover:bg-green-500'
          }`}
        >
          {isExporting ? "處理中..." : "輸出透明 PNG"}
        </button>
      </section>
    </aside>
  );
};

export default ControlPanel;
