import React, { useState, useEffect } from 'react';
import { 
  Pilcrow, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  Code,
  Sparkles 
} from 'lucide-react';

const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
  'mollit', 'anim', 'id', 'est', 'laborum', 'curabitur', 'pretium', 'tincidunt', 'lacus',
  'nec', 'rhoncus', 'praesent', 'blandit', 'aliquam', 'odio', 'vivamus', 'orci', 'sem', 'viverra'
];

function getRandomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function generateSentence(minWords = 8, maxWords = 18): string {
  const len = Math.floor(Math.random() * (maxWords - minWords + 1)) + minWords;
  const words: string[] = [];
  for (let i = 0; i < len; i++) {
    words.push(getRandomWord());
  }
  const sentence = words.join(' ');
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
}

function generateParagraph(minSentences = 4, maxSentences = 7): string {
  const count = Math.floor(Math.random() * (maxSentences - minSentences + 1)) + minSentences;
  const sentences: string[] = [];
  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }
  return sentences.join(' ');
}

export const LoremIpsumWidget: React.FC = () => {
  const [unit, setUnit] = useState<'paragraphs' | 'words' | 'sentences'>('paragraphs');
  const [count, setCount] = useState<number>(3);
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [wrapHtml, setWrapHtml] = useState<boolean>(false);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const generate = () => {
    let result = '';

    if (unit === 'paragraphs') {
      const paras: string[] = [];
      for (let i = 0; i < count; i++) {
        let p = generateParagraph();
        if (i === 0 && startWithLorem) {
          p = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' + p;
        }
        paras.push(wrapHtml ? `<p>${p}</p>` : p);
      }
      result = paras.join(wrapHtml ? '\n' : '\n\n');
    } else if (unit === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < count; i++) {
        let s = generateSentence();
        if (i === 0 && startWithLorem) {
          s = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
        }
        sentences.push(s);
      }
      result = sentences.join(' ');
      if (wrapHtml) result = `<p>${result}</p>`;
    } else {
      // words
      const words: string[] = [];
      if (startWithLorem && count >= 5) {
        words.push('lorem', 'ipsum', 'dolor', 'sit', 'amet');
        for (let i = 5; i < count; i++) {
          words.push(getRandomWord());
        }
      } else {
        for (let i = 0; i < count; i++) {
          words.push(getRandomWord());
        }
      }
      result = words.join(' ');
      if (wrapHtml) result = `<p>${result}</p>`;
    }

    setGeneratedText(result);
  };

  useEffect(() => {
    generate();
  }, [unit, count, startWithLorem, wrapHtml]);

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedText) return;
    const blob = new Blob([generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lorem-ipsum-${count}-${unit}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="rounded-2xl border p-5 sm:p-7 shadow-sm transition-all"
      style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
    >
      {/* Controls Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-5 mb-5 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* Unit Selector */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Generate By
          </label>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
          >
            {(['paragraphs', 'sentences', 'words'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={`py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${
                  unit === u ? 'shadow-sm' : ''
                }`}
                style={{
                  backgroundColor: unit === u ? 'var(--accent)' : 'transparent',
                  color: unit === u ? 'var(--accent-contrast)' : 'var(--text-secondary)'
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* Count Input */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Quantity: <span className="font-mono font-bold" style={{ color: 'var(--accent)' }}>{count}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={unit === 'words' ? 500 : 50}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-xl border outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Start with Lorem Toggle */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Start with "Lorem ipsum"</span>
          </label>
        </div>

        {/* Wrap in HTML tags */}
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 p-2 rounded-xl border cursor-pointer select-none text-xs font-medium"
            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <input
              type="checkbox"
              checked={wrapHtml}
              onChange={(e) => setWrapHtml(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Wrap in &lt;p&gt; tags</span>
          </label>
        </div>
      </div>

      {/* Output Display Area */}
      <div className="rounded-xl border overflow-hidden relative"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-input)' }}
      >
        <textarea
          id="lorem-output"
          readOnly
          value={generatedText}
          rows={11}
          className="w-full p-4 font-sans text-xs sm:text-sm resize-y outline-none leading-relaxed select-all"
          style={{ backgroundColor: 'transparent', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Bottom Bar: Stats & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {generatedText.split(/\s+/).filter(Boolean).length} words • {generatedText.length} characters
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={generate}
            className="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            <RefreshCw size={13} />
            <span>Regenerate</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)'
            }}
          >
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)'
            }}
          >
            <Download size={13} />
            <span>Save .txt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
