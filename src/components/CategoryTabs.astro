import React, { useRef } from 'react';
import { categories } from '../data/tools';
import { LayoutGrid, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from '../utils/router';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const totalToolCount = categories.reduce((acc, cat) => acc + cat.tools.length, 0);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      {/* Scroll controls for desktop */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Browse by Category
        </span>
        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => scroll('left')}
            className="p-1 rounded-md border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scroll('right')}
            className="p-1 rounded-md border hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontally scrollable pills */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none no-scrollbar select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* "All" Pill */}
        <button
          id="category-pill-all"
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`toolgenie-hover-glow shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border cursor-pointer ${
            selectedCategory === 'all' ? 'ring-2' : ''
          }`}
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--accent)' : 'var(--bg-surface)',
            color: selectedCategory === 'all' ? 'var(--accent-contrast)' : 'var(--text-primary)',
            borderColor: selectedCategory === 'all' ? 'var(--accent)' : 'var(--border-subtle)',
            ['--category-accent' as any]: 'var(--accent)',
            ['--category-glow' as any]: 'var(--accent-glow)'
          }}
        >
          <LayoutGrid size={15} />
          <span>All Tools</span>
          <span 
            className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-normal opacity-80"
            style={{
              backgroundColor: selectedCategory === 'all' ? 'rgba(255,255,255,0.2)' : 'var(--bg-input)'
            }}
          >
            {totalToolCount}
          </span>
        </button>

        {/* 9 Category Pills with Signature Hover Glow */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          const hex = cat.accentColor.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 99;
          const g = parseInt(hex.substring(2, 4), 16) || 102;
          const b = parseInt(hex.substring(4, 6), 16) || 241;
          const categoryGlow = `rgba(${r}, ${g}, ${b}, 0.35)`;

          return (
            <div
              key={cat.slug}
              className={`toolgenie-hover-glow shrink-0 inline-flex items-center rounded-xl border transition-all ${
                isSelected ? 'ring-2' : ''
              }`}
              style={{
                backgroundColor: isSelected ? cat.accentColor : 'var(--bg-surface)',
                borderColor: isSelected ? cat.accentColor : 'var(--border-subtle)',
                ['--category-accent' as any]: cat.accentColor,
                ['--category-glow' as any]: categoryGlow
              }}
            >
              <button
                id={`category-pill-${cat.slug}`}
                type="button"
                onClick={() => onSelectCategory(cat.slug)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold cursor-pointer"
                style={{
                  color: isSelected ? '#ffffff' : 'var(--text-primary)'
                }}
              >
                {/* Category Color Dot */}
                <span 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: isSelected ? '#ffffff' : cat.accentColor }} 
                />
                <span className="whitespace-nowrap">{cat.name}</span>
                <span 
                  className="text-[11px] px-1.5 py-0.2 rounded-full font-mono font-normal opacity-80 shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-input)'
                  }}
                >
                  {cat.tools.length}
                </span>
              </button>

              {/* Direct link icon to category page */}
              <Link
                href={`/${cat.slug}`}
                title={`Visit ${cat.name} page`}
                className="px-2 py-2 border-l hover:opacity-80 transition-opacity"
                style={{
                  borderColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--border-subtle)',
                  color: isSelected ? '#ffffff' : 'var(--text-muted)'
                }}
                aria-label={`Open ${cat.name} category page`}
              >
                <ExternalLink size={12} />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
