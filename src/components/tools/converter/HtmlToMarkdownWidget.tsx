import React, { useState, useRef, useMemo } from 'react';
import TurndownService from 'turndown';
import { 
  FileCode, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Sparkles, 
  AlertCircle,
  Settings2
} from 'lucide-react';

const SAMPLE_HTML = `<header>
  <h1>ToolGenie Client-Side Architecture</h1>
  <p>Universal web tools running <strong>100% in your browser</strong>.</p>
</header>

<main>
  <h2>Core Capabilities</h2>
  <ul>
    <li>Zero server latency</li>
    <li>Total data confidentiality</li>
    <li>Offline capable via modern Service Workers</li>
  </ul>

  <h2>Sample Code Block</h2>
  <pre><code class="language-js">function executeLocalTask(input) {
  const result = transform(input);
  return result;
}</code></pre>

  <blockquote>
    <p>"Privacy is not an afterthought — it is the fundamental design principle."</p>
  </blockquote>

  <p>Learn more at <a href="https://toolgenie.online">ToolGenie Home</a>.</p>
</main>`;

export const HtmlToMarkdownWidget: React.FC = () => {
  const [htmlInput, setHtmlInput] = useState<string>(SAMPLE_HTML);
  const [headingStyle, setHeadingStyle] = useState<'atx' | 'setext'>('atx');
  const [bulletMarker, setBulletMarker] = useState<'-' | '*' | '+'>('-');
  const [codeBlockStyle, setCodeBlockStyle] = useState<'fenced' | 'indented'>('fenced');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert HTML to Markdown
  const markdownOutput = useMemo(() => {
    if (!htmlInput.trim()) return '';
    try {
      const turndown = new TurndownService({
        headingStyle,
        bulletListMarker: bulletMarker,
        codeBlockStyle,
        emDelimiter: '_',
        strongDelimiter: '**',
      });

      return turndown.turndown(htmlInput);
    } catch (err: any) {
      return `Error converting HTML: ${err.message}`;
    }
  }, [htmlInput, headingStyle, bulletMarker, codeBlockStyle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setHtmlInput(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read HTML file.');
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!markdownOutput) return;
    try {
      await navigator.clipboard.writeText(markdownOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!markdownOutput) return;
    const blob = new Blob([markdownOutput], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Toolbar */}
      <div 
        className="rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Heading style */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: 'var(--text-muted)' }}>Headings:</span>
            <select
              value={headingStyle}
              onChange={(e) => setHeadingStyle(e.target.value as any)}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="atx">ATX (# Heading)</option>
              <option value="setext">Setext (=== / ---)</option>
            </select>
          </div>

          {/* Bullet marker */}
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Bullets:</span>
            <select
              value={bulletMarker}
              onChange={(e) => setBulletMarker(e.target.value as any)}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="-">Dash (-)</option>
              <option value="*">Asterisk (*)</option>
              <option value="+">Plus (+)</option>
            </select>
          </div>

          {/* Code block style */}
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Code:</span>
            <select
              value={codeBlockStyle}
              onChange={(e) => setCodeBlockStyle(e.target.value as any)}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="fenced">Fenced (```)</option>
              <option value="indented">Indented (4 spaces)</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html,text/plain"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Upload size={13} />
            <span>Upload .HTML</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHtmlInput(SAMPLE_HTML);
              setErrorMsg(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={13} />
            <span>Sample HTML</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setHtmlInput('');
              setErrorMsg(null);
            }}
            className="p-1.5 rounded-xl text-xs font-semibold border transition-colors hover:text-red-500 hover:opacity-80"
            title="Clear all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. Error display */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-xs text-red-500">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* 3. Split Editor: HTML Input | Markdown Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: HTML Input */}
        <div 
          className="rounded-2xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <FileCode size={15} style={{ color: 'var(--accent)' }} />
              <span>HTML Source Input</span>
            </div>
            <span className="font-mono text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
              {htmlInput ? `${htmlInput.split('\n').length} lines` : 'Empty'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={htmlInput}
              onChange={(e) => setHtmlInput(e.target.value)}
              placeholder="Paste HTML tags or web markup here..."
              className="w-full h-80 sm:h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right: Markdown Output */}
        <div 
          className="rounded-2xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <FileText size={15} style={{ color: 'var(--accent)' }} />
              <span>Clean Markdown Output</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!markdownOutput}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border disabled:opacity-40"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--bg-surface)',
                  borderColor: copied ? '#10b981' : 'var(--border-subtle)',
                  color: copied ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!markdownOutput}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 border-indigo-600"
              >
                <Download size={13} />
                <span>Download .MD</span>
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              readOnly
              value={markdownOutput}
              placeholder="Rendered Markdown markup will appear here..."
              className="w-full h-80 sm:h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none select-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
