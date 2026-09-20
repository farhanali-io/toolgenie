import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const WidgetLoader: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-secondary)' }}>
    <Loader2 size={28} className="animate-spin" style={{ color: 'var(--accent)' }} />
    <span className="text-xs font-semibold">Loading secure tool environment...</span>
  </div>
);

// PDF Tools
const MergePdfWidget = lazy(() => import('./pdf/MergePdfWidget').then(m => ({ default: m.MergePdfWidget })));
const SplitPdfWidget = lazy(() => import('./pdf/SplitPdfWidget').then(m => ({ default: m.SplitPdfWidget })));
const RotatePdfWidget = lazy(() => import('./pdf/RotatePdfWidget').then(m => ({ default: m.RotatePdfWidget })));
const ImageToPdfWidget = lazy(() => import('./pdf/ImageToPdfWidget').then(m => ({ default: m.ImageToPdfWidget })));
const CompressPdfWidget = lazy(() => import('./pdf/CompressPdfWidget').then(m => ({ default: m.CompressPdfWidget })));

// Image Tools
const ImageCompressorWidget = lazy(() => import('./image/ImageCompressorWidget').then(m => ({ default: m.ImageCompressorWidget })));
const ImageConverterWidget = lazy(() => import('./image/ImageConverterWidget').then(m => ({ default: m.ImageConverterWidget })));
const ImageResizerWidget = lazy(() => import('./image/ImageResizerWidget').then(m => ({ default: m.ImageResizerWidget })));
const ImageCropperWidget = lazy(() => import('./image/ImageCropperWidget').then(m => ({ default: m.ImageCropperWidget })));
const WatermarkImageWidget = lazy(() => import('./image/WatermarkImageWidget').then(m => ({ default: m.WatermarkImageWidget })));

// Developer Tools
const JsonFormatterWidget = lazy(() => import('./developer/JsonFormatterWidget').then(m => ({ default: m.JsonFormatterWidget })));
const Base64Widget = lazy(() => import('./developer/Base64Widget').then(m => ({ default: m.Base64Widget })));
const HashGeneratorWidget = lazy(() => import('./developer/HashGeneratorWidget').then(m => ({ default: m.HashGeneratorWidget })));
const QrCodeGeneratorWidget = lazy(() => import('./developer/QrCodeGeneratorWidget').then(m => ({ default: m.QrCodeGeneratorWidget })));
const PasswordGeneratorWidget = lazy(() => import('./developer/PasswordGeneratorWidget').then(m => ({ default: m.PasswordGeneratorWidget })));

// Text Tools
const WordCounterWidget = lazy(() => import('./text/WordCounterWidget').then(m => ({ default: m.WordCounterWidget })));
const CaseConverterWidget = lazy(() => import('./text/CaseConverterWidget').then(m => ({ default: m.CaseConverterWidget })));
const LoremIpsumWidget = lazy(() => import('./text/LoremIpsumWidget').then(m => ({ default: m.LoremIpsumWidget })));
const TextDiffWidget = lazy(() => import('./text/TextDiffWidget').then(m => ({ default: m.TextDiffWidget })));

// Direct Link Tools
const DirectImageDownloaderWidget = lazy(() => import('./direct/DirectImageDownloaderWidget').then(m => ({ default: m.DirectImageDownloaderWidget })));
const HlsDownloaderWidget = lazy(() => import('./direct/HlsDownloaderWidget').then(m => ({ default: m.HlsDownloaderWidget })));
const UrlToQrWidget = lazy(() => import('./direct/UrlToQrWidget').then(m => ({ default: m.UrlToQrWidget })));
const FileHashCheckerWidget = lazy(() => import('./direct/FileHashCheckerWidget').then(m => ({ default: m.FileHashCheckerWidget })));

// Converter Tools
const HeicToJpgWidget = lazy(() => import('./converter/HeicToJpgWidget').then(m => ({ default: m.HeicToJpgWidget })));
const CsvToJsonWidget = lazy(() => import('./converter/CsvToJsonWidget').then(m => ({ default: m.CsvToJsonWidget })));
const JsonToCsvWidget = lazy(() => import('./converter/JsonToCsvWidget').then(m => ({ default: m.JsonToCsvWidget })));
const MarkdownToHtmlWidget = lazy(() => import('./converter/MarkdownToHtmlWidget').then(m => ({ default: m.MarkdownToHtmlWidget })));
const HtmlToMarkdownWidget = lazy(() => import('./converter/HtmlToMarkdownWidget').then(m => ({ default: m.HtmlToMarkdownWidget })));
const UnitConverterWidget = lazy(() => import('./converter/UnitConverterWidget').then(m => ({ default: m.UnitConverterWidget })));

