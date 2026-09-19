import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, any> | null;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  canonicalUrl,
  jsonLd = null,
}) => {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // Helper to set or create meta tag
    const setMetaTag = (selector: string, attribute: 'name' | 'property', attrValue: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // 2. Meta description
    setMetaTag('meta[name="description"]', 'name', 'description', description);

    // 3. Open Graph tags
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', 'ToolGenie');

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://toolgenie.online';
    const effectiveUrl = canonicalUrl || (typeof window !== 'undefined' ? `${origin}${window.location.pathname}` : 'https://toolgenie.online');
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', effectiveUrl);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', 'https://toolgenie.online/og-image.png');

    // 4. Twitter tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', 'https://toolgenie.online/og-image.png');

    // 5. Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = effectiveUrl;

    // 6. JSON-LD Schema
    const scriptId = 'toolgenie-json-ld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement;

    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = scriptId;
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Clean up script when unmounting or changing page
      const currentScript = document.getElementById(scriptId);
      if (currentScript && !jsonLd) {
        currentScript.remove();
      }
    };
  }, [title, description, canonicalUrl, jsonLd]);

  return null;
};
