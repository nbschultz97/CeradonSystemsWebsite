/* LANTERN floorplan extrusion. Reads a real LANTERN floorplan image in the browser,
   turns its ink density into points, and raises the walls in WebGL. No library, no invented geometry. */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nodes = document.querySelectorAll('[data-fp]');
  if (!nodes.length) return;

  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function hex(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec(c); if (!m) return [0.9, 0.93, 0.95];
    var n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }
  function palette() {
    var light = (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) === 'light';
    return light ? { ink: hex('#0a1220'), acc: hex('#0b7f95'), a: 0.8 } : { ink: hex('#e8edf2'), acc: hex('#22d3ee'), a: 0.75 };
  }

  // minimal mat4
  function persp(f, a, n, fa) { var t = 1 / Math.tan(f / 2), nf = 1 / (n - fa); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0]; }
  function look(e, c, u) {
    var z = norm([e[0] - c[0], e[1] - c[1], e[2] - c[2]]), x = norm(cross(u, z)), y = cross(z, x);
    return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1];
  }
  function mul(a, b) { var o = new Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { var l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }

  var VS = 'attribute vec4 p;attribute float dd;uniform mat4 m;uniform float t,sz,hs;varying float vd,vs,vr;' +
    'void main(){float del=p.w;float r=smoothstep(del*.75,del*.75+.35,t);vec3 q=vec3(p.x,p.y*hs*r,p.z);' +
    'gl_Position=m*vec4(q,1.);gl_PointSize=sz*(.6+dd*.8)/gl_Position.w;vd=dd;' +
    'vs=1.-smoothstep(0.,.07,abs(t*1.12-.02-del*.98));vr=r;}';
  var FS = 'precision mediump float;uniform vec3 ink,acc;uniform float al;varying float vd,vs,vr;' +
    'void main(){vec2 c=gl_PointCoord-.5;if(dot(c,c)>.25)discard;vec3 col=mix(ink,acc,clamp(vs*1.2+vd*vr*.18,0.,1.));' +
    'gl_FragColor=vec4(col,al*(.25+vd*.75)*(.35+.65*max(vr,vs)));}';

  function init(el) {
    var canvas = el.querySelector('canvas');
    var gl = canvas.getContext('webgl', { antialias: true, premultipliedAlpha: false, alpha: true });
    if (!gl) return;
    var im = new Image(); im.decoding = 'async';
    im.onload = function () { build(el, canvas, gl, im); };
    im.src = el.dataset.src;
  }

  function build(el, canvas, gl, im) {
    var W = window.innerWidth < 700 ? 170 : 220, H = Math.round(W * im.naturalHeight / im.naturalWidth);
    var c = document.createElement('canvas'); c.width = W; c.height = H;
    var cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0, W, H);
    var px = cx.getImageData(0, 0, W, H).data;
    var aspect = W / H, pts = [], dens = [];
    // skip the burned-in caption rows at the top and bottom of the source image
    for (var y = Math.round(H * 0.02); y < H * 0.985; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4, lum = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
      var dk = 1 - lum; if (dk < 0.14) continue;
      var X = (x / W - 0.5) * aspect, Z = (y / H - 0.5), del = y / H;
      if (dk > 0.55) {
        var n = Math.ceil(dk * 7);
        for (var k = 0; k <= n; k++) { pts.push(X, (k / n) * dk, Z, del); dens.push(dk); }
      } else { pts.push(X, dk * 0.05, Z, del); dens.push(dk * 0.7); }
    }
    var count = dens.length;
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var b1 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b1); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pts), gl.STATIC_DRAW);
    var lp = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(lp); gl.vertexAttribPointer(lp, 4, gl.FLOAT, false, 0, 0);
    var b2 = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dens), gl.STATIC_DRAW);
    var ld = gl.getAttribLocation(pr, 'dd'); gl.enableVertexAttribArray(ld); gl.vertexAttribPointer(ld, 1, gl.FLOAT, false, 0, 0);
    var U = {}; ['m', 't', 'sz', 'hs', 'ink', 'acc', 'al'].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    var pal = palette();
    document.addEventListener('themechange', function () { pal = palette(); if (reduce) draw(performance.now()); });

    var mx = 0, my = 0, tx = 0, ty = 0;
    if (!reduce) el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width - 0.5; ty = (e.clientY - r.top) / r.height - 0.5; });
    el.addEventListener('pointerleave', function () { tx = ty = 0; });

    var t0 = performance.now(), visible = true, raf = 0;
    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      gl.viewport(0, 0, canvas.width, canvas.height); return dpr;
    }
    function draw(now) {
      var dpr = size(), el_ = (now - t0) / 1000;
      var t = reduce ? 2 : Math.min(el_ / 4.2, 2);
      mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
      var yaw = -0.5 + (reduce ? 0 : Math.sin(el_ * 0.12) * 0.22) + mx * 0.35;
      var pitch = 0.98 - my * 0.18, dist = 2.35;
      var eye = [Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist];
      var a = canvas.width / canvas.height;
      var M = mul(persp(0.62, a, 0.1, 10), look(eye, [0, 0.02, 0], [0, 1, 0]));
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(U.m, false, new Float32Array(M));
      gl.uniform1f(U.t, t); gl.uniform1f(U.hs, 0.085); gl.uniform1f(U.sz, 2.2 * dpr);
      gl.uniform3fv(U.ink, pal.ink); gl.uniform3fv(U.acc, pal.acc); gl.uniform1f(U.al, pal.a);
      gl.drawArrays(gl.POINTS, 0, count);
    }
    var last = 0;
    function loop(now) {
      // full rate while the walls rise, then a calm 20 fps orbit
      var settled = now - t0 > 6000;
      if (!settled || now - last > 50) { draw(now); last = now; }
      if (visible && !reduce) raf = requestAnimationFrame(loop);
    }
    el.classList.add('live');
    if (reduce) { draw(performance.now()); window.addEventListener('resize', function () { draw(performance.now()); }); return; }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(loop);
    }).observe(el);
  }

  // Build only when the figure is on screen, after the page has settled.
  function go() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); init(e.target); } });
    }, { rootMargin: '100px' });
    nodes.forEach(function (n) { io.observe(n); });
  }
  function later() { setTimeout(function () { (window.requestIdleCallback || setTimeout)(go); }, 600); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
