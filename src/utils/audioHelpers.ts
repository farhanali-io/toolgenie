// Utility functions for client-side audio decoding, processing, and WAV encoding

/**
 * Checks if WebCodecs audio decoding/encoding is available in the current browser environment.
 */
export function isWebCodecsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window as any).AudioEncoder === 'function' && typeof (window as any).AudioDecoder === 'function';
}

/**
 * Checks if standard Web Audio API is available.
 */
export function isWebAudioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof (window.AudioContext || (window as any).webkitAudioContext) === 'function';
}

/**
 * Creates or gets an AudioContext instance safely.
 */
let sharedAudioCtx: AudioContext | null = null;
export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * Decodes an audio File or Blob into an AudioBuffer using the browser's native Web Audio API.
 */
export async function decodeAudioFile(file: File | Blob): Promise<AudioBuffer> {
  const ctx = getAudioContext();
  const arrayBuffer = await file.arrayBuffer();
  // decodeAudioData consumes the arrayBuffer in some older browsers, so we pass a slice
  return await ctx.decodeAudioData(arrayBuffer.slice(0));
}

/**
 * Encodes an AudioBuffer (or a sub-slice of it) into a standard 16-bit PCM WAV Blob.
 * 100% client-side, zero external dependencies, extremely fast.
 */
export function audioBufferToWav(
  buffer: AudioBuffer,
  startSec: number = 0,
  endSec?: number,
  fadeInSec: number = 0,
  fadeOutSec: number = 0
): Blob {
  const sampleRate = buffer.sampleRate;
  const numChannels = buffer.numberOfChannels;
  
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(
    buffer.length,
    Math.floor((endSec !== undefined ? endSec : buffer.duration) * sampleRate)
  );
  
  const totalSamples = Math.max(0, endSample - startSample);
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataByteCount = totalSamples * blockAlign;
  
  const headerByteCount = 44;
  const totalByteCount = headerByteCount + dataByteCount;
  const wavBuffer = new ArrayBuffer(totalByteCount);
  const view = new DataView(wavBuffer);
  
  // 1. RIFF Chunk Descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true); // chunkSize = 36 + SubChunk2Size
  writeString(view, 8, 'WAVE');
  
  // 2. fmt Sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size = 16 for PCM
  view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true); // bitsPerSample = 16
  
  // 3. data Sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataByteCount, true);
  
  // Extract channels
  const channels: Float32Array[] = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  
  const fadeInSamples = Math.floor(fadeInSec * sampleRate);
  const fadeOutSamples = Math.floor(fadeOutSec * sampleRate);
  
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const srcIndex = startSample + i;
    
    // Calculate fade multipliers
    let fadeMultiplier = 1.0;
    if (fadeInSamples > 0 && i < fadeInSamples) {
      fadeMultiplier = i / fadeInSamples;
    } else if (fadeOutSamples > 0 && i >= totalSamples - fadeOutSamples) {
      fadeMultiplier = Math.max(0, (totalSamples - i) / fadeOutSamples);
    }
    
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = channels[ch][srcIndex] * fadeMultiplier;
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Convert float [-1.0, 1.0] to signed 16-bit integer [-32768, 32767]
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }
  
  return new Blob([wavBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Formats time in seconds to mm:ss or mm:ss.ms
 */
export function formatAudioDuration(seconds: number, includeMs: boolean = false): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = String(mins).padStart(2, '0');
  const formattedSecs = String(secs).padStart(2, '0');
  
  if (includeMs) {
    const ms = Math.floor((seconds % 1) * 100);
    return `${formattedMins}:${formattedSecs}.${String(ms).padStart(2, '0')}`;
  }
  return `${formattedMins}:${formattedSecs}`;
}

/**
 * Formats raw bytes to human readable string (KB, MB, GB).
 */
export function formatAudioBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
