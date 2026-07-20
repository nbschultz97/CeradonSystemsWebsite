// Vite only rewrites asset paths it can see statically. The story map below is
// plain data, so `./assets/foo.webp` used to survive the build untouched and
// 404 against dist/, where every file carries a content hash. Globbing the
// directory gives the bundler something to analyse and yields basename -> URL.
const ASSET_URLS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/*.{webp,png,jpg,jpeg}', {
      eager: true, query: '?url', import: 'default'
    })
  ).map(([path, url]) => [path.replace(/^.*\//, ''), url])
);

function assetUrl(ref) {
  const name = ref.replace(/^.*\//, '');
  const url = ASSET_URLS[name];
  if (!url) console.warn(`[visual-stories] missing asset: ${ref}`);
  return url;
}

const VISUAL_STORIES = {
  '/vantage.html': {
    eyebrow: 'Mission visualization',
    title: 'Passive awareness, from signal to decision',
    copy: 'A clearer look at the environments, sensing model, and operator context behind VANTAGE.',
    items: [
      ['./assets/hero-vantage.webp', 'VANTAGE passive WiFi sensing in a built environment', 'Built environment'],
      ['./assets/section-vantage-preview.webp', 'Passive WiFi signal visualization across a structure', 'Signal picture'],
      ['./assets/hero-index.webp', 'Operator-focused through-wall awareness visualization', 'Operator context']
    ]
  },
  '/raptor.html': {
    eyebrow: 'Platform view',
    title: 'Edge vision across every operating layer',
    copy: 'From sensor placement to detection and TAK integration, RAPTOR stays close to the mission.',
    items: [
      ['./assets/section-raptor-platforms.webp', 'RAPTOR edge AI across supported platforms', 'Multi-platform'],
      ['./assets/section-raptor-detection.webp', 'RAPTOR real-time object detection interface', 'On-device detection'],
      ['./assets/section-raptor-tak.webp', 'RAPTOR detections integrated into TAK', 'TAK integration']
    ]
  },
  // SCOUT and AEGIS entries removed with those products; their pages are
  // retired and unlinked, so they no longer earn a visual story.
  '/architect.html': {
    eyebrow: 'System planning',
    title: 'Make component decisions visible',
    copy: 'ARCHITECT connects mission needs, compatible COTS hardware, and build-ready system structure.',
    items: [
      ['./assets/hero-architect.webp', 'COTS unmanned system architecture workspace', 'Mission architecture'],
      ['./assets/cots-architect-logo.png', 'COTS ARCHITECT planning toolkit identity', 'Planning toolkit'],
      ['./assets/section-tech-edge.webp', 'Rugged edge-compute hardware for autonomous systems', 'Edge hardware']
    ]
  },
  '/technology.html': {
    eyebrow: 'Technology stack',
    title: 'Built from edge hardware to operational software',
    copy: 'The same engineering language connects sensing, inference, networking, and the operator view.',
    items: [
      ['./assets/section-tech-edge.webp', 'Rugged edge AI compute platform', 'Edge compute'],
      ['./assets/section-raptor-detection.webp', 'Real-time edge AI detection overlay', 'Inference'],
      ['./assets/section-raptor-tak.webp', 'Tactical awareness integration', 'Operator picture']
    ]
  },
  '/company.html': {
    eyebrow: 'Inside Ceradon',
    title: 'Small team. Applied engineering. Real hardware.',
    copy: 'Ceradon is built around rapid prototypes, field constraints, and systems that operators can actually carry.',
    items: [
      ['./assets/lab-soldering.jpg', 'Ceradon prototype electronics being assembled in the lab', 'Prototype lab'],
      ['./assets/hero-company.webp', 'Ceradon Systems engineering and mission focus', 'Mission focus'],
      ['./assets/section-tech-edge.webp', 'Field-ready edge hardware developed by Ceradon', 'Field hardware']
    ]
  }
};

function normalisePath(pathname) {
  if (pathname === '/' || pathname.endsWith('/index.html')) return '/';
  return pathname;
}

function buildVisualStory(config) {
  const section = document.createElement('section');
  section.className = 'visual-story border-t border-white/[0.06]';
  section.setAttribute('aria-labelledby', 'visual-story-heading');
  section.innerHTML = `
    <div class="visual-story__inner">
      <div class="visual-story__intro" data-animate>
        <p class="tag">${config.eyebrow}</p>
        <h2 id="visual-story-heading" class="section-heading">${config.title}</h2>
        <p>${config.copy}</p>
      </div>
      <div class="visual-story__grid" data-animate-stagger>
        ${config.items.map(([src, alt, label], index) => {
          const url = assetUrl(src);
          // Drop the frame entirely rather than render a broken image whose
          // alt text reads as body copy on the page.
          if (!url) return '';
          return `
          <figure class="visual-story__frame visual-story__frame--${index + 1}" data-visual-tilt>
            <div class="visual-story__media">
              <img src="${url}" alt="${alt}" loading="lazy" decoding="async" />
              <span class="visual-story__index">0${index + 1}</span>
            </div>
            <figcaption>${label}</figcaption>
          </figure>
        `;
        }).join('')}
      </div>
    </div>
  `;
  return section;
}

function initVisualStories() {
  const config = VISUAL_STORIES[normalisePath(window.location.pathname)];
  const footer = document.querySelector('footer');
  if (!config || !footer || document.querySelector('.visual-story')) return;
  // An intro heading with no images under it is worse than no section.
  if (!config.items.some(([src]) => assetUrl(src))) return;
  footer.before(buildVisualStory(config));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(hover: hover)').matches) return;

  document.querySelectorAll('[data-visual-tilt]').forEach((frame) => {
    frame.addEventListener('pointermove', (event) => {
      const rect = frame.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      frame.style.setProperty('--visual-rx', `${(-y * 3).toFixed(2)}deg`);
      frame.style.setProperty('--visual-ry', `${(x * 4).toFixed(2)}deg`);
      frame.style.setProperty('--visual-x', `${((x + .5) * 100).toFixed(1)}%`);
      frame.style.setProperty('--visual-y', `${((y + .5) * 100).toFixed(1)}%`);
    });
    frame.addEventListener('pointerleave', () => {
      frame.style.removeProperty('--visual-rx');
      frame.style.removeProperty('--visual-ry');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVisualStories, { once: true });
} else {
  initVisualStories();
}
