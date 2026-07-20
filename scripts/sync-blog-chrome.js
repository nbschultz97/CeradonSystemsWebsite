/**
 * Rewrite the nav and footer in every blog page to match the root pages.
 *
 * Blog posts were generated with their chrome inlined rather than shared, so
 * each one froze whatever the site looked like on the day it was written. The
 * navs drifted into two stale variants -- both still linking the retired
 * SCOUT/AEGIS/FedResume, one linking an ai-services.html that never existed,
 * and neither listing LANTERN or KESTREL. The footers drifted into three
 * different company taglines, and eight pages lost the links and legal block
 * altogether. Run this whenever the lineup or the legal boilerplate changes.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const blogDir = resolve(__dirname, '..', 'blog');

const ITEM = 'class="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/[0.04]"';
const NOTE = 'class="text-xs text-white/30"';

const PRODUCTS = [
  ['vantage', 'VANTAGE', 'Through-Wall'],
  ['raptor', 'RAPTOR', 'Edge AI Vision'],
  ['architect', 'ARCHITECT', 'UxS Planning'],
  ['lantern', 'LANTERN', 'Video to floorplan'],
  ['kestrel', 'KESTREL', 'Mission Rehearsal'],
  ['polygen', 'POLYGEN', 'Text to 3D']
];

const NAV = `<nav class="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <div class="relative group">
            <button class="navlink">Products</button>
            <div class="absolute left-0 top-full hidden group-hover:block pt-2 z-50">
              <div class="bg-[#080c16] border border-white/[0.06] rounded-lg py-2 min-w-[220px] shadow-2xl">
${PRODUCTS.map(([slug, name, note]) =>
  `                <a href="../${slug}.html" ${ITEM}>${name} <span ${NOTE}>${note}</span></a>`
).join('\n')}
              </div>
            </div>
          </div>
          <a href="../intelligent-systems.html" class="navlink">Intelligent Systems</a>
          <a href="../technology.html" class="navlink">Technology</a>
          <a href="../company.html" class="navlink">Company</a>
          <a href="/blog/" class="navlink" aria-current="page">Insights</a>
          <a href="../contact.html" class="btn btn-primary">Contact</a>
        </nav>`;

const FOOTER = `<footer class="border-t border-white/[0.06]">
      <div class="mx-auto max-w-7xl px-4 py-14 space-y-10">
        <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div class="flex items-center gap-4">
            <img src="../assets/Emblem.webp" alt="Ceradon Systems" class="h-10 w-10 image-surface" loading="lazy" width="558" height="558" />
            <div>
              <p class="font-semibold text-white text-sm">Ceradon Systems</p>
              <p class="text-xs text-white/30">Sensing, mapping, and mission systems. Veteran-founded SDVOSB.</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-4 items-center text-sm text-white/40">
            <a href="mailto:contact@ceradonsystems.com">contact@ceradonsystems.com</a>
          </div>
        </div>
        <div class="footer-links" data-footer-links></div>
        <div class="gradient-divider"></div>
        <div class="space-y-1.5 text-xs text-white/25">
          <p>Ceradon Systems, LLC (Utah) &middot; CAGE 179U9 &middot; UEI UZA9PFJ9RDL6 &middot; Active in SAM.gov through Dec 5, 2026.</p>
          <p>Socio-economic status: SDVOSB &middot; VOSB &middot; NAICS: 541715, 541330 &middot; PSC: K058, AJ11.</p>
          <p>Not affiliated with or endorsed by the U.S. Government or Department of Defense.</p>
          <p>&copy; <span data-year></span> Ceradon Systems. All rights reserved.</p>
        </div>
      </div>
    </footer>`;

// Each stale variant shares these boundaries, so one pattern covers them all.
const NAV_RE = /<nav class="hidden md:flex[^>]*aria-label="Main navigation">[\s\S]*?<\/nav>/;
const FOOTER_RE = /<footer[^>]*>[\s\S]*?<\/footer>/;

let changed = 0;
for (const file of readdirSync(blogDir).filter((f) => f.endsWith('.html'))) {
  const path = join(blogDir, file);
  const src = readFileSync(path, 'utf-8');
  let out = src;
  const done = [];

  for (const [name, re, replacement] of [
    ['nav', NAV_RE, NAV],
    ['footer', FOOTER_RE, FOOTER]
  ]) {
    if (!re.test(out)) {
      console.warn(`  !! no ${name} matched in ${file} -- left untouched`);
      continue;
    }
    const next = out.replace(re, replacement);
    if (next !== out) done.push(name);
    out = next;
  }

  if (out === src) continue;
  writeFileSync(path, out);
  console.log(`  ${file}: rewrote ${done.join(' + ')}`);
  changed++;
}
console.log(`sync-blog-chrome: ${changed} file(s) updated`);
