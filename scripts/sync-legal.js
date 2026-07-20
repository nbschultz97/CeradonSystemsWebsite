/**
 * Single source of truth for the SAM.gov registration expiry.
 *
 * The date was hardcoded into the footer of 31 pages plus four one-off spots,
 * with contact.html wording it differently again ("Registered through December
 * 2026"). Nothing anywhere checked it, so on the expiry date the whole site
 * would quietly begin asserting a registration that had lapsed -- to exactly
 * the government buyers most likely to care.
 *
 * Update SAM_EXPIRY below and rebuild. The build FAILS once the date has
 * passed and warns as it approaches, so this cannot go false in silence.
 */
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- the one place to change it -------------------------------------------
const SAM_EXPIRY = '2026-12-05';
// ---------------------------------------------------------------------------

const WARN_DAYS = 60;

const expiry = new Date(`${SAM_EXPIRY}T00:00:00Z`);
if (Number.isNaN(expiry.getTime())) {
  console.error(`sync-legal: SAM_EXPIRY is not a valid date: ${SAM_EXPIRY}`);
  process.exit(1);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pretty = `${MONTHS[expiry.getUTCMonth()]} ${expiry.getUTCDate()}, ${expiry.getUTCFullYear()}`;

const today = new Date();
const daysLeft = Math.floor((expiry - today) / 86400000);

if (daysLeft < 0) {
  console.error(
    `sync-legal: SAM.gov registration expired ${pretty} (${-daysLeft} days ago).\n` +
    `  The site claims an active registration on every page. Renew in SAM.gov,\n` +
    `  then update SAM_EXPIRY in scripts/sync-legal.js.`
  );
  process.exit(1);
}

function htmlFiles() {
  const files = readdirSync(root).filter((f) => f.endsWith('.html')).map((f) => join(root, f));
  const blogDir = join(root, 'blog');
  files.push(...readdirSync(blogDir).filter((f) => f.endsWith('.html')).map((f) => join(blogDir, f)));
  return files;
}

// Rewrite each phrasing in place, preserving the surrounding casing/markup.
const RULES = [
  // "... Active in SAM.gov through Dec 5, 2026." (footers, and one lowercase)
  [/(\bactive in SAM\.gov through )[^.<]+/gi, (_, p) => `${p}${pretty}`],
  // "<dd>Active through Dec 5, 2026</dd>" and contact.html's "Registered through December 2026"
  [/(<dd[^>]*>)\s*(?:Active|Registered) through [^<]+/g, (_, p) => `${p}Active through ${pretty}`],
];

let changed = 0;
let hits = 0;
for (const file of htmlFiles()) {
  const src = readFileSync(file, 'utf-8');
  let out = src;
  for (const [re, fn] of RULES) {
    out = out.replace(re, (...args) => {
      hits++;
      return fn(...args);
    });
  }
  if (out === src) continue;
  writeFileSync(file, out);
  changed++;
}

console.log(`sync-legal: SAM.gov expiry ${pretty} applied (${hits} references, ${changed} file(s) rewritten)`);
if (daysLeft <= WARN_DAYS) {
  console.warn(`sync-legal: WARNING -- SAM.gov registration expires in ${daysLeft} days.`);
}
