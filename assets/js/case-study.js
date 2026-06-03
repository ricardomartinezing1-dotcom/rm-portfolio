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
})();
