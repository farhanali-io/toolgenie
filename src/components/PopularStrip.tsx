import React from 'react';
import { getPopularTools } from '../data/tools';
import { ToolCard } from './ToolCard';
import { ToolItem } from '../types';
import { Link } from '../utils/router';
import { Flame } from 'lucide-react';

interface PopularStripProps {
  onSelectTool: (tool: ToolItem) => void;
}

export const PopularStrip: React.FC<PopularStripProps> = ({ onSelectTool }) => {
  const popularTools = (getPopularTools() as ToolItem[]).filter(Boolean);

  return (
    <section 
      id="popular-tools-strip"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame size={18} className="text-amber-500 fill-amber-500" />
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Popular Tools
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Our most frequently launched client-side utilities with zero file uploads.
          </p>
        </div>
        <span className="text-xs font-mono font-medium mt-2 sm:mt-0" style={{ color: 'var(--text-muted)' }}>
          {popularTools.length} Featured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {popularTools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/${tool.categorySlug}/${tool.slug}`}
            className="block focus:outline-none"
          >
            <ToolCard
              tool={tool}
              categoryAccentColor={tool.categoryAccentColor}
              categoryName={tool.categoryName}
              onClick={onSelectTool}
            />
          </Link>
        ))}
      </div>
    </section>
  );
};
