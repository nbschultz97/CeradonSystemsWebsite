/**
 * Generate blog index - scans blog/*.html for posts and updates blog/index.html
 * Run before build: node scripts/generate-blog-index.js
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const blogDir = resolve(root, 'blog');
const indexPath = resolve(blogDir, 'index.html');

// Scan blog posts
const posts = readdirSync(blogDir)
  .filter(f => f.endsWith('.html') && f !== 'index.html')
  .map(filename => {
    const content = readFileSync(resolve(blogDir, filename), 'utf-8');

    // Extract title from <title> tag (strip " | Ceradon Systems")
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s*\|\s*Ceradon Systems\s*$/, '').trim()
      : filename;

    // Extract description from meta tag
    const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';

    // Parse date from filename (YYYY-MM-DD prefix)
    const dateMatch = filename.match(/^(\d{4})-(\d{2})-(\d{2})/);
    let date = null;
    let dateFormatted = '';
    if (dateMatch) {
      date = new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3]);
      dateFormatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    return { filename, title, description, date, dateFormatted };
  })
  // Sort newest first
  .sort((a, b) => (b.date || 0) - (a.date || 0));

// Build HTML for blog list
const listHtml = posts.map(post => {
  return `            <a href="/blog/${post.filename}" class="blog-card" style="display: block; text-decoration: none;">
              <p class="date">${post.dateFormatted}</p>
              <h3>${post.title}</h3>
              <p>${post.description}</p>
            </a>`;
}).join('\n');

// Read current index and replace blog-list content
let index = readFileSync(indexPath, 'utf-8');

const listRegex = /(<div class="blog-list" id="blog-posts">)\s*[\s\S]*?(\s*<\/div>)/;
const replacement = `$1\n${listHtml}\n          $2`;
index = index.replace(listRegex, replacement);

writeFileSync(indexPath, index, 'utf-8');
console.log(`Blog index updated with ${posts.length} posts:`);
posts.forEach(p => console.log(`  - ${p.dateFormatted}: ${p.title}`));
