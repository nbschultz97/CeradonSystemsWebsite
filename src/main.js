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
  initUI();
  initAnalytics();
});

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    refreshActiveStates();
  });
}

