import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  UploadCloud, 
  RotateCcw, 
  BookOpen, 
  Clock, 
  FileText, 
  Zap, 
  Sliders 
} from 'lucide-react';
import { ToolShell } from '../shared/ToolShell';
import { ProgressBar } from '../shared/ProgressBar';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { AiModelNotice } from './AiModelNotice';

const SAMPLE_TEXTS = {
  tech: `Artificial intelligence and machine learning technologies have rapidly transitioned from academic research laboratories into consumer products and enterprise workflows. Modern neural networks can generate coherent natural language, recognize faces in dense crowds, and recommend personalized content in real time. However, this explosive growth has introduced profound technical and ethical challenges. Researchers are actively grappling with model hallucination, where generative systems invent false facts with absolute linguistic confidence. Furthermore, training state-of-the-art frontier models requires massive computational clusters consuming tens of megawatts of electricity and millions of gallons of cooling water. As regulatory frameworks like the European Union AI Act take effect, organizations are increasingly turning toward localized, on-device models that process data securely inside browser sandboxes or edge hardware without transferring sensitive user tokens across public cloud backbones.`,
  science: `James Webb Space Telescope (JWST) observations of the early universe have revealed a surprising abundance of massive, luminous galaxies existing merely 300 to 500 million years after the Big Bang. Under standard cosmological models, dark matter halos during the cosmic dawn were expected to assemble far more gradually, leaving insufficient time for such mature stellar populations to form. Several astrophysical hypotheses have been proposed to resolve this tension. Some theorists suggest that primordial star formation operated with an unusually top-heavy initial mass function, producing exceptionally luminous Population III hypergiants. Others postulate that early supermassive black hole accretion disks were super-Eddington, amplifying apparent galactic brightness. Further spectroscopic analysis of high-redshift Lyman-break galaxies will determine whether standard cosmological parameters require fundamental revision.`,
  business: `Global supply chains are undergoing a structural recalibration toward regionalization and nearshoring following prolonged geopolitical disruptions and climate-related shipping bottlenecks. Multinational manufacturing conglomerates that historically relied on single-source lean production in low-cost jurisdictions are now prioritizing redundancy, dual-sourcing agreements, and automated warehousing closer to primary consumer markets. While this strategic shift increases initial capital expenditures and baseline unit costs, chief financial officers report that enhanced resilience significantly mitigates catastrophic inventory stockouts. Concurrently, predictive analytics and digital twins are enabling logistics coordinators to reroute intermodal freight preemptively in response to customs port strikes and extreme weather events.`,
};

