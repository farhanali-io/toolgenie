import React, { useState, useEffect, useRef } from 'react';
import { 
  Scissors, Play, Pause, Download, RefreshCw, Film, 
  Clock, AlertCircle, Sparkles, XCircle, Check
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  trimVideo, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const TrimVideoWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Cue controls
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [outputFormat, setOutputFormat] = useState<string>('mp4');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<VideoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup URLs on unmount
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

      const dur = probe.metadata.duration || 10;
      setStartTime(0);
      // Default to 15s or full duration if shorter
      setEndTime(Math.min(dur, Math.max(1, dur > 15 ? 15 : dur)));
      setCurrentTime(0);
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video track metadata.');
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Loop back if previewing and reaching selection end
    if (isPlaying && curr >= endTime) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play().catch(() => {});
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleStartChange = (val: number) => {
    const clamped = Math.max(0, Math.min(val, endTime - 0.1));
    setStartTime(clamped);
    handleSeek(clamped);
  };

  const handleEndChange = (val: number) => {
    const total = metadata?.duration || 100;
    const clamped = Math.min(total, Math.max(startTime + 0.1, val));
    setEndTime(clamped);
  };

  const setStartToCurrent = () => {
    if (currentTime < endTime) {
      setStartTime(currentTime);
    }
  };

  const setEndToCurrent = () => {
    if (currentTime > startTime) {
      setEndTime(currentTime);
    }
  };

  const handleTrim = async () => {
    if (!file || !metadata) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Initializing hardware-accelerated MediaBunny trim...');

      abortControllerRef.current = new AbortController();

      const res = await trimVideo(file, startTime, endTime, outputFormat, {
        signal: abortControllerRef.current.signal,
        onProgress: (p, msg) => {
          setProgress(p);
          setStatusMessage(msg);
        },
      });

      setResult(res);
      setIsProcessing(false);
    } catch (err: any) {
      console.error('Trim error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Trimming cancelled by user.');
      } else {
        setErrorMessage(err.message || 'Failed to trim video.');
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
    setIsPlaying(false);
  };

  const duration = metadata?.duration || 0;
  const clipDuration = Math.max(0, endTime - startTime);
  const isLargeFile = file ? file.size > 200 * 1024 * 1024 : false;

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Video Trimmer" isVideo requireWebCodecs />

      <ToolShell
        title="Video Trimmer"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drag and drop a video clip here"
            description="Trim MP4, WebM, MOV, and MKV with microsecond precision right in your browser"
          />
        )}

        {/* Step 2: Configure & Scrub */}
        {file && !isProcessing && !result && (
          <div className="space-y-6">
            {/* Video Preview Player */}
            <div 
              className="relative rounded-2xl overflow-hidden border aspect-video bg-black flex items-center justify-center group"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {previewUrl && (
                <video
                  ref={videoRef}
                  src={previewUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  playsInline
                />
              )}

              {/* Center Play/Pause Overlay Button */}
              <button
                onClick={togglePlayPause}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-110 active:scale-95 hover:bg-black/80"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
              </button>

              {/* Time Indicator HUD */}
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-md text-white text-xs font-mono">
                {formatAudioDuration(currentTime, true)} / {formatAudioDuration(duration, true)}
              </div>
            </div>

            {/* Range Scrubber Card */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film size={18} style={{ color: '#06b6d4' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Trim Boundaries & Selection
                  </span>
                </div>
                <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold">
                  Clip: {formatAudioDuration(clipDuration, true)}
                </div>
              </div>

              {/* Start & End Dual Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Cue */}
                <div className="p-3.5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Start Time
                    </span>
                    <button
                      onClick={setStartToCurrent}
                      className="text-cyan-600 hover:underline font-medium"
                    >
                      Use Current ({formatAudioDuration(currentTime)})
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 10}
                    step={0.05}
                    value={startTime}
                    onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span>0:00</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {formatAudioDuration(startTime, true)}
                    </span>
                  </div>
                </div>

                {/* End Cue */}
                <div className="p-3.5 rounded-xl border space-y-2" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      End Time
                    </span>
                    <button
                      onClick={setEndToCurrent}
                      className="text-cyan-600 hover:underline font-medium"
                    >
                      Use Current ({formatAudioDuration(currentTime)})
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 10}
                    step={0.05}
                    value={endTime}
                    onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">
                      {formatAudioDuration(endTime, true)}
                    </span>
                    <span>{formatAudioDuration(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Range Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-medium mr-1" style={{ color: 'var(--text-secondary)' }}>
                  Quick ranges:
                </span>
                {[
                  { label: 'First 15s', s: 0, e: 15 },
                  { label: 'First 30s', s: 0, e: 30 },
                  { label: 'First 60s', s: 0, e: 60 },
                  { label: 'Last 30s', s: Math.max(0, duration - 30), e: duration },
                  { label: 'Full Video', s: 0, e: duration },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      setStartTime(preset.s);
                      setEndTime(Math.min(duration, preset.e));
                      handleSeek(preset.s);
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Options & Output Format */}
              <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Output Container:
                  </span>
                  <select
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border bg-transparent"
                    style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <option value="mp4">MP4 (Universal Video)</option>
                    <option value="webm">WebM (VP9/Opus)</option>
                    <option value="mkv">MKV (Matroska)</option>
                    <option value="mov">MOV (QuickTime)</option>
                  </select>
                </div>

                {isLargeFile && (
                  <p className="text-xs text-amber-500 font-medium">
                    ⚡ File &gt;200 MB: Processing occurs directly on your device with native GPU acceleration.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={togglePlayPause}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{isPlaying ? 'Pause Preview' : 'Audition Selection'}</span>
                </button>

                <button
                  onClick={handleTrim}
                  disabled={clipDuration <= 0}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <Scissors size={16} />
                  <span>Trim Video Now</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Processing & Progress */}
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
              statusText={statusMessage || 'Trimming media packets with MediaBunny...'}
              subText="100% Client-side WebCodecs pipeline — no remote uploads"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel Trimming</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Download Screen */}
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
                Your Video is Trimmed & Ready!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Processed client-side with microsecond precision.
              </p>
            </div>

            {/* Result Video Player */}
            <div className="w-full max-w-lg aspect-video rounded-xl overflow-hidden border bg-black shadow-inner" style={{ borderColor: 'var(--border-subtle)' }}>
              <video
                src={result.url}
                controls
                className="w-full h-full object-contain"
              />
            </div>

            {/* Metrics Breakdown */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <div className="px-3.5 py-1.5 rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  {formatAudioDuration(clipDuration, true)}
                </span>
                <span style={{ color: 'var(--text-muted)' }}> (from {formatAudioDuration(duration)})</span>
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
                download={`${file?.name.replace(/\.[^/.]+$/, '')}-trimmed.${result.format}`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                style={{ backgroundColor: '#06b6d4' }}
              >
                <Download size={18} />
                <span>Download Trimmed Video ({formatAudioBytes(result.size)})</span>
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
                <span>Trim Another Clip</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Trimming Operation Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default TrimVideoWidget;
