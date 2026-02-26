import emblemLogo from '../assets/Emblem.webp';

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
  { label: 'Vantage', href: 'vantage.html', group: 'Products' },
  { label: 'RAPTOR', href: 'raptor.html', group: 'Products' },
  { label: 'Ceradon Scout', href: 'scout.html', group: 'Products' },
  { label: 'Architect Stack', href: 'architect.html', group: 'Products' },
  { label: 'PolyGen AI', href: 'polygen.html', group: 'Products' },
  { label: 'Intelligent Systems', href: 'intelligent-systems.html', group: 'Services' },
  { label: 'Technology', href: 'technology.html' },
  { label: 'Company', href: 'company.html' },
  { label: 'Insights', href: '/blog/' },
  { label: 'Contact', href: 'contact.html', isCTA: true }
];

const FOOTER_LINKS = [
  { label: 'Vantage', href: 'vantage.html' },
  { label: 'RAPTOR', href: 'raptor.html' },
  { label: 'Ceradon Scout', href: 'scout.html' },
  { label: 'Architect Stack', href: 'architect.html' },
  { label: 'PolyGen AI', href: 'polygen.html' },
  { label: 'Intelligent Systems', href: 'intelligent-systems.html' },
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

  // Group items by their group property
  const groups = new Map();
  const topLevel = [];
  NAV_ITEMS.forEach((item) => {
    if (item.group) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group).push(item);
    } else {
      topLevel.push(item);
    }
  });

  // Build grouped sections first, then top-level items
  const orderedSections = [];
  const seenGroups = new Set();
  NAV_ITEMS.forEach((item) => {
    if (item.group && !seenGroups.has(item.group)) {
      seenGroups.add(item.group);
      orderedSections.push({ type: 'group', name: item.group, items: groups.get(item.group) });
    } else if (!item.group) {
      orderedSections.push({ type: 'item', item });
    }
  });

  orderedSections.forEach((section) => {
    if (section.type === 'group') {
      const groupEl = document.createElement('div');
      groupEl.className = 'mobile-nav-group';

      const toggle = document.createElement('button');
      toggle.className = 'navlink text-lg w-full flex items-center justify-between';
      toggle.innerHTML = `<span>${section.name}</span><svg class="mobile-nav-chevron h-4 w-4 transition-transform" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/></svg>`;
      toggle.setAttribute('aria-expanded', 'false');

      const submenu = document.createElement('div');
      submenu.className = 'mobile-nav-submenu pl-4 flex flex-col gap-2 overflow-hidden';
      submenu.style.maxHeight = '0';
      submenu.style.opacity = '0';
      submenu.style.transition = 'max-height 0.25s ease, opacity 0.2s ease';

      section.items.forEach((item) => {
        const link = document.createElement('a');
        link.href = item.href;
        link.textContent = item.label;
        link.className = 'navlink text-base text-subtle hover:text-white';
        submenu.appendChild(link);
      });

      toggle.addEventListener('click', () => {
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', String(!expanded));
        const chevron = toggle.querySelector('.mobile-nav-chevron');
        if (expanded) {
          submenu.style.maxHeight = '0';
          submenu.style.opacity = '0';
          chevron.style.transform = 'rotate(0deg)';
        } else {
          submenu.style.maxHeight = submenu.scrollHeight + 'px';
          submenu.style.opacity = '1';
          chevron.style.transform = 'rotate(180deg)';
        }
      });

      groupEl.appendChild(toggle);
      groupEl.appendChild(submenu);
      navContainer.appendChild(groupEl);
    } else {
      const item = section.item;
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      link.className = item.isCTA
        ? 'btn btn-primary justify-center'
        : 'navlink text-lg';
      navContainer.appendChild(link);
    }
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

  // Check if form has a Formspree action
  const action = form.getAttribute('action');
  if (action && action.includes('formspree.io')) {
    // Use Formspree via fetch
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    submitBtn.classList.add('opacity-60', 'cursor-not-allowed');

    try {
      const formData = new FormData(form);
      const response = await fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        if (status) {
          status.textContent = '✓ Message sent successfully! We\'ll get back to you within 24 hours.';
          status.className = 'text-sm mt-3 text-green-400';
        }
        form.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      if (status) {
        status.textContent = 'Something went wrong. Please email us directly at contact@ceradonsystems.com.';
        status.className = 'text-red-400 text-sm mt-3';
      }
    }

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
    }, TIMEOUTS.FORM_RESET);
    return;
  }

  // Fallback: mailto
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

  const mailto = new URL('mailto:contact@ceradonsystems.com');
  mailto.searchParams.set('subject', 'Ceradon Inquiry');
  mailto.searchParams.set('body', composed);
  window.location.href = mailto.toString();

  if (status) {
    status.textContent = 'Opening mail client...';
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
