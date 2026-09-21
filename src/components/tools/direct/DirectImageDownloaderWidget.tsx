import React, { useState } from 'react';
import { 
  DownloadCloud, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  RefreshCw, 
  Image as ImageIcon,
  ArrowRight
} from 'lucide-react';

const SAMPLE_IMAGE_URL = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80';

export const DirectImageDownloaderWidget: React.FC = () => {
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGE_URL);
  const [customFilename, setCustomFilename] = useState('downloaded-image');
  const [status, setStatus] = useState<'idle' | 'fetching' | 'success' | 'cors_error' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadedBlobUrl, setDownloadedBlobUrl] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  const handleFetchAndDownload = async () => {
    const trimmed = imageUrl.trim();
    if (!trimmed) return;

    setStatus('fetching');
    setErrorMessage('');
    if (downloadedBlobUrl) {
      URL.revokeObjectURL(downloadedBlobUrl);
      setDownloadedBlobUrl(null);
    }

    try {
      // Validate URL format
      const parsedUrl = new URL(trimmed);

      // Attempt client-side fetch
      const response = await fetch(trimmed, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) {
        throw new Error(`Remote server responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'image/jpeg';
      setMimeType(contentType);

      const blob = await response.blob();
      setFileSize(blob.size);

      // Create Blob URL for downloading
      const blobUrl = URL.createObjectURL(blob);
      setDownloadedBlobUrl(blobUrl);

      // Derive extension
      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';
      else if (contentType.includes('svg')) ext = 'svg';

      // Trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${customFilename || 'downloaded-image'}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatus('success');
    } catch (err: any) {
      // Gracefully detect CORS failure or network error
      const isCors = 
        err.name === 'TypeError' || 
        err.message?.includes('Failed to fetch') || 
        err.message?.includes('NetworkError') ||
        err.message?.includes('CORS');

      if (isCors) {
        setStatus('cors_error');
        setErrorMessage(
          "The hosting website's server restricts direct browser downloads through its Cross-Origin Resource Sharing (CORS) policy. Modern browsers block client-side scripts from reading assets from servers that have not enabled Access-Control-Allow-Origin headers."
        );
      } else {
        setStatus('error');
        setErrorMessage(err.message || 'Unable to download image from the provided link.');
      }
    }
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* URL Input Form */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Direct Image URL (.jpg, .png, .webp, .svg)
            </label>
            <button
              type="button"
              onClick={() => {
                setImageUrl(SAMPLE_IMAGE_URL);
                setStatus('idle');
              }}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={12} />
              <span>Use Test Direct Image</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setStatus('idle');
              }}
              placeholder="https://example.com/photo.jpg"
              className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm rounded-xl border outline-none font-mono transition-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
            {imageUrl && (
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Open link in new tab"
              >
                <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
              </a>
            )}
          </div>
        </div>

        {/* Custom Filename */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Save As Filename
            </label>
            <input
              type="text"
              value={customFilename}
              onChange={(e) => setCustomFilename(e.target.value)}
              placeholder="downloaded-image"
              className="w-full px-3.5 py-2 text-xs rounded-xl border outline-none font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleFetchAndDownload}
              disabled={!imageUrl.trim() || status === 'fetching'}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {status === 'fetching' ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Fetching Image via Blob...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={16} />
                  <span>Fetch & Download Image</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {status === 'success' && (
        <div className="mt-5 p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 text-xs">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-sm mb-0.5">Image Downloaded Successfully!</div>
            <div>
              Processed {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : ''} ({mimeType}) locally. The file has been saved to your browser downloads folder.
            </div>
          </div>
        </div>
      )}

      {/* Graceful CORS Failure Callout (USER DIRECTIVE MANDATE) */}
      {status === 'cors_error' && (
        <div className="mt-5 p-5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-sm">Direct Browser Download Blocked by Host (CORS Restriction)</h4>
              <p className="text-xs leading-relaxed opacity-90">
                {errorMessage}
              </p>
            </div>
          </div>

          <div 
            className="p-3.5 rounded-lg border text-xs space-y-2"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="font-semibold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>How to download and verify this file safely:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <li>
                Right-click the link or open it in a new tab: <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="underline font-mono text-[11px] break-all">{imageUrl}</a>
              </li>
              <li>Select <strong>"Save Image As..."</strong> to save it directly to your device.</li>
              <li>
                Verify its integrity and checksum using ToolGenie's offline File Hash Checker.
              </li>
            </ol>

            <div className="pt-2">
              <a
                href="/direct-link-tools/file-hash-checker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
              >
                <span>Go to File Hash Checker</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {status === 'error' && (
        <div className="mt-5 p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Download Failed</div>
            <div className="text-xs mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Zero Server Uploads Badge */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t text-xs"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Direct browser-to-server connection • Zero proxy logging</span>
        </div>
        <span>Supports JPG, PNG, WebP, GIF, SVG</span>
      </div>
    </div>
  );
};
