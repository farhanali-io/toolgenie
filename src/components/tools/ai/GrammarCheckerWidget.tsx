import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  CheckCheck, 
  Check, 
  X, 
  Sparkles, 
  Copy, 
  Download, 
  RotateCcw, 
  FileText, 
  AlertCircle, 
  ToggleLeft, 
  ToggleRight, 
  ArrowRight, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { ToolShell } from '../shared/ToolShell';
import { ProgressBar } from '../shared/ProgressBar';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { AiModelNotice } from './AiModelNotice';
import { checkGrammar, applyFix, applyAllFixes, GrammarIssue } from '../../../utils/grammarRules';

const SAMPLE_PASSAGES = {
  standard: `Yesterday i went to the the store becuase i needed to buy some milk . teh cashier was realy freindly but he didnt have enough change in the cash drawer . unfortunatly i had to wait untill the manager arrived to open the safe . this kind of delay is definately annoying when your in a hurry .`,
  business: `Dear team , we have recieved the quarterly report from the finance commitee . thier calculations show that our budget is seperate from the marketing department . please dont delay submitting you're receipts before tommorow at noon .`,
};

export const GrammarCheckerWidget: React.FC = () => {
  const [text, setText] = useState<string>(SAMPLE_PASSAGES.standard);
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [ignoredIds, setIgnoredIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<boolean>(false);

  // Optional AI Deep Grammar state
  const [aiEnabled, setAiEnabled] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiProgress, setAiProgress] = useState<number>(0);
  const [aiModelFile, setAiModelFile] = useState<string>('');
  const [isAiRunning, setIsAiRunning] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiCached, setIsAiCached] = useState<boolean>(() => {
    try {
      return localStorage.getItem('toolgenie_cached_model_grammar-checker') === 'true';
    } catch {
      return false;
    }
  });

  const aiWorkerRef = useRef<Worker | null>(null);

  // Run instant primary rule-based check on text changes
  useEffect(() => {
    const rawIssues = checkGrammar(text);
    // Filter out ignored issues
    const activeIssues = rawIssues.filter((iss) => !ignoredIds.has(iss.id));
    setIssues(activeIssues);
  }, [text, ignoredIds]);

  // Handle AI toggle: only initialize worker when user toggles it ON
  useEffect(() => {
    if (!aiEnabled) {
      if (aiWorkerRef.current) {
        aiWorkerRef.current.terminate();
        aiWorkerRef.current = null;
      }
      setIsAiLoading(false);
      return;
    }

    // AI toggle is ON: start worker and preload model
    try {
      const worker = new Worker(
        new URL('../../../workers/grammar.worker.ts', import.meta.url),
        { type: 'module' }
      );
      aiWorkerRef.current = worker;

      worker.postMessage({ type: 'preload' });

      worker.onmessage = (e) => {
        const data = e.data || {};
        if (data.type === 'model_progress') {
          setIsAiLoading(true);
          if (typeof data.progress === 'number' && data.progress > 0) {
            setAiProgress(data.progress);
          }
          if (data.file) {
            setAiModelFile(data.file);
          }
        } else if (data.type === 'model_ready') {
          setIsAiLoading(false);
          setIsAiCached(true);
          try {
            localStorage.setItem('toolgenie_cached_model_grammar-checker', 'true');
          } catch {}
        } else if (data.type === 'result') {
          setIsAiRunning(false);
          setAiSuggestion(data.correctedText);
        } else if (data.type === 'error') {
          setIsAiRunning(false);
        }
      };
    } catch (err) {
      console.warn('Failed to start AI grammar worker:', err);
    }

    return () => {
      if (aiWorkerRef.current) {
        aiWorkerRef.current.terminate();
        aiWorkerRef.current = null;
      }
    };
  }, [aiEnabled]);

  const handleAcceptFix = (issue: GrammarIssue) => {
    const updated = applyFix(text, issue);
    setText(updated);
  };

  const handleIgnoreFix = (issue: GrammarIssue) => {
    setIgnoredIds((prev) => new Set([...prev, issue.id]));
  };

  const handleAcceptAll = () => {
    if (issues.length === 0) return;
    const updated = applyAllFixes(text, issues);
    setText(updated);
  };

  const handleRunAiDeepCheck = () => {
    if (!aiWorkerRef.current || !text.trim()) return;
    setIsAiRunning(true);
    setAiSuggestion(null);
    aiWorkerRef.current.postMessage({
      type: 'correct',
      id: Date.now().toString(),
      text: text,
    });
  };

  const handleApplyAiSuggestion = () => {
    if (aiSuggestion) {
      setText(aiSuggestion);
      setAiSuggestion(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'toolgenie-proofread.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setText('');
    setIssues([]);
    setIgnoredIds(new Set());
    setAiSuggestion(null);
  };

  return (
    <ErrorBoundary>
      {/* Optional AI Notice only shown when AI toggle is activated */}
      {aiEnabled && (
        <AiModelNotice
          toolName="Grammar Checker"
          modelName="Xenova/flan-t5-small (Deep Fluency)"
          modelSize="~50 MB"
          isCached={isAiCached}
          isDownloading={isAiLoading}
          downloadProgress={aiProgress}
          currentFile={aiModelFile}
        />
      )}

      <ToolShell
        title="Grammar & Spell Checker"
        currentStep={issues.length === 0 && text.trim() ? 'download' : 'options'}
        onReset={handleReset}
      >
        <div className="space-y-6">
          {/* Top Bar: Sample presets & AI Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Sample Tests:
              </span>
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE_PASSAGES.standard);
                  setIgnoredIds(new Set());
                }}
                className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors hover:border-teal-500"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Sample 1 (Typos & Spaces)
              </button>
              <button
                type="button"
                onClick={() => {
                  setText(SAMPLE_PASSAGES.business);
                  setIgnoredIds(new Set());
                }}
                className="px-2.5 py-1 text-xs rounded-lg font-medium border transition-colors hover:border-teal-500"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                Sample 2 (Email & Homophones)
              </button>
            </div>

            {/* AI Deep Check Toggle (Off by default for instant speed) */}
            <div className="flex items-center gap-2.5 p-1.5 px-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: aiEnabled ? 'var(--accent)' : 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setAiEnabled(!aiEnabled)}
                className="flex items-center gap-2 text-xs font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {aiEnabled ? (
                  <ToggleRight size={22} className="text-teal-500 transition-transform" />
                ) : (
                  <ToggleLeft size={22} style={{ color: 'var(--text-muted)' }} />
                )}
                <span>AI Neural Correction (~50MB)</span>
              </button>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium uppercase"
                style={{
                  backgroundColor: aiEnabled ? 'rgba(20, 184, 166, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                  color: aiEnabled ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {aiEnabled ? 'Active' : 'Off (Fast)'}
              </span>
            </div>
          </div>

          {/* Editor & Issue Panel Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Text Input Area */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="grammar-input" className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  <FileText size={16} className="text-teal-500" />
                  Your Text
                </label>
                <div className="flex items-center gap-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                  <span>{text.trim() ? text.trim().split(/\s+/).length : 0} words</span>
                  <span>{text.length} chars</span>
                </div>
              </div>

              <textarea
                id="grammar-input"
                rows={12}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type text to check grammar, spelling, double spaces, and capitalization..."
                className="w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-sans leading-relaxed resize-y"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-85"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Download size={14} />
                    Download .txt
                  </button>
                </div>

                {aiEnabled && (
                  <button
                    type="button"
                    disabled={isAiRunning || isAiLoading || !text.trim()}
                    onClick={handleRunAiDeepCheck}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm disabled:opacity-50 hover:opacity-90"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    <Sparkles size={14} />
                    {isAiRunning ? 'Analyzing...' : 'Deep AI Polish'}
                  </button>
                )}
              </div>
            </div>

            {/* Right: Issues & Suggestions List */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Suggestions Found
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full font-bold"
                    style={{
                      backgroundColor: issues.length > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: issues.length > 0 ? '#ef4444' : '#10b981',
                    }}
                  >
                    {issues.length}
                  </span>
                </div>

                {issues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="text-xs font-semibold text-teal-500 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Accept All ({issues.length})
                  </button>
                )}
              </div>

              <div
                className="p-4 rounded-xl border max-h-[460px] overflow-y-auto space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {/* AI Deep Suggestion Card (if generated) */}
                {aiSuggestion && (
                  <div
                    className="p-3.5 rounded-xl border-2 border-teal-500/40 bg-teal-500/5 space-y-2.5 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-500 flex items-center gap-1">
                        <Sparkles size={13} />
                        Neural Deep Fluency Suggestion
                      </span>
                      <button
                        type="button"
                        onClick={() => setAiSuggestion(null)}
                        className="text-xs hover:opacity-75"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <p className="text-xs font-mono p-2 rounded bg-black/5 dark:bg-white/5 leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {aiSuggestion}
                    </p>

                    <button
                      type="button"
                      onClick={handleApplyAiSuggestion}
                      className="w-full py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors"
                    >
                      Apply AI Rewrite
                    </button>
                  </div>
                )}

                {/* If no issues found */}
                {issues.length === 0 && !aiSuggestion && (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                      <CheckCheck size={24} />
                    </div>
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      No grammar or spelling errors detected!
                    </div>
                    <p className="text-xs max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
                      Your text passed all spelling, double-space, repetition, and capitalization checks.
                    </p>
                  </div>
                )}

                {/* Active Grammar Issues */}
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3 rounded-xl border transition-all space-y-2 text-xs"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="px-2 py-0.5 rounded font-medium text-[10px] uppercase tracking-wide"
                        style={{
                          backgroundColor:
                            issue.category === 'spelling'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : issue.category === 'capitalization'
                              ? 'rgba(59, 130, 246, 0.12)'
                              : issue.category === 'repetition'
                              ? 'rgba(245, 158, 11, 0.12)'
                              : 'rgba(20, 184, 166, 0.12)',
                          color:
                            issue.category === 'spelling'
                              ? '#ef4444'
                              : issue.category === 'capitalization'
                              ? '#3b82f6'
                              : issue.category === 'repetition'
                              ? '#f59e0b'
                              : '#14b8a6',
                        }}
                      >
                        {issue.category}
                      </span>

                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {issue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="line-through text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {issue.original === ' ' ? '[Double Space]' : issue.original}
                      </span>
                      <ArrowRight size={12} className="text-slate-400" />
                      <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold">
                        {issue.replacement === ' ' ? '[Single Space]' : issue.replacement}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {issue.explanation}
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => handleIgnoreFix(issue)}
                        className="px-2 py-1 text-[11px] rounded font-medium hover:opacity-75 transition-opacity"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Dismiss
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAcceptFix(issue)}
                        className="flex items-center gap-1 px-3 py-1 rounded font-semibold text-white bg-teal-600 hover:bg-teal-500 transition-colors"
                      >
                        <Check size={12} />
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ToolShell>
    </ErrorBoundary>
  );
};

export default GrammarCheckerWidget;
