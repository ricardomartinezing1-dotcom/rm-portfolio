/* ─────────────────────────────────────────────────────────────────────────
   Grid-shutter page transition (MPA adaptation of the Next.js/GSAP demo).

   How it works across full page loads:
     1. Click on an internal link to another page → intercept, play the
        "cover" animation (4×16 blocks scaleX 0→1, rows alternating
        direction), set a sessionStorage flag, then navigate for real.
     2. On the destination page a tiny inline <head> guard (html.pt-in +
        body::before) paints a solid cover before first paint, so no flash.
     3. This script boots, builds the grid already covered (scaleX 1),
        removes the guard, and plays the "reveal" animation (scaleX 1→0).

   Requires GSAP (loaded on every page before this file).
   Exposes window.pageTransition.navigate(url) for programmatic navigation.
   ───────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var ROWS = 4;
  var COLS = 16;
  var FLAG = 'pt:active';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── styles (injected so a single file works on every page) ──────────── */
  var style = document.createElement('style');
  style.textContent =
    '.pt-grid{position:fixed;top:0;left:0;width:100%;height:100%;' +
    'pointer-events:none;z-index:9998;overflow:hidden;}' +
    '.pt-block{position:absolute;background-color:#2D6A4F;will-change:transform;}';
  document.head.appendChild(style);

  /* ── grid ─────────────────────────────────────────────────────────────── */
  var grid = document.createElement('div');
  grid.className = 'pt-grid';
  grid.setAttribute('aria-hidden', 'true');
  var blocks = [];

  function buildGrid(initialScale) {
    grid.innerHTML = '';
    blocks = [];
    var bw = window.innerWidth / COLS;
    var bh = window.innerHeight / ROWS;
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        var b = document.createElement('div');
        b.className = 'pt-block';
        b.style.cssText =
          'width:' + (bw + 1) + 'px;height:' + (bh + 1) + 'px;' +
          'left:' + (col * bw) + 'px;top:' + (row * bh) + 'px;' +
          'transform-origin:' + (row % 2 === 0 ? 'left' : 'right') + ' center;' +
          'transform:scaleX(' + initialScale + ');';
        grid.appendChild(b);
        blocks.push(b);
      }
    }
  }

  function rowBlocks(row) { return blocks.slice(row * COLS, row * COLS + COLS); }

  function animate(toScale, onComplete) {
    var tl = gsap.timeline({ onComplete: onComplete });
    for (var row = 0; row < ROWS; row++) {
      tl.to(rowBlocks(row), {
        scaleX: toScale,
        duration: 0.6,
        ease: 'power3.inOut',
        stagger: { each: 0.025, from: row % 2 === 0 ? 'start' : 'end' },
      }, '<');
    }
    return tl;
  }

  /* ── navigation ──────────────────────────────────────────────────────── */
  var busy = false;

  function navigate(url) {
    if (busy) return;
    busy = true;
    if (reduced || typeof gsap === 'undefined') {
      location.href = url;
      return;
    }
    try { sessionStorage.setItem(FLAG, '1'); } catch (e) {}
    buildGrid(0);
    animate(1, function () { location.href = url; });
  }

  /* Intercept plain left-clicks on internal links to other pages. */
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return;
    var url;
    try { url = new URL(href, location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) return;      // same-page (hash/scroll)
    if (!/\.html?$|\/$/.test(url.pathname)) return;       // only page navigations
    e.preventDefault();
    navigate(url.href);
  }, true);

  window.pageTransition = { navigate: navigate };

  /* ── arrival: reveal if we navigated here through a transition ───────── */
  function clearGuard() {
    document.documentElement.classList.remove('pt-in');
  }

  function init() {
    document.body.appendChild(grid);

    var arrived = false;
    try {
      arrived = sessionStorage.getItem(FLAG) === '1';
      sessionStorage.removeItem(FLAG);
    } catch (e) {}

    if (arrived && !reduced && typeof gsap !== 'undefined') {
      buildGrid(1);             // start fully covered (matches the head guard)
      clearGuard();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { animate(0); });
      });
    } else {
      clearGuard();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* bfcache restore (back/forward): never leave the cover up. */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      busy = false;
      clearGuard();
      blocks.forEach(function (b) { b.style.transform = 'scaleX(0)'; });
    }
  });

  window.addEventListener('resize', function () {
    if (!busy) buildGrid(0);
  });
})();
