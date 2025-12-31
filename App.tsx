
import React, { useState, useEffect, useCallback } from 'react';
import { PerspectiveMode, Point } from './types';
import ControlPanel from './components/ControlPanel';
import PerspectiveCanvas from './components/PerspectiveCanvas';
import Header from './components/Header';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<PerspectiveMode>(PerspectiveMode.ONE_POINT);
  const [vanishingPoints, setVanishingPoints] = useState<Point[]>([]);
  const [lineDensity, setLineDensity] = useState<number>(10);
  const [lineColor, setLineColor] = useState<string>('#3b82f6');
  const [lineWidth, setLineWidth] = useState<number>(1);
  const [workspaceZoom, setWorkspaceZoom] = useState<number>(0.6); 
  const [enableSnapping, setEnableSnapping] = useState<boolean>(true); // 新增吸附開關
  const [isExporting, setIsExporting] = useState(false);

  // 初始化消失點位置 (使用相對於中心的座標)
  useEffect(() => {
    if (!image) return;
    
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    let initialPoints: Point[] = [];

    switch (mode) {
      case PerspectiveMode.ONE_POINT:
        initialPoints = [{ x: 0, y: 0 }];
        break;
      case PerspectiveMode.TWO_POINT:
        initialPoints = [
          { x: -w * 0.8, y: 0 },
          { x: w * 0.8, y: 0 }
        ];
        break;
      case PerspectiveMode.THREE_POINT:
        initialPoints = [
          { x: -w * 0.8, y: -h * 0.2 },
          { x: w * 0.8, y: -h * 0.2 },
          { x: 0, y: h * 0.8 }
        ];
        break;
      case PerspectiveMode.FOUR_POINT:
        initialPoints = [
          { x: -w * 1.2, y: 0 },
          { x: w * 1.2, y: 0 },
          { x: 0, y: -h * 1.2 },
          { x: 0, y: h * 1.2 }
        ];
        break;
    }
    setVanishingPoints(initialPoints);
  }, [mode, !!image]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = useCallback(async () => {
    if (!image) return;

    setIsExporting(true);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = image.naturalWidth;
    exportCanvas.height = image.naturalHeight;
    const ctx = exportCanvas.getContext('2d');
    
    if (ctx) {
      ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
      const centerX = exportCanvas.width / 2;
      const centerY = exportCanvas.height / 2;

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = lineWidth;
      const angleStep = 20 - lineDensity + 1;

      vanishingPoints.forEach((vp) => {
        const realX = centerX + vp.x;
        const realY = centerY + vp.y;

        ctx.beginPath();
        // 匯出時也包含基礎十字線
        [0, 90, 180, 270].forEach(angle => {
          const rad = (angle * Math.PI) / 180;
          const length = Math.max(exportCanvas.width, exportCanvas.height) * 10;
          ctx.moveTo(realX, realY);
          ctx.lineTo(realX + Math.cos(rad) * length, realY + Math.sin(rad) * length);
        });

        // 密集線段
        for (let angle = 0; angle < 360; angle += angleStep) {
          if (angle % 90 === 0) continue; // 避免與基礎線重複繪製
          const rad = (angle * Math.PI) / 180;
          const length = Math.max(exportCanvas.width, exportCanvas.height) * 10;
          ctx.moveTo(realX, realY);
          ctx.lineTo(realX + Math.cos(rad) * length, realY + Math.sin(rad) * length);
        }
        ctx.stroke();

        if (realX >= 0 && realX <= exportCanvas.width && realY >= 0 && realY <= exportCanvas.height) {
          ctx.fillStyle = lineColor;
          ctx.beginPath();
          ctx.arc(realX, realY, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'perspective_guide_export.png';
      link.href = dataUrl;
      link.click();
    }
    setIsExporting(false);
  }, [image, vanishingPoints, lineDensity, lineColor, lineWidth]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <main className="flex flex-1 overflow-hidden">
        <ControlPanel 
          mode={mode} 
          setMode={setMode}
          lineDensity={lineDensity}
          setLineDensity={setLineDensity}
          lineColor={lineColor}
          setLineColor={setLineColor}
          lineWidth={lineWidth}
          setLineWidth={setLineWidth}
          workspaceZoom={workspaceZoom}
          setWorkspaceZoom={setWorkspaceZoom}
          enableSnapping={enableSnapping}
          setEnableSnapping={setEnableSnapping}
          onImageUpload={handleImageUpload}
          onExport={handleExport}
          isExporting={isExporting}
          hasImage={!!image}
        />
        <div className="flex-1 bg-slate-900 relative flex items-center justify-center overflow-hidden">
          {image ? (
            <PerspectiveCanvas 
              image={image}
              vanishingPoints={vanishingPoints}
              setVanishingPoints={setVanishingPoints}
              lineDensity={lineDensity}
              lineColor={lineColor}
              lineWidth={lineWidth}
              workspaceZoom={workspaceZoom}
              setWorkspaceZoom={setWorkspaceZoom}
              enableSnapping={enableSnapping}
            />
          ) : (
            <div className="text-center">
              <div className="mb-4 inline-block p-6 rounded-full bg-slate-800 border-2 border-dashed border-slate-700">
                <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-400">請先上傳圖片開始使用透視輔助工具</p>
              <label className="mt-4 cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                上傳參考圖片
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
