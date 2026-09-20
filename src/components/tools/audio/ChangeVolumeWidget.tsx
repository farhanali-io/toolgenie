import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, Volume1, VolumeX, Play, Pause, Download, Check, 
  FileAudio, Sparkles, RefreshCw, Wand2, Shield, AlertCircle 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  getAudioContext, 
  decodeAudioFile, 
  audioBufferToWav, 
  formatAudioDuration, 
  formatAudioBytes 
} from '../../../utils/audioHelpers';

const PRESET_GAINS = [
  { label: 'Mute', percent: 0, db: '-∞ dB' },
  { label: '50%', percent: 50, db: '-6.0 dB' },
  { label: 'Original', percent: 100, db: '0.0 dB' },
  { label: '150%', percent: 150, db: '+3.5 dB' },
  { label: '200%', percent: 200, db: '+6.0 dB' },
  { label: '300%', percent: 300, db: '+9.5 dB' },
  { label: '400%', percent: 400, db: '+12.0 dB' },
];

export const ChangeVolumeWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  
  // Volume state (0% to 400%)
  const [volumePercent, setVolumePercent] = useState<number>(100);
  const [peakLimiter, setPeakLimiter] = useState<boolean>(true);
  const [originalPeak, setOriginalPeak] = useState<number>(1.0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTime, setPlaybackTime] = useState<number>(0);

  // Export state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  // Live Audio nodes
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const playbackStartTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const timerAnimRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    };
  }, [exportedUrl]);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    stopPlayback();
    setExportedBlob(null);
    if (exportedUrl) {
      URL.revokeObjectURL(exportedUrl);
      setExportedUrl(null);
    }

    try {
      const decoded = await decodeAudioFile(selected);
      setAudioBuffer(decoded);

      // Measure peak amplitude across all channels
      let peak = 0;
      for (let c = 0; c < decoded.numberOfChannels; c++) {
        const data = decoded.getChannelData(c);
        for (let i = 0; i < data.length; i += 100) {
          const abs = Math.abs(data[i]);
          if (abs > peak) peak = abs;
        }
      }
      setOriginalPeak(peak > 0 ? peak : 1.0);
    } catch (err) {
      console.error('Failed to decode audio file:', err);
    }
  };

  // Convert volume percent to linear multiplier (e.g. 100% -> 1.0, 200% -> 2.0, 400% -> 4.0)
  const linearGain = volumePercent / 100;
  const gainDb = volumePercent === 0 ? '-∞' : (20 * Math.log10(linearGain)).toFixed(1);

  // Update live GainNode dynamically during audition
  const handleVolumeChange = (newPercent: number) => {
    setVolumePercent(newPercent);
    if (gainNodeRef.current) {
      const ctx = getAudioContext();
      const gainMultiplier = newPercent / 100;
      // Smooth parameter ramp to prevent clicks
      gainNodeRef.current.gain.setTargetAtTime(gainMultiplier, ctx.currentTime, 0.05);
    }
  };

  // Auto Normalize: calculates maximum gain without clipping
  const handleAutoNormalize = () => {
    if (originalPeak <= 0) return;
    const targetPeak = 0.98; // safe margin below 1.0
    const idealPercent = Math.min(400, Math.max(10, Math.round((targetPeak / originalPeak) * 100)));
    handleVolumeChange(idealPercent);
  };

  // Live Playback controls
  const startPlayback = () => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    stopPlayback();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volumePercent / 100, ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);

    source.onended = () => {
      setIsPlaying(false);
      pauseOffsetRef.current = 0;
      setPlaybackTime(0);
      if (timerAnimRef.current) cancelAnimationFrame(timerAnimRef.current);
    };

    const offset = pauseOffsetRef.current % audioBuffer.duration;
    source.start(0, offset);
    playbackStartTimeRef.current = ctx.currentTime - offset;

    sourceNodeRef.current = source;
    gainNodeRef.current = gain;
    setIsPlaying(true);

    const updateTimer = () => {
      if (sourceNodeRef.current) {
        const elapsed = ctx.currentTime - playbackStartTimeRef.current;
        setPlaybackTime(Math.min(audioBuffer.duration, elapsed));
        timerAnimRef.current = requestAnimationFrame(updateTimer);
      }
    };
    timerAnimRef.current = requestAnimationFrame(updateTimer);
  };

  const stopPlayback = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch {}
      gainNodeRef.current = null;
    }
    if (timerAnimRef.current) {
      cancelAnimationFrame(timerAnimRef.current);
      timerAnimRef.current = null;
    }
    setIsPlaying(false);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  // Export processed audio as WAV
  const handleExportWav = async () => {
    if (!audioBuffer || !file) return;

    try {
      setIsExporting(true);
      stopPlayback();

      // Offline Audio Processing
      const numChannels = audioBuffer.numberOfChannels;
      const length = audioBuffer.length;
      const sampleRate = audioBuffer.sampleRate;
      const gainMultiplier = volumePercent / 100;

      const offlineCtx = new OfflineAudioContext(numChannels, length, sampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const gain = offlineCtx.createGain();
      gain.gain.value = gainMultiplier;

      source.connect(gain);

      if (peakLimiter && gainMultiplier > 1.0) {
        // Apply DynamicsCompressor to cleanly prevent digital clipping
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-0.5, offlineCtx.currentTime);
        compressor.knee.setValueAtTime(6, offlineCtx.currentTime);
        compressor.ratio.setValueAtTime(20, offlineCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, offlineCtx.currentTime);
        compressor.release.setValueAtTime(0.05, offlineCtx.currentTime);
        gain.connect(compressor);
        compressor.connect(offlineCtx.destination);
      } else {
        gain.connect(offlineCtx.destination);
      }

      source.start(0);
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert to WAV
      const wavBlob = audioBufferToWav(renderedBuffer);
      setExportedBlob(wavBlob);

      if (exportedUrl) URL.revokeObjectURL(exportedUrl);
      const url = URL.createObjectURL(wavBlob);
      setExportedUrl(url);

      setIsExporting(false);
    } catch (err) {
      console.error('Error rendering volume adjusted audio:', err);
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    stopPlayback();
    if (exportedUrl) URL.revokeObjectURL(exportedUrl);
    setFile(null);
    setAudioBuffer(null);
    setExportedBlob(null);
    setExportedUrl(null);
    setVolumePercent(100);
    setPlaybackTime(0);
  };

  const currentStep = !file 
    ? 'dropzone' 
    : isExporting 
    ? 'progress' 
    : exportedBlob 
    ? 'download' 
    : 'options';

  return (
    <ErrorBoundary fallbackTitle="Volume Tool Error" onReset={handleReset}>
      <BrowserCapabilityNotice toolName="Change Volume" />

      <ToolShell
        currentStep={currentStep}
        accentColor="#06b6d4"
        onReset={handleReset}
        title="Volume Booster & Attenuator"
      >
        {/* Step 1: Drop Zone */}
        {!file && (
          <DropZone
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
            onFilesSelected={handleFileSelected}
            title="Drop Audio Track to Adjust Volume"
            description="Boost or attenuate volume from 0% to 400% via instant Web Audio API GainNode"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 2: Controls & Live Preview */}
        {file && !exportedBlob && !isExporting && (
          <div className="flex flex-col gap-6">
            {/* Input Summary */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-500 shrink-0"
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                >
                  <FileAudio size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </h4>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatAudioBytes(file.size)} • {audioBuffer ? `${formatAudioDuration(audioBuffer.duration)} duration` : 'Decoding...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAutoNormalize}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-cyan-600 dark:text-cyan-400"
                  style={{
                    borderColor: 'rgba(6, 182, 212, 0.3)',
                    backgroundColor: 'rgba(6, 182, 212, 0.05)',
                  }}
                  title="Automatically maximize volume without distortion"
                >
                  <Wand2 size={13} />
                  <span>Auto-Normalize Peak</span>
                </button>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  Change File
                </button>
              </div>
            </div>

            {/* Volume Control Card */}
            <div 
              className="p-6 rounded-2xl border flex flex-col gap-6 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {/* Gain Indicator & DB meter */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Volume Level (GainNode)
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Adjust continuous loudness from 0% (mute) to 400% (+12 dB boost)
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-heading font-extrabold text-3xl text-cyan-500">
                      {volumePercent}%
                    </span>
                    <span className="block font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      {gainDb} dB
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <VolumeX size={18} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="1"
                    value={volumePercent}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-2 rounded-lg"
                  />
                  <Volume2 size={20} className="text-cyan-500" />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>0% (Mute)</span>
                  <span>100% (Original)</span>
                  <span>200% (+6 dB)</span>
                  <span>400% (+12 dB)</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                {PRESET_GAINS.map((p) => (
                  <button
                    key={p.percent}
                    type="button"
                    onClick={() => handleVolumeChange(p.percent)}
                    className={`py-2 px-1 rounded-lg border text-center transition-all ${
                      volumePercent === p.percent 
                        ? 'font-bold ring-1 ring-cyan-500' 
                        : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: volumePercent === p.percent ? '#06b6d4' : 'var(--bg-surface)',
                      color: volumePercent === p.percent ? '#ffffff' : 'var(--text-primary)',
                      borderColor: volumePercent === p.percent ? '#06b6d4' : 'var(--border-subtle)',
                    }}
                  >
                    <div className="text-xs font-bold">{p.label}</div>
                    <div className={`text-[10px] mt-0.5 font-mono ${volumePercent === p.percent ? 'text-white/80' : 'text-gray-400'}`}>
                      {p.db}
                    </div>
                  </button>
                ))}
              </div>

              {/* Live Audition & Limiter Controls */}
              <div 
                className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {/* Live Preview Button */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlayback}
                    className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 text-xs transition-all shadow-sm"
                    style={{
                      backgroundColor: isPlaying ? 'var(--bg-card)' : '#06b6d4',
                      color: isPlaying ? 'var(--text-primary)' : '#ffffff',
                      border: isPlaying ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                    <span>{isPlaying ? 'Pause Audition' : 'Live Preview With Current Gain'}</span>
                  </button>

                  {audioBuffer && (
                    <span className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {formatAudioDuration(playbackTime)} / {formatAudioDuration(audioBuffer.duration)}
                    </span>
                  )}
                </div>

                {/* Soft Limiter Option */}
                <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={peakLimiter}
                    onChange={(e) => setPeakLimiter(e.target.checked)}
                    className="accent-cyan-500 rounded cursor-pointer"
                  />
                  <Shield size={14} className="text-emerald-500" />
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    Soft Peak Limiter (prevents digital clipping)
                  </span>
                </label>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleExportWav}
                disabled={isExporting}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105 active:scale-98"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={16} />
                <span>Export WAV with {volumePercent}% Volume</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Export in Progress */}
        {isExporting && (
          <ProgressBar
            progress={65}
            isIndeterminate
            statusText="Rendering audio via Web Audio GainNode..."
            subText="Processing Float32Array PCM samples in browser memory"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 4: Download Result */}
        {exportedBlob && exportedUrl && (
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
                Volume Adjustment Complete!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Rendered with <span className="font-bold text-cyan-500">{volumePercent}% gain ({gainDb} dB)</span> into 16-bit Lossless WAV
              </p>
            </div>

            {/* Audition Player */}
            <div className="w-full max-w-md p-3 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
              <audio controls src={exportedUrl} className="w-full" autoPlay={false} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={exportedUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}_vol${volumePercent}.wav`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>Download Adjusted WAV ({formatAudioBytes(exportedBlob.size)})</span>
              </a>

              <button
                onClick={() => {
                  setExportedBlob(null);
                  if (exportedUrl) URL.revokeObjectURL(exportedUrl);
                  setExportedUrl(null);
                }}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <RefreshCw size={14} />
                <span>Adjust Again</span>
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default ChangeVolumeWidget;

