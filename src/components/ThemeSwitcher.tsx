import React, { useState, useEffect, useRef } from 'react';
import { Palette, Check, ChevronDown } from 'lucide-react';
import { ThemeId, ThemeConfig } from '../types';

export const THEMES: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Light',
    type: 'light',
    accent: '#4f46e5',
    bgSample: '#ffffff',
    description: 'Crisp white canvas with indigo highlights'
  },
  {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    accent: '#6366f1',
    bgSample: '#111827',
    description: 'Deep charcoal background with electric indigo'
  },
  {
    id: 'midnight',
    name: 'Midnight Blue',
    type: 'dark',
    accent: '#06b6d4',
    bgSample: '#070d1e',
    description: 'Oceanic navy tones with vivid cyan accents'
  },
  {
    id: 'emerald',
    name: 'Emerald',
    type: 'dark',
    accent: '#10b981',
    bgSample: '#041611',
    description: 'Rich dark forest skin with mint glow'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'dark',
    accent: '#f97316',
    bgSample: '#17091d',
    description: 'Burgundy twilight with warm amber glow'
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    type: 'light',
    accent: '#e11d48',
    bgSample: '#faf5f3',
    description: 'Warm light cream surface with ruby rose accents'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    type: 'dark',
    accent: '#ec4899',
    bgSample: '#090514',
    description: 'High-contrast neon magenta and dark void'
  }
];

export const ThemeSwitcher: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('light');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read theme on mount
    const saved = localStorage.getItem('toolgenie-theme') as ThemeId;
    if (saved && THEMES.some(t => t.id === saved)) {
      setCurrentTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      const activeAttr = document.documentElement.getAttribute('data-theme') as ThemeId;
      if (activeAttr && THEMES.some(t => t.id === activeAttr)) {
        setCurrentTheme(activeAttr);
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const selectTheme = (themeId: ThemeId) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    try {
      localStorage.setItem('toolgenie-theme', themeId);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
    setIsOpen(false);
  };

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="theme-switcher-button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition-all duration-150 focus:outline-none focus:ring-2"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)'
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Current theme is ${activeThemeObj.name}. Click to change theme.`}
      >
        <div 
          className="w-3.5 h-3.5 rounded-full border border-black/10 flex items-center justify-center shrink-0" 
          style={{ backgroundColor: activeThemeObj.accent }}
        />
        <span className="hidden sm:inline-block truncate max-w-[100px]">
          {activeThemeObj.name}
        </span>
        <ChevronDown 
          size={14} 
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--text-secondary)' }} 
        />
      </button>

      {isOpen && (
        <div
          id="theme-dropdown-menu"
          className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl border p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-strong)',
            boxShadow: '0 20px 35px -10px rgba(0,0,0,0.35)'
          }}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-2.5 py-2 border-b mb-1" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Palette size={14} style={{ color: 'var(--accent)' }} />
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                Theme Preset (7 Skins)
              </p>
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Saved automatically to your device
            </p>
          </div>

          <div className="space-y-1">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  id={`theme-option-${theme.id}`}
                  type="button"
                  onClick={() => selectTheme(theme.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors duration-150 text-xs ${
                    isSelected ? 'font-semibold' : 'font-normal'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-input)' : 'transparent',
                    color: 'var(--text-primary)'
                  }}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5">
                    {/* Visual Color Pill previewing skin background + accent */}
                    <div 
                      className="w-5 h-5 rounded-full border flex items-center justify-center shadow-xs shrink-0 relative overflow-hidden"
                      style={{ 
                        backgroundColor: theme.bgSample,
                        borderColor: 'var(--border-strong)'
                      }}
                    >
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{theme.name}</span>
                        {theme.type === 'light' && (
                          <span 
                            className="text-[9px] px-1 py-0.5 rounded font-mono uppercase tracking-tight"
                            style={{ backgroundColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                          >
                            Light
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] leading-tight" style={{ color: 'var(--text-muted)' }}>
                        {theme.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check 
                      size={14} 
                      className="shrink-0 ml-2" 
                      style={{ color: 'var(--accent)' }} 
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
