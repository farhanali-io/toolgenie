import React from 'react';
import { Loader2 } from 'lucide-react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  statusText?: string;
  subText?: string;
  accentColor?: string;
  isIndeterminate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  statusText = 'Processing...',
  subText,
  accentColor = 'var(--accent)',
  isIndeterminate = false,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div 
      className="w-full p-6 rounded-2xl border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <Loader2 
            size={18} 
            className="animate-spin shrink-0" 
            style={{ color: accentColor }} 
          />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {statusText}
          </span>
        </div>
        {!isIndeterminate && (
          <span className="text-sm font-mono font-bold" style={{ color: accentColor }}>
            {clampedProgress}%
          </span>
        )}
      </div>

      {/* Progress Track */}
      <div 
        className="w-full h-3 rounded-full overflow-hidden relative"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {isIndeterminate ? (
          <div 
            className="h-full rounded-full animate-pulse w-full"
            style={{
              backgroundColor: accentColor,
              opacity: 0.8,
            }}
          />
        ) : (
          <div 
            className="h-full rounded-full transition-all duration-300 ease-out relative"
            style={{
              width: `${clampedProgress}%`,
              backgroundColor: accentColor,
            }}
          >
            {/* Shimmer stripe */}
            <div 
              className="absolute inset-0 bg-white/20 w-full h-full"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                backgroundSize: '1rem 1rem',
              }}
            />
          </div>
        )}
      </div>

      {subText && (
        <p className="mt-2.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {subText}
        </p>
      )}
    </div>
  );
};
