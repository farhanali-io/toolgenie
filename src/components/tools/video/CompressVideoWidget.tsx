import React, { useState, useEffect, useRef } from 'react';
import { 
  Minimize2, Check, Download, RefreshCw, AlertCircle, 
  Clock, XCircle, Sparkles, Sliders, ArrowRight
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  compressVideo, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const CompressVideoWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Compression options
  const [mode, setMode] = useState<'preset' | 'target_size' | 'bitrate'>('preset');
  const [qualityPreset, setQualityPreset] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetSizeMb, setTargetSizeMb] = useState<number>(10);
  const [customBitrateKbps, setCustomBitrateKbps] = useState<number>(2000);
  const [resolutionScale, setResolutionScale] = useState<number>(1.0);

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

      // Estimate initial target size as 50% of original
      const currentMb = selected.size / (1024 * 1024);
      setTargetSizeMb(Math.max(1, Math.round(currentMb * 0.5)));
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video track.');
    }
  };

  const handleCompress = async () => {
    if (!file || !metadata) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Starting hardware-accelerated MediaBunny compressor...');

      abortControllerRef.current = new AbortController();

      let targetBitrate: number | undefined = undefined;

      if (mode === 'target_size') {
        const dur = metadata.duration || 10;
        // targetSizeMb in bits divided by duration
        const totalBits = targetSizeMb * 8 * 1024 * 1024;
        // Subtract 128 kbps for audio
        targetBitrate = Math.max(200_000, Math.round((totalBits / dur) - 128_000));
      } else if (mode === 'bitrate') {
        targetBitrate = customBitrateKbps * 1000;
      }

      const res = await compressVideo(
        file,
        {
          qualityPreset: mode === 'preset' ? qualityPreset : undefined,
          targetBitrate,
          resolutionScale,
          originalWidth: metadata.width,
          originalHeight: metadata.height,
        },
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
      console.error('Compression error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Compression cancelled by user.');
      } else {
        setErrorMessage(err.message || 'Failed to compress video.');
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
  const originalSize = file?.size || 0;
  const compressedSize = result?.size || 0;
  const savingsPct = originalSize > 0 && compressedSize > 0 
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
    : 0;

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Video Compressor" isVideo requireWebCodecs />

      <ToolShell
        title="Video Compressor"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video here to compress"
            description="Hardware-accelerated client-side compression (10-20x faster than WebAssembly)"
          />
        )}

        {/* Step 2: Settings */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* Source Info Bar */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                  MP4
                </div>
                <div>
                  <p className="font-bold truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {metadata.width}×{metadata.height} • {formatAudioDuration(metadata.duration)} • {metadata.videoCodec?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg border font-mono font-semibold" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                Original: {formatAudioBytes(file.size)}
              </div>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl p-1 border" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
              {[
                { id: 'preset', label: 'Preset Quality' },
                { id: 'target_size', label: 'Target File Size' },
                { id: 'bitrate', label: 'Custom Bitrate' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMode(tab.id as any)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === tab.id
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={{ color: mode === tab.id ? '#ffffff' : 'var(--text-secondary)' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mode Controls Card */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Preset Cards */}
              {mode === 'preset' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    Select Compression Profile:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'low',
                        title: 'Maximum Savings',
                        badge: '~70-85% smaller',
                        desc: 'Great for email, messaging apps, and rapid uploads.',
                      },
                      {
                        id: 'medium',
                        title: 'Balanced (Recommended)',
                        badge: '~45-60% smaller',
                        desc: 'Best balance between crisp visual quality and compact size.',
                      },
                      {
                        id: 'high',
                        title: 'Light Compression',
                        badge: '~20-35% smaller',
                        desc: 'Preserves near-lossless clarity for high-def archiving.',
                      },
                    ].map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setQualityPreset(p.id as any)}
                        className={`p-4 rounded-xl border text-left transition-all relative ${
                          qualityPreset === p.id
                            ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                            : 'hover:border-black/20 dark:hover:border-white/20'
                        }`}
                        style={{
                          backgroundColor: qualityPreset === p.id ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-surface)',
                          borderColor: qualityPreset === p.id ? '#06b6d4' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                            {p.title}
                          </span>
                        </div>
                        <span className="inline-block text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
                          {p.badge}
                        </span>
                        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {p.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Target File Size Input */}
              {mode === 'target_size' && (
                <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-primary)' }}>Desired Target File Size</span>
                    <span className="font-mono text-cyan-600 font-bold">{targetSizeMb} MB</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(10, Math.round(file.size / (1024 * 1024)))}
                    step={1}
                    value={targetSizeMb}
                    onChange={(e) => setTargetSizeMb(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    MediaBunny dynamically calculates the optimal video bitrate for your video duration ({formatAudioDuration(metadata.duration)}).
                  </p>
                </div>
              )}

              {/* Custom Bitrate Slider */}
              {mode === 'bitrate' && (
                <div className="p-4 rounded-xl border space-y-3" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-primary)' }}>Video Bitrate</span>
                    <span className="font-mono text-cyan-600 font-bold">{customBitrateKbps} kbps</span>
                  </div>
                  <input
                    type="range"
                    min={400}
                    max={8000}
                    step={100}
                    value={customBitrateKbps}
                    onChange={(e) => setCustomBitrateKbps(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>400 kbps (Small)</span>
                    <span>2500 kbps (1080p Web)</span>
                    <span>8000 kbps (High Fidelity)</span>
                  </div>
                </div>
              )}

              {/* Resolution Scaling Toggle */}
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <Sliders size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Resolution Scaling:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Original (100%)', scale: 1.0 },
                    { label: '75%', scale: 0.75 },
                    { label: '50% (Mobile)', scale: 0.5 },
                  ].map((s) => (
                    <button
                      key={s.scale}
                      onClick={() => setResolutionScale(s.scale)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: resolutionScale === s.scale ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                        borderColor: resolutionScale === s.scale ? '#06b6d4' : 'var(--border-subtle)',
                        color: resolutionScale === s.scale ? '#06b6d4' : 'var(--text-secondary)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCompress}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <Minimize2 size={16} />
                  <span>Compress Video</span>
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
              statusText={statusMessage || 'Encoding compressed video frames...'}
              subText="MediaBunny WebCodecs hardware accelerated engine"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel Compression</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download & Comparison */}
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
                Compression Complete!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Reduced file size while maintaining pristine video clarity.
              </p>
            </div>

            {/* Before vs After Card */}
            <div 
              className="w-full max-w-md p-4 rounded-xl border flex items-center justify-around gap-4"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Before</p>
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {formatAudioBytes(originalSize)}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowRight size={18} className="text-cyan-500" />
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-1">
                  -{savingsPct}%
                </span>
              </div>

              <div className="text-center">
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>After</p>
                <p className="font-bold text-sm text-cyan-600 dark:text-cyan-400">
                  {formatAudioBytes(result.size)}
                </p>
              </div>
            </div>

            {/* Preview Player */}
            <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden border bg-black shadow-inner" style={{ borderColor: 'var(--border-subtle)' }}>
              <video
                src={result.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={result.url}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}-compressed.${result.format}`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download Compressed Video ({formatAudioBytes(result.size)})</span>
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
                <span>Compress Another Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Compression Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default CompressVideoWidget;
