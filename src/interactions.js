/**
 * Interactions — Ceradon Systems
 * Collection of lightweight progressive-enhancement modules:
 *   - Stat counters that animate from 0 when scrolled into view
 *   - Cursor-follow spotlight glow on cards marked with [data-spotlight]
 *   - Animated signal-flow connector between process steps
 */

const PREFERS_REDUCED_MOTION = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------------ */
/* Stat counters                                                      */
/* ------------------------------------------------------------------ */
// Elements opt in with: <p data-counter="10" data-counter-suffix="×">0</p>
// Non-numeric targets (e.g. "ZERO", "TRL 4", "ATAK") fade in with a subtle
// typewriter-style reveal rather than counting.
function animateNumber(el, target, suffix, duration = 1400) {
  const start = performance.now();
  const startValue = 0;

  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    // ease-out-expo
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const value = Math.round(startValue + (target - startValue) * eased);
    el.textContent = `${value}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = `${target}${suffix}`;
  }
  requestAnimationFrame(step);
}

function revealText(el, finalText, duration = 800) {
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const chars = Math.round(finalText.length * eased);
    el.textContent = finalText.slice(0, chars) || '\u00A0';
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = finalText;
  }
  requestAnimationFrame(step);
}

export function initStatCounters() {
  const nodes = document.querySelectorAll('[data-counter]');
  if (!nodes.length) return;

  const reduced = PREFERS_REDUCED_MOTION();
  if (reduced || !('IntersectionObserver' in window)) {
    nodes.forEach((el) => {
      const target = el.getAttribute('data-counter');
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const numeric = Number(target);
      el.textContent = Number.isFinite(numeric) ? `${numeric}${suffix}` : target;
    });
    return;
  }

  // Pre-set each node to an empty/placeholder state so the jump from blank
  // to animated value is clean.
  nodes.forEach((el) => {
    const target = el.getAttribute('data-counter');
    const numeric = Number(target);
    el.textContent = Number.isFinite(numeric)
      ? `0${el.getAttribute('data-counter-suffix') || ''}`
      : '';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = el.getAttribute('data-counter');
      const suffix = el.getAttribute('data-counter-suffix') || '';
      const numeric = Number(target);
      if (Number.isFinite(numeric)) {
        animateNumber(el, numeric, suffix);
      } else {
        revealText(el, target);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.4 });

  nodes.forEach((el) => observer.observe(el));
}

/* ------------------------------------------------------------------ */
/* Spotlight glow                                                     */
/* ------------------------------------------------------------------ */
// Applies to any element with [data-spotlight]. A CSS custom property
// --spot-x / --spot-y is updated as the pointer moves over the element,
// which the stylesheet uses to position a radial gradient.
export function initSpotlight() {
  const nodes = document.querySelectorAll('[data-spotlight]');
  if (!nodes.length) return;

  // Pointer: fine check skips the effect on touch-primary devices where
  // cursor tracking isn't meaningful.
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover) return;

  nodes.forEach((node) => {
    node.classList.add('spotlight-active');
    node.addEventListener('pointermove', (event) => {
      const rect = node.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      node.style.setProperty('--spot-x', `${x}%`);
      node.style.setProperty('--spot-y', `${y}%`);
    });
    node.addEventListener('pointerleave', () => {
      node.style.removeProperty('--spot-x');
      node.style.removeProperty('--spot-y');
    });
  });
}

/* ------------------------------------------------------------------ */
/* Process flow connector                                             */
/* ------------------------------------------------------------------ */
// Draws an animated stroked line through the dots of a [data-flow] grid
// on scroll into view. Fails gracefully — the steps remain readable even
// if the SVG never renders.
export function initFlowConnector() {
  const container = document.querySelector('[data-flow]');
  if (!container) return;
  const reduced = PREFERS_REDUCED_MOTION();
  const svg = container.querySelector('[data-flow-svg]');
  const path = svg && svg.querySelector('path');
  if (!svg || !path) return;

  if (reduced) {
    path.style.strokeDashoffset = '0';
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      path.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1)';
      path.style.strokeDashoffset = '0';
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.3 });

  observer.observe(container);
}
