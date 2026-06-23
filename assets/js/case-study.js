/* ==========================================================================
   Case study — shared behaviour: progress bar, scroll reveal, active TOC
   ========================================================================== */
(function () {
  /* Reading progress */
  const bar = document.getElementById('cs-progress');
  const updateProgress = () => {
    if (!bar) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  /* Scroll reveal */
  document.body.classList.add('reveal-ready');
  const revEls = [...document.querySelectorAll('.reveal')];
  const checkReveal = () => {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    revEls.forEach(el => {
      if (!el.classList.contains('in') && el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add('in');
      }
    });
  };
  window.addEventListener('scroll', checkReveal, { passive: true });
  checkReveal();

  /* Active TOC link */
  const tocLinks = [...document.querySelectorAll('.cs-toc-link')];
  const sections = tocLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const setActive = () => {
    const scrollY = window.scrollY + 140;
    let active = sections[0];
    sections.forEach(s => { if (s.offsetTop <= scrollY) active = s; });
    tocLinks.forEach(a => {
      a.classList.toggle('is-active', a.getAttribute('href') === '#' + (active && active.id));
    });
  };
  window.addEventListener('scroll', setActive, { passive: true });
  setActive();

  /* Lightbox — any <img class="cs-zoom"> opens in a fullscreen modal */
  const zoomables = [...document.querySelectorAll('.cs-zoom')];
  if (zoomables.length) {
    const box = document.createElement('div');
    box.className = 'cs-lightbox';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML =
      '<button class="cs-lightbox-close" aria-label="Close">' +
      '<svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '</button><img class="cs-lightbox-img" alt="" />';
    document.body.appendChild(box);
    const lbImg = box.querySelector('.cs-lightbox-img');

    const open = (src, alt) => {
      lbImg.src = src;
      lbImg.alt = alt || '';
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.documentElement.style.overflow = 'hidden';
    };
    const close = () => {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.documentElement.style.overflow = '';
    };

    zoomables.forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => open(img.currentSrc || img.src, img.alt));
    });
    box.addEventListener('click', e => { if (e.target === box || e.target.closest('.cs-lightbox-close')) close(); });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
})();
