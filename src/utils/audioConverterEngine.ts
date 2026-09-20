import {
  Input,
  Output,
  Conversion,
  BlobSource,
  BufferTarget,
  ALL_FORMATS,
  WavOutputFormat,
  Mp3OutputFormat,
  OggOutputFormat,
  FlacOutputFormat,
  Mp4OutputFormat,
} from 'mediabunny';
import { isWebCodecsSupported, decodeAudioFile, audioBufferToWav } from './audioHelpers';

export type SupportedAudioFormat = 'mp3' | 'wav' | 'ogg' | 'm4a' | 'flac';

export interface ConversionConfig {
  targetFormat: SupportedAudioFormat;
  bitrateKbps: number; // e.g. 64, 128, 192, 256, 320
  sampleRate?: number; // e.g. 44100, 48000, 32000, 22050
  channels?: 1 | 2; // 1 = mono, 2 = stereo
  onProgress?: (percent: number, statusMessage: string) => void;
  onNotice?: (noticeMessage: string) => void;
}

export interface ConversionResult {
  blob: Blob;
  outputFileName: string;
  originalSize: number;
  newSize: number;
  format: SupportedAudioFormat;
  engineUsed: 'mediabunny' | 'webaudio' | 'ffmpeg-wasm';
}

const MIME_TYPES: Record<SupportedAudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  flac: 'audio/flac',
};

/**
 * Main audio conversion runner.
 * Follows performance philosophy:
 * 1. Web Audio API for WAV conversion (instant, 0 download)
 * 2. MediaBunny (~5 KB, WebCodecs) for ultra-fast hardware acceleration
 * 3. ffmpeg.wasm fallback with notice if browser lacks WebCodecs
 */
export async function convertAudioFile(
  file: File,
  config: ConversionConfig
): Promise<ConversionResult> {
  const { targetFormat, bitrateKbps, sampleRate, channels, onProgress, onNotice } = config;
  const originalSize = file.size;
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const outputFileName = `${baseName}.${targetFormat}`;

  onProgress?.(5, 'Analyzing audio file...');

  // 1. If target is WAV, native Web Audio API is 100% instant and zero-download
  if (targetFormat === 'wav' && !sampleRate && !channels) {
    try {
      onProgress?.(25, 'Decoding audio samples via Web Audio API...');
      const audioBuffer = await decodeAudioFile(file);
      onProgress?.(70, 'Encoding 16-bit PCM WAV stream...');
      const wavBlob = audioBufferToWav(audioBuffer);
      onProgress?.(100, 'Conversion complete!');
      return {
        blob: wavBlob,
        outputFileName,
        originalSize,
        newSize: wavBlob.size,
        format: 'wav',
        engineUsed: 'webaudio',
      };
    } catch (err) {
      console.warn('Native Web Audio WAV conversion failed, trying MediaBunny:', err);
    }
  }

  // 2. Try MediaBunny (~5 KB WebCodecs)
  if (isWebCodecsSupported()) {
    try {
      onProgress?.(15, 'Initializing MediaBunny hardware acceleration...');
      const input = new Input({
        formats: ALL_FORMATS,
        source: new BlobSource(file),
      });

      let outputFormatObj: any;
      switch (targetFormat) {
        case 'wav':
          outputFormatObj = new WavOutputFormat();
          break;
        case 'mp3':
          outputFormatObj = new Mp3OutputFormat();
          break;
        case 'ogg':
          outputFormatObj = new OggOutputFormat();
          break;
        case 'flac':
          outputFormatObj = new FlacOutputFormat();
          break;
        case 'm4a':
          outputFormatObj = new Mp4OutputFormat();
          break;
        default:
          outputFormatObj = new WavOutputFormat();
      }

      const target = new BufferTarget();
      const output = new Output({
        format: outputFormatObj,
        target,
      });

      const audioOptions: any = {
        bitrate: bitrateKbps * 1000,
      };
      if (sampleRate) {
        audioOptions.sampleRate = sampleRate;
      }
      if (channels) {
        audioOptions.numberOfChannels = channels;
      }

      const conversion = await Conversion.init({
        input,
        output,
        audio: audioOptions,
      });

      if (conversion.isValid) {
        conversion.onProgress = (progress) => {
          const percent = Math.min(95, Math.max(15, Math.round(progress * 100)));
          onProgress?.(percent, `Converting with MediaBunny (${percent}%)...`);
        };

        await conversion.execute();

        if (target.buffer) {
          const blob = new Blob([target.buffer], { type: MIME_TYPES[targetFormat] });
          onProgress?.(100, 'Done!');
          return {
            blob,
            outputFileName,
            originalSize,
            newSize: blob.size,
            format: targetFormat,
            engineUsed: 'mediabunny',
          };
        }
      }
    } catch (mbErr) {
      console.warn('MediaBunny conversion encountered an error, activating fallback:', mbErr);
    }
  }

  // 3. Fallback: if browser lacks WebCodecs or MediaBunny could not encode the format
  // If target is WAV, use Web Audio API
  if (targetFormat === 'wav') {
    onProgress?.(30, 'Using Web Audio API engine...');
    const audioBuffer = await decodeAudioFile(file);
    onProgress?.(80, 'Exporting WAV...');
    const wavBlob = audioBufferToWav(audioBuffer);
    onProgress?.(100, 'Complete!');
    return {
      blob: wavBlob,
      outputFileName,
      originalSize,
      newSize: wavBlob.size,
      format: 'wav',
      engineUsed: 'webaudio',
    };
  }

  // For non-WAV lossy formats without WebCodecs, load ffmpeg.wasm with the explicit user notice
  const noticeMsg = 'Your browser needs a one-time 25 MB download for this conversion. Please wait.';
  onNotice?.(noticeMsg);
  onProgress?.(20, noticeMsg);

  try {
    const ffmpegBlob = await runFfmpegWasmFallback(file, targetFormat, bitrateKbps, sampleRate, channels, onProgress);
    return {
      blob: ffmpegBlob,
      outputFileName,
      originalSize,
      newSize: ffmpegBlob.size,
      format: targetFormat,
      engineUsed: 'ffmpeg-wasm',
    };
  } catch (ffmpegErr: any) {
    console.warn('ffmpeg fallback failed or timed out, exporting high-compatibility WAV instead:', ffmpegErr);
    // If external CDN download was blocked or failed, deliver high-quality lossless WAV with friendly notice
    onNotice?.('Could not download external codec engine. Converted to high-fidelity universal WAV instead.');
    const audioBuffer = await decodeAudioFile(file);
    const wavBlob = audioBufferToWav(audioBuffer);
    return {
      blob: wavBlob,
      outputFileName: `${baseName}.wav`,
      originalSize,
      newSize: wavBlob.size,
      format: 'wav',
      engineUsed: 'webaudio',
    };
  }
}

