import React, { useState, useEffect } from 'react';
import SparkMD5 from 'spark-md5';
import { 
  Hash, 
  Copy, 
  Check, 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const HashGeneratorWidget: React.FC = () => {
  const [sourceType, setSourceType] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('ToolGenie fast private client-side utilities');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uppercase, setUppercase] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [compareHash, setCompareHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: ''
  });

  // Calculate WebCrypto hashes
  const computeHash = async (buffer: ArrayBuffer, algorithm: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    let isMounted = true;

    const calculate = async () => {
      if (sourceType === 'text') {
        if (!inputText) {
          setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
          return;
        }
        setIsProcessing(true);
        try {
          const encoder = new TextEncoder();
          const data = encoder.encode(inputText);

          // MD5 via SparkMD5
          const md5 = SparkMD5.hash(inputText);

          // SHA-1, SHA-256, SHA-512 via Web Crypto
          const [sha1, sha256, sha512] = await Promise.all([
            computeHash(data.buffer as ArrayBuffer, 'SHA-1'),
            computeHash(data.buffer as ArrayBuffer, 'SHA-256'),
            computeHash(data.buffer as ArrayBuffer, 'SHA-512'),
          ]);

          if (isMounted) {
            setHashes({ md5, sha1, sha256, sha512 });
            setIsProcessing(false);
          }
        } catch (e) {
          console.error(e);
          if (isMounted) setIsProcessing(false);
        }
      } else if (sourceType === 'file' && selectedFile) {
        setIsProcessing(true);
        try {
          const buffer = await selectedFile.arrayBuffer();

          // MD5
          const spark = new SparkMD5.ArrayBuffer();
          spark.append(buffer);
          const md5 = spark.end();

          const [sha1, sha256, sha512] = await Promise.all([
            computeHash(buffer, 'SHA-1'),
            computeHash(buffer, 'SHA-256'),
            computeHash(buffer, 'SHA-512'),
          ]);

          if (isMounted) {
            setHashes({ md5, sha1, sha256, sha512 });
            setIsProcessing(false);
          }
        } catch (e) {
          console.error(e);
          if (isMounted) setIsProcessing(false);
        }
      } else {
        setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
      }
    };

    calculate();

    return () => {
      isMounted = false;
    };
  }, [inputText, selectedFile, sourceType]);

  const handleCopy = (key: string, text: string) => {
    const formatted = uppercase ? text.toUpperCase() : text.toLowerCase();
    navigator.clipboard.writeText(formatted);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hashList = [
    { key: 'md5', label: 'MD5 (128-bit)', value: hashes.md5 },
    { key: 'sha1', label: 'SHA-1 (160-bit)', value: hashes.sha1 },
    { key: 'sha256', label: 'SHA-256 (256-bit)', value: hashes.sha256 },
    { key: 'sha512', label: 'SHA-512 (512-bit)', value: hashes.sha512 },
  ];

  // Compare check
  const normalizedCompare = compareHash.trim().toLowerCase();
  const matchedAlgorithm = normalizedCompare 
    ? hashList.find(h => h.value.toLowerCase() === normalizedCompare) 
    : null;

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Type switch & case toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="inline-flex rounded-xl p-1 border"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <button
            type="button"
            onClick={() => setSourceType('text')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceType === 'text' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: sourceType === 'text' ? 'var(--accent)' : 'transparent',
              color: sourceType === 'text' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
            }}
          >
            Hash Text Input
          </button>
          <button
            type="button"
            onClick={() => setSourceType('file')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              sourceType === 'file' ? 'shadow-sm' : ''
            }`}
            style={{
              backgroundColor: sourceType === 'file' ? 'var(--accent)' : 'transparent',
              color: sourceType === 'file' ? 'var(--accent-contrast)' : 'var(--text-secondary)'
            }}
          >
            Hash Local File
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            <input
              type="checkbox"
              checked={uppercase}
              onChange={(e) => setUppercase(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Uppercase Hex (A-F)</span>
          </label>
        </div>
      </div>

      {/* Input Section */}
      {sourceType === 'text' ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Input Text String
            </label>
            <button
              type="button"
              onClick={() => setInputText('ToolGenie fast private client-side utilities')}
              className="text-xs font-medium hover:underline flex items-center gap-1"
              style={{ color: 'var(--accent)' }}
            >
              <Sparkles size={12} />
              <span>Sample Text</span>
            </button>
          </div>
          <div className="rounded-xl border overflow-hidden"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
          >
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type or paste any text to hash in real time..."
              rows={3}
              className="w-full p-3 font-mono text-xs sm:text-sm outline-none resize-y"
              style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
            Select Any Local File (Zero Server Upload)
          </label>
          <div 
            className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors relative"
            style={{ borderColor: 'var(--border-strong)', backgroundColor: 'var(--bg-input)' }}
          >
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            <div className="flex flex-col items-center justify-center">
              <Upload size={28} className="mb-2" style={{ color: 'var(--accent)' }} />
              {selectedFile ? (
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  <span className="font-bold">{selectedFile.name}</span> ({(selectedFile.size / 1024).toFixed(1)} KB)
                  <div className="text-[11px] mt-1 text-emerald-500 font-semibold">Click or drag another file to replace</div>
                </div>
              ) : (
                <>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                    Drop a file here or click to browse
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    Calculated using Web Crypto API in browser RAM.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Generated Hashes List */}
      <div className="space-y-3">
        {hashList.map(({ key, label, value }) => {
          const displayValue = value ? (uppercase ? value.toUpperCase() : value.toLowerCase()) : '—';
          return (
            <div 
              key={key}
              className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all"
              style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="min-w-[130px] shrink-0">
                <span className="text-xs font-bold font-mono tracking-wide" style={{ color: 'var(--text-primary)' }}>
                  {label}
                </span>
              </div>

              <div className="font-mono text-xs break-all flex-1 select-all" style={{ color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {isProcessing ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-500">
                    <RefreshCw size={12} className="animate-spin" />
                    Computing...
                  </span>
                ) : (
                  displayValue
                )}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(key, value)}
                disabled={!value || isProcessing}
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
          );
        })}
      </div>

      {/* Hash Verification / Integrity Check Section */}
      <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>
          Compare with Expected Hash / Checksum
        </label>
        <div className="relative">
          <input
            type="text"
            value={compareHash}
            onChange={(e) => setCompareHash(e.target.value)}
            placeholder="Paste expected MD5, SHA-1, or SHA-256 hash to verify..."
            className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border outline-none transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {compareHash.trim() && (
          <div className="mt-2.5">
            {matchedAlgorithm ? (
              <div className="p-2.5 rounded-xl border bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-medium">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>
                  <strong>Exact Match!</strong> Checksum matches calculated <strong>{matchedAlgorithm.label}</strong>.
                </span>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl border bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 text-xs font-medium">
                <XCircle size={16} className="shrink-0" />
                <span>
                  <strong>Mismatch:</strong> The provided checksum does not match any computed hash algorithms.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
