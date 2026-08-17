import React, { useRef, useState, useEffect } from 'react';
import { X, Crop, Edit3, Type, ArrowRight, Square, Circle, Undo, Trash2, Check, Sparkles } from 'lucide-react';
import { PlantPhoto } from '../../types';

interface PhotoEditorModalProps {
  photo: PlantPhoto;
  onSave: (updatedPhoto: PlantPhoto) => void;
  onClose: () => void;
}

type EditorTool = 'pen' | 'highlighter' | 'arrow' | 'rectangle' | 'text' | 'crop';

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({ photo, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentTool, setCurrentTool] = useState<EditorTool>('pen');
  const [color, setColor] = useState<string>('#ef4444'); // Red default
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [caption, setCaption] = useState<string>(photo.caption || '');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Crop Box state
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 20,
    y: 20,
    w: 200,
    h: 200
  });

  // Load image onto canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    img.onload = () => {
      // Set canvas size matching image orientation with reasonable maximums
      const maxW = 700;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Save initial state
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);

      // Default crop box to 80% centered
      setCropBox({
        x: canvas.width * 0.1,
        y: canvas.height * 0.1,
        w: canvas.width * 0.8,
        h: canvas.height * 0.8
      });
    };
  }, [photo.url]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, state]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentTool === 'crop') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }

    const { x, y } = getCanvasCoords(e);

    setIsDrawing(true);
    setStartPos({ x, y });

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = currentTool === 'highlighter' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentTool === 'highlighter') {
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalAlpha = 1.0;
    }

    if (currentTool === 'text') {
      const textPrompt = prompt('Enter annotation text overlay:', 'DAMAGE HERE');
      if (textPrompt) {
        ctx.font = `bold ${lineWidth * 4 + 10}px sans-serif`;
        ctx.fillStyle = color;
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(textPrompt, x, y);
        saveCanvasState();
      }
      setIsDrawing(false);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'crop' || currentTool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'crop' || currentTool === 'text') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const { x: endX, y: endY } = getCanvasCoords(e);

    ctx.globalAlpha = 1.0;

    if (currentTool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
    } else if (currentTool === 'arrow') {
      // Draw arrow
      const headLength = 15;
      const dx = endX - startPos.x;
      const dy = endY - startPos.y;
      const angle = Math.atan2(dy, dx);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = lineWidth;

      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    setIsDrawing(false);
    saveCanvasState();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const clampedX = Math.max(0, Math.min(cropBox.x, canvas.width));
    const clampedY = Math.max(0, Math.min(cropBox.y, canvas.height));
    const clampedW = Math.max(0, Math.min(cropBox.w, canvas.width - clampedX));
    const clampedH = Math.max(0, Math.min(cropBox.h, canvas.height - clampedY));

    if (clampedW <= 10 || clampedH <= 10) {
      alert('Crop area is too small.');
      return;
    }

    const croppedData = ctx.getImageData(clampedX, clampedY, clampedW, clampedH);
    canvas.width = clampedW;
    canvas.height = clampedH;
    ctx.putImageData(croppedData, 0, 0);

    setCurrentTool('pen');
    saveCanvasState();
  };

  const handleFinalSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSave({
      ...photo,
      url: editedDataUrl,
      caption: caption || photo.caption,
      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-2xl w-full p-4 shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Photo Annotation & Crop Tool</h3>
              <p className="text-[11px] text-slate-400">Highlight cracks, defects, or crop critical component details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60">
          
          {/* Tool Selector */}
          <div className="flex items-center space-x-1">
            {[
              { id: 'pen', label: 'Pen', icon: Edit3 },
              { id: 'highlighter', label: 'Marker', icon: Sparkles },
              { id: 'arrow', label: 'Arrow', icon: ArrowRight },
              { id: 'rectangle', label: 'Box', icon: Square },
              { id: 'text', label: 'Text', icon: Type },
              { id: 'crop', label: 'Crop', icon: Crop }
            ].map((t) => {
              const IconComp = t.icon;
              const active = currentTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setCurrentTool(t.id as EditorTool)}
                  className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                    active
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                  title={t.label}
                >
                  <IconComp className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Color & Size Controls (if not crop tool) */}
          {currentTool !== 'crop' && (
            <div className="flex items-center space-x-3">
              {/* Color Palette */}
              <div className="flex items-center space-x-1">
                {[
                  { name: 'Red', hex: '#ef4444' },
                  { name: 'Yellow', hex: '#f59e0b' },
                  { name: 'Green', hex: '#10b981' },
                  { name: 'White', hex: '#ffffff' }
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      color === c.hex ? 'border-sky-400 scale-110 shadow-md' : 'border-slate-700'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>

              {/* Line Width */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400">Size:</span>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg disabled:opacity-40 transition-colors"
                title="Undo last stroke"
              >
                <Undo className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Canvas Workspace */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[300px] border border-slate-800">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
            style={{ touchAction: 'none' }}
            className="max-w-full h-auto cursor-crosshair rounded shadow-lg"
          />

          {/* Crop Overlay UI */}
          {currentTool === 'crop' && (
            <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center space-y-3 p-4 text-center">
              <p className="text-xs text-sky-300 font-semibold">
                Crop Tool: Adjust crop box parameters below
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 max-w-xs w-full bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div>
                  <label className="text-[10px] text-slate-400">Width (px)</label>
                  <input
                    type="number"
                    value={cropBox.w}
                    onChange={(e) => setCropBox({ ...cropBox, w: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Height (px)</label>
                  <input
                    type="number"
                    value={cropBox.h}
                    onChange={(e) => setCropBox({ ...cropBox, h: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                </div>
              </div>

              <button
                onClick={applyCrop}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-md"
              >
                <Crop className="w-4 h-4" />
                <span>Apply Crop Selection</span>
              </button>
            </div>
          )}
        </div>

        {/* Caption Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Photo Caption & Defect Description</label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. Severe erosion on pump impeller vane #2"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalSave}
            className="py-2 px-5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>Save Edited Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
