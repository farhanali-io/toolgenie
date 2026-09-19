import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  Download, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Scaling, 
  Percent, 
  Maximize, 
  ImageIcon 
} from 'lucide-react';

type ResizeMode = 'dimensions' | 'percentage';

export const ImageResizerWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalHeight, setOriginalHeight] = useState<number>(0);

  const [resizeMode, setResizeMode] = useState<ResizeMode>('dimensions');
  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(50);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);

  const [resizedBlob, setResizedBlob] = useState<Blob | null>(null);
  const [resizedSize, setResizedSize] = useState<number>(0);
  const [resizedPreviewUrl, setResizedPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeUrlRef = useRef<string | null>(null);

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
    setResizedBlob(null);
    setResizedPreviewUrl(null);

    try {
      const url = await readFileAsDataURL(selected);
      const img = await loadImage(url);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      setFile(selected);
      setDataUrl(url);
      setOriginalWidth(w);
      setOriginalHeight(h);
      setTargetWidth(Math.round(w * 0.75));
      setTargetHeight(Math.round(h * 0.75));
    } catch {
      setErrorMessage('Could not load image dimensions.');
    }
  };

  const handleWidthChange = (val: number) => {
    const w = Math.max(1, val);
    setTargetWidth(w);
    if (lockAspectRatio && originalWidth > 0) {
      const ratio = originalHeight / originalWidth;
      setTargetHeight(Math.round(w * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    const h = Math.max(1, val);
    setTargetHeight(h);
    if (lockAspectRatio && originalHeight > 0) {
      const ratio = originalWidth / originalHeight;
      setTargetWidth(Math.round(h * ratio));
    }
  };

  const handlePercentageChange = (pct: number) => {
    const p = Math.max(1, Math.min(500, pct));
    setPercentage(p);
    if (originalWidth > 0 && originalHeight > 0) {
      setTargetWidth(Math.round((originalWidth * p) / 100));
      setTargetHeight(Math.round((originalHeight * p) / 100));
    }
  };

  // Perform resize operation
  useEffect(() => {
    if (!dataUrl || !file || originalWidth === 0) return;

    let finalW = targetWidth;
    let finalH = targetHeight;

    if (resizeMode === 'percentage') {
      finalW = Math.round((originalWidth * percentage) / 100);
      finalH = Math.round((originalHeight * percentage) / 100);
    }

    if (finalW <= 0 || finalH <= 0) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const img = await loadImage(dataUrl);
        if (!isMounted) return;

        const canvas = document.createElement('canvas');
        canvas.width = finalW;
        canvas.height = finalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D unavailable');

        // Better downsampling smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, finalW, finalH);

        const mime = file.type.startsWith('image/') ? file.type : 'image/png';
        canvas.toBlob((blob) => {
          if (!isMounted || !blob) {
            setIsProcessing(false);
            return;
          }

          cleanupActiveUrl();
          const newUrl = URL.createObjectURL(blob);
          activeUrlRef.current = newUrl;

          setResizedBlob(blob);
          setResizedSize(blob.size);
          setResizedPreviewUrl(newUrl);
          setIsProcessing(false);
        }, mime, 0.92);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to resize image.');
          setIsProcessing(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dataUrl, targetWidth, targetHeight, resizeMode, percentage, file, originalWidth, originalHeight]);

  const handleDownload = () => {
    if (!resizedBlob || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = file.name.split('.').pop() || 'png';
    downloadBlob(resizedBlob, `${baseName}-resized.${extension}`);
  };

  const handleReset = () => {
    cleanupActiveUrl();
    setFile(null);
    setDataUrl(null);
    setResizedBlob(null);
    setResizedPreviewUrl(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop image to resize"
          description="Scale dimensions by exact pixels or percentage while keeping optimal aspect ratio"
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
          {/* File Header */}
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
                  Original: {originalWidth} × {originalHeight} px • {formatBytes(file.size)}
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

          {/* Mode Switcher */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Resize Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResizeMode('dimensions')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  resizeMode === 'dimensions' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: resizeMode === 'dimensions' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: resizeMode === 'dimensions' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <Maximize size={15} style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Exact Pixels</span>
              </button>

              <button
                type="button"
                onClick={() => setResizeMode('percentage')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  resizeMode === 'percentage' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: resizeMode === 'percentage' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: resizeMode === 'percentage' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <Percent size={15} style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Percentage Scale</span>
              </button>
            </div>
          </div>

          {/* Controls based on mode */}
          {resizeMode === 'dimensions' ? (
            <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target-width-input" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Width (px)
                  </label>
                  <input
                    id="target-width-input"
                    type="number"
                    min="1"
                    max="10000"
                    value={targetWidth || ''}
                    onChange={e => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="target-height-input" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Height (px)
                  </label>
                  <input
                    id="target-height-input"
                    type="number"
                    min="1"
                    max="10000"
                    value={targetHeight || ''}
                    onChange={e => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setLockAspectRatio(!lockAspectRatio)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:opacity-80 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: lockAspectRatio ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                >
                  {lockAspectRatio ? <Lock size={14} /> : <Unlock size={14} />}
                  <span>{lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio free'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <label htmlFor="scale-percentage-range" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Scale Percentage
                </label>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
                  {percentage}% ({Math.round((originalWidth * percentage) / 100)} × {Math.round((originalHeight * percentage) / 100)} px)
                </span>
              </div>

              <input
                id="scale-percentage-range"
                type="range"
                min="10"
                max="200"
                step="5"
                value={percentage}
                onChange={e => handlePercentageChange(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />

              <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span>10% (Thumbnail)</span>
                <span>50% (Half)</span>
                <span>100% (Original)</span>
                <span>200% (Double)</span>
              </div>
            </div>
          )}

          {/* Resized Preview */}
          {resizedPreviewUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Resized Preview
                </span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {resizeMode === 'percentage' 
                    ? `${Math.round((originalWidth * percentage) / 100)} × ${Math.round((originalHeight * percentage) / 100)} px`
                    : `${targetWidth} × ${targetHeight} px`} • {formatBytes(resizedSize)}
                </span>
              </div>

              <div 
                className="rounded-xl border p-4 flex items-center justify-center max-h-80 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <img
                  src={resizedPreviewUrl}
                  alt="Resized output preview"
                  className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing || !resizedBlob}
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Resizing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Resized Image</span>
                </>
              )}
            </button>
          </div>
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
