import React, { useEffect } from 'react';
import { X, Info, Mail } from 'lucide-react';

interface StubModalProps {
  isOpen: boolean;
  title: string;
  content: string;
  onClose: () => void;
}

export const StubModal: React.FC<StubModalProps> = ({
  isOpen,
  title,
  content,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="stub-page-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200 space-y-4"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent)'
              }}
            >
              <Info size={18} />
            </div>
            <h3 className="font-heading text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {content}
        </p>

        <div 
          className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex items-center gap-2">
            <Mail size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Official Contact:</span>
          </div>
          <a 
            href="mailto:farhanaly.io3@gmail.com" 
            className="font-mono font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            farhanaly.io3@gmail.com
          </a>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>ToolGenie • Chunk 1 Foundation</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
