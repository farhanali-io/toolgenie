import React, { useState, useEffect } from 'react';
import { isWebCodecsSupported, isWebAudioSupported } from '../../../utils/audioHelpers';
import { Cpu, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface BrowserCapabilityNoticeProps {
  toolName?: string;
  requireWebCodecs?: boolean;
}

export const BrowserCapabilityNotice: React.FC<BrowserCapabilityNoticeProps> = ({
  toolName = 'Audio Tool',
  requireWebCodecs = false,
}) => {
  const [hasWebCodecs, setHasWebCodecs] = useState<boolean | null>(null);
  const [hasWebAudio, setHasWebAudio] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    setHasWebCodecs(isWebCodecsSupported());
    setHasWebAudio(isWebAudioSupported());
  }, []);

  if (dismissed || hasWebCodecs === null) return null;

  // If WebCodecs is required by the tool (like audio-converter, audio-compressor) and missing
  if (requireWebCodecs && !hasWebCodecs) {
    return (
      <div 
        className="w-full mb-6 p-4 rounded-xl border flex items-start gap-3 text-xs sm:text-sm transition-all"
        style={{
          backgroundColor: 'rgba(234, 179, 8, 0.08)',
          borderColor: 'rgba(234, 179, 8, 0.3)',
        }}
      >
        <AlertTriangle size={18} className="shrink-0 text-amber-500 mt-0.5" />
        <div className="flex-1">
          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">
            Browser Notice: Hardware WebCodecs Unavailable
          </p>
          <p style={{ color: 'var(--text-secondary)' }} className="leading-relaxed">
            Your current browser does not natively expose the high-speed WebCodecs Audio API. 
            {toolName} will seamlessly utilize the Web Audio API and client-side fallback encoder, which may process slightly slower on large audio files.
          </p>
        </div>
        <button 
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          title="Dismiss notice"
        >
          <X size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>
    );
  }

  // When supported, show a subtle hardware acceleration active indicator
  return (
    <div 
      className="w-full mb-4 px-3.5 py-2 rounded-lg border flex items-center justify-between text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <Cpu size={14} style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          Engine Status:
        </span>
        <span className="font-medium inline-flex items-center gap-1" style={{ color: 'var(--badge-live-text)' }}>
          <CheckCircle2 size={12} className="text-emerald-500" />
          Hardware WebCodecs Active (100% Client-Side)
        </span>
      </div>
      <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
        0 server transfers
      </span>
    </div>
  );
};
