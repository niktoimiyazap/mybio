(() => {
  const stage = document.querySelector('[data-skill-physics]');
  if (!stage || !window.Matter) return;

  const { Engine, Bodies, Body, Composite, Constraint } = Matter;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...stage.querySelectorAll('.skill')];
  const engine = Engine.create();
  engine.gravity.y = 1.05;

  let bodies = [];
  let walls = [];
  let raf = 0;
  let started = false;
  let dragged = null;
  let pointerOffset = { x: 0, y: 0 };
  let pointerHistory = [];
  let dragConstraint = null;

  const sync = () => {
    bodies.forEach(({ body, element }) => {
      element.style.transform = `translate3d(${body.position.x - body._w / 2}px, ${body.position.y - body._h / 2}px, 0) rotate(${body.angle}rad)`;
    });
  };

  const tick = () => {
    Engine.update(engine, 1000 / 60);
    sync();
    raf = requestAnimationFrame(tick);
  };

  const makeWalls = () => {
    walls.forEach((wall) => Composite.remove(engine.world, wall));
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    const thick = 80;
    walls = [
      Bodies.rectangle(-thick / 2, height / 2, thick, height * 2, { isStatic: true }),
      Bodies.rectangle(width + thick / 2, height / 2, thick, height * 2, { isStatic: true }),
      Bodies.rectangle(width / 2, height + thick / 2 - 4, width * 2, thick, { isStatic: true })
    ];
    Composite.add(engine.world, walls);
  };

  const build = () => {
    cancelAnimationFrame(raf);
    Composite.clear(engine.world, false, true);
    bodies = [];
    walls = [];
    makeWalls();

    const width = stage.clientWidth;
    const compact = width < 620;

    items.forEach((element, index) => {
      element.style.transform = 'none';
      const rect = element.getBoundingClientRect();
      const w = Math.ceil(rect.width);
      const h = Math.ceil(rect.height);
      const x = Math.max(w / 2 + 8, Math.min(width - w / 2 - 8, (index + 0.5) * width / items.length + (Math.random() - 0.5) * 70));
      const y = -40 - index * (compact ? 14 : 20);
      const body = Bodies.rectangle(x, y, w, h, {
        restitution: 0.58,
        friction: 0.18,
        frictionAir: 0.009,
        density: 0.0012,
        chamfer: { radius: Math.min(h / 2, 18) }
      });
      body._w = w;
      body._h = h;
      Body.setAngle(body, (Math.random() - 0.5) * 0.22);
      bodies.push({ body, element });
      Composite.add(engine.world, body);
    });

    if (reduceMotion) {
      for (let i = 0; i < 180; i += 1) Engine.update(engine, 1000 / 60);
      sync();
      return;
    }

    tick();
  };

  const pointerPosition = (event) => {
    const rect = stage.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  items.forEach((element) => {
    element.addEventListener('pointerdown', (event) => {
      const entry = bodies.find((item) => item.element === element);
      if (!entry) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      const point = pointerPosition(event);
      dragged = entry;
      pointerOffset = { x: entry.body.position.x - point.x, y: entry.body.position.y - point.y };
      Body.setVelocity(entry.body, { x: 0, y: 0 });
      Body.setAngularVelocity(entry.body, 0);
      dragConstraint = Constraint.create({
        pointA: { x: point.x + pointerOffset.x, y: point.y + pointerOffset.y },
        bodyB: entry.body,
        pointB: { x: 0, y: 0 },
        stiffness: 0.18,
        damping: 0.12,
        length: 0
      });
      Composite.add(engine.world, dragConstraint);
      pointerHistory = [{ x: point.x, y: point.y, t: performance.now() }];
      element.classList.add('is-dragging');
    });

    element.addEventListener('pointermove', (event) => {
      if (!dragged || dragged.element !== element) return;
      const point = pointerPosition(event);
      const x = Math.max(dragged.body._w / 2, Math.min(stage.clientWidth - dragged.body._w / 2, point.x + pointerOffset.x));
      const y = Math.max(dragged.body._h / 2, Math.min(stage.clientHeight - dragged.body._h / 2, point.y + pointerOffset.y));
      if (dragConstraint) {
        dragConstraint.pointA.x = x;
        dragConstraint.pointA.y = y;
      }
      const now = performance.now();
      pointerHistory.push({ x: point.x, y: point.y, t: now });
      if (pointerHistory.length > 6) pointerHistory.shift();
    });

    const release = (event) => {
      if (!dragged || dragged.element !== element) return;
      if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);
      if (dragConstraint) {
        Composite.remove(engine.world, dragConstraint);
        dragConstraint = null;
      }
      const last = pointerHistory[pointerHistory.length - 1];
      const first = pointerHistory[0];
      if (first && last && last.t > first.t) {
        const dt = Math.max(16, last.t - first.t);
        const vx = ((last.x - first.x) / dt) * 16.666;
        const vy = ((last.y - first.y) / dt) * 16.666;
        Body.setVelocity(dragged.body, {
          x: Math.max(-22, Math.min(22, vx)),
          y: Math.max(-22, Math.min(22, vy))
        });
        Body.setAngularVelocity(dragged.body, Math.max(-0.22, Math.min(0.22, vx * 0.012)));
      }
      element.classList.remove('is-dragging');
      dragged = null;
      pointerHistory = [];
    };

    element.addEventListener('pointerup', release);
    element.addEventListener('pointercancel', release);
  });

  const observer = new IntersectionObserver((entries) => {
    if (started || !entries.some((entry) => entry.isIntersecting)) return;
    started = true;
    build();
    observer.disconnect();
  }, { threshold: 0.12 });

  observer.observe(stage);

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (!started) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 160);
  }, { passive: true });
})();