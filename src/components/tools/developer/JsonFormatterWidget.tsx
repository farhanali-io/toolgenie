import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Trash2, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Search
} from 'lucide-react';

const SAMPLE_JSON = `{
  "app": "ToolGenie",
  "version": "2.4.0",
  "description": "Fast, private browser-based utilities",
  "features": [
    "100% Client-Side Processing",
    "Zero File Uploads",
    "Dark & Light Themes",
    "PWA Offline Support"
  ],
  "author": {
    "name": "ToolGenie Team",
    "verified": true,
    "rating": 4.95
  },
  "stats": {
    "monthlyUsers": 850000,
    "toolsCount": 23,
    "averageLatencyMs": 0.4
  }
}`;

export const JsonFormatterWidget: React.FC = () => {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [indentSize, setIndentSize] = useState<number | 'tab'>(2);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errorLine?: number;
    errorColumn?: number;
    errorMessage?: string;
  } | null>(null);

  // Validate on the fly
  const validateJson = (text: string) => {
    if (!text.trim()) {
      setValidationResult(null);
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      setValidationResult({ isValid: true });
      return parsed;
    } catch (err: any) {
      let line: number | undefined;
      let col: number | undefined;
      let msg = err.message || 'Invalid JSON syntax';

      // Parse line and column from error message if available
      // e.g. "Unexpected token } in JSON at position 45" or "at line 3 column 5"
      const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
      if (lineColMatch) {
        line = parseInt(lineColMatch[1], 10);
        col = parseInt(lineColMatch[2], 10);
      } else {
        const posMatch = msg.match(/position\s+(\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const linesUpToPos = text.substring(0, pos).split('\n');
          line = linesUpToPos.length;
          col = linesUpToPos[linesUpToPos.length - 1].length + 1;
        }
      }

      setValidationResult({
        isValid: false,
        errorLine: line,
        errorColumn: col,
        errorMessage: msg
      });
      return null;
    }
  };

  const handleBeautify = (spaces: number | 'tab') => {
    setIndentSize(spaces);
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, spaces === 'tab' ? '\t' : spaces);
      setInputJson(formatted);
      setValidationResult({ isValid: true });
    } catch (err: any) {
      validateJson(inputJson);
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
      setValidationResult({ isValid: true });
    } catch (err: any) {
      validateJson(inputJson);
    }
  };

  const handleCopy = () => {
    if (!inputJson) return;
    navigator.clipboard.writeText(inputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!inputJson) return;
    const blob = new Blob([inputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stats calculation
  const getStats = () => {
    const bytes = new Blob([inputJson]).size;
    const lines = inputJson ? inputJson.split('\n').length : 0;
    const characters = inputJson.length;
    return { bytes, lines, characters };
  };

  const stats = getStats();

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center flex-wrap gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--text-muted)' }}>
            Format:
          </span>
          <button
            type="button"
            onClick={() => handleBeautify(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              indentSize === 2 ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: indentSize === 2 ? '0 0 0 2px var(--accent)' : 'none'
            }}
          >
            <Maximize2 size={13} />
            <span>2 Spaces</span>
          </button>
          <button
            type="button"
            onClick={() => handleBeautify(4)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              indentSize === 4 ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: indentSize === 4 ? '0 0 0 2px var(--accent)' : 'none'
            }}
          >
            <span>4 Spaces</span>
          </button>
          <button
            type="button"
            onClick={() => handleBeautify('tab')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              indentSize === 'tab' ? 'ring-2' : ''
            }`}
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
              boxShadow: indentSize === 'tab' ? '0 0 0 2px var(--accent)' : 'none'
            }}
          >
            <span>Tabs</span>
          </button>
          <button
            type="button"
            onClick={handleMinify}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Minimize2 size={13} />
            <span>Minify</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setInputJson(SAMPLE_JSON);
              setValidationResult({ isValid: true });
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={13} />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setInputJson('');
              setValidationResult(null);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 hover:text-red-500"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            title="Clear editor"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Validation status callout */}
      {validationResult && (
        <div 
          className={`mb-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
            validationResult.isValid 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
          }`}
        >
          {validationResult.isValid ? (
            <>
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Valid JSON payload</span> — Syntax parses cleanly with zero structural errors.
              </div>
            </>
          ) : (
            <>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">JSON Syntax Error:</span>{' '}
                {validationResult.errorLine && (
                  <span className="underline font-mono ml-1 font-bold">
                    Line {validationResult.errorLine}
                    {validationResult.errorColumn ? `, Col ${validationResult.errorColumn}` : ''}:
                  </span>
                )}{' '}
                {validationResult.errorMessage}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter or highlight keys in JSON..."
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-all"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-1 rounded"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Text Editor Area */}
      <div className="relative rounded-xl border overflow-hidden"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
      >
        <textarea
          id="json-input"
          value={inputJson}
          onChange={(e) => {
            setInputJson(e.target.value);
            validateJson(e.target.value);
          }}
          placeholder="Paste or type raw JSON here..."
          rows={16}
          spellCheck={false}
          className="w-full p-4 font-mono text-xs sm:text-sm resize-y outline-none block leading-relaxed"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      {/* Bottom Bar: Stats & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-4 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          <span>{stats.lines} lines</span>
          <span>•</span>
          <span>{stats.characters} chars</span>
          <span>•</span>
          <span>{(stats.bytes / 1024).toFixed(2)} KB</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inputJson}
            className="px-4 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500" />
                <span className="text-emerald-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy JSON</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!inputJson}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)'
            }}
          >
            <Download size={14} />
            <span>Download .json</span>
          </button>
        </div>
      </div>
    </div>
  );
};
