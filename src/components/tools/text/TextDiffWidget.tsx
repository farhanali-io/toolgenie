import React, { useState, useMemo } from 'react';
import * as Diff from 'diff';
import { 
  GitCompare, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  CheckCircle2, 
  PlusCircle, 
  MinusCircle,
  Columns,
  List
} from 'lucide-react';

const SAMPLE_ORIGINAL = `function calculateTotal(items, taxRate) {
  let subtotal = 0;
  for (let i = 0; i < items.length; i++) {
    subtotal += items[i].price;
  }
  const tax = subtotal * taxRate;
  return subtotal + tax;
}`;

const SAMPLE_MODIFIED = `function calculateTotal(items, taxRate, discount = 0) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
  }
  const discounted = Math.max(0, subtotal - discount);
  const tax = discounted * taxRate;
  return discounted + tax;
}`;

export const TextDiffWidget: React.FC = () => {
  const [originalText, setOriginalText] = useState(SAMPLE_ORIGINAL);
  const [modifiedText, setModifiedText] = useState(SAMPLE_MODIFIED);
  const [diffMode, setDiffMode] = useState<'words' | 'lines'>('lines');
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [copied, setCopied] = useState(false);

  // Compute diff
  const diffResult = useMemo(() => {
    if (diffMode === 'lines') {
      return Diff.diffLines(originalText, modifiedText, { ignoreWhitespace });
    } else {
      return Diff.diffWords(originalText, modifiedText, { ignoreCase: false });
    }
  }, [originalText, modifiedText, diffMode, ignoreWhitespace]);

  // Statistics
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    diffResult.forEach(part => {
      if (part.added) added += part.value.length;
      if (part.removed) removed += part.value.length;
    });
    return { added, removed, totalChanges: added + removed };
  }, [diffResult]);

  const handleCopySummary = () => {
    let summary = `Diff Summary:\n`;
    diffResult.forEach(part => {
      const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
      summary += part.value.split('\n').map(l => l ? prefix + l : '').join('\n');
    });
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex rounded-xl p-1 border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={() => setDiffMode('lines')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                diffMode === 'lines' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: diffMode === 'lines' ? 'var(--accent)' : 'transparent',
                color: diffMode === 'lines' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              Line-by-Line Diff
            </button>
            <button
              type="button"
              onClick={() => setDiffMode('words')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                diffMode === 'words' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: diffMode === 'words' ? 'var(--accent)' : 'transparent',
                color: diffMode === 'words' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              Word-by-Word Diff
            </button>
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium ml-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Ignore Whitespace</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setOriginalText(SAMPLE_ORIGINAL);
              setModifiedText(SAMPLE_MODIFIED);
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={12} />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginalText('');
              setModifiedText('');
            }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all hover:text-red-500"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            title="Clear text inputs"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Input Textareas (Original vs Modified) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
            Original Text (Before)
          </label>
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
          >
            <textarea
              id="diff-original-textarea"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste original text here..."
              rows={7}
              className="w-full p-3 font-mono text-xs sm:text-sm resize-y outline-none leading-relaxed"
              style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
            Modified Text (After)
          </label>
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
          >
            <textarea
              id="diff-modified-textarea"
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="Paste updated / modified text here..."
              rows={7}
              className="w-full p-3 font-mono text-xs sm:text-sm resize-y outline-none leading-relaxed"
              style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Diff Result View Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3 text-xs">
          <span className="font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Comparison Output
          </span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <PlusCircle size={13} />
              <span>+{stats.added} chars added</span>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <MinusCircle size={13} />
              <span>-{stats.removed} chars removed</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-500" />
              <span className="text-emerald-500">Copied Diff</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Diff</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Rendered Diff Box */}
      <div 
        className="rounded-xl border p-4 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap select-text"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
      >
        {originalText === modifiedText ? (
          <div className="text-center py-8 text-emerald-500 font-sans font-medium flex flex-col items-center">
            <CheckCircle2 size={24} className="mb-2" />
            <span>Both texts are completely identical. No differences found!</span>
          </div>
        ) : (
          diffResult.map((part, index) => {
            if (part.added) {
              return (
                <span
                  key={index}
                  className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold rounded px-0.5"
                >
                  {part.value}
                </span>
              );
            }
            if (part.removed) {
              return (
                <span
                  key={index}
                  className="bg-rose-500/20 text-rose-700 dark:text-rose-300 line-through rounded px-0.5"
                >
                  {part.value}
                </span>
              );
            }
            return (
              <span key={index} style={{ color: 'var(--text-secondary)' }}>
                {part.value}
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};
