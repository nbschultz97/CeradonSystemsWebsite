import emblemLogo from '../assets/Emblem.PNG';

// Constants
const Z_INDEX = {
  OVERLAY: 60,
  PANEL: 70,
  SKIP_LINK: 100
};

const BREAKPOINTS = {
  MOBILE_MENU_HIDE: 768  // md breakpoint in Tailwind
};

const TIMEOUTS = {
  RESIZE_DEBOUNCE: 250,
  FORM_RESET: 3000
};

const NAV_ITEMS = [
  { label: 'Home', href: 'index.html#top' },
  { label: 'Vantage', href: 'vantage.html' },
  { label: 'Polygen AI', href: 'polygen.html' },
  { label: 'Architect Stack', href: 'architect.html' },
  { label: 'Technology', href: 'technology.html' },
  { label: 'Company', href: 'company.html' },
  { label: 'Insights', href: '/blog/' },
  { label: 'Contact', href: 'contact.html', isCTA: true }
];

const FOOTER_LINKS = [
  { label: 'Home', href: 'index.html' },
  { label: 'Vantage', href: 'vantage.html' },
  { label: 'Polygen AI', href: 'polygen.html' },
  { label: 'Architect Stack', href: 'architect.html' },
  { label: 'Technology', href: 'technology.html' },
  { label: 'Company', href: 'company.html' },
  { label: 'Insights', href: '/blog/' },
  { label: 'Contact', href: 'contact.html' },
  { label: 'Privacy', href: 'privacy.html' },
  { label: 'Disclaimer', href: 'disclaimer.html' }
];

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea',
  'input',
  'select',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

function normalisePath(pathname) {
  if (!pathname) return '/';
  const parts = pathname.split('?')[0].replace(/\/+/g, '/');
  if (parts === '/') return '/';
  if (parts.endsWith('/index.html')) {
    const trimmed = parts.slice(0, -'index.html'.length);
    return trimmed || '/';
  }
  return parts;
}

function setActiveStates() {
  const current = `${normalisePath(window.location.pathname)}${window.location.hash || ''}`;
  const links = document.querySelectorAll('a[href]');
  links.forEach((link) => {
    const rawHref = link.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
      if (link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
      return;
    }
    try {
      const url = new URL(rawHref, window.location.href);
      if (url.origin !== window.location.origin) {
        if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
        return;
      }
      const linkPath = normalisePath(url.pathname);
      const linkTarget = `${linkPath}${url.hash || ''}`;
      if (linkTarget === current) {
        link.setAttribute('aria-current', 'page');
      } else if (link.hasAttribute('aria-current')) {
        link.removeAttribute('aria-current');
      }
    } catch (err) {
      // ignore malformed links
    }
  });
}

function buildMobileNav(header) {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.dataset.menuOverlay = '';
  overlay.style.zIndex = String(Z_INDEX.OVERLAY);

  const panel = document.createElement('nav');
  panel.className = 'mobile-menu-panel';
  panel.setAttribute('aria-hidden', 'true');
  panel.dataset.menuPanel = '';
  panel.style.zIndex = String(Z_INDEX.PANEL);
  panel.innerHTML = `
    <div class="mobile-menu-hero">
      <div class="mobile-menu-hero__image">
        <img class="logo-glow" src="${emblemLogo}" alt="Ceradon Systems logo" />
      </div>
      <button class="text-2xl icon-button" aria-label="Close menu" data-close-menu>&times;</button>
    </div>
    <div class="flex-1 overflow-y-auto px-6 py-6">
      <div class="flex flex-col gap-4" data-mobile-nav></div>
    </div>
    <div class="px-6 py-6 border-t border-[color:var(--steel-700)] text-sm text-subtle">
      <p>© <span data-year></span> Ceradon Systems</p>
    </div>
  `;

  const navContainer = panel.querySelector('[data-mobile-nav]');
  NAV_ITEMS.forEach((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    link.className = item.isCTA
      ? 'btn btn-primary justify-center'
      : 'navlink text-lg';
    navContainer.appendChild(link);
  });

  document.body.appendChild(overlay);
  document.body.appendChild(panel);
  return { overlay, panel };
}

