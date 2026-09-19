import React from 'react';
import { SEOHead } from '../components/SEOHead';
import { ShieldCheck, Lock, Database, EyeOff, Mail, Calendar } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEOHead
        title="Privacy Policy — 100% Client-Side Protection | ToolGenie"
        description="ToolGenie privacy policy: Your files are processed locally in your browser and are never transmitted to or stored on any server."
        canonicalUrl="https://toolgenie.online/privacy-policy"
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
          Privacy Policy
        </h1>

        <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          ToolGenie is engineered from the ground up around a fundamental premise: your private files and personal data should never leave your possession.
        </p>
      </header>

      {/* Highlights Banner */}
      <div 
        className="p-6 rounded-2xl border mb-10 space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
        }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} className="text-emerald-500" />
          <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            The ToolGenie Privacy Guarantee
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <Lock size={16} className="text-emerald-500 mb-1" />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Zero File Uploads</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Documents, photos, codes, and media are computed purely inside your local browser memory.</p>
          </div>

          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <Database size={16} className="text-emerald-500 mb-1" />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Zero File Storage</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We operate no file servers, cloud buckets, or retention queues. When you close the tab, memory clears.</p>
          </div>

          <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <EyeOff size={16} className="text-emerald-500 mb-1" />
            <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No Tracking Profiles</h3>
            <p style={{ color: 'var(--text-secondary)' }}>We do not sell user data, build marketing profiles, or track your identity across the web.</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            1. Local Browser Processing Architecture
          </h2>
          <p>
            Unlike conventional online tool websites that force you to upload PDF contracts, personal photographs, code tokens, or business spreadsheets to remote servers, ToolGenie uses modern browser APIs including WebAssembly, WebCodecs, HTML5 Canvas, and the Web Crypto API.
          </p>
          <p>
            All file slicing, merging, compressing, converting, and formatting operations execute entirely within your computer or mobile device’s local processor sandbox. At no point during processing is your file transmitted to ToolGenie servers or any third-party infrastructure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            2. What Data We Collect
          </h2>
          <p>
            Because ToolGenie does not require user accounts, logins, or credit cards, we collect minimal information:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong>Voluntary Contact Inquiries:</strong> When you voluntarily submit a message via our Contact form, we receive the name, email address, and message you submit so that our support team can answer your inquiry.</li>
            <li><strong>Local Client Preferences:</strong> Your active visual color theme preference is stored strictly in your browser’s local storage (<code className="text-xs font-mono px-1 py-0.5 rounded bg-black/10 dark:bg-white/10">localStorage</code>) to maintain your preference across sessions. This value is never transmitted to us.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            3. Third-Party Services
          </h2>
          <p>
            When submitting the contact form, requests are securely transmitted via Web3Forms (an established email forwarding relay) solely to deliver your message to our official mailbox at <a href="mailto:farhanaly.io3@gmail.com" className="font-semibold underline" style={{ color: 'var(--accent)' }}>farhanaly.io3@gmail.com</a>. No advertising trackers or invasive spyware scripts are used.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            4. Children&apos;s Privacy
          </h2>
          <p>
            ToolGenie does not knowingly collect personally identifiable information from children under 13. Given our architecture, anyone may freely use the tools without providing identity information.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            5. Contact Us Regarding Privacy
          </h2>
          <p>
            If you have questions about this privacy statement or our technical architecture, contact us anytime at:
          </p>
          <div className="p-4 rounded-xl border flex items-center gap-2.5 max-w-sm" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
            <Mail size={16} style={{ color: 'var(--accent)' }} />
            <a href="mailto:farhanaly.io3@gmail.com" className="font-mono text-sm font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
              farhanaly.io3@gmail.com
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
