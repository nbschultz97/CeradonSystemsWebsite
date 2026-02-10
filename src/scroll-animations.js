/**
 * Scroll Animation System
 * Lightweight IntersectionObserver-based animations for Ceradon Systems website
 * Respects prefers-reduced-motion and supports staggered animations
 */

(function() {
  'use strict';

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Animation configuration
  const CONFIG = {
    rootMargin: '0px 0px -100px 0px', // Trigger slightly before element enters viewport
    threshold: 0.15, // Percentage of element visible before triggering
    animationClass: 'fade-in-up',
    activeClass: 'is-visible'
  };

  // CSS classes will be added via this script
  function injectStyles() {
    const styleId = 'scroll-animation-styles';

    // Don't inject twice
    if (document.getElementById(styleId)) return;

    const styles = `
      /* Scroll Animation Base Styles */
      [data-animate] {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                    transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      [data-animate].is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Respect reduced motion preference */
      @media (prefers-reduced-motion: reduce) {
        [data-animate] {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
      }

      /* Stagger delays */
      [data-animate][data-delay="100"].is-visible {
        transition-delay: 0.1s;
      }
      [data-animate][data-delay="200"].is-visible {
        transition-delay: 0.2s;
      }
      [data-animate][data-delay="300"].is-visible {
        transition-delay: 0.3s;
      }
      [data-animate][data-delay="400"].is-visible {
        transition-delay: 0.4s;
      }
      [data-animate][data-delay="500"].is-visible {
        transition-delay: 0.5s;
      }
      [data-animate][data-delay="600"].is-visible {
        transition-delay: 0.6s;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // Main animation observer
  function initScrollAnimations() {
    // If user prefers reduced motion, show all elements immediately
    if (prefersReducedMotion) {
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach(el => el.classList.add(CONFIG.activeClass));
      return;
    }

    // Create intersection observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add visible class to trigger animation
          entry.target.classList.add(CONFIG.activeClass);

          // Optionally unobserve after animation (one-time animation)
          // Comment this out if you want elements to re-animate on scroll back
          observer.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: CONFIG.rootMargin,
      threshold: CONFIG.threshold
    });

    // Observe all elements with data-animate attribute
    const animatedElements = document.querySelectorAll('[data-animate]');
    animatedElements.forEach(el => observer.observe(el));
  }

  // Auto-initialize on DOM ready
  function init() {
    injectStyles();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initScrollAnimations);
    } else {
      // DOM already loaded
      initScrollAnimations();
    }
  }

  // Public API (if needed)
  window.ScrollAnimations = {
    init: initScrollAnimations,
    refresh: function() {
      // Re-initialize animations (useful for dynamically added content)
      initScrollAnimations();
    }
  };

  // Auto-start
  init();
})();
