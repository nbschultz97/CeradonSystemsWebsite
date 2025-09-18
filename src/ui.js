const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Vantage', href: '/vantage.html' },
  { label: 'Technology', href: '/technology.html' },
  { label: 'Company', href: '/company.html' },
  { label: 'Careers', href: '/careers.html' },
  { label: 'Contact', href: '/contact.html', isCTA: true }
];

const FOOTER_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Vantage', href: '/vantage.html' },
  { label: 'Technology', href: '/technology.html' },
  { label: 'Company', href: '/company.html' },
  { label: 'IP & Compliance', href: '/ip.html' },
  { label: 'Careers', href: '/careers.html' },
  { label: 'Contact', href: '/contact.html' },
  { label: 'Privacy', href: '/privacy.html' }
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
  if (pathname === '/') return '/';
  const parts = pathname.split('?')[0];
  if (parts === '/index.html') return '/';
  return parts.replace(/\/+/g, '/');
}

function setActiveStates() {
  const current = normalisePath(window.location.pathname);
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
      const url = new URL(rawHref, window.location.origin);
      if (url.origin !== window.location.origin) {
        if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
        return;
      }
      const linkPath = normalisePath(url.pathname);
      if (linkPath === current) {
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
  overlay.className = 'fixed inset-0 bg-black/70 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-200 md:hidden';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.dataset.menuOverlay = '';
  overlay.style.zIndex = '60';

  const panel = document.createElement('nav');
  panel.className = 'fixed top-0 right-0 bottom-0 w-80 max-w-[90%] bg-[color:var(--steel-900)] border-l border-[color:var(--steel-700)] shadow-2xl translate-x-full transition-transform duration-200 md:hidden flex flex-col';
  panel.setAttribute('aria-hidden', 'true');
  panel.dataset.menuPanel = '';
  panel.style.zIndex = '70';
  panel.innerHTML = `
    <div class="px-6 py-5 flex items-center justify-between border-b border-[color:var(--steel-700)]">
      <img class="h-10" src="/assets/Square_Logo.PNG" alt="Ceradon Systems mark" />
      <button class="text-2xl" aria-label="Close menu" data-close-menu>&times;</button>
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
    panel.classList.add('translate-x-full');
    overlay.classList.add('opacity-0');
    overlay.classList.add('pointer-events-none');
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
    panel.classList.remove('translate-x-full');
    overlay.classList.remove('opacity-0');
    overlay.classList.remove('pointer-events-none');
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
}

function updateFooterYear() {
  const year = new Date().getFullYear();
  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = year;
  });
}

function populateFooterLinks() {
  const footerNav = document.querySelector('[data-footer-links]');
  if (!footerNav) return;
  if (footerNav.childElementCount) return;
  FOOTER_LINKS.forEach((link) => {
    const anchor = document.createElement('a');
    anchor.href = link.href;
    anchor.textContent = link.label;
    anchor.className = 'hover:text-[color:var(--white)] focus-visible:text-[color:var(--white)]';
    footerNav.appendChild(anchor);
  });
}

async function handleContactSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('[data-form-status]');
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

  const mailto = new URL('mailto:contact@ceradonsystems.com');
  mailto.searchParams.set('subject', 'Ceradon Inquiry');
  mailto.searchParams.set('body', composed);
  window.location.href = mailto.toString();

  if (status) {
    status.textContent = copied
      ? 'Message copied to clipboard. Your mail client should open momentarily.'
      : 'Opening mail client. Copy the message manually if needed.';
    status.className = 'text-sm mt-3 text-[color:var(--ceradon-blue)]';
  }
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

