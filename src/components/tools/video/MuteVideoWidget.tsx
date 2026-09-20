import React, { useState, useEffect, useRef } from 'react';
import { 
  VolumeX, Check, Download, RefreshCw, AlertCircle, 
  Clock, XCircle, Zap, ShieldCheck
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  muteVideo, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const MuteVideoWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

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
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video track.');
    }
  };

  const handleMute = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(10);
      setStatusMessage('Direct packet transmuxing: stripping audio with 0 re-encoding...');

      abortControllerRef.current = new AbortController();

      const res = await muteVideo(
        file,
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
      console.error('Mute error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Muting cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to strip audio from video.');
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

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Mute Video" isVideo requireWebCodecs />

      <ToolShell
        title="Mute Video"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video to remove audio track"
            description="Instant zero-reencode audio removal — preserves exact original video frame quality"
          />
        )}

        {/* Step 2: Confirmation & Preview */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* Video preview player */}
            <div className="rounded-xl overflow-hidden border aspect-video max-h-64 bg-black mx-auto" style={{ borderColor: 'var(--border-subtle)' }}>
              {previewUrl && (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                  playsInline
                />
              )}
            </div>

            {/* Transmux High-Speed Card */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-4"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Near-Instant Zero-Loss Muting
                  </h4>
                  <p className="text-xs leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                    MediaBunny demuxes the video container, drops the audio track samples, and rewrites the container without transcoding a single video frame. Execution is typically under 1-2 seconds.
                  </p>
                </div>
              </div>

              {/* Specs pill row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="text-xs px-2.5 py-1 rounded-md border font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  File: {file.name}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md border font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  Resolution: {metadata.width}×{metadata.height}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md border font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  Duration: {formatAudioDuration(metadata.duration)}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-md border font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  Size: {formatAudioBytes(file.size)}
                </span>
              </div>

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleMute}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <VolumeX size={16} />
                  <span>Remove Audio Track</span>
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
              statusText={statusMessage || 'Stripping audio packets with MediaBunny...'}
              subText="Near-instant direct stream copy"
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

        {/* Step 4: Download & Verification */}
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
                Audio Track Removed!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Your muted video has been rendered client-side with 100% original video sample fidelity.
              </p>
            </div>

            {/* Muted Player Preview */}
            <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden border bg-black shadow-inner" style={{ borderColor: 'var(--border-subtle)' }}>
              <video
                src={result.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              <span>Output Size: </span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {formatAudioBytes(result.size)}
              </span>
              <span>• Muted Video</span>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                href={result.url}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}-muted.${result.format}`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download Muted Video ({formatAudioBytes(result.size)})</span>
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
                <span>Mute Another Video</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Mute Operation Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default MuteVideoWidget;
