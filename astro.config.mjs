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
  trailingSlash: 'always',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  integrations: [
    react(),
    sitemap(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'vite-client-send-guard',
        apply: 'serve',
        transform(code, id) {
          if (id.includes('/@vite/client') || id.includes('vite/dist/client/client.mjs') || id.includes('vite/dist/client/bundledDevClient.mjs')) {
            return code.replaceAll(
              'wsTransport.send(data);',
              'wsTransport?.send?.(data);'
            );
          }
          return null;
        }
      }
    ],
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
