/**
 * The single source of truth for the site's navigation lineup.
 *
 * Every nav on the site is generated from this file:
 *   - scripts/sync-nav.js         desktop nav in every root page
 *   - scripts/sync-blog-chrome.js desktop nav + footer in every blog page
 *   - src/ui.js                   mobile nav drawer + footer links
 *
 * Adding or retiring a product is a one-line edit here followed by
 * `npm run build`. Do not hand-edit a <nav> in an HTML file: the sync
 * scripts run before every build and will overwrite it.
 *
 * Plain ESM with no Node APIs, so the browser bundle can import it too.
 */

// Order is the order the homepage introduces them.
export const PRODUCTS = [
  { slug: 'vantage', label: 'VANTAGE', note: 'Through-Wall' },
  { slug: 'raptor', label: 'RAPTOR', note: 'Edge AI Vision' },
  { slug: 'architect', label: 'ARCHITECT', note: 'UxS Planning' },
  { slug: 'lantern', label: 'LANTERN', note: 'Video to floorplan' },
  { slug: 'kestrel', label: 'KESTREL', note: 'Mission Rehearsal' },
  { slug: 'scout', label: 'SCOUT', note: 'Contract intel' }
];

// Top-level links to the right of the Products dropdown.
export const SECONDARY = [
  { label: 'Intelligent Systems', href: 'intelligent-systems.html', group: 'Services' },
  { label: 'Technology', href: 'technology.html' },
  { label: 'Company', href: 'company.html' },
  { label: 'Insights', href: '/blog/' },
  { label: 'Gear', href: 'shop.html' },
  { label: 'Contact', href: 'contact.html', isCTA: true }
];

// Footer tail, appended after the products and the non-CTA secondary links.
// Contact appears here too because the footer lists it inline rather than as
// the button treatment the header gives it.
export const FOOTER_EXTRA = [
  { label: 'Careers', href: 'careers.html' },
  { label: 'Contact', href: 'contact.html' },
  { label: 'Privacy', href: 'privacy.html' },
  { label: 'Disclaimer', href: 'disclaimer.html' }
];

/**
 * Resolve an href for a given page depth. Root pages link plainly
 * ("vantage.html"), blog pages need "../vantage.html", and the mobile nav in
 * the browser bundle uses absolute paths ("/vantage.html"). Absolute hrefs
 * such as "/blog/" are already correct and pass through untouched.
 */
export function hrefFor(href, prefix = '') {
  if (href.startsWith('/') || href.startsWith('http')) return href;
  return `${prefix}${href}`;
}
