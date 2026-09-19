import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { categories } from '../src/data/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOMAIN = 'https://toolgenie.online';

function generate() {
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/privacy-policy', priority: '0.5', changefreq: 'monthly' },
    { url: '/terms', priority: '0.5', changefreq: 'monthly' },
  ];

  const entries = [...staticPages];

  for (const cat of categories) {
    entries.push({
      url: `/${cat.slug}`,
      priority: '0.9',
      changefreq: 'weekly',
    });

    for (const tool of cat.tools) {
      entries.push({
        url: `/${cat.slug}/${tool.slug}`,
        priority: tool.status === 'live' ? '0.8' : '0.6',
        changefreq: tool.status === 'live' ? 'weekly' : 'monthly',
      });
    }
  }

  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${DOMAIN}${e.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml.trim());
  console.log(`Generated sitemap.xml with ${entries.length} URLs.`);

  const robotsTxt = `# ToolGenie Robots.txt
# All search engine bots are welcome to index all public client-side tools

User-agent: *
Allow: /

Sitemap: ${DOMAIN}/sitemap.xml
`;

  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsTxt);
  console.log('Generated robots.txt.');
}

generate();
