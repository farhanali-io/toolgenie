import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw, 
  ShieldCheck, 
  ShieldAlert, 
  Sliders, 
  Layers,
  Sparkles 
} from 'lucide-react';

const CHAR_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHAR_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHAR_NUMBERS = '0123456789';
const CHAR_SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const AMBIGUOUS = /[il1Lo0OI]/g;

function getSecureRandomInt(max: number): number {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return array[0] % max;
}

export const PasswordGeneratorWidget: React.FC = () => {
  const [length, setLength] = useState<number>(18);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const generatePasswords = () => {
    let pool = '';
    if (useUpper) pool += CHAR_UPPER;
    if (useLower) pool += CHAR_LOWER;
    if (useNumbers) pool += CHAR_NUMBERS;
    if (useSymbols) pool += CHAR_SYMBOLS;

    if (excludeAmbiguous) {
      pool = pool.replace(AMBIGUOUS, '');
    }

    if (!pool) {
      setPasswords(['Please select at least one character set.']);
      return;
    }

    const results: string[] = [];
    for (let q = 0; q < quantity; q++) {
      let pwd = '';
      for (let i = 0; i < length; i++) {
        pwd += pool[getSecureRandomInt(pool.length)];
      }
      results.push(pwd);
    }
    setPasswords(results);
  };

  useEffect(() => {
    generatePasswords();
  }, [length, useUpper, useLower, useNumbers, useSymbols, excludeAmbiguous, quantity]);

  // Entropy calculation
  const calculateStrength = () => {
    let poolSize = 0;
    if (useUpper) poolSize += 26;
    if (useLower) poolSize += 26;
    if (useNumbers) poolSize += 10;
    if (useSymbols) poolSize += 28;
    if (poolSize === 0) return { score: 0, label: 'Very Weak', color: '#ef4444', bits: 0, crackTime: '0 seconds' };

    const bits = Math.round(length * Math.log2(poolSize));
    let label = 'Very Weak';
    let color = '#ef4444';
    let crackTime = 'Instant';

    if (bits < 40) {
      label = 'Weak';
      color = '#f87171';
      crackTime = 'A few seconds';
    } else if (bits < 60) {
      label = 'Moderate';
      color = '#fbbf24';
      crackTime = 'A few hours';
    } else if (bits < 80) {
      label = 'Strong';
      color = '#34d399';
      crackTime = 'Several centuries';
    } else {
      label = 'Very Strong';
      color = '#10b981';
      crackTime = 'Millions of years';
    }

    return { score: Math.min(100, (bits / 90) * 100), label, color, bits, crackTime };
  };

  const strength = calculateStrength();

  const handleCopyOne = (idx: number, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(passwords.join('\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Top Primary Generated Password Display */}
      {passwords.length > 0 && quantity === 1 && (
        <div className="mb-6">
          <div 
            className="p-4 rounded-xl border flex items-center justify-between gap-3 shadow-inner relative overflow-hidden"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
          >
            <span className="font-mono text-base sm:text-xl font-bold tracking-wide select-all break-all"
              style={{ color: 'var(--text-primary)' }}
            >
              {passwords[0]}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={generatePasswords}
                className="p-2 rounded-lg border transition-colors hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
                title="Regenerate password"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleCopyOne(0, passwords[0])}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-contrast)'
                }}
              >
                {copiedIndex === 0 ? (
                  <>
                    <Check size={14} />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Strength Meter Bar */}
          <div className="mt-2.5 flex items-center justify-between gap-4 text-xs">
            <div className="flex-1 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full transition-all duration-300 rounded-full"
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                />
              </div>
              <span className="font-semibold" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
            <span className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
              ~{strength.bits} bits of entropy ({strength.crackTime})
            </span>
          </div>
        </div>
      )}

      {/* Configuration Controls */}
      <div className="space-y-5 pt-2">
        {/* Length Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Password Length: <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>{length}</span> characters
            </label>
            <span className="text-xs text-emerald-500 font-medium">Recommended: 16+</span>
          </div>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="w-full accent-indigo-600 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Character Options Grid */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-2.5" style={{ color: 'var(--text-muted)' }}>
            Character Sets Included
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Uppercase (A-Z)', val: useUpper, setVal: setUseUpper },
              { label: 'Lowercase (a-z)', val: useLower, setVal: setUseLower },
              { label: 'Numbers (0-9)', val: useNumbers, setVal: setUseNumbers },
              { label: 'Symbols (!@#$)', val: useSymbols, setVal: setUseSymbols },
            ].map(({ label, val, setVal }) => (
              <label 
                key={label}
                className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none text-xs font-medium transition-all"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: val ? 'var(--accent)' : 'var(--border-subtle)',
                  color: 'var(--text-primary)'
                }}
              >
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setVal(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Exclude Ambiguous Characters */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none text-xs font-medium transition-all"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <input
              type="checkbox"
              checked={excludeAmbiguous}
              onChange={(e) => setExcludeAmbiguous(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span>Exclude Ambiguous</span>
              <span className="text-[11px] block font-mono" style={{ color: 'var(--text-muted)' }}>
                Avoids `1, l, I, 0, O, o`
              </span>
            </div>
          </label>

          {/* Quantity Selector */}
          <div className="p-3 rounded-xl border flex items-center justify-between text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <span>Quantity to Generate:</span>
            <div className="flex items-center gap-1">
              {[1, 5, 10].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    quantity === q ? 'ring-1' : ''
                  }`}
                  style={{
                    backgroundColor: quantity === q ? 'var(--accent)' : 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: quantity === q ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-Password Output List (when quantity > 1) */}
        {quantity > 1 && (
          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Generated Batch ({passwords.length} Passwords)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generatePasswords}
                  className="text-xs font-medium hover:underline flex items-center gap-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <RefreshCw size={12} />
                  <span>Regenerate All</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {allCopied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-500">Copied All</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {passwords.map((pwd, idx) => (
                <div 
                  key={idx}
                  className="p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
                >
                  <span className="select-all font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {pwd}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyOne(idx, pwd)}
                    className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                    title="Copy this password"
                  >
                    {copiedIndex === idx ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
