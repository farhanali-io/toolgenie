/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryTabs } from './components/CategoryTabs';
import { PopularStrip } from './components/PopularStrip';
import { ToolGrid } from './components/ToolGrid';
import { HowItWorks } from './components/HowItWorks';
import { WhyToolGenie } from './components/WhyToolGenie';
import { Footer } from './components/Footer';
import { SEOHead } from './components/SEOHead';
import { CategoryPage } from './pages/CategoryPage';
import { ToolPage } from './pages/ToolPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { BlogPage } from './pages/BlogPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { usePath } from './utils/router';
import { categories, getAllTools } from './data/tools';
import { ToolItem } from './types';

export default function App() {
  const [currentPath, navigate] = usePath();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Global keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' && 
        document.activeElement?.tagName !== 'INPUT' && 
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        if (currentPath !== '/') {
          navigate('/');
          setTimeout(() => {
            searchInputRef.current?.focus();
            window.scrollTo({ top: 120, behavior: 'smooth' });
          }, 50);
        } else {
          searchInputRef.current?.focus();
          window.scrollTo({ top: 120, behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [currentPath, navigate]);

  const handleSelectCategory = (slug: string) => {
    setSelectedCategory(slug);
    const targetElement = document.getElementById('tools-section');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSearchFocus = () => {
    if (currentPath !== '/') {
      navigate('/');
      setTimeout(() => {
        searchInputRef.current?.focus();
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }, 50);
    } else {
      searchInputRef.current?.focus();
      window.scrollTo({ top: 100, behavior: 'smooth' });
    }
  };

  const handleToolClick = (toolOrSlug: ToolItem | string) => {
    if (typeof toolOrSlug === 'string') {
      const all = getAllTools() as ToolItem[];
      const found = all.find(t => t.slug === toolOrSlug);
      if (found) {
        navigate(`/${found.categorySlug}/${found.slug}`);
      }
    } else {
      navigate(`/${toolOrSlug.categorySlug}/${toolOrSlug.slug}`);
    }
  };

  // Route Dispatcher
  const renderCurrentView = () => {
    // Normalize path by stripping trailing slash and hash
    const cleanPath = currentPath.split('#')[0].replace(/\/+$/, '') || '/';
    const segments = cleanPath.split('/').filter(Boolean);

    // 1. Homepage: /
    if (cleanPath === '/') {
      return (
        <>
          <SEOHead
            title="ToolGenie — Free Browser-Based Tools | 100% Private, Zero Uploads"
            description="Free online tools that run 100% in your browser. No uploads, no signup, no limits. Your files never leave your device."
            canonicalUrl="https://toolgenie.online"
          />

          {/* 1. Hero with Live Search */}
          <Hero
            onSelectTool={handleToolClick}
            searchInputRef={searchInputRef}
          />

          {/* 2. Category Tab Bar */}
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
          />

          {/* 3. Popular Tools Strip */}
          {selectedCategory === 'all' && (
            <PopularStrip onSelectTool={handleToolClick} />
          )}

          {/* 4. Tool Grid */}
          <ToolGrid
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onSelectTool={handleToolClick}
          />

          {/* 5. How It Works Strip */}
          <HowItWorks />

          {/* 6. Why ToolGenie */}
          <WhyToolGenie />
        </>
      );
    }

    // 2. Static Pages
    if (cleanPath === '/about') {
      return <AboutPage />;
    }

    if (cleanPath === '/contact') {
      return <ContactPage />;
    }

    if (cleanPath === '/blog') {
      return <BlogPage />;
    }

    if (cleanPath === '/privacy-policy') {
      return <PrivacyPolicyPage />;
    }

    if (cleanPath === '/terms') {
      return <TermsPage />;
    }

    // 3. Category Page: /{category-slug}
    if (segments.length === 1) {
      const catSlug = segments[0];
      const isCategory = categories.some(c => c.slug === catSlug);
      if (isCategory) {
        return (
          <CategoryPage
            categorySlug={catSlug}
            onSelectTool={handleToolClick}
            onNavigate={navigate}
          />
        );
      }
    }

    // 4. Tool Page: /{category-slug}/{tool-slug}
    if (segments.length === 2) {
      const [catSlug, toolSlug] = segments;
      const cat = categories.find(c => c.slug === catSlug);
      const tool = cat?.tools.find(t => t.slug === toolSlug);
      if (cat && tool) {
        return (
          <ToolPage
            categorySlug={catSlug}
            toolSlug={toolSlug}
            onNavigate={navigate}
          />
        );
      }
    }

    // 5. 404 Not Found Page
    return <NotFoundPage />;
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Sticky Header */}
      <Header
        onSearchClick={handleSearchFocus}
        onNavigateTools={() => {
          if (currentPath !== '/') {
            navigate('/');
            setTimeout(() => {
              setSelectedCategory('all');
              document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 50);
          } else {
            setSelectedCategory('all');
            document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* Dynamic Route Content */}
      <main className="grow">
        {renderCurrentView()}
      </main>

      {/* 4-Column Footer */}
      <Footer />
    </div>
  );
}
