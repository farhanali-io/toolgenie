import React, { useState } from 'react';
import { 
  CaseSensitive, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  ArrowRight,
  RotateCcw
} from 'lucide-react';

const SAMPLE_TEXT = 'ToolGenie empowers privacy-first client-side web utilities and developer conversions.';

// Conversions
function toUpper(str: string): string {
  return str.toUpperCase();
}

function toLower(str: string): string {
  return str.toLowerCase();
}

function toSentence(str: string): string {
  return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
}

function toTitle(str: string): string {
  const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'yet', 'with']);
  return str.toLowerCase().replace(/\b\w+\b/g, (word, index) => {
    if (index > 0 && minorWords.has(word)) {
      return word;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}

function toCamel(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());
}

function toPascal(str: string): string {
  const camel = toCamel(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnake(str: string): string {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(x => x.toLowerCase())
    .join('_') || str.toLowerCase().replace(/\s+/g, '_');
}

function toKebab(str: string): string {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map(x => x.toLowerCase())
    .join('-') || str.toLowerCase().replace(/\s+/g, '-');
}

function toConstant(str: string): string {
  return toSnake(str).toUpperCase();
}

interface CaseOption {
  id: string;
  name: string;
  example: string;
  fn: (s: string) => string;
}

const CASE_OPTIONS: CaseOption[] = [
  { id: 'sentence', name: 'Sentence case', example: 'Toolgenie is fast', fn: toSentence },
  { id: 'title', name: 'Title Case', example: 'ToolGenie Is Fast', fn: toTitle },
  { id: 'upper', name: 'UPPERCASE', example: 'TOOLGENIE IS FAST', fn: toUpper },
  { id: 'lower', name: 'lowercase', example: 'toolgenie is fast', fn: toLower },
  { id: 'camel', name: 'camelCase', example: 'toolgenieIsFast', fn: toCamel },
  { id: 'pascal', name: 'PascalCase', example: 'ToolgenieIsFast', fn: toPascal },
  { id: 'snake', name: 'snake_case', example: 'toolgenie_is_fast', fn: toSnake },
  { id: 'kebab', name: 'kebab-case', example: 'toolgenie-is-fast', fn: toKebab },
  { id: 'constant', name: 'CONSTANT_CASE', example: 'TOOLGENIE_IS_FAST', fn: toConstant },
];

export const CaseConverterWidget: React.FC = () => {
  const [inputText, setInputText] = useState(SAMPLE_TEXT);
  const [activeCase, setActiveCase] = useState<string>('title');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleApplyCase = (id: string) => {
    const opt = CASE_OPTIONS.find(c => c.id === id);
    if (!opt) return;
    setActiveCase(id);
    setInputText(opt.fn(inputText));
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top Quick Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          {CASE_OPTIONS.slice(0, 5).map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleApplyCase(opt.id)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInputText(SAMPLE_TEXT)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <Sparkles size={12} />
            <span>Sample</span>
          </button>
          <button
            type="button"
            onClick={() => setInputText('')}
            className="p-1.5 rounded-lg text-xs border transition-all hover:text-red-500"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            title="Clear"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Textarea */}
      <div className="rounded-xl border overflow-hidden mb-6"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
      >
        <textarea
          id="case-converter-textarea"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type or paste text to convert across cases..."
          rows={5}
          className="w-full p-4 font-sans text-xs sm:text-sm resize-y outline-none leading-relaxed"
          style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Grid of All Live Conversions */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
          Live Previews Across All Formats
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CASE_OPTIONS.map((opt) => {
            const converted = inputText ? opt.fn(inputText) : opt.example;
            return (
              <div 
                key={opt.id}
                className="p-3 rounded-xl border flex flex-col justify-between gap-2 transition-all hover:border-[var(--accent)]"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {opt.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyCase(opt.id)}
                      className="text-[11px] font-medium px-2 py-0.5 rounded border hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                      title="Apply to main editor"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(opt.id, converted)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                      style={{
                        backgroundColor: 'var(--accent)',
                        color: 'var(--accent-contrast)'
                      }}
                    >
                      {copiedId === opt.id ? (
                        <>
                          <Check size={11} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div 
                  className="font-mono text-xs line-clamp-2 select-all break-all"
                  style={{ color: inputText ? 'var(--text-primary)' : 'var(--text-muted)' }}
                >
                  {converted}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
