import React from 'react';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { Sparkles, ArrowUpRight } from 'lucide-react';

interface ToolCardProps {
  tool: ToolItem;
  categoryAccentColor?: string;
  categoryName?: string;
  onClick: (tool: ToolItem) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  categoryAccentColor = '#6366f1',
  categoryName,
  onClick,
}) => {
  const isLive = tool.status === 'live';

  // Calculate RGB glow
  const hex = categoryAccentColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 99;
  const g = parseInt(hex.substring(2, 4), 16) || 102;
  const b = parseInt(hex.substring(4, 6), 16) || 241;
  const categoryGlow = `rgba(${r}, ${g}, ${b}, 0.32)`;

  return (
    <div
      id={`tool-card-${tool.slug}`}
      onClick={() => onClick(tool)}
      className={`rounded-2xl border p-5 flex flex-col justify-between transition-all select-none ${
        isLive ? 'toolgenie-hover-glow cursor-pointer' : 'toolgenie-coming-soon cursor-default'
      }`}
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        ...(isLive ? {
          ['--category-accent' as any]: categoryAccentColor,
          ['--category-glow' as any]: categoryGlow
        } : {})
      }}
      role={isLive ? 'button' : 'article'}
      tabIndex={isLive ? 0 : -1}
      onKeyDown={(e) => {
        if (isLive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(tool);
        }
      }}
      aria-label={`${tool.name} - ${tool.shortDescription}`}
    >
      <div>
        {/* Top bar: Icon and Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div 
            className="tool-icon-wrapper w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-200"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-subtle)',
              color: categoryAccentColor
            }}
          >
            <DynamicIcon name={tool.icon} size={22} />
          </div>

          <div className="flex items-center gap-1.5">
            {categoryName && (
              <span 
                className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-muted)'
                }}
              >
                {categoryName}
              </span>
            )}
            {isLive ? (
              <span 
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--badge-live-bg)',
                  color: 'var(--badge-live-text)'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                LIVE
              </span>
            ) : (
              <span 
                className="inline-flex items-center gap-1 text-[10px] font-mono font-medium tracking-tight px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--badge-soon-bg)',
                  color: 'var(--badge-soon-text)'
                }}
              >
                <Sparkles size={10} />
                COMING SOON
              </span>
            )}
          </div>
        </div>

        {/* Tool Name */}
        <h3 
          className="font-heading text-base font-bold tracking-tight mb-1 flex items-center justify-between"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>{tool.name}</span>
          {isLive && (
            <ArrowUpRight 
              size={15} 
              className="opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ color: categoryAccentColor }} 
            />
          )}
        </h3>

        {/* Tool One-line Short Description */}
        <p 
          className="text-xs sm:text-sm leading-relaxed line-clamp-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          {tool.shortDescription}
        </p>
      </div>

      {/* Bottom info bar */}
      <div 
        className="mt-4 pt-3 border-t flex items-center justify-between text-[11px]"
        style={{ 
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)'
        }}
      >
        <span>{tool.faqs.length} FAQs</span>
        <span className="font-medium hover:underline" style={{ color: isLive ? categoryAccentColor : 'var(--text-muted)' }}>
          {isLive ? 'Launch Tool →' : 'In Development'}
        </span>
      </div>
    </div>
  );
};
