import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsArrayBuffer, readFileAsDataURL, loadImage } from '../../../utils/fileHelpers';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Image as ImageIcon, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  FileCheck 
} from 'lucide-react';

interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  dataUrl: string;
}

type PageSizeOption = 'a4' | 'letter' | 'fit';
type MarginOption = 'none' | 'small' | 'normal' | 'large';

export const ImageToPdfWidget: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSizeOption>('a4');
  const [margin, setMargin] = useState<MarginOption>('small');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const handleFilesSelected = async (files: File[]) => {
    setErrorMessage(null);
    setResultBlob(null);

    const validImages = files.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) {
      setErrorMessage('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const items: ImageItem[] = [];
    for (const file of validImages) {
      const dataUrl = await readFileAsDataURL(file);
      items.push({
        id: `${file.name}-${file.size}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        dataUrl
      });
    }

    setImages(prev => [...prev, ...items]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const updated = [...images];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setImages(updated);
    setResultBlob(null);
  };

  const removeItem = (id: string) => {
    setImages(prev => prev.filter(item => item.id !== id));
    setResultBlob(null);
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResultBlob(null);
    setProgressText('Initializing PDF layout engine...');

    try {
      await new Promise(r => setTimeout(r, 20));

      const pdfDoc = await PDFDocument.create();

      // Page dimensions in PDF points (72 points = 1 inch)
      const pagePresets: Record<PageSizeOption, { width: number; height: number } | null> = {
        a4: { width: 595.28, height: 841.89 },
        letter: { width: 612, height: 792 },
        fit: null
      };

      const marginPoints: Record<MarginOption, number> = {
        none: 0,
        small: 18,
        normal: 36,
        large: 54
      };

      const pad = marginPoints[margin];

      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setProgressText(`Converting image ${i + 1} of ${images.length} (${item.name})...`);
        await new Promise(r => setTimeout(r, 10));

        let embeddedImage;
        const fileType = item.file.type.toLowerCase();

        if (fileType === 'image/jpeg' || fileType === 'image/jpg') {
          const buffer = await readFileAsArrayBuffer(item.file);
          embeddedImage = await pdfDoc.embedJpg(buffer);
        } else if (fileType === 'image/png') {
          const buffer = await readFileAsArrayBuffer(item.file);
          embeddedImage = await pdfDoc.embedPng(buffer);
        } else {
          // Convert WebP or other browser-supported image format to PNG via canvas
          const img = await loadImage(item.dataUrl);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas 2D context unavailable.');
          ctx.drawImage(img, 0, 0);

          const pngDataUrl = canvas.toDataURL('image/png');
          const res = await fetch(pngDataUrl);
          const buffer = await res.arrayBuffer();
          embeddedImage = await pdfDoc.embedPng(buffer);
        }

        const imgWidth = embeddedImage.width;
        const imgHeight = embeddedImage.height;

        let pageWidth: number;
        let pageHeight: number;
        let drawX: number;
        let drawY: number;
        let drawWidth: number;
        let drawHeight: number;

        if (pageSize === 'fit') {
          pageWidth = imgWidth + pad * 2;
          pageHeight = imgHeight + pad * 2;
          drawWidth = imgWidth;
          drawHeight = imgHeight;
          drawX = pad;
          drawY = pad;
        } else {
          const preset = pagePresets[pageSize]!;
          pageWidth = preset.width;
          pageHeight = preset.height;

          const availableWidth = Math.max(10, pageWidth - pad * 2);
          const availableHeight = Math.max(10, pageHeight - pad * 2);

          // Calculate scale to fit inside margins while preserving aspect ratio
          const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
          drawWidth = imgWidth * scale;
          drawHeight = imgHeight * scale;

          // Center image on page
          drawX = (pageWidth - drawWidth) / 2;
          drawY = (pageHeight - drawHeight) / 2;
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawWidth,
          height: drawHeight
        });
      }

      setProgressText('Compiling PDF...');
      await new Promise(r => setTimeout(r, 20));

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setResultBlob(blob);
      setResultSize(pdfBytes.byteLength);
      setProgressText('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate PDF from images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const baseName = images[0]?.name.replace(/\.[^/.]+$/, '') || 'images';
    downloadBlob(resultBlob, `${baseName}-converted.pdf`);
  };

  const handleReset = () => {
    setImages([]);
    setResultBlob(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <DropZone
        accept="image/png,image/jpeg,image/webp,image/jpg"
        multiple={true}
        onFilesSelected={handleFilesSelected}
        title="Choose or drop images here"
        description="Convert JPG, PNG, and WebP images into a high-quality PDF document"
        accentColor="var(--accent)"
      />

      {images.length > 0 && (
        <div 
          className="rounded-2xl border p-5 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          {/* Controls: Page Size & Margins */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <label htmlFor="page-size-select" className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Page Size
              </label>
              <select
                id="page-size-select"
                value={pageSize}
                onChange={e => setPageSize(e.target.value as PageSizeOption)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="a4">A4 (Standard Document)</option>
                <option value="letter">US Letter</option>
                <option value="fit">Fit to Image (Exact Image Dimensions)</option>
              </select>
            </div>

            <div>
              <label htmlFor="page-margin-select" className="text-xs font-bold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
                Page Margins
              </label>
              <select
                id="page-margin-select"
                value={margin}
                onChange={e => setMargin(e.target.value as MarginOption)}
                className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <option value="none">No Margins (Edge to Edge)</option>
                <option value="small">Small Margin (0.25 inch)</option>
                <option value="normal">Standard Margin (0.5 inch)</option>
                <option value="large">Large Margin (0.75 inch)</option>
              </select>
            </div>
          </div>

          {/* Selected Images List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs pb-2">
              <span className="font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Images ({images.length}) • Arrange order
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="hover:underline text-red-500 font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {images.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={item.dataUrl} 
                      alt={item.name} 
                      className="w-12 h-12 rounded-lg object-cover border shrink-0"
                      style={{ borderColor: 'var(--border-subtle)' }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {idx + 1}. {item.name}
                      </p>
                      <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                        {formatBytes(item.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0 || isProcessing}
                      onClick={() => moveItem(idx, 'up')}
                      className="p-1.5 rounded-lg border hover:opacity-80 disabled:opacity-30 cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      aria-label="Move earlier"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === images.length - 1 || isProcessing}
                      onClick={() => moveItem(idx, 'down')}
                      className="p-1.5 rounded-lg border hover:opacity-80 disabled:opacity-30 cursor-pointer"
                      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      aria-label="Move later"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg border hover:bg-red-500/10 text-red-500 border-red-500/20 cursor-pointer"
                      aria-label="Remove image"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleGeneratePdf}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm shadow-md transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Converting Images...</span>
                </>
              ) : (
                <>
                  <FileCheck size={16} />
                  <span>Convert {images.length} Image{images.length > 1 ? 's' : ''} to PDF</span>
                </>
              )}
            </button>

            {progressText && (
              <span className="text-xs font-medium animate-pulse" style={{ color: 'var(--text-secondary)' }}>
                {progressText}
              </span>
            )}
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

      {/* Success Result Area */}
      {resultBlob && (
        <div 
          className="rounded-2xl border p-6 text-center space-y-4 animate-in fade-in"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.08)'
          }}
        >
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 size={24} />
          </div>

          <div>
            <h4 className="font-heading text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              PDF Generated Successfully!
            </h4>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Created document containing {images.length} image{images.length > 1 ? 's' : ''} ({formatBytes(resultSize)}).
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
