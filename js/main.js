/**
 * NIRANJAN P. — COMPUTATIONAL INTELLIGENCE LAB
 * Three.js particle flow field + scroll interactions
 */

(function () {
  'use strict';

  /* =====================================================================
     1. PARTICLE FLOW FIELD (Three.js + Simplex Noise)
     ===================================================================== */
  const PARTICLE_COUNT = 10000;
  let renderer, scene, camera, points, clock, simplex;

  let boundX = 160;
  let boundY = 95;
  let boundZ = 50;

  function updateBounds() {
    const aspect = window.innerWidth / window.innerHeight;
    boundX = Math.max(160, 95 * aspect);
    boundY = 95;
    boundZ = 50;
  }

  function initWebGL() {
    const container = document.getElementById('webgl-container');
    if (!container || typeof THREE === 'undefined') return;

    if (typeof SimplexNoise !== 'undefined') {
      simplex = new SimplexNoise();
    }

    updateBounds();
    clock = new THREE.Clock();
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
    camera.position.z = 50;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Build 10,000 particles distributed edge-to-edge
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors    = new Float32Array(PARTICLE_COUNT * 3);
    const speeds    = new Float32Array(PARTICLE_COUNT);
    const offsets   = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * (boundX * 2);
      positions[i3 + 1] = (Math.random() - 0.5) * (boundY * 2);
      positions[i3 + 2] = (Math.random() - 0.5) * (boundZ * 2);
      speeds[i]  = Math.random() * 0.5 + 0.2;
      offsets[i] = Math.random() * 100;

      // White/silver majority, subtle cyan & amber accents
      const t = Math.random();
      if (t < 0.65) {
        const v = 0.85 + Math.random() * 0.15;
        colors[i3] = v; colors[i3+1] = v; colors[i3+2] = v;
      } else if (t < 0.85) {
        colors[i3] = 0.2; colors[i3+1] = 0.7 + Math.random() * 0.2; colors[i3+2] = 0.95;
      } else {
        colors[i3] = 0.95; colors[i3+1] = 0.72; colors[i3+2] = 0.15;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.userData = { speeds, offsets };

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      sizeAttenuation: true
    });

    points = new THREE.Points(geo, mat);
    scene.add(points);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    window.addEventListener('resize', () => {
      updateBounds();
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, { passive: true });

    animate();
  }

  // Mouse & Scroll tracking
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = 0;
  let targetScrollY = 0;

  window.addEventListener('mousemove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  window.addEventListener('scroll', () => {
    targetScrollY = window.scrollY;
  }, { passive: true });

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const pos = points.geometry.attributes.position;
    const { speeds, offsets } = points.geometry.userData;

    // Smooth scroll interpolation
    scrollY += (targetScrollY - scrollY) * 0.06;
    const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
    const scrollProgress = scrollY / maxScroll; // 0 (top) to 1 (bottom)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const sp = speeds[i];
      const off = offsets[i];
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      let dx, dy, dz;

      if (simplex) {
        const s = 0.012, ts = 0.08;
        dx = simplex.noise4D(x*s, y*s, z*s, t*ts + off) * sp * 0.4;
        dy = simplex.noise4D(x*s+100, y*s+100, z*s+100, t*ts + off) * sp * 0.4;
        dz = simplex.noise4D(x*s+200, y*s+200, z*s+200, t*ts + off) * sp * 0.18;
      } else {
        dx = Math.sin(t * sp * 0.3 + off) * 0.05;
        dy = Math.cos(t * sp * 0.25 + off + 1) * 0.05;
        dz = Math.sin(t * sp * 0.1 + off + 2) * 0.02;
      }

      x += dx; y += dy; z += dz;

      // Wrap around wide bounds dynamically
      if (x > boundX) x = -boundX; if (x < -boundX) x = boundX;
      if (y > boundY) y = -boundY; if (y < -boundY) y = boundY;
      if (z > boundZ) z = -boundZ; if (z < -boundZ) z = boundZ;

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;

    // Camera parallax + scroll-driven cosmic journey
    mouse.x += (mouse.tx - mouse.x) * 0.03;
    mouse.y += (mouse.ty - mouse.y) * 0.03;
    
    const cameraScrollY = -scrollProgress * 30;
    camera.position.x = mouse.x * 6;
    camera.position.y = -mouse.y * 3.5 + cameraScrollY;
    camera.lookAt(0, cameraScrollY, 0);

    points.rotation.y = t * 0.008 + scrollProgress * 0.3;

    renderer.render(scene, camera);
  }

  /* =====================================================================
     2. SCROLL REVEAL (IntersectionObserver)
     ===================================================================== */
  function initReveal() {
    const panels = document.querySelectorAll('.lab-panel');
    if (!panels.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in-view');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    panels.forEach((el) => io.observe(el));
  }

  /* =====================================================================
     3. SMOOTH ANCHOR SCROLLING
     ===================================================================== */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        const target = document.querySelector(el.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* =====================================================================
     4. SKILL TAG TILT ON HOVER (micro-interaction)
     ===================================================================== */
  function initTagInteractions() {
    document.querySelectorAll('.lab-tag').forEach((tag) => {
      tag.addEventListener('mouseenter', () => {
        const angle = (Math.random() - 0.5) * 6;
        tag.style.transform = `translateY(-2px) rotate(${angle}deg)`;
      });
      tag.addEventListener('mouseleave', () => {
        tag.style.transform = '';
      });
    });
  }

  /* =====================================================================
     5. TYPING EFFECT ON HERO SUBTITLE
     ===================================================================== */
  // (Kept simple — no external library)

  /* =====================================================================
     INIT
     ===================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    initWebGL();
    initReveal();
    initSmoothAnchors();
    initTagInteractions();
  });

})();
