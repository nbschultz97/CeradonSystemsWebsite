/**
 * Rewrite the desktop nav in every root page from scripts/lineup.js.
 *
 * The desktop nav used to be hardcoded in all 17 root HTML files while only
 * the mobile drawer and footer read from a shared array. That duplication is
 * why the lineup drifted: four of seven dropdown entries had lost their
 * subtext, the three that still had it were using the accent colour reserved
 * for new products, and KESTREL was labelled "Trainer" on some pages and
 * "Mission Rehearsal" on others. Adding one product meant editing 17 files.
 *
 * Now there is one template. Run before every build (see package.json).
 *
 * The current page is NOT marked up here -- setActiveStates() in src/ui.js
 * stamps aria-current at runtime and .navdrop-item/.navlink style it, so the
 * generated markup is identical on every page.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { PRODUCTS, SECONDARY, hrefFor, footerLinks, FOOTER_LINK_CLASS } from './lineup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const NAV = `<nav class="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <div class="relative group">
            <button class="navlink">Products</button>
            <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-50">
              <div class="navdrop">
${PRODUCTS.map(({ slug, label, note }) =>
  `                <a href="${slug}.html" class="navdrop-item">${label} <span class="navdrop-note">${note}</span></a>`
).join('\n')}
              </div>
            </div>
          </div>
${SECONDARY.map(({ label, href, isCTA }) =>
  `          <a href="${hrefFor(href)}" class="${isCTA ? 'btn btn-primary' : 'navlink'}">${label}</a>`
).join('\n')}
        </nav>`;

// The footer links used to be injected by ui.js into an empty div, so they
// existed only after JS ran -- crawlers saw a footer with no links, and
// careers/privacy/disclaimer had no static inbound link anywhere on the site.
// Emit them into the markup instead; ui.js now only fills an empty container.
const FOOTER_LINKS_HTML = `<div class="footer-links" data-footer-links>
${footerLinks().map(({ label, href }) =>
  `          <a href="${href}" class="${FOOTER_LINK_CLASS}">${label}</a>`
).join('\n')}
        </div>`;

// 404.html carries a deliberately minimal footer -- a copyright line and
// nothing else -- so it has no link container to fill. Anything else missing
// one is a mistake worth warning about.
const NO_FOOTER_LINKS = new Set(['404.html']);

// Every variant of the hardcoded nav shares these boundaries.
const NAV_RE = /<nav class="hidden md:flex[^>]*aria-label="Main navigation">[\s\S]*?<\/nav>/;
const FOOTER_LINKS_RE = /<div class="footer-links" data-footer-links>[\s\S]*?<\/div>/;

let changed = 0;
const skipped = [];
const noFooter = [];

for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
  const path = join(root, file);
  const src = readFileSync(path, 'utf-8');
  let out = src;

  if (NAV_RE.test(out)) out = out.replace(NAV_RE, NAV);
  else skipped.push(file);

  if (FOOTER_LINKS_RE.test(out)) out = out.replace(FOOTER_LINKS_RE, FOOTER_LINKS_HTML);
  else if (!NO_FOOTER_LINKS.has(file)) noFooter.push(file);

  if (out === src) continue;

  writeFileSync(path, out);
  changed++;
}

if (noFooter.length) {
  console.warn(`  !! no footer-links container in: ${noFooter.join(', ')}`);
}

if (skipped.length) {
  console.warn(`  !! no desktop nav matched in: ${skipped.join(', ')} -- left untouched`);
}
console.log(`sync-nav: ${changed} file(s) updated`);