// Audio Tools
const AudioTrimmerWidget = lazy(() => import('./audio/AudioTrimmerWidget').then(m => ({ default: m.default || m.AudioTrimmerWidget })));
const AudioConverterWidget = lazy(() => import('./audio/AudioConverterWidget').then(m => ({ default: m.default || m.AudioConverterWidget })));
const AudioCompressorWidget = lazy(() => import('./audio/AudioCompressorWidget').then(m => ({ default: m.default || m.AudioCompressorWidget })));
const ChangeVolumeWidget = lazy(() => import('./audio/ChangeVolumeWidget').then(m => ({ default: m.default || m.ChangeVolumeWidget })));
const AudioMetadataEditorWidget = lazy(() => import('./audio/AudioMetadataEditorWidget').then(m => ({ default: m.default || m.AudioMetadataEditorWidget })));

// Video Tools
const TrimVideoWidget = lazy(() => import('./video/TrimVideoWidget').then(m => ({ default: m.default || m.TrimVideoWidget })));
const CompressVideoWidget = lazy(() => import('./video/CompressVideoWidget').then(m => ({ default: m.default || m.CompressVideoWidget })));
const VideoToGifWidget = lazy(() => import('./video/VideoToGifWidget').then(m => ({ default: m.default || m.VideoToGifWidget })));
const ExtractAudioWidget = lazy(() => import('./video/ExtractAudioWidget').then(m => ({ default: m.default || m.ExtractAudioWidget })));
const MuteVideoWidget = lazy(() => import('./video/MuteVideoWidget').then(m => ({ default: m.default || m.MuteVideoWidget })));
const ResizeVideoWidget = lazy(() => import('./video/ResizeVideoWidget').then(m => ({ default: m.default || m.ResizeVideoWidget })));
const ConvertVideoFormatWidget = lazy(() => import('./video/ConvertVideoFormatWidget').then(m => ({ default: m.default || m.ConvertVideoFormatWidget })));

// AI Tools
const TextSummarizerWidget = lazy(() => import('./ai/TextSummarizerWidget').then(m => ({ default: m.default || m.TextSummarizerWidget })));
const GrammarCheckerWidget = lazy(() => import('./ai/GrammarCheckerWidget').then(m => ({ default: m.default || m.GrammarCheckerWidget })));
const BackgroundRemoverWidget = lazy(() => import('./ai/BackgroundRemoverWidget').then(m => ({ default: m.default || m.BackgroundRemoverWidget })));
const ImageToTextOcrWidget = lazy(() => import('./ai/ImageToTextOcrWidget').then(m => ({ default: m.default || m.ImageToTextOcrWidget })));

interface ToolWidgetDispatcherProps {
  toolSlug: string;
  categorySlug: string;
}

const IMPLEMENTED_TOOL_SLUGS = new Set([
  // PDF Tools (5)
  'merge-pdf',
  'split-pdf',
  'rotate-pdf',
  'image-to-pdf',
  'compress-pdf',
  // Image Tools (5)
  'image-compressor',
  'image-converter',
  'image-resizer',
  'image-cropper',
  'watermark-image',
  // Developer Tools (5)
  'json-formatter',
  'base64-encoder-decoder',
  'hash-generator',
  'qr-code-generator',
  'password-generator',
  // Text Tools (4)
  'word-counter',
  'case-converter',
  'lorem-ipsum-generator',
  'text-diff-checker',
  // Direct Link Tools (4)
  'direct-image-downloader',
  'hls-stream-downloader',
  'url-to-qr-code',
  'file-hash-checker',
  // Converter Tools (6)
  'heic-to-jpg',
  'csv-to-json',
  'json-to-csv',
  'markdown-to-html',
  'html-to-markdown',
  'unit-converter',
  // Audio Tools (5)
  'audio-trimmer',
  'audio-converter',
  'audio-compressor',
  'change-volume',
  'audio-metadata-editor',
  // Video Tools (7)
  'trim-video',
  'compress-video',
  'video-to-gif',
  'extract-audio',
  'mute-video',
  'resize-video',
  'convert-video-format',
  // AI Tools (4)
  'text-summarizer',
  'grammar-checker',
  'background-remover',
  'image-to-text-ocr',
]);

