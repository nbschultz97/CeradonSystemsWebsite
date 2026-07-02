import { resolve } from 'path';
import { defineConfig } from 'vite';
import { readdirSync } from 'fs';

const rootDir = process.cwd();

// Collect all blog post HTML files dynamically
const blogDir = resolve(rootDir, 'blog');
const blogEntries = {};
try {
  readdirSync(blogDir)
    .filter(f => f.endsWith('.html') && f !== 'index.html')
    .forEach((f, i) => {
      blogEntries[`blog-post-${i}`] = resolve(blogDir, f);
    });
} catch { /* no blog posts yet */ }

// Collect every top-level page dynamically so new pages can never be
// silently dropped from the build (aegis/fedresume were missing before).
const pageEntries = {};
readdirSync(rootDir)
  .filter((f) => f.endsWith('.html'))
  .forEach((f) => {
    pageEntries[f.replace(/\.html$/, '')] = resolve(rootDir, f);
  });

export default defineConfig({
  root: rootDir,
  assetsInclude: ['**/*.PNG', '**/*.jpg'],
  build: {
    rollupOptions: {
      input: {
        ...pageEntries,
        blog: resolve(rootDir, 'blog/index.html'),
        ...blogEntries
      }
    }
  }
});
