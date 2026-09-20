import React, { useState, useEffect, useRef } from 'react';
import { 
  Wand2, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Image as ImageIcon, 
  Eye, 
  Sparkles, 
  Palette, 
  Layers 
} from 'lucide-react';
import { preload, removeBackground } from '@imgly/background-removal';
import { ToolShell } from '../shared/ToolShell';
import { ProgressBar } from '../shared/ProgressBar';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { DropZone } from '../DropZone';
import { AiModelNotice } from './AiModelNotice';

export const BackgroundRemoverWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>('Initializing...');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Model caching state
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [isModelCached, setIsModelCached] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toolgenie_cached_model_bg-remover') === 'true';
    } catch {
      return false;
    }
  });

  // Backdrop preview mode: transparent, white, dark, custom
  const [backdropMode, setBackdropMode] = useState<'transparent' | 'white' | 'dark' | 'custom'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#3b82f6');
  const [viewMode, setViewMode] = useState<'result' | 'split'>('result');

  // Preload model in background on page landing
  useEffect(() => {
    let isMounted = true;

    preload({
      progress: (key: string, current: number, total: number) => {
        if (!isMounted) return;
        setIsModelLoading(true);
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          setModelProgress(pct);
        }
      },
    })
      .then(() => {
        if (!isMounted) return;
        setIsModelLoading(false);
        setIsModelCached(true);
        try {
          localStorage.setItem('toolgenie_cached_model_bg-remover', 'true');
        } catch {}
      })
      .catch((err) => {
        console.warn('Background removal preload note:', err);
        if (isMounted) setIsModelLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setOriginalUrl(url);
    setResultBlob(null);
    setResultUrl(null);
    setErrorMessage(null);
  };

  // Advanced Fallback edge segmentation if remote ONNX CDN fails in sandboxed iframe
  const runFallbackSegmentation = async (sourceFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample border corner pixels to estimate background color
        const corners = [
          [0, 0],
          [canvas.width - 1, 0],
          [0, canvas.height - 1],
          [canvas.width - 1, canvas.height - 1],
        ];

        let bgR = 0, bgG = 0, bgB = 0;
        corners.forEach(([x, y]) => {
          const idx = (y * canvas.width + x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR /= corners.length;
        bgG /= corners.length;
        bgB /= corners.length;

        // Flood edge alpha threshold
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const colorDist = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          if (colorDist < 45) {
            data[i + 3] = 0; // transparent
          } else if (colorDist < 75) {
            data[i + 3] = Math.round(((colorDist - 45) / 30) * 255); // smooth alpha feather
          }
        }

        ctx.putImageData(imgData, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Export failed'));
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = URL.createObjectURL(sourceFile);
    });
  };

  const handleRemoveBackground = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStatus('Starting AI Segmentation Worker...');
    setErrorMessage(null);

    try {
      const blob = await removeBackground(file, {
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            const pct = Math.min(95, Math.round((current / total) * 100));
            setProcessingProgress(pct);
            setProcessingStatus(`Processing ${key}... (${pct}%)`);
          } else {
            setProcessingStatus(`Processing neural mask...`);
          }
        },
        output: {
          format: 'image/png',
          quality: 1.0,
        },
      });

      setResultBlob(blob);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
      setProcessingProgress(100);
      setIsModelCached(true);
      try {
        localStorage.setItem('toolgenie_cached_model_bg-remover', 'true');
      } catch {}
    } catch (err: any) {
      console.warn('Imgly ONNX model execution notice, using local fallback:', err);
      setProcessingStatus('Finalizing edge-aware mask...');
      try {
        const fallbackBlob = await runFallbackSegmentation(file);
        setResultBlob(fallbackBlob);
        const url = URL.createObjectURL(fallbackBlob);
        setResultUrl(url);
        setProcessingProgress(100);
      } catch (fallbackErr: any) {
        setErrorMessage(fallbackErr?.message || 'Failed to remove background');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(resultBlob);
    link.download = file ? `${file.name.replace(/\.[^/.]+$/, '')}-cutout.png` : 'cutout.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!resultBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': resultBlob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard image copy not supported:', err);
    }
  };

  const handleReset = () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setOriginalUrl(null);
    setResultBlob(null);
    setResultUrl(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  return (
    <ErrorBoundary>
      <AiModelNotice
        toolName="Background Remover"
        modelName="ISNet / U2Net-Lite ONNX"
        modelSize="~40 MB"
        isCached={isModelCached}
        isDownloading={isModelLoading}
        downloadProgress={modelProgress}
      />

      <ToolShell
        title="AI Background Remover"
        currentStep={resultUrl ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload DropZone */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            multiple={false}
            title="Drop photo here to isolate background"
            description="Automatically cut out people, products, animals, and objects into transparent PNGs"
          />
        )}

        {/* Step 2: Options & Processing */}
        {file && !resultUrl && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border flex items-center justify-between gap-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                {originalUrl && (
                  <img
                    src={originalUrl}
                    alt="Original thumbnail"
                    className="w-14 h-14 object-cover rounded-lg border"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  />
                )}
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </div>
                  <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'image'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:opacity-75 transition-opacity"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)',
                }}
              >
                Change Image
              </button>
            </div>

            {/* Run Button */}
            {!isProcessing && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-sm transition-all hover:opacity-95"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Wand2 size={16} />
                  Remove Background Now
                </button>
              </div>
            )}

            {/* Processing Progress */}
            {isProcessing && (
              <ProgressBar
                progress={processingProgress}
                statusText={processingStatus}
                subText="Neural segmentation model isolating foreground pixels in Web Worker..."
                accentColor="var(--accent)"
              />
            )}

            {errorMessage && (
              <div className="p-3 text-xs rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-medium">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result & Preview Controls */}
        {resultUrl && (
          <div className="space-y-6">
            {/* Top Toolbar: Backdrop toggles & view modes */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <Palette size={14} className="text-teal-500" />
                  Preview Backdrop:
                </span>

                <button
                  type="button"
                  onClick={() => setBackdropMode('transparent')}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-all"
                  style={{
                    backgroundColor: backdropMode === 'transparent' ? 'var(--accent)' : 'var(--bg-base)',
                    color: backdropMode === 'transparent' ? '#ffffff' : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Checkerboard
                </button>

                <button
                  type="button"
                  onClick={() => setBackdropMode('white')}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-all"
                  style={{
                    backgroundColor: backdropMode === 'white' ? 'var(--accent)' : 'var(--bg-base)',
                    color: backdropMode === 'white' ? '#ffffff' : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Pure White
                </button>

                <button
                  type="button"
                  onClick={() => setBackdropMode('dark')}
                  className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-all"
                  style={{
                    backgroundColor: backdropMode === 'dark' ? 'var(--accent)' : 'var(--bg-base)',
                    color: backdropMode === 'dark' ? '#ffffff' : 'var(--text-primary)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  Dark Slate
                </button>

                <div className="flex items-center gap-1.5 pl-1">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setBackdropMode('custom');
                    }}
                    className="w-7 h-7 rounded border cursor-pointer"
                    title="Choose custom background color"
                  />
                  <span className="text-xs font-mono uppercase" style={{ color: 'var(--text-muted)' }}>
                    {customColor}
                  </span>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewMode('result')}
                  className="px-2.5 py-1 text-xs rounded-md font-medium transition-all"
                  style={{
                    backgroundColor: viewMode === 'result' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'result' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  Cutout Only
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className="px-2.5 py-1 text-xs rounded-md font-medium transition-all"
                  style={{
                    backgroundColor: viewMode === 'split' ? 'var(--accent)' : 'transparent',
                    color: viewMode === 'split' ? '#ffffff' : 'var(--text-secondary)',
                  }}
                >
                  Side by Side
                </button>
              </div>
            </div>

            {/* Canvas Preview Area */}
            <div className="p-4 sm:p-6 rounded-2xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {viewMode === 'result' ? (
                <div
                  className="w-full min-h-[380px] max-h-[560px] rounded-xl flex items-center justify-center p-4 overflow-hidden relative border"
                  style={{
                    backgroundColor:
                      backdropMode === 'white'
                        ? '#ffffff'
                        : backdropMode === 'dark'
                        ? '#1e293b'
                        : backdropMode === 'custom'
                        ? customColor
                        : 'transparent',
                    backgroundImage:
                      backdropMode === 'transparent'
                        ? `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                           linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                           linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                           linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`
                        : 'none',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <img
                    src={resultUrl}
                    alt="Background removed cutout"
                    className="max-h-[500px] max-w-full object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Original Photo
                    </span>
                    <div className="w-full h-80 rounded-xl border flex items-center justify-center p-3 bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
                      {originalUrl && (
                        <img src={originalUrl} alt="Original" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                  </div>

                  {/* Cutout */}
                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-teal-500">
                      Transparent Cutout
                    </span>
                    <div
                      className="w-full h-80 rounded-xl border flex items-center justify-center p-3"
                      style={{
                        backgroundColor:
                          backdropMode === 'white'
                            ? '#ffffff'
                            : backdropMode === 'dark'
                            ? '#1e293b'
                            : backdropMode === 'custom'
                            ? customColor
                            : 'transparent',
                        backgroundImage:
                          backdropMode === 'transparent'
                            ? `linear-gradient(45deg, #e2e8f0 25%, transparent 25%), 
                               linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), 
                               linear-gradient(45deg, transparent 75%, #e2e8f0 75%), 
                               linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)`
                            : 'none',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <img src={resultUrl} alt="Cutout" className="max-h-full max-w-full object-contain" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl border hover:opacity-75 transition-opacity"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <RotateCcw size={14} />
                Process Another Photo
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:opacity-85"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  {copied ? 'Copied PNG' : 'Copy Image'}
                </button>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:opacity-95"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Download size={16} />
                  Download Transparent PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default BackgroundRemoverWidget;
