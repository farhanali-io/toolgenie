import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  Trash2, 
  Upload, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2,
  FileCode,
  Settings2,
  Code
} from 'lucide-react';

const SAMPLE_CSV = `id,name,role,department,salary,active
1,"Jane Doe",Senior Engineer,Platform,145000,true
2,"John Smith, Jr.",Staff Designer,"Product, UI/UX",132000,true
3,"Alice "Spark" Wong",Security Lead,Infrastructure,160000,true
4,"Bob Miller",Developer Intern,Platform,55000,false`;

/**
 * Robust ~30-line RFC 4180 CSV parser
 * Correctly handles quoted fields, commas in quotes, escaped quotes (""), and CRLF
 */
function parseCsv(csvText: string, hasHeader: boolean, parseTypes: boolean = true): { data: any; rowCount: number; colCount: number } {
  const trimmed = csvText.trim();
  if (!trimmed) {
    throw new Error('CSV input is empty. Please enter or upload CSV data.');
  }

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < csvText.length) {
    const c = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        currentRow.push(field);
        field = '';
      } else if (c === '\r' || c === '\n') {
        if (c === '\r' && next === '\n') i++;
        currentRow.push(field);
        field = '';
        if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0] !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        field += c;
      }
    }
    i++;
  }

  if (field !== '' || currentRow.length > 0) {
    currentRow.push(field);
    rows.push(currentRow);
  }

  if (rows.length === 0) {
    throw new Error('No readable data rows found in CSV.');
  }

  const colCount = Math.max(...rows.map(r => r.length));

  const coerce = (val: string) => {
    if (!parseTypes) return val;
    const v = val.trim();
    if (v.toLowerCase() === 'true') return true;
    if (v.toLowerCase() === 'false') return false;
    if (v.toLowerCase() === 'null') return null;
    if (v !== '' && !isNaN(Number(v))) return Number(v);
    return val;
  };

  if (hasHeader) {
    if (rows.length < 2) {
      throw new Error('Header row detected, but no data records follow. Uncheck "First row is header" if this is a single row table.');
    }
    const headers = rows[0].map((h, idx) => h.trim() || `column_${idx + 1}`);
    const results = [];
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const obj: Record<string, any> = {};
      for (let c = 0; c < headers.length; c++) {
        obj[headers[c]] = coerce(c < row.length ? row[c] : '');
      }
      results.push(obj);
    }
    return { data: results, rowCount: results.length, colCount: headers.length };
  } else {
    const data = rows.map(row => row.map(coerce));
    return { data, rowCount: data.length, colCount };
  }
}

export const CsvToJsonWidget: React.FC = () => {
  const [csvInput, setCsvInput] = useState<string>(SAMPLE_CSV);
  const [hasHeader, setHasHeader] = useState<boolean>(true);
  const [parseTypes, setParseTypes] = useState<boolean>(true);
  const [indentFormat, setIndentFormat] = useState<'2' | '4' | 'min'>('2');
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute JSON live
  let outputJson = '';
  let stats: { rowCount: number; colCount: number; byteSize: number } | null = null;

  try {
    if (csvInput.trim()) {
      const parsed = parseCsv(csvInput, hasHeader, parseTypes);
      const space = indentFormat === 'min' ? 0 : parseInt(indentFormat, 10);
      outputJson = JSON.stringify(parsed.data, null, space);
      stats = {
        rowCount: parsed.rowCount,
        colCount: parsed.colCount,
        byteSize: new Blob([outputJson]).size,
      };
      if (errorMsg) setErrorMsg(null);
    }
  } catch (err: any) {
    outputJson = '';
    stats = null;
    if (!errorMsg || errorMsg !== err.message) {
      // Keep error message in state for clean presentation
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && file.type && !file.type.includes('csv') && !file.type.includes('text')) {
      setErrorMsg('Please upload a valid .csv spreadsheet file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvInput(text);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };
    reader.readAsText(file);
  };

  const handleCopy = async () => {
    if (!outputJson) return;
    try {
      await navigator.clipboard.writeText(outputJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownload = () => {
    if (!outputJson) return;
    const blob = new Blob([outputJson], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = () => {
    setCsvInput(SAMPLE_CSV);
    setErrorMsg(null);
  };

  const handleClear = () => {
    setCsvInput('');
    setErrorMsg(null);
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
              checked={hasHeader}
              onChange={(e) => setHasHeader(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
            />
            <span>First row is header</span>
          </label>

          {/* Type inference toggle */}
          <label className="flex items-center gap-2 cursor-pointer font-medium select-none" style={{ color: 'var(--text-primary)' }}>
            <input
              type="checkbox"
              checked={parseTypes}
              onChange={(e) => setParseTypes(e.target.checked)}
              className="rounded accent-indigo-600 w-4 h-4 cursor-pointer"
            />
            <span>Auto-detect numbers & booleans</span>
          </label>

          {/* Indent selector */}
          <div className="flex items-center gap-1.5 pl-2 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Format:</span>
            <select
              value={indentFormat}
              onChange={(e) => setIndentFormat(e.target.value as any)}
              className="px-2 py-1 rounded-md text-xs font-medium border cursor-pointer focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="min">Minified</option>
            </select>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
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
            <span>Upload .CSV</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={13} />
            <span>Sample Data</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
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
          <span className="flex-1">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="font-semibold underline text-xs">Dismiss</button>
        </div>
      )}

      {/* 3. Split Editor: CSV Input | JSON Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: CSV Editor */}
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
              <span>CSV Input (Spreadsheet)</span>
            </div>
            <span className="font-mono text-[11px] font-normal" style={{ color: 'var(--text-muted)' }}>
              {csvInput ? `${csvInput.split('\n').length} lines` : 'Empty'}
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              value={csvInput}
              onChange={(e) => {
                setCsvInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Paste comma-separated rows here, or drag & drop a .csv file above..."
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

        {/* Right Column: JSON Output */}
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
              <span>JSON Output</span>
            </div>

            <div className="flex items-center gap-2">
              {stats && (
                <span className="font-mono text-[11px] font-normal hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  {stats.rowCount} records • {formatBytes(stats.byteSize)}
                </span>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputJson}
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
                disabled={!outputJson}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 border-indigo-600"
              >
                <Download size={13} />
                <span>Download .JSON</span>
              </button>
            </div>
          </div>

          <div className="p-4 flex-1 flex flex-col">
            <textarea
              readOnly
              value={outputJson}
              placeholder="Structured JSON array will appear here automatically..."
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
