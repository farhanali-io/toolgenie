import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Check, Download, RefreshCw, AlertCircle, 
  Image as ImageIcon, Clock, XCircle, Sliders, Play, Pause
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  convertVideoToGif, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const VideoToGifWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Time range & settings
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(5);
  const [fps, setFps] = useState<number>(15);
  const [targetWidth, setTargetWidth] = useState<number>(480);
  const [maxColors, setMaxColors] = useState<number>(256);

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

      const dur = probe.metadata.duration || 5;
      setStartTime(0);
      // Recommend first 5-8 seconds for optimal GIF performance and size
      setEndTime(Math.min(dur, Math.max(1, dur > 6 ? 6 : dur)));
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video track.');
    }
  };

  const handleGenerateGif = async () => {
    if (!file || !metadata) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Extracting video frames to canvas buffer...');

      abortControllerRef.current = new AbortController();

      const res = await convertVideoToGif(
        file,
        {
          startSec: startTime,
          endSec: endTime,
          fps,
          width: targetWidth,
          maxColors,
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
      console.error('GIF generation error:', err);
      if (err.message?.includes('cancelled')) {
        setStatusMessage('GIF export cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to generate GIF.');
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

  const duration = metadata?.duration || 0;
  const gifDuration = Math.max(0, endTime - startTime);
  const estimatedFrames = Math.round(gifDuration * fps);

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Video to GIF" isVideo />

      <ToolShell
        title="Video to GIF"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video to turn into animated GIF"
            description="Client-side frame extraction and high-quality color quantization"
          />
        )}

        {/* Step 2: Configure GIF options */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* Video preview mini-player */}
            <div className="rounded-xl overflow-hidden border aspect-video max-h-56 bg-black mx-auto" style={{ borderColor: 'var(--border-subtle)' }}>
              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                />
              )}
            </div>

            {/* Options Card */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Range controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>
                    Trim GIF Range ({formatAudioDuration(gifDuration, true)} • ~{estimatedFrames} frames)
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Keep under 10s for best file size
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span style={{ color: 'var(--text-secondary)' }}>Start</span>
                      <span className="font-mono text-cyan-600">{formatAudioDuration(startTime, true)}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0.1, duration)}
                      step={0.1}
                      value={startTime}
                      onChange={(e) => setStartTime(Math.min(parseFloat(e.target.value), endTime - 0.2))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 rounded-xl border space-y-1.5" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    <div className="flex justify-between text-xs font-semibold">
                      <span style={{ color: 'var(--text-secondary)' }}>End</span>
                      <span className="font-mono text-cyan-600">{formatAudioDuration(endTime, true)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={Math.max(0.2, duration)}
                      step={0.1}
                      value={endTime}
                      onChange={(e) => setEndTime(Math.max(startTime + 0.2, parseFloat(e.target.value)))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Resolution Width Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Output Width:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { width: 320, label: '320px', desc: 'Compact / Stickers' },
                    { width: 480, label: '480px', desc: 'Standard Web' },
                    { width: 640, label: '640px', desc: 'High Definition' },
                  ].map((item) => (
                    <button
                      key={item.width}
                      onClick={() => setTargetWidth(item.width)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        targetWidth === item.width
                          ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                          : 'hover:border-black/20 dark:hover:border-white/20'
                      }`}
                      style={{
                        backgroundColor: targetWidth === item.width ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-surface)',
                        borderColor: targetWidth === item.width ? '#06b6d4' : 'var(--border-subtle)',
                      }}
                    >
                      <p className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frame Rate & Color Quality Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                {/* FPS */}
                <div>
                  <span className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    Frame Rate (FPS):
                  </span>
                  <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    {[
                      { val: 10, label: '10 FPS' },
                      { val: 15, label: '15 FPS' },
                      { val: 24, label: '24 FPS' },
                    ].map((f) => (
                      <button
                        key={f.val}
                        onClick={() => setFps(f.val)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          fps === f.val ? 'bg-cyan-500 text-white shadow-xs' : ''
                        }`}
                        style={{ color: fps === f.val ? '#ffffff' : 'var(--text-secondary)' }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <span className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    Color Quantization:
                  </span>
                  <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                    {[
                      { val: 128, label: '128 Colors' },
                      { val: 256, label: '256 Colors (Richer)' },
                    ].map((c) => (
                      <button
                        key={c.val}
                        onClick={() => setMaxColors(c.val)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                          maxColors === c.val ? 'bg-cyan-500 text-white shadow-xs' : ''
                        }`}
                        style={{ color: maxColors === c.val ? '#ffffff' : 'var(--text-secondary)' }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateGif}
                  disabled={gifDuration <= 0}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <Sparkles size={16} />
                  <span>Generate Animated GIF</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Progress */}
        {isProcessing && (
          <div className="space-y-4">
            <ProgressBar
              progress={progress}
              statusText={statusMessage || 'Rendering GIF frames with gifenc engine...'}
              subText="Extracting canvas bitmaps & computing optimal color palettes"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel Generation</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download & GIF Preview */}
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
                Animated GIF Generated!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                High-quality looping GIF ready to share or download.
              </p>
            </div>

            {/* Rendered GIF image preview */}
            <div className="max-w-md rounded-xl overflow-hidden border shadow-sm p-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
              <img
                src={result.url}
                alt="Generated Animated GIF"
                className="w-full h-auto rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Metrics */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-3.5 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Dimensions: </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {result.width}×{result.height}
                </span>
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
                download={`${file?.name.replace(/\.[^/.]+$/, '')}.gif`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download GIF ({formatAudioBytes(result.size)})</span>
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
                <span>Create Another GIF</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">GIF Creation Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default VideoToGifWidget;
