import React from 'react';
import { SEOHead } from '../components/SEOHead';
import { FileText, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEOHead
        title="Terms of Service — ToolGenie"
        description="ToolGenie standard terms of service: acceptable use, no warranty, and limitation of liability in clear, readable language."
        canonicalUrl="https://toolgenie.online/terms"
      />

      <header className="mb-10 pb-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2 text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
          <Calendar size={14} />
          <span>Last Updated: September 19, 2026</span>
        </div>

        <h1 
          className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          Terms of Service
        </h1>

        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Simple, plain-language terms governing the use of the ToolGenie website and browser-based tools.
        </p>
      </header>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              1. Acceptance of Terms
            </h2>
          </div>
          <p>
            By accessing and using ToolGenie (toolgenie.online), you agree to these Terms of Service. If you do not agree with any part of these terms, please do not use our service. We reserve the right to update these terms periodically to reflect new tools or regulatory requirements.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              2. Acceptable Use
            </h2>
          </div>
          <p>
            ToolGenie provides free utilities for personal, educational, and commercial purposes. You agree to use ToolGenie only for lawful activities. You may not:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Attempt to disrupt or impair the availability or integrity of our static hosting or assets.</li>
            <li>Use automated scripts or scrapers to excessively hammer or abuse platform resources.</li>
            <li>Misrepresent ToolGenie or attempt to pass off its utilities as a proprietary service without proper attribution.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--accent)' }} />
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              3. Ownership &amp; Intellectual Property
            </h2>
          </div>
          <p>
            <strong>Your Data is Yours:</strong> Because all files and inputs are computed entirely inside your browser and never uploaded, you retain 100% full and exclusive ownership over all documents, images, code, and content processed using ToolGenie. ToolGenie claims zero rights, licenses, or interest in any file you interact with.
          </p>
          <p>
            ToolGenie&apos;s brand, logo, design system, and code are protected by intellectual property laws and copyright.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              4. Disclaimer of Warranty
            </h2>
          </div>
          <p>
            ToolGenie is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind, whether express or implied. While we strive to make every tool robust, mathematically accurate, and stable, we do not warrant that tools will be error-free, continuous, or compatible with corrupt or damaged input files. Always maintain independent backups of critical documents.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              5. Limitation of Liability
            </h2>
          </div>
          <p>
            To the maximum extent permitted by applicable law, ToolGenie and its maintainers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data or business interruption, arising from your use of or inability to use the platform.
          </p>
        </section>

        <section className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            6. Questions and Contact
          </h2>
          <p>
            For questions regarding these Terms of Service, please reach out to our team at{' '}
            <a href="mailto:farhanaly.io3@gmail.com" className="font-semibold underline" style={{ color: 'var(--accent)' }}>
              farhanaly.io3@gmail.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
};
