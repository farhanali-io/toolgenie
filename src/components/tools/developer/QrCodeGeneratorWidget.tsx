import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  Settings2, 
  Sparkles, 
  ExternalLink,
  RefreshCw 
} from 'lucide-react';

export const QrCodeGeneratorWidget: React.FC = () => {
  const [inputText, setInputText] = useState('https://toolgenie.online');
  const [size, setSize] = useState<number>(512);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [darkColor, setDarkColor] = useState('#000000');
  const [lightColor, setLightColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [svgDataUrl, setSvgDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const generate = async () => {
      if (!inputText.trim()) {
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        setSvgDataUrl('');
        return;
      }

      setIsGenerating(true);
      try {
        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, inputText, {
            width: size,
            margin: 2,
            errorCorrectionLevel: errorCorrectionLevel,
            color: {
              dark: darkColor,
              light: lightColor
            }
          });
        }

        const svgString = await QRCode.toString(inputText, {
          type: 'svg',
          margin: 2,
          errorCorrectionLevel: errorCorrectionLevel,
          color: {
            dark: darkColor,
            light: lightColor
          }
        });

        if (!isCancelled) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          setSvgDataUrl(URL.createObjectURL(blob));
          setIsGenerating(false);
        }
      } catch (err) {
        console.error('QR code generation error:', err);
        if (!isCancelled) setIsGenerating(false);
      }
    };

    generate();

    return () => {
      isCancelled = true;
    };
  }, [inputText, size, errorCorrectionLevel, darkColor, lightColor]);

  const handleDownloadPng = () => {
    if (!canvasRef.current || !inputText) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `qrcode-${size}x${size}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgDataUrl) return;
    const a = document.createElement('a');
    a.href = svgDataUrl;
    a.download = 'qrcode.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob && navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      });
    } catch (e) {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Controls & Input */}
        <div className="lg:col-span-7 space-y-5">
          {/* Content Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Text or URL Content
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputText('https://toolgenie.online')}
                  className="text-xs font-medium hover:underline flex items-center gap-1"
                  style={{ color: 'var(--accent)' }}
                >
                  <Sparkles size={12} />
                  <span>Default URL</span>
                </button>
              </div>
            </div>
            <textarea
              id="qr-text-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter web link, text, phone number, or Wi-Fi credentials..."
              rows={3}
              className="w-full p-3.5 text-xs sm:text-sm rounded-xl border outline-none font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Resolution/Size */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                PNG Export Size
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

            {/* Error Correction */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Error Correction Level
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
                      <span className="text-[9px] opacity-75 font-normal">{labels[lvl]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color pickers */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                QR Foreground Color
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              >
                <input
                  type="color"
                  value={darkColor}
                  onChange={(e) => setDarkColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                  {darkColor.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Background Color
              </label>
              <div className="flex items-center gap-2 p-1.5 rounded-xl border"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              >
                <input
                  type="color"
                  value={lightColor}
                  onChange={(e) => setLightColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                  {lightColor.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Interactive Live Preview & Actions */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div 
            className="p-6 rounded-2xl border flex flex-col items-center justify-center relative shadow-sm max-w-full"
            style={{ 
              backgroundColor: lightColor, 
              borderColor: 'var(--border-subtle)',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)'
            }}
          >
            {/* Visual Canvas */}
            <canvas 
              ref={canvasRef} 
              className="max-w-[220px] max-h-[220px] sm:max-w-[260px] sm:max-h-[260px] w-full aspect-square rounded-lg object-contain"
            />

            {!inputText.trim() && (
              <div className="text-xs text-zinc-400 py-8 text-center font-medium">
                Enter text or a link on the left to preview QR code
              </div>
            )}
          </div>

          {/* Export Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 w-full">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={!inputText.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              <Download size={14} />
              <span>Download PNG ({size}px)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={!inputText.trim() || !svgDataUrl}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <Download size={14} />
              <span>Vector SVG</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={!inputText.trim()}
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
