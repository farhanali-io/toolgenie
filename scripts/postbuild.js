import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const clientDir = path.join(root, 'dist/client');
const distDir = path.join(root, 'dist');

if (fs.existsSync(clientDir)) {
  for (const item of fs.readdirSync(clientDir)) {
    const src = path.join(clientDir, item);
    const dest = path.join(distDir, item);
    if (!fs.existsSync(dest)) {
      fs.cpSync(src, dest, { recursive: true });
    }
  }
}
