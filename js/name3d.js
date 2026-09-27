/**
 * NIRANJAN P. — COMPUTATIONAL INTELLIGENCE LAB
 * 3D Interactive Kinetic Typography & Holographic Gyroscope
 */

(function () {
  'use strict';

  // Respect user's reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const container = document.getElementById('hero-name-wrap');
  const title = document.getElementById('hero-3d-name');
  const gyro = document.querySelector('.hero-gyro-3d');
  if (!container || !title) return;

  // Web Audio Synthesizer for high-tech micro-audio feedback
  let audioCtx = null;
  function playCyberChime(freq = 587.33, freq2 = 880) {
    try {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) audioCtx = new AudioContext();
      }
      if (!audioCtx || audioCtx.state === 'suspended') {
        audioCtx?.resume();
      }
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      
      const now = audioCtx.currentTime;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq2, now + 0.12);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_) {
      // Audio not permitted or blocked — silent fallback
    }
  }

  // 1. Split Text into Interactive 3D Characters
  const allChars = [];
  const lines = title.querySelectorAll('.name-line');
  
  lines.forEach((line) => {
    const rawText = line.getAttribute('data-text') || line.textContent.trim();
    line.innerHTML = '';
    
    for (let i = 0; i < rawText.length; i++) {
      const char = rawText[i];
      const span = document.createElement('span');
      span.className = 'char-3d';
      span.textContent = char;
      span.dataset.char = char;
      span.dataset.index = allChars.length;
      
      line.appendChild(span);
      allChars.push(span);
    }
  });

  // 2. Physics & Motion State
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currTiltX = 0;
  let currTiltY = 0;

  let mouseX = -9999;
  let mouseY = -9999;
  let isHovered = false;

  // Track pointer
  function updatePointer(clientX, clientY) {
    mouseX = clientX;
    mouseY = clientY;

    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (clientX - centerX) / (window.innerWidth * 0.4);
    const normY = (clientY - centerY) / (window.innerHeight * 0.4);

    // Clamp tilt angles
    targetTiltY = Math.max(-18, Math.min(18, normX * 18));
    targetTiltX = Math.max(-14, Math.min(14, -normY * 14));
  }

  window.addEventListener('mousemove', (e) => {
    updatePointer(e.clientX, e.clientY);
  }, { passive: true });

  container.addEventListener('mouseenter', () => {
    isHovered = true;
  });

  container.addEventListener('mouseleave', () => {
    isHovered = false;
    targetTiltX = 0;
    targetTiltY = 0;
    mouseX = -9999;
    mouseY = -9999;
  });

  // Touch Support
  container.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updatePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    targetTiltX = 0;
    targetTiltY = 0;
    mouseX = -9999;
    mouseY = -9999;
  });

  // 3. 3D Spark Particle Generator on Click
  function spawnSparks(x, y) {
    const sparkCount = 16;
    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      spark.className = 'name-spark';
      document.body.appendChild(spark);

      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;

      const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 65 + 35;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const isAmber = Math.random() > 0.6;
      if (isAmber) {
        spark.style.background = '#fbbf24';
        spark.style.boxShadow = '0 0 10px #fbbf24, 0 0 20px #f59e0b';
      }

      const duration = Math.random() * 400 + 400;
      const startTime = performance.now();

      function updateSpark(now) {
        const elapsed = now - startTime;
        const progress = elapsed / duration;

        if (progress >= 1) {
          spark.remove();
          return;
        }

        const ease = 1 - Math.pow(1 - progress, 2);
        const curX = vx * ease;
        const curY = vy * ease + progress * progress * 40; // gravity
        const scale = 1 - progress;

        spark.style.transform = `translate3d(${curX}px, ${curY}px, 0) scale(${scale})`;
        spark.style.opacity = (1 - progress).toFixed(3);

        requestAnimationFrame(updateSpark);
      }

      requestAnimationFrame(updateSpark);
    }
  }

  // 4. Click & Shockwave Interaction
  function triggerShockwave(originChar, clickX, clickY) {
    playCyberChime(440, 880);
    spawnSparks(clickX, clickY);

    const originRect = originChar.getBoundingClientRect();
    const originCenter = {
      x: originRect.left + originRect.width / 2,
      y: originRect.top + originRect.height / 2
    };

    allChars.forEach((char) => {
      const r = char.getBoundingClientRect();
      const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      const dist = Math.hypot(c.x - originCenter.x, c.y - originCenter.y);

      // Stagger animation based on distance from click
      const delay = dist * 1.1; 
      setTimeout(() => {
        char.classList.remove('ripple-wave');
        // Force reflow
        void char.offsetWidth;
        char.classList.add('ripple-wave');
      }, delay);
    });
  }

  allChars.forEach((char) => {
    char.addEventListener('click', (e) => {
      triggerShockwave(char, e.clientX, e.clientY);
    });
  });

  // Clicking anywhere in the container triggers a center shockwave
  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('char-3d')) return; // already handled
    const centerChar = allChars[Math.floor(allChars.length / 2)];
    if (centerChar) {
      triggerShockwave(centerChar, e.clientX, e.clientY);
    }
  });

  // 5. Main 60fps Kinetic 3D Render Loop
  let frameCount = 0;

  function render3D() {
    frameCount++;

    // Smooth Lerp Tilt
    currTiltX += (targetTiltX - currTiltX) * 0.08;
    currTiltY += (targetTiltY - currTiltY) * 0.08;

    // Apply 3D perspective to container
    title.style.transform = `rotateX(${currTiltX.toFixed(2)}deg) rotateY(${currTiltY.toFixed(2)}deg)`;

    // Counter-rotate or tilt gyroscope for layered depth
    if (gyro) {
      gyro.style.transform = `translate(-50%, -50%) translateZ(-50px) rotateX(${(currTiltX * 1.4).toFixed(2)}deg) rotateY(${(currTiltY * 1.4).toFixed(2)}deg)`;
    }

    // Dynamic 3D Extrusion vectors based on light angle
    const dX = -currTiltY * 0.32;
    const dY = currTiltX * 0.32;

    // Precalculate common text-shadow for non-proximity chars
    const baseShadow = `
      ${(dX * 0.3).toFixed(1)}px ${(dY * 0.3).toFixed(1)}px 0 rgba(200, 210, 225, 0.85),
      ${(dX * 0.6).toFixed(1)}px ${(dY * 0.6).toFixed(1)}px 0 rgba(140, 150, 175, 0.6),
      ${(dX * 0.9).toFixed(1)}px ${(dY * 0.9).toFixed(1)}px 0 rgba(80, 90, 120, 0.4),
      ${(dX * 1.4).toFixed(1)}px ${(dY * 1.4).toFixed(1)}px 4px rgba(0, 0, 0, 0.8),
      ${(dX * 2.0).toFixed(1)}px ${(dY * 2.0).toFixed(1)}px 12px rgba(0, 229, 255, 0.25)
    `;

    // Proximity radius (pixels)
    const PROXIMITY_RADIUS = 130;

    for (let i = 0; i < allChars.length; i++) {
      const char = allChars[i];
      if (char.classList.contains('ripple-wave')) continue;

      const rect = char.getBoundingClientRect();
      const charCenterX = rect.left + rect.width / 2;
      const charCenterY = rect.top + rect.height / 2;

      const dist = Math.hypot(mouseX - charCenterX, mouseY - charCenterY);

      if (dist < PROXIMITY_RADIUS) {
        // High proximity: letter extrudes forward dramatically in 3D
        const factor = Math.pow(1 - dist / PROXIMITY_RADIUS, 1.4);
        const z = (factor * 42).toFixed(1);
        const scale = (1 + factor * 0.16).toFixed(2);
        const rotZ = ((mouseX - charCenterX) * -0.06 * factor).toFixed(2);

        char.style.transform = `translateZ(${z}px) scale(${scale}) rotateZ(${rotZ}deg)`;
        char.style.color = '#ffffff';
        char.style.filter = `drop-shadow(0 0 ${(factor * 16).toFixed(1)}px rgba(0, 229, 255, ${(factor * 0.9).toFixed(2)}))`;

        // Enhanced 3D shadow depth when popped
        char.style.textShadow = `
          ${(dX * 0.5).toFixed(1)}px ${(dY * 0.5).toFixed(1)}px 0 rgba(255, 255, 255, 0.95),
          ${(dX * 1.0).toFixed(1)}px ${(dY * 1.0).toFixed(1)}px 0 rgba(56, 189, 248, 0.8),
          ${(dX * 1.6).toFixed(1)}px ${(dY * 1.6).toFixed(1)}px 0 rgba(14, 165, 233, 0.5),
          ${(dX * 2.5).toFixed(1)}px ${(dY * 2.5).toFixed(1)}px 14px rgba(0, 229, 255, 0.7)
        `;
      } else {
        // Subtle organic breathing float
        const wave = Math.sin(frameCount * 0.04 + i * 0.35) * 2;
        char.style.transform = `translateZ(0px) translateY(${wave.toFixed(1)}px)`;
        char.style.color = '';
        char.style.filter = '';
        char.style.textShadow = baseShadow;
      }
    }

    requestAnimationFrame(render3D);
  }

  // Remove wave animation class on end
  container.addEventListener('animationend', (e) => {
    if (e.target.classList.contains('ripple-wave')) {
      e.target.classList.remove('ripple-wave');
    }
  });

  // Start the 3D loop
  requestAnimationFrame(render3D);

})();
