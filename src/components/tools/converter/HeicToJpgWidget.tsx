import React, { useState, useRef, useEffect } from 'react';
import heic2any from 'heic2any';
import JSZip from 'jszip';
import { 
  UploadCloud, 
  FileImage, 
  Download, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  RefreshCw,
  Archive,
  Image as ImageIcon
} from 'lucide-react';
import { DropZone } from '../DropZone';

interface ConvertedItem {
  id: string;
  file: File;
  originalSize: number;
  originalName: string;
  jpgBlob?: Blob;
  previewUrl?: string;
  convertedSize?: number;
  status: 'idle' | 'converting' | 'completed' | 'error';
  errorMessage?: string;
}

export const HeicToJpgWidget: React.FC = () => {
  const [items, setItems] = useState<ConvertedItem[]>([]);
  const [quality, setQuality] = useState<number>(0.9);
  const [isBatchConverting, setIsBatchConverting] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Keep track of object URLs for cleanup
  const objectUrlsRef = useRef<string[]>([]);

  const registerObjectUrl = (url: string) => {
    objectUrlsRef.current.push(url);
    return url;
  };

  useEffect(() => {
    return () => {
      // Clean up all object URLs on unmount
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFilesSelected = (files: File[]) => {
    setGlobalMessage(null);
    const validExtensions = ['.heic', '.heif'];
    const newItems: ConvertedItem[] = [];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      // Allow if file extension matches or type matches heic/heif
      const isHeic = validExtensions.includes(ext) || file.type.includes('heic') || file.type.includes('heif') || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');

      if (!isHeic) {
        setGlobalMessage({
          type: 'info',
          text: `Skipped "${file.name}" because it does not appear to be a .heic or .heif photo.`
        });
        continue;
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        originalSize: file.size,
        originalName: file.name,
        status: 'idle'
      });
    }

    if (newItems.length > 0) {
      setItems(prev => [...prev, ...newItems]);
    }
  };

  const convertSingleItem = async (item: ConvertedItem, targetQuality: number): Promise<ConvertedItem> => {
    try {
      const conversionResult = await heic2any({
        blob: item.file,
        toType: 'image/jpeg',
        quality: targetQuality,
      });

      // heic2any may return a single Blob or Blob[]
      const blob = Array.isArray(conversionResult) ? conversionResult[0] : conversionResult;
      const previewUrl = registerObjectUrl(URL.createObjectURL(blob));

      return {
        ...item,
        status: 'completed',
        jpgBlob: blob,
        previewUrl,
        convertedSize: blob.size,
        errorMessage: undefined,
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        errorMessage: err.message || 'Could not parse HEIC image data. The file may be corrupt or encrypted.',
      };
    }
  };

  const convertItemById = async (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, status: 'converting', errorMessage: undefined } : it));
    const targetItem = items.find(it => it.id === id);
    if (!targetItem) return;

    const updated = await convertSingleItem(targetItem, quality);
    setItems(prev => prev.map(it => it.id === id ? updated : it));
  };

  const convertAllPending = async () => {
    setIsBatchConverting(true);
    setGlobalMessage(null);

    const pendingOrFailed = items.filter(it => it.status === 'idle' || it.status === 'error');
    if (pendingOrFailed.length === 0) {
      setIsBatchConverting(false);
      return;
    }

    // Process one by one to prevent browser tab thread lock
    for (const item of pendingOrFailed) {
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'converting' } : it));
      const updated = await convertSingleItem(item, quality);
      setItems(prev => prev.map(it => it.id === item.id ? updated : it));
    }

    setIsBatchConverting(false);
    setGlobalMessage({
      type: 'success',
      text: 'Conversion process finished! All photos are ready for download.'
    });
  };

  const downloadSingleJpg = (item: ConvertedItem) => {
    if (!item.jpgBlob) return;
    const baseName = item.originalName.replace(/\.(heic|heif)$/i, '');
    const fileName = `${baseName}.jpg`;
    const url = URL.createObjectURL(item.jpgBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const completedItems = items.filter(it => it.status === 'completed' && it.jpgBlob);
    if (completedItems.length === 0) return;

    if (completedItems.length === 1) {
      downloadSingleJpg(completedItems[0]);
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const usedNames = new Set<string>();

      completedItems.forEach((item, index) => {
        let baseName = item.originalName.replace(/\.(heic|heif)$/i, '');
        let fileName = `${baseName}.jpg`;
        let counter = 1;
        while (usedNames.has(fileName)) {
          fileName = `${baseName}_(${counter}).jpg`;
          counter++;
        }
        usedNames.add(fileName);
        zip.file(fileName, item.jpgBlob!);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toolgenie-heic-converted-jpgs-${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGlobalMessage({
        type: 'success',
        text: `Successfully packaged ${completedItems.length} photos into a ZIP file!`
      });
    } catch (err: any) {
      setGlobalMessage({
        type: 'error',
        text: 'Failed to generate ZIP archive: ' + (err.message || 'Unknown error')
      });
    } finally {
      setIsZipping(false);
    }
  };

  const removeItem = (id: string) => {
    const item = items.find(it => it.id === id);
    if (item?.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const clearAll = () => {
    items.forEach(it => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
    });
    setItems([]);
    setGlobalMessage(null);
  };

  const completedCount = items.filter(it => it.status === 'completed').length;
  const pendingCount = items.filter(it => it.status === 'idle' || it.status === 'error').length;

  return (
    <div className="space-y-8">
      {/* 1. File Upload Dropzone */}
      <DropZone
        accept=".heic,.heif,image/heic,image/heif"
        multiple={true}
        onFilesSelected={handleFilesSelected}
        title="Drop Apple HEIC / HEIF Photos Here"
        description="Select high-resolution iPhone photos to convert to universally compatible JPG format. 100% private in-browser decoding."
        accentColor="var(--accent)"
      />

      {/* Global alert feedback */}
      {globalMessage && (
        <div 
          className="p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm animate-fadeIn"
          style={{
            backgroundColor: globalMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)',
            borderColor: globalMessage.type === 'error' ? '#ef4444' : 'var(--border-subtle)',
            color: globalMessage.type === 'error' ? '#ef4444' : 'var(--text-primary)'
          }}
        >
          {globalMessage.type === 'error' ? (
            <AlertCircle size={18} className="shrink-0 text-red-500" />
          ) : globalMessage.type === 'success' ? (
            <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          ) : (
            <Sparkles size={18} className="shrink-0 text-indigo-500" />
          )}
          <span className="flex-1">{globalMessage.text}</span>
          <button 
            onClick={() => setGlobalMessage(null)}
            className="text-xs font-semibold underline hover:opacity-75"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Conversion Options and Control Bar */}
      {items.length > 0 && (
        <div 
          className="rounded-2xl border p-5 sm:p-6 space-y-6"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h3 className="font-heading text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Conversion Settings & Batch Actions
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {items.length} photo{items.length !== 1 ? 's' : ''} queued • {completedCount} converted
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={clearAll}
                disabled={isBatchConverting || isZipping}
                className="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Trash2 size={14} />
                <span>Clear All</span>
              </button>

              <button
                type="button"
                onClick={convertAllPending}
                disabled={isBatchConverting || pendingCount === 0}
                className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)'
                }}
              >
                {isBatchConverting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Convert {pendingCount > 0 ? `All (${pendingCount})` : 'All'}</span>
                  </>
                )}
              </button>

              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={downloadAllAsZip}
                  disabled={isZipping || isBatchConverting}
                  className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 text-white bg-emerald-600 hover:bg-emerald-500"
                >
                  {isZipping ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Creating ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Archive size={14} />
                      <span>Download All ({completedCount})</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Quality Slider */}
          <div className="space-y-2 max-w-md">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span style={{ color: 'var(--text-primary)' }}>JPG Output Quality</span>
              <span className="font-mono px-2 py-0.5 rounded-md border" style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--accent)' }}>
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              disabled={isBatchConverting}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
              <span>Smaller Size (50%)</span>
              <span>Recommended (90%)</span>
              <span>Maximum Fidelity (100%)</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Items List with Previews */}
      {items.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Photo Queue ({items.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 flex gap-4 items-center transition-all"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                {/* Thumbnail / Status Visualizer */}
                <div 
                  className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center relative"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)'
                  }}
                >
                  {item.status === 'completed' && item.previewUrl ? (
                    <img 
                      src={item.previewUrl} 
                      alt={item.originalName} 
                      className="w-full h-full object-cover"
                    />
                  ) : item.status === 'converting' ? (
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                  ) : item.status === 'error' ? (
                    <AlertCircle size={24} className="text-red-500" />
                  ) : (
                    <FileImage size={24} style={{ color: 'var(--text-muted)' }} />
                  )}

                  {item.status === 'completed' && (
                    <span className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-0.5">
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 
                    className="font-medium text-xs sm:text-sm truncate mb-1" 
                    style={{ color: 'var(--text-primary)' }}
                    title={item.originalName}
                  >
                    {item.originalName}
                  </h4>

                  <div className="flex flex-wrap items-center gap-2 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    <span>HEIC: {formatFileSize(item.originalSize)}</span>
                    {item.convertedSize && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-600 font-semibold">
                          JPG: {formatFileSize(item.convertedSize)}
                        </span>
                      </>
                    )}
                  </div>

                  {item.status === 'error' && (
                    <p className="text-[11px] text-red-500 mt-1 line-clamp-1">
                      {item.errorMessage || 'Conversion failed'}
                    </p>
                  )}

                  {item.status === 'idle' && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      Ready to convert
                    </p>
                  )}
                </div>

                {/* Actions per item */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.status === 'completed' ? (
                    <button
                      type="button"
                      onClick={() => downloadSingleJpg(item)}
                      title="Download converted JPG"
                      className="p-2 rounded-lg text-emerald-600 border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Download size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => convertItemById(item.id)}
                      disabled={item.status === 'converting' || isBatchConverting}
                      title="Convert this photo"
                      className="p-2 rounded-lg text-indigo-600 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw size={16} className={item.status === 'converting' ? 'animate-spin' : ''} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={item.status === 'converting' || isBatchConverting}
                    title="Remove from list"
                    className="p-2 rounded-lg text-red-500/70 hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
