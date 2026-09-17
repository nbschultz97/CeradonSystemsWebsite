import './input.css';
import './scroll-animations.js';
import './immersive-ui.js';
import './visual-stories.js';
import { initUI, refreshActiveStates } from './ui.js';
import { initAnalytics } from './analytics.js';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  // Vite rewrites image sources to hashed asset URLs, but not anchor hrefs.
  document.querySelectorAll('.kestrel-capture__image-link').forEach((link) => {
    const image = link.querySelector('img');
    if (image) link.href = image.src;
  });

  initUI();
  initAnalytics();
});

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    refreshActiveStates();
  });
}

