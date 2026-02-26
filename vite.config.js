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

export default defineConfig({
  root: rootDir,
  assetsInclude: ['**/*.PNG', '**/*.jpg'],
  build: {
    rollupOptions: {
      input: {
        main: resolve(rootDir, 'index.html'),
        vantage: resolve(rootDir, 'vantage.html'),
        polygen: resolve(rootDir, 'polygen.html'),
        architect: resolve(rootDir, 'architect.html'),
        technology: resolve(rootDir, 'technology.html'),
        company: resolve(rootDir, 'company.html'),
        ip: resolve(rootDir, 'ip.html'),
        careers: resolve(rootDir, 'careers.html'),
        contact: resolve(rootDir, 'contact.html'),
        privacy: resolve(rootDir, 'privacy.html'),
        disclaimer: resolve(rootDir, 'disclaimer.html'),
        raptor: resolve(rootDir, 'raptor.html'),
        scout: resolve(rootDir, 'scout.html'),
        intelligentSystems: resolve(rootDir, 'intelligent-systems.html'),
        notFound: resolve(rootDir, '404.html'),
        blog: resolve(rootDir, 'blog/index.html'),
        ...blogEntries
      }
    }
  }
});
