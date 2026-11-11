/* Progressive enhancement: all content and navigation remain usable without JS. */
(() => {
  'use strict';
  const header = document.querySelector('.institution');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  if (!header || !toggle || !nav) return;
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = links.map(link => document.querySelector(link.hash)).filter(Boolean);
  const closeMenu = (restoreFocus = false) => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (restoreFocus) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  document.addEventListener('click', event => {
    if (!header.contains(event.target)) closeMenu();
  });
  // Enable the collapsed mobile menu only after its event handlers exist.
  document.documentElement.classList.add('menu-ready');
  const desktop = matchMedia('(min-width: 851px)');
  desktop.addEventListener('change', () => closeMenu());
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scheduled = false;
  const updateNav = () => {
    scheduled = false;
    const line = header.getBoundingClientRect().height + Math.min(160, innerHeight * .22);
    let current = sections[0];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) current = section;
    }
    // Short final sections still become active at the bottom of the document.
    if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = sections.at(-1);
    for (const link of links) {
      const active = link.hash === `#${current.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  };
  const scheduleNav = () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(updateNav); }
  };
  addEventListener('scroll', scheduleNav, {passive: true});
  addEventListener('resize', scheduleNav);
  addEventListener('hashchange', scheduleNav);
  updateNav();

  // Only animate on entry; never pre-hide content behind a JS readiness flag.
  document.querySelectorAll('[data-mask] > span').forEach(line => {
    const inner = document.createElement('span');
    inner.textContent = line.textContent;
    line.replaceChildren(inner);
  });
  const revealTargets = [...document.querySelectorAll('.hero, [data-reveal], [data-mask], .capability, .model-heading, .model-figure, .model-descriptions > li, .results-section, .resources-section')];
  document.querySelectorAll('.capability').forEach((item, index) => {
    item.style.setProperty('--delay', `${index * 80}ms`);
  });
  const onceRevealed = new WeakSet();
  let revealObserver;
  let exitObserver;
  const setupReveals = () => {
    revealObserver?.disconnect();
    exitObserver?.disconnect();
    revealTargets.forEach(target => {
      if (!onceRevealed.has(target)) target.classList.remove('is-visible');
    });
    if (!('IntersectionObserver' in window) || reduced.matches) return;
    revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.intersectionRatio < .08) return;
        entry.target.classList.add('is-visible');
        if (entry.target.hasAttribute('data-once')) {
          onceRevealed.add(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
      scheduleNav();
    }, {threshold: .08, rootMargin: '0px 0px -20px 0px'});
    // Reset only beyond the viewport buffer, avoiding flicker near its edges.
    exitObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && !entry.target.hasAttribute('data-once')) entry.target.classList.remove('is-visible');
      });
    }, {threshold: 0, rootMargin: '80px 0px 80px 0px'});
    revealTargets.forEach(target => {
      if (!target.matches('[data-mask], .capability, .hero')) target.dataset.reveal = '';
      if (!onceRevealed.has(target)) revealObserver.observe(target);
      if (!target.hasAttribute('data-once')) exitObserver.observe(target);
    });
  };
  setupReveals();
  reduced.addEventListener('change', setupReveals);
})();
