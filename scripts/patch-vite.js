import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const filesToPatch = [
  path.join(root, 'node_modules/vite/dist/client/bundledDevClient.mjs'),
  path.join(root, 'node_modules/vite/dist/client/client.mjs'),
  path.join(root, 'node_modules/vite/dist/node/module-runner.js')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf-8');

  // Fix unconditioned ws.send
  content = content.replaceAll(
    'ws.send(JSON.stringify(data));',
    'if (ws && typeof ws.send === "function" && ws.readyState === 1) { ws.send(JSON.stringify(data)); }'
  );

  // Fix unconditioned transport.send in client
  content = content.replaceAll(
    'this.transport.send(payload).catch((err) => {',
    'this.transport?.send?.(payload)?.catch?.((err) => {'
  );

  content = content.replaceAll(
    'wsTransport.send(data);',
    'wsTransport?.send?.(data);'
  );

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Successfully patched ${path.relative(root, filePath)}`);
}
