import React, { useState } from 'react';
import { ShieldCheck, Database, HardDriveDownload, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../shared/ProgressBar';

interface AiModelNoticeProps {
  toolName: string;
  modelName: string;
  modelSize: string;
  isCached: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  currentFile?: string;
  className?: string;
}

export const AiModelNotice: React.FC<AiModelNoticeProps> = ({
  toolName,
  modelName,
  modelSize,
  isCached,
  isDownloading = false,
  downloadProgress = 0,
  currentFile,
  className = '',
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !isDownloading) return null;

  return (
    <div
      className={`w-full mb-6 p-4 sm:p-5 rounded-2xl border transition-all ${className}`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: isDownloading ? 'var(--accent)' : 'var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{
              backgroundColor: isCached ? 'rgba(16, 185, 129, 0.12)' : 'rgba(20, 184, 166, 0.12)',
              color: isCached ? '#10b981' : 'var(--accent)',
            }}
          >
            {isCached ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                {isCached ? 'On-Device AI Model (Cached)' : 'Client-Side Neural Acceleration'}
              </span>
              <span
                className="px-2 py-0.5 text-xs rounded-full font-medium"
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                }}
              >
                100% Private & Offline
              </span>
            </div>

            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {isCached ? (
                <>
                  The <strong style={{ color: 'var(--text-primary)' }}>{modelName}</strong> neural network is stored locally in your browser’s cache.
                  Inference executes off-thread in a Web Worker with <strong>zero cloud transmission</strong>.
                </>
              ) : (
                <>
                  First use downloads an AI model ({modelSize}). Processing runs directly on your device. After this, it loads instantly.
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs pt-1" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Zero data sent to remote servers
              </span>
              <span className="flex items-center gap-1.5">
                <Database size={14} className="text-cyan-500" />
                Web Worker isolated execution
              </span>
              <span className="flex items-center gap-1.5">
                <HardDriveDownload size={14} className="text-teal-500" />
                Stored in Browser Cache
              </span>
            </div>
          </div>
        </div>

        {!isDownloading && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:opacity-75 transition-opacity text-xs shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="Dismiss notice"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isDownloading && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <ProgressBar
            progress={downloadProgress}
            statusText={`Downloading ${modelName} (${Math.round(downloadProgress)}%)`}
            subText={currentFile ? `Fetching ${currentFile}... Stored once in Cache API.` : 'Caching ONNX weights locally for offline reuse...'}
            accentColor="var(--accent)"
          />
        </div>
      )}
    </div>
  );
};
