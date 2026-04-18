/**
 * Passive WiFi Through-Wall Sensing Visualization
 * Canvas-based animation for the homepage hero. Depicts the VANTAGE premise:
 * ambient WiFi access points emit signals, a sensor on our side listens passively,
 * and human presence behind a wall perturbs Channel State Information — producing
 * detections without emitting anything ourselves.
 *
 * Scene layout (right half of hero):
 *   - 2 ambient WiFi sources (far side)
 *   - A wall (vertical, dashed)
 *   - A human figure moving behind the wall
 *   - A VANTAGE sensor node on our side
 *   - Signal waves, signal ray through human, detection pulses
 */

const PREFERS_REDUCED_MOTION = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLORS = {
  wall: 'rgba(197, 203, 214, 0.18)',
  wallAccent: 'rgba(197, 203, 214, 0.3)',
  source: 'rgba(86, 183, 255, 0.9)',
  sourceWave: 'rgba(86, 183, 255, 0.35)',
  sourceWaveFar: 'rgba(86, 183, 255, 0.08)',
  human: 'rgba(250, 204, 21, 0.9)',
  humanGlow: 'rgba(250, 204, 21, 0.25)',
  sensor: 'rgba(43, 120, 255, 1)',
  sensorRing: 'rgba(43, 120, 255, 0.35)',
  detectionPulse: 'rgba(43, 120, 255, 0.5)',
  ray: 'rgba(250, 204, 21, 0.5)',
  rayFaint: 'rgba(250, 204, 21, 0.15)',
  label: 'rgba(197, 203, 214, 0.55)'
};

class WiFiVisualization {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.time = 0;
    this.lastFrame = 0;
    this.isRunning = false;
    this.isVisible = true;
    this.reducedMotion = PREFERS_REDUCED_MOTION();
    this.rafId = 0;

