import React, { useState, useEffect, useRef } from 'react';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  Download, 
  AlertCircle, 
  RefreshCw, 
  Sliders, 
  ArrowRightLeft, 
  ImageIcon 
} from 'lucide-react';

type TargetFormat = 'jpeg' | 'png' | 'webp';

export const ImageConverterWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>('png');
  const [quality, setQuality] = useState<number>(90);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [convertedSize, setConvertedSize] = useState<number>(0);
  const [convertedPreviewUrl, setConvertedPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeUrlRef = useRef<string | null>(null);

  const cleanupActiveUrl = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupActiveUrl();
  }, []);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    if (!selected.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file.');
      return;
    }

    setErrorMessage(null);
    cleanupActiveUrl();
    setConvertedBlob(null);
    setConvertedPreviewUrl(null);

    try {
      const url = await readFileAsDataURL(selected);
      setFile(selected);
      setDataUrl(url);

      // Default target format to something different than current
      const currentType = selected.type;
      if (currentType.includes('png')) {
        setTargetFormat('jpeg');
      } else if (currentType.includes('jpeg') || currentType.includes('jpg')) {
        setTargetFormat('webp');
      } else {
        setTargetFormat('png');
      }
    } catch {
      setErrorMessage('Could not read image file.');
    }
  };

  // Perform conversion
  useEffect(() => {
    if (!dataUrl || !file) return;

    let isMounted = true;
    setIsProcessing(true);

    const timer = setTimeout(async () => {
      try {
        const img = await loadImage(dataUrl);
        if (!isMounted) return;

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context unavailable.');

        // If converting to JPEG, fill white background to handle transparency nicely
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const mimeMap: Record<TargetFormat, string> = {
          jpeg: 'image/jpeg',
          png: 'image/png',
          webp: 'image/webp'
        };

        const targetMime = mimeMap[targetFormat];
        const q = targetFormat === 'png' ? undefined : quality / 100;

        canvas.toBlob((blob) => {
          if (!isMounted || !blob) {
            setIsProcessing(false);
            return;
          }

          cleanupActiveUrl();
          const newUrl = URL.createObjectURL(blob);
          activeUrlRef.current = newUrl;

          setConvertedBlob(blob);
          setConvertedSize(blob.size);
          setConvertedPreviewUrl(newUrl);
          setIsProcessing(false);
        }, targetMime, q);
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err?.message || 'Failed to convert image.');
          setIsProcessing(false);
        }
      }
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [dataUrl, targetFormat, quality, file]);

  const handleDownload = () => {
    if (!convertedBlob || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const extension = targetFormat === 'jpeg' ? 'jpg' : targetFormat;
    downloadBlob(convertedBlob, `${baseName}.${extension}`);
  };

  const handleReset = () => {
    cleanupActiveUrl();
    setFile(null);
    setDataUrl(null);
    setConvertedBlob(null);
    setConvertedPreviewUrl(null);
    setErrorMessage(null);
  };

  const getSourceExtension = (f: File) => {
    const ext = f.name.split('.').pop()?.toUpperCase();
    return ext || f.type.split('/')[1]?.toUpperCase() || 'IMG';
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="image/*"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop image to convert"
          description="Convert instantly between PNG, JPG, and WebP formats right in your browser"
          accentColor="var(--accent)"
        />
      ) : (
        <div 
          className="rounded-2xl border p-5 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500">
                <ImageIcon size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  Format: {getSourceExtension(file)} • {formatBytes(file.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border hover:opacity-80 cursor-pointer shrink-0"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              Change image
            </button>
          </div>

          {/* Target Format Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Target Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['jpeg', 'png', 'webp'] as TargetFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setTargetFormat(fmt)}
                  className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    targetFormat === fmt ? 'ring-2' : ''
                  }`}
                  style={{
                    backgroundColor: targetFormat === fmt ? 'var(--bg-input)' : 'var(--bg-page)',
                    borderColor: targetFormat === fmt ? 'var(--accent)' : 'var(--border-subtle)',
                    ['--tw-ring-color' as any]: 'var(--accent)'
                  }}
                >
                  <p className="font-mono font-bold text-sm sm:text-base uppercase" style={{ color: 'var(--text-primary)' }}>
                    {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {fmt === 'jpeg' ? 'Smaller size' : fmt === 'png' ? 'Lossless' : 'Next-gen web'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Quality Slider for lossy formats */}
          {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
            <div className="p-4 rounded-xl border space-y-2.5" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={15} style={{ color: 'var(--accent)' }} />
                  <label htmlFor="convert-quality-range" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                    Quality ({targetFormat.toUpperCase()})
                  </label>
                </div>
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
                  {quality}%
                </span>
              </div>
              <input
                id="convert-quality-range"
                type="range"
                min="10"
                max="100"
                value={quality}
                onChange={e => setQuality(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          )}

          {/* Output Preview & Stats */}
          {convertedPreviewUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Converted Preview
                </span>
                <span className="font-mono font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Output size: {formatBytes(convertedSize)}
                </span>
              </div>

              <div 
                className="rounded-xl border p-4 flex items-center justify-center max-h-80 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <img
                  src={convertedPreviewUrl}
                  alt="Converted preview"
                  className="max-h-72 w-auto max-w-full rounded-lg object-contain shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing || !convertedBlob}
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download {targetFormat === 'jpeg' ? 'JPG' : targetFormat.toUpperCase()} ({formatBytes(convertedSize)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl border flex items-start gap-3 text-sm bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
