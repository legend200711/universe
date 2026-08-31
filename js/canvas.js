/**
 * UNIVERSE CANVAS — Cinematic Visual Engine
 * Rain · Lightning · Particles · Fog · Crows
 * Respects prefers-reduced-motion and user toggle.
 */

const UniverseCanvas = (() => {
  const canvas = document.getElementById('universe-canvas');
  if (!canvas) return { init() {}, destroy() {} };

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let animId = null;
  let enabled = true;
  let lastLightning = 0;
  let lightningAlpha = 0;
  let lightningBolts = [];

  // ── Responsive resize ──────────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ── Detect low-end device ─────────────────────────────────────
  function isLowEnd() {
    const mem = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    if (mem && mem < 2) return true;
    if (cores && cores <= 2) return true;
    return false;
  }

  // ── Rain drops ────────────────────────────────────────────────
  const RAIN_COUNT = isLowEnd() ? 60 : 140;
  const drops = Array.from({ length: RAIN_COUNT }, () => ({
    x: Math.random() * 2000 - 500,
    y: Math.random() * 2000 - 200,
    speed: 8 + Math.random() * 8,
    length: 15 + Math.random() * 25,
    alpha: 0.05 + Math.random() * 0.2,
  }));

  function drawRain() {
    ctx.save();
    ctx.strokeStyle = 'rgba(80, 140, 255, 0.35)';
    ctx.lineWidth = 0.8;
    for (const d of drops) {
      d.y += d.speed;
      d.x -= 1.5;
      if (d.y > H + 50) { d.y = -50; d.x = Math.random() * W * 1.3; }
      ctx.globalAlpha = d.alpha;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.length * 0.15, d.y + d.length);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── Particles ─────────────────────────────────────────────────
  const PARTICLE_COUNT = isLowEnd() ? 20 : 50;
  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * 2000,
    y: Math.random() * 1000,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.1 - Math.random() * 0.3,
    size: 0.5 + Math.random() * 1.5,
    alpha: 0.1 + Math.random() * 0.4,
    life: Math.random(),
  }));

  function drawParticles() {
    ctx.save();
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.002;
      if (p.life <= 0 || p.y < -20) {
        p.x = Math.random() * W;
        p.y = H + 10;
        p.life = 0.6 + Math.random() * 0.4;
      }
      ctx.globalAlpha = p.alpha * p.life;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Lightning ─────────────────────────────────────────────────
  function makeLightningBolt(x1, y1, x2, y2, depth) {
    if (depth <= 0) return [{ x1, y1, x2, y2 }];
    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * (Math.abs(x2 - x1) * 0.6);
    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * 30;
    return [
      ...makeLightningBolt(x1, y1, mx, my, depth - 1),
      ...makeLightningBolt(mx, my, x2, y2, depth - 1),
    ];
  }

  function triggerLightning() {
    const x = W * 0.2 + Math.random() * W * 0.6;
    lightningBolts = makeLightningBolt(x, 0, x + (Math.random() - 0.5) * 200, H * 0.6, 5);
    lightningAlpha = 0.9;
  }

  function drawLightning() {
    if (lightningAlpha <= 0) return;
    ctx.save();
    ctx.strokeStyle = `rgba(120, 180, 255, ${lightningAlpha})`;
    ctx.lineWidth = lightningAlpha * 2;
    ctx.shadowColor = `rgba(80, 140, 255, ${lightningAlpha})`;
    ctx.shadowBlur = 15;
    for (const seg of lightningBolts) {
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
    }
    ctx.restore();
    lightningAlpha -= 0.06;
  }

  // ── Crows (SVG-inspired paths) ─────────────────────────────────
  const CROW_COUNT = isLowEnd() ? 2 : 5;
  const crows = Array.from({ length: CROW_COUNT }, (_, i) => ({
    x: Math.random() * W,
    y: 60 + Math.random() * 200,
    vx: 0.4 + Math.random() * 0.6,
    vy: (Math.random() - 0.5) * 0.15,
    wingPhase: Math.random() * Math.PI * 2,
    size: 0.8 + Math.random() * 0.5,
  }));

  function drawCrow(c) {
    const w = 14 * c.size;
    const h = 5 * c.size;
    const wf = Math.sin(c.wingPhase) * h;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.strokeStyle = 'rgba(20,30,55,0.9)';
    ctx.lineWidth = 1.2 * c.size;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.75;

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, 3 * c.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15,20,40,0.85)';
    ctx.fill();

    // Left wing
    ctx.beginPath();
    ctx.moveTo(-1, 0);
    ctx.quadraticCurveTo(-w * 0.5, -wf, -w, wf * 0.3);
    ctx.stroke();

    // Right wing
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.quadraticCurveTo(w * 0.5, -wf, w, wf * 0.3);
    ctx.stroke();

    ctx.restore();
  }

  function updateCrows() {
    for (const c of crows) {
      c.x += c.vx;
      c.y += c.vy + Math.sin(c.wingPhase * 0.3) * 0.2;
      c.wingPhase += 0.12;
      if (c.x > W + 60) {
        c.x = -60;
        c.y = 60 + Math.random() * 200;
      }
      drawCrow(c);
    }
  }

  // ── Fog overlay ───────────────────────────────────────────────
  let fogOffset = 0;
  function drawFog() {
    fogOffset += 0.15;
    const g = ctx.createLinearGradient(0, H * 0.7, 0, H);
    g.addColorStop(0, 'rgba(5,8,16,0)');
    g.addColorStop(1, 'rgba(5,8,16,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Animated wisps
    ctx.save();
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 3; i++) {
      const gx = ctx.createRadialGradient(
        W * 0.3 + i * W * 0.2 + Math.sin(fogOffset * 0.008 + i) * 80, H * 0.85, 0,
        W * 0.3 + i * W * 0.2 + Math.sin(fogOffset * 0.008 + i) * 80, H * 0.85, W * 0.3
      );
      gx.addColorStop(0, '#1e40af');
      gx.addColorStop(1, 'transparent');
      ctx.fillStyle = gx;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  // ── Main loop ─────────────────────────────────────────────────
  let frame = 0;
  function loop(ts) {
    if (!enabled) return;
    animId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);
    frame++;

    drawFog();
    drawRain();
    drawParticles();
    updateCrows();

    // Lightning trigger
    if (ts - lastLightning > 4000 + Math.random() * 8000) {
      triggerLightning();
      lastLightning = ts;
    }
    drawLightning();
  }

  // ── Public API ────────────────────────────────────────────────
  function init() {
    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Respect OS-level reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      disable();
      return;
    }

    animId = requestAnimationFrame(loop);
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    canvas.style.display = '';
    animId = requestAnimationFrame(loop);
  }

  function disable() {
    enabled = false;
    if (animId) cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, W, H);
    canvas.style.display = 'none';
  }

  function toggle() {
    enabled ? disable() : enable();
    return enabled;
  }

  function destroy() {
    if (animId) cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  }

  return { init, enable, disable, toggle, isEnabled: () => enabled };
})();

export default UniverseCanvas;
