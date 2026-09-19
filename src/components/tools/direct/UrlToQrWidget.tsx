import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  Link2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Globe,
  ShieldCheck 
} from 'lucide-react';

export const UrlToQrWidget: React.FC = () => {
  const [rawUrl, setRawUrl] = useState('https://toolgenie.online');
  const [size, setSize] = useState<number>(512);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [copied, setCopied] = useState(false);
  const [svgUrl, setSvgUrl] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sanitize URL by ensuring https:// protocol exists
  const sanitizedUrl = React.useMemo(() => {
    let u = rawUrl.trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u)) {
      u = 'https://' + u;
    }
    return u;
  }, [rawUrl]);

  useEffect(() => {
    let isCancelled = false;

    const renderQr = async () => {
      if (!sanitizedUrl) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setSvgUrl('');
        return;
      }

      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, sanitizedUrl, {
            width: size,
            margin: 2,
            errorCorrectionLevel: errorCorrectionLevel,
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
        }

        const svgStr = await QRCode.toString(sanitizedUrl, {
          type: 'svg',
          margin: 2,
          errorCorrectionLevel: errorCorrectionLevel,
          color: {
            dark: '#0f172a',
            light: '#ffffff'
          }
        });

        if (!isCancelled) {
          const blob = new Blob([svgStr], { type: 'image/svg+xml' });
          setSvgUrl(URL.createObjectURL(blob));
        }
      } catch (err) {
        console.error(err);
      }
    };

    renderQr();

    return () => {
      isCancelled = true;
    };
  }, [sanitizedUrl, size, errorCorrectionLevel]);

  const handleDownloadPng = () => {
    if (!canvasRef.current || !sanitizedUrl) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `url-qr-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgUrl) return;
    const a = document.createElement('a');
    a.href = svgUrl;
    a.download = 'url-qr.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyImage = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (blob && navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    });
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input & Options */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Target Web Address (URL)
              </label>
              <button
                type="button"
                onClick={() => setRawUrl('https://toolgenie.online')}
                className="text-xs font-medium hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                <Sparkles size={12} />
                <span>Default Link</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                <Globe size={16} />
              </div>
              <input
                id="url-qr-input"
                type="text"
                value={rawUrl}
                onChange={(e) => setRawUrl(e.target.value)}
                placeholder="example.com or https://..."
                className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm rounded-xl border outline-none font-mono"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              {sanitizedUrl && (
                <a
                  href={sanitizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                  title="Test link in new tab"
                >
                  <ExternalLink size={15} style={{ color: 'var(--accent)' }} />
                </a>
              )}
            </div>
            {rawUrl && !/^https?:\/\//i.test(rawUrl) && (
              <div className="text-[11px] mt-1.5 text-emerald-500 font-medium">
                Auto-prefixing protocol: <code className="underline">{sanitizedUrl}</code>
              </div>
            )}
          </div>

          {/* Size & Error Correction Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Image Dimensions
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[256, 512, 1024, 2048].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      size === s ? 'ring-2' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      borderColor: 'var(--border-subtle)',
                      color: size === s ? 'var(--accent)' : 'var(--text-secondary)',
                      boxShadow: size === s ? '0 0 0 2px var(--accent)' : 'none'
                    }}
                  >
                    {s}px
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Error Correction
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['L', 'M', 'Q', 'H'] as const).map((lvl) => {
                  const labels = { L: '7%', M: '15%', Q: '25%', H: '30%' };
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setErrorCorrectionLevel(lvl)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-all flex flex-col items-center ${
                        errorCorrectionLevel === lvl ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-subtle)',
                        color: errorCorrectionLevel === lvl ? 'var(--accent)' : 'var(--text-secondary)',
                        boxShadow: errorCorrectionLevel === lvl ? '0 0 0 2px var(--accent)' : 'none'
                      }}
                    >
                      <span>{lvl}</span>
                      <span className="text-[9px] opacity-75">{labels[lvl]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview and Export */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div 
            className="p-6 rounded-2xl border flex flex-col items-center justify-center bg-white shadow-sm max-w-full"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <canvas 
              ref={canvasRef} 
              className="max-w-[220px] max-h-[220px] sm:max-w-[260px] sm:max-h-[260px] w-full aspect-square rounded-lg object-contain"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 w-full">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!sanitizedUrl}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              <Download size={14} />
              <span>Download PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!sanitizedUrl || !svgUrl}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <Download size={14} />
              <span>SVG</span>
            </button>

            <button
              type="button"
              onClick={handleCopyImage}
              disabled={!sanitizedUrl}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
