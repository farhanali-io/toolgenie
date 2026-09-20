import React, { useState, useEffect, useRef } from 'react';
import * as id3Pkg from 'browser-id3-writer';
const ID3Writer = id3Pkg.ID3Writer || (id3Pkg as any).default || (id3Pkg as any);
import { 
  Tags, Download, Check, FileAudio, Image as ImageIcon, 
  Trash2, Upload, Sparkles, RefreshCw, Music, Disc, User, Calendar, Hash 
} from 'lucide-react';
import { DropZone } from '../DropZone';
import { ToolShell } from '../shared/ToolShell';
import { BrowserCapabilityNotice } from '../shared/BrowserCapabilityNotice';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ProgressBar } from '../shared/ProgressBar';
import { parseId3v2Tags } from '../../../utils/id3Reader';
import { formatAudioBytes } from '../../../utils/audioHelpers';

export const AudioMetadataEditorWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);

  // Editable Tag Fields
  const [title, setTitle] = useState<string>('');
  const [artist, setArtist] = useState<string>('');
  const [album, setAlbum] = useState<string>('');
  const [albumArtist, setAlbumArtist] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [track, setTrack] = useState<string>('');
  const [genre, setGenre] = useState<string>('');
  const [composer, setComposer] = useState<string>('');
  const [comment, setComment] = useState<string>('');

  // Artwork
  const [artworkBuffer, setArtworkBuffer] = useState<ArrayBuffer | null>(null);
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null);
  const [artworkFileName, setArtworkFileName] = useState<string | null>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  // Save / Result state
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedBlob, setSavedBlob] = useState<Blob | null>(null);
  const [savedUrl, setSavedUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (artworkUrl) URL.revokeObjectURL(artworkUrl);
      if (savedUrl) URL.revokeObjectURL(savedUrl);
    };
  }, [artworkUrl, savedUrl]);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setFile(selected);
    setSavedBlob(null);
    if (savedUrl) {
      URL.revokeObjectURL(savedUrl);
      setSavedUrl(null);
    }

    try {
      const buffer = await selected.arrayBuffer();
      setFileBuffer(buffer);

      // Parse existing tags from the file
      const existing = parseId3v2Tags(buffer);
      setTitle(existing.title || selected.name.replace(/\.[^/.]+$/, ''));
      setArtist(existing.artist || '');
      setAlbum(existing.album || '');
      setAlbumArtist(existing.albumArtist || '');
      setYear(existing.year || '');
      setTrack(existing.track || '');
      setGenre(existing.genre || '');
      setComposer(existing.composer || '');
      setComment(existing.comment || '');

      if (existing.artworkBlob && existing.artworkUrl) {
        setArtworkUrl(existing.artworkUrl);
        const artBuf = await existing.artworkBlob.arrayBuffer();
        setArtworkBuffer(artBuf);
        setArtworkFileName('Embedded Cover Art');
      } else {
        setArtworkUrl(null);
        setArtworkBuffer(null);
        setArtworkFileName(null);
      }
    } catch (err) {
      console.error('Error reading MP3 tags:', err);
    }
  };

  const handleArtworkSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const imgFile = e.target.files[0];
      const buffer = await imgFile.arrayBuffer();
      setArtworkBuffer(buffer);
      setArtworkFileName(imgFile.name);

      if (artworkUrl) URL.revokeObjectURL(artworkUrl);
      const url = URL.createObjectURL(imgFile);
      setArtworkUrl(url);
    }
  };

  const handleRemoveArtwork = () => {
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    setArtworkUrl(null);
    setArtworkBuffer(null);
    setArtworkFileName(null);
    if (artworkInputRef.current) artworkInputRef.current.value = '';
  };

  const handleSaveTags = async () => {
    if (!fileBuffer || !file) return;

    try {
      setIsSaving(true);

      // Create new ID3Writer wrapping the MP3 ArrayBuffer
      const writer = new ID3Writer(fileBuffer);

      if (title.trim()) {
        writer.setFrame('TIT2', title.trim());
      }
      if (artist.trim()) {
        writer.setFrame('TPE1', [artist.trim()]);
      }
      if (album.trim()) {
        writer.setFrame('TALB', album.trim());
      }
      if (albumArtist.trim()) {
        writer.setFrame('TPE2', albumArtist.trim());
      }
      if (year.trim()) {
        const parsedYear = parseInt(year.trim(), 10);
        if (!isNaN(parsedYear)) {
          writer.setFrame('TYER', parsedYear);
        }
      }
      if (track.trim()) {
        writer.setFrame('TRCK', track.trim());
      }
      if (genre.trim()) {
        writer.setFrame('TCON', [genre.trim()]);
      }
      if (composer.trim()) {
        writer.setFrame('TCOM', [composer.trim()]);
      }
      if (comment.trim()) {
        writer.setFrame('COMM', {
          description: '',
          text: comment.trim(),
        });
      }

      // Embed album art if present
      if (artworkBuffer) {
        writer.setFrame('APIC', {
          type: 3, // Cover (front)
          data: artworkBuffer,
          description: 'Front Cover',
        });
      }

      writer.addTag();

      const blob = writer.getBlob();
      setSavedBlob(blob);

      if (savedUrl) URL.revokeObjectURL(savedUrl);
      const url = URL.createObjectURL(blob);
      setSavedUrl(url);

      setIsSaving(false);
    } catch (err) {
      console.error('Failed to write ID3 tags:', err);
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    if (savedUrl) URL.revokeObjectURL(savedUrl);
    setFile(null);
    setFileBuffer(null);
    setSavedBlob(null);
    setSavedUrl(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setAlbumArtist('');
    setYear('');
    setTrack('');
    setGenre('');
    setComposer('');
    setComment('');
    setArtworkBuffer(null);
    setArtworkUrl(null);
    setArtworkFileName(null);
  };

  const currentStep = !file 
    ? 'dropzone' 
    : isSaving 
    ? 'progress' 
    : savedBlob 
    ? 'download' 
    : 'options';

  return (
    <ErrorBoundary fallbackTitle="Metadata Editor Error" onReset={handleReset}>
      <BrowserCapabilityNotice toolName="Audio Metadata Editor" />

      <ToolShell
        currentStep={currentStep}
        accentColor="#06b6d4"
        onReset={handleReset}
        title="ID3 Tag & Artwork Editor"
      >
        {/* Step 1: Drop Zone */}
        {!file && (
          <DropZone
            accept=".mp3,audio/mpeg,audio/mp3"
            onFilesSelected={handleFileSelected}
            title="Drop MP3 Track to Edit Metadata"
            description="Inspect, update, and embed ID3v2 tags and album artwork with zero re-encoding"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 2: Edit Metadata Form */}
        {file && !savedBlob && !isSaving && (
          <div className="flex flex-col gap-6">
            {/* File Info Bar */}
            <div 
              className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-cyan-500 shrink-0"
                  style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                >
                  <FileAudio size={22} />
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {file.name}
                  </h4>
                  <p className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formatAudioBytes(file.size)} • Lossless Tag Ingestion
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                Change File
              </button>
            </div>

            {/* Main Form Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Artwork Editor */}
              <div 
                className="p-6 rounded-2xl border flex flex-col items-center text-center gap-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="w-full text-left">
                  <label className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Album Cover Art
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Embedded front cover image
                  </p>
                </div>

                {/* Artwork Preview Box */}
                <div 
                  className="w-48 h-48 rounded-xl border flex items-center justify-center overflow-hidden relative shadow-inner group"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  {artworkUrl ? (
                    <img 
                      src={artworkUrl} 
                      alt="Album Cover" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <ImageIcon size={36} style={{ color: 'var(--text-muted)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        No cover artwork
                      </span>
                    </div>
                  )}
                </div>

                {/* Artwork Actions */}
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <input
                    ref={artworkInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleArtworkSelected}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => artworkInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-surface)',
                    }}
                  >
                    <Upload size={14} className="text-cyan-500" />
                    <span>{artworkUrl ? 'Replace Cover Image' : 'Upload Cover Image'}</span>
                  </button>

                  {artworkUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveArtwork}
                      className="w-full py-2 px-3 rounded-xl text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Remove Artwork</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column: Metadata Fields */}
              <div 
                className="lg:col-span-2 p-6 rounded-2xl border flex flex-col gap-4 shadow-sm"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    ID3v2 Audio Tags
                  </label>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    All fields are written directly into standard ID3v2.3 containers
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Music size={13} className="text-cyan-500" />
                      <span>Track Title</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Bohemian Rhapsody"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Artist */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <User size={13} className="text-cyan-500" />
                      <span>Lead Artist</span>
                    </label>
                    <input
                      type="text"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      placeholder="e.g. Queen"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Album */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Disc size={13} className="text-cyan-500" />
                      <span>Album</span>
                    </label>
                    <input
                      type="text"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                      placeholder="e.g. A Night at the Opera"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Album Artist */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Album Artist
                    </label>
                    <input
                      type="text"
                      value={albumArtist}
                      onChange={(e) => setAlbumArtist(e.target.value)}
                      placeholder="e.g. Queen"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Year */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Calendar size={13} className="text-cyan-500" />
                      <span>Release Year</span>
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 1975"
                      className="px-3.5 py-2 rounded-xl border text-sm font-mono"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Track Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                      <Hash size={13} className="text-cyan-500" />
                      <span>Track Number</span>
                    </label>
                    <input
                      type="text"
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                      placeholder="e.g. 1 or 1/12"
                      className="px-3.5 py-2 rounded-xl border text-sm font-mono"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Genre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Genre
                    </label>
                    <input
                      type="text"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      placeholder="e.g. Rock, Pop, Classical, Podcast"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Composer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Composer
                    </label>
                    <input
                      type="text"
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      placeholder="e.g. Freddie Mercury"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  {/* Comments */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Comment
                    </label>
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Notes, copyright, or credits"
                      className="px-3.5 py-2 rounded-xl border text-sm"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center justify-end mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={handleSaveTags}
                    disabled={isSaving}
                    className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105 active:scale-98"
                    style={{
                      backgroundColor: '#06b6d4',
                      color: '#ffffff',
                    }}
                  >
                    <Tags size={16} />
                    <span>Save & Update ID3 Tags</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Saving in Progress */}
        {isSaving && (
          <ProgressBar
            progress={80}
            isIndeterminate
            statusText="Embedding ID3 tags and cover art into MP3 container..."
            subText="Instant zero-loss binary tag injection"
            accentColor="#06b6d4"
          />
        )}

        {/* Step 4: Download Result */}
        {savedBlob && savedUrl && (
          <div 
            className="p-8 rounded-2xl border flex flex-col items-center text-center gap-6 shadow-sm"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: '#06b6d4' }}
            >
              <Check size={32} strokeWidth={3} />
            </div>

            <div>
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Metadata Successfully Embedded!
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Updated ID3v2.3 tags and cover artwork with 100% original audio quality preserved
              </p>
            </div>

            {/* Summary card */}
            <div 
              className="w-full max-w-md p-4 rounded-xl border flex items-center gap-4 text-left"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              {artworkUrl ? (
                <img src={artworkUrl} alt="Cover" className="w-14 h-14 rounded-lg object-cover border" />
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center bg-cyan-500/10 text-cyan-500">
                  <Music size={24} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {title || file?.name}
                </h4>
                <p className="text-xs text-cyan-500 font-semibold truncate">
                  {artist || 'Unknown Artist'} {album ? `• ${album}` : ''}
                </p>
                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                  {formatAudioBytes(savedBlob.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={savedUrl}
                download={`${(title || file?.name.replace(/\.[^/.]+$/, ''))}.mp3`}
                className="px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-md hover:brightness-105"
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                }}
              >
                <Download size={18} />
                <span>Download Tagged MP3 ({formatAudioBytes(savedBlob.size)})</span>
              </a>

              <button
                onClick={() => {
                  setSavedBlob(null);
                  if (savedUrl) URL.revokeObjectURL(savedUrl);
                  setSavedUrl(null);
                }}
                className="px-5 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2"
                style={{
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                <RefreshCw size={14} />
                <span>Edit More Tags</span>
              </button>
            </div>
          </div>
        )}
      </ToolShell>
    </ErrorBoundary>
  );
};

export default AudioMetadataEditorWidget;
