import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { DropZone } from '../DropZone';
import { formatBytes, downloadBlob, readFileAsArrayBuffer } from '../../../utils/fileHelpers';
import { 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  FileText, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
}

export const MergePdfWidget: React.FC = () => {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedSize, setMergedSize] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setErrorMessage(null);
    setMergedBlob(null);

    const pdfsOnly = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfsOnly.length === 0) {
      setErrorMessage('Please select valid PDF files.');
      return;
    }

    const items: PdfFileItem[] = [];
    for (const file of pdfsOnly) {
      const id = `${file.name}-${file.size}-${Math.random()}`;
      let pageCount: number | undefined;
      try {
        const buffer = await readFileAsArrayBuffer(file);
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
      } catch {
        // Continue even if preview page count fails
      }
      items.push({ id, file, name: file.name, size: file.size, pageCount });
    }

    setFiles(prev => [...prev, ...items]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
    setMergedBlob(null);
  };

  const removeItem = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setMergedBlob(null);
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage('Please add at least 2 PDF documents to merge.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProgressText('Initializing PDF engine...');

    try {
      // Yield to allow UI render
      await new Promise(r => setTimeout(r, 20));

      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgressText(`Processing document ${i + 1} of ${files.length} (${item.name})...`);
        await new Promise(r => setTimeout(r, 10));

        const buffer = await readFileAsArrayBuffer(item.file);
        const sourceDoc = await PDFDocument.load(buffer);
        const pageIndices = sourceDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sourceDoc, pageIndices);
        copiedPages.forEach(p => mergedPdf.addPage(p));
      }

      setProgressText('Compiling final combined PDF...');
      await new Promise(r => setTimeout(r, 20));
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      
      setMergedBlob(blob);
      setMergedSize(pdfBytes.byteLength);
      setProgressText('');
    } catch (err: any) {
      setErrorMessage(
        err?.message?.includes('encrypted') || err?.message?.includes('password')
          ? 'One or more of the selected PDFs is password protected. Please unlock it before merging.'
          : 'Unable to merge the selected PDFs. Ensure none of the files are corrupted.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const baseName = files[0]?.name.replace(/\.[^/.]+$/, '') || 'document';
    downloadBlob(mergedBlob, `${baseName}-merged.pdf`);
  };

  const handleReset = () => {
    setFiles([]);
    setMergedBlob(null);
    setMergedSize(0);
    setErrorMessage(null);
    setProgressText('');
  };

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 0), 0);
  const totalInputSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6">
      {/* DropZone */}
      <DropZone
        accept="application/pdf,.pdf"
        multiple={true}
        onFilesSelected={handleFilesSelected}
        title="Choose or drop PDF files here"
        description="Select multiple PDF documents to combine into a single seamless document"
        accentColor="var(--accent)"
      />

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl border flex items-start gap-3 text-sm bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Merge Notice</p>
            <p className="text-xs opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Selected Files List & Reordering */}
      {files.length > 0 && (
        <div 
          className="rounded-2xl border p-5 sm:p-6 space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Layers size={18} style={{ color: 'var(--accent)' }} />
              <h3 className="font-heading font-bold text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
                Files to Merge ({files.length})
              </h3>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Total size: {formatBytes(totalInputSize)}</span>
              {totalPages > 0 && <span>• {totalPages} pages</span>}
              <button
                type="button"
                onClick={handleReset}
                className="hover:underline text-red-500 font-medium cursor-pointer"
              >
                Clear all
              </button>
            </div>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Use the arrow buttons to arrange the files in the order you want them merged.
          </p>

          <div className="space-y-2">
            {files.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border transition-all"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}
                  >
                    {idx + 1}
                  </span>
                  <FileText size={18} className="shrink-0 text-red-500" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
                      {formatBytes(item.size)} {item.pageCount ? `• ${item.pageCount} pages` : ''}
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
                    aria-label="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === files.length - 1 || isProcessing}
                    onClick={() => moveItem(idx, 'down')}
                    className="p-1.5 rounded-lg border hover:opacity-80 disabled:opacity-30 cursor-pointer"
                    style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                    aria-label="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg border hover:bg-red-500/10 text-red-500 border-red-500/20 cursor-pointer"
                    aria-label="Remove file"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={files.length < 2 || isProcessing}
              onClick={handleMerge}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm shadow-md transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Merging PDFs...</span>
                </>
              ) : (
                <>
                  <Layers size={16} />
                  <span>Merge {files.length} PDFs</span>
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

      {/* Success Result Area */}
      {mergedBlob && (
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
              PDFs Merged Successfully!
            </h4>
            <p className="text-xs sm:text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Your combined document is ready ({formatBytes(mergedSize)}). No files were uploaded to any server.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-heading font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all cursor-pointer"
            >
              <Download size={16} />
              <span>Download Merged PDF</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-xs border hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-page)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              Merge More Files
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
