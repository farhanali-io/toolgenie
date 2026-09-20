import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = true;

// Optional AI model for deep grammar / fluency correction
const MODEL_NAME = 'Xenova/flan-t5-small';

let grammarPipelinePromise: Promise<any> | null = null;

async function getPipeline(onProgress?: (data: any) => void) {
  if (grammarPipelinePromise) return grammarPipelinePromise;

  grammarPipelinePromise = (async () => {
    try {
      const pipe = await pipeline('text2text-generation', MODEL_NAME, {
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
      self.postMessage({ type: 'model_ready' });
      return pipe;
    } catch (err: any) {
      console.warn('AI grammar model load error:', err);
      self.postMessage({ type: 'model_error', error: err?.message || 'Failed to load AI model' });
      return null;
    }
  })();

  return grammarPipelinePromise;
}

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, id, text } = e.data || {};

  if (type === 'preload') {
    try {
      await getPipeline();
    } catch {}
    return;
  }

  if (type === 'correct') {
    try {
      self.postMessage({ type: 'inference_start', id });

      const pipe = await getPipeline();
      if (!pipe) {
        self.postMessage({ type: 'error', id, error: 'Model not available' });
        return;
      }

      // Prompt engineering for FLAN-T5 grammar correction
      const prompt = `Fix grammar and spelling: ${text}`;
      const output = await pipe(prompt, {
        max_new_tokens: 256,
        temperature: 0.1,
      });

      const corrected = output?.[0]?.generated_text || text;
      self.postMessage({ type: 'result', id, correctedText: corrected });
    } catch (err: any) {
      self.postMessage({ type: 'error', id, error: err?.message || 'AI inference error' });
    }
  }
});
