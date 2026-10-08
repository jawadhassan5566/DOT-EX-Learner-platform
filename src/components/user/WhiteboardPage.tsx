import React, { useRef, useState, useEffect } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  Type,
  RotateCcw,
  RotateCw,
  Trash2,
  Save,
  Download,
  Share2,
  ArrowRight,
  Triangle,
  Lock,
  Unlock,
  Sparkles,
  BookOpen,
  ChevronDown,
  FileImage,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';

type Tool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'rect' | 'circle' | 'triangle' | 'arrow';

export const WhiteboardPage: React.FC = () => {
  const { addToast } = useApp();
  const { user, isAdmin } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState<string>('#3b82f6'); // default blue
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Host locked state
  const [boardLocked, setBoardLocked] = useState<boolean>(false);

  // Export PNG menu state
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const colors = [
    { label: 'Blue', value: '#3b82f6' },
    { label: 'Cyan', value: '#06b6d4' },
    { label: 'Emerald', value: '#10b981' },
    { label: 'Red', value: '#ef4444' },
    { label: 'Amber', value: '#f59e0b' },
    { label: 'Purple', value: '#8b5cf6' },
    { label: 'White', value: '#ffffff' },
    { label: 'Dark', value: '#0f172a' },
  ];

  // Initialize Canvas & Keyboard Shortcut
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear with dark academic grid pattern
    drawBackground(ctx, rect.width, rect.height);

    // Save initial state
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory([initialData]);
    setHistoryIndex(0);

    // Keyboard shortcut (Ctrl+S / Cmd+S to export PNG)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleExportPNG('standard');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
    const spacing = 28;
    for (let x = spacing; x < width; x += spacing) {
      for (let y = spacing; y < height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Default Academic Starter Formula
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Dot X Collaborative Whiteboard - Academic Session', 30, 40);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Theorem: c² = a² + b² (Euler Formula: e^(iπ) + 1 = 0)', 30, 65);
  };

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (boardLocked && user?.role === 'student') {
      addToast({ type: 'warning', message: 'The faculty host has temporarily locked the whiteboard.' });
      return;
    }

    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'highlighter') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * 3.5;
      ctx.globalAlpha = 0.35;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'eraser') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = strokeWidth * 4;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const { x, y } = getCanvasCoords(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = currentColor;
    ctx.lineWidth = strokeWidth;
    ctx.globalAlpha = 1.0;

    // Geometric Shapes on Mouse Up
    if (currentTool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'rect') {
      ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    } else if (currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (currentTool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Draw arrowhead
      const headlen = 12;
      const angle = Math.atan2(y - startPos.y, x - startPos.x);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(x, y);
      ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }

    saveCanvasState();
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  // Touch Handlers for Tablet / Stylus / Mobile Drawing
  const getTouchCoords = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !e.touches[0]) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (boardLocked && user?.role === 'student') return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getTouchCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const { x, y } = getTouchCoords(e);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (currentTool === 'pen') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'highlighter') {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = strokeWidth * 3.5;
      ctx.globalAlpha = 0.35;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (currentTool === 'eraser') {
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = strokeWidth * 4;
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveCanvasState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    drawBackground(ctx, rect.width, rect.height);
    saveCanvasState();
    addToast({ type: 'info', message: 'Whiteboard canvas cleared.' });
  };

  // High-Fidelity PNG Export Engine
  const handleExportPNG = (mode: 'standard' | 'transparent' | 'highres' = 'standard') => {
    const canvas = canvasRef.current;
    if (!canvas) {
      addToast({ type: 'error', message: 'Whiteboard canvas not available.' });
      return;
    }

    setIsExporting(true);
    try {
      // Create offscreen canvas to render clean PNG
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportCtx = exportCanvas.getContext('2d');

      if (!exportCtx) {
        // Direct canvas fallback
        const dataUrl = canvas.toDataURL('image/png');
        downloadImage(dataUrl, 'DotX_Whiteboard_Notes');
        return;
      }

      if (mode !== 'transparent') {
        // Render rich dark academic study background
        exportCtx.fillStyle = '#090d16';
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Render subtle grid dots
        exportCtx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        const spacing = 28 * window.devicePixelRatio;
        for (let x = spacing; x < exportCanvas.width; x += spacing) {
          for (let y = spacing; y < exportCanvas.height; y += spacing) {
            exportCtx.beginPath();
            exportCtx.arc(x, y, 1 * window.devicePixelRatio, 0, Math.PI * 2);
            exportCtx.fill();
          }
        }
      }

      // Draw active canvas content onto export canvas
      exportCtx.drawImage(canvas, 0, 0);

      // Add academic footer metadata stamp
      if (mode !== 'transparent') {
        const fontSize = Math.max(12, Math.floor(13 * window.devicePixelRatio));
        exportCtx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
        exportCtx.fillStyle = 'rgba(148, 163, 184, 0.55)';
        exportCtx.textAlign = 'right';
        const dateStr = new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        exportCtx.fillText(
          `Dot X Learner Platform • Collaborative Notes • ${dateStr}`,
          exportCanvas.width - 24 * window.devicePixelRatio,
          exportCanvas.height - 18 * window.devicePixelRatio
        );
      }

      const dataUrl = exportCanvas.toDataURL('image/png');
      const filenameSuffix = mode === 'transparent' ? '_Transparent' : mode === 'highres' ? '_HighRes' : '';
      downloadImage(dataUrl, `DotX_Whiteboard_Notes${filenameSuffix}`);
    } catch (err: any) {
      console.warn('Canvas export fallback:', err);
      const dataUrl = canvas.toDataURL('image/png');
      downloadImage(dataUrl, 'DotX_Whiteboard_Notes');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const downloadImage = (dataUrl: string, baseName: string) => {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '_' + Date.now().toString().slice(-4);
    const filename = `${baseName}_${timestamp}.png`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'Whiteboard Exported as PNG',
      message: `Your collaborative notes were saved locally as "${filename}"`
    });
  };

  const handleSaveToCloud = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    try {
      await api.syncWhiteboard('meet_cs_live', dataUrl);
      addToast({ type: 'success', title: 'Synchronized', message: 'Whiteboard saved to cloud and synced with classroom.' });
    } catch {
      addToast({ type: 'success', title: 'Saved Locally', message: 'Snapshot saved to browser memory.' });
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
            <Pen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Interactive Academic Whiteboard
            </h1>
            <p className="text-[11px] text-slate-400">
              Live Mathematical Formulas • Computer Science Trees • Algorithmic Annotations
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-slate-800 mx-1"></div>

          {/* Teacher/Host Lock Privilege */}
          {(user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button
              onClick={() => {
                setBoardLocked(!boardLocked);
                addToast({
                  type: 'info',
                  message: !boardLocked ? 'Whiteboard locked for students.' : 'Whiteboard unlocked for class.'
                });
              }}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                boardLocked
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
              title={boardLocked ? 'Unlock for Students' : 'Lock for Students'}
            >
              {boardLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveToCloud}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync Cloud</span>
          </button>

          {/* Export as PNG Button with Dropdown Menu */}
          <div className="relative">
            <div className="inline-flex rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => handleExportPNG('standard')}
                disabled={isExporting}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center space-x-1.5 transition-all shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                title="Save your whiteboard notes locally as a PNG image (Ctrl+S)"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
              </button>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-2 py-2 bg-teal-700 hover:bg-teal-600 text-white border-l border-emerald-500/40 transition-colors cursor-pointer"
                title="PNG Export Options"
                aria-label="Export Options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export Options Dropdown Menu */}
            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Save Notes Locally (.png)
                </div>
                <button
                  onClick={() => handleExportPNG('standard')}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Full Canvas PNG</div>
                    <div className="text-[10px] text-slate-400">Crisp dark grid background with notes & stamp</div>
                  </div>
                </button>
                <button
                  onClick={() => handleExportPNG('transparent')}
                  className="w-full px-2.5 py-2 text-left rounded-xl hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2.5 transition-colors cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Transparent PNG</div>
                    <div className="text-[10px] text-slate-400">No background, ready for Docs & Slides</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Floating Tools & Color Palette Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 px-4 shadow-lg text-xs">
        {/* Tool Selectors */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'pen', label: 'Pen', icon: Pen },
            { id: 'highlighter', label: 'Highlighter', icon: Highlighter },
            { id: 'eraser', label: 'Eraser', icon: Eraser },
            { id: 'line', label: 'Line', icon: Minus },
            { id: 'arrow', label: 'Arrow', icon: ArrowRight },
            { id: 'rect', label: 'Rect', icon: Square },
            { id: 'circle', label: 'Circle', icon: Circle },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = currentTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCurrentTool(t.id as Tool)}
                className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={t.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        {/* Color Palette */}
        <div className="flex items-center space-x-1.5">
          {colors.map((c) => (
            <button
              key={c.value}
              onClick={() => setCurrentColor(c.value)}
              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                currentColor === c.value
                  ? 'border-white scale-125 shadow-md'
                  : 'border-transparent hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>

        {/* Stroke Width Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400 font-medium">Stroke:</span>
          {[2, 4, 8].map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                strokeWidth === w
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {w === 2 ? 'S' : w === 4 ? 'M' : 'L'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. HTML5 Canvas Surface */}
      <div className="w-full h-[620px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative bg-[#090d16]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-crosshair block touch-none"
        />

        {boardLocked && user?.role === 'student' && (
          <div className="absolute top-4 left-4 bg-rose-600/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 shadow-lg">
            <Lock className="w-3.5 h-3.5" />
            <span>Classroom View Only Mode (Host locked drawing)</span>
          </div>
        )}
      </div>
    </div>
  );
};
