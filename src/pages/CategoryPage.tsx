import React from 'react';
import { categories } from '../data/tools';
import { categorySeoContent } from '../data/categorySeo';
import { ToolCard } from '../components/ToolCard';
import { SEOHead } from '../components/SEOHead';
import { Link } from '../utils/router';
import { ToolItem } from '../types';
import { ChevronRight, Home, Sparkles, Shield, ArrowRight } from 'lucide-react';

interface CategoryPageProps {
  categorySlug: string;
  onSelectTool: (tool: ToolItem) => void;
  onNavigate: (path: string) => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  categorySlug,
  onSelectTool,
  onNavigate,
}) => {
  const category = categories.find((c) => c.slug === categorySlug);

  if (!category) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Category Not Found
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          The requested tool category could not be located.
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

  const isComingSoonCategory = category.status === 'coming-soon';
  const seoData = categorySeoContent[category.slug] || {
    title: `${category.name} — Free Browser-Based Utilities`,
    metaTitle: `Free ${category.name} — 100% Private & Client-Side | ToolGenie`,
    metaDescription: `Discover free online ${category.name.toLowerCase()} running 100% in your browser. No file uploads, no signup, completely private.`,
    content: category.description
  };

  const otherCategories = categories.filter((c) => c.slug !== category.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* 1. SEO Head */}
      <SEOHead
        title={seoData.metaTitle}
        description={seoData.metaDescription}
        canonicalUrl={`https://toolgenie.online/${category.slug}`}
      />

      {/* 2. Breadcrumb Navigation */}
      <nav 
        aria-label="Breadcrumb" 
        className="flex items-center gap-2 text-xs font-medium mb-6 select-none"
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
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
          {category.name}
        </span>
      </nav>

      {/* 3. Category Header: H1 + Description */}
      <header className="mb-10 pb-8 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span 
            className="w-4 h-4 rounded-full shrink-0" 
            style={{ backgroundColor: category.accentColor }} 
          />
          <h1 
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {category.name}
          </h1>
          <span 
            className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: isComingSoonCategory ? 'var(--badge-soon-bg)' : 'var(--badge-live-bg)',
              color: isComingSoonCategory ? 'var(--badge-soon-text)' : 'var(--badge-live-text)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            {isComingSoonCategory ? 'COMING SOON' : 'LIVE SUITE'}
          </span>
        </div>

        <p 
          className="text-base sm:text-lg max-w-3xl leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {category.description}
        </p>

        {isComingSoonCategory && (
          <div 
            className="mt-4 p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm max-w-2xl"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)'
            }}
          >
            <Sparkles size={18} style={{ color: category.accentColor }} className="shrink-0" />
            <p style={{ color: 'var(--text-secondary)' }}>
              These {category.name} tools are currently in active client-side WebAssembly optimization and scheduled for launch in upcoming phases.
            </p>
          </div>
        )}
      </header>

      {/* 4. Grid of Category's Tool Cards */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Available Utilities ({category.tools.length})
          </h2>
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            100% Client-Side
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {(category.tools as ToolItem[]).map((tool) => (
            <Link
              key={tool.slug}
              href={`/${category.slug}/${tool.slug}`}
              className="block focus:outline-none"
            >
              <ToolCard
                tool={{
                  ...tool,
                  categoryName: category.name,
                  categorySlug: category.slug,
                  categoryAccentColor: category.accentColor
                }}
                categoryAccentColor={category.accentColor}
                categoryName={category.name}
                onClick={() => {
                  onNavigate(`/${category.slug}/${tool.slug}`);
                }}
              />
            </Link>
          ))}
        </div>
      </section>

      {/* 5. SEO Content Block (150 - 250 words) */}
      <section 
        id="category-seo-content"
        className="rounded-2xl border p-6 sm:p-8 mb-16"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)'
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} style={{ color: category.accentColor }} />
          <h2 className="font-heading text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {seoData.title}
          </h2>
        </div>

        <div 
          className="text-xs sm:text-sm leading-relaxed space-y-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {seoData.content.split('\n\n').map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* 6. "Other categories" strip at the bottom linking to the other 8 */}
      <section id="other-categories-strip" className="pt-8 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-lg sm:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Explore Other Tool Categories
          </h2>
          <Link 
            href="/" 
            className="text-xs font-semibold hover:underline flex items-center gap-1"
            style={{ color: 'var(--accent)' }}
          >
            <span>All 9 Categories</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
          {otherCategories.map((otherCat) => (
            <Link
              key={otherCat.slug}
              href={`/${otherCat.slug}`}
              className="p-3.5 rounded-xl border flex items-center gap-2.5 transition-all duration-150 hover:scale-[1.02] group"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)'
              }}
            >
              <span 
                className="w-2.5 h-2.5 rounded-full shrink-0" 
                style={{ backgroundColor: otherCat.accentColor }} 
              />
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-semibold block truncate group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {otherCat.name}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {otherCat.tools.length} tools
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
