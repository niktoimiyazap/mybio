(() => {
  const body = document.body;
  const markRig = document.getElementById("markRig");
  const markFrame = document.getElementById("markFrame");
  const brandMark = document.getElementById("brandMark");
  const lockedTile = document.getElementById("lockedTile");

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
