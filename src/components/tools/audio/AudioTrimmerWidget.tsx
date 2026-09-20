import React, { useState, useRef, useEffect, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin, { Region } from 'wavesurfer.js/plugins/regions';
import { 
  Play, Pause, Scissors, Download, RotateCcw, Volume2, 
  VolumeX, ZoomIn, ZoomOut, Check, FileAudio, Clock, ArrowRight, Sparkles 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  decodeAudioFile, 
  audioBufferToWav, 
  formatAudioDuration, 
  formatAudioBytes 
} from '../../../utils/audioHelpers';

export const AudioTrimmerWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Playback & Waveform states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(20);
  const [isMuted, setIsMuted] = useState(false);

  // Region selection
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fadeIn, setFadeIn] = useState<number>(0);
  const [fadeOut, setFadeOut] = useState<number>(0);
  const [exportFormat, setExportFormat] = useState<'wav' | 'original'>('wav');

  // Processing & Export
  const [isProcessing, setIsProcessing] = useState(false);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null);
  const [trimmedDuration, setTrimmedDuration] = useState<number>(0);

  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const regionsPluginRef = useRef<RegionsPlugin | null>(null);
  const activeRegionRef = useRef<Region | null>(null);
  const isPlayingSelectionOnly = useRef<boolean>(false);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [audioUrl, trimmedUrl]);

  // Load selected file
  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setTrimmedBlob(null);
    if (trimmedUrl) {
      URL.revokeObjectURL(trimmedUrl);
      setTrimmedUrl(null);
    }

    const url = URL.createObjectURL(selected);
    setAudioUrl(url);

    try {
      setIsProcessing(true);
      const decoded = await decodeAudioFile(selected);
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      
      const defaultStart = 0;
      const defaultEnd = Math.min(decoded.duration, 30);
      setStartTime(defaultStart);
      setEndTime(defaultEnd);
      setIsProcessing(false);
    } catch (err) {
      console.error('Failed to decode audio file:', err);
      setIsProcessing(false);
    }
  };

  // Initialize WaveSurfer with Regions Plugin
  useEffect(() => {
    if (!audioUrl || !waveformContainerRef.current) return;

    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: waveformContainerRef.current,
      waveColor: 'rgba(6, 182, 212, 0.4)',
      progressColor: '#06b6d4',
      cursorColor: '#0891b2',
      cursorWidth: 2,
      height: 96,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      minPxPerSec: zoomLevel,
      url: audioUrl,
    });

    const regions = ws.registerPlugin(RegionsPlugin.create());
    regionsPluginRef.current = regions;
    wavesurferRef.current = ws;

    ws.on('ready', () => {
      const dur = ws.getDuration();
      setDuration(dur);
      
      // Add initial region
      const initialEnd = Math.min(dur, 30);
      setStartTime(0);
      setEndTime(initialEnd);

      regions.clearRegions();
      const reg = regions.addRegion({
        start: 0,
        end: initialEnd,
        color: 'rgba(6, 182, 212, 0.25)',
        drag: true,
        resize: true,
      });
      activeRegionRef.current = reg;
    });

    ws.on('audioprocess', (time) => {
      setCurrentTime(time);
      if (isPlayingSelectionOnly.current && activeRegionRef.current) {
        if (time >= activeRegionRef.current.end) {
          ws.pause();
          isPlayingSelectionOnly.current = false;
          setIsPlaying(false);
        }
      }
    });

    ws.on('finish', () => {
      setIsPlaying(false);
      isPlayingSelectionOnly.current = false;
    });

    regions.on('region-updated', (region) => {
      activeRegionRef.current = region;
      setStartTime(parseFloat(region.start.toFixed(2)));
      setEndTime(parseFloat(region.end.toFixed(2)));
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
    };
  }, [audioUrl]);

  // Adjust zoom
  const handleZoomChange = (newZoom: number) => {
    setZoomLevel(newZoom);
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom);
    }
  };

  // Update region from numeric inputs
  const updateRegionTimes = (newStart: number, newEnd: number) => {
    if (!wavesurferRef.current || !regionsPluginRef.current || duration === 0) return;
    const safeStart = Math.max(0, Math.min(newStart, duration - 0.1));
    const safeEnd = Math.min(duration, Math.max(safeStart + 0.1, newEnd));

    setStartTime(parseFloat(safeStart.toFixed(2)));
    setEndTime(parseFloat(safeEnd.toFixed(2)));

    if (activeRegionRef.current) {
      activeRegionRef.current.setOptions({
        start: safeStart,
        end: safeEnd,
      });
    }
  };

  // Play / Pause full track
  const togglePlay = () => {
    if (!wavesurferRef.current) return;
    isPlayingSelectionOnly.current = false;
    if (isPlaying) {
      wavesurferRef.current.pause();
      setIsPlaying(false);
    } else {
      wavesurferRef.current.play();
      setIsPlaying(true);
    }
  };

  // Preview selection only
  const previewSelection = () => {
    if (!wavesurferRef.current || !activeRegionRef.current) return;
    isPlayingSelectionOnly.current = true;
    wavesurferRef.current.setTime(activeRegionRef.current.start);
    wavesurferRef.current.play();
    setIsPlaying(true);
  };

  // Toggle mute
  const toggleMute = () => {
    if (!wavesurferRef.current) return;
    const nextMuted = !isMuted;
    wavesurferRef.current.setMuted(nextMuted);
    setIsMuted(nextMuted);
  };

  // Process and trim audio
  const handleTrimAudio = async () => {
    if (!file || !audioBuffer) return;

    try {
      setIsProcessing(true);
      const clipDuration = Math.max(0.1, endTime - startTime);
      setTrimmedDuration(clipDuration);

      // Perform instant Web Audio buffer slicing + WAV generation
      const wavBlob = audioBufferToWav(audioBuffer, startTime, endTime, fadeIn, fadeOut);
      
      setTrimmedBlob(wavBlob);
      if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
      const newUrl = URL.createObjectURL(wavBlob);
      setTrimmedUrl(newUrl);

      setIsProcessing(false);
    } catch (err) {
      console.error('Error trimming audio buffer:', err);
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }
    setFile(null);
    setAudioUrl(null);
    setAudioBuffer(null);
    setTrimmedBlob(null);
    setTrimmedUrl(null);
    setDuration(0);
    setStartTime(0);
    setEndTime(0);
    setIsPlaying(false);
  };

  const selectedDuration = Math.max(0, endTime - startTime);

  // Step state for ToolShell
  const currentStep = !file 
    ? 'dropzone' 
    : isProcessing 
    ? 'progress' 
    : trimmedBlob 
    ? 'download' 
    : 'options';

  return (
    <ErrorBoundary fallbackTitle="Audio Trimmer Failed" onReset={handleReset}>
      <BrowserCapabilityNotice toolName="Audio Trimmer" />

      <ToolShell
        currentStep={currentStep}
        accentColor="#06b6d4"
        onReset={handleReset}
        title="Interactive Audio Trimmer"
      >
        {/* Step 1: File Drop Zone */}
        {!file && (
          <DropZone
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
            onFilesSelected={handleFileSelected}
            title="Drag & Drop Audio Track to Trim"
            description="Supports MP3, WAV, M4A, OGG, AAC, and FLAC (instant client-side processing)"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 2 & 3: Waveform Visualizer & Trimming Options */}
        {file && !trimmedBlob && (
          <div className="flex flex-col gap-6">
            {/* File Info Bar */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2">
                <FileAudio size={18} className="text-cyan-500" />
                <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </span>
                <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
                  ({formatAudioBytes(file.size)})
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                  <Clock size={14} />
                  <span>Total Duration:</span>
                  <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatAudioDuration(duration, true)}
                  </span>
                </div>
              </div>
            </div>

            {/* Waveform Card */}
            <div 
              className="p-6 rounded-2xl border flex flex-col gap-4 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between text-xs pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Interactive Audio Waveform
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Drag blue selection boundary or handles to adjust trim cut
                </span>
              </div>

              {/* WaveSurfer rendering container */}
              <div 
                ref={waveformContainerRef} 
                className="w-full rounded-xl overflow-hidden cursor-pointer"
                style={{ backgroundColor: 'var(--bg-surface)' }}
              />

              {/* Waveform Playback & Zoom Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="p-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all shadow-sm"
                    style={{
                      backgroundColor: isPlaying ? 'var(--bg-surface)' : '#06b6d4',
                      color: isPlaying ? 'var(--text-primary)' : '#ffffff',
                      border: isPlaying ? '1px solid var(--border-subtle)' : 'none',
                    }}
                    title={isPlaying ? 'Pause' : 'Play Track'}
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={previewSelection}
                    className="px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-xs border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                    title="Play strictly between selected markers"
                  >
                    <Scissors size={14} className="text-cyan-500" />
                    <span>Preview Selection</span>
                  </button>

                  <button
                    onClick={toggleMute}
                    className="p-2.5 rounded-xl border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: isMuted ? '#ef4444' : 'var(--text-secondary)',
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>

                {/* Playhead Timestamp */}
                <div className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatAudioDuration(currentTime, true)}
                  </span>
                  {' / '}
                  <span>{formatAudioDuration(duration, true)}</span>
                </div>

                {/* Zoom Controller */}
                <div className="flex items-center gap-2">
                  <ZoomOut size={14} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="range"
                    min="10"
                    max="150"
                    value={zoomLevel}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    className="w-24 accent-cyan-500 cursor-pointer"
                    title="Zoom waveform"
                  />
                  <ZoomIn size={14} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            </div>

            {/* Precision Cue Points & Fade Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Start Cue */}
              <div 
                className="p-4 rounded-xl border flex flex-col gap-2"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Start Time (seconds)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max={Math.max(0, endTime - 0.1)}
                    value={startTime}
                    onChange={(e) => updateRegionTimes(parseFloat(e.target.value) || 0, endTime)}
                    className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatAudioDuration(startTime, true)}
                  </span>
                </div>
              </div>

              {/* End Cue */}
              <div 
                className="p-4 rounded-xl border flex flex-col gap-2"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  End Time (seconds)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min={startTime + 0.1}
                    max={duration}
                    value={endTime}
                    onChange={(e) => updateRegionTimes(startTime, parseFloat(e.target.value) || duration)}
                    className="w-full px-3 py-2 rounded-lg border font-mono text-sm"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {formatAudioDuration(endTime, true)}
                  </span>
                </div>
              </div>

              {/* Selection Summary (Before vs After) */}
              <div 
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  backgroundColor: 'rgba(6, 182, 212, 0.05)',
                  borderColor: 'rgba(6, 182, 212, 0.25)',
                }}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>Trimmed Duration:</span>
                  <span className="font-mono font-bold text-sm text-cyan-600 dark:text-cyan-400">
                    {formatAudioDuration(selectedDuration, true)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span>Original Track:</span>
                  <span>{formatAudioDuration(duration, true)}</span>
                </div>
                <div className="text-[11px] text-right font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                  Cuts {(duration - selectedDuration).toFixed(1)}s of unwanted audio
                </div>
              </div>
            </div>

            {/* Fade & Export Settings */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Fade-in:</span>
                  <select
                    value={fadeIn}
                    onChange={(e) => setFadeIn(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value={0}>None (0s)</option>
                    <option value={0.5}>0.5 sec</option>
                    <option value={1}>1.0 sec</option>
                    <option value={2}>2.0 sec</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Fade-out:</span>
                  <select
                    value={fadeOut}
                    onChange={(e) => setFadeOut(Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border text-xs"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value={0}>None (0s)</option>
                    <option value={0.5}>0.5 sec</option>
                    <option value={1}>1.0 sec</option>
                    <option value={2}>2.0 sec</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Output Format:</span>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="wav">Lossless WAV (16-bit PCM)</option>
                    <option value="original">High-Compatibility Audio</option>
                  </select>
                </div>
              </div>

              {/* Action Button: Trim Audio */}
              <button
                onClick={handleTrimAudio}
                disabled={isProcessing || selectedDuration <= 0}
                className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105 active:scale-98"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Scissors size={16} />
                <span>Trim & Export Clip</span>
              </button>
            </div>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <ProgressBar
            progress={75}
            isIndeterminate
            statusText="Trimming audio samples with Web Audio API..."
            subText="Processing entirely in your browser memory (0 byte server transfer)"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 4: Download Result & Audition Preview */}
        {trimmedBlob && trimmedUrl && (
          <div 
            className="p-8 rounded-2xl border flex flex-col items-center text-center gap-6 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: '#06b6d4' }}
            >
              <Check size={32} strokeWidth={3} />
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Your Audio Clip is Ready!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Trimmed from {formatAudioDuration(startTime, true)} to {formatAudioDuration(endTime, true)} ({formatAudioDuration(trimmedDuration, true)} total)
              </p>
            </div>

            {/* Audio Player for Trimmed Result */}
            <div className="w-full max-w-md p-3 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
              <audio controls src={trimmedUrl} className="w-full" autoPlay={false} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={trimmedUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}_trimmed.wav`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>Download Trimmed Audio ({formatAudioBytes(trimmedBlob.size)})</span>
              </a>

              <button
                onClick={() => {
                  setTrimmedBlob(null);
                  if (trimmedUrl) URL.revokeObjectURL(trimmedUrl);
                  setTrimmedUrl(null);
                }}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <span>Adjust Cues</span>
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default AudioTrimmerWidget;
