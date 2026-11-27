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
        r: 0.7 + Math.random() * 1.35,
        vx: (Math.random() - 0.35) * 0.18,
        vy: -(0.12 + Math.random() * 0.24),
        baseAlpha: 0.16 + Math.random() * 0.32,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.012 + Math.random() * 0.02,
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
        ctx.fillStyle = `rgba(34, 158, 235, ${(alpha * 0.72).toFixed(3)})`;
        ctx.fill();
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function initTelegramFeed() {
    const listEl = document.getElementById("tgFeedList");
    const subsEl = document.getElementById("tgFeedSubs");
    if (!listEl) return;

    const CHANNEL = "nktpub";
    const CACHE_KEY = "nktpub_tg_feed_v1";
    const CACHE_TTL = 10 * 60 * 1000;
    const TARGET_URL = `https://t.me/s/${CHANNEL}`;
    const PROXIES = [
      (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u) => `https://corsproxy.io/?url=${encodeURIComponent(u)}`,
      (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    ];

    const dateFmt = new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "short",
    });

    function formatPostDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      return dateFmt.format(d).replace(/\.$/, "");
    }

    const SVG_NS = "http://www.w3.org/2000/svg";

    function createSvgIcon(kind) {
      const svg = document.createElementNS(SVG_NS, "svg");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");

      if (kind === "clock") {
        svg.setAttribute("class", "tg-meta-ico");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("stroke-width", "1.5");
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", "8");
        c.setAttribute("cy", "8");
        c.setAttribute("r", "5.8");
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", "M8 4.8V8l2.2 1.3");
        svg.append(c, p);
      } else if (kind === "eye") {
        svg.setAttribute("class", "tg-meta-ico");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("stroke-width", "1.5");
        const p = document.createElementNS(SVG_NS, "path");
        p.setAttribute("d", "M1.8 8s2.3-4.2 6.2-4.2S14.2 8 14.2 8s-2.3 4.2-6.2 4.2S1.8 8 1.8 8Z");
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", "8");
        c.setAttribute("cy", "8");
        c.setAttribute("r", "1.8");
        svg.append(p, c);
      } else {
        svg.setAttribute("viewBox", "0 0 20 20");
        svg.setAttribute("stroke-width", "1.85");
        const p1 = document.createElementNS(SVG_NS, "path");
        p1.setAttribute("d", "M6 14 14 6");
        const p2 = document.createElementNS(SVG_NS, "path");
        p2.setAttribute("d", "M7.5 6H14v6.5");
        svg.append(p1, p2);
      }
      return svg;
    }

    function renderFeed(data) {
      if (!data || !Array.isArray(data.posts) || data.posts.length === 0) return;
      if (subsEl && data.subs) {
        subsEl.textContent = data.subs;
      }

      const frag = document.createDocumentFragment();
      data.posts.slice(0, 3).forEach((post) => {
        const link = document.createElement("a");
        link.className = "tg-post";
        link.href = post.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const bodyWrap = document.createElement("span");
        bodyWrap.className = "tg-post__body";

        const textEl = document.createElement("span");
        textEl.className = "tg-post__text";
        textEl.textContent = post.text;

        const metaEl = document.createElement("span");
        metaEl.className = "tg-post__meta";
        const formattedDate = formatPostDate(post.date);
        if (formattedDate) {
          const item = document.createElement("span");
          item.className = "tg-post__meta-item";
          const label = document.createElement("span");
          label.textContent = formattedDate;
          item.append(createSvgIcon("clock"), label);
          metaEl.appendChild(item);
        }
        if (post.views) {
          const item = document.createElement("span");
          item.className = "tg-post__meta-item";
          const label = document.createElement("span");
          label.textContent = post.views;
          item.append(createSvgIcon("eye"), label);
          metaEl.appendChild(item);
        }

        bodyWrap.appendChild(textEl);
        if (metaEl.childNodes.length > 0) bodyWrap.appendChild(metaEl);
        link.appendChild(bodyWrap);

        if (post.thumb) {
          const img = document.createElement("img");
          img.className = "tg-post__thumb";
          img.src = post.thumb;
          img.alt = "";
          img.loading = "lazy";
          img.decoding = "async";
          img.referrerPolicy = "no-referrer";
          link.appendChild(img);
        }

        const arrow = document.createElement("span");
        arrow.className = "tg-post__arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.appendChild(createSvgIcon("arrow"));
        link.appendChild(arrow);

        frag.appendChild(link);
      });

      listEl.replaceChildren(frag);
    }

    function parseTelegramHtml(html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const subsNode = doc.querySelector(".tgme_channel_info_counter .counter_value");
      const subs = subsNode ? subsNode.textContent.trim() : "";

      const wraps = Array.from(doc.querySelectorAll(".tgme_widget_message_wrap"));
      const parsed = [];

      for (let i = wraps.length - 1; i >= 0 && parsed.length < 3; i -= 1) {
        const wrap = wraps[i];
        const msg = wrap.querySelector(".tgme_widget_message");
        if (!msg || msg.classList.contains("service_message")) continue;

        const postId = msg.getAttribute("data-post");
        if (!postId) continue;

        const textNode = msg.querySelector(".tgme_widget_message_text");
        let text = textNode ? textNode.textContent.replace(/\s+/g, " ").trim() : "";

        const photoNode = msg.querySelector(".tgme_widget_message_photo_wrap");
        const styleAttr = photoNode ? photoNode.getAttribute("style") || "" : "";
        const thumbMatch = styleAttr.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
        const thumb = thumbMatch ? thumbMatch[1] : "";

        if (!text) {
          if (msg.querySelector(".tgme_widget_message_video_player, .tgme_widget_message_roundvideo_player")) {
            text = "Видео в канале";
          } else if (photoNode) {
            text = "Фото в канале";
          } else if (msg.querySelector(".tgme_widget_message_voice_player")) {
            text = "Голосовое сообщение";
          } else {
            continue;
          }
        }

        const timeNode = msg.querySelector("time[datetime]");
        const viewsNode = msg.querySelector(".tgme_widget_message_views");

        parsed.push({
          url: `https://t.me/${postId}`,
          text,
          date: timeNode ? timeNode.getAttribute("datetime") || "" : "",
          views: viewsNode ? viewsNode.textContent.trim() : "",
          thumb,
        });
      }

      return parsed.length > 0 ? { subs, posts: parsed } : null;
    }

    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && cached.data && Date.now() - cached.ts < CACHE_TTL) {
          renderFeed(cached.data);
          return;
        }
      }
    } catch (_) {
      // Ignore storage errors
    }

    (async () => {
      for (const buildUrl of PROXIES) {
        const controller = new AbortController();
        const timer = window.setTimeout(() => controller.abort(), 7000);
        try {
          const res = await fetch(buildUrl(TARGET_URL), {
            signal: controller.signal,
            credentials: "omit",
          });
          window.clearTimeout(timer);
          if (!res.ok) continue;
          const html = await res.text();
          if (!html.includes("tgme_widget_message")) continue;
          const parsed = parseTelegramHtml(html);
          if (parsed) {
            renderFeed(parsed);
            try {
              window.localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: parsed }));
            } catch (_) {
              // Ignore storage errors
            }
            return;
          }
        } catch (_) {
          window.clearTimeout(timer);
        }
      }
    })();
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
    initTelegramFeed();

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
