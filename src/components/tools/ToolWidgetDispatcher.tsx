import React from 'react';
// PDF Tools
import { MergePdfWidget } from './pdf/MergePdfWidget';
import { SplitPdfWidget } from './pdf/SplitPdfWidget';
import { RotatePdfWidget } from './pdf/RotatePdfWidget';
import { ImageToPdfWidget } from './pdf/ImageToPdfWidget';
import { CompressPdfWidget } from './pdf/CompressPdfWidget';
// Image Tools
import { ImageCompressorWidget } from './image/ImageCompressorWidget';
import { ImageConverterWidget } from './image/ImageConverterWidget';
import { ImageResizerWidget } from './image/ImageResizerWidget';
import { ImageCropperWidget } from './image/ImageCropperWidget';
import { WatermarkImageWidget } from './image/WatermarkImageWidget';
// Developer Tools
import { JsonFormatterWidget } from './developer/JsonFormatterWidget';
import { Base64Widget } from './developer/Base64Widget';
import { HashGeneratorWidget } from './developer/HashGeneratorWidget';
import { QrCodeGeneratorWidget } from './developer/QrCodeGeneratorWidget';
import { PasswordGeneratorWidget } from './developer/PasswordGeneratorWidget';
// Text Tools
import { WordCounterWidget } from './text/WordCounterWidget';
import { CaseConverterWidget } from './text/CaseConverterWidget';
import { LoremIpsumWidget } from './text/LoremIpsumWidget';
import { TextDiffWidget } from './text/TextDiffWidget';
// Direct Link Tools
import { DirectImageDownloaderWidget } from './direct/DirectImageDownloaderWidget';
import { HlsDownloaderWidget } from './direct/HlsDownloaderWidget';
import { UrlToQrWidget } from './direct/UrlToQrWidget';
import { FileHashCheckerWidget } from './direct/FileHashCheckerWidget';

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
]);

export const hasToolWidget = (slug: string): boolean => {
  return IMPLEMENTED_TOOL_SLUGS.has(slug);
};

export const ToolWidgetDispatcher: React.FC<ToolWidgetDispatcherProps> = ({ toolSlug }) => {
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

    default:
      return null;
  }
};
