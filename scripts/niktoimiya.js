(() => {
  const body = document.body;
  const markRig = document.getElementById("markRig");
  const markStage = document.getElementById("markStage");
  const markFx = document.getElementById("markFx");
  const markEcho = document.getElementById("markEcho");
  const glyphSlash = document.getElementById("glyphSlash");
  const glyphColon = document.getElementById("glyphColon");
  const lockedTile = document.getElementById("lockedTile");

  if (!markRig || !markStage || !glyphSlash || !glyphColon) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
  const easeInOutQuart = (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);
  const easeOutBack = (t) => {
    const c1 = 1.35;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  function tween(duration, onUpdate, easing = easeInOutQuart) {
    return new Promise((resolve) => {
      const start = performance.now();
      function frame(now) {
        const raw = Math.min(1, (now - start) / duration);
        onUpdate(easing(raw), raw);
        if (raw < 1) {
          requestAnimationFrame(frame);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(frame);
    });
  }

  let swapDxSlash = 28;
  let swapDxColon = -28;
  let isSwapped = false;

  function measureSwapOffsets() {
    glyphSlash.style.setProperty("--gx", "0px");
    glyphSlash.style.setProperty("--gy", "0px");
    glyphColon.style.setProperty("--gx", "0px");
    glyphColon.style.setProperty("--gy", "0px");

    const slashRect = glyphSlash.getBoundingClientRect();
    const colonRect = glyphColon.getBoundingClientRect();

    swapDxSlash = colonRect.right - slashRect.right;
    swapDxColon = slashRect.left - colonRect.left;

    if (isSwapped) {
      glyphSlash.style.setProperty("--gx", `${swapDxSlash.toFixed(1)}px`);
      glyphColon.style.setProperty("--gx", `${swapDxColon.toFixed(1)}px`);
    }
  }

  function positionAtViewportCenter(scale = 0.86) {
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

  function triggerPulse(symbolText) {
    if (!markFx) return;
    if (markEcho && symbolText) {
      markEcho.textContent = symbolText;
    }
    markFx.classList.remove("is-pulsing");
    void markFx.offsetWidth;
    markFx.classList.add("is-pulsing");
  }

  async function animateSwap(toSwapped, duration = 760) {
    markStage.classList.add("is-animating");

    const startSlash = isSwapped ? swapDxSlash : 0;
    const endSlash = toSwapped ? swapDxSlash : 0;
    const startColon = isSwapped ? swapDxColon : 0;
    const endColon = toSwapped ? swapDxColon : 0;

    await tween(
      duration,
      (eased, raw) => {
        const arc = Math.sin(raw * Math.PI);
        const sx = startSlash + (endSlash - startSlash) * eased;
        const cx = startColon + (endColon - startColon) * eased;
        const stretchX = 1 + arc * 0.09;
        const stretchY = 1 - arc * 0.05;
        const tilt = toSwapped ? arc * 9 : -arc * 9;

        glyphSlash.style.setProperty("--gx", `${sx.toFixed(2)}px`);
        glyphSlash.style.setProperty("--gy", `${(-arc * 7).toFixed(2)}px`);
        glyphSlash.style.setProperty("--rot", `${tilt.toFixed(2)}deg`);
        glyphSlash.style.setProperty("--sx", stretchX.toFixed(3));
        glyphSlash.style.setProperty("--sy", stretchY.toFixed(3));

        glyphColon.style.setProperty("--gx", `${cx.toFixed(2)}px`);
        glyphColon.style.setProperty("--gy", `${(arc * 7).toFixed(2)}px`);
        glyphColon.style.setProperty("--sx", stretchX.toFixed(3));
        glyphColon.style.setProperty("--sy", stretchY.toFixed(3));
      },
      easeInOutQuart
    );

    glyphSlash.style.setProperty("--gy", "0px");
    glyphSlash.style.setProperty("--rot", "0deg");
    glyphSlash.style.setProperty("--sx", "1");
    glyphSlash.style.setProperty("--sy", "1");
    glyphColon.style.setProperty("--gy", "0px");
    glyphColon.style.setProperty("--sx", "1");
    glyphColon.style.setProperty("--sy", "1");

    isSwapped = toSwapped;
    markStage.classList.remove("is-animating");
  }

  function enableInteractiveLogo() {
    markRig.classList.add("is-settled");

    let busy = false;
    markRig.addEventListener("click", async () => {
      if (busy) return;
      busy = true;
      const next = !isSwapped;
      triggerPulse(next ? ":\\" : "\\:");
      await animateSwap(next, 680);
      busy = false;
    });
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
      await Promise.race([document.fonts.ready, wait(500)]);
    }

    measureSwapOffsets();

    if (prefersReducedMotion) {
      body.classList.remove("is-intro");
      body.classList.add("is-revealed", "is-ready");
      markRig.classList.add("is-visible");
      enableInteractiveLogo();
      return;
    }

    // Start dead-center in viewport as \:
    positionAtViewportCenter(0.84);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    // 1. Soft reveal \: at center with gentle settle to 1.08
    markRig.classList.add("is-visible");
    markRig.style.setProperty("--intro-scale", "1.08");
    await wait(780);

    // 2. Silky elastic swap: \: -> :\
    await animateSwap(true, 760);
    await wait(110);

    // 3. Kinetic pulse bloom + expressive slash wink + snap back to \:
    triggerPulse(":\\");
    markStage.classList.add("is-animating");
    await tween(
      760,
      (t, raw) => {
        const pop = 1 + t * 0.44;
        const wink = Math.sin(raw * Math.PI) * -14;
        markStage.style.setProperty("--pop", pop.toFixed(4));
        glyphSlash.style.setProperty("--rot", `${wink.toFixed(2)}deg`);
      },
      easeOutBack
    );
    glyphSlash.style.setProperty("--rot", "0deg");
    markStage.classList.remove("is-animating");

    await wait(120);

    // Smoothly swap back to \: while gliding scale back to 1
    triggerPulse("\\:");
    const swapBack = animateSwap(false, 720);
    const settleScale = tween(
      760,
      (t) => {
        const pop = 1.44 - t * 0.44;
        markStage.style.setProperty("--pop", pop.toFixed(4));
      },
      easeOutExpo
    );
    await Promise.all([swapBack, settleScale]);

    // 4. Glide up into the header slot & choreograph masked copy + tiles reveal
    markRig.classList.add("is-ascending");
    markRig.style.setProperty("--intro-x", "0px");
    markRig.style.setProperty("--intro-y", "0px");
    markRig.style.setProperty("--intro-scale", "1");

    await wait(290);
    body.classList.remove("is-intro");
    body.classList.add("is-revealed");

    await wait(1020);
    markRig.classList.remove("is-ascending");
    body.classList.add("is-ready");
    enableInteractiveLogo();
  }

  window.addEventListener("resize", () => {
    measureSwapOffsets();
  });

  runIntro();
})();
