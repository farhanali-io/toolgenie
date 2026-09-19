import React, { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { X, ShieldCheck, HelpCircle, ChevronDown, Sparkles } from 'lucide-react';

interface ToolModalProps {
  tool: ToolItem | null;
  onClose: () => void;
}

export const ToolModal: React.FC<ToolModalProps> = ({ tool, onClose }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (tool) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [tool, onClose]);

  if (!tool) return null;

  const isLive = tool.status === 'live';
  const categoryColor = tool.categoryAccentColor || 'var(--accent)';

  return (
    <div 
      id="tool-details-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tool-title"
    >
      <div 
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Bar */}
        <div 
          className="p-5 sm:p-6 border-b flex items-start justify-between gap-4 shrink-0"
          style={{ 
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div className="flex items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: categoryColor
              }}
            >
              <DynamicIcon name={tool.icon} size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span 
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {tool.categoryName || 'ToolGenie'}
                </span>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isLive ? 'var(--badge-live-bg)' : 'var(--badge-soon-bg)',
                    color: isLive ? 'var(--badge-live-text)' : 'var(--badge-soon-text)'
                  }}
                >
                  {isLive ? 'LIVE' : 'COMING SOON'}
                </span>
              </div>
              <h2 
                id="modal-tool-title"
                className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {tool.name}
              </h2>
            </div>
          </div>

          <button
            id="modal-close-button"
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border hover:opacity-80 transition-opacity focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Long Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Overview & Capabilities
            </h3>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {tool.longDescription}
            </p>
          </div>

          {/* Privacy Banner */}
          <div 
            className="p-4 rounded-xl border flex items-start gap-3 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <ShieldCheck size={18} className="shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                100% Client-Side Safe
              </p>
              <p style={{ color: 'var(--text-secondary)' }}>
                This tool operates strictly inside your browser sandbox. No documents, images, or metadata are ever uploaded to ToolGenie or third-party servers.
              </p>
            </div>
          </div>

          {/* Chunk 1 Implementation Notice */}
          <div 
            className="p-3.5 rounded-xl border text-xs flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={15} style={{ color: 'var(--accent)' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {isLive ? 'Full interactive widget launches in Chunk 2' : 'WebAssembly engine in active development'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
              Chunk 1 of 4
            </span>
          </div>

          {/* FAQs Accordion Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={16} style={{ color: 'var(--accent)' }} />
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Frequently Asked Questions ({tool.faqs.length})
              </h3>
            </div>

            <div className="space-y-2">
              {tool.faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div 
                    key={index}
                    className="border rounded-xl overflow-hidden transition-colors"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: isOpen ? 'var(--accent)' : 'var(--border-subtle)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-3.5 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-opacity hover:opacity-90"
                      style={{ color: 'var(--text-primary)' }}
                      aria-expanded={isOpen}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown 
                        size={16} 
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--text-muted)' }}
                      />
                    </button>

                    {isOpen && (
                      <div 
                        className="px-3.5 pb-3.5 text-xs sm:text-sm leading-relaxed border-t pt-2"
                        style={{ 
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className="p-4 border-t flex items-center justify-between shrink-0"
          style={{ 
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tool slug: <code className="font-mono text-[11px]">{tool.slug}</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
