import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { getAllTools } from '../data/tools';
import { ToolItem } from '../types';
import { DynamicIcon } from './DynamicIcon';

interface HeroProps {
  onSelectTool: (tool: ToolItem) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const Hero: React.FC<HeroProps> = ({ onSelectTool, searchInputRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const allTools: ToolItem[] = getAllTools() as ToolItem[];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live filter matching tools
  const filteredTools = searchQuery.trim()
    ? allTools.filter(tool => {
        const query = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(query) ||
          tool.shortDescription.toLowerCase().includes(query) ||
          (tool.categoryName && tool.categoryName.toLowerCase().includes(query)) ||
          tool.slug.toLowerCase().includes(query)
        );
      })
    : [];

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!filteredTools.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredTools.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % filteredTools.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredTools[selectedIndex]) {
        onSelectTool(filteredTools[selectedIndex]);
        setSearchQuery('');
        setIsFocused(false);
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <section 
      id="hero-section"
      className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center"
    >
      {/* Privacy Guarantee Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6 text-xs font-semibold tracking-wide shadow-xs animate-in fade-in slide-in-from-top-4 duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)'
        }}
      >
        <Shield size={14} style={{ color: 'var(--accent)' }} />
        <span>100% Client-Side Engine</span>
        <span className="w-1 h-1 rounded-full opacity-40 bg-current" />
        <span className="hidden sm:inline">Zero Server Uploads</span>
        <span className="w-1 h-1 rounded-full opacity-40 bg-current hidden sm:inline" />
        <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--accent)' }}>Free Forever</span>
      </div>

      {/* Main Headline */}
      <h1 
        className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-5 max-w-4xl mx-auto"
        style={{ color: 'var(--text-primary)' }}
      >
        Free online tools that run{' '}
        <span 
          className="relative inline-block"
          style={{ color: 'var(--accent)' }}
        >
          100% in your browser.
        </span>
      </h1>

      {/* Subtitle */}
      <p 
        className="text-lg sm:text-xl font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        No uploads. No signup. No limits. Your files never leave your device — ever.
      </p>

      {/* Search Bar Container */}
      <div className="relative max-w-2xl mx-auto">
        <div 
          className={`relative flex items-center rounded-2xl border transition-all duration-200 shadow-lg ${
            isFocused ? 'ring-4' : ''
          }`}
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: isFocused ? 'var(--accent)' : 'var(--border-strong)',
            boxShadow: isFocused ? '0 10px 25px -5px var(--accent-glow)' : '0 4px 20px -2px rgba(0,0,0,0.06)'
          }}
        >
          <div className="pl-4 sm:pl-5 flex items-center pointer-events-none">
            <Search 
              size={22} 
              style={{ color: isFocused ? 'var(--accent)' : 'var(--text-muted)' }} 
              className="transition-colors duration-150"
            />
          </div>

          <input
            id="hero-search-input"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Delay hiding to allow item click
              setTimeout(() => setIsFocused(false), 220);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search 50+ free tools (e.g. merge pdf, compress image, json)..."
            className="w-full py-4 sm:py-5 pl-3.5 pr-12 rounded-2xl bg-transparent text-sm sm:text-base font-medium focus:outline-none placeholder:font-normal"
            style={{
              color: 'var(--text-primary)'
            }}
            autoComplete="off"
            aria-label="Search tools"
          />

          {searchQuery && (
            <button
              id="clear-search-button"
              type="button"
              onClick={clearSearch}
              className="absolute right-4 p-1.5 rounded-full hover:opacity-80 transition-opacity focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text-secondary)'
              }}
              aria-label="Clear search query"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isFocused && searchQuery.trim().length > 0 && (
          <div
            id="search-live-dropdown"
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-3 rounded-2xl border shadow-2xl p-2 z-50 max-h-96 overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-150"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-strong)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.45)'
            }}
          >
            <div className="px-3 py-2 border-b flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {filteredTools.length} {filteredTools.length === 1 ? 'tool' : 'tools'} matching &ldquo;{searchQuery}&rdquo;
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Use ↑ ↓ to navigate, Enter to view
              </span>
            </div>

            {filteredTools.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Sparkles size={24} className="mx-auto mb-2 opacity-50" style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  No tools found
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Try searching for &quot;PDF&quot;, &quot;Image&quot;, &quot;Convert&quot;, or &quot;Format&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {filteredTools.map((tool, index) => {
                  const isSelected = index === selectedIndex;
                  const isLive = tool.status === 'live';
                  return (
                    <button
                      key={tool.slug}
                      id={`search-result-${tool.slug}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onSelectTool(tool);
                        setSearchQuery('');
                        setIsFocused(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-150 ${
                        isSelected ? 'ring-1' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? 'var(--bg-input)' : 'transparent',
                        borderColor: isSelected ? 'var(--accent)' : 'transparent',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: tool.categoryAccentColor || 'var(--accent)'
                          }}
                        >
                          <DynamicIcon name={tool.icon} size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold truncate">
                              {tool.name}
                            </span>
                            <span 
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0"
                              style={{
                                backgroundColor: isLive ? 'var(--badge-live-bg)' : 'var(--badge-soon-bg)',
                                color: isLive ? 'var(--badge-live-text)' : 'var(--badge-soon-text)'
                              }}
                            >
                              {isLive ? 'LIVE' : 'COMING SOON'}
                            </span>
                          </div>
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {tool.shortDescription}
                          </p>
                        </div>
                      </div>

                      <ArrowRight 
                        size={16} 
                        className={`shrink-0 transition-transform ${isSelected ? 'translate-x-1' : ''}`}
                        style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        <span>Quick search:</span>
        {['Merge PDF', 'Compress Image', 'JSON Formatter', 'QR Code', 'Word Counter'].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setSearchQuery(item);
              if (searchInputRef.current) {
                searchInputRef.current.focus();
              }
            }}
            className="px-2.5 py-1 rounded-lg border hover:opacity-80 transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  );
};
