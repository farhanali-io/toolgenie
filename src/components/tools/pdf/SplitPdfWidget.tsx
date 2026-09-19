import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../../utils/fileHelpers';
import { 
  Scissors, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Archive,
  Layers
} from 'lucide-react';

type SplitMode = 'range' | 'every-n';

export const SplitPdfWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<SplitMode>('range');
  const [pageRangeStr, setPageRangeStr] = useState('1');
  const [everyN, setEveryN] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultFilename, setResultFilename] = useState('');
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
    setProgressText('Inspecting PDF pages...');

    try {
      const buffer = await readFileAsArrayBuffer(selected);
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setFile(selected);
      setPageCount(count);
      setPageRangeStr(count > 1 ? `1-${Math.min(count, 3)}` : '1');
    } catch (err: any) {
      setErrorMessage(
        err?.message?.includes('encrypted') || err?.message?.includes('password')
          ? 'This PDF is password-protected. Please unlock it before splitting.'
          : 'Could not read PDF. The document may be corrupted.'
      );
      setFile(null);
      setPageCount(0);
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const parseRangeString = (str: string, maxPages: number): number[] => {
    const pagesSet = new Set<number>();
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
          throw new Error(`Invalid range "${part}". Example format: 1-3, 5, 7-9`);
        }
        for (let i = start; i <= end; i++) {
          if (i <= maxPages) {
            pagesSet.add(i - 1); // 0-indexed
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (isNaN(page) || page < 1) {
          throw new Error(`Invalid page number "${part}".`);
        }
        if (page <= maxPages) {
          pagesSet.add(page - 1); // 0-indexed
        }
      }
    }

    const sorted = Array.from(pagesSet).sort((a, b) => a - b);
    if (sorted.length === 0) {
      throw new Error(`Specified pages are out of range (PDF has ${maxPages} pages).`);
    }
    return sorted;
  };

  const handleSplit = async () => {
    if (!file || pageCount === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResultBlob(null);

    try {
      const buffer = await readFileAsArrayBuffer(file);
      const sourceDoc = await PDFDocument.load(buffer);
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      if (splitMode === 'range') {
        setProgressText('Extracting chosen pages...');
        await new Promise(r => setTimeout(r, 20));

        const pageIndices = parseRangeString(pageRangeStr, pageCount);
        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(sourceDoc, pageIndices);
        copiedPages.forEach(p => newPdf.addPage(p));

        const bytes = await newPdf.save();
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        setResultBlob(blob);
        setResultFilename(`${baseName}-extracted.pdf`);
        setResultSize(bytes.byteLength);
      } else {
        // split every N pages
        const step = Math.max(1, everyN);
        setProgressText(`Splitting document every ${step} page(s)...`);
        await new Promise(r => setTimeout(r, 20));

        const zip = new JSZip();
        let chunkIndex = 1;

        for (let start = 0; start < pageCount; start += step) {
          const end = Math.min(start + step, pageCount);
          const indices: number[] = [];
          for (let i = start; i < end; i++) indices.push(i);

          const chunkPdf = await PDFDocument.create();
          const copied = await chunkPdf.copyPages(sourceDoc, indices);
          copied.forEach(p => chunkPdf.addPage(p));
          const chunkBytes = await chunkPdf.save();

          const chunkName = `${baseName}_part_${chunkIndex}_pages_${start + 1}-${end}.pdf`;
          zip.file(chunkName, chunkBytes);
          chunkIndex++;

          setProgressText(`Generated part ${chunkIndex - 1}...`);
          await new Promise(r => setTimeout(r, 5));
        }

        setProgressText('Creating ZIP archive...');
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setResultBlob(zipBlob);
        setResultFilename(`${baseName}-split-parts.zip`);
        setResultSize(zipBlob.size);
      }

      setProgressText('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to split PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPageCount(0);
    setResultBlob(null);
    setErrorMessage(null);
    setProgressText('');
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <DropZone
          accept="application/pdf,.pdf"
          multiple={false}
          onFilesSelected={handleFileSelected}
          title="Choose or drop PDF to split"
          description="Extract specific pages or break a multi-page PDF into smaller documents"
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
          {/* Loaded PDF info */}
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

          {/* Mode Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider block" style={{ color: 'var(--text-muted)' }}>
              Split Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSplitMode('range')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'range' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: splitMode === 'range' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: splitMode === 'range' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Scissors size={16} style={{ color: 'var(--accent)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Extract Page Range
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Extract specific pages into a single new PDF (e.g., &ldquo;1-3, 5&rdquo;).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSplitMode('every-n')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  splitMode === 'every-n' ? 'ring-2' : ''
                }`}
                style={{
                  backgroundColor: splitMode === 'every-n' ? 'var(--bg-input)' : 'var(--bg-page)',
                  borderColor: splitMode === 'every-n' ? 'var(--accent)' : 'var(--border-subtle)',
                  ['--tw-ring-color' as any]: 'var(--accent)'
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Layers size={16} style={{ color: 'var(--accent)' }} />
                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    Split Every N Pages
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Break into separate PDFs every N pages, packaged into a ZIP.
                </p>
              </button>
            </div>
          </div>

          {/* Mode-specific options */}
          {splitMode === 'range' ? (
            <div className="space-y-2 p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <label htmlFor="page-range-input" className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Page Selection (1 to {pageCount}):
              </label>
              <input
                id="page-range-input"
                type="text"
                value={pageRangeStr}
                onChange={e => setPageRangeStr(e.target.value)}
                placeholder="e.g. 1-3, 5, 8"
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              />
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Use commas for individual pages and hyphens for page spans. Total pages: {pageCount}.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
              <label htmlFor="split-every-n-input" className="text-xs font-semibold block" style={{ color: 'var(--text-primary)' }}>
                Split interval (pages per document):
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="split-every-n-input"
                  type="number"
                  min="1"
                  max={pageCount}
                  value={everyN}
                  onChange={e => setEveryN(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 px-3 py-2 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Will produce approx. {Math.ceil(pageCount / Math.max(1, everyN))} PDF document(s).
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSplit}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm shadow-md transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Processing PDF...</span>
                </>
              ) : (
                <>
                  <Scissors size={16} />
                  <span>{splitMode === 'range' ? 'Extract Selected Pages' : 'Split & Archive'}</span>
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
            <p className="font-semibold">Split Notice</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Result Area */}
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
              {splitMode === 'range' ? 'Pages Extracted Successfully!' : 'Documents Split & Packaged!'}
            </h4>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {resultFilename} ready for download ({formatBytes(resultSize)}).
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadBlob(resultBlob, resultFilename)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
            >
              {resultFilename.endsWith('.zip') ? <Archive size={16} /> : <Download size={16} />}
              <span>Download {resultFilename.endsWith('.zip') ? 'ZIP Archive' : 'PDF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
