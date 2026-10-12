/* Ceradon v2 site behaviour. No dependencies. Everything degrades to static content. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Theme: system by default; toggle stores an explicit choice.
  var tbtn = d.querySelector('[data-theme-toggle]');
  function current() {
    return root.dataset.theme || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }
  function label() { if (tbtn) tbtn.setAttribute('aria-label', current() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'); }
  label();
  if (tbtn) tbtn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    label();
    d.dispatchEvent(new CustomEvent('themechange'));
  });

  // Mobile menu
  var mt = d.querySelector('[data-menu-toggle]'), nav = d.querySelector('.nav');
  if (mt && nav) {
    mt.addEventListener('click', function () {
      var open = mt.getAttribute('aria-expanded') !== 'true';
      mt.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
  }
  // Systems dropdown
  d.querySelectorAll('.has-menu > button').forEach(function (b) {
    var menu = d.getElementById(b.getAttribute('aria-controls'));
    function set(open) { b.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open); }
    b.addEventListener('click', function (e) { e.stopPropagation(); set(b.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('click', function (e) { if (!menu.contains(e.target)) set(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && b.getAttribute('aria-expanded') === 'true') { set(false); b.focus(); } });
    menu.addEventListener('focusout', function (e) { if (!b.parentNode.contains(e.relatedTarget)) set(false); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mt && mt.getAttribute('aria-expanded') === 'true') { mt.click(); mt.focus(); }
  });

  // Reveal on scroll
  var els = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce.matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Videos: load and play only while visible; never with reduced motion (poster stays).
  var vids = d.querySelectorAll('video[data-lazy]');
  function load(v) { if (v.dataset.loaded) return; v.dataset.loaded = 1; v.querySelectorAll('source').forEach(function (s) { s.src = s.dataset.src; }); v.load(); }
  if ('IntersectionObserver' in window) {
    var vo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !reduce.matches) { load(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else if (!v.paused) v.pause();
      });
    }, { threshold: 0.15 });
    var start = function () { vids.forEach(function (v) { vo.observe(v); }); };
    // Hero video waits for the load event so it never competes with first paint.
    if (d.readyState === 'complete') setTimeout(start, 200); else window.addEventListener('load', function () { setTimeout(start, 200); });
  }

  // Parallax: transform only, rAF, off for reduced motion and small screens.
  var px = [].slice.call(d.querySelectorAll('[data-parallax]'));
  if (px.length && !reduce.matches) {
    var ticking = false;
    function frame() {
      ticking = false;
      if (window.innerWidth < 700) { px.forEach(function (el) { el.style.transform = ''; }); return; }
      var vh = window.innerHeight;
      px.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var k = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = 'translate3d(0,' + ((r.top + r.height / 2 - vh / 2) * -k).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
    frame();
  }

  // Sticky sequence: the step nearest the viewport centre drives the media frame.
  d.querySelectorAll('[data-seq]').forEach(function (seq) {
    var steps = [].slice.call(seq.querySelectorAll('[data-step]'));
    var frames = [].slice.call(seq.querySelectorAll('[data-frame]'));
    var num = seq.querySelector('[data-seq-n]');
    var cur = -1;
    function set(i) {
      if (i === cur) return; cur = i;
      steps.forEach(function (s, j) { s.classList.toggle('on', j === i); });
      frames.forEach(function (f, j) { f.classList.toggle('on', j === i); });
      if (num) num.textContent = ('0' + (i + 1)).slice(-2);
    }
    set(0);
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) set(+e.target.dataset.step); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { so.observe(s); });
  });

  // Contact topic prefill (?topic=lantern)
  var topic = new URLSearchParams(location.search).get('topic');
  var sel = d.querySelector('select[name=topic]');
  if (topic && sel) { [].forEach.call(sel.options, function (o) { if (o.value === topic) sel.value = topic; }); }

  // Contact form: post to the existing Formspree endpoint without leaving the page.
  // Forms (contact, signup, feedback): post in place and report the result.
  if (window.fetch) {
    Array.prototype.forEach.call(d.querySelectorAll('form[data-contact], form[data-capture]'), function (form) {
      var status = form.querySelector('[data-status]');
      var ok = form.getAttribute('data-ok') || 'Sent. A person will reply by email, usually within one business day.';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (status) status.textContent = 'Sending…';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
          .then(function (r) { if (!r.ok) throw 0; form.reset(); if (status) status.textContent = ok; })
          .catch(function () { if (status) status.textContent = 'That didn’t send. Email contact@ceradonsystems.com instead.'; });
      });
    });
  }
})();
