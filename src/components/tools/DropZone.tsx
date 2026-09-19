import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  accept: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title: string;
  description: string;
  accentColor?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept,
  multiple = false,
  onFilesSelected,
  title,
  description,
  accentColor = 'var(--accent)',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setErrorMsg(null);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    if (!multiple && droppedFiles.length > 1) {
      onFilesSelected([droppedFiles[0]]);
    } else {
      onFilesSelected(droppedFiles);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      onFilesSelected(selected);
      // reset so the same file can be re-picked if needed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`group relative rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center select-none ${
        isDragOver
          ? 'scale-[1.01] shadow-lg'
          : 'hover:border-current hover:shadow-sm'
      }`}
      style={{
        backgroundColor: isDragOver ? 'var(--bg-input)' : 'var(--bg-surface)',
        borderColor: isDragOver ? accentColor : 'var(--border-strong)',
        color: 'var(--text-primary)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 border"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-subtle)',
          color: accentColor,
        }}
      >
        <UploadCloud size={32} />
      </div>

      <h3 className="font-heading text-lg sm:text-xl font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>

      <p className="text-xs sm:text-sm max-w-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-opacity hover:opacity-90"
          style={{
            backgroundColor: accentColor,
            color: 'var(--accent-contrast)',
          }}
        >
          <File size={14} />
          <span>Browse Files</span>
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {multiple ? 'Select multiple files' : 'Single file'}
        </span>
      </div>

      {errorMsg && (
        <div className="mt-4 flex items-center gap-1.5 text-xs text-red-500 font-medium">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
