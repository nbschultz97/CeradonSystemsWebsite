/**
 * Copy social-preview images into dist/ under their ORIGINAL, unhashed names.
 *
 * og:image and twitter:image must be absolute URLs -- crawlers do not resolve
 * relative paths -- so they are hardcoded as
 * https://www.ceradonsystems.com/assets/<name>. Vite cannot rewrite an absolute
 * URL, but it does content-hash everything in assets/, so those URLs shipped
 * pointing at filenames that no longer existed. Every link shared to LinkedIn,
 * X, Slack or iMessage rendered with no preview image.
 *
 * Rather than hand-maintain a list, scan the HTML for the absolute URLs that
 * are actually referenced and place exactly those files. Runs after vite build.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const srcAssets = join(root, 'assets');
const distAssets = join(root, 'dist', 'assets');

const URL_RE = /https:\/\/(?:www\.)?ceradonsystems\.com\/assets\/([A-Za-z0-9._-]+)/g;

function htmlFiles() {
  const files = readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => join(root, f));
  const blogDir = join(root, 'blog');
  if (existsSync(blogDir)) {
    files.push(...readdirSync(blogDir).filter((f) => f.endsWith('.html')).map((f) => join(blogDir, f)));
  }
  return files;
}

const referenced = new Set();
for (const file of htmlFiles()) {
  const src = readFileSync(file, 'utf-8');
  for (const [, name] of src.matchAll(URL_RE)) referenced.add(name);
}

mkdirSync(distAssets, { recursive: true });

const missing = [];
let copied = 0;
for (const name of [...referenced].sort()) {
  const from = join(srcAssets, name);
  if (!existsSync(from)) {
    missing.push(name);
    continue;
  }
  copyFileSync(from, join(distAssets, name));
  copied++;
}

// A social image that 404s is invisible until someone shares a link and gets a
// blank card, so fail the build rather than let it ship silently.
if (missing.length) {
  console.error(`copy-social-assets: referenced but not found in assets/:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

console.log(`copy-social-assets: placed ${copied} unhashed social image(s)`);