    this.sources = [];
    this.waves = [];
    this.pulses = [];
    this.human = { x: 0, y: 0, phase: 0 };
    this.sensor = { x: 0, y: 0, lastDetection: -3 };
    this.wallX = 0;
    this.wallTop = 0;
    this.wallBottom = 0;

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    this.handleResize();
    window.addEventListener('resize', this.handleResize);

    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
          if (this.isVisible) this.start();
          else this.stop();
        });
      }, { threshold: 0 });
      this.observer.observe(canvas);
    }

    if (this.reducedMotion) {
      this.renderStatic();
    } else {
      this.start();
    }
  }

  handleResize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    if (this.width === 0 || this.height === 0) return;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.layoutScene();
    if (this.reducedMotion) this.renderStatic();
  }

  layoutScene() {
    const w = this.width;
    const h = this.height;

    // Visualization lives in the right portion of the hero.
    // sceneLeft = where our observable scene begins
    const sceneLeft = Math.max(w * 0.38, w - 560);
    this.sceneLeft = sceneLeft;
    this.wallX = sceneLeft + (w - sceneLeft) * 0.48;
    this.wallTop = h * 0.18;
    this.wallBottom = h * 0.9;

    // Sensor on our (left) side, near the wall.
    this.sensor.x = sceneLeft + (this.wallX - sceneLeft) * 0.28;
    this.sensor.y = h * 0.58;

    // Two ambient WiFi sources on the far (right) side.
    this.sources = [
      { x: w - 40, y: h * 0.22, phase: 0.2, period: 3.6 },
      { x: w - 60, y: h * 0.82, phase: 2.1, period: 4.2 }
    ];

    this.waves = [];
    this.pulses = [];
  }

  start() {
    if (this.reducedMotion || this.isRunning) return;
    if (this.width === 0 || this.height === 0) return;
    this.isRunning = true;
    this.lastFrame = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.time += dt;

    // Human path: slow figure-eight behind the wall.
    const sceneRightWidth = this.width - this.wallX;
    const centerX = this.wallX + sceneRightWidth * 0.5;
    const centerY = this.height * 0.52;
    const rx = sceneRightWidth * 0.28;
    const ry = this.height * 0.18;
    this.human.x = centerX + Math.sin(this.time * 0.32) * rx;
    this.human.y = centerY + Math.sin(this.time * 0.64) * ry * 0.5;
    this.human.phase = this.time;

    // Emit waves from each source on its period.
    this.sources.forEach((src) => {
      src.phase += dt;
      if (src.phase > src.period) {
        src.phase = 0;
        this.waves.push({
          x: src.x,
          y: src.y,
          r: 0,
          maxR: Math.hypot(this.width, this.height) * 0.65
        });
      }
    });

    // Age waves.
    const waveSpeed = 70;
    this.waves = this.waves.filter((w) => {
      w.r += waveSpeed * dt;
      return w.r < w.maxR;
    });

    // Detection pulse at steady interval, synced loosely with human crossing center.
    if (this.time - this.sensor.lastDetection > 2.6) {
      this.sensor.lastDetection = this.time;
      this.pulses.push({ r: 0, life: 1 });
    }
    this.pulses = this.pulses.filter((p) => {
      p.r += 110 * dt;
      p.life = Math.max(0, 1 - p.r / 140);
      return p.life > 0;
    });
  }

  renderStatic() {
    if (this.width === 0 || this.height === 0) return;
    this.time = 1.2;
    this.human.x = this.wallX + (this.width - this.wallX) * 0.5;
    this.human.y = this.height * 0.52;
    this.sources.forEach((src, i) => {
      this.waves.push({ x: src.x, y: src.y, r: 120 + i * 40, maxR: 400 });
    });
    this.pulses.push({ r: 60, life: 0.7 });
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawWall(ctx);
    this.waves.forEach((wave) => this.drawWave(ctx, wave));
    this.drawDetectionRay(ctx);
    this.sources.forEach((src) => this.drawSource(ctx, src));
    this.drawHuman(ctx);
    this.drawSensor(ctx);
    this.pulses.forEach((p) => this.drawPulse(ctx, p));
  }

  drawWall(ctx) {
    ctx.save();
    ctx.strokeStyle = COLORS.wall;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(this.wallX, this.wallTop);
    ctx.lineTo(this.wallX, this.wallBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Wall cap markers
    ctx.strokeStyle = COLORS.wallAccent;
    ctx.lineWidth = 1;
    [this.wallTop, this.wallBottom].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(this.wallX - 6, y);
      ctx.lineTo(this.wallX + 6, y);
      ctx.stroke();
    });

    // "WALL" label
    ctx.fillStyle = COLORS.label;
    ctx.font = '500 10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('WALL', this.wallX, this.wallTop - 6);
    ctx.restore();
  }

  drawWave(ctx, wave) {
    const falloff = 1 - wave.r / wave.maxR;
    if (falloff <= 0) return;

    ctx.save();

    // Wave attenuates as it crosses the wall; left side fades more.
    // We draw the wave in two arcs: right-of-wall (source side) full alpha,
    // left-of-wall (our side) heavily attenuated to suggest absorption.
    const alphaRight = falloff * 0.55;
    const alphaLeft = falloff * 0.18;

    ctx.lineWidth = 1;

    // Right (source side) arc
    ctx.strokeStyle = `rgba(86, 183, 255, ${alphaRight.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
    ctx.stroke();

    // Left (our side) attenuated arc, only if it has crossed the wall
    if (wave.x - wave.r < this.wallX) {
      ctx.strokeStyle = `rgba(86, 183, 255, ${alphaLeft.toFixed(3)})`;
      // Clip to left-of-wall region
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, this.wallX, this.height);
      ctx.clip();
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawSource(ctx, src) {
    ctx.save();
    // Outer soft glow
    const glow = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, 14);
    glow.addColorStop(0, 'rgba(86, 183, 255, 0.35)');
    glow.addColorStop(1, 'rgba(86, 183, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(src.x, src.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Core dot
    ctx.fillStyle = COLORS.source;
    ctx.beginPath();
    ctx.arc(src.x, src.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawHuman(ctx) {
    ctx.save();
    const { x, y, phase } = this.human;

    // Pulsing aura showing CSI perturbation.
    const pulse = 0.6 + 0.4 * Math.sin(phase * 2.4);
    const auraR = 18 + pulse * 6;
    const aura = ctx.createRadialGradient(x, y, 0, x, y, auraR);
    aura.addColorStop(0, `rgba(250, 204, 21, ${0.22 * pulse})`);
    aura.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y, auraR, 0, Math.PI * 2);
    ctx.fill();

    // Core "human" dot
    ctx.fillStyle = COLORS.human;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSensor(ctx) {
    ctx.save();
    const { x, y } = this.sensor;

    // Diamond shape for the VANTAGE node
    const size = 7;
    ctx.fillStyle = COLORS.sensor;
    ctx.strokeStyle = COLORS.sensorRing;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Label
    ctx.fillStyle = COLORS.label;
    ctx.font = '600 10px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VANTAGE', x, y + 22);
    ctx.restore();
  }

  drawPulse(ctx, pulse) {
    ctx.save();
    const { x, y } = this.sensor;
    ctx.strokeStyle = `rgba(43, 120, 255, ${(pulse.life * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, pulse.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  drawDetectionRay(ctx) {
    // Faint ray from each source → through human → to sensor, suggesting the
    // multipath signature that CSI analysis resolves into a detection.
    const intensity = 0.35 + 0.35 * Math.sin(this.time * 1.3);
    ctx.save();
    this.sources.forEach((src) => {
      ctx.strokeStyle = `rgba(250, 204, 21, ${(0.08 + intensity * 0.12).toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(this.human.x, this.human.y);
      ctx.lineTo(this.sensor.x, this.sensor.y);
      ctx.stroke();
    });
    ctx.restore();
  }

  destroy() {
    this.stop();
    window.removeEventListener('resize', this.handleResize);
    if (this.observer) this.observer.disconnect();
  }
}

export function initWiFiVisualization() {
  const canvas = document.querySelector('[data-wifi-canvas]');
  if (!canvas) return null;
  return new WiFiVisualization(canvas);
}
