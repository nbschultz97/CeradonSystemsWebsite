/**
 * Generate public/sitemap.xml from the actual pages in the repo.
 * Run before build: node scripts/generate-sitemap.js
 *
 * public/ is what Vite copies into dist/, so the generated file is the one
 * that actually deploys. Blog post lastmod comes from the YYYY-MM-DD filename
 * prefix; static pages use the last git commit date when available.
 */
import { readdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const ORIGIN = 'https://www.ceradonsystems.com';

const PRIORITIES = {
  'index.html': { priority: '1.0', changefreq: 'weekly' },
  'vantage.html': { priority: '0.9', changefreq: 'monthly' },
  'raptor.html': { priority: '0.8', changefreq: 'monthly' },
  'intelligent-systems.html': { priority: '0.8', changefreq: 'monthly' },
  'architect.html': { priority: '0.7', changefreq: 'monthly' },
  'lantern.html': { priority: '0.9', changefreq: 'monthly' },
  'kestrel.html': { priority: '0.8', changefreq: 'monthly' },
  'polygen.html': { priority: '0.7', changefreq: 'monthly' },
  'technology.html': { priority: '0.7', changefreq: 'monthly' },
  'company.html': { priority: '0.6', changefreq: 'monthly' },
  'careers.html': { priority: '0.5', changefreq: 'monthly' },
  'contact.html': { priority: '0.6', changefreq: 'monthly' },
  'ip.html': { priority: '0.4', changefreq: 'yearly' },
  'privacy.html': { priority: '0.2', changefreq: 'yearly' },
  'disclaimer.html': { priority: '0.2', changefreq: 'yearly' }
};

const EXCLUDED = new Set(['404.html']);

function gitLastMod(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${relPath}"`, {
      cwd: root,
      encoding: 'utf-8'
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

function entry(loc, { lastmod, changefreq, priority } = {}) {
  const lines = [`    <loc>${loc}</loc>`];
  if (lastmod) lines.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) lines.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) lines.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${lines.join('\n')}\n  </url>`;
}

const entries = [];

// Root pages
const rootPages = readdirSync(root).filter(
  (f) => f.endsWith('.html') && !EXCLUDED.has(f)
);
for (const page of rootPages) {
  const meta = PRIORITIES[page] || { priority: '0.5', changefreq: 'monthly' };
  const loc = page === 'index.html' ? `${ORIGIN}/` : `${ORIGIN}/${page}`;
  entries.push(entry(loc, { lastmod: gitLastMod(page), ...meta }));
}

// Blog index + posts
const blogDir = resolve(root, 'blog');
const posts = readdirSync(blogDir).filter(
  (f) => f.endsWith('.html') && f !== 'index.html'
);
const postDates = posts
  .map((f) => (f.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1])
  .filter(Boolean)
  .sort();
entries.push(
  entry(`${ORIGIN}/blog/`, {
    lastmod: postDates[postDates.length - 1],
    changefreq: 'weekly',
    priority: '0.7'
  })
);
for (const post of posts) {
  const date = (post.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1];
  entries.push(
    entry(`${ORIGIN}/blog/${post}`, {
      lastmod: date,
      changefreq: 'yearly',
      priority: '0.5'
    })
  );
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

writeFileSync(resolve(root, 'public/sitemap.xml'), xml, 'utf-8');
console.log(`Sitemap generated with ${entries.length} URLs -> public/sitemap.xml`);