import React from 'react';
import { RotateCcw, Check, ShieldCheck, Sparkles } from 'lucide-react';

export type ToolStep = 'dropzone' | 'options' | 'run' | 'progress' | 'download';

interface StepDefinition {
  key: ToolStep;
  label: string;
}

const DEFAULT_STEPS: StepDefinition[] = [
  { key: 'dropzone', label: '1. Select File' },
  { key: 'options', label: '2. Options' },
  { key: 'progress', label: '3. Process' },
  { key: 'download', label: '4. Download' },
];

interface ToolShellProps {
  currentStep: ToolStep;
  steps?: StepDefinition[];
  onReset?: () => void;
  title?: string;
  badgeText?: string;
  accentColor?: string;
  children: React.ReactNode;
}

export const ToolShell: React.FC<ToolShellProps> = ({
  currentStep,
  steps = DEFAULT_STEPS,
  onReset,
  title,
  badgeText = '100% Client-Side',
  accentColor = 'var(--accent)',
  children,
}) => {
  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Bar: Stepper + Reset action */}
      <div 
        className="w-full p-4 rounded-2xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Left: Step Indicators */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {steps.map((step, idx) => {
            const isDone = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step.key} className="flex items-center gap-2 shrink-0">
                <div 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isCurrent 
                      ? 'shadow-sm border' 
                      : isDone 
                      ? 'opacity-80' 
                      : 'opacity-40'
                  }`}
                  style={{
                    backgroundColor: isCurrent 
                      ? 'var(--bg-card)' 
                      : isDone 
                      ? 'var(--bg-card)' 
                      : 'transparent',
                    borderColor: isCurrent ? accentColor : 'var(--border-subtle)',
                    color: isCurrent 
                      ? accentColor 
                      : isDone 
                      ? 'var(--text-primary)' 
                      : 'var(--text-muted)',
                  }}
                >
                  {isDone ? (
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                  ) : (
                    <span 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 border"
                      style={{
                        borderColor: isCurrent ? accentColor : 'var(--border-subtle)',
                        backgroundColor: isCurrent ? 'var(--bg-surface)' : 'transparent',
                      }}
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span>{step.label.replace(/^\d+\.\s*/, '')}</span>
                </div>

                {idx < steps.length - 1 && (
                  <span className="text-xs select-none opacity-30" style={{ color: 'var(--text-muted)' }}>
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Security Badge & Reset Button */}
        <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>{badgeText}</span>
          </div>

          {onReset && currentStep !== 'dropzone' && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-card)',
              }}
              title="Reset & Start Over"
            >
              <RotateCcw size={13} />
              <span>Start Over</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tool Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};
