(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealItems = [...document.querySelectorAll('.reveal')];
  const parallaxItems = [...document.querySelectorAll('[data-parallax]')];
  const progressBar = document.querySelector('.progress span');
  const sections = [...document.querySelectorAll('[data-section]')];
  const header = document.querySelector('.topbar');
  const sharedOrbs = {
    accent: document.querySelector('[data-shared-orb="accent"]'),
    violet: document.querySelector('[data-shared-orb="violet"]')
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const mix = (from, to, amount) => from + (to - from) * amount;
  const smooth = (value) => value * value * (3 - 2 * value);
  const mixColor = (a, b, amount) => a.map((value, index) => Math.round(mix(value, b[index], amount)));
  const rgb = (color) => `rgb(${color[0]} ${color[1]} ${color[2]})`;

  const palettes = {
    cyan: [[255, 255, 255], [127, 213, 255], [62, 189, 255]],
    coral: [[255, 242, 242], [255, 170, 168], [255, 127, 130]],
    blue: [[68, 111, 214], [68, 111, 214], [68, 111, 214]],
    violet: [[247, 241, 255], [199, 181, 255], [143, 103, 245]]
  };

  function getOrbStates() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const compact = w < 620;
    const medium = w < 980;

    const accentSize = compact ? 260 : medium ? 360 : 520;
    const violetSize = compact ? 250 : medium ? 350 : 500;

    return {
      accent: [
        { x: -accentSize * 0.18, y: -accentSize * 0.20, size: accentSize, palette: palettes.cyan },
        { x: w - accentSize * 0.82, y: h - accentSize * 0.48, size: accentSize * 1.04, palette: palettes.coral },
        { x: w - accentSize * 0.74, y: -accentSize * 0.18, size: accentSize * 0.82, palette: palettes.coral },
        { x: w - accentSize * 0.78, y: h * 0.08, size: accentSize * 1.02, palette: palettes.blue },
        { x: -accentSize * 0.22, y: -accentSize * 0.16, size: accentSize * 0.88, palette: palettes.violet }
      ],
      violet: [
        { x: w - violetSize * 0.58, y: h - violetSize * 0.54, size: violetSize, palette: palettes.violet },
        { x: w + violetSize * 0.22, y: -violetSize * 0.72, size: violetSize * 0.84, palette: palettes.violet },
        { x: w + violetSize * 0.30, y: -violetSize * 0.78, size: violetSize * 0.78, palette: palettes.violet },
        { x: w + violetSize * 0.26, y: h * 0.18, size: violetSize * 0.82, palette: palettes.violet },
        { x: w - violetSize * 0.72, y: h * 0.34, size: violetSize * 0.92, palette: palettes.violet }
      ]
    };
  }

  function getSectionTimeline() {
    return sections.map((section) => section.offsetTop + section.offsetHeight * 0.5 - window.innerHeight * 0.5);
  }

  function interpolateState(states, scrollY, timeline) {
    if (scrollY <= timeline[0]) return { ...states[0], amount: 0, fromPalette: states[0].palette, toPalette: states[0].palette };
    if (scrollY >= timeline[timeline.length - 1]) {
      const last = states[states.length - 1];
      return { ...last, amount: 1, fromPalette: last.palette, toPalette: last.palette };
    }

    let index = 0;
    while (index < timeline.length - 2 && scrollY > timeline[index + 1]) index += 1;

    const start = timeline[index];
    const end = timeline[index + 1];
    const amount = smooth(clamp((scrollY - start) / Math.max(end - start, 1), 0, 1));
    const from = states[index];
    const to = states[index + 1];

    return {
      x: mix(from.x, to.x, amount),
      y: mix(from.y, to.y, amount),
      size: mix(from.size, to.size, amount),
      amount,
      fromPalette: from.palette,
      toPalette: to.palette
    };
  }

  function renderSharedOrb(element, state) {
    if (!element) return;
    const inner = mixColor(state.fromPalette[0], state.toPalette[0], state.amount);
    const mid = mixColor(state.fromPalette[1], state.toPalette[1], state.amount);
    const outer = mixColor(state.fromPalette[2], state.toPalette[2], state.amount);

    element.style.visibility = 'visible';
    element.style.width = `${state.size}px`;
    element.style.height = `${state.size}px`;
    element.style.background = `radial-gradient(circle at 68% 48%, ${rgb(inner)} 0 12%, ${rgb(mid)} 54%, ${rgb(outer)} 100%)`;
    element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0)`;
  }

  function renderOrbs(scrollY) {
    const timeline = getSectionTimeline();
    const states = getOrbStates();
    renderSharedOrb(sharedOrbs.accent, interpolateState(states.accent, scrollY, timeline));
    renderSharedOrb(sharedOrbs.violet, interpolateState(states.violet, scrollY, timeline));
  }

  function updateHeaderTheme() {
    if (!header) return;
    const sampleY = Math.min(34, window.innerHeight * 0.08);
    const section = sections.find((item) => {
      const rect = item.getBoundingClientRect();
      return rect.top <= sampleY && rect.bottom > sampleY;
    });
    header.dataset.theme = section?.dataset.headerTheme === 'dark' ? 'dark' : 'light';
  }

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    renderOrbs(window.scrollY);
    updateHeaderTheme();
    return;
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const item = entry.target;
      const section = item.closest('.section-shell');
      const siblings = section ? [...section.querySelectorAll('.reveal')] : [];
      const index = Math.max(0, siblings.indexOf(item));
      item.style.transitionDelay = `${Math.min(index * 85, 340)}ms`;
      item.classList.add('is-visible');
      revealObserver.unobserve(item);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));

  let ticking = false;

  function updateMotion() {
    ticking = false;
    const scrollY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? scrollY / maxScroll : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
    }

    renderOrbs(scrollY);
    updateHeaderTheme();

    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || 0);
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const offset = center * speed;
      item.style.setProperty('--parallax-y', `${offset.toFixed(2)}px`);
      const base = item.matches('.work--a') ? 'rotate(1deg)' : item.matches('.work--b') ? 'rotate(-1.5deg)' : '';
      item.style.transform = `${base} translate3d(0, var(--parallax-y), 0)`;
    });
  }

  function requestUpdate() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateMotion);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  requestUpdate();
})();