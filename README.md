# ToolGenie — 100% Private, Client-Side Free Tools

> High-speed, privacy-first web utilities where your files never touch a remote server. Everything processes entirely inside your web browser using HTML5 Canvas, WebAssembly, Web Workers, and the Web Crypto API.

---

## Features

- **Zero Server Uploads**: All PDF manipulation, image processing, hash calculations, and text transformations run locally in browser memory.
- **23 Working Production Tools**:
  - **PDF Tools**: Merge PDF, Split PDF, Rotate PDF, Image to PDF, Compress PDF
  - **Image Tools**: Image Compressor, Image Converter, Image Resizer, Image Cropper, Watermark Image
  - **Developer Tools**: JSON Formatter/Validator, Base64 Encoder/Decoder, Hash Generator, QR Code Generator, Password Generator
  - **Text Tools**: Word Counter & Metrics, Case Converter, Lorem Ipsum Generator, Text Diff Checker
  - **Direct Link Tools**: Direct Image Downloader (with CORS protection), HLS Stream Downloader, URL to QR Code, File Hash Checker
- **7-Theme System**: Light, Dark, Sepia, Nord, Midnight, Sunset, Forest.
- **Instant Search & Keyboard Navigation**: Live filtering across all tools with `/` quick-focus shortcut.
- **Complete SEO**: Dynamic meta tags, OpenGraph cards, Twitter Cards, canonical URLs, `FAQPage` JSON-LD schemas, `robots.txt`, and auto-generated `sitemap.xml`.

---

## Getting Started

### Prerequisites

- Node.js 18+ (Node.js 20+ recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/toolgenie.git
cd toolgenie

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Production Build

```bash
npm run build
```

This generates `sitemap.xml` and outputs the optimized static bundle into the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## Contact Form & Web3Forms Setup

The contact page uses [Web3Forms](https://web3forms.com) for serverless contact message delivery directly to your inbox.

1. Generate your free access key by entering your email `farhanaly.io3@gmail.com` at [web3forms.com](https://web3forms.com).
2. Set the environment variable in your deployment platform:
   ```env
   VITE_WEB3FORMS_ACCESS_KEY=your-access-key-here
   ```
*(A fallback demo key is already wired for local testing).*

---

## How to Add a New Tool in 3 Steps

Adding new tools to ToolGenie requires zero boilerplate:

### Step 1: Add Tool Definition to `src/data/tools.js`
Add an entry under the appropriate category in `categories`:

```js
{
  name: "New Tool Name",
  slug: "new-tool-name",
  icon: "Wrench", // Any valid Lucide icon name
  shortDescription: "One sentence summary of the tool.",
  longDescription: "Detailed description of client-side mechanics.",
  status: "live", // Mark "live" or "coming-soon"
  faqs: [
    { q: "Is it private?", a: "Yes, it runs 100% in your browser." },
    { q: "What formats are supported?", a: "All modern formats." }
  ]
}
```

### Step 2: Create the Widget Component
Create `/src/components/tools/{category}/NewToolWidget.tsx`:

```tsx
import React, { useState } from 'react';

export const NewToolWidget: React.FC = () => {
  return (
    <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-surface)' }}>
      {/* 100% client-side tool UI and logic */}
    </div>
  );
};
```

### Step 3: Register in `ToolWidgetDispatcher.tsx`
Add the slug to `IMPLEMENTED_TOOL_SLUGS` and the switch case in `src/components/tools/ToolWidgetDispatcher.tsx`:

```tsx
case 'new-tool-name':
  return <NewToolWidget />;
```

Run `npm run build` — your tool will automatically have:
- Category card with live glow
- Dedicated URL at `/{category-slug}/{tool-slug}`
- Full SEO metadata & `FAQPage` schema
- Auto-inclusion in `sitemap.xml`

---

## Cloudflare Pages Deployment

ToolGenie is configured to deploy directly to **Cloudflare Pages**:

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages**.
2. Click **Create Application** > **Pages** > **Connect to Git**.
3. Select your repository and configure build settings:
   - **Framework Preset**: None (or Vite)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: `20` (add environment variable `NODE_VERSION = 20`)
4. Click **Save and Deploy**.

Single Page Application (SPA) routing is handled automatically with `_redirects` / `index.html` fallback.

---

## Architecture & Privacy Guarantee

- **No Remote Processing**: Documents, images, and audio/video files are kept inside isolated browser memory buffers (`ArrayBuffer`, `Blob`).
- **Memory Safety**: Object URLs are revoked upon completion using `URL.revokeObjectURL()` to prevent browser RAM leaks.
- **Cryptography**: Uses standard browser `crypto.subtle` APIs for SHA-1, SHA-256, and SHA-512 with WebAssembly-backed SparkMD5 for legacy verification.
- **Zero Third-Party Tracking**: No telemetry, intrusive trackers, or invasive analytics.

---

## License

Apache-2.0
