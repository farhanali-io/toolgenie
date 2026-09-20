import React, { useState, useRef, useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  FileCode, 
  Eye, 
  Code, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Sparkles, 
  AlertCircle,
  FileText
} from 'lucide-react';

const SAMPLE_MARKDOWN = `# ToolGenie Markdown Engine

ToolGenie delivers **100% private, client-side** browser utilities. Everything runs on your machine with zero server roundtrips.

## Key Features
- **Fast Execution**: Built with WebAssembly and local JavaScript.
- **Data Privacy**: No files are uploaded to any external server.
- **Theme Support**: Seamlessly transitions across 7 dark and light themes.

### Code Example
\`\`\`typescript
interface ToolConfig {
  name: string;
  category: 'converter-tools' | 'pdf-tools';
  isClientSide: true;
}

const genie: ToolConfig = {
  name: 'Markdown to HTML',
  category: 'converter-tools',
  isClientSide: true,
};
\`\`\`

### Comparison Table
| Feature | Traditional Cloud Converters | ToolGenie Client-Side |
| :--- | :--- | :--- |
| **Privacy** | Uploaded to third-party server | Stays in browser memory |
| **Speed** | Network dependent | Instantaneous |
| **File Limit** | Often restricted / paywalled | Device memory only |

> "Simplicity is prerequisite for reliability." — Edsger W. Dijkstra

---
*Task List:*
- [x] Integrate Marked parser
- [x] Sanitize with DOMPurify
- [x] Export clean HTML`;

export const MarkdownToHtmlWidget: React.FC = () => {
  const [markdownInput, setMarkdownInput] = useState<string>(SAMPLE_MARKDOWN);
  const [activeRightTab, setActiveRightTab] = useState<'preview' | 'html'>('preview');
  const [gfm, setGfm] = useState<boolean>(true);
  const [breaks, setBreaks] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert markdown to sanitized HTML
  const { rawHtml, cleanHtml } = useMemo(() => {
    try {
      marked.setOptions({
        gfm,
        breaks,
      });
      const parsed = marked.parse(markdownInput) as string;
      const sanitized = DOMPurify.sanitize(parsed, {
        ADD_ATTR: ['target', 'rel'],
      });
      return { rawHtml: sanitized, cleanHtml: sanitized };
    } catch (err: any) {
      return { rawHtml: '', cleanHtml: `<p class="text-red-500">Error parsing Markdown: ${err.message}</p>` };
    }
  }, [markdownInput, gfm, breaks]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setMarkdownInput(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read markdown file.');
    };
    reader.readAsText(file);
  };

  const handleCopyHtml = async () => {
    if (!cleanHtml) return;
    try {
      await navigator.clipboard.writeText(cleanHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadHtml = () => {
    if (!cleanHtml) return;
    const fullHtmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    pre { background: #f4f4f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: ui-monospace, monospace; font-size: 0.9em; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #e4e4e7; padding: 8px 12px; text-align: left; }
    th { background: #f4f4f5; }
    blockquote { border-left: 4px solid #6366f1; margin: 0; padding-left: 16px; color: #666; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${cleanHtml}
</body>
</html>`;

    const blob = new Blob([fullHtmlDoc], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${Date.now()}.html`;
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
          <label className="flex items-center gap-2 cursor-pointer font-medium select-none" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={gfm}
              onChange={(e) => setGfm(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
            />
            <span>GitHub Flavored Markdown</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium select-none" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={breaks}
              onChange={(e) => setBreaks(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
            />
            <span>Hard Line Breaks</span>
          </label>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
            DOMPurify XSS Sanitized
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
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
            <span>Upload .MD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMarkdownInput(SAMPLE_MARKDOWN);
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
            <span>Sample MD</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMarkdownInput('');
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

      {/* 2. Error message */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-xs text-red-500">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline">Dismiss</button>
        </div>
      )}

      {/* 3. Split Editor: Markdown Input | Live HTML Preview & Raw Markup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Markdown Editor */}
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
              <span>Markdown Source</span>
            </div>
            <span className="font-mono text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
              {markdownInput.length} chars • {markdownInput.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="Type or paste Markdown here..."
              className="w-full h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right Column: Preview / HTML Tabs */}
        <div 
          className="rounded-2xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-4 py-2 border-b flex flex-wrap items-center justify-between gap-2 text-xs"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveRightTab('preview')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  activeRightTab === 'preview' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: activeRightTab === 'preview' ? 'var(--bg-surface)' : 'transparent',
                  color: activeRightTab === 'preview' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Eye size={13} />
                <span>Live Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveRightTab('html')}
                className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  activeRightTab === 'html' ? 'shadow-xs' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: activeRightTab === 'html' ? 'var(--bg-surface)' : 'transparent',
                  color: activeRightTab === 'html' ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}
              >
                <Code size={13} />
                <span>HTML Code</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyHtml}
                disabled={!cleanHtml}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border disabled:opacity-40"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--bg-surface)',
                  borderColor: copied ? '#10b981' : 'var(--border-subtle)',
                  color: copied ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied HTML' : 'Copy HTML'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadHtml}
                disabled={!cleanHtml}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 border-indigo-600"
              >
                <Download size={13} />
                <span>Download .HTML</span>
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            {activeRightTab === 'preview' ? (
              <div 
                className="w-full h-96 p-4 rounded-xl border overflow-y-auto prose prose-sm max-w-none leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                dangerouslySetInnerHTML={{ __html: cleanHtml || '<p class="text-xs opacity-50">Nothing to preview yet.</p>' }}
              />
            ) : (
              <textarea
                readOnly
                value={cleanHtml}
                placeholder="Raw HTML code will appear here..."
                className="w-full h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none select-all"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
