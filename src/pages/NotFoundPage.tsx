import React from 'react';
import { SEOHead } from '../components/SEOHead';
import { Link } from '../utils/router';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
      <SEOHead
        title="Page Not Found (404) — ToolGenie"
        description="The requested page could not be located on ToolGenie. Return to homepage to explore 45+ free client-side tools."
      />

      <span 
        className="font-mono text-7xl sm:text-9xl font-black block tracking-tighter mb-4 opacity-20"
        style={{ color: 'var(--text-primary)' }}
      >
        404
      </span>

      <h1 
        className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
        style={{ color: 'var(--text-primary)' }}
      >
        Oops! Page Not Found
      </h1>

      <p 
        className="text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        The page you are looking for doesn&apos;t exist, has been removed, or the link may be broken.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-semibold text-sm transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)'
          }}
        >
          <Home size={16} />
          <span>Back to Homepage</span>
        </Link>

        <Link
          href="/#tools"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-heading font-semibold text-sm border transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
        >
          <Search size={16} />
          <span>Browse All Tools</span>
        </Link>
      </div>
    </div>
  );
};