function trapFocus(container, event) {
  if (event.key !== 'Tab') return;
  const focusable = container.querySelectorAll(focusableSelector);
  if (!focusable.length) {
    event.preventDefault();
    container.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else if (document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initMobileMenu(header) {
  const openButton = header.querySelector('[data-open-menu]');
  if (!openButton) return;
  openButton.setAttribute('aria-expanded', 'false');

  const { overlay, panel } = buildMobileNav(header);
  const closeButton = panel.querySelector('[data-close-menu]');
  const yearTarget = panel.querySelector('[data-year]');
  if (yearTarget) yearTarget.textContent = new Date().getFullYear();

  function closeMenu(focusTarget = openButton) {
    panel.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('overflow-hidden');
    openButton.setAttribute('aria-expanded', 'false');
    panel.removeAttribute('aria-modal');
    panel.removeEventListener('keydown', handleKeydown);
    if (focusTarget) {
      focusTarget.focus({ preventScroll: true });
    }
  }

  function openMenu() {
    panel.classList.add('is-open');
    overlay.classList.add('is-visible');
    overlay.setAttribute('aria-hidden', 'false');
    panel.setAttribute('aria-hidden', 'false');
    panel.setAttribute('aria-modal', 'true');
    document.body.classList.add('overflow-hidden');
    openButton.setAttribute('aria-expanded', 'true');
    const focusable = panel.querySelectorAll(focusableSelector);
    const initial = focusable[0];
    if (initial) {
      initial.focus({ preventScroll: true });
    }
    panel.addEventListener('keydown', handleKeydown);
  }

  function handleKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }
    trapFocus(panel, event);
  }

  overlay.addEventListener('click', () => closeMenu());
  closeButton?.addEventListener('click', () => closeMenu());
  panel.querySelectorAll('a').forEach((anchor) => {
    anchor.addEventListener('click', () => closeMenu(null));
  });

  openButton.addEventListener('click', () => {
    const expanded = openButton.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu on resize to desktop size
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth >= BREAKPOINTS.MOBILE_MENU_HIDE && panel.classList.contains('is-open')) {
        closeMenu(null);
      }
    }, TIMEOUTS.RESIZE_DEBOUNCE);
  });
}

function updateFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = year;
  });
}

function populateFooterLinks() {
  const footerNav = document.querySelector('[data-footer-links]');
  if (!footerNav) {
    console.warn('Footer navigation container not found');
    return;
  }
  if (footerNav.childElementCount) return;

  try {
    FOOTER_LINKS.forEach((link) => {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.label;
      anchor.className = 'hover:text-[color:var(--white)] focus-visible:text-[color:var(--white)]';
      footerNav.appendChild(anchor);
    });
  } catch (error) {
    console.error('Failed to populate footer links:', error);
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('[data-form-status]');
  const submitBtn = form.querySelector('button[type="submit"]');
  const name = form.querySelector('[name="name"]').value.trim();
  const company = form.querySelector('[name="company"]').value.trim();
  const email = form.querySelector('[name="email"]').value.trim();
  const message = form.querySelector('[name="message"]').value.trim();

  if (!name || !email || !message) {
    if (status) {
      status.textContent = 'Name, email, and message are required.';
      status.className = 'text-red-400 text-sm mt-3';
    }
    return;
  }

  // Set loading state
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';
  submitBtn.classList.add('opacity-60', 'cursor-not-allowed');

  const composed = [
    `Name: ${name}`,
    company ? `Company: ${company}` : null,
    `Email: ${email}`,
    '',
    message
  ]
    .filter(Boolean)
    .join('\n');

  let copied = false;
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(composed);
      copied = true;
    } catch (error) {
      copied = false;
    }
  }

  const mailto = new URL('mailto:info@ceradonsystems.com');
  mailto.searchParams.set('subject', 'Ceradon Inquiry');
  mailto.searchParams.set('body', composed);
  window.location.href = mailto.toString();

  if (status) {
    status.textContent = copied
      ? 'Message copied to clipboard. Your mail client should open momentarily.'
      : 'Opening mail client. Copy the message manually if needed.';
    status.className = 'text-sm mt-3 text-[color:var(--ceradon-blue)]';
  }

  // Reset button after a delay
  setTimeout(() => {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
  }, TIMEOUTS.FORM_RESET);

  form.reset();
}

function initContactForm() {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;
  form.addEventListener('submit', handleContactSubmit);
}

export function initUI() {
  const header = document.querySelector('header');
  if (header) {
    initMobileMenu(header);
  }
  populateFooterLinks();
  updateFooterYear();
  setActiveStates();
  initContactForm();
}

export function refreshActiveStates() {
  setActiveStates();
}
