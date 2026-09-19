import React from 'react';
import { Logo } from './Logo';
import { categories } from '../data/tools';
import { Link } from '../utils/router';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const popularToolsList = [
    { name: 'Merge PDF', path: '/pdf-tools/merge-pdf' },
    { name: 'Compress Image', path: '/image-tools/image-compressor' },
    { name: 'JSON Formatter', path: '/developer-tools/json-formatter' },
    { name: 'QR Code Generator', path: '/developer-tools/qr-code-generator' },
    { name: 'Word Counter', path: '/text-tools/word-counter' },
    { name: 'Password Generator', path: '/developer-tools/password-generator' }
  ];

  return (
    <footer 
      id="main-footer"
      className="w-full border-t transition-colors duration-200 mt-20"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          {/* Col 1: Logo + Tagline */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Logo size="md" />
            </Link>
            <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Free browser-based tools that respect your privacy.
            </p>
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={14} style={{ color: 'var(--accent)' }} />
              <span>100% Client-Side Processing</span>
            </div>
            <p className="text-xs pt-2" style={{ color: 'var(--text-muted)' }}>
              Contact: <a href="mailto:farhanaly.io3@gmail.com" className="hover:underline" style={{ color: 'var(--accent)' }}>farhanaly.io3@gmail.com</a>
            </p>
          </div>

          {/* Col 2: All 9 Category Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
              Tool Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/${cat.slug}`}
                    className="hover:underline flex items-center justify-between w-full text-left transition-colors duration-150 group"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-150">
                      {cat.name}
                    </span>
                    {cat.status === 'coming-soon' && (
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-tight"
                        style={{
                          backgroundColor: 'var(--badge-soon-bg)',
                          color: 'var(--badge-soon-text)'
                        }}
                      >
                        Soon
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Popular Tool Direct Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
              Popular Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              {popularToolsList.map((tool) => (
                <li key={tool.path}>
                  <Link
                    href={tool.path}
                    className="hover:underline transition-colors duration-150 block text-left"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Platform & Legal Links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-primary)' }}>
              Company & Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="hover:underline block text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:underline block text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:underline block text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy-policy"
                  className="hover:underline block text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:underline block text-left"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div 
          className="border-t mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ 
            borderColor: 'var(--border-subtle)',
            color: 'var(--text-muted)'
          }}
        >
          <p>© 2026 ToolGenie. All rights reserved.</p>
          <p className="flex items-center gap-1.5 font-medium text-center">
            <span>Made with</span>
            <Heart size={13} className="text-red-500 fill-red-500 inline" />
            <span>— your files never leave your browser.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