export const TextSummarizerWidget: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Model download & caching state
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [currentModelFile, setCurrentModelFile] = useState<string>('');
  const [isModelCached, setIsModelCached] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toolgenie_cached_model_text-summarizer') === 'true';
    } catch {
      return false;
    }
  });

  const workerRef = useRef<Worker | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Worker and preload model on component mount
  useEffect(() => {
    let isMounted = true;

    try {
      const worker = new Worker(
        new URL('../../../workers/summarizer.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      // Start preloading the model immediately on landing
      worker.postMessage({ type: 'preload' });

      worker.onmessage = (e) => {
        if (!isMounted) return;
        const data = e.data || {};

        if (data.type === 'model_progress') {
          setIsModelLoading(true);
          if (typeof data.progress === 'number' && data.progress > 0) {
            setModelProgress(data.progress);
          }
          if (data.file) {
            setCurrentModelFile(data.file);
          }
        } else if (data.type === 'model_ready') {
          setIsModelLoading(false);
          setIsModelCached(true);
          try {
            localStorage.setItem('toolgenie_cached_model_text-summarizer', 'true');
          } catch {}
        } else if (data.type === 'inference_start') {
          setIsProcessing(true);
          setProcessingProgress(35);
        } else if (data.type === 'result') {
          setIsProcessing(false);
          setProcessingProgress(100);
          setSummaryResult(data.summary);
        } else if (data.type === 'error') {
          setIsProcessing(false);
          setErrorMessage(data.error || 'Failed to generate summary');
        }
      };

      worker.onerror = (err) => {
        console.warn('Worker error:', err);
      };
    } catch (err) {
      console.warn('Unable to initialize summarizer worker:', err);
    }

    return () => {
      isMounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/plain' && !file.name.endsWith('.txt') && !file.name.endsWith('.md')) {
      setErrorMessage('Please upload a plain text (.txt or .md) file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setInputText(content);
        setErrorMessage(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSummarize = () => {
    if (!inputText.trim()) {
      setErrorMessage('Please provide text to summarize.');
      return;
    }

    if (inputText.trim().split(/\s+/).length < 20) {
      setErrorMessage('Text is quite short! Summarization works best with at least 25-30 words.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingProgress(20);

    // Simulate progress while worker handles neural weights
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 15;
      });
    }, 400);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'summarize',
        id: Date.now().toString(),
        text: inputText,
        length: summaryLength,
      });
    } else {
      // Fallback in case worker isn't supported
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMessage('Browser Web Worker could not be started.');
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summaryResult) return;
    const blob = new Blob([summaryResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'toolgenie-summary.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setInputText('');
    setSummaryResult(null);
    setErrorMessage(null);
    setIsProcessing(false);
  };

  // Stats computation
  const originalWordCount = useMemo(() => {
    if (!inputText.trim()) return 0;
    return inputText.trim().split(/\s+/).length;
  }, [inputText]);

  const summaryWordCount = useMemo(() => {
    if (!summaryResult?.trim()) return 0;
    return summaryResult.trim().split(/\s+/).length;
  }, [summaryResult]);

  const reductionPercent = useMemo(() => {
    if (!originalWordCount || !summaryWordCount) return 0;
    const red = Math.round(((originalWordCount - summaryWordCount) / originalWordCount) * 100);
    return Math.max(0, red);
  }, [originalWordCount, summaryWordCount]);

  const readingTimeOriginal = Math.ceil(originalWordCount / 200);
  const readingTimeSummary = Math.ceil(summaryWordCount / 200);

  return (
    <ErrorBoundary>
      <AiModelNotice
        toolName="Text Summarizer"
        modelName="Xenova/distilbart-cnn-6-6 (Quantized ONNX)"
        modelSize="~80 MB"
        isCached={isModelCached}
        isDownloading={isModelLoading}
        downloadProgress={modelProgress}
        currentFile={currentModelFile}
      />

      <ToolShell
        title="AI Text Summarizer"
        currentStep={summaryResult ? 'download' : isProcessing ? 'progress' : 'options'}
        onReset={handleReset}
      >
        <div className="space-y-6">
          {/* Controls Bar: Presets & Upload */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sample Presets:
              </span>
              <button
                type="button"
                onClick={() => setInputText(SAMPLE_TEXTS.tech)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors hover:border-teal-500"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Tech News
              </button>
              <button
                type="button"
                onClick={() => setInputText(SAMPLE_TEXTS.science)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors hover:border-teal-500"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Astronomy
              </button>
              <button
                type="button"
                onClick={() => setInputText(SAMPLE_TEXTS.business)}
                className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors hover:border-teal-500"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Business
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-90"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <UploadCloud size={14} className="text-teal-500" />
                Upload .txt / .md
              </button>
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg hover:opacity-75 transition-opacity"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Main Input Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="summarizer-input" className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <FileText size={16} className="text-teal-500" />
                Source Article or Document Text
              </label>
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {originalWordCount} words • {inputText.length} characters
              </span>
            </div>

            <textarea
              id="summarizer-input"
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste article, report, essay, or meeting notes here (minimum ~25 words)..."
              className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-y"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          {/* Length Selector & Options */}
          <div className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Sliders size={16} className="text-teal-500" />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Summary Depth:
              </span>
              <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-lg">
                {(['short', 'medium', 'long'] as const).map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setSummaryLength(len)}
                    className="px-3 py-1 text-xs rounded-md capitalize font-medium transition-all"
                    style={{
                      backgroundColor: summaryLength === len ? 'var(--accent)' : 'transparent',
                      color: summaryLength === len ? '#ffffff' : 'var(--text-secondary)',
                    }}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={isProcessing || !inputText.trim()}
              onClick={handleSummarize}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--accent)',
                color: '#ffffff',
              }}
            >
              <Sparkles size={16} />
              {isProcessing ? 'Summarizing...' : 'Summarize Text'}
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 text-xs rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-500 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Processing Progress */}
          {isProcessing && (
            <ProgressBar
              progress={processingProgress}
              statusText="Running Neural DistilBART Model in Web Worker..."
              subText="Generating abstractive summary on your device CPU/GPU without cloud latency."
              accentColor="var(--accent)"
            />
          )}

          {/* Result Card */}
          {summaryResult && (
            <div
              className="p-5 sm:p-6 rounded-2xl border space-y-4 animate-in fade-in duration-300"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Executive AI Summary
                    </h3>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      DistilBART 6-6 • {summaryLength} length mode
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Download size={14} />
                    Download .txt
                  </button>
                </div>
              </div>

              {/* Summary Text Content */}
              <div
                className="p-4 rounded-xl border text-sm leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {summaryResult}
              </div>

              {/* Compression Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <BookOpen size={13} />
                    Original Words
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5" style={{ color: 'var(--text-primary)' }}>
                    {originalWordCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Sparkles size={13} className="text-teal-500" />
                    Summary Words
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5 text-teal-500">
                    {summaryWordCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Zap size={13} className="text-amber-500" />
                    Condensation
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5 text-amber-500">
                    -{reductionPercent}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <Clock size={13} className="text-emerald-500" />
                    Reading Time
                  </div>
                  <div className="text-base font-bold font-mono mt-0.5 text-emerald-500">
                    ~{readingTimeSummary} min <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>vs ~{readingTimeOriginal} min</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ToolShell>
    </ErrorBoundary>
  );
};

export default TextSummarizerWidget;
