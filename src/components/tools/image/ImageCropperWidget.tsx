import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  Download, 
  AlertCircle, 
  Crop, 
  RefreshCw, 
  Check, 
  ImageIcon 
} from 'lucide-react';

type AspectPreset = 'free' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2';

interface CropBox {
  x: number; // percentage [0, 100]
  y: number;
  width: number;
  height: number;
}

export const ImageCropperWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [naturalHeight, setNaturalHeight] = useState(0);

  const [aspectPreset, setAspectPreset] = useState<AspectPreset>('free');
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, width: 80, height: 80 });

  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(null);
  const [croppedSize, setCroppedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragModeRef = useRef<'move' | 'se-resize' | null>(null);
  const startPosRef = useRef<{ clientX: number; clientY: number; box: CropBox }>({
    clientX: 0,
    clientY: 0,
    box: { x: 0, y: 0, width: 0, height: 0 }
  });

  const cleanupActiveUrl = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupActiveUrl();
  }, []);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    if (!selected.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image.');
      return;
    }

    setErrorMessage(null);
    cleanupActiveUrl();
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);

    try {
      const url = await readFileAsDataURL(selected);
      const img = await loadImage(url);
      setFile(selected);
      setDataUrl(url);
      setNaturalWidth(img.naturalWidth || img.width);
      setNaturalHeight(img.naturalHeight || img.height);
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
    } catch {
      setErrorMessage('Could not load image.');
    }
  };

  // Adjust aspect ratio preset
  const handlePresetSelect = (preset: AspectPreset) => {
    setAspectPreset(preset);
    if (preset === 'free') return;

    let targetRatio = 1;
    if (preset === '1:1') targetRatio = 1;
    if (preset === '4:3') targetRatio = 4 / 3;
    if (preset === '16:9') targetRatio = 16 / 9;
    if (preset === '9:16') targetRatio = 9 / 16;
    if (preset === '3:2') targetRatio = 3 / 2;

    if (naturalWidth > 0 && naturalHeight > 0) {
      const imgRatio = naturalWidth / naturalHeight;
      let newW = 70;
      let newH = (newW * imgRatio) / targetRatio;
      if (newH > 80) {
        newH = 70;
        newW = (newH * targetRatio) / imgRatio;
      }
      setCropBox({
        x: Math.max(0, (100 - newW) / 2),
        y: Math.max(0, (100 - newH) / 2),
        width: Math.min(100, newW),
        height: Math.min(100, newH)
      });
    }
  };

  // Perform crop calculation onto off-screen canvas
  const applyCrop = async () => {
    if (!dataUrl || !file || naturalWidth === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = await loadImage(dataUrl);

      const sourceX = Math.round((cropBox.x / 100) * naturalWidth);
      const sourceY = Math.round((cropBox.y / 100) * naturalHeight);
      const sourceW = Math.max(1, Math.round((cropBox.width / 100) * naturalWidth));
      const sourceH = Math.max(1, Math.round((cropBox.height / 100) * naturalHeight));

      const canvas = document.createElement('canvas');
      canvas.width = sourceW;
      canvas.height = sourceH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D unavailable');

      ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

      const mime = file.type || 'image/png';
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsProcessing(false);
          return;
        }

        cleanupActiveUrl();
        const newUrl = URL.createObjectURL(blob);
        activeUrlRef.current = newUrl;

        setCroppedBlob(blob);
        setCroppedSize(blob.size);
        setCroppedPreviewUrl(newUrl);
        setIsProcessing(false);
      }, mime, 0.95);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to crop image.');
      setIsProcessing(false);
    }
  };

  // Draggable crop interactions
  const handleMouseDown = (e: React.MouseEvent, mode: 'move' | 'se-resize') => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragModeRef.current = mode;
    startPosRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      box: { ...cropBox }
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - startPosRef.current.clientX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - startPosRef.current.clientY) / rect.height) * 100;
      const initialBox = startPosRef.current.box;

      if (dragModeRef.current === 'move') {
        const newX = Math.max(0, Math.min(100 - initialBox.width, initialBox.x + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - initialBox.height, initialBox.y + deltaYPercent));
        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
      } else if (dragModeRef.current === 'se-resize') {
        const newW = Math.max(10, Math.min(100 - initialBox.x, initialBox.width + deltaXPercent));
        const newH = Math.max(10, Math.min(100 - initialBox.y, initialBox.height + deltaYPercent));
        setCropBox(prev => ({ ...prev, width: newW, height: newH }));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        dragModeRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleDownload = () => {
    if (!croppedBlob || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = file.name.split('.').pop() || 'png';
    downloadBlob(croppedBlob, `${baseName}-cropped.${extension}`);
  };

  const handleReset = () => {
    cleanupActiveUrl();
    setFile(null);
    setDataUrl(null);
    setCroppedBlob(null);
    setCroppedPreviewUrl(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop image to crop"
          description="Crop photos with custom selection handles or standard social aspect ratios"
          accentColor="var(--accent)"
        />
      ) : (
        <div 
          className="rounded-2xl border p-5 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500">
                <ImageIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Original: {naturalWidth} × {naturalHeight} px
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:opacity-80 cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              Change image
            </button>
          </div>

          {/* Aspect Ratio Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Aspect Ratio Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {(['free', '1:1', '4:3', '16:9', '9:16', '3:2'] as AspectPreset[]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border transition-all cursor-pointer ${
                    aspectPreset === preset ? 'ring-2' : ''
                  }`}
                  style={{
                    backgroundColor: aspectPreset === preset ? 'var(--accent)' : 'var(--bg-page)',
                    color: aspectPreset === preset ? 'var(--accent-contrast)' : 'var(--text-primary)',
                    borderColor: aspectPreset === preset ? 'var(--accent)' : 'var(--border-subtle)'
                  }}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Crop Canvas Area */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Adjust Selection Box (Drag center to move, drag corner handle to resize)
            </span>

            <div
              ref={containerRef}
              className="relative rounded-xl border overflow-hidden max-h-[420px] flex items-center justify-center select-none"
              style={{
                backgroundColor: '#18181b',
                borderColor: 'var(--border-subtle)'
              }}
            >
              {dataUrl && (
                <div className="relative inline-block">
                  <img
                    src={dataUrl}
                    alt="Crop workspace"
                    className="max-h-[380px] w-auto block select-none pointer-events-none"
                  />

                  {/* Dark overlay around crop area */}
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />

                  {/* Active Crop Box */}
                  <div
                    onMouseDown={e => handleMouseDown(e, 'move')}
                    className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] cursor-move transition-shadow"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`,
                    }}
                  >
                    {/* Grid rule of thirds lines */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Bottom-right resize handle */}
                    <div
                      onMouseDown={e => handleMouseDown(e, 'se-resize')}
                      className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full cursor-se-resize shadow-md"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={applyCrop}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm shadow-md transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Cropping...</span>
                </>
              ) : (
                <>
                  <Crop size={16} />
                  <span>Apply Crop</span>
                </>
              )}
            </button>
          </div>

          {/* Cropped Output Area */}
          {croppedPreviewUrl && (
            <div 
              className="p-5 rounded-xl border space-y-4 animate-in fade-in"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Cropped Result ({formatBytes(croppedSize)})
                </span>
                <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                  <Check size={14} /> Ready
                </span>
              </div>

              <div className="flex justify-center max-h-72 overflow-hidden rounded-lg bg-black/10 p-2">
                <img
                  src={croppedPreviewUrl}
                  alt="Cropped preview"
                  className="max-h-64 w-auto rounded object-contain"
                />
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download Cropped Image</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl border flex items-start gap-3 text-sm bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
