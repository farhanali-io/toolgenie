import React from 'react';
import { SEOHead } from '../components/SEOHead';
import { Link } from '../utils/router';
import { BookOpen, Home, Sparkles } from 'lucide-react';

export const BlogPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
      <SEOHead
        title="Blog — ToolGenie"
        description="Engineering insights, client-side web technology articles, and privacy tutorials on ToolGenie."
        canonicalUrl="https://toolgenie.online/blog"
      />

      <div 
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--accent)'
        }}
      >
        <BookOpen size={30} />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold mb-4 border"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)'
        }}
      >
        <Sparkles size={13} style={{ color: 'var(--accent)' }} />
        <span>Publication Desk</span>
      </div>

      <h1 
        className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        Articles coming soon.
      </h1>

      <p 
        className="text-base sm:text-lg max-w-lg mx-auto mb-8 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        We are preparing deep dives on WebAssembly, browser sandboxing, client-side cryptographic hashing, and privacy-preserving web architectures.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-semibold text-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: 'var(--accent)',
          color: 'var(--accent-contrast)'
        }}
      >
        <Home size={16} />
        <span>Return to Tools</span>
      </Link>
    </div>
  );
};
