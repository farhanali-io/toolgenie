// Utility functions and engine wrappers for client-side video processing using MediaBunny & WebCodecs

import {
  Input,
  Output,
  BlobSource,
  BufferTarget,
  Conversion,
  ALL_FORMATS,
  Mp4OutputFormat,
  WebMOutputFormat,
  MkvOutputFormat,
  MovOutputFormat,
  Mp3OutputFormat,
  WavOutputFormat,
  QUALITY_LOW,
  QUALITY_MEDIUM,
  QUALITY_HIGH,
  Quality,
} from 'mediabunny';

import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: number;
  videoCodec?: string;
  audioCodec?: string;
  hasAudio: boolean;
  fileSize: number;
  fileName: string;
  mimeType: string;
}

/**
 * Checks if hardware-accelerated WebCodecs Video Encoder & Decoder are available.
 */
export function isWebCodecsVideoSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    typeof (window as any).VideoEncoder === 'function' &&
    typeof (window as any).VideoDecoder === 'function'
  );
}

/**
 * Probes a video File or Blob using HTML5 Video + MediaBunny to extract exact metadata.
 */
export async function probeVideoFile(file: File): Promise<{
  metadata: VideoMetadata;
  previewUrl: string;
}> {
  const previewUrl = URL.createObjectURL(file);

  // 1. First probe via HTML5 Video element for fast dimensions & duration
  const elementPromise = new Promise<{ width: number; height: number; duration: number }>((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth || 1280,
        height: video.videoHeight || 720,
        duration: isFinite(video.duration) ? video.duration : 0,
      });
    };

    video.onerror = () => {
      resolve({ width: 1280, height: 720, duration: 0 });
    };

    video.src = previewUrl;
  });

  const elementInfo = await elementPromise;

  // 2. Probe track-level codecs via MediaBunny Input
  let videoCodec = 'h264';
  let audioCodec: string | undefined = undefined;
  let hasAudio = false;
  let duration = elementInfo.duration;

  try {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    const vTracks = await input.getVideoTracks();
    if (vTracks.length > 0) {
      videoCodec = vTracks[0].codec || 'h264';
    }

    const aTracks = await input.getAudioTracks();
    if (aTracks.length > 0) {
      hasAudio = true;
      audioCodec = aTracks[0].codec || 'aac';
    }

    const mbDuration = await input.computeDuration();
    if (mbDuration && mbDuration > 0) {
      duration = mbDuration;
    }
  } catch (err) {
    console.warn('MediaBunny track probe notice (falling back to element metadata):', err);
  }

  const width = elementInfo.width || 1280;
  const height = elementInfo.height || 720;

  return {
    previewUrl,
    metadata: {
      duration,
      width,
      height,
      aspectRatio: width / (height || 1),
      videoCodec,
      audioCodec,
      hasAudio,
      fileSize: file.size,
      fileName: file.name,
      mimeType: file.type || 'video/mp4',
    },
  };
}

export interface VideoProcessingOptions {
  onProgress?: (percentage: number, statusText: string) => void;
  signal?: AbortSignal;
}

export interface VideoResult {
  blob: Blob;
  url: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  format: string;
}

/**
 * Maps format string to MediaBunny OutputFormat instance and MIME type.
 */
export function getOutputFormat(formatName: string): {
  formatObj: any;
  mimeType: string;
  extension: string;
} {
  const norm = formatName.toLowerCase();
  switch (norm) {
    case 'webm':
      return { formatObj: new WebMOutputFormat(), mimeType: 'video/webm', extension: 'webm' };
    case 'mkv':
      return { formatObj: new MkvOutputFormat(), mimeType: 'video/x-matroska', extension: 'mkv' };
    case 'mov':
      return { formatObj: new MovOutputFormat(), mimeType: 'video/quicktime', extension: 'mov' };
    case 'mp3':
      return { formatObj: new Mp3OutputFormat(), mimeType: 'audio/mpeg', extension: 'mp3' };
    case 'wav':
      return { formatObj: new WavOutputFormat(), mimeType: 'audio/wav', extension: 'wav' };
    case 'mp4':
    default:
      return { formatObj: new Mp4OutputFormat(), mimeType: 'video/mp4', extension: 'mp4' };
  }
}

/**
 * 1. Trim Video using MediaBunny microsecond-accurate trim ranges.
 */
