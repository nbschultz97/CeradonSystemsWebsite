import './input.css';
import './scroll-animations.js';
import { initUI, refreshActiveStates } from './ui.js';
import { initWiFiVisualization } from './wifi-visualization.js';
import { initStatCounters, initSpotlight, initFlowConnector } from './interactions.js';

function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  initUI();
  initWiFiVisualization();
  initStatCounters();
  initSpotlight();
  initFlowConnector();
});

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', () => {
    refreshActiveStates();
  });
}
