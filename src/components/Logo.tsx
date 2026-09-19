import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showTagline = false 
}) => {
  const iconSizes = {
    sm: { w: 26, h: 22, text: 'text-xl' },
    md: { w: 34, h: 28, text: 'text-2xl' },
    lg: { w: 44, h: 36, text: 'text-3xl' }
  };

  const currentSize = iconSizes[size];

  return (
    <div 
      id="toolgenie-brand-logo"
      className={`toolgenie-logo inline-flex items-center gap-2.5 cursor-pointer select-none group ${className}`}
      role="banner"
    >
      {/* Inline SVG Genie Lamp with 3 Sparkle Dots */}
      <div className="relative flex items-center justify-center">
        <svg 
          width={currentSize.w} 
          height={currentSize.h} 
          viewBox="0 0 54 44" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 ease-out group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Sparkle Dot 1 (Small) */}
          <circle 
            cx="44" 
            cy="7" 
            r="2.5" 
            fill="var(--accent)" 
            className="sparkle-dot sparkle-dot-1" 
          />
          {/* Sparkle Dot 2 (Medium) */}
          <path 
            d="M37 2 L38.2 4.5 L40.8 5.7 L38.2 6.9 L37 9.4 L35.8 6.9 L33.2 5.7 L35.8 4.5 Z" 
            fill="var(--accent)" 
            className="sparkle-dot sparkle-dot-2" 
          />
          {/* Sparkle Dot 3 (Rising star) */}
          <circle 
            cx="48" 
            cy="13" 
            r="1.7" 
            fill="var(--accent)" 
            className="sparkle-dot sparkle-dot-3" 
          />

          {/* Lamp Spout Smoke Wisp */}
          <path 
            d="M34 16C37 13 41 12 43 9" 
            stroke="var(--accent)" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeDasharray="2 3"
            className="opacity-75"
          />

          {/* Genie Lamp Body */}
          {/* Base Stand */}
          <ellipse cx="23" cy="40" rx="13" ry="3" fill="var(--accent)" />
          <path d="M16 38L19 32H27L30 38H16Z" fill="var(--accent)" opacity="0.9" />

          {/* Curved Lower & Middle Belly */}
          <path 
            d="M10 27C10 33 16 34 23 34C31 34 37 32 37 27C37 23 33 21 27 21L18 21C13 21 10 23 10 27Z" 
            fill="var(--accent)" 
          />

          {/* Elegant Extended Spout curving upward to right */}
          <path 
            d="M27 21C34 21 40 18 45 14C45.5 13.5 46.5 14.5 45.8 15.5C40.5 22.5 34 26 27 26L27 21Z" 
            fill="var(--accent)" 
          />

          {/* Lamp Spout Rim */}
          <ellipse cx="45" cy="14" rx="2.2" ry="3.5" transform="rotate(-30 45 14)" fill="var(--accent)" />

          {/* Lamp Handle (Left Arch) */}
          <path 
            d="M14 23C7 20 6 12 12 8C17 5 21 9 20 13" 
            stroke="var(--accent)" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* Lamp Lid / Finial */}
          <ellipse cx="22" cy="19" rx="6" ry="2.2" fill="var(--accent)" />
          <circle cx="22" cy="16" r="2.2" fill="var(--accent)" />
        </svg>
      </div>

      {/* Wordmark: "Tool" in text-primary, "Genie" in accent */}
      <div className="flex flex-col leading-none">
        <div className={`font-heading font-extrabold tracking-tight ${currentSize.text}`}>
          <span style={{ color: 'var(--text-primary)' }} className="transition-colors duration-200">
            Tool
          </span>
          <span style={{ color: 'var(--accent)' }} className="transition-colors duration-200 ml-[1px]">
            Genie
          </span>
        </div>
        {showTagline && (
          <span 
            className="text-[11px] font-medium tracking-wide mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            100% Client-Side Tools
          </span>
        )}
      </div>
    </div>
  );
};
