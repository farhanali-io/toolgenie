import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Copy, 
  Check, 
  Trash2, 
  Clock, 
  Sparkles, 
  AlignLeft, 
  BarChart2, 
  Volume2 
} from 'lucide-react';

const SAMPLE_TEXT = `ToolGenie is a next-generation online suite of professional utilities designed with privacy and high-speed execution at its core. Unlike traditional web converters that require uploading sensitive documents to third-party cloud servers, ToolGenie runs 100% locally on your machine using cutting-edge WebAssembly, HTML5 Canvas, and Web Crypto APIs.

Whether you are optimizing PDF documents, editing high-resolution images, transcoding base64 payloads, or generating cryptographic hashes, your data never leaves your browser. Enjoy unmatched speed, zero latency, and absolute peace of mind.`;

export const WordCounterWidget: React.FC = () => {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [copied, setCopied] = useState(false);

  // Compute metrics in real-time
  const metrics = useMemo(() => {
    const raw = text.trim();
    if (!raw) {
      return {
        words: 0,
        charactersWithSpaces: 0,
        charactersWithoutSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        readingTimeMinutes: 0,
        speakingTimeMinutes: 0,
        avgWordLength: 0,
        topKeywords: [] as { word: string; count: number; percent: number }[],
      };
    }

    // Words
    const wordList = raw.match(/\b[A-Za-z0-9'-]+\b/g) || [];
    const words = wordList.length;

    // Characters
    const charactersWithSpaces = text.length;
    const charactersWithoutSpaces = text.replace(/\s/g, '').length;

    // Sentences
    const sentences = (raw.match(/[.!?]+(?:\s+|$)/g) || []).length || (raw.length > 0 ? 1 : 0);

    // Paragraphs
    const paragraphs = raw.split(/\n+/).filter(p => p.trim().length > 0).length;

    // Reading & Speaking times (average reading speed = 225 wpm, speaking speed = 130 wpm)
    const readingTimeMinutes = +(words / 225).toFixed(1);
    const speakingTimeMinutes = +(words / 130).toFixed(1);

    // Average word length
    const totalWordChars = wordList.reduce((acc, w) => acc + w.length, 0);
    const avgWordLength = words > 0 ? +(totalWordChars / words).toFixed(1) : 0;

    // Top Keywords (excluding common stop words)
    const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'of', 'for', 'it', 'with', 'as', 'by', 'that', 'this', 'you', 'your', 'or', 'be', 'are', 'from']);
    const freqMap: Record<string, number> = {};
    for (const w of wordList) {
      const lower = w.toLowerCase();
      if (lower.length > 2 && !stopWords.has(lower)) {
        freqMap[lower] = (freqMap[lower] || 0) + 1;
      }
    }

    const topKeywords = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, count]) => ({
        word: w,
        count,
        percent: words > 0 ? Math.round((count / words) * 100) : 0
      }));

    return {
      words,
      charactersWithSpaces,
      charactersWithoutSpaces,
      sentences,
      paragraphs,
      readingTimeMinutes,
      speakingTimeMinutes,
      avgWordLength,
      topKeywords
    };
  }, [text]);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border text-center"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
            {metrics.words.toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            Words
          </div>
        </div>

        <div className="p-3.5 rounded-xl border text-center"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {metrics.charactersWithSpaces.toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            Characters
          </div>
        </div>

        <div className="p-3.5 rounded-xl border text-center"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {metrics.charactersWithoutSpaces.toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            Chars (No Space)
          </div>
        </div>

        <div className="p-3.5 rounded-xl border text-center"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {metrics.sentences.toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            Sentences
          </div>
        </div>

        <div className="p-3.5 rounded-xl border text-center col-span-2 sm:col-span-1"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
            {metrics.paragraphs.toLocaleString()}
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: 'var(--text-muted)' }}>
            Paragraphs
          </div>
        </div>
      </div>

      {/* Reading Time Estimations */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl border mb-5 text-xs"
        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-emerald-500" />
          <span style={{ color: 'var(--text-secondary)' }}>
            Estimated Reading Time: <strong>{metrics.readingTimeMinutes < 1 ? '< 1 min' : `${metrics.readingTimeMinutes} min`}</strong> (225 wpm)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={15} className="text-indigo-500" />
          <span style={{ color: 'var(--text-secondary)' }}>
            Speaking Time: <strong>{metrics.speakingTimeMinutes < 1 ? '< 1 min' : `${metrics.speakingTimeMinutes} min`}</strong> (130 wpm)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 size={15} className="text-amber-500" />
          <span style={{ color: 'var(--text-secondary)' }}>
            Avg Word: <strong>{metrics.avgWordLength} chars</strong>
          </span>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
      >
        <textarea
          id="word-counter-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text here to analyze live..."
          rows={12}
          className="w-full p-4 font-sans text-xs sm:text-sm resize-y outline-none leading-relaxed"
          style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setText(SAMPLE_TEXT)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={12} />
            <span>Load Sample</span>
          </button>
          <button
            type="button"
            onClick={() => setText('')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all hover:text-red-500"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={!text}
          className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)'
          }}
        >
          {copied ? (
            <>
              <Check size={14} />
              <span>Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Text</span>
            </>
          )}
        </button>
      </div>

      {/* Keyword Density Breakdown */}
      {metrics.topKeywords.length > 0 && (
        <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Frequent Keywords Density
          </div>
          <div className="flex flex-wrap gap-2">
            {metrics.topKeywords.map(({ word, count, percent }) => (
              <div 
                key={word}
                className="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-2"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              >
                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{word}</span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800" style={{ color: 'var(--text-muted)' }}>
                  {count}× ({percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