export async function trimVideo(
  file: File,
  startSec: number,
  endSec: number,
  targetFormat: string = 'mp4',
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat(targetFormat);
  const output = new Output({ target, format: formatObj });

  const conversion = await Conversion.init({
    input,
    output,
    trim: {
      start: Math.max(0, startSec),
      end: endSec,
    },
    copy: {}, // Copy encoded packets where possible for near-instant execution
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Trimming video (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Trimming failed: empty output buffer returned from engine.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Trimming complete!');

  return {
    blob,
    url,
    size: blob.size,
    duration: Math.max(0, endSec - startSec),
    format: extension,
  };
}

/**
 * 2. Compress Video using MediaBunny quality levels or custom bitrate.
 */
export async function compressVideo(
  file: File,
  config: {
    qualityPreset?: 'low' | 'medium' | 'high';
    targetBitrate?: number; // in bps
    resolutionScale?: number; // e.g. 1.0, 0.75, 0.5
    originalWidth?: number;
    originalHeight?: number;
  },
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat('mp4');
  const output = new Output({ target, format: formatObj });

  let quality: Quality = QUALITY_MEDIUM;
  if (config.qualityPreset === 'low') quality = QUALITY_LOW;
  if (config.qualityPreset === 'high') quality = QUALITY_HIGH;

  const videoOpts: any = {
    forceTranscode: true,
  };

  if (config.targetBitrate && config.targetBitrate > 0) {
    videoOpts.bitrate = config.targetBitrate;
  } else {
    videoOpts.quality = quality;
  }

  if (config.resolutionScale && config.resolutionScale < 1 && config.originalWidth && config.originalHeight) {
    // Ensure even dimensions for video encoders
    const scaledW = Math.round((config.originalWidth * config.resolutionScale) / 2) * 2;
    const scaledH = Math.round((config.originalHeight * config.resolutionScale) / 2) * 2;
    videoOpts.width = Math.max(160, scaledW);
    videoOpts.height = Math.max(120, scaledH);
    videoOpts.fit = 'contain';
  }

  const conversion = await Conversion.init({
    input,
    output,
    video: videoOpts,
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Compressing video stream (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Compression failed: output buffer was not produced.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Compression complete!');

  return {
    blob,
    url,
    size: blob.size,
    format: extension,
  };
}

/**
 * 3. Mute Video: strips audio track and preserves video packets without re-encoding.
 */
export async function muteVideo(
  file: File,
  targetFormat: string = 'mp4',
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat(targetFormat);
  const output = new Output({ target, format: formatObj });

  const conversion = await Conversion.init({
    input,
    output,
    audio: {
      discard: true, // Drop all audio tracks
    },
    copy: {}, // Zero re-encode packet copy
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Stripping audio track (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Muting failed: output buffer was empty.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Video muted successfully!');

  return {
    blob,
    url,
    size: blob.size,
    format: extension,
  };
}

/**
 * 4. Resize Video to specific width, height, and fit mode.
 */
export async function resizeVideo(
  file: File,
  width: number,
  height: number,
  fit: 'contain' | 'fill' | 'cover' = 'contain',
  targetFormat: string = 'mp4',
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat(targetFormat);
  const output = new Output({ target, format: formatObj });

  // Encoders require even dimensions (divisible by 2)
  const evenWidth = Math.round(width / 2) * 2;
  const evenHeight = Math.round(height / 2) * 2;

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      width: evenWidth,
      height: evenHeight,
      fit,
      forceTranscode: true,
    },
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Resizing video frames (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Resize failed: output buffer was empty.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Resize complete!');

  return {
    blob,
    url,
    size: blob.size,
    width: evenWidth,
    height: evenHeight,
    format: extension,
  };
}

/**
 * 5. Convert Video Format / Transmuxing: MP4, WebM, MKV, MOV.
 */
export async function convertVideoFormat(
  file: File,
  targetFormat: string,
  qualityPreset: 'low' | 'medium' | 'high' = 'medium',
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat(targetFormat);
  const output = new Output({ target, format: formatObj });

  let quality: Quality = QUALITY_MEDIUM;
  if (qualityPreset === 'low') quality = QUALITY_LOW;
  if (qualityPreset === 'high') quality = QUALITY_HIGH;

  // Conversion with copy: {} attempts zero-transcode transmuxing first;
  // if codecs are incompatible with target container, it seamlessly transcodes
  const conversion = await Conversion.init({
    input,
    output,
    video: {
      quality,
    },
    copy: {},
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Converting container and streams (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Conversion failed: output buffer was empty.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Conversion complete!');

  return {
    blob,
    url,
    size: blob.size,
    format: extension,
  };
}

/**
 * 6. Extract Audio from Video directly into MP3 or WAV.
 */
export async function extractAudioFromVideo(
  file: File,
  targetFormat: 'mp3' | 'wav' = 'mp3',
  bitrateKbps: number = 192,
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  const { formatObj, mimeType, extension } = getOutputFormat(targetFormat);
  const output = new Output({ target, format: formatObj });

  const audioOptions: any = {};
  if (targetFormat === 'mp3') {
    audioOptions.bitrate = bitrateKbps * 1000;
  }

  const conversion = await Conversion.init({
    input,
    output,
    video: {
      discard: true, // Discard video track completely
    },
    audio: audioOptions,
    copy: targetFormat === 'wav' ? false : {},
  });

  if (options?.onProgress) {
    conversion.onProgress = (progress) => {
      const pct = Math.min(99, Math.round(progress * 100));
      options.onProgress?.(pct, `Extracting audio samples (${pct}%)...`);
    };
  }

  if (options?.signal) {
    options.signal.addEventListener('abort', () => {
      conversion.cancel().catch(() => {});
    });
  }

  await conversion.execute();

  if (!target.buffer) {
    throw new Error('Audio extraction failed: output buffer was empty.');
  }

  const blob = new Blob([target.buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);

  options?.onProgress?.(100, 'Audio extracted successfully!');

  return {
    blob,
    url,
    size: blob.size,
    format: extension,
  };
}

/**
 * 7. Convert Video to animated GIF using Canvas frame extraction + gifenc.
 */
export async function convertVideoToGif(
  file: File,
  config: {
    startSec: number;
    endSec: number;
    fps: number; // 10, 15, 24
    width: number; // 320, 480, 640
    maxColors?: number; // 128, 256
  },
  options?: VideoProcessingOptions
): Promise<VideoResult> {
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = objectUrl;
  video.muted = true;
  video.playsInline = true;

  // Wait for metadata to obtain aspect ratio
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Failed to load video for GIF extraction.'));
  });

  const duration = Math.min(video.duration, config.endSec) - config.startSec;
  if (duration <= 0) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Invalid trim range for GIF export.');
  }

  const naturalWidth = video.videoWidth || 640;
  const naturalHeight = video.videoHeight || 360;
  const targetWidth = config.width;
  const targetHeight = Math.round((config.width * naturalHeight) / naturalWidth);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    throw new Error('Canvas 2D context is unavailable.');
  }

  const fps = Math.max(5, Math.min(30, config.fps));
  const interval = 1 / fps;
  const totalFrames = Math.max(1, Math.floor(duration * fps));
  const delayMs = Math.round(1000 / fps);

  // Initialize GIF encoder
  const encoder = GIFEncoder();
  const maxColors = config.maxColors || 256;

  let currentFrame = 0;
  let currentTime = config.startSec;

  try {
    while (currentFrame < totalFrames) {
      if (options?.signal?.aborted) {
        throw new Error('GIF generation was cancelled.');
      }

      // Seek to current time
      video.currentTime = currentTime;
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener('seeked', onSeeked);
          resolve();
        };
        video.addEventListener('seeked', onSeeked);
      });

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
      const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
      const rgba = imgData.data;

      // Quantize palette and write frame to GIF
      const palette = quantize(rgba, maxColors);
      const index = applyPalette(rgba, palette);
      encoder.writeFrame(index, targetWidth, targetHeight, {
        palette,
        delay: delayMs,
      });

      currentFrame++;
      currentTime += interval;

      const progress = Math.round((currentFrame / totalFrames) * 95);
      options?.onProgress?.(
        progress,
        `Rendering GIF frames (${currentFrame}/${totalFrames} at ${targetWidth}×${targetHeight})...`
      );
    }

    encoder.finish();
    const gifBytes = encoder.bytes();
    const blob = new Blob([gifBytes], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    options?.onProgress?.(100, 'GIF encoding complete!');

    return {
      blob,
      url,
      size: blob.size,
      width: targetWidth,
      height: targetHeight,
      duration,
      format: 'gif',
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
