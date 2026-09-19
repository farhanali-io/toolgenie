import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  Download, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  ImageIcon 
} from 'lucide-react';

export const ImageCompressorWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [quality, setQuality] = useState<number>(75);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<string | null>(null);
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
    return () => {
      cleanupActiveUrl();
    };
  }, []);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    if (!selected.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    setErrorMessage(null);
    cleanupActiveUrl();
    setCompressedPreviewUrl(null);
    setCompressedBlob(null);

    try {
      const url = await readFileAsDataURL(selected);
      setFile(selected);
      setDataUrl(url);
      setOriginalSize(selected.size);
    } catch {
      setErrorMessage('Could not load the selected image.');
    }
  };

  // Re-compress whenever quality or image changes
  useEffect(() => {
    if (!dataUrl || !file) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const img = await loadImage(dataUrl);
        if (!isMounted) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D unavailable');

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0);

        // Determine target mime type (prefer original or jpeg if png without transparency)
        const mimeType = file.type === 'image/png' ? 'image/webp' : file.type;
        const q = quality / 100;

        canvas.toBlob((blob) => {
          if (!isMounted || !blob) {
            setIsProcessing(false);
            return;
          }

          cleanupActiveUrl();
          const newUrl = URL.createObjectURL(blob);
          activeUrlRef.current = newUrl;

          setCompressedBlob(blob);
          setCompressedSize(blob.size);
          setCompressedPreviewUrl(newUrl);
          setIsProcessing(false);
        }, mimeType, q);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Error compressing image.');
          setIsProcessing(false);
        }
      }
    }, 150); // slight debounce for smooth slider dragging

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dataUrl, quality, file]);

  const handleDownload = () => {
    if (!compressedBlob || !file) return;
    const extension = compressedBlob.type === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(compressedBlob, `${baseName}-compressed.${extension}`);
  };

  const handleReset = () => {
    cleanupActiveUrl();
    setFile(null);
    setDataUrl(null);
    setCompressedBlob(null);
    setCompressedPreviewUrl(null);
    setErrorMessage(null);
  };

  const reductionPercent = originalSize > 0 && compressedSize > 0
    ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop image to compress"
          description="Reduce image file size with real-time preview and quality control"
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
                  Original: {formatBytes(originalSize)}
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

          {/* Quality Slider Control */}
          <div className="p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders size={16} style={{ color: 'var(--accent)' }} />
                <label htmlFor="image-quality-range" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Compression Quality
                </label>
              </div>
              <span className="font-mono font-bold text-sm px-2.5 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
                {quality}%
              </span>
            </div>

            <input
              id="image-quality-range"
              type="range"
              min="5"
              max="100"
              step="1"
              value={quality}
              onChange={e => setQuality(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />

            <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>Smaller file (5%)</span>
              <span>Balanced (75%)</span>
              <span>Max quality (100%)</span>
            </div>
          </div>

          {/* Comparison Cards: Before vs After */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Original Size
              </span>
              <span className="font-mono text-sm sm:text-base font-semibold mt-0.5 block" style={{ color: 'var(--text-secondary)' }}>
                {formatBytes(originalSize)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Compressed Size
              </span>
              <span className="font-mono text-sm sm:text-base font-bold mt-0.5 block text-emerald-500">
                {isProcessing ? 'Calculating...' : formatBytes(compressedSize)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Space Saved
              </span>
              <span className="font-mono text-sm sm:text-base font-bold mt-0.5 flex items-center gap-1 text-emerald-500">
                <TrendingDown size={16} />
                {reductionPercent > 0 ? `${reductionPercent}%` : '0%'}
              </span>
            </div>
          </div>

          {/* Live Preview of Compressed Image */}
          {compressedPreviewUrl && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Live Output Preview
              </span>
              <div 
                className="rounded-xl border p-4 flex items-center justify-center max-h-80 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <img
                  src={compressedPreviewUrl}
                  alt="Compressed preview"
                  className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing || !compressedBlob}
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Compressing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Compressed Image ({formatBytes(compressedSize)})</span>
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
