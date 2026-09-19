import React, { useState, useEffect } from 'react';
import SparkMD5 from 'spark-md5';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  FileText, 
  RefreshCw, 
  HelpCircle 
} from 'lucide-react';

export const FileHashCheckerWidget: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [expectedHash, setExpectedHash] = useState('');
  const [isHashing, setIsHashing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  const computeSubtleHash = async (buffer: ArrayBuffer, algo: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algo, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    let isCancelled = false;

    const processFile = async () => {
      if (!file) {
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
        return;
      }

      setIsHashing(true);
      try {
        const buffer = await file.arrayBuffer();

        // SparkMD5
        const spark = new SparkMD5.ArrayBuffer();
        spark.append(buffer);
        const md5 = spark.end();

        const [sha1, sha256, sha512] = await Promise.all([
          computeSubtleHash(buffer, 'SHA-1'),
          computeSubtleHash(buffer, 'SHA-256'),
          computeSubtleHash(buffer, 'SHA-512'),
        ]);

        if (!isCancelled) {
          setHashes({ md5, sha1, sha256, sha512 });
          setIsHashing(false);
        }
      } catch (err) {
        console.error('File hashing error:', err);
        if (!isCancelled) setIsHashing(false);
      }
    };

    processFile();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  const handleCopy = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hashList = [
    { key: 'sha256', label: 'SHA-256 (Recommended)', value: hashes.sha256 },
    { key: 'md5', label: 'MD5 Checksum', value: hashes.md5 },
    { key: 'sha1', label: 'SHA-1 Checksum', value: hashes.sha1 },
    { key: 'sha512', label: 'SHA-512 Secure Hash', value: hashes.sha512 },
  ];

  const cleanExpected = expectedHash.trim().toLowerCase();
  const matchedAlgo = cleanExpected 
    ? hashList.find(h => h.value.toLowerCase() === cleanExpected)
    : null;

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* File Dropzone */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
          Select File to Inspect (Runs locally inside browser RAM)
        </label>
        <div 
          className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors relative"
          style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-input)' }}
        >
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center">
            <Upload size={32} className="mb-2" style={{ color: 'var(--accent)' }} />
            {file ? (
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {file.name}
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Unknown MIME type'}
                </div>
                <div className="text-[11px] mt-2 text-emerald-500 font-semibold">
                  Click or drag another file to replace
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                  Drop an installer, ISO, archive, or document here
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Calculated in milliseconds using browser hardware acceleration
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Computed Hashes */}
      <div className="space-y-3 mb-6">
        {hashList.map(({ key, label, value }) => (
          <div
            key={key}
            className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="min-w-[170px] shrink-0">
              <span className="text-xs font-bold font-mono tracking-wide" style={{ color: 'var(--text-primary)' }}>
                {label}
              </span>
            </div>

            <div className="font-mono text-xs break-all flex-1 select-all" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
              {isHashing ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                  <RefreshCw size={12} className="animate-spin" />
                  Hashing bytes...
                </span>
              ) : (
                value || 'Select a file to compute checksum'
              )}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(key, value)}
              disabled={!value || isHashing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border shrink-0 self-end sm:self-center flex items-center gap-1.5 transition-all disabled:opacity-40"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {copiedKey === key ? (
                <>
                  <Check size={13} className="text-emerald-500" />
                  <span className="text-emerald-500">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Verify Against Expected Hash */}
      <div className="pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
          Integrity Verification — Compare with Publisher's Checksum
        </label>
        <div className="relative">
          <input
            type="text"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            placeholder="Paste the official SHA-256 or MD5 hash provided by the software developer..."
            className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border outline-none"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {cleanExpected && file && (
          <div className="mt-3">
            {matchedAlgo ? (
              <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 size={18} className="shrink-0" />
                <span>
                  <strong>VERIFIED AUTHENTIC:</strong> File matches the expected <strong>{matchedAlgo.label}</strong> exact checksum! No corruption or tampering detected.
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs font-medium">
                <XCircle size={18} className="shrink-0" />
                <span>
                  <strong>MISMATCH WARNING:</strong> The checksum does not match any computed hash for this file. The file may be corrupt, incomplete, or modified.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
