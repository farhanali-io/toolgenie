import React, { useState } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../../utils/fileHelpers';
import { 
  RotateCw, 
  RotateCcw, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Repeat 
} from 'lucide-react';

export const RotatePdfWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [targetScope, setTargetScope] = useState<'all' | 'custom'>('all');
  const [customPagesStr, setCustomPagesStr] = useState('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultSize, setResultSize] = useState(0);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF file.');
      return;
    }

    setErrorMessage(null);
    setResultBlob(null);
    setIsProcessing(true);
    setProgressText('Reading document structure...');

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setFile(selected);
      setPageCount(count);
      setCustomPagesStr(count > 1 ? '1' : '1');
    } catch (err: any) {
      setErrorMessage(
        err?.message?.includes('encrypted') || err?.message?.includes('password')
          ? 'This PDF is password-protected. Please unlock it before rotating.'
          : 'Could not read PDF. The document may be corrupted.'
      );
      setFile(null);
      setPageCount(0);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const parseTargetPageIndices = (str: string, maxPages: number): number[] => {
    const pagesSet = new Set<number>();
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
          throw new Error(`Invalid page range "${part}".`);
        }
        for (let i = start; i <= end; i++) {
          if (i <= maxPages) pagesSet.add(i - 1);
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1) {
          throw new Error(`Invalid page number "${part}".`);
        }
        if (page <= maxPages) pagesSet.add(page - 1);
      }
    }

    return Array.from(pagesSet);
  };

  const handleRotate = async () => {
    if (!file || pageCount === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResultBlob(null);
    setProgressText('Applying page rotations...');

    try {
      await new Promise(r => setTimeout(r, 20));

      const buffer = await readFileAsArrayBuffer(file);
      const doc = await PDFDocument.load(buffer);
      const pages = doc.getPages();

      let targetIndices: number[] = [];
      if (targetScope === 'all') {
        targetIndices = pages.map((_, idx) => idx);
      } else {
        targetIndices = parseTargetPageIndices(customPagesStr, pageCount);
        if (targetIndices.length === 0) {
          throw new Error('No valid pages selected to rotate.');
        }
      }

      for (const idx of targetIndices) {
        const page = pages[idx];
        const currentRotation = page.getRotation().angle;
        const newAngle = (currentRotation + rotationAngle) % 360;
        page.setRotation(degrees(newAngle));
      }

      setProgressText('Saving rotated PDF...');
      await new Promise(r => setTimeout(r, 20));
      const bytes = await doc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });

      setResultBlob(blob);
      setResultSize(bytes.byteLength);
      setProgressText('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to rotate PDF pages.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(resultBlob, `${baseName}-rotated.pdf`);
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResultBlob(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="application/pdf,.pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop PDF to rotate"
          description="Rotate all pages or specific sheets by 90°, 180°, or 270° degrees"
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
          {/* File Header */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                <FileText size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-sm sm:text-base truncate" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  {formatBytes(file.size)} • {pageCount} pages detected
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
              Choose different file
            </button>
          </div>

          {/* Rotation Direction Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Rotation Angle
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRotationAngle(90)}
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  rotationAngle === 90 ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: rotationAngle === 90 ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: rotationAngle === 90 ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <RotateCw size={18} style={{ color: 'var(--accent)' }} />
                <div className="text-left">
                  <p className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>90° Clockwise</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Turn right</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRotationAngle(180)}
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  rotationAngle === 180 ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: rotationAngle === 180 ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: rotationAngle === 180 ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <Repeat size={18} style={{ color: 'var(--accent)' }} />
                <div className="text-left">
                  <p className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>180° Flip</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Upside down</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRotationAngle(270)}
                className={`p-3.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  rotationAngle === 270 ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: rotationAngle === 270 ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: rotationAngle === 270 ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <RotateCcw size={18} style={{ color: 'var(--accent)' }} />
                <div className="text-left">
                  <p className="font-bold text-xs sm:text-sm" style={{ color: 'var(--text-primary)' }}>270° (90° CCW)</p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Turn left</p>
                </div>
              </button>
            </div>
          </div>

          {/* Scope Selection (All Pages vs Custom Range) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Pages to Rotate
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'all'}
                  onChange={() => setTargetScope('all')}
                  className="accent-indigo-600"
                />
                <span>All {pageCount} pages</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'custom'}
                  onChange={() => setTargetScope('custom')}
                  className="accent-indigo-600"
                />
                <span>Selected pages only</span>
              </label>
            </div>

            {targetScope === 'custom' && (
              <div className="p-4 rounded-xl border space-y-1.5" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
                <label htmlFor="custom-pages-input" className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                  Enter page numbers or ranges (e.g. 1, 3-4):
                </label>
                <input
                  id="custom-pages-input"
                  type="text"
                  value={customPagesStr}
                  onChange={e => setCustomPagesStr(e.target.value)}
                  placeholder="e.g. 1, 3, 5-7"
                  className="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleRotate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm shadow-md transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Rotating Pages...</span>
                </>
              ) : (
                <>
                  <RotateCw size={16} />
                  <span>Apply {rotationAngle}° Rotation</span>
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
            <p className="font-semibold">Rotation Notice</p>
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
              PDF Pages Rotated Successfully!
            </h4>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your updated document is ready ({formatBytes(resultSize)}).
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>Download Rotated PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
