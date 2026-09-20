import React, { useState, useEffect } from 'react';
import { 
  Repeat, Download, Check, FileAudio, ArrowRight, ShieldCheck, 
  Sparkles, AlertTriangle, Music, Settings, RefreshCw 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { 
  convertAudioFile, 
  SupportedAudioFormat, 
  ConversionResult 
} from '../../../utils/audioConverterEngine';
import { formatAudioBytes } from '../../../utils/audioHelpers';

const FORMAT_OPTIONS: { id: SupportedAudioFormat; name: string; ext: string; desc: string; lossy: boolean }[] = [
  { id: 'mp3', name: 'MP3', ext: 'mp3', desc: 'Universal compatibility across all music players & devices', lossy: true },
  { id: 'wav', name: 'WAV', ext: 'wav', desc: 'Uncompressed lossless 16-bit PCM studio fidelity', lossy: false },
  { id: 'ogg', name: 'OGG', ext: 'ogg', desc: 'Open-source Vorbis audio with high compression efficiency', lossy: true },
  { id: 'm4a', name: 'M4A / AAC', ext: 'm4a', desc: 'Modern Apple & Android format with superior clarity', lossy: true },
  { id: 'flac', name: 'FLAC', ext: 'flac', desc: 'Bit-for-bit lossless compressed master quality', lossy: false },
];

const BITRATE_OPTIONS = [
  { kbps: 64, label: '64 kbps', desc: 'Voice & Speech notes (Smallest file)' },
  { kbps: 128, label: '128 kbps', desc: 'Standard radio quality' },
  { kbps: 192, label: '192 kbps', desc: 'High Quality music (Recommended)' },
  { kbps: 256, label: '256 kbps', desc: 'Very High Quality' },
  { kbps: 320, label: '320 kbps', desc: 'Maximum MP3 Studio fidelity' },
];

export const AudioConverterWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<SupportedAudioFormat>('mp3');
  const [bitrateKbps, setBitrateKbps] = useState<number>(192);
  const [sampleRate, setSampleRate] = useState<number | undefined>(undefined);
  const [channels, setChannels] = useState<1 | 2 | undefined>(undefined);

  // Conversion process states
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Preparing conversion...');
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setResult(null);
    setFallbackNotice(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    // Auto-pick a different default target format if user uploads an mp3
    const ext = selected.name.split('.').pop()?.toLowerCase();
    if (ext === 'mp3') {
      setTargetFormat('wav');
    } else {
      setTargetFormat('mp3');
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    try {
      setIsConverting(true);
      setProgress(5);
      setStatusMessage('Initializing engine...');
      setFallbackNotice(null);

      const convResult = await convertAudioFile(file, {
        targetFormat,
        bitrateKbps,
        sampleRate,
        channels,
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

      setIsConverting(false);
      setProgress(100);
    } catch (err: any) {
      console.error('Audio conversion failed:', err);
      setIsConverting(false);
      setFallbackNotice(err.message || 'Conversion failed. Please try a different target format.');
    }
  };

  const handleReset = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setResult(null);
    setResultUrl(null);
    setIsConverting(false);
    setProgress(0);
    setFallbackNotice(null);
  };

  const currentSelectedFormatObj = FORMAT_OPTIONS.find((f) => f.id === targetFormat);
  const currentStep = !file 
    ? 'dropzone' 
    : isConverting 
    ? 'progress' 
    : result 
    ? 'download' 
    : 'options';

  return (
    <ErrorBoundary fallbackTitle="Audio Converter Error" onReset={handleReset}>
      <BrowserCapabilityNotice toolName="Audio Converter" requireWebCodecs={false} />

      <ToolShell
        currentStep={currentStep}
        accentColor="#06b6d4"
        onReset={handleReset}
        title="Hardware-Accelerated Audio Converter"
      >
        {/* Step 1: Drop Zone */}
        {!file && (
          <DropZone
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.webm,.wma,.aiff"
            onFilesSelected={handleFileSelected}
            title="Drop Audio Track to Convert"
            description="Convert between MP3, WAV, OGG, M4A, and FLAC using hardware acceleration"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 2: Configure Format & Bitrate */}
        {file && !result && !isConverting && (
          <div className="flex flex-col gap-6">
            {/* Input File Card */}
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
                    {formatAudioBytes(file.size)} • {file.type || 'audio stream'}
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

            {/* Target Format Selector */}
            <div 
              className="p-6 rounded-2xl border flex flex-col gap-4 shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Select Output Format
                </label>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Hardware-accelerated transcoding via MediaBunny WebCodecs
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {FORMAT_OPTIONS.map((fmt) => {
                  const isSelected = targetFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setTargetFormat(fmt.id)}
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-extrabold text-lg text-cyan-500">
                          {fmt.name}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                        {fmt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Bitrate Selector (if lossy format selected) */}
              {currentSelectedFormatObj?.lossy && (
                <div 
                  className="mt-3 p-5 rounded-xl border flex flex-col gap-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      Audio Bitrate ({targetFormat.toUpperCase()})
                    </label>
                    <span className="font-mono text-xs font-bold text-cyan-500">
                      {bitrateKbps} kbps
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {BITRATE_OPTIONS.map((b) => (
                      <button
                        key={b.kbps}
                        type="button"
                        onClick={() => setBitrateKbps(b.kbps)}
                        className={`p-2.5 rounded-lg border text-center transition-all ${
                          bitrateKbps === b.kbps 
                            ? 'font-bold ring-1 ring-cyan-500' 
                            : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: bitrateKbps === b.kbps ? '#06b6d4' : 'var(--bg-card)',
                          color: bitrateKbps === b.kbps ? '#ffffff' : 'var(--text-primary)',
                          borderColor: bitrateKbps === b.kbps ? '#06b6d4' : 'var(--border-subtle)',
                        }}
                      >
                        <div className="text-xs font-bold">{b.label}</div>
                        <div className={`text-[10px] mt-0.5 truncate ${bitrateKbps === b.kbps ? 'text-white/80' : 'text-gray-400'}`}>
                          {b.kbps >= 192 ? 'High Quality' : b.kbps <= 64 ? 'Voice note' : 'Standard'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end">
              <button
                onClick={handleConvert}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105 active:scale-98"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Repeat size={16} />
                <span>Convert to {targetFormat.toUpperCase()}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Progress Bar & Fallback Notice */}
        {isConverting && (
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
              subText="MediaBunny WebCodecs conversion running 100% on your device"
              accentColor="#06b6d4"
            />
          </div>
        )}

        {/* Step 4: Completed Download Screen */}
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
                Conversion Successful!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Converted to <span className="font-bold text-cyan-500 uppercase">{result.format}</span> via {result.engineUsed === 'mediabunny' ? 'MediaBunny WebCodecs' : result.engineUsed === 'webaudio' ? 'Web Audio Engine' : 'FFmpeg Engine'}
              </p>
            </div>

            {/* Before vs After Size Badge */}
            <div 
              className="px-5 py-3 rounded-xl border flex items-center gap-4 text-xs font-mono"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="text-left">
                <span className="block text-[10px] text-gray-400">Original ({file?.name.split('.').pop()?.toUpperCase()}):</span>
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {formatAudioBytes(result.originalSize)}
                </span>
              </div>
              <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
              <div className="text-left">
                <span className="block text-[10px] text-gray-400">Output ({result.format.toUpperCase()}):</span>
                <span className="font-bold text-sm text-cyan-500">
                  {formatAudioBytes(result.newSize)}
                </span>
              </div>
            </div>

            {/* Audio Audition Preview */}
            <div className="w-full max-w-md p-3 rounded-xl border bg-black/5 dark:bg-white/5" style={{ borderColor: 'var(--border-subtle)' }}>
              <audio controls src={resultUrl} className="w-full" autoPlay={false} />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={resultUrl}
                download={result.outputFileName}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>Download {result.outputFileName}</span>
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
                <span>Convert Another File</span>
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default AudioConverterWidget;