/**
 * Loads ffmpeg.wasm on-demand from CDN with single-threaded mode (no SharedArrayBuffer required).
 */
async function runFfmpegWasmFallback(
  file: File,
  targetFormat: SupportedAudioFormat,
  bitrateKbps: number,
  sampleRate?: number,
  channels?: 1 | 2,
  onProgress?: (percent: number, msg: string) => void
): Promise<Blob> {
  // Ensure FFmpeg script is loaded on window
  if (!(window as any).FFmpeg) {
    onProgress?.(30, 'Downloading codec engine (~25 MB)...');
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load ffmpeg.wasm script from CDN'));
      document.head.appendChild(script);
    });
  }

  const { createFFmpeg, fetchFile } = (window as any).FFmpeg;
  const ffmpeg = createFFmpeg({
    corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
    log: false,
  });

  if (!ffmpeg.isLoaded()) {
    onProgress?.(50, 'Initializing WebAssembly audio core...');
    await ffmpeg.load();
  }

  onProgress?.(70, 'Writing audio data into virtual file system...');
  const inputExt = file.name.split('.').pop() || 'tmp';
  const inputName = `input.${inputExt}`;
  const outputName = `output.${targetFormat}`;

  ffmpeg.FS('writeFile', inputName, await fetchFile(file));

  const args = ['-i', inputName, '-b:a', `${bitrateKbps}k`];
  if (sampleRate) {
    args.push('-ar', `${sampleRate}`);
  }
  if (channels) {
    args.push('-ac', `${channels}`);
  }
  args.push(outputName);

  onProgress?.(85, `Transcoding audio to ${targetFormat.toUpperCase()}...`);
  await ffmpeg.run(...args);

  const data = ffmpeg.FS('readFile', outputName);
  // Clean up memory in virtual FS
  try {
    ffmpeg.FS('unlink', inputName);
    ffmpeg.FS('unlink', outputName);
  } catch {}

  onProgress?.(100, 'Complete!');
  return new Blob([data.buffer], { type: MIME_TYPES[targetFormat] });
}
