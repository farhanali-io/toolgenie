import { pipeline, env } from '@xenova/transformers';

// Mandatory optimizations:
// 1. Off-thread Web Worker execution
// 2. Enable browser Cache API
env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL_NAME = 'Xenova/distilbart-cnn-6-6';

let summarizerPromise: Promise<any> | null = null;
let isModelReady = false;

// Fallback extractive summarizer for offline / network timeout resilience
function fallbackSummarize(text: string, length: 'short' | 'medium' | 'long'): string {
  const sentences = text
    .replace(/([.?!])\s*(?=[A-Z])/g, "$1|")
    .split("|")
    .map(s => s.trim())
    .filter(s => s.length > 20);

  if (sentences.length <= 2) return text;

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'with', 'as',
    'by', 'that', 'this', 'it', 'from', 'are', 'was', 'were', 'be', 'or', 'has', 'have', 'had'
  ]);

  const words = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const scored = sentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;
    for (const w of sWords) {
      if (freq[w]) score += freq[w];
    }
    // Boost earlier sentences (lead bias in journalism)
    const positionBoost = 1.0 / (1.0 + index * 0.15);
    return { sentence, score: score * positionBoost, index };
  });

  scored.sort((a, b) => b.score - a.score);

  const count = length === 'short' ? Math.min(2, sentences.length) : length === 'long' ? Math.min(6, sentences.length) : Math.min(4, sentences.length);
  const selected = scored.slice(0, count).sort((a, b) => a.index - b.index);

  return selected.map(s => s.sentence).join(' ');
}

async function getSummarizer(onProgress?: (progressData: any) => void) {
  if (summarizerPromise) return summarizerPromise;

  summarizerPromise = (async () => {
    try {
      const pipe = await pipeline('summarization', MODEL_NAME, {
        quantized: true,
        progress_callback: (data: any) => {
          if (onProgress) onProgress(data);
          self.postMessage({
            type: 'model_progress',
            status: data.status,
            name: data.name,
            file: data.file,
            progress: typeof data.progress === 'number' ? Math.round(data.progress) : 0,
            loaded: data.loaded,
            total: data.total
          });
        }
      });
      isModelReady = true;
      self.postMessage({ type: 'model_ready' });
      return pipe;
    } catch (err: any) {
      console.warn('Transformers.js summarization model load note:', err);
      // Even if remote model fails to download, we gracefully fall back
      isModelReady = true;
      self.postMessage({ type: 'model_ready', fallback: true });
      return null;
    }
  })();

  return summarizerPromise;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, id, text, length = 'medium' } = e.data || {};

  if (type === 'preload') {
    try {
      await getSummarizer();
    } catch {
      // Preload error handled gracefully
    }
    return;
  }

  if (type === 'summarize') {
    try {
      self.postMessage({ type: 'inference_start', id });

      const pipe = await getSummarizer();

      if (!pipe) {
        // Fallback to local extractive summary
        const fallback = fallbackSummarize(text, length);
        self.postMessage({ type: 'result', id, summary: fallback, isFallback: true });
        return;
      }

      // Model inference parameters based on length selection
      const lengthConfig = length === 'short'
        ? { max_new_tokens: 60, min_length: 20 }
        : length === 'long'
        ? { max_new_tokens: 220, min_length: 70 }
        : { max_new_tokens: 130, min_length: 40 };

      const output = await pipe(text, lengthConfig);
      const summaryText = output?.[0]?.summary_text || fallbackSummarize(text, length);

      self.postMessage({ type: 'result', id, summary: summaryText });
    } catch (err: any) {
      console.warn('Worker summarizer error, using fallback:', err);
      const fallback = fallbackSummarize(text, length);
      self.postMessage({ type: 'result', id, summary: fallback, isFallback: true });
    }
  }
});
