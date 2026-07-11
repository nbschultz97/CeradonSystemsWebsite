const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function initHeroDepth() {
  const hero = document.querySelector('[data-immersive-hero]');
  if (!hero || reducedMotion.matches) return;

  let frame;
  const update = (event) => {
    const rect = hero.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      hero.style.setProperty('--pointer-x', x.toFixed(3));
      hero.style.setProperty('--pointer-y', y.toFixed(3));
    });
  };

  hero.addEventListener('pointermove', update, { passive: true });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--pointer-x', 0);
    hero.style.setProperty('--pointer-y', 0);
  });
}

function initDepthCards() {
  if (reducedMotion.matches || !window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('.depth-card').forEach((card) => {
    let frame;
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        card.style.setProperty('--card-x', `${(x * 100).toFixed(1)}%`);
        card.style.setProperty('--card-y', `${(y * 100).toFixed(1)}%`);
        card.style.transform = `perspective(900px) rotateX(${((0.5 - y) * 4).toFixed(2)}deg) rotateY(${((x - 0.5) * 5).toFixed(2)}deg) translateY(-3px)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function initImmersiveUI() {
  initHeroDepth();
  initDepthCards();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImmersiveUI, { once: true });
} else {
  initImmersiveUI();
}
