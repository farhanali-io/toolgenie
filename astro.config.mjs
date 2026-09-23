import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://toolgenie.online',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      forwardConsole: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'onnxruntime-web/webgpu': 'onnxruntime-web',
      },
    },
  },
});
