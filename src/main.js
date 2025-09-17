import { initUI, refreshActiveStates } from './ui.js';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  initUI();
});

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    refreshActiveStates();
  });
}

