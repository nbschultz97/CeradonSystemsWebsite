/**
 * Click tracking on top of the existing GA4 tag.
 *
 * Pageviews were already being recorded; what was missing was *intent* — you
 * could see that someone loaded the shop, but not whether anyone ever reached
 * for checkout or tried to contact us. These events answer that.
 *
 * One delegated listener on document, so it covers every page including any
 * added later, and links rendered after load.
 *
 * gtag is loaded inline in each page's <head>. If it is ever absent (an ad
 * blocker, a page missing the tag) every call here degrades to a no-op — this
 * file must never break navigation.
 */

const STRIPE_HOST = 'buy.stripe.com';

function track(name, params) {
  try {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params);
  } catch {
    /* analytics must never interfere with the click itself */
  }
}

/** Nearest enclosing product card/article, for naming what was clicked. */
function productContext(el) {
  const article = el.closest('article, [data-product]');
  if (!article) return document.title;
  const heading = article.querySelector('h1, h2, h3');
  return (heading && heading.textContent.trim()) || document.title;
}

function onClick(event) {
  const link = event.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href') || '';
  if (!href || href.startsWith('#')) return;

  // Checkout intent — someone clicked through to Stripe.
  if (href.includes(STRIPE_HOST)) {
    track('begin_checkout', {
      item_name: productContext(link),
      link_url: href,
      page_path: window.location.pathname
    });
    return;
  }

  // Contact intent — orders@ / contact@ mailto links.
  if (href.startsWith('mailto:')) {
    track('contact_click', {
      address: href.slice(7).split('?')[0],
      item_name: productContext(link),
      page_path: window.location.pathname
    });
    return;
  }

  // Anything leaving the site.
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) {
      track('outbound_click', {
        link_domain: url.hostname,
        link_url: url.href,
        page_path: window.location.pathname
      });
    }
  } catch {
    /* malformed href — nothing to report */
  }
}

export function initAnalytics() {
  // Capture phase: still fires when a handler downstream stops propagation.
  document.addEventListener('click', onClick, true);
}
