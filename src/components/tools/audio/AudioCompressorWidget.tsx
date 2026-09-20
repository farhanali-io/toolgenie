import React, { useState, useEffect } from 'react';
import { 
  Minimize2, Download, Check, FileAudio, ArrowRight, ShieldCheck, 
  Sparkles, AlertTriangle, Disc, RefreshCw, Volume2 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  convertAudioFile, 
  ConversionResult 
} from '../../../utils/audioConverterEngine';
import { 
  decodeAudioFile, 
  formatAudioBytes, 
  formatAudioDuration 
} from '../../../utils/audioHelpers';

interface CompressionPreset {
  id: string;
  name: string;
  bitrate: number;
  channels: 1 | 2;
  sampleRate?: number;
  desc: string;
  estReduction: string;
}

const PRESETS: CompressionPreset[] = [
  {
    id: 'voice',
    name: 'Voice / Speech / Lecture',
    bitrate: 32,
    channels: 1,
    sampleRate: 22050,
    desc: 'Optimized for spoken word, interviews, podcasts, and audiobooks',
    estReduction: '~80-90% smaller',
  },
  {
    id: 'compact',
    name: 'High Compression',
    bitrate: 64,
    channels: 2,
    sampleRate: 44100,
    desc: 'Great for sharing on messaging apps with limited bandwidth',
    estReduction: '~70% smaller',
  },
  {
    id: 'balanced',
    name: 'Balanced (Standard)',
    bitrate: 96,
    channels: 2,
    sampleRate: 44100,
    desc: 'Clean musical balance between small size and acoustic clarity',
    estReduction: '~50-60% smaller',
  },
  {
    id: 'hq',
    name: 'Light Compression (High Quality)',
    bitrate: 128,
    channels: 2,
    sampleRate: 44100,
    desc: 'Transparent quality for music streaming and archiving',
    estReduction: '~30-40% smaller',
  },
];

