import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  Settings2,
  Table
} from 'lucide-react';

const SAMPLE_JSON = `[
  {
    "id": 101,
    "user": {
      "name": "Sarah Connor",
      "email": "sarah@cyberdyne.org"
    },
    "role": "Security Specialist",
    "skills": ["Cryptography", "Perimeter Defense"],
    "verified": true
  },
  {
    "id": 102,
    "user": {
      "name": "Miles Dyson",
      "email": "dyson@cyberdyne.org"
    },
    "role": "Chief Architect",
    "skills": ["Neural Systems", "Processor Design"],
    "verified": true
  },
  {
    "id": 103,
    "user": {
      "name": "John Connor",
      "email": "leader@resistance.net"
    },
    "role": "Operations Commander",
    "skills": ["Tactics", "Field Logistics"],
    "verified": false
  }
]`;

/**
 * Deep flatten objects into dot-notation keys (e.g. user.address.street)
 */
function flattenObject(obj: any, prefix = '', res: Record<string, any> = {}): Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    res[prefix || 'value'] = obj;
    return res;
  }

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      flattenObject(val, newKey, res);
    } else if (Array.isArray(val)) {
      // If array, join primitives or JSON stringify
      if (val.every(item => typeof item !== 'object')) {
        res[newKey] = val.join('; ');
      } else {
        res[newKey] = JSON.stringify(val);
      }
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

/**
 * RFC 4180 CSV Escaping
 */
function escapeCsvValue(val: any, delimiter: string = ','): string {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const JsonToCsvWidget: React.FC = () => {
  const [jsonInput, setJsonInput] = useState<string>(SAMPLE_JSON);
  const [delimiter, setDelimiter] = useState<',' | ';' | '\t'>(',');
  const [includeHeaders, setIncludeHeaders] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  let outputCsv = '';
  let stats: { rowCount: number; colCount: number; byteSize: number } | null = null;

  try {
    if (jsonInput.trim()) {
      let parsed: any;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (jsonErr: any) {
        let msg = jsonErr.message || 'Invalid JSON syntax';
        const posMatch = msg.match(/position\s+(\d+)/i);
        if (posMatch) {
          const pos = parseInt(posMatch[1], 10);
          const lines = jsonInput.substring(0, pos).split('\n');
          msg = `Invalid JSON at Line ${lines.length}, Column ${lines[lines.length - 1].length + 1}: ${jsonErr.message}`;
        }
        throw new Error(msg);
      }

      // Ensure array of objects
      let records: any[] = [];
      if (Array.isArray(parsed)) {
        records = parsed;
      } else if (parsed && typeof parsed === 'object') {
        records = [parsed];
      } else {
        throw new Error('JSON data must be an array of objects or a single JSON object.');
      }

      if (records.length === 0) {
        throw new Error('JSON array is empty. No records to convert.');
      }

      // Flatten each record
      const flattenedRecords = records.map(r => flattenObject(r));

      // Collect all unique column headers across all objects
      const headerSet = new Set<string>();
      flattenedRecords.forEach(r => {
        Object.keys(r).forEach(k => headerSet.add(k));
      });
      const headers = Array.from(headerSet);

      const lines: string[] = [];

      if (includeHeaders) {
        lines.push(headers.map(h => escapeCsvValue(h, delimiter)).join(delimiter));
      }

      for (const rec of flattenedRecords) {
        const row = headers.map(h => escapeCsvValue(rec[h], delimiter));
        lines.push(row.join(delimiter));
      }

      outputCsv = lines.join('\r\n');
      stats = {
        rowCount: flattenedRecords.length,
        colCount: headers.length,
        byteSize: new Blob([outputCsv]).size,
      };

      if (errorMsg) setErrorMsg(null);
    }
  } catch (err: any) {
    outputCsv = '';
    stats = null;
    if (!errorMsg || errorMsg !== err.message) {
      // Set in state via render error detection if necessary
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json') && file.type && !file.type.includes('json') && !file.type.includes('text')) {
      setErrorMsg('Please upload a valid .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!outputCsv) return;
    try {
      await navigator.clipboard.writeText(outputCsv);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!outputCsv) return;
    // Add UTF-8 BOM so Excel opens special characters correctly
    const bom = '\uFEFF';
    const blob = new Blob([bom + outputCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Control Toolbar */}
      <div 
        className="rounded-2xl border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Header Toggle */}
          <label className="flex items-center gap-2 cursor-pointer font-medium select-none" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={includeHeaders}
              onChange={(e) => setIncludeHeaders(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
            />
            <span>Include Column Headers</span>
          </label>

          {/* Delimiter selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Delimiter:</span>
            <select
              value={delimiter}
              onChange={(e) => setDelimiter(e.target.value as any)}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="&#9;">Tab (\t)</option>
            </select>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            Dot-notation flattening enabled
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Upload size={13} />
            <span>Upload .JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setJsonInput(SAMPLE_JSON);
              setErrorMsg(null);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={13} />
            <span>Sample JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setJsonInput('');
              setErrorMsg(null);
            }}
            className="p-1.5 rounded-xl text-xs font-semibold border transition-colors hover:text-red-500 hover:opacity-80"
            title="Clear all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 2. Error Display */}
      {errorMsg && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-xs sm:text-sm text-red-500">
          <AlertCircle size={18} className="shrink-0" />
          <span className="flex-1 font-mono text-xs">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* 3. Split Editor: JSON Input | CSV Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: JSON Input */}
        <div 
          className="rounded-2xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <FileCode size={15} style={{ color: 'var(--accent)' }} />
              <span>JSON Input (Objects / Array)</span>
            </div>
            <span className="font-mono text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
              {jsonInput ? `${jsonInput.split('\n').length} lines` : 'Empty'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Paste JSON array of objects here, or upload a .json file above..."
              className="w-full h-80 sm:h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Right: CSV Output */}
        <div 
          className="rounded-2xl border flex flex-col overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)'
          }}
        >
          <div 
            className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={15} style={{ color: 'var(--accent)' }} />
              <span>CSV Spreadsheet Output</span>
            </div>

            <div className="flex items-center gap-2">
              {stats && (
                <span className="font-mono text-[11px] font-normal hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  {stats.rowCount} rows • {stats.colCount} cols • {formatBytes(stats.byteSize)}
                </span>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputCsv}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border disabled:opacity-40"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--bg-surface)',
                  borderColor: copied ? '#10b981' : 'var(--border-subtle)',
                  color: copied ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!outputCsv}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 border-indigo-600"
              >
                <Download size={13} />
                <span>Download .CSV</span>
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              readOnly
              value={outputCsv}
              placeholder="Tabular CSV data will appear here automatically..."
              className="w-full h-80 sm:h-96 p-3 rounded-xl border font-mono text-xs leading-relaxed resize-none focus:outline-none select-all"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
