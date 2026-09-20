import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Check, Download, RefreshCw, AlertCircle, 
  Clock, XCircle, FileAudio, Play, Pause, Volume2
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  probeVideoFile, 
  extractAudioFromVideo, 
  VideoMetadata, 
  VideoResult 
} from '../../../utils/videoEngine';
import { formatAudioDuration, formatAudioBytes } from '../../../utils/audioHelpers';

export const ExtractAudioWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  // Audio Extraction Options
  const [targetFormat, setTargetFormat] = useState<'mp3' | 'wav'>('mp3');
  const [bitrateKbps, setBitrateKbps] = useState<number>(192);

  // Audio Player State for Result
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<VideoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (result?.url) URL.revokeObjectURL(result.url);
    };
  }, [result]);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
    setIsPlaying(false);

    try {
      const probe = await probeVideoFile(selected);
      setMetadata(probe.metadata);
      if (!probe.metadata.hasAudio) {
        setErrorMessage('Warning: No detectable audio track was found in this video file.');
      }
    } catch (err: any) {
      console.error('Error probing video file:', err);
      setErrorMessage(err.message || 'Failed to inspect video tracks.');
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProgress(5);
      setStatusMessage('Extracting and encoding audio stream with MediaBunny...');

      abortControllerRef.current = new AbortController();

      const res = await extractAudioFromVideo(
        file,
        targetFormat,
        bitrateKbps,
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
      console.error('Extraction error:', err);
      if (err.name === 'ConversionCanceledError' || err.message?.includes('cancel')) {
        setStatusMessage('Audio extraction cancelled.');
      } else {
        setErrorMessage(err.message || 'Failed to extract audio track.');
      }
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleReset = () => {
    setFile(null);
    setMetadata(null);
    if (result?.url) URL.revokeObjectURL(result.url);
    setResult(null);
    setErrorMessage(null);
    setProgress(0);
    setIsPlaying(false);
  };

  const isLargeFile = file ? file.size > 200 * 1024 * 1024 : false;

  return (
    <ErrorBoundary>
      <BrowserCapabilityNotice toolName="Extract Audio" isVideo requireWebCodecs />

      <ToolShell
        title="Extract Audio"
        currentStep={result ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: Upload */}
        {!file && (
          <DropZone
            onFilesSelected={handleFileSelected}
            accept="video/*,.mp4,.webm,.mov,.mkv,.avi,.m4v"
            multiple={false}
            title="Drop video here to extract audio"
            description="Rip MP3 or lossless WAV audio track directly in your browser"
          />
        )}

        {/* Step 2: Settings */}
        {file && !isProcessing && !result && metadata && (
          <div className="space-y-6">
            {/* File info card */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                  <Volume2 size={20} />
                </div>
                <div>
                  <p className="font-bold truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    Duration: {formatAudioDuration(metadata.duration)} • Audio Track: {metadata.audioCodec?.toUpperCase() || 'Detected'}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-lg border font-mono font-semibold" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
                {formatAudioBytes(file.size)}
              </div>
            </div>

            {/* Options Card */}
            <div 
              className="p-5 sm:p-6 rounded-2xl border space-y-5"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="space-y-3">
                <span className="font-bold text-xs sm:text-sm block" style={{ color: 'var(--text-primary)' }}>
                  Choose Audio Target Format:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      format: 'mp3',
                      title: 'MP3 Audio',
                      badge: 'Universal Compatibility',
                      desc: 'Compact file size, compatible with all mobile devices, players, and editing suites.',
                    },
                    {
                      format: 'wav',
                      title: 'Lossless WAV',
                      badge: 'Studio Quality (16-bit PCM)',
                      desc: 'Uncompressed audio samples with zero quality loss, perfect for professional production.',
                    },
                  ].map((f) => (
                    <button
                      key={f.format}
                      onClick={() => setTargetFormat(f.format as any)}
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
                          {f.title}
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

              {/* Bitrate Selector for MP3 */}
              {targetFormat === 'mp3' && (
                <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      MP3 Bitrate Quality:
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-600">{bitrateKbps} kbps</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { kbps: 128, label: '128 kbps (Standard)' },
                      { kbps: 192, label: '192 kbps (High)' },
                      { kbps: 256, label: '256 kbps (Premium)' },
                      { kbps: 320, label: '320 kbps (Studio)' },
                    ].map((b) => (
                      <button
                        key={b.kbps}
                        onClick={() => setBitrateKbps(b.kbps)}
                        className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                          bitrateKbps === b.kbps
                            ? 'bg-cyan-500 text-white shadow-xs'
                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        style={{
                          borderColor: bitrateKbps === b.kbps ? '#06b6d4' : 'var(--border-subtle)',
                          color: bitrateKbps === b.kbps ? '#ffffff' : 'var(--text-secondary)',
                          backgroundColor: bitrateKbps === b.kbps ? '#06b6d4' : 'var(--bg-surface)',
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleExtract}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 text-white shadow-md hover:brightness-105 active:scale-98 transition-all"
                  style={{ backgroundColor: '#06b6d4' }}
                >
                  <Music size={16} />
                  <span>Extract Audio ({targetFormat.toUpperCase()})</span>
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
              statusText={statusMessage || 'Extracting audio samples with MediaBunny...'}
              subText="100% Client-side WebCodecs audio demuxing"
              accentColor="#06b6d4"
            />

            <div className="flex justify-center pt-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-rose-500 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle size={14} />
                <span>Cancel Extraction</span>
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
                Audio Extracted Successfully!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Isolated audio track converted to standalone {result.format.toUpperCase()} file.
              </p>
            </div>

            {/* Audio Player Card */}
            <div className="w-full max-w-md p-4 rounded-xl border flex items-center gap-4 shadow-sm" style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-surface)' }}>
              <button
                onClick={togglePlayAudio}
                className="w-12 h-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md hover:brightness-105 active:scale-95 transition-all shrink-0"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
              </button>
              <div className="flex-1 text-left min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {file?.name.replace(/\.[^/.]+$/, '')}.{result.format}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {formatAudioBytes(result.size)} • {targetFormat.toUpperCase()} Audio
                </p>
              </div>

              <audio
                ref={audioRef}
                src={result.url}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
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
                <span>Download Audio Track ({formatAudioBytes(result.size)})</span>
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
                <span>Extract Another Audio Track</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-4 rounded-xl border bg-rose-500/10 border-rose-500/20 text-xs sm:text-sm text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold mb-0.5">Audio Extraction Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default ExtractAudioWidget;
