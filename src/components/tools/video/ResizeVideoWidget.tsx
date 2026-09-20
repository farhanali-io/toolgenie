import React, { useState, useEffect, useRef } from 'react';
import { 
  Scaling, Check, Download, RefreshCw, AlertCircle, 
  Clock, XCircle, Lock, Unlock, Monitor, Smartphone
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  resizeVideo, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const ResizeVideoWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Resize Dimensions & Fit
  const [width, setWidth] = useState<number>(1280);
  const [height, setHeight] = useState<number>(720);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'fill'>('contain');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<VideoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [previewUrl, result]);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    try {
      const probe = await probeVideoFile(selected);
      setPreviewUrl(probe.previewUrl);
      setMetadata(probe.metadata);

      // Default to 720p or original width
      const origW = probe.metadata.width || 1280;
      const origH = probe.metadata.height || 720;
      setWidth(origW);
      setHeight(origH);
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video dimensions.');
    }
  };

  const handleWidthChange = (newW: number) => {
    setWidth(newW);
    if (lockAspectRatio && metadata?.aspectRatio) {
      const computedH = Math.round(newW / metadata.aspectRatio / 2) * 2;
      setHeight(Math.max(120, computedH));
    }
  };

  const handleHeightChange = (newH: number) => {
    setHeight(newH);
    if (lockAspectRatio && metadata?.aspectRatio) {
      const computedW = Math.round((newH * metadata.aspectRatio) / 2) * 2;
      setWidth(Math.max(160, computedW));
    }
  };

  const applyPreset = (targetW: number, targetH: number) => {
    setWidth(targetW);
    setHeight(targetH);
  };

  const handleResize = async () => {
    if (!file || !metadata) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Resizing video frames with hardware-accelerated MediaBunny...');

      abortControllerRef.current = new AbortController();

      const res = await resizeVideo(
        file,
        width,
        height,
        fitMode,
        'mp4',
        {
          signal: abortControllerRef.current.signal,
          onProgress: (p, msg) => {
            setProgress(p);
            setStatusMessage(msg);
          },
        }
      );

      setResult(res);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Resize error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Resizing cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to resize video.');
      }
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setMetadata(null);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
  };

  const isLargeFile = file ? file.size > 200 * 1024 * 1024 : false;
  const originalW = metadata?.width || 1280;
  const originalH = metadata?.height || 720;
  const scaleRatio = (width * height) / (originalW * originalH || 1);
  const estimatedSize = file ? Math.round(file.size * Math.min(1.5, Math.max(0.2, scaleRatio))) : 0;

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Resize Video" isVideo requireWebCodecs />

      <ToolShell
        title="Resize Video"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video here to resize resolution"
            description="Upscale or downscale video dimensions directly on your GPU using WebCodecs"
          />
        )}

        {/* Step 2: Configure Dimensions */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* Info header */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <p className="font-bold truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Current: {originalW}×{originalH} • {formatAudioDuration(metadata.duration)} • {formatAudioBytes(file.size)}
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-lg border font-mono font-semibold" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                Target: {width}×{height} (Est. ~{formatAudioBytes(estimatedSize)})
              </div>
            </div>

            {/* Presets Grid */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-2">
                <span className="font-bold text-xs sm:text-sm block" style={{ color: 'var(--text-primary)' }}>
                  Resolution Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { label: '1080p Full HD', w: 1920, h: 1080, icon: Monitor },
                    { label: '720p HD', w: 1280, h: 720, icon: Monitor },
                    { label: '480p SD', w: 854, h: 480, icon: Monitor },
                    { label: '360p Mobile', w: 640, h: 360, icon: Smartphone },
                    { label: '9:16 Shorts/Reels', w: 1080, h: 1920, icon: Smartphone },
                    { label: '1:1 Square Feed', w: 1080, h: 1080, icon: Monitor },
                    { label: 'Original Size', w: originalW, h: originalH, icon: Monitor },
                    { label: 'Half Dimensions', w: Math.round(originalW / 4) * 2, h: Math.round(originalH / 4) * 2, icon: Monitor },
                  ].map((preset) => {
                    const isSelected = width === preset.w && height === preset.h;
                    return (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset.w, preset.h)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-cyan-500/5 shadow-xs'
                            : 'hover:border-black/20 dark:hover:border-white/20'
                        }`}
                        style={{
                          borderColor: isSelected ? '#06b6d4' : 'var(--border-subtle)',
                          backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.05)' : 'var(--bg-surface)',
                        }}
                      >
                        <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{preset.label}</p>
                        <p className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5">{preset.w}×{preset.h}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Width & Height Inputs */}
              <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Custom Dimensions:
                  </span>
                  <button
                    onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    className="text-xs flex items-center gap-1 font-semibold px-2 py-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    style={{ color: lockAspectRatio ? '#06b6d4' : 'var(--text-muted)' }}
                  >
                    {lockAspectRatio ? <Lock size={12} /> : <Unlock size={12} />}
                    <span>{lockAspectRatio ? 'Aspect Ratio Locked' : 'Aspect Ratio Unlocked'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Width (px)</span>
                    <input
                      type="number"
                      min={160}
                      max={3840}
                      step={2}
                      value={width}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 160)}
                      className="w-full bg-transparent font-mono text-sm font-bold border-b focus:outline-none focus:border-cyan-500 py-1"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>

                  <div className="p-3 rounded-xl border space-y-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Height (px)</span>
                    <input
                      type="number"
                      min={120}
                      max={2160}
                      step={2}
                      value={height}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 120)}
                      className="w-full bg-transparent font-mono text-sm font-bold border-b focus:outline-none focus:border-cyan-500 py-1"
                      style={{ color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
                    />
                  </div>
                </div>
              </div>

              {/* Fit Mode */}
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Fit Algorithm:
                </span>
                <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  {[
                    { id: 'contain', label: 'Contain (Preserve ratio)' },
                    { id: 'cover', label: 'Cover (Crop center)' },
                    { id: 'fill', label: 'Fill (Stretch)' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setFitMode(mode.id as any)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        fitMode === mode.id ? 'bg-cyan-500 text-white shadow-xs' : ''
                      }`}
                      style={{ color: fitMode === mode.id ? '#ffffff' : 'var(--text-secondary)' }}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleResize}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <Scaling size={16} />
                  <span>Resize Video ({width}×{height})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Progress */}
        {isProcessing && (
          <div className="space-y-4">
            {isLargeFile && (
              <div className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Clock size={16} className="shrink-0" />
                <span>Processing on your device. May take a moment for large files.</span>
              </div>
            )}

            <ProgressBar
              progress={progress}
              statusText={statusMessage || 'Encoding resized video frames...'}
              subText="Hardware accelerated WebCodecs transformation pipeline"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download */}
        {result && (
          <div 
            className="p-6 sm:p-8 rounded-2xl border flex flex-col items-center text-center gap-6 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Check size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Video Resized Successfully!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Output rendered to {result.width}×{result.height}.
              </p>
            </div>

            {/* Video Player Preview */}
            <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden border bg-black shadow-inner" style={{ borderColor: 'var(--border-subtle)' }}>
              <video
                src={result.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-3.5 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Resolution: </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {result.width}×{result.height}
                </span>
                <span style={{ color: 'var(--text-muted)' }}> (from {originalW}×{originalH})</span>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Size: </span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {formatAudioBytes(result.size)}
                </span>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={result.url}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}-${result.width}x${result.height}.${result.format}`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download Resized Video ({formatAudioBytes(result.size)})</span>
              </a>

              <button
                onClick={handleReset}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <RefreshCw size={14} />
                <span>Resize Another Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Resize Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default ResizeVideoWidget;
