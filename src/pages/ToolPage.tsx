import React, { useState } from 'react';
import { categories } from '../data/tools';
import { getToolHowToSteps } from '../utils/toolSteps';
import { ToolCard } from '../components/ToolCard';
import { DynamicIcon } from '../components/DynamicIcon';
import { SEOHead } from '../components/SEOHead';
import { Link } from '../utils/router';
import { ToolItem } from '../types';
import { ToolWidgetDispatcher, hasToolWidget } from '../components/tools/ToolWidgetDispatcher';
import { 
  Home, 
  ChevronRight, 
  ChevronDown, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Sparkles, 
  HelpCircle, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface ToolPageProps {
  categorySlug: string;
  toolSlug: string;
  onNavigate: (path: string) => void;
}

export const ToolPage: React.FC<ToolPageProps> = ({
  categorySlug,
  toolSlug,
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const category = categories.find((c) => c.slug === categorySlug);
  const categoryTools = (category?.tools || []) as ToolItem[];
  const tool = categoryTools.find((t) => t.slug === toolSlug);

  if (!category || !tool) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Tool Not Found
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          The tool you are looking for does not exist or has been relocated.
        </p>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          <Home size={16} />
          <span>Back to Homepage</span>
        </Link>
      </div>
    );
  }

  const isLive = tool.status === 'live';
  const categoryAccent = category.accentColor || '#6366f1';
  const howToSteps = getToolHowToSteps(tool);

  // Related tools: 3-4 cards from same category
  const relatedTools = categoryTools
    .filter((t) => t.slug !== tool.slug)
    .slice(0, 4);

  // FAQPage JSON-LD Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': tool.faqs.map((faq) => ({
      '@type': 'Question',
      'name': faq.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.a
      }
    }))
  };

  const pageTitle = `${tool.name} Online Free — No Upload, 100% Private | ToolGenie`;
  const metaDescription = `${tool.shortDescription} Free, unlimited browser-based tool running locally with zero file uploads and complete privacy on ToolGenie.`;
  const canonicalUrl = `https://toolgenie.online/${category.slug}/${tool.slug}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. SEO Head with JSON-LD Schema */}
      <SEOHead
        title={pageTitle}
        description={metaDescription}
        canonicalUrl={canonicalUrl}
        jsonLd={faqSchema}
      />

      {/* 2. Breadcrumbs: Home > {Category Name} > {Tool Name} */}
      <nav 
        aria-label="Breadcrumb" 
        className="flex items-center gap-2 text-xs font-medium mb-6 select-none flex-wrap"
        style={{ color: 'var(--text-muted)' }}
      >
        <Link 
          href="/" 
          className="flex items-center gap-1 hover:underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        <ChevronRight size={14} className="opacity-50" />
        <Link 
          href={`/${category.slug}`}
          className="hover:underline transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          {category.name}
        </Link>
        <ChevronRight size={14} className="opacity-50" />
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {tool.name}
        </span>
      </nav>

      {/* 3. Header: Icon, H1 & Description */}
      <header className="mb-8">
        <div className="flex items-center gap-3.5 mb-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: categoryAccent
            }}
          >
            <DynamicIcon name={tool.icon} size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Link
                href={`/${category.slug}`}
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: categoryAccent
                }}
              >
                {category.name}
              </Link>
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: isLive ? 'var(--badge-live-bg)' : 'var(--badge-soon-bg)',
                  color: isLive ? 'var(--badge-live-text)' : 'var(--badge-soon-text)'
                }}
              >
                {isLive ? 'LIVE' : 'COMING SOON'}
              </span>
            </div>
            <h1 
              className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {tool.name}
            </h1>
          </div>
        </div>

        <p 
          className="text-base sm:text-lg leading-relaxed max-w-3xl mt-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {tool.longDescription}
        </p>
      </header>

      {/* 4. Styled Widget Placeholder (or Coming Soon panel) */}
      <section 
        id="tool-workspace-container"
        className="mb-14"
      >
        {isLive ? (
          hasToolWidget(tool.slug) ? (
            <ToolWidgetDispatcher toolSlug={tool.slug} categorySlug={category.slug} />
          ) : (
            <div 
              className="rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center min-h-[320px] flex flex-col items-center justify-center relative overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-strong)',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)'
              }}
            >
              {/* Background pattern */}
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: categoryAccent
                }}
              >
                <DynamicIcon name={tool.icon} size={32} />
              </div>

              <h2 
                className="font-heading text-xl sm:text-2xl font-bold tracking-tight mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Tool widget goes here
              </h2>

              <p 
                className="text-xs sm:text-sm max-w-md mx-auto mb-6"
                style={{ color: 'var(--text-secondary)' }}
              >
                Interactive client-side workspace slated for Chunk 4 implementation. This tool will run 100% inside your browser.
              </p>

              <div 
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-muted)'
                }}
              >
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Zero server uploads • 100% Private</span>
              </div>
            </div>
          )
        ) : (
          <div 
            className="rounded-2xl border p-8 sm:p-14 text-center min-h-[300px] flex flex-col items-center justify-center"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: categoryAccent
              }}
            >
              <Sparkles size={30} />
            </div>

            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-full mb-3"
              style={{
                backgroundColor: 'var(--badge-soon-bg)',
                color: 'var(--badge-soon-text)'
              }}
            >
              <span>COMING SOON</span>
            </div>

            <h2 
              className="font-heading text-2xl font-bold tracking-tight mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {tool.name} is in Development
            </h2>

            <p 
              className="text-xs sm:text-sm max-w-md mx-auto"
              style={{ color: 'var(--text-secondary)' }}
            >
              Our engineers are currently refining client-side WebAssembly routines for this tool to ensure rapid, offline-capable performance without cloud dependencies.
            </p>
          </div>
        )}
      </section>

      {/* 5. "How to use" section — 3-5 numbered steps */}
      <section id="how-to-use-section" className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <Layers size={20} style={{ color: categoryAccent }} />
          <h2 className="font-heading text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            How to Use {tool.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {howToSteps.map((step) => (
            <div 
              key={step.step}
              className="rounded-xl border p-5 flex flex-col justify-between"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <div>
                <span 
                  className="font-mono text-xs font-bold px-2 py-0.5 rounded-md inline-block mb-3"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    color: categoryAccent
                  }}
                >
                  Step {step.step}
                </span>
                <h3 className="font-heading text-base font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. "Why use ToolGenie for this" — short privacy/speed blurb */}
      <section 
        id="why-use-toolgenie"
        className="rounded-2xl border p-6 sm:p-8 mb-14"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
          Why Use ToolGenie for {tool.name}?
        </h2>

        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>
          Most online utilities send your confidential files and text data over the internet to remote servers for processing. ToolGenie is fundamentally different:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Lock size={16} className="text-emerald-500" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>100% Confidential</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Your files never leave your device. All calculations, transformations, and memory allocations occur in your local browser sandbox.
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={16} className="text-amber-500" />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Instant Processing</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Zero upload queues, network bottlenecks, or server lags. Operations complete at the speed of your device's multi-core CPU.
            </p>
          </div>

          <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-page)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={16} style={{ color: categoryAccent }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>No Limits or Watermarks</h3>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Enjoy unrestricted usage with no page count limits, hidden subscription paywalls, or ugly watermarks stamped on your results.
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ section: 5-7 accordion items */}
      <section id="tool-faqs" className="mb-14">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle size={20} style={{ color: categoryAccent }} />
          <h2 className="font-heading text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {tool.faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div 
                key={index}
                className="border rounded-xl overflow-hidden transition-colors"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: isOpen ? categoryAccent : 'var(--border-subtle)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-semibold transition-opacity hover:opacity-90"
                  style={{ color: 'var(--text-primary)' }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={18} 
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  />
                </button>

                {isOpen && (
                  <div 
                    className="px-4 pb-4 pt-1 text-xs sm:text-sm leading-relaxed border-t"
                    style={{ 
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. "Related tools" — 3-4 cards from same category */}
      {relatedTools.length > 0 && (
        <section id="related-tools" className="pt-8 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Related {category.name}
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                Explore complementary utilities from the same suite.
              </p>
            </div>
            <Link 
              href={`/${category.slug}`}
              className="text-xs font-semibold hover:underline flex items-center gap-1 shrink-0"
              style={{ color: categoryAccent }}
            >
              <span>View all {category.name}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedTools.map((relTool) => (
              <Link
                key={relTool.slug}
                href={`/${category.slug}/${relTool.slug}`}
                className="block focus:outline-none"
              >
                <ToolCard
                  tool={{
                    ...relTool,
                    categoryName: category.name,
                    categorySlug: category.slug,
                    categoryAccentColor: categoryAccent
                  }}
                  categoryAccentColor={categoryAccent}
                  categoryName={category.name}
                  onClick={() => onNavigate(`/${category.slug}/${relTool.slug}`)}
                />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
