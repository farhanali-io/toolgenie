import React, { useState } from 'react';
import { 
  Binary, 
  Copy, 
  Check, 
  Trash2, 
  ArrowRightLeft, 
  Download, 
  FileUp, 
  Sparkles, 
  AlertCircle 
} from 'lucide-react';

// Safe UTF-8 encoding to Base64
function utf8ToBase64(str: string, urlSafe: boolean = false): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let b64 = btoa(binary);
  if (urlSafe) {
    b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return b64;
}

// Safe Base64 decoding to UTF-8
function base64ToUtf8(b64: string): string {
  // Normalize URL-safe back to standard
  let standardB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with '=' if needed
  while (standardB64.length % 4 !== 0) {
    standardB64 += '=';
  }
  const binary = atob(standardB64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export const Base64Widget: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [inputText, setInputText] = useState('Hello World! 🚀 ToolGenie makes client-side tools 100% private.');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Recompute automatically
  React.useEffect(() => {
    if (!inputText) {
      setOutputText('');
      setError(null);
      return;
    }

    try {
      if (mode === 'encode') {
        const encoded = utf8ToBase64(inputText, urlSafe);
        setOutputText(encoded);
        setError(null);
      } else {
        const decoded = base64ToUtf8(inputText.trim());
        setOutputText(decoded);
        setError(null);
      }
    } catch (err: any) {
      setError(mode === 'decode' ? 'Invalid Base64 sequence. Please ensure padding and characters are valid.' : err.message);
      setOutputText('');
    }
  }, [inputText, mode, urlSafe]);

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    if (outputText) {
      setInputText(outputText);
      setMode(mode === 'encode' ? 'decode' : 'encode');
    } else {
      setMode(mode === 'encode' ? 'decode' : 'encode');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (mode === 'encode') {
        setInputText(result);
      }
    };
    // If user uploads a file while in encode mode, convert file directly to Data URL base64
    reader.readAsDataURL(file);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = mode === 'encode' ? 'base64-encoded.txt' : 'decoded-output.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-xl p-1 border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
          >
            <button
              type="button"
              onClick={() => setMode('encode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'encode' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: mode === 'encode' ? 'var(--accent)' : 'transparent',
                color: mode === 'encode' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              Encode to Base64
            </button>
            <button
              type="button"
              onClick={() => setMode('decode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'decode' ? 'shadow-sm' : ''
              }`}
              style={{
                backgroundColor: mode === 'decode' ? 'var(--accent)' : 'transparent',
                color: mode === 'decode' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
              }}
            >
              Decode from Base64
            </button>
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-xl border transition-colors hover:scale-105"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            title="Swap input & output"
          >
            <ArrowRightLeft size={14} />
          </button>
        </div>

        {/* URL Safe Toggle */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={urlSafe}
              onChange={(e) => setUrlSafe(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>URL-Safe Base64 (`-`, `_`)</span>
          </label>

          <button
            type="button"
            onClick={() => setInputText('')}
            className="p-1.5 rounded-lg text-xs border transition-colors hover:text-red-500"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Dual Text Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Pane */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {mode === 'encode' ? 'Raw Text / Unicode Input' : 'Base64 Encoded String'}
            </label>
            <div className="flex items-center gap-2">
              <label 
                className="text-xs flex items-center gap-1 cursor-pointer font-medium hover:underline"
                style={{ color: 'var(--accent)' }}
              >
                <FileUp size={12} />
                <span>Upload File</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
              <button
                type="button"
                onClick={() => setInputText('Hello World! 🚀 ToolGenie makes client-side tools 100% private.')}
                className="text-xs font-medium hover:underline flex items-center gap-0.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Sparkles size={11} />
                <span>Sample</span>
              </button>
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
          >
            <textarea
              id="base64-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={mode === 'encode' ? 'Type or paste plain text here...' : 'Paste base64 string here (e.g. SGVsbG8gV29ybGQ=)...'}
              rows={9}
              className="w-full p-3.5 font-mono text-xs sm:text-sm resize-y outline-none leading-relaxed"
              style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
          <div className="mt-1.5 text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {inputText.length} characters • {new Blob([inputText]).size} bytes
          </div>
        </div>

        {/* Output Pane */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {mode === 'encode' ? 'Base64 Result' : 'Decoded Plain Text'}
            </label>
            {outputText && (
              <span className="text-[11px] font-mono text-emerald-500 font-medium">
                Ready
              </span>
            )}
          </div>

          <div 
            className={`rounded-xl border overflow-hidden relative ${
              error ? 'border-rose-500/50 bg-rose-500/5' : ''
            }`}
            style={{ 
              borderColor: error ? undefined : 'var(--border-subtle)', 
              backgroundColor: error ? undefined : 'var(--bg-input)' 
            }}
          >
            {error ? (
              <div className="p-4 flex items-start gap-2 text-rose-500 text-xs min-h-[190px]">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">Decoding Failed</div>
                  <div className="font-mono text-[11px]">{error}</div>
                </div>
              </div>
            ) : (
              <textarea
                id="base64-output"
                readOnly
                value={outputText}
                placeholder="Transformed output will appear here automatically..."
                rows={9}
                className="w-full p-3.5 font-mono text-xs sm:text-sm resize-y outline-none leading-relaxed select-all"
                style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
              />
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {outputText ? `${outputText.length} characters • ${new Blob([outputText]).size} bytes` : '0 characters'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputText}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputText}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)'
                }}
              >
                <Download size={13} />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
