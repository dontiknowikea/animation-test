/**
 * Tempest Client Loading Splash
 * Procedural 2D canvas animation with progress-driven stages.
 * No libraries, no images. Plain JS and canvas.
 */

(function() {
  const SPLASH = {
    canvas: null,
    ctx: null,
    container: null,
    animationId: null,
    lastFrameTime: 0,
    visible: true,
    progress: 0, // 0-100
    stage: 0, // 0-5, matched to progress ranges
    stageStartTime: 0,
    stageStartProgress: 0,
    statusText: 'Initializing...',
    eaglerBootText: '',
    bootPct: 0,
    bgSumRatio: 0,
    bgSumStartTime: null,
    titleScreenInitTime: null,
    finishTime: null,
    fadeStartTime: null,
    consoleWrapped: false,
    originalConsole: { log: null, info: null, warn: null, error: null },
    prefersReducedMotion: false,
    resizeObserver: null,
    targetWidth: 960, // max render width
    targetHeight: 540, // scale proportionally
    particlesLoaded: false,
  };

  const COLORS = {
    bg: '#0f1115',
    panel: '#181b22',
    line: '#2a2f3a',
    text: '#e6e9ee',
    muted: '#9aa4b2',
    accent: '#6ea8ff',
  };

  // ======= INITIALIZATION =======
  function init() {
    SPLASH.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Create canvas
    SPLASH.canvas = document.createElement('canvas');
    SPLASH.canvas.id = 'tempest-splash';
    SPLASH.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10;
      display: block;
      background: ${COLORS.bg};
    `;
    document.body.appendChild(SPLASH.canvas);
    SPLASH.ctx = SPLASH.canvas.getContext('2d', { alpha: false, desynchronized: true });

    // Set initial size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Hide Microsoft sign-in and boot status during splash
    document.body.classList.add('tempest-splash-active');

    // Wrap console for progress signals
    wrapConsole();

    // Hook __eaglerBoot
    window.__eaglerBoot = eaglerBoot;

    // Start animation loop
    loop();
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(window.innerWidth, SPLASH.targetWidth * 2);
    const h = Math.min(window.innerHeight, SPLASH.targetHeight * 2);
    SPLASH.canvas.width = w * dpr;
    SPLASH.canvas.height = h * dpr;
    SPLASH.canvas.style.width = w + 'px';
    SPLASH.canvas.style.height = h + 'px';
    SPLASH.ctx.scale(dpr, dpr);
  }

  // ======= PROGRESS & SIGNALS =======
  function eaglerBoot(pct, text) {
    SPLASH.bootPct = Math.min(pct, 100);
    if (text) SPLASH.eaglerBootText = text;
    updateProgress();
  }

  function wrapConsole() {
    if (SPLASH.consoleWrapped) return;
    SPLASH.consoleWrapped = true;
    
    const orig = { log: console.log, info: console.info, warn: console.warn, error: console.error };
    SPLASH.originalConsole = orig;

    const checkLine = (msg) => {
      const s = String(msg);
      if (s.includes('[LOAD] overlay none -> LoadingOverlay')) {
        SPLASH.progress = Math.max(SPLASH.progress, 20);
        updateProgress();
      } else if (s.includes('[BGSUM]')) {
        const m = s.match(/done=(\d+)\s+started=(\d+)/);
        if (m) {
          const done = parseInt(m[1], 10);
          const started = parseInt(m[2], 10);
          if (started > 0) {
            SPLASH.bgSumRatio = Math.min(done / started, 1);
            if (!SPLASH.bgSumStartTime) SPLASH.bgSumStartTime = performance.now();
          }
        }
        updateProgress();
      } else if (s.includes('[LOAD] TitleScreen.init')) {
        if (!SPLASH.titleScreenInitTime) SPLASH.titleScreenInitTime = performance.now();
        SPLASH.progress = Math.max(SPLASH.progress, 95);
        updateProgress();
      } else if (s.includes('[LOAD] overlay LoadingOverlay -> none')) {
        finish();
      }
    };

    console.log = function(...args) { args.forEach(checkLine); return orig.log.apply(console, args); };
    console.info = function(...args) { args.forEach(checkLine); return orig.info.apply(console, args); };
    console.warn = function(...args) { args.forEach(checkLine); return orig.warn.apply(console, args); };
    console.error = function(...args) { args.forEach(checkLine); return orig.error.apply(console, args); };
  }

  function updateProgress() {
    let p = SPLASH.bootPct; // 0-20% from __eaglerBoot
    if (SPLASH.bgSumStartTime && SPLASH.bgSumRatio > 0) {
      const bgPct = 20 + (SPLASH.bgSumRatio * 75); // 20-95%
      p = Math.max(p, Math.min(bgPct, 95));
    }
    SPLASH.progress = Math.max(SPLASH.progress, p);

    // Safety timeouts
    const now = performance.now();
    if (SPLASH.titleScreenInitTime) {
      const sinceInit = now - SPLASH.titleScreenInitTime;
      if (sinceInit > 6000) SPLASH.progress = 100; // 6s after TitleScreen.init
    }
    if (SPLASH.stageStartTime === 0) SPLASH.stageStartTime = now;
    if (now - SPLASH.stageStartTime > 180000) SPLASH.progress = 100; // 180s max

    updateStage();
    updateStatus();
  }

  function updateStage() {
    const p = SPLASH.progress;
    let newStage = 0;
    if (p < 15) newStage = 0;
    else if (p < 35) newStage = 1;
    else if (p < 55) newStage = 2;
    else if (p < 75) newStage = 3;
    else if (p < 90) newStage = 4;
    else newStage = 5;

    if (newStage !== SPLASH.stage) {
      SPLASH.stage = newStage;
      SPLASH.stageStartTime = performance.now();
      SPLASH.stageStartProgress = SPLASH.progress;
    }
  }

  function updateStatus() {
    if (SPLASH.eaglerBootText) {
      SPLASH.statusText = SPLASH.eaglerBootText;
    } else {
      const p = SPLASH.progress;
      if (p < 20) SPLASH.statusText = 'Waking the storm...';
      else if (p < 55) SPLASH.statusText = 'Loading textures';
      else if (p < 75) SPLASH.statusText = 'Building block models';
      else if (p < 100) SPLASH.statusText = 'Almost there';
      else SPLASH.statusText = 'Ready';
    }
  }

  function finish() {
    if (SPLASH.finishTime) return;
    SPLASH.finishTime = performance.now();
    SPLASH.progress = 100;
    updateStage();
  }

  // ======= RENDERING =======
  function loop() {
    const now = performance.now();
    const dt = now - SPLASH.lastFrameTime;

    // Cap at 30 fps
    if (dt < 33.33 && SPLASH.lastFrameTime > 0) {
      SPLASH.animationId = requestAnimationFrame(loop);
      return;
    }
    SPLASH.lastFrameTime = now;

    if (SPLASH.visible) {
      const w = SPLASH.canvas.width / (window.devicePixelRatio || 1);
      const h = SPLASH.canvas.height / (window.devicePixelRatio || 1);
      render(w, h, now);
    }

    // Check if we should hide
    if (SPLASH.finishTime && now - SPLASH.finishTime > 800) {
      cleanup();
      return;
    }

    SPLASH.animationId = requestAnimationFrame(loop);
  }

  function render(w, h, now) {
    const ctx = SPLASH.ctx;
    ctx.clearRect(0, 0, w, h);

    // Draw stages
    const p = SPLASH.progress;
    const stageProg = getStageProgress(); // 0-1 within current stage

    if (SPLASH.stage === 0) renderClearSky(ctx, w, h, stageProg, now);
    else if (SPLASH.stage === 1) renderCloudForming(ctx, w, h, stageProg, now);
    else if (SPLASH.stage === 2) renderCyclone(ctx, w, h, stageProg, now);
    else if (SPLASH.stage === 3) renderRain(ctx, w, h, stageProg, now);
    else if (SPLASH.stage === 4) renderNight(ctx, w, h, stageProg, now);
    else if (SPLASH.stage === 5) renderSunny(ctx, w, h, stageProg, now);

    // Draw always-on UI
    drawLogo(ctx, w, h, now);
    drawWordmark(ctx, w, h);
    drawProgressBar(ctx, w, h, p);
    drawStatus(ctx, w, h);

    // Fade out if finishing
    if (SPLASH.finishTime) {
      const fadeProgress = (now - SPLASH.finishTime) / 800;
      ctx.fillStyle = `rgba(15, 17, 21, ${fadeProgress})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  function getStageProgress() {
    // Returns 0-1 progress within current stage
    const p = SPLASH.progress;
    const boundaries = [0, 15, 35, 55, 75, 90, 100];
    const start = boundaries[SPLASH.stage];
    const end = boundaries[SPLASH.stage + 1] || 100;
    return Math.max(0, Math.min(1, (p - start) / (end - start)));
  }

  // ======= STAGE RENDERERS =======
  function renderClearSky(ctx, w, h, prog, now) {
    // Soft blue gradient, thin cloud wisps drifting
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#2a5f9e');
    grd.addColorStop(1, '#5a90d9');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Draw a few drifting cloud wisps
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    const time = now / 3000; // Slow drift
    for (let i = 0; i < 3; i++) {
      const x = (w * (0.2 + i * 0.3) + time * w * 0.1) % w;
      const y = h * (0.2 + i * 0.15);
      drawCloudWisp(ctx, x, y, 80 + i * 20);
    }
  }

  function renderCloudForming(ctx, w, h, prog, now) {
    // Sky grey, clouds thicken and drift toward centre
    const skybg = Math.round(42 + (90 - 42) * prog); // from #2a5f9e to #5a5a5a
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, `rgb(${Math.round(42 + 90 * prog)}, ${Math.round(95 + 50 * prog)}, ${Math.round(158 - 80 * prog)})`);
    grd.addColorStop(1, `rgb(${Math.round(90 + 30 * prog)}, ${Math.round(144 - 50 * prog)}, ${Math.round(217 - 100 * prog)})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 + prog * 0.12})`;
    const centerX = w / 2;
    const centerY = h / 2;
    const time = now / 2000;
    for (let i = 0; i < 5; i++) {
      const angle = (time + i) * Math.PI * 2 / 5;
      const dist = 200 - prog * 150;
      const x = centerX + Math.cos(angle) * dist;
      const y = centerY + Math.sin(angle) * dist;
      drawCloudWisp(ctx, x, y, 100 + prog * 50);
    }
  }

  function renderCyclone(ctx, w, h, prog, now) {
    // Dark sky, spiralling clouds, wind streaks, occasional lightning
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, `rgb(${Math.round(60 - prog * 30)}, ${Math.round(100 - prog * 50)}, ${Math.round(140 - prog * 60)})`);
    grd.addColorStop(1, `rgb(${Math.round(120 - prog * 40)}, ${Math.round(80 - prog * 40)}, ${Math.round(120 - prog * 60)})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const time = now / 1500;
    const spin = SPLASH.prefersReducedMotion ? 0 : time;

    // Spiralling clouds
    ctx.fillStyle = `rgba(200, 220, 240, ${0.15 + prog * 0.1})`;
    for (let i = 0; i < 12; i++) {
      const angle = spin + (i / 12) * Math.PI * 2;
      const radius = 100 + Math.sin(time + i) * 40;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      drawCloudPuff(ctx, x, y, 60 + prog * 30);
    }

    // Wind streaks
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 + prog * 0.05})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const angle = spin + (i / 8) * Math.PI * 2;
      const x1 = centerX + Math.cos(angle) * 120;
      const y1 = centerY + Math.sin(angle) * 120;
      const x2 = centerX + Math.cos(angle) * 200;
      const y2 = centerY + Math.sin(angle) * 200;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Occasional lightning
    if (!SPLASH.prefersReducedMotion) {
      const flash = Math.sin(time * 3) > 0.8 ? 1 : 0;
      if (flash > 0) {
        ctx.fillStyle = `rgba(255, 255, 200, ${flash * 0.3})`;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  function renderRain(ctx, w, h, prog, now) {
    // Cyclone breaks into heavy rain, splashes at bottom
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    const c1 = Math.round(30 - prog * 10);
    const c2 = Math.round(50 - prog * 20);
    grd.addColorStop(0, `rgb(${c1}, ${c1 + 20}, ${c1 + 40})`);
    grd.addColorStop(1, `rgb(${c2}, ${c2 + 10}, ${c2 + 30})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    const time = now / 500;
    // Heavy diagonal rain
    ctx.strokeStyle = `rgba(200, 220, 240, ${0.3 + prog * 0.2})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() * w + time * 100) % w;
      const y = (Math.random() * h + time * 200) % h;
      const angle = Math.PI / 6;
      const len = 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * Math.cos(angle), y + len * Math.sin(angle));
      ctx.stroke();
    }

    // Splashes at bottom
    ctx.fillStyle = `rgba(200, 220, 240, ${0.15 + prog * 0.1})`;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * w;
      const y = h - 30 + Math.random() * 20;
      ctx.beginPath();
      ctx.arc(x, y, 3 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function renderNight(ctx, w, h, prog, now) {
    // Deep navy sky, stars, crescent moon, rain eases
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    const c = Math.round(20 - prog * 5);
    grd.addColorStop(0, `rgb(${c}, ${c + 10}, ${c + 30})`);
    grd.addColorStop(1, `rgb(${c + 10}, ${c + 5}, ${c + 20})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = `rgba(255, 255, 255, ${0.8 - prog * 0.3})`;
    for (let i = 0; i < 50; i++) {
      const seed = i * 12345;
      const x = ((seed * 73856093) ^ w) % w;
      const y = ((seed * 19349663) ^ h) % h;
      const sz = 0.5 + (seed % 10) / 20;
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crescent moon
    const moonX = w * 0.75;
    const moonY = h * 0.25;
    const moonRadius = 40;
    ctx.fillStyle = `rgba(255, 250, 200, ${0.9 - prog * 0.4})`;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(moonX + 15, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fading rain
    ctx.strokeStyle = `rgba(200, 220, 240, ${(0.3 - prog * 0.3) * Math.max(0, 1 - prog)})`;
    ctx.lineWidth = 1;
    const time = now / 500;
    for (let i = 0; i < 30; i++) {
      const x = (Math.random() * w + time * 80) % w;
      const y = (Math.random() * h + time * 160) % h;
      const angle = Math.PI / 6;
      const len = 25;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + len * Math.cos(angle), y + len * Math.sin(angle));
      ctx.stroke();
    }
  }

  function renderSunny(ctx, w, h, prog, now) {
    // Sunrise glow, clouds clear, sun rays
    let c1, c2;
    if (prog < 0.5) {
      // Warm gold
      c1 = `rgb(${Math.round(100 + prog * 40)}, ${Math.round(70 + prog * 60)}, ${Math.round(30)})`;
      c2 = `rgb(${Math.round(200 + prog * 20)}, ${Math.round(140 + prog * 40)}, ${Math.round(80)})`;
    } else {
      // Blue
      c1 = `rgb(${Math.round(140 - (prog - 0.5) * 80)}, ${Math.round(130 + (prog - 0.5) * 40)}, ${Math.round(30 + (prog - 0.5) * 120)})`;
      c2 = `rgb(${Math.round(220 - (prog - 0.5) * 60)}, ${Math.round(180 - (prog - 0.5) * 60)}, ${Math.round(80 + (prog - 0.5) * 100)})`;
    }
    const grd = ctx.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, c1);
    grd.addColorStop(1, c2);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);

    // Sun rays (if prog > 0.5)
    if (prog > 0.5) {
      const rayProg = (prog - 0.5) * 2;
      ctx.strokeStyle = `rgba(255, 255, 200, ${0.3 * rayProg})`;
      ctx.lineWidth = 2;
      const sunX = w * 0.2;
      const sunY = h * 0.2;
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = sunX + Math.cos(angle) * 60;
        const y1 = sunY + Math.sin(angle) * 60;
        const x2 = sunX + Math.cos(angle) * 120;
        const y2 = sunY + Math.sin(angle) * 120;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    // Clearing clouds (alpha fades)
    ctx.fillStyle = `rgba(200, 220, 240, ${0.1 * (1 - prog)})`;
    const centerX = w / 2;
    const centerY = h / 2;
    for (let i = 0; i < 5; i++) {
      const x = centerX + (Math.random() - 0.5) * w * 0.3;
      const y = centerY + (Math.random() - 0.5) * h * 0.3;
      drawCloudPuff(ctx, x, y, 80);
    }
  }

  // ======= LOGO & UI =======
  function drawLogo(ctx, w, h, now) {
    const size = Math.min(w, h) * 0.15;
    const x = w / 2;
    const y = h / 2 - 50;

    ctx.save();
    ctx.translate(x, y);

    // Gentle spin (faster during cyclone stage)
    if (!SPLASH.prefersReducedMotion) {
      let spin = now / 6000;
      if (SPLASH.stage === 2) spin = now / 3000; // Cyclone spins faster
      ctx.rotate(spin);
    }

    // Draw logo (four curved blades)
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate((i / 4) * Math.PI * 2);
      drawBlade(ctx, size);
      ctx.restore();
    }

    ctx.restore();

    // Glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowColor = 'transparent';
  }

  function drawBlade(ctx, size) {
    // One blade: thick inner end, curves outward, tapers to point
    // Starts at center (y=0), bends right, tip at ~1-2 o'clock
    const innerW = size * 0.1;
    const outerR = size * 0.45;
    ctx.beginPath();
    // Start at top center, squared-off inner end
    ctx.moveTo(-innerW / 2, 0);
    ctx.lineTo(innerW / 2, 0);
    // Bezier to outer tip (right and up)
    ctx.bezierCurveTo(
      innerW / 2, outerR * 0.3,
      outerR * 0.7, outerR * 0.8,
      outerR * 0.9, outerR
    );
    // Curve back to center (inner end tapers)
    ctx.bezierCurveTo(
      outerR * 0.4, outerR * 0.4,
      -innerW / 2, outerR * 0.3,
      -innerW / 2, 0
    );
    ctx.fill();
  }

  function drawWordmark(ctx, w, h) {
    ctx.font = '800 48px system-ui, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.letterSpacing = '0.15em';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 10;
    ctx.fillText('TEMPEST CLIENT', w / 2, h / 2 + 30);
    ctx.shadowColor = 'transparent';
  }

  function drawProgressBar(ctx, w, h, progress) {
    const barW = 200;
    const barH = 4;
    const x = (w - barW) / 2;
    const y = h / 2 + 100;

    // Track
    ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
    ctx.fillRect(x, y, barW, barH);

    // Fill
    ctx.fillStyle = COLORS.accent;
    ctx.fillRect(x, y, barW * (progress / 100), barH);
  }

  function drawStatus(ctx, w, h) {
    ctx.font = '14px system-ui, "Segoe UI", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(SPLASH.statusText, w / 2, h / 2 + 115);
  }

  function drawCloudWisp(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y, size * 0.4, 0, Math.PI * 2);
    ctx.arc(x, y - size * 0.2, size * 0.5, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCloudPuff(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x - size * 0.4, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x, y - size * 0.3, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.4, y, size * 0.35, 0, Math.PI * 2);
    ctx.arc(x, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // ======= CLEANUP =======
  function cleanup() {
    SPLASH.visible = false;
    if (SPLASH.animationId) cancelAnimationFrame(SPLASH.animationId);
    if (SPLASH.canvas) {
      SPLASH.canvas.remove();
      SPLASH.canvas = null;
    }
    document.body.classList.remove('tempest-splash-active');
    
    // Restore console
    if (SPLASH.consoleWrapped && SPLASH.originalConsole.log) {
      console.log = SPLASH.originalConsole.log;
      console.info = SPLASH.originalConsole.info;
      console.warn = SPLASH.originalConsole.warn;
      console.error = SPLASH.originalConsole.error;
    }
  }

  // ======= START =======
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
