import React from 'react';
import { categories } from '../data/tools';
import { ToolCard } from './ToolCard';
import { ToolItem, CategoryItem } from '../types';
import { Link } from '../utils/router';
import { ArrowRight, Layers } from 'lucide-react';

interface ToolGridProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
  onSelectTool: (tool: ToolItem) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({
  selectedCategory,
  onSelectCategory,
  onSelectTool,
}) => {
  const displayedCategories: CategoryItem[] = selectedCategory === 'all'
    ? (categories as unknown as CategoryItem[])
    : (categories as unknown as CategoryItem[]).filter(c => c.slug === selectedCategory);

  return (
    <section 
      id="tools-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16"
    >
      {displayedCategories.map((category) => {
        const isLiveCategory = category.status === 'live';

        return (
          <div 
            key={category.slug} 
            id={`category-section-${category.slug}`}
            className="scroll-mt-24 space-y-6"
          >
            {/* Category Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span 
                    className="w-3 h-3 rounded-full shrink-0" 
                    style={{ backgroundColor: category.accentColor }} 
                  />
                  <Link
                    href={`/${category.slug}`}
                    className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight hover:underline transition-all"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {category.name}
                  </Link>
                  <span 
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: isLiveCategory ? 'var(--badge-live-bg)' : 'var(--badge-soon-bg)',
                      color: isLiveCategory ? 'var(--badge-live-text)' : 'var(--badge-soon-text)'
                    }}
                  >
                    {isLiveCategory ? 'READY TO USE' : 'COMING SOON'}
                  </span>
                </div>
                <p 
                  className="text-xs sm:text-sm max-w-2xl"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {category.description}
                </p>
              </div>

              {/* View all link linking to that category page */}
              {selectedCategory === 'all' ? (
                <Link
                  id={`view-all-${category.slug}`}
                  href={`/${category.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide transition-all group shrink-0 hover:underline"
                  style={{ color: category.accentColor }}
                >
                  <span>View all →</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectCategory('all')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Layers size={14} />
                  <span>Show All Categories</span>
                </button>
              )}
            </div>

            {/* Responsive Grid: 1 col on mobile, 2 on sm, 3 on md, 4 on xl */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {category.tools.map((tool) => (
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
                      onSelectTool({
                        ...tool,
                        categoryName: category.name,
                        categorySlug: category.slug,
                        categoryAccentColor: category.accentColor
                      });
                    }}
                  />
                </Link>
              ))}
            </div>

            {/* Section Bottom Footer Link */}
            {selectedCategory === 'all' && (
              <div className="flex justify-end pt-2">
                <Link
                  href={`/${category.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: category.accentColor }}
                >
                  <span>Explore all {category.tools.length} {category.name} →</span>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};
