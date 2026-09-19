import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeSwitcher } from './ThemeSwitcher';
import { Link } from '../utils/router';

interface HeaderProps {
  onSearchClick: () => void;
  onNavigateTools?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSearchClick, 
  onNavigateTools
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      id="main-header"
      className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
        isScrolled 
          ? 'shadow-md backdrop-blur-md' 
          : 'backdrop-blur-sm'
      }`}
      style={{
        backgroundColor: 'var(--header-bg)',
        borderColor: isScrolled ? 'var(--border-strong)' : 'var(--border-subtle)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <Link 
          href="/"
          className="focus:outline-none focus:ring-2 rounded-lg"
          aria-label="ToolGenie Home"
        >
          <Logo size="md" />
        </Link>

        {/* Center / Nav Items */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3" aria-label="Main Navigation">
          <Link
            id="nav-link-tools"
            href="/#tools"
            onClick={(e) => {
              if (window.location.pathname === '/') {
                e.preventDefault();
                onNavigateTools?.();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 hover:opacity-80 focus:outline-none focus:ring-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Tools
          </Link>
          <Link
            id="nav-link-blog"
            href="/blog"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 hover:opacity-80 focus:outline-none focus:ring-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Blog
          </Link>
          <Link
            id="nav-link-about"
            href="/about"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 hover:opacity-80 focus:outline-none focus:ring-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            About
          </Link>
          <Link
            id="nav-link-contact"
            href="/contact"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 hover:opacity-80 focus:outline-none focus:ring-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            Contact
          </Link>
        </nav>

        {/* Right Actions: Theme Switcher & Search Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Trigger Button */}
          <button
            id="header-search-trigger"
            type="button"
            onClick={onSearchClick}
            className="p-2 sm:px-3 sm:py-1.5 rounded-lg border flex items-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 hover:border-current cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Search tools"
          >
            <Search size={16} style={{ color: 'var(--accent)' }} />
            <span className="hidden sm:inline-block text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Search tools...
            </span>
            <kbd 
              className="hidden lg:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold uppercase border"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              /
            </kbd>
          </button>

          {/* Theme Switcher */}
          <ThemeSwitcher />
        </div>
      </div>
    </header>
  );
};
