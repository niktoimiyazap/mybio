(() => {
  const body = document.body;
  const markRig = document.getElementById("markRig");
  const markFrame = document.getElementById("markFrame");
  const brandMark = document.getElementById("brandMark");
  const lockedTile = document.getElementById("lockedTile");
  const particlesCanvas = document.getElementById("tgParticles");

  if (!markRig || !brandMark) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  function positionAtViewportCenter(scale = 1.32) {
    markRig.style.setProperty("--intro-x", "0px");
    markRig.style.setProperty("--intro-y", "0px");
    markRig.style.setProperty("--intro-scale", "1");

    const rect = markRig.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = Math.round(window.innerWidth / 2 - cx);
    const dy = Math.round(window.innerHeight / 2 - cy);

    markRig.style.setProperty("--intro-x", `${dx}px`);
    markRig.style.setProperty("--intro-y", `${dy}px`);
    markRig.style.setProperty("--intro-scale", String(scale));
  }

  async function triggerBlink() {
    brandMark.classList.remove("is-blinking");
    void brandMark.offsetWidth;
    brandMark.classList.add("is-blinking");
    await wait(440);
    brandMark.classList.remove("is-blinking");
  }

  function enableInteractiveLogo() {
    markRig.classList.add("is-settled");

    let busy = false;
    markRig.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      await triggerBlink();
      busy = false;
    });

    markRig.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch" || busy) return;
      busy = true;
      triggerBlink().finally(() => {
        busy = false;
      });
    });
  }

  function initCapsuleParticles() {
    if (!particlesCanvas || prefersReducedMotion) return;
    const ctx = particlesCanvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const particles = [];
    const count = 26;

    function resize() {
      const rect = particlesCanvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      particlesCanvas.width = Math.round(width * dpr);
      particlesCanvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawn(randomY = false) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + 4 + Math.random() * 14,
        r: 0.9 + Math.random() * 1.9,
        vx: (Math.random() - 0.35) * 0.24,
        vy: -(0.16 + Math.random() * 0.34),
        baseAlpha: 0.22 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.015 + Math.random() * 0.025,
      };
    }

    resize();
    for (let i = 0; i < count; i += 1) {
      particles.push(spawn(true));
    }

    window.addEventListener("resize", resize);

    function tick() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.twinkle;

        if (p.y < -8 || p.x < -8 || p.x > width + 8) {
          particles[i] = spawn(false);
          continue;
        }

        const edgeFade = Math.min(1, p.y / 18, (height - p.y) / 14);
        const alpha = Math.max(0, p.baseAlpha * (0.65 + 0.35 * Math.sin(p.phase)) * edgeFade);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (lockedTile) {
    lockedTile.addEventListener("click", () => {
      lockedTile.classList.remove("is-shaking");
      void lockedTile.offsetWidth;
      lockedTile.classList.add("is-shaking");
    });

    lockedTile.addEventListener("animationend", () => {
      lockedTile.classList.remove("is-shaking");
    });
  }

  async function runIntro() {
    if (document.fonts && document.fonts.ready) {
      await Promise.race([document.fonts.ready, wait(450)]);
    }

    initCapsuleParticles();

    if (prefersReducedMotion) {
      body.classList.remove("is-intro");
      body.classList.add("is-revealed", "is-ready");
      brandMark.classList.add("is-drawn", "is-dots-in");
      markRig.style.setProperty("--intro-scale", "1");
      enableInteractiveLogo();
      return;
    }

    // Center brand mark in viewport
    positionAtViewportCenter(1.36);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 1. Precision frame locks in + diagonal slash draws itself cleanly
    if (markFrame) markFrame.classList.add("is-active");
    brandMark.classList.add("is-drawing");
    await wait(460);

    // 2. Two dots of ':' spring into existence sequentially
    brandMark.classList.add("is-dots-in");
    await wait(460);
    brandMark.classList.add("is-drawn");

    // 3. Signature brand moment: the mark "wakes up" with a crisp blink + slash nod
    await triggerBlink();
    await wait(140);

    // Dismiss viewfinder frame and smoothly ascend to header
    if (markFrame) {
      markFrame.classList.remove("is-active");
      markFrame.classList.add("is-dismissed");
    }

    markRig.classList.add("is-ascending");
    markRig.style.setProperty("--intro-x", "0px");
    markRig.style.setProperty("--intro-y", "0px");
    markRig.style.setProperty("--intro-scale", "1");

    // 4. Overlap editorial masked typography, TG capsule & 3 squircle tiles reveal
    await wait(280);
    body.classList.remove("is-intro");
    body.classList.add("is-revealed");

    await wait(1000);
    markRig.classList.remove("is-ascending");
    body.classList.add("is-ready");
    enableInteractiveLogo();
  }

  runIntro();
})();
