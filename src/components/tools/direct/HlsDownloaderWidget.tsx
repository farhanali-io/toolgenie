import React, { useState } from 'react';
import { 
  Radio, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  StopCircle
} from 'lucide-react';

const SAMPLE_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

interface SegmentInfo {
  url: string;
  duration: number;
}

export const HlsDownloaderWidget: React.FC = () => {
  const [m3u8Url, setM3u8Url] = useState(SAMPLE_HLS_URL);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'downloading' | 'merging' | 'completed' | 'cors_error' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadedSegments, setDownloadedSegments] = useState(0);
  const [totalSegments, setTotalSegments] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Parse m3u8 playlist text into segment URLs
  const parseM3u8 = (content: string, baseUrl: string): SegmentInfo[] => {
    const lines = content.split('\n').map(l => l.trim());
    const segments: SegmentInfo[] = [];
    let currentDuration = 0;

    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const durMatch = line.match(/#EXTINF:([\d.]+)/);
        currentDuration = durMatch ? parseFloat(durMatch[1]) : 0;
      } else if (line && !line.startsWith('#')) {
        // Resolve segment URL against base URL
        try {
          const absoluteUrl = new URL(line, baseUrl).toString();
          segments.push({ url: absoluteUrl, duration: currentDuration });
        } catch {
          // ignore malformed lines
        }
      }
    }
    return segments;
  };

  const handleStartDownload = async () => {
    const targetUrl = m3u8Url.trim();
    if (!targetUrl) return;

    setStatus('parsing');
    setProgress(0);
    setDownloadedSegments(0);
    setDownloadedBytes(0);
    setErrorMessage('');

    const controller = new AbortController();
    setAbortController(controller);

    try {
      // 1. Fetch Playlist Manifest
      let playlistResp: Response;
      try {
        playlistResp = await fetch(targetUrl, { signal: controller.signal });
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setStatus('cors_error');
        setErrorMessage("The HLS server's CORS policy blocked client-side fetching of the .m3u8 playlist. The remote streaming host does not send Access-Control-Allow-Origin headers.");
        return;
      }

      if (!playlistResp.ok) {
        throw new Error(`Playlist server responded with HTTP status ${playlistResp.status}: ${playlistResp.statusText}`);
      }

      let manifestText = await playlistResp.text();

      // Check if it's a master playlist (contains nested playlists #EXT-X-STREAM-INF)
      if (manifestText.includes('#EXT-X-STREAM-INF')) {
        const lines = manifestText.split('\n');
        let subPlaylistUrl = '';
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('#EXT-X-STREAM-INF') && i + 1 < lines.length) {
            const nextLine = lines[i + 1].trim();
            if (nextLine && !nextLine.startsWith('#')) {
              subPlaylistUrl = new URL(nextLine, targetUrl).toString();
              break;
            }
          }
        }

        if (subPlaylistUrl) {
          const subResp = await fetch(subPlaylistUrl, { signal: controller.signal });
          if (!subResp.ok) throw new Error('Failed to fetch media sub-playlist.');
          manifestText = await subResp.text();
        }
      }

      // Parse segments
      const segments = parseM3u8(manifestText, targetUrl);

      if (segments.length === 0) {
        throw new Error('No video segments (#EXTINF) found in this HLS playlist.');
      }

      setTotalSegments(segments.length);
      setStatus('downloading');

      // 2. Fetch and merge segments
      const chunks: Uint8Array[] = [];
      let totalBytesReceived = 0;

      for (let i = 0; i < segments.length; i++) {
        if (controller.signal.aborted) break;

        const seg = segments[i];
        const segResp = await fetch(seg.url, { signal: controller.signal });
        if (!segResp.ok) {
          throw new Error(`Failed downloading segment ${i + 1}/${segments.length} (HTTP ${segResp.status})`);
        }

        const buffer = await segResp.arrayBuffer();
        const chunk = new Uint8Array(buffer);
        chunks.push(chunk);

        totalBytesReceived += chunk.byteLength;
        setDownloadedBytes(totalBytesReceived);
        setDownloadedSegments(i + 1);
        setProgress(Math.round(((i + 1) / segments.length) * 100));
      }

      if (controller.signal.aborted) return;

      // 3. Merge segments
      setStatus('merging');
      await new Promise(r => setTimeout(r, 50));

      const mergedArray = new Uint8Array(totalBytesReceived);
      let offset = 0;
      for (const chunk of chunks) {
        mergedArray.set(chunk, offset);
        offset += chunk.byteLength;
      }

      const blob = new Blob([mergedArray.buffer as ArrayBuffer], { type: 'video/mp2t' });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'hls-stream.ts';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatus('completed');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatus('idle');
        return;
      }
      setStatus('error');
      setErrorMessage(err.message || 'Error occurred while processing the HLS stream.');
    } finally {
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setStatus('idle');
    }
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Input controls */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Public HLS Stream Manifest URL (.m3u8)
            </label>
            <button
              type="button"
              onClick={() => {
                setM3u8Url(SAMPLE_HLS_URL);
                setStatus('idle');
              }}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={12} />
              <span>Use Test HLS Stream</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="url"
              value={m3u8Url}
              onChange={(e) => {
                setM3u8Url(e.target.value);
                setStatus('idle');
              }}
              placeholder="https://example.com/live/stream.m3u8"
              className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm rounded-xl border outline-none font-mono"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
            {m3u8Url && (
              <a
                href={m3u8Url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                title="Open stream playlist URL"
              >
                <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'downloading' || status === 'parsing' || status === 'merging' ? (
            <button
              type="button"
              onClick={handleCancel}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-600"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <StopCircle size={15} />
              <span>Cancel Download</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartDownload}
              disabled={!m3u8Url.trim()}
              className="py-2.5 px-5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-contrast)'
              }}
            >
              <Download size={15} />
              <span>Download & Merge Stream (.ts)</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Download Progress Bar */}
      {(status === 'parsing' || status === 'downloading' || status === 'merging') && (
        <div className="mt-6 p-4 rounded-xl border space-y-3"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {status === 'parsing' && 'Fetching & inspecting .m3u8 playlist manifest...'}
              {status === 'downloading' && `Downloading video segments (${downloadedSegments} / ${totalSegments})...`}
              {status === 'merging' && 'Concatenating video segments into container...'}
            </span>
            <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>
              {progress}%
            </span>
          </div>

          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%`, backgroundColor: 'var(--accent)' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
            <span>{(downloadedBytes / (1024 * 1024)).toFixed(2)} MB transferred</span>
            <span>MPEG-TS Container</span>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {status === 'completed' && (
        <div className="mt-5 p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3 text-xs">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm">Download Complete!</div>
            <div>
              Successfully stitched {totalSegments} segments ({(downloadedBytes / (1024 * 1024)).toFixed(2)} MB). Saved as <strong>hls-stream.ts</strong>.
            </div>
          </div>
        </div>
      )}

      {/* CORS Block Notification */}
      {status === 'cors_error' && (
        <div className="mt-5 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <div className="font-bold text-sm">Stream Host Blocks Direct Browser Ingress (CORS)</div>
              <div className="mt-1 leading-relaxed">{errorMessage}</div>
              <div className="mt-2 text-[11px] opacity-90">
                To test the stream downloader, click <strong>"Use Test HLS Stream"</strong> above to see client-side segment assembly in action.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {status === 'error' && (
        <div className="mt-5 p-4 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-start gap-3 text-xs">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Failed to Download Stream</div>
            <div className="mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Zero Server Uploads Badge */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t text-xs"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
      >
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Client-side segment assembly • Zero server transcoding</span>
        </div>
        <span>Outputs .ts (VLC, QuickTime, mpv compatible)</span>
      </div>
    </div>
  );
};
