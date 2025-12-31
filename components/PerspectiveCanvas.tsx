
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point } from '../types';

interface PerspectiveCanvasProps {
  image: HTMLImageElement;
  vanishingPoints: Point[];
  setVanishingPoints: (points: Point[]) => void;
  lineDensity: number;
  lineColor: string;
  lineWidth: number;
  workspaceZoom: number;
  setWorkspaceZoom: (zoom: number) => void;
  enableSnapping: boolean;
}

const PerspectiveCanvas: React.FC<PerspectiveCanvasProps> = ({
  image,
  vanishingPoints,
  setVanishingPoints,
  lineDensity,
  lineColor,
  lineWidth,
  workspaceZoom,
  setWorkspaceZoom,
  enableSnapping
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerRef.current.clientWidth;
    canvas.height = containerRef.current.clientHeight;

    const centerX = canvas.width / 2 + pan.x;
    const centerY = canvas.height / 2 + pan.y;

    const imgW = image.naturalWidth * workspaceZoom;
    const imgH = image.naturalHeight * workspaceZoom;
    const imgX = centerX - imgW / 2;
    const imgY = centerY - imgH / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製參考圖
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(imgX, imgY, imgW, imgH);
    ctx.globalAlpha = 0.4;
    ctx.drawImage(image, imgX, imgY, imgW, imgH);
    ctx.restore();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(imgX, imgY, imgW, imgH);

    // 繪製透視線
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    const angleStep = 20 - lineDensity + 1;

    vanishingPoints.forEach((vp) => {
      const screenX = centerX + vp.x * workspaceZoom;
      const screenY = centerY + vp.y * workspaceZoom;

      ctx.beginPath();
      
      // 1. 繪製基礎十字基準線 (0, 90, 180, 270 度)
      [0, 90, 180, 270].forEach(angle => {
        const rad = (angle * Math.PI) / 180;
        const length = Math.max(canvas.width, canvas.height, imgW, imgH) * 5;
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + Math.cos(rad) * length, screenY + Math.sin(rad) * length);
      });

      // 2. 繪製由密集度決定的放射線 (排除已繪製的十字線)
      for (let angle = 0; angle < 360; angle += angleStep) {
        if (angle % 90 === 0) continue; 
        const rad = (angle * Math.PI) / 180;
        const length = Math.max(canvas.width, canvas.height, imgW, imgH) * 5;
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX + Math.cos(rad) * length, screenY + Math.sin(rad) * length);
      }
      ctx.stroke();

      // 繪製消失點實體
      const isOutside = screenX < imgX || screenX > imgX + imgW || screenY < imgY || screenY > imgY + imgH;
      
      ctx.save();
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      
      if (draggedPointIndex !== null && vanishingPoints[draggedPointIndex] === vp) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = isOutside ? '#f43f5e' : lineColor;
      }

      ctx.beginPath();
      ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

  }, [image, vanishingPoints, lineDensity, lineColor, lineWidth, workspaceZoom, draggedPointIndex, pan]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + pan.x;
    const centerY = canvas.height / 2 + pan.y;

    const clickedIndex = vanishingPoints.findIndex(vp => {
      const screenX = centerX + vp.x * workspaceZoom;
      const screenY = centerY + vp.y * workspaceZoom;
      const dist = Math.sqrt(Math.pow(screenX - mouseX, 2) + Math.pow(screenY - mouseY, 2));
      return dist < 15;
    });

    if (clickedIndex !== -1) {
      setDraggedPointIndex(clickedIndex);
    } else {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedPointIndex !== null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const centerX = canvas.width / 2 + pan.x;
      const centerY = canvas.height / 2 + pan.y;

      // 初步計算相對座標
      let newX = (mouseX - centerX) / workspaceZoom;
      let newY = (mouseY - centerY) / workspaceZoom;

      // 實現吸附功能
      if (enableSnapping) {
        const SNAP_THRESHOLD = 12 / workspaceZoom; // 螢幕感官約 12 像素

        // 檢查與其他點的對齊
        vanishingPoints.forEach((p, idx) => {
          if (idx === draggedPointIndex) return;
          
          if (Math.abs(newX - p.x) < SNAP_THRESHOLD) newX = p.x;
          if (Math.abs(newY - p.y) < SNAP_THRESHOLD) newY = p.y;
        });

        // 檢查與圖片中心點 (0,0) 的對齊
        if (Math.abs(newX) < SNAP_THRESHOLD) newX = 0;
        if (Math.abs(newY) < SNAP_THRESHOLD) newY = 0;
      }

      const newPoints = [...vanishingPoints];
      newPoints[draggedPointIndex] = { x: newX, y: newY };
      setVanishingPoints(newPoints);
    } else if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;
      
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggedPointIndex(null);
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomSpeed = 0.001;
    const delta = -e.deltaY;
    const oldZoom = workspaceZoom;
    const newZoom = Math.min(Math.max(oldZoom + delta * zoomSpeed, 0.05), 3.0);
    
    if (newZoom !== oldZoom) {
      const dx = mouseX - canvas.width / 2;
      const dy = mouseY - canvas.height / 2;
      
      const newPanX = dx - (dx - pan.x) * (newZoom / oldZoom);
      const newPanY = dy - (dy - pan.y) * (newZoom / oldZoom);
      
      setPan({ x: newPanX, y: newPanY });
      setWorkspaceZoom(newZoom);
    }
  };

  const resetView = () => {
    setPan({ x: 0, y: 0 });
    setWorkspaceZoom(0.6);
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-900 overflow-hidden relative">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`block outline-none ${isPanning ? 'cursor-grabbing' : (draggedPointIndex !== null ? 'cursor-move' : 'cursor-crosshair')}`}
      />
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur text-[10px] text-slate-300 px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl">
          <span className={`w-1.5 h-1.5 rounded-full ${enableSnapping ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
          <span>{enableSnapping ? "吸附對齊已開啟" : "自動吸附已關閉"}</span>
        </div>
      </div>

      <button 
        onClick={resetView}
        className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg border border-slate-700 transition-colors shadow-xl group"
        title="重設視角與縮放"
      >
        <svg className="w-5 h-5 group-active:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>

      <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur text-[10px] text-slate-400 px-3 py-1 rounded border border-white/10 pointer-events-none font-mono">
        縮放: {Math.round(workspaceZoom * 100)}% | 偏移: {Math.round(pan.x)}, {Math.round(pan.y)}
      </div>
    </div>
  );
};

export default PerspectiveCanvas;
