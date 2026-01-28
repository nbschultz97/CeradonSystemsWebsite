import { resolve } from 'path';
import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'fs';

const rootDir = process.cwd();

// Dynamically find all blog posts
const blogDir = resolve(rootDir, 'blog');
const blogEntries = {};

if (existsSync(blogDir)) {
  const blogFiles = readdirSync(blogDir).filter(f => f.endsWith('.html'));
  blogFiles.forEach(file => {
    const name = file === 'index.html' ? 'blog' : `blog-${file.replace('.html', '')}`;
    blogEntries[name] = resolve(blogDir, file);
  });
}

export default defineConfig({
  root: rootDir,
  assetsInclude: ['**/*.PNG'],
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
        ...blogEntries
      }
    }
  }
});
