import React, { useState, useEffect, useRef } from 'react';
import { 
  ScanText, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Globe, 
  FileText, 
  Sparkles, 
  Percent, 
  Clock, 
  Layers 
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { ToolShell } from '../shared/ToolShell';
import { ProgressBar } from '../shared/ProgressBar';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { DropZone } from '../DropZone';
import { AiModelNotice } from './AiModelNotice';

const SUPPORTED_LANGUAGES = [
  { code: 'eng', name: 'English' },
  { code: 'spa', name: 'Spanish (Español)' },
  { code: 'fra', name: 'French (Français)' },
  { code: 'deu', name: 'German (Deutsch)' },
  { code: 'ita', name: 'Italian (Italiano)' },
  { code: 'por', name: 'Portuguese (Português)' },
  { code: 'chi_sim', name: 'Chinese Simplified (简体中文)' },
  { code: 'jpn', name: 'Japanese (日本語)' },
];

export const ImageToTextOcrWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState<string>('eng');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing OCR...');
  
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Model caching state
  const [isCached, setIsCached] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`toolgenie_cached_ocr_${selectedLang}`) === 'true';
    } catch {
      return false;
    }
  });

  const workerRef = useRef<any>(null);

  const handleFileSelected = (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    setRecognizedText('');
    setConfidence(null);
    setErrorMessage(null);
  };

  // Generate an instant test image with typography onto a canvas
  const handleLoadSample = (sampleType: 'receipt' | 'quote' | 'invoice') => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clean white paper background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'top';

    if (sampleType === 'quote') {
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('INNOVATION AND PRIVACY IN THE BROWSER', 50, 60);

      ctx.font = 'normal 18px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText('Client-side machine learning enables instant OCR without transferring', 50, 120);
      ctx.fillText('confidential receipts, invoices, or personal documents to remote cloud APIs.', 50, 155);
      ctx.fillText('Tesseract WebAssembly decodes optical characters entirely in your browser tab.', 50, 190);

      ctx.font = 'italic 16px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('— ToolGenie Engineering Whitepaper (100% On-Device Execution)', 50, 260);
    } else if (sampleType === 'receipt') {
      ctx.font = 'bold 24px monospace';
      ctx.fillText('TOOLGENIE CAFE & ROASTERY', 60, 50);
      ctx.font = '16px monospace';
      ctx.fillText('ORDER #84920                 DATE: 2026-09-20', 60, 95);
      ctx.fillText('--------------------------------------------', 60, 125);
      ctx.fillText('1x  COLD BREW NITRO COFFEE          $5.50', 60, 160);
      ctx.fillText('2x  ALMOND CROISSANT FRESH          $9.00', 60, 195);
      ctx.fillText('1x  AVOCADO SOURDOUGH TOAST         $12.50', 60, 230);
      ctx.fillText('--------------------------------------------', 60, 265);
      ctx.fillText('SUBTOTAL: $27.00      TAX (8%): $2.16', 60, 300);
      ctx.font = 'bold 18px monospace';
      ctx.fillText('TOTAL PAID VIA NFC:              $29.16', 60, 340);
    } else {
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('FREELANCE CONSULTING INVOICE', 60, 50);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText('Invoice Number: INV-2026-084', 60, 95);
      ctx.fillText('Bill To: Acme Global Enterprises LLC', 60, 125);
      ctx.fillText('Services Rendered: Full-Stack React & WebAssembly Optimization', 60, 165);
      ctx.fillText('Hours Logged: 40 hours @ $125.00/hr = $5,000.00 USD', 60, 205);
      ctx.fillText('Status: Payment Received in Full. Thank you for your business!', 60, 255);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const sampleFile = new File([blob], `sample-${sampleType}.png`, { type: 'image/png' });
      handleFileSelected([sampleFile]);
    }, 'image/png');
  };

  const handleRunOcr = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgressPct(5);
    setStatusMessage(`Preparing Tesseract Web Worker for [${selectedLang}]...`);
    setErrorMessage(null);

    try {
      const worker = await createWorker(selectedLang, 1, {
        logger: (m: any) => {
          if (m.status) {
            if (m.status === 'loading tesseract core') {
              setStatusMessage('Loading Tesseract WebAssembly engine...');
              setProgressPct(20);
            } else if (m.status === 'loading language traineddata') {
              const p = m.progress ? Math.round(m.progress * 100) : 50;
              setStatusMessage(`Downloading language dictionary (${p}%)...`);
              setProgressPct(20 + Math.round(p * 0.3));
            } else if (m.status === 'recognizing text') {
              const p = m.progress ? Math.round(m.progress * 100) : 0;
              setStatusMessage(`Optical recognition pass (${p}%)...`);
              setProgressPct(50 + Math.round(p * 0.48));
            }
          }
        },
      });

      workerRef.current = worker;

      const ret = await worker.recognize(file);
      const outputText = ret.data.text || '';
      const conf = ret.data.confidence;

      setRecognizedText(outputText);
      setConfidence(typeof conf === 'number' ? Math.round(conf) : null);
      setProgressPct(100);

      setIsCached(true);
      try {
        localStorage.setItem(`toolgenie_cached_ocr_${selectedLang}`, 'true');
      } catch {}

      await worker.terminate();
      workerRef.current = null;
    } catch (err: any) {
      console.warn('OCR error:', err);
      setErrorMessage(err?.message || 'Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!recognizedText) return;
    navigator.clipboard.writeText(recognizedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!recognizedText) return;
    const blob = new Blob([recognizedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file ? `${file.name.replace(/\.[^/.]+$/, '')}-ocr.txt` : 'extracted-text.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setRecognizedText('');
    setConfidence(null);
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const wordCount = recognizedText.trim() ? recognizedText.trim().split(/\s+/).length : 0;
  const lineCount = recognizedText ? recognizedText.split('\n').filter((l) => l.trim().length > 0).length : 0;

  return (
    <ErrorBoundary>
      <AiModelNotice
        toolName="Image to Text (OCR)"
        modelName={`Tesseract WASM [${selectedLang.toUpperCase()}]`}
        modelSize="~15-25 MB"
        isCached={isCached}
      />

      <ToolShell
        title="Image to Text (OCR)"
        currentStep={recognizedText ? 'download' : isProcessing ? 'progress' : file ? 'options' : 'dropzone'}
        onReset={handleReset}
      >
        {/* Step 1: DropZone and Sample presets */}
        {!file && (
          <div className="space-y-6">
            <DropZone
              onFilesSelected={handleFileSelected}
              accept="image/*,.jpg,.jpeg,.png,.webp,.bmp"
              multiple={false}
              title="Drop photo, receipt, or scanned document here"
              description="Extract editable text with on-device Optical Character Recognition in a Web Worker"
            />

            <div className="p-4 rounded-xl border space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Or Try an Instant Test Sample:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('receipt')}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium border hover:border-teal-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  🧾 Cafe Receipt Sample
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('quote')}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium border hover:border-teal-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  📄 Document Article Sample
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('invoice')}
                  className="px-3 py-1.5 text-xs rounded-lg font-medium border hover:border-teal-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  💼 Invoice Record Sample
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Configure & Run */}
        {file && !recognizedText && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left preview */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Image Preview
                </span>
                <div className="h-64 rounded-xl border flex items-center justify-center p-3 bg-black/5 dark:bg-white/5 overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                  {previewUrl && (
                    <img src={previewUrl} alt="OCR source" className="max-h-full max-w-full object-contain rounded-lg" />
                  )}
                </div>
                <div className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
              </div>

              {/* Right configuration */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-4 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <label htmlFor="ocr-lang-select" className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <Globe size={16} className="text-teal-500" />
                    Document Language:
                  </label>
                  <select
                    id="ocr-lang-select"
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value)}
                    className="w-full p-2.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Tesseract downloads trained neural dictionary tensors once and persists them in browser IndexedDB.
                  </p>
                </div>

                {!isProcessing && (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-2 text-xs font-medium rounded-xl border hover:opacity-75 transition-opacity"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      Choose Different Image
                    </button>

                    <button
                      type="button"
                      onClick={handleRunOcr}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-sm transition-all hover:opacity-95"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <ScanText size={16} />
                      Extract Text (OCR)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            {isProcessing && (
              <ProgressBar
                progress={progressPct}
                statusText={statusMessage}
                subText="Executing Tesseract Web Worker with IndexedDB neural weights..."
                accentColor="var(--accent)"
              />
            )}

            {errorMessage && (
              <div className="p-3 text-xs rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-medium">
                {errorMessage}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Result Display */}
        {recognizedText && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left: Thumbnail & Stats */}
              <div className="md:col-span-4 space-y-4">
                <div className="p-4 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Original Document
                  </span>
                  <div className="h-44 rounded-lg border flex items-center justify-center p-2 bg-black/5 dark:bg-white/5 overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
                    {previewUrl && (
                      <img src={previewUrl} alt="OCR source thumbnail" className="max-h-full max-w-full object-contain rounded" />
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    {confidence !== null && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                          <Percent size={13} className="text-teal-500" />
                          Model Confidence:
                        </span>
                        <span className="font-bold font-mono text-teal-500">{confidence}%</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <FileText size={13} />
                        Words Extracted:
                      </span>
                      <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{wordCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <Layers size={13} />
                        Lines Detected:
                      </span>
                      <span className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{lineCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Editable Textarea */}
              <div className="md:col-span-8 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="ocr-result-text" className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                    <FileText size={16} className="text-teal-500" />
                    Extracted Text (Editable)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-85"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? 'Copied' : 'Copy Text'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: 'var(--accent)' }}
                    >
                      <Download size={14} />
                      Download .txt
                    </button>
                  </div>
                </div>

                <textarea
                  id="ocr-result-text"
                  rows={12}
                  value={recognizedText}
                  onChange={(e) => setRecognizedText(e.target.value)}
                  className="w-full p-4 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all leading-relaxed resize-y"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl border hover:opacity-75 transition-opacity"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <RotateCcw size={14} />
                Scan Another Image
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default ImageToTextOcrWidget;