export const AudioCompressorWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  
  // Compression Settings
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [targetBitrate, setTargetBitrate] = useState<number>(96);
  const [channels, setChannels] = useState<1 | 2>(2);
  const [sampleRate, setSampleRate] = useState<number>(44100);

  // Processing state
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Preparing compressor...');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResult(null);
    setFallbackNotice(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    try {
      const decoded = await decodeAudioFile(selected);
      setDuration(decoded.duration);
    } catch {
      setDuration(0);
    }
  };

  const handleSelectPreset = (preset: CompressionPreset) => {
    setActivePreset(preset.id);
    setTargetBitrate(preset.bitrate);
    setChannels(preset.channels);
    if (preset.sampleRate) setSampleRate(preset.sampleRate);
  };

  const handleCustomBitrate = (val: number) => {
    setTargetBitrate(val);
    setActivePreset('custom');
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setIsCompressing(true);
      setProgress(10);
      setStatusMessage('Analyzing audio spectrum...');
      setFallbackNotice(null);

      // Determine appropriate compressed output container (MP3 or M4A)
      const targetFormat = 'mp3';

      const convResult = await convertAudioFile(file, {
        targetFormat,
        bitrateKbps: targetBitrate,
        channels,
        sampleRate,
        onProgress: (pct, msg) => {
          setProgress(pct);
          setStatusMessage(msg);
        },
        onNotice: (msg) => {
          setFallbackNotice(msg);
        },
      });

      setResult(convResult);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(convResult.blob);
      setResultUrl(url);

      setIsCompressing(false);
      setProgress(100);
    } catch (err: any) {
      console.error('Audio compression failed:', err);
      setIsCompressing(false);
      setFallbackNotice(err.message || 'Compression failed. Please try a different preset.');
    }
  };

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResult(null);
    setResultUrl(null);
    setIsCompressing(false);
    setProgress(0);
    setFallbackNotice(null);
    setDuration(0);
  };

  // Estimated compressed size calculation: (bitrate * duration) / 8
  const estimatedSizeBytes = duration > 0 ? (targetBitrate * 1000 * duration) / 8 : 0;
  const savingsBytes = result ? Math.max(0, result.originalSize - result.newSize) : 0;
  const savingsPct = result && result.originalSize > 0 
    ? Math.round((savingsBytes / result.originalSize) * 100) 
    : 0;

  const currentStep = !file 
    ? 'dropzone' 
    : isCompressing 
    ? 'progress' 
    : result 
    ? 'download' 
    : 'options';

  return (
    <ErrorBoundary fallbackTitle="Audio Compressor Error" onReset={handleReset}>
      <BrowserCapabilityNotice toolName="Audio Compressor" requireWebCodecs={false} />

      <ToolShell
        currentStep={currentStep}
        accentColor="#06b6d4"
        onReset={handleReset}
        title="Smart Audio Compressor"
      >
        {/* Step 1: Drop Zone */}
        {!file && (
          <DropZone
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm"
            onFilesSelected={handleFileSelected}
            title="Drop Audio Track to Compress"
            description="Reduce file size with MediaBunny hardware WebCodecs while preserving clarity"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 2: Configure Compression Settings */}
        {file && !result && !isCompressing && (
          <div className="flex flex-col gap-6">
            {/* Input File Summary */}
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
                    Original Size: <span className="font-bold text-cyan-500">{formatAudioBytes(file.size)}</span>
                    {duration > 0 && ` • Duration: ${formatAudioDuration(duration)}`}
                  </p>
                </div>
              </div>

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

            {/* Presets Grid */}
            <div 
              className="p-6 rounded-2xl border flex flex-col gap-4 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Select Compression Preset
                </label>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Tailored presets for voice recordings, music tracks, and podcast distribution
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {PRESETS.map((p) => {
                  const isSelected = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'ring-2 ring-cyan-500 shadow-sm' 
                          : 'hover:border-cyan-500/50'
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.08)' : 'var(--bg-surface)',
                        borderColor: isSelected ? '#06b6d4' : 'var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-heading font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {p.name}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                              <Check size={10} strokeWidth={3} />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
                          {p.desc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t text-xs font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
                        <span className="text-cyan-500 font-bold">{p.bitrate} kbps</span>
                        <span className="text-emerald-500 font-semibold text-[10px]">{p.estReduction}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Slider for Target Bitrate */}
              <div 
                className="mt-4 p-5 rounded-xl border flex flex-col gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Target Bitrate Slider
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-cyan-500">
                      {targetBitrate} kbps
                    </span>
                    {estimatedSizeBytes > 0 && (
                      <span className="text-[11px] text-gray-400">
                        (Est. ~{formatAudioBytes(estimatedSizeBytes)})
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="range"
                  min="24"
                  max="192"
                  step="8"
                  value={targetBitrate}
                  onChange={(e) => handleCustomBitrate(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>24 kbps (Smallest)</span>
                  <span>96 kbps (Balanced)</span>
                  <span>192 kbps (High Fidelity)</span>
                </div>

                {/* Additional downsample and channel controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Channels:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setChannels(2); setActivePreset('custom'); }}
                        className={`px-2.5 py-1 rounded-lg border text-xs ${channels === 2 ? 'bg-cyan-500 text-white font-bold' : ''}`}
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        Stereo
                      </button>
                      <button
                        type="button"
                        onClick={() => { setChannels(1); setActivePreset('custom'); }}
                        className={`px-2.5 py-1 rounded-lg border text-xs ${channels === 1 ? 'bg-cyan-500 text-white font-bold' : ''}`}
                        style={{ borderColor: 'var(--border-subtle)' }}
                        title="Mono halves bitrate for voice recordings"
                      >
                        Mono (Smallest)
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>Sample Rate:</span>
                    <select
                      value={sampleRate}
                      onChange={(e) => { setSampleRate(Number(e.target.value)); setActivePreset('custom'); }}
                      className="px-2 py-1 rounded-lg border text-xs"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <option value={44100}>44.1 kHz (CD Standard)</option>
                      <option value={32000}>32.0 kHz (Speech)</option>
                      <option value={22050}>22.05 kHz (Compact Voice)</option>
                      <option value={16000}>16.0 kHz (Ultra Compact)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleCompress}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105 active:scale-98"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Minimize2 size={16} />
                <span>Compress Audio File</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Compression in Progress */}
        {isCompressing && (
          <div className="flex flex-col gap-4">
            {fallbackNotice && (
              <div 
                className="p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
              >
                <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                <p className="leading-relaxed font-medium">
                  {fallbackNotice}
                </p>
              </div>
            )}

            <ProgressBar
              progress={progress}
              statusText={statusMessage}
              subText="MediaBunny WebCodecs audio compressor running in device memory"
              accentColor="#06b6d4"
            />
          </div>
        )}

        {/* Step 4: Download & Comparison Screen */}
        {result && resultUrl && (
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
                Compression Complete!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Processed client-side via {result.engineUsed === 'mediabunny' ? 'MediaBunny WebCodecs' : 'Audio Engine'}
              </p>
            </div>

            {/* Before / After Size Comparison Card */}
            <div 
              className="w-full max-w-md p-5 rounded-2xl border flex flex-col gap-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center justify-between text-xs">
                <div className="text-left">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Original Size</span>
                  <span className="font-mono font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                    {formatAudioBytes(result.originalSize)}
                  </span>
                </div>

                <div className="flex flex-col items-center">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-bold font-mono text-xs border border-emerald-500/20">
                    Saved {savingsPct}% ({formatAudioBytes(savingsBytes)})
                  </span>
                  <ArrowRight size={16} className="text-gray-400 mt-1" />
                </div>

                <div className="text-right">
                  <span className="block text-[10px] text-cyan-500 uppercase font-bold">Compressed Size</span>
                  <span className="font-mono font-bold text-base text-cyan-500">
                    {formatAudioBytes(result.newSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Audition Player */}
            <div className="w-full max-w-md p-3 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
              <audio controls src={resultUrl} className="w-full" autoPlay={false} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={resultUrl}
                download={`${file?.name.replace(/\.[^/.]+$/, '')}_compressed.mp3`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>Download Compressed Audio ({formatAudioBytes(result.newSize)})</span>
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
                <span>Compress Another File</span>
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default AudioCompressorWidget;

