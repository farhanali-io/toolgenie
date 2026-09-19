import React from 'react';
import { SEOHead } from '../components/SEOHead';
import { Link } from '../utils/router';
import { ShieldCheck, CheckCircle2, Heart, Mail, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <SEOHead
        title="About ToolGenie — 100% Private, Client-Side Free Tools"
        description="ToolGenie was built on a simple idea: you shouldn't have to hand over your private files just to convert, compress, or edit them."
        canonicalUrl="https://toolgenie.online/about"
      />

      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 border"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--accent)'
        }}
      >
        <Sparkles size={14} />
        <span>Our Mission & Technology</span>
      </div>

      <h1 
        className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-8"
        style={{ color: 'var(--text-primary)' }}
      >
        About ToolGenie
      </h1>

      {/* Main Copy Content formatted with headings and styling */}
      <div 
        className="rounded-2xl border p-6 sm:p-10 space-y-8"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)'
        }}
      >
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            The Privacy-First Principle
          </h2>
          <p className="text-base sm:text-lg leading-relaxed font-medium" style={{ color: 'var(--text-primary)' }}>
            ToolGenie was built on a simple idea: you shouldn't have to hand over your private files just to convert, compress, or edit them.
          </p>
        </div>

        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            How We Differ from Traditional Tools
          </h2>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Most online tool sites upload your documents to their servers, process them remotely, and often delete them &apos;within 24 hours&apos; — if you&apos;re lucky. ToolGenie works differently. Every tool on this site runs entirely inside your browser using modern web technology. Your files never leave your device. Not for a second.
          </p>
        </div>

        {/* Highlight Box */}
        <div 
          className="p-6 rounded-xl border space-y-4"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-strong)'
          }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h3 className="font-heading text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              What that means for you:
            </h3>
          </div>

          <ul className="space-y-3 text-sm sm:text-base" style={{ color: 'var(--text-primary)' }}>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>Privacy by design</strong> — nothing is uploaded, stored, or shared</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>No accounts</strong> — no email, no signup, no password to remember</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>No limits</strong> — no daily caps, no watermarks, no paywalls</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              <span><strong>Always free</strong> — basic tools should be free</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-lg sm:text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Fast, Lightweight Static Architecture
          </h2>
          <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            ToolGenie is built with modern static web technology, which is why it loads fast and works on any device. We&apos;re constantly adding new tools — if there&apos;s something you&apos;d like to see, get in touch.
          </p>
        </div>

        <div className="pt-6 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Heart size={18} className="text-rose-500 fill-rose-500" />
            <span className="font-heading font-semibold text-base">Thanks for using ToolGenie.</span>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-contrast)',
              borderColor: 'var(--accent)'
            }}
          >
            <Mail size={15} />
            <span>Get in touch</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
