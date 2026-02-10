/**
 * Scroll Animation System — Ceradon Systems
 * IntersectionObserver-based reveal animations with stagger support
 */
(function() {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CONFIG = {
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1,
    activeClass: 'is-visible'
  };

  function initScrollAnimations() {
    if (prefersReducedMotion) {
      document.querySelectorAll('[data-animate], [data-animate-stagger]').forEach(el => {
        el.classList.add(CONFIG.activeClass);
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(CONFIG.activeClass);
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: CONFIG.rootMargin,
      threshold: CONFIG.threshold
    });

    document.querySelectorAll('[data-animate], [data-animate-stagger]').forEach(el => {
      observer.observe(el);
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
      initScrollAnimations();
    }
  }

  window.ScrollAnimations = {
    init: initScrollAnimations,
    refresh: initScrollAnimations
  };

  init();
})();
