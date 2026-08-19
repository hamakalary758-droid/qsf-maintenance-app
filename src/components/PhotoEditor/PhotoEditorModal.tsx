import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Crop,
  Edit3,
  Type,
  ArrowRight,
  Square,
  Circle,
  Undo,
  Check,
  Sparkles,
  Highlighter,
  EyeOff,
  ArrowLeftRight,
  MapPin,
  Ruler,
  RotateCw,
  FlipHorizontal,
  Sun,
  MessageSquare,
  Pipette,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PlantPhoto } from '../../types';

interface PhotoEditorModalProps {
  photo: PlantPhoto;
  onSave: (updatedPhoto: PlantPhoto) => void;
  onClose: () => void;
}

export type EditorTool =
  | 'pen'
  | 'highlighter'
  | 'arrow'
  | 'rectangle'
  | 'text'
  | 'crop'
  | 'circle'
  | 'blur'
  | 'compare'
  | 'pin'
  | 'measure'
  | 'rotate'
  | 'brightness'
  | 'callout'
  | 'eyedropper';

interface PendingOverlayInput {
  x: number; // canvas coordinates
  y: number; // canvas coordinates
  type: 'text' | 'measure' | 'callout';
  placeholder: string;
}

export const PhotoEditorModal: React.FC<PhotoEditorModalProps> = ({ photo, onSave, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalImageDataRef = useRef<ImageData | null>(null);
  const compareCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [currentTool, setCurrentTool] = useState<EditorTool>('pen');
  const [color, setColor] = useState<string>('#ef4444'); // Red default
  const [lineWidth, setLineWidth] = useState<number>(4);
  const [caption, setCaption] = useState<string>(photo.caption || '');
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastDrawPointRef = useRef<{ x: number; y: number } | null>(null);

  // Toolbar & Advanced Panel
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [pinCount, setPinCount] = useState<number>(0);
  const [brightnessValue, setBrightnessValue] = useState<number>(0);

  // 12a Drag-to-crop state
  const [cropBox, setCropBox] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 20,
    y: 20,
    w: 200,
    h: 200
  });
  const [isDraggingCrop, setIsDraggingCrop] = useState<boolean>(false);
  const [isResizingCrop, setIsResizingCrop] = useState<boolean>(false);
  const cropDragStartRef = useRef<{ clientX: number; clientY: number; box: { x: number; y: number; w: number; h: number } }>({
    clientX: 0,
    clientY: 0,
    box: { x: 20, y: 20, w: 200, h: 200 }
  });

  // 12b, 12h, 12k Inline Text Overlay state
  const [pendingInput, setPendingInput] = useState<PendingOverlayInput | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // 12e Compare Slider state
  const [compareSplit, setCompareSplit] = useState<number>(50); // 0 to 100%
  const [isDraggingCompare, setIsDraggingCompare] = useState<boolean>(false);

  // Screen scale state for canvas
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number; cssWidth: number; cssHeight: number }>({
    width: 600,
    height: 450,
    cssWidth: 600,
    cssHeight: 450
  });

  // Update measured canvas CSS dimensions
  const updateCanvasBounds = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCanvasDimensions({
      width: canvas.width || 600,
      height: canvas.height || 450,
      cssWidth: rect.width || canvas.width || 600,
      cssHeight: rect.height || canvas.height || 450
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasBounds);
    return () => window.removeEventListener('resize', updateCanvasBounds);
  }, [updateCanvasBounds]);

  // Load image onto canvas on mount / photo change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset per-photo states
    setPinCount(0);
    setPendingInput(null);
    setInputValue('');
    setBrightnessValue(0);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photo.url;
    img.onload = () => {
      const maxW = 700;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([initialState]);

      // Defensive copy for compare mode
      originalImageDataRef.current = new ImageData(
        new Uint8ClampedArray(initialState.data),
        initialState.width,
        initialState.height
      );

      // Default crop box to 80% centered
      setCropBox({
        x: Math.round(canvas.width * 0.1),
        y: Math.round(canvas.height * 0.1),
        w: Math.round(canvas.width * 0.8),
        h: Math.round(canvas.height * 0.8)
      });

      updateCanvasBounds();
    };
  }, [photo.url, updateCanvasBounds]);

  // Focus input when pending input opens
  useEffect(() => {
    if (pendingInput) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [pendingInput]);

  // Save current canvas state to history stack
  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev, state]);
    updateCanvasBounds();
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
    if (canvas.width !== prevState.width || canvas.height !== prevState.height) {
      canvas.width = prevState.width;
      canvas.height = prevState.height;
    }
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
    updateCanvasBounds();
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    return { x, y };
  };

  // Convert canvas coordinates to CSS pixels relative to container
  const canvasToScreenCoords = (cx: number, cy: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { left: cx, top: cy };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width ? rect.width / canvas.width : 1;
    const scaleY = canvas.height ? rect.height / canvas.height : 1;
    return {
      left: cx * scaleX,
      top: cy * scaleY
    };
  };

  // 12d Blur Pixelation Helper
  const applyPixelation = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const region = ctx.getImageData(x, y, w, h);
    const off = document.createElement('canvas');
    const scale = 0.08; // downscale factor for distinct redaction effect
    off.width = Math.max(1, Math.floor(w * scale));
    off.height = Math.max(1, Math.floor(h * scale));
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    const temp = document.createElement('canvas');
    temp.width = w;
    temp.height = h;
    const tempCtx = temp.getContext('2d');
    if (!tempCtx) return;
    tempCtx.putImageData(region, 0, 0);
    offCtx.imageSmoothingEnabled = false;
    offCtx.drawImage(temp, 0, 0, off.width, off.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, off.width, off.height, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  };

  // Pointer Down (Drawing & Tool Actions)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentTool === 'crop' || currentTool === 'compare' || currentTool === 'rotate' || currentTool === 'brightness') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if not supported
    }

    const { x, y } = getCanvasCoords(e);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 12l Eyedropper Tool: Sample pixel color and return to pen
    if (currentTool === 'eyedropper') {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${[pixel[0], pixel[1], pixel[2]]
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')}`;
      setColor(hex);
      setCurrentTool('pen');
      return;
    }

    // 12g Numbered Pins Tool: Burn pin directly at click point
    if (currentTool === 'pin') {
      const nextNumber = pinCount + 1;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(nextNumber), x, y);
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      setPinCount(nextNumber);
      saveCanvasState();
      return;
    }

    // 12b Inline Text Box Tool: Spawn inline input overlay at click
    if (currentTool === 'text') {
      setPendingInput({
        x,
        y,
        type: 'text',
        placeholder: 'Type annotation text...'
      });
      setInputValue('');
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });

    ctx.beginPath();
    ctx.moveTo(x, y);
    lastDrawPointRef.current = { x, y };
    ctx.strokeStyle = color;
    ctx.lineWidth = currentTool === 'highlighter' ? lineWidth * 3 : lineWidth;
    ctx.lineCap = currentTool === 'highlighter' ? 'butt' : 'round';
    ctx.lineJoin = currentTool === 'highlighter' ? 'miter' : 'round';

    if (currentTool === 'highlighter') {
      ctx.globalAlpha = 0.4;
    } else {
      ctx.globalAlpha = 1.0;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'crop' || currentTool === 'text' || currentTool === 'compare') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    if (currentTool === 'pen' || currentTool === 'highlighter') {
      const last = lastDrawPointRef.current ?? { x, y };
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastDrawPointRef.current = { x, y };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || currentTool === 'crop' || currentTool === 'text' || currentTool === 'compare') return;
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
    ctx.setLineDash([]);

    if (currentTool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, endX - startPos.x, endY - startPos.y);
      saveCanvasState();
    } else if (currentTool === 'circle') {
      // 13b Circle Tool: corner-to-corner bounding ellipse
      const left = Math.min(startPos.x, endX);
      const top = Math.min(startPos.y, endY);
      const boxW = Math.abs(endX - startPos.x);
      const boxH = Math.abs(endY - startPos.y);
      const centerX = left + boxW / 2;
      const centerY = top + boxH / 2;
      const radiusX = boxW / 2;
      const radiusY = boxH / 2;
      if (radiusX > 2 || radiusY > 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        saveCanvasState();
      }
    } else if (currentTool === 'blur') {
      // 12d Blur Tool
      const rx = Math.min(startPos.x, endX);
      const ry = Math.min(startPos.y, endY);
      const rw = Math.abs(endX - startPos.x);
      const rh = Math.abs(endY - startPos.y);
      if (rw > 4 && rh > 4) {
        applyPixelation(ctx, rx, ry, rw, rh);
        saveCanvasState();
      }
    } else if (currentTool === 'arrow') {
      // Arrow tool
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
      saveCanvasState();
    } else if (currentTool === 'measure') {
      // 13c-i Measure Tool: Straight line with perpendicular ruler tick marks at both ends
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Perpendicular tick marks at both ends (ruler-style)
      const angle = Math.atan2(endY - startPos.y, endX - startPos.x);
      const tickLength = 8;
      const perpAngle = angle + Math.PI / 2;

      ctx.beginPath();
      ctx.moveTo(
        startPos.x - Math.cos(perpAngle) * tickLength,
        startPos.y - Math.sin(perpAngle) * tickLength
      );
      ctx.lineTo(
        startPos.x + Math.cos(perpAngle) * tickLength,
        startPos.y + Math.sin(perpAngle) * tickLength
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(
        endX - Math.cos(perpAngle) * tickLength,
        endY - Math.sin(perpAngle) * tickLength
      );
      ctx.lineTo(
        endX + Math.cos(perpAngle) * tickLength,
        endY + Math.sin(perpAngle) * tickLength
      );
      ctx.stroke();

      const midX = (startPos.x + endX) / 2;
      const midY = (startPos.y + endY) / 2;
      setPendingInput({
        x: midX,
        y: midY,
        type: 'measure',
        placeholder: 'e.g. 12cm'
      });
      setInputValue('');
      // Do not save state yet — wait for label commit or cancel
    } else if (currentTool === 'callout') {
      // 12k Callout Tool: Draw thin leader line, prompt inline note at release
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw anchor dot
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      setPendingInput({
        x: endX,
        y: endY,
        type: 'callout',
        placeholder: 'Enter callout note...'
      });
      setInputValue('');
      // Do not save state yet — wait for label commit or cancel
    } else if (currentTool === 'pen' || currentTool === 'highlighter') {
      saveCanvasState();
    }

    lastDrawPointRef.current = null;
    setIsDrawing(false);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerUp(e);
  };

  // Commit or cancel inline text input
  const handleCommitPendingInput = (commit: boolean) => {
    if (!pendingInput) return;
    const canvas = canvasRef.current;
    if (!canvas) {
      setPendingInput(null);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setPendingInput(null);
      return;
    }

    const trimmed = inputValue.trim();
    if (commit && trimmed) {
      const fontSize = lineWidth * 4 + 10;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(trimmed, pendingInput.x, pendingInput.y);
      ctx.shadowBlur = 0;
      saveCanvasState();
    } else {
      // If measure or callout had already drawn the line, save the canvas state now
      if (pendingInput.type === 'measure' || pendingInput.type === 'callout') {
        saveCanvasState();
      }
    }

    setPendingInput(null);
    setInputValue('');
  };

  // 12a Drag-to-Crop Event Handlers
  const handleCropBodyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsDraggingCrop(true);
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox }
    };
  };

  const handleCropHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    setIsResizingCrop(true);
    cropDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox }
    };
  };

  const handleCropPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCrop && !isResizingCrop) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;

    const deltaX = (e.clientX - cropDragStartRef.current.clientX) * scaleX;
    const deltaY = (e.clientY - cropDragStartRef.current.clientY) * scaleY;
    const startBox = cropDragStartRef.current.box;

    if (isDraggingCrop) {
      const nextX = Math.max(0, Math.min(canvas.width - startBox.w, startBox.x + deltaX));
      const nextY = Math.max(0, Math.min(canvas.height - startBox.h, startBox.y + deltaY));
      setCropBox({
        ...startBox,
        x: Math.round(nextX),
        y: Math.round(nextY)
      });
    } else if (isResizingCrop) {
      const nextW = Math.max(20, Math.min(canvas.width - startBox.x, startBox.w + deltaX));
      const nextH = Math.max(20, Math.min(canvas.height - startBox.y, startBox.h + deltaY));
      setCropBox({
        ...startBox,
        w: Math.round(nextW),
        h: Math.round(nextH)
      });
    }
  };

  const handleCropPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }
    setIsDraggingCrop(false);
    setIsResizingCrop(false);
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

    // Reset crop box centered on new dimensions
    setCropBox({
      x: Math.round(canvas.width * 0.1),
      y: Math.round(canvas.height * 0.1),
      w: Math.round(canvas.width * 0.8),
      h: Math.round(canvas.height * 0.8)
    });

    setCurrentTool('pen');
    saveCanvasState();
  };

  // 12i Rotate tool handler
  const handleRotate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const off = document.createElement('canvas');
    off.width = canvas.height;
    off.height = canvas.width;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    offCtx.translate(off.width / 2, off.height / 2);
    offCtx.rotate(Math.PI / 2);
    offCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
    canvas.width = off.width;
    canvas.height = off.height;
    ctx.drawImage(off, 0, 0);
    saveCanvasState();
  };

  // 12i Horizontal Flip tool handler
  const handleFlipHorizontal = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const off = document.createElement('canvas');
    off.width = canvas.width;
    off.height = canvas.height;
    const offCtx = off.getContext('2d');
    if (!offCtx) return;
    offCtx.translate(canvas.width, 0);
    offCtx.scale(-1, 1);
    offCtx.drawImage(canvas, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0);
    saveCanvasState();
  };

  // 12j Brightness adjustment
  const applyBrightnessPreview = (value: number) => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const base = history[history.length - 1];
    const imageData = new ImageData(
      new Uint8ClampedArray(base.data),
      base.width,
      base.height
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = data[i] + value;
      data[i + 1] = data[i + 1] + value;
      data[i + 2] = data[i + 2] + value;
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleBrightnessSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBrightnessValue(val);
    applyBrightnessPreview(val);
  };

  const handleBrightnessCommit = () => {
    saveCanvasState();
    setBrightnessValue(0);
  };

  // Render compare canvas when in compare mode
  useEffect(() => {
    if (currentTool === 'compare' && compareCanvasRef.current && originalImageDataRef.current) {
      const orig = originalImageDataRef.current;
      const cCanvas = compareCanvasRef.current;
      cCanvas.width = orig.width;
      cCanvas.height = orig.height;
      const cCtx = cCanvas.getContext('2d');
      if (cCtx) {
        cCtx.putImageData(orig, 0, 0);
      }
    }
  }, [currentTool]);

  const handleFinalSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const editedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSave({
      ...photo,
      url: editedDataUrl,
      caption: caption || photo.caption,
      timestamp:
        new Date().toLocaleDateString() +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    onClose();
  };

  // Calculate screen position for crop box overlay
  const canvasRect = canvasRef.current?.getBoundingClientRect();
  const screenScaleX = canvasRef.current && canvasRect?.width ? canvasRect.width / canvasRef.current.width : 1;
  const screenScaleY = canvasRef.current && canvasRect?.height ? canvasRect.height / canvasRef.current.height : 1;

  const cropScreenStyle = {
    left: `${cropBox.x * screenScaleX}px`,
    top: `${cropBox.y * screenScaleY}px`,
    width: `${cropBox.w * screenScaleX}px`,
    height: `${cropBox.h * screenScaleY}px`
  };

  // Main Toolbar items (9 tools)
  const mainTools: { id: EditorTool; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'pen', label: 'Pen', icon: Edit3 },
    { id: 'highlighter', label: 'Highlight', icon: Highlighter },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'rectangle', label: 'Box', icon: Square },
    { id: 'circle', label: 'Circle', icon: Circle },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'blur', label: 'Blur', icon: EyeOff },
    { id: 'crop', label: 'Crop', icon: Crop },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl space-y-3">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Plant Photo Annotation & Inspection Tool</h3>
              <p className="text-[11px] text-slate-400">Mark defects, add leader callouts, redactions & dimensional notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Toolbar */}
        <div className="bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            
            {/* Tool Selector Buttons */}
            <div className="flex flex-wrap items-center gap-1">
              {mainTools.map((t) => {
                const IconComp = t.icon;
                const active = currentTool === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setCurrentTool(t.id)}
                    className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                      active
                        ? 'bg-sky-500 text-white shadow-sm ring-1 ring-sky-300'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                    title={t.label}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                    <span className="hidden md:inline text-[11px]">{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Undo Action Button */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={handleUndo}
                disabled={history.length <= 1}
                className="p-1.5 text-slate-300 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-lg disabled:opacity-40 transition-colors flex items-center space-x-1 text-xs"
                title="Undo last stroke"
              >
                <Undo className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Undo</span>
              </button>
            </div>
          </div>

          {/* Contextual Sub-bar: Color & Size Controls (hidden when in Crop, Compare, or Brightness mode) */}
          {currentTool !== 'crop' && currentTool !== 'compare' && currentTool !== 'brightness' && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-700/40">
              {/* Color Palette + 13d Relocated Eyedropper */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Color:</span>
                {[
                  { name: 'Red', hex: '#ef4444' },
                  { name: 'Yellow', hex: '#f59e0b' },
                  { name: 'Green', hex: '#10b981' },
                  { name: 'Sky Blue', hex: '#0ea5e9' },
                  { name: 'White', hex: '#ffffff' },
                  { name: 'Black', hex: '#000000' }
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      color.toLowerCase() === c.hex.toLowerCase() ? 'border-sky-400 scale-110 shadow-md ring-1 ring-sky-300' : 'border-slate-700'
                    }`}
                    title={c.name}
                  />
                ))}

                {/* 13d Eyedropper Button inside Color Swatches Row */}
                <button
                  onClick={() => setCurrentTool('eyedropper')}
                  className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ml-1 ${
                    currentTool === 'eyedropper'
                      ? 'bg-pink-500/20 border-pink-400 text-pink-300 ring-1 ring-pink-400'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Pick color from photo"
                >
                  <Pipette className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stroke Size */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Stroke:</span>
                <input
                  type="range"
                  min="2"
                  max="16"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(Number(e.target.value))}
                  className="w-20 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
                <span className="text-[11px] text-slate-300 font-mono w-4">{lineWidth}</span>
              </div>
            </div>
          )}

          {/* 12j Brightness Control Row */}
          {currentTool === 'brightness' && (
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-700/40 px-2 py-1">
              <div className="flex items-center space-x-2 flex-1">
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300 font-medium">Adjust Brightness:</span>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={brightnessValue}
                  onChange={handleBrightnessSliderChange}
                  onMouseUp={handleBrightnessCommit}
                  onTouchEnd={handleBrightnessCommit}
                  className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-xs text-amber-300 font-mono w-8 text-right">{brightnessValue > 0 ? `+${brightnessValue}` : brightnessValue}</span>
              </div>
              <button
                onClick={handleBrightnessCommit}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
            </div>
          )}

          {/* 12e Compare Slider Control Row */}
          {currentTool === 'compare' && (
            <div className="flex items-center space-x-3 pt-1 border-t border-slate-700/40 px-2 py-1">
              <ArrowLeftRight className="w-4 h-4 text-sky-400" />
              <span className="text-xs text-slate-300 font-medium">Split Position:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={compareSplit}
                onChange={(e) => setCompareSplit(Number(e.target.value))}
                className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-xs text-sky-300 font-mono w-10 text-right">{compareSplit}%</span>
            </div>
          )}
        </div>

        {/* Advanced Tools Collapsible Accordion */}
        <div className="border border-slate-800 rounded-xl bg-slate-900/60 overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Advanced Engineering Annotation Tools</span>
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {showAdvanced && (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* 12g Numbered Pins */}
              <button
                onClick={() => setCurrentTool('pin')}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-all ${
                  currentTool === 'pin'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Numbered Pins</div>
                  <div className="text-[9px] text-slate-400">#{pinCount + 1} next stamp</div>
                </div>
              </button>

              {/* 12h / 13c-i Measure Line */}
              <button
                onClick={() => setCurrentTool('measure')}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-all ${
                  currentTool === 'measure'
                    ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 ring-1 ring-indigo-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Ruler className="w-4 h-4 text-indigo-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Measure Line</div>
                  <div className="text-[9px] text-slate-400">Dimension tag</div>
                </div>
              </button>

              {/* 12k / 13c-ii Callout Note */}
              <button
                onClick={() => setCurrentTool('callout')}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-all ${
                  currentTool === 'callout'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-300 ring-1 ring-purple-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Callout Note</div>
                  <div className="text-[9px] text-slate-400">Leader line & label</div>
                </div>
              </button>

              {/* 12i Rotate 90° */}
              <button
                onClick={handleRotate}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium flex items-center space-x-2 transition-all"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Rotate 90°</div>
                  <div className="text-[9px] text-slate-400">Clockwise</div>
                </div>
              </button>

              {/* 12i Flip Horizontal */}
              <button
                onClick={handleFlipHorizontal}
                className="p-2 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-medium flex items-center space-x-2 transition-all"
              >
                <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Flip Mirror</div>
                  <div className="text-[9px] text-slate-400">Horizontal</div>
                </div>
              </button>

              {/* 12j Brightness Tool */}
              <button
                onClick={() => setCurrentTool('brightness')}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-2 transition-all ${
                  currentTool === 'brightness'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-bold text-[11px]">Brightness</div>
                  <div className="text-[9px] text-slate-400">Light / shadow</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Canvas Workspace with Overlays */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center p-2 min-h-[340px] border border-slate-800">
          
          {/* Sized container exactly fitting the canvas */}
          <div ref={containerRef} className="relative inline-block max-w-full">
            <canvas
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{ touchAction: 'none' }}
              className={`max-w-full h-auto rounded shadow-lg select-none ${
                currentTool === 'eyedropper'
                  ? 'cursor-copy'
                  : currentTool === 'crop'
                  ? 'cursor-default'
                  : 'cursor-crosshair'
              }`}
            />

            {/* 12e Compare Mode Split Overlay */}
            {currentTool === 'compare' && (
              <div
                className="absolute inset-0 select-none overflow-hidden"
                onPointerDown={(e) => {
                  setIsDraggingCompare(true);
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                }}
                onPointerMove={(e) => {
                  if (!isDraggingCompare) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                  setCompareSplit(Math.round((x / rect.width) * 100));
                }}
                onPointerUp={(e) => {
                  try {
                    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    }
                  } catch {}
                  setIsDraggingCompare(false);
                }}
              >
                {/* Original baseline canvas */}
                <canvas
                  ref={compareCanvasRef}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />

                {/* Edited image overlay with right-side clip */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 0 0 ${compareSplit}%)` }}
                >
                  <img
                    src={canvasRef.current?.toDataURL() || ''}
                    alt="Edited"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Vertical Divider line & Grabber */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)] pointer-events-none z-20 flex items-center justify-center"
                  style={{ left: `${compareSplit}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-lg text-[10px] font-bold">
                    <ArrowLeftRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px] font-bold rounded">
                  Original
                </div>
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-sky-950/80 border border-sky-600 text-sky-300 text-[10px] font-bold rounded">
                  Annotated
                </div>
              </div>
            )}

            {/* 12a Drag-to-Crop Overlay Box */}
            {currentTool === 'crop' && (
              <div
                className="absolute inset-0 bg-black/60 pointer-events-auto"
                onPointerMove={handleCropPointerMove}
              >
                {/* Active Highlighted Crop Box */}
                <div
                  style={cropScreenStyle}
                  onPointerDown={handleCropBodyPointerDown}
                  onPointerUp={handleCropPointerUp}
                  className="absolute border-2 border-dashed border-sky-400 bg-sky-400/10 cursor-move shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center group"
                >
                  <div className="text-[10px] font-mono text-sky-200 bg-slate-900/80 px-1.5 py-0.5 rounded pointer-events-none">
                    {cropBox.w} × {cropBox.h} px
                  </div>

                  {/* Corner Resize Handle */}
                  <div
                    onPointerDown={handleCropHandlePointerDown}
                    onPointerUp={handleCropPointerUp}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-sky-400 border-2 border-white rounded cursor-se-resize shadow-md hover:scale-125 transition-transform z-30"
                    title="Drag to resize crop region"
                  />
                </div>

                {/* Floating Apply Crop Button */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2">
                  <button
                    onClick={applyCrop}
                    className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-lg"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    <span>Apply Crop Selection</span>
                  </button>
                  <button
                    onClick={() => setCurrentTool('pen')}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* 12b, 12h, 12k / 13c-ii Inline Text Overlay Input */}
            {pendingInput && (
              <div
                style={{
                  position: 'absolute',
                  left: `${canvasToScreenCoords(pendingInput.x, pendingInput.y).left}px`,
                  top: `${canvasToScreenCoords(pendingInput.x, pendingInput.y).top}px`,
                  transform: 'translate(-4px, -50%)',
                  zIndex: 40
                }}
                className={`flex items-center space-x-1 shadow-2xl backdrop-blur-sm ${
                  pendingInput.type === 'callout'
                    ? 'bg-purple-950/90 border border-purple-400 rounded-2xl rounded-bl-sm p-1.5'
                    : 'bg-slate-900/90 border border-dashed border-sky-400 rounded p-1'
                }`}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCommitPendingInput(true);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      handleCommitPendingInput(false);
                    }
                  }}
                  placeholder={pendingInput.placeholder}
                  style={{
                    color: color,
                    fontSize: `${Math.max(12, Math.min(22, lineWidth * 3 + 8))}px`
                  }}
                  className="bg-transparent border-none outline-none font-bold px-1.5 py-0.5 min-w-[140px] max-w-[260px] text-white placeholder-slate-500 shadow-none"
                />
                <button
                  type="button"
                  onClick={() => handleCommitPendingInput(true)}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px]"
                  title="Confirm (Enter)"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitPendingInput(false)}
                  className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px]"
                  title="Cancel (Esc)"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Caption Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Photo Caption & Defect Description
          </label>
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
