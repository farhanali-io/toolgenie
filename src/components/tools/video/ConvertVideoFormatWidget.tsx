import React, { useState, useEffect, useRef } from 'react';
import { 
  FileVideo, Check, Download, RefreshCw, AlertCircle, 
  Clock, XCircle, Zap, ShieldCheck, ArrowRight
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  convertVideoFormat, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const ConvertVideoFormatWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Target format & quality
  const [targetFormat, setTargetFormat] = useState<string>('mp4');
  const [qualityPreset, setQualityPreset] = useState<'low' | 'medium' | 'high'>('medium');

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

      // Default target format to WebM if input is MP4, or MP4 if input is WebM/MKV/MOV
      const ext = selected.name.split('.').pop()?.toLowerCase() || '';
      if (ext === 'mp4') {
        setTargetFormat('webm');
      } else {
        setTargetFormat('mp4');
      }
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video container.');
    }
  };

  const handleConvert = async () => {
    if (!file || !metadata) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Initializing MediaBunny muxing pipeline...');

      abortControllerRef.current = new AbortController();

      const res = await convertVideoFormat(
        file,
        targetFormat,
        qualityPreset,
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
      console.error('Conversion error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Conversion cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to convert video format.');
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
  const inputExt = file?.name.split('.').pop()?.toUpperCase() || 'VIDEO';

  // Check if transmuxing is likely (e.g., H.264 between MP4, MOV, MKV)
  const isLikelyTransmux = 
    (inputExt === 'MP4' && (targetFormat === 'mov' || targetFormat === 'mkv')) ||
    (inputExt === 'MOV' && (targetFormat === 'mp4' || targetFormat === 'mkv')) ||
    (inputExt === 'MKV' && targetFormat === 'mp4' && metadata?.videoCodec?.includes('h264'));

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Convert Video Format" isVideo requireWebCodecs />

      <ToolShell
        title="Convert Video Format"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video here to convert container format"
            description="Convert between MP4, WebM, MOV, and MKV with smart transmuxing & zero server uploads"
          />
        )}

        {/* Step 2: Configure Format */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* Source Info */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold text-xs">
                  {inputExt}
                </div>
                <div>
                  <p className="font-bold truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {metadata.width}×{metadata.height} • {formatAudioDuration(metadata.duration)} • Codec: {metadata.videoCodec?.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg border font-mono font-semibold" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                {formatAudioBytes(file.size)}
              </div>
            </div>

            {/* Target Container Selection */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-3">
                <span className="font-bold text-xs sm:text-sm block" style={{ color: 'var(--text-primary)' }}>
                  Select Output Container:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      format: 'mp4',
                      label: 'MP4 (MPEG-4 Part 14)',
                      badge: 'Universal Standard',
                      desc: 'Plays seamlessly on every iPhone, Android, browser, Smart TV, and social platform.',
                    },
                    {
                      format: 'webm',
                      label: 'WebM (VP9 / Opus)',
                      badge: 'Open Web Standard',
                      desc: 'Highly efficient open format engineered specifically for high-speed HTML5 video streaming.',
                    },
                    {
                      format: 'mov',
                      label: 'MOV (Apple QuickTime)',
                      badge: 'Apple Ecosystem & Pro Editing',
                      desc: 'Native container for macOS, Final Cut Pro, and QuickTime Player.',
                    },
                    {
                      format: 'mkv',
                      label: 'MKV (Matroska)',
                      badge: 'Multimedia Archival',
                      desc: 'Robust open container format supporting multiple audio streams and subtitle tracks.',
                    },
                  ].map((f) => (
                    <button
                      key={f.format}
                      onClick={() => setTargetFormat(f.format)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        targetFormat === f.format
                          ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-sm'
                          : 'hover:border-black/20 dark:hover:border-white/20'
                      }`}
                      style={{
                        backgroundColor: targetFormat === f.format ? 'rgba(6, 182, 212, 0.04)' : 'var(--bg-surface)',
                        borderColor: targetFormat === f.format ? '#06b6d4' : 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {f.label}
                        </span>
                      </div>
                      <span className="inline-block text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 mb-2">
                        {f.badge}
                      </span>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        {f.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Transmuxing Notice */}
              {isLikelyTransmux && (
                <div className="p-3.5 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-xs flex items-center gap-2.5 text-emerald-700 dark:text-emerald-400">
                  <Zap size={16} className="shrink-0" />
                  <span>
                    <strong>Instant Transmuxing available:</strong> Same underlying video codec detected. MediaBunny will copy stream packets directly with 0 re-encoding in under 2 seconds!
                  </span>
                </div>
              )}

              {/* Quality Settings */}
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Transcode Quality (if re-encoding):
                </span>
                <div className="flex rounded-lg border p-1" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  {[
                    { id: 'low', label: 'Fast / Compact' },
                    { id: 'medium', label: 'Balanced' },
                    { id: 'high', label: 'High Fidelity' },
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setQualityPreset(q.id as any)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        qualityPreset === q.id ? 'bg-cyan-500 text-white shadow-xs' : ''
                      }`}
                      style={{ color: qualityPreset === q.id ? '#ffffff' : 'var(--text-secondary)' }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConvert}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <FileVideo size={16} />
                  <span>Convert to {targetFormat.toUpperCase()}</span>
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
              statusText={statusMessage || 'Muxing video into target container format...'}
              subText="MediaBunny pure TypeScript & WebCodecs engine"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel Conversion</span>
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
                Conversion Complete!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your media file has been converted to {result.format.toUpperCase()} format.
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
                <span style={{ color: 'var(--text-muted)' }}>Format: </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {inputExt} → {result.format.toUpperCase()}
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
                download={`${file?.name.replace(/\.[^/.]+$/, '')}.${result.format}`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download {result.format.toUpperCase()} Video ({formatAudioBytes(result.size)})</span>
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
                <span>Convert Another Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Conversion Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default ConvertVideoFormatWidget;
