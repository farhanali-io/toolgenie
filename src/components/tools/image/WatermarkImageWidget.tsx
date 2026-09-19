import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  Download, 
  AlertCircle, 
  RefreshCw, 
  Stamp, 
  Type, 
  Image as ImageIcon, 
  Grid 
} from 'lucide-react';

type WatermarkType = 'text' | 'image';
type Position = 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export const WatermarkImageWidget: React.FC = () => {
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [baseDataUrl, setBaseDataUrl] = useState<string | null>(null);

  // Watermark parameters
  const [watermarkType, setWatermarkType] = useState<WatermarkType>('text');
  const [watermarkText, setWatermarkText] = useState('ToolGenie Preview');
  const [textColor, setTextColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState<number>(36);
  const [opacity, setOpacity] = useState<number>(70);
  const [position, setPosition] = useState<Position>('bottom-right');
  const [isTiled, setIsTiled] = useState<boolean>(false);

  // Logo watermark
  const [watermarkImageDataUrl, setWatermarkImageDataUrl] = useState<string | null>(null);
  const [watermarkScale, setWatermarkScale] = useState<number>(25); // % of main image

  // Result
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
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

  const handleBaseFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    if (!selected.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image.');
      return;
    }

    setErrorMessage(null);
    cleanupActiveUrl();
    setResultBlob(null);
    setResultPreviewUrl(null);

    try {
      const url = await readFileAsDataURL(selected);
      setBaseFile(selected);
      setBaseDataUrl(url);
    } catch {
      setErrorMessage('Could not load image.');
    }
  };

  const handleWatermarkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await readFileAsDataURL(file);
      setWatermarkImageDataUrl(url);
    } catch {
      setErrorMessage('Could not load watermark logo.');
    }
  };

  // Re-generate watermark when properties change
  useEffect(() => {
    if (!baseDataUrl || !baseFile) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const baseImg = await loadImage(baseDataUrl);
        if (!isMounted) return;

        const canvas = document.createElement('canvas');
        const w = baseImg.naturalWidth || baseImg.width;
        const h = baseImg.naturalHeight || baseImg.height;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D unavailable');

        // 1. Draw base image
        ctx.drawImage(baseImg, 0, 0);

        // 2. Setup opacity
        ctx.save();
        ctx.globalAlpha = opacity / 100;

        if (watermarkType === 'text') {
          if (watermarkText.trim()) {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            if (isTiled) {
              const textMetrics = ctx.measureText(watermarkText);
              const textW = textMetrics.width;
              const stepX = textW + 100;
              const stepY = fontSize + 80;

              for (let x = -w; x < w * 2; x += stepX) {
                for (let y = -h; y < h * 2; y += stepY) {
                  ctx.save();
                  ctx.translate(x, y);
                  ctx.rotate(-Math.PI / 6); // -30 deg
                  ctx.fillText(watermarkText, 0, 0);
                  ctx.restore();
                }
              }
            } else {
              const metrics = ctx.measureText(watermarkText);
              const textW = metrics.width;
              const pad = 30;

              let targetX = pad;
              let targetY = pad + fontSize;

              if (position.includes('center')) {
                if (position === 'center') {
                  targetX = (w - textW) / 2;
                  targetY = h / 2 + fontSize / 3;
                } else if (position === 'top-center') {
                  targetX = (w - textW) / 2;
                  targetY = pad + fontSize;
                } else if (position === 'bottom-center') {
                  targetX = (w - textW) / 2;
                  targetY = h - pad;
                } else if (position === 'center-left') {
                  targetX = pad;
                  targetY = h / 2 + fontSize / 3;
                } else if (position === 'center-right') {
                  targetX = w - textW - pad;
                  targetY = h / 2 + fontSize / 3;
                }
              } else if (position.includes('right')) {
                targetX = w - textW - pad;
              }

              if (position.includes('bottom') && !position.includes('center')) {
                targetY = h - pad;
              }

              ctx.fillText(watermarkText, targetX, targetY);
            }
          }
        } else if (watermarkType === 'image' && watermarkImageDataUrl) {
          const wmImg = await loadImage(watermarkImageDataUrl);
          const wmNaturalW = wmImg.naturalWidth || wmImg.width;
          const wmNaturalH = wmImg.naturalHeight || wmImg.height;

          // Scale relative to main image
          const targetW = (w * watermarkScale) / 100;
          const targetH = (wmNaturalH / wmNaturalW) * targetW;
          const pad = 30;

          let targetX = pad;
          let targetY = pad;

          if (position.includes('center')) {
            if (position === 'center') {
              targetX = (w - targetW) / 2;
              targetY = (h - targetH) / 2;
            } else if (position === 'top-center') {
              targetX = (w - targetW) / 2;
              targetY = pad;
            } else if (position === 'bottom-center') {
              targetX = (w - targetW) / 2;
              targetY = h - targetH - pad;
            } else if (position === 'center-left') {
              targetX = pad;
              targetY = (h - targetH) / 2;
            } else if (position === 'center-right') {
              targetX = w - targetW - pad;
              targetY = (h - targetH) / 2;
            }
          } else if (position.includes('right')) {
            targetX = w - targetW - pad;
          }

          if (position.includes('bottom') && !position.includes('center')) {
            targetY = h - targetH - pad;
          }

          ctx.drawImage(wmImg, targetX, targetY, targetW, targetH);
        }

        ctx.restore();

        const mime = baseFile.type || 'image/png';
        canvas.toBlob((blob) => {
          if (!isMounted || !blob) {
            setIsProcessing(false);
            return;
          }

          cleanupActiveUrl();
          const newUrl = URL.createObjectURL(blob);
          activeUrlRef.current = newUrl;

          setResultBlob(blob);
          setResultSize(blob.size);
          setResultPreviewUrl(newUrl);
          setIsProcessing(false);
        }, mime, 0.95);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to render watermark.');
          setIsProcessing(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    baseDataUrl,
    baseFile,
    watermarkType,
    watermarkText,
    textColor,
    fontSize,
    opacity,
    position,
    isTiled,
    watermarkImageDataUrl,
    watermarkScale
  ]);

  const handleDownload = () => {
    if (!resultBlob || !baseFile) return;
    const baseName = baseFile.name.replace(/\.[^/.]+$/, '');
    const ext = baseFile.name.split('.').pop() || 'png';
    downloadBlob(resultBlob, `${baseName}-watermarked.${ext}`);
  };

  const handleReset = () => {
    cleanupActiveUrl();
    setBaseFile(null);
    setBaseDataUrl(null);
    setResultBlob(null);
    setResultPreviewUrl(null);
    setErrorMessage(null);
  };

  const positions: Position[] = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  return (
    <div className="space-y-6">
      {!baseFile ? (
        <DropZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleBaseFileSelected}
          title="Choose or drop image to watermark"
          description="Protect your creative work with custom text stamps or logo watermarks"
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
                <Stamp size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                  {baseFile.name}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {formatBytes(baseFile.size)}
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

          {/* Watermark Type Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Watermark Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setWatermarkType('text')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  watermarkType === 'text' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: watermarkType === 'text' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: watermarkType === 'text' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <Type size={16} style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Text Stamp</span>
              </button>

              <button
                type="button"
                onClick={() => setWatermarkType('image')}
                className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  watermarkType === 'image' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: watermarkType === 'image' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: watermarkType === 'image' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <ImageIcon size={16} style={{ color: 'var(--accent)' }} />
                <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>Logo / Image</span>
              </button>
            </div>
          </div>

          {/* Controls: Text or Image */}
          {watermarkType === 'text' ? (
            <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <label htmlFor="watermark-text-input" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Watermark Text
                </label>
                <input
                  id="watermark-text-input"
                  type="text"
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  placeholder="e.g. Confidential, © Your Name"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="text-color-input" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Text Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="text-color-input"
                      type="color"
                      value={textColor}
                      onChange={e => setTextColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="font-mono text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>
                      {textColor}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="font-size-range" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                    Font Size: {fontSize}px
                  </label>
                  <input
                    id="font-size-range"
                    type="range"
                    min="14"
                    max="120"
                    value={fontSize}
                    onChange={e => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="tiled-check"
                  checked={isTiled}
                  onChange={e => setIsTiled(e.target.checked)}
                  className="accent-indigo-600 rounded"
                />
                <label htmlFor="tiled-check" className="text-xs font-medium cursor-pointer" style={{ color: 'var(--text-primary)' }}>
                  Repeated pattern across full canvas (Anti-theft tile)
                </label>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <div>
                <label htmlFor="watermark-logo-file" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Upload Logo (PNG with transparency recommended)
                </label>
                <input
                  id="watermark-logo-file"
                  type="file"
                  accept="image/*"
                  onChange={handleWatermarkImageUpload}
                  className="text-xs"
                />
              </div>

              <div>
                <label htmlFor="logo-scale-range" className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  Logo Size: {watermarkScale}% of main image
                </label>
                <input
                  id="logo-scale-range"
                  type="range"
                  min="5"
                  max="75"
                  value={watermarkScale}
                  onChange={e => setWatermarkScale(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Common controls: Opacity and 9-Grid Position */}
          <div className="p-4 rounded-xl border space-y-4" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="watermark-opacity-range" className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Opacity
                </label>
                <span className="text-xs font-mono font-bold" style={{ color: 'var(--accent)' }}>
                  {opacity}%
                </span>
              </div>
              <input
                id="watermark-opacity-range"
                type="range"
                min="10"
                max="100"
                value={opacity}
                onChange={e => setOpacity(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {!isTiled && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Grid size={15} style={{ color: 'var(--accent)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Placement Position
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                  {positions.map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPosition(pos)}
                      className={`w-12 h-10 rounded-md border text-[9px] uppercase font-bold flex items-center justify-center transition-all cursor-pointer ${
                        position === pos ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: position === pos ? 'var(--accent)' : 'var(--bg-surface)',
                        color: position === pos ? 'var(--accent-contrast)' : 'var(--text-muted)',
                        borderColor: position === pos ? 'var(--accent)' : 'var(--border-subtle)'
                      }}
                      title={pos}
                    >
                      {pos.replace('center', 'C').replace('top', 'T').replace('bottom', 'B').replace('left', 'L').replace('right', 'R').replace('-', '')}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          {resultPreviewUrl && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                Live Watermark Preview
              </span>
              <div 
                className="rounded-xl border p-4 flex items-center justify-center max-h-80 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <img
                  src={resultPreviewUrl}
                  alt="Watermarked preview"
                  className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing || !resultBlob}
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download Watermarked Image ({formatBytes(resultSize)})</span>
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
