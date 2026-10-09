import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://toolgenie.online',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  integrations: [
    react(),
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'vite-client-send-guard',
        apply: 'serve',
        transform(code, id) {
          if (id.includes('/@vite/client') || id.includes('vite/dist/client/client.mjs') || id.includes('vite/dist/client/bundledDevClient.mjs')) {
            let res = code;
            res = res.replaceAll(
              'ws.send(JSON.stringify(data));',
              'if (ws && ws.readyState === 1) { try { ws.send(JSON.stringify(data)); } catch {} }'
            );
            res = res.replaceAll(
              'wsTransport.send(data);',
              'try { wsTransport?.send?.(data); } catch {}'
            );
            res = res.replaceAll(
              'wsTransport?.send?.(data);',
              'try { wsTransport?.send?.(data); } catch {}'
            );
            res = res.replaceAll(
              'this.transport.send(payload).catch((err) => {',
              'try { const _p = this.transport?.send?.(payload); if (_p && typeof _p.catch === "function") _p.catch(() => {}); } catch {} // '
            );
            return res;
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