export const hasToolWidget = (slug: string): boolean => {
  return IMPLEMENTED_TOOL_SLUGS.has(slug);
};

export const ToolWidgetDispatcher: React.FC<ToolWidgetDispatcherProps> = ({ toolSlug }) => {
  const renderWidget = () => {
    switch (toolSlug) {
      // PDF Tools
      case 'merge-pdf':
        return <MergePdfWidget />;
      case 'split-pdf':
        return <SplitPdfWidget />;
      case 'rotate-pdf':
        return <RotatePdfWidget />;
      case 'image-to-pdf':
        return <ImageToPdfWidget />;
      case 'compress-pdf':
        return <CompressPdfWidget />;

      // Image Tools
      case 'image-compressor':
        return <ImageCompressorWidget />;
      case 'image-converter':
        return <ImageConverterWidget />;
      case 'image-resizer':
        return <ImageResizerWidget />;
      case 'image-cropper':
        return <ImageCropperWidget />;
      case 'watermark-image':
        return <WatermarkImageWidget />;

      // Developer Tools
      case 'json-formatter':
        return <JsonFormatterWidget />;
      case 'base64-encoder-decoder':
        return <Base64Widget />;
      case 'hash-generator':
        return <HashGeneratorWidget />;
      case 'qr-code-generator':
        return <QrCodeGeneratorWidget />;
      case 'password-generator':
        return <PasswordGeneratorWidget />;

      // Text Tools
      case 'word-counter':
        return <WordCounterWidget />;
      case 'case-converter':
        return <CaseConverterWidget />;
      case 'lorem-ipsum-generator':
        return <LoremIpsumWidget />;
      case 'text-diff-checker':
        return <TextDiffWidget />;

      // Direct Link Tools
      case 'direct-image-downloader':
        return <DirectImageDownloaderWidget />;
      case 'hls-stream-downloader':
        return <HlsDownloaderWidget />;
      case 'url-to-qr-code':
        return <UrlToQrWidget />;
      case 'file-hash-checker':
        return <FileHashCheckerWidget />;

      // Converter Tools
      case 'heic-to-jpg':
        return <HeicToJpgWidget />;
      case 'csv-to-json':
        return <CsvToJsonWidget />;
      case 'json-to-csv':
        return <JsonToCsvWidget />;
      case 'markdown-to-html':
        return <MarkdownToHtmlWidget />;
      case 'html-to-markdown':
        return <HtmlToMarkdownWidget />;
      case 'unit-converter':
        return <UnitConverterWidget />;

      // Audio Tools
      case 'audio-trimmer':
        return <AudioTrimmerWidget />;
      case 'audio-converter':
        return <AudioConverterWidget />;
      case 'audio-compressor':
        return <AudioCompressorWidget />;
      case 'change-volume':
        return <ChangeVolumeWidget />;
      case 'audio-metadata-editor':
        return <AudioMetadataEditorWidget />;

      // Video Tools
      case 'trim-video':
        return <TrimVideoWidget />;
      case 'compress-video':
        return <CompressVideoWidget />;
      case 'video-to-gif':
        return <VideoToGifWidget />;
      case 'extract-audio':
        return <ExtractAudioWidget />;
      case 'mute-video':
        return <MuteVideoWidget />;
      case 'resize-video':
        return <ResizeVideoWidget />;
      case 'convert-video-format':
        return <ConvertVideoFormatWidget />;

      // AI Tools
      case 'text-summarizer':
        return <TextSummarizerWidget />;
      case 'grammar-checker':
        return <GrammarCheckerWidget />;
      case 'background-remover':
        return <BackgroundRemoverWidget />;
      case 'image-to-text-ocr':
        return <ImageToTextOcrWidget />;

      default:
        return null;
    }
  };

  const widget = renderWidget();
  if (!widget) return null;

  return (
    <Suspense fallback={<WidgetLoader />}>
      {widget}
    </Suspense>
  );
};
