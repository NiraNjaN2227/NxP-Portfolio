/**
 * NIRANJAN P. — COMPUTATIONAL INTELLIGENCE LAB
 * Cute Procedural 3D Rocket Flight
 */

(function () {
  'use strict';

  let renderer, scene, camera;
  let rocketGroup, exhaustFlame;
  let particles = [];
  let clock;
  let animationId = null;
  
  // Animation state
  let isFlying = false;
  let flightProgress = 0;
  const FLIGHT_DURATION = 3.5; // seconds
  let curve;

  function initRocketScene() {
    const canvas = document.getElementById('rocket-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    clock = new THREE.Clock();

    // Scene & Camera
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;

    // Renderer (Transparent overlay)
    renderer = new THREE.WebGLRenderer({ 
      canvas, 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 20);
    scene.add(directionalLight);
    
    const blueLight = new THREE.PointLight(0x00e5ff, 0.5, 50);
    blueLight.position.set(-10, -10, 10);
    scene.add(blueLight);

    buildRocket();
    defineFlightPath();

    // Handle Window Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      defineFlightPath(); // Re-calculate curve based on new viewport
    }, { passive: true });

    // Launch Trigger
    const badge = document.getElementById('system-online-badge');
    if (badge) {
      badge.addEventListener('click', launchRocket);
    }

    // Auto-launch on page load (with a small delay for dramatic effect)
    setTimeout(() => {
      launchRocket();
    }, 800);
  }

  function buildRocket() {
    rocketGroup = new THREE.Group();
    // Default orientation: rocket points to +Y
    
    // 1. Fuselage (Body) - Custom Capsule for r128
    const bodyGroup = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      roughness: 0.2, 
      metalness: 0.1 
    });
    
    // Cylinder main body
    const cylGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
    const cyl = new THREE.Mesh(cylGeo, bodyMat);
    bodyGroup.add(cyl);

    // Top dome
    const topDomeGeo = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const topDome = new THREE.Mesh(topDomeGeo, bodyMat);
    topDome.position.y = 1.25;
    bodyGroup.add(topDome);

    // Bottom dome
    const botDomeGeo = new THREE.SphereGeometry(1.2, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    const botDome = new THREE.Mesh(botDomeGeo, bodyMat);
    botDome.position.y = -1.25;
    bodyGroup.add(botDome);

    rocketGroup.add(bodyGroup);

    // 2. Cockpit Window
    const windowGroup = new THREE.Group();
    windowGroup.position.set(0, 0.5, 1.1); // Front of the capsule
    
    // Window Rim (Metallic)
    const rimGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 24);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    windowGroup.add(rim);
    
    // Glass Porthole (Glowing Cyan)
    const glassGeo = new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const glassMat = new THREE.MeshStandardMaterial({ 
      color: 0x00e5ff, 
      emissive: 0x00e5ff,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.9
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.rotation.x = Math.PI / 2;
    windowGroup.add(glass);
    
    rocketGroup.add(windowGroup);

    // 3. Fins (Cute rounded triangles/cones)
    const finGeo = new THREE.ConeGeometry(0.4, 1.5, 3);
    const finMat = new THREE.MeshStandardMaterial({ color: 0xff4757, roughness: 0.4 }); // Coral red
    
    for(let i = 0; i < 3; i++) {
      const fin = new THREE.Mesh(finGeo, finMat);
      // Position around the base
      const angle = (i / 3) * Math.PI * 2;
      const radius = 1.1;
      fin.position.x = Math.cos(angle) * radius;
      fin.position.z = Math.sin(angle) * radius;
      fin.position.y = -1.2;
      
      // Rotate outward
      fin.rotation.y = -angle;
      fin.rotation.z = -Math.PI / 8; // Angle downwards/outwards
      
      rocketGroup.add(fin);
    }

    // 4. Thruster Nozzle
    const nozzleGeo = new THREE.CylinderGeometry(0.6, 0.8, 0.8, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.2 });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.position.y = -2.8;
    rocketGroup.add(nozzle);

    // 5. Exhaust Flame (Animated later)
    const flameGeo = new THREE.ConeGeometry(0.5, 2, 16);
    // Move origin to top of cone so it scales from the nozzle
    flameGeo.translate(0, -1, 0); 
    const flameMat = new THREE.MeshStandardMaterial({ 
      color: 0xff9f43,
      emissive: 0xff9f43,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    });
    exhaustFlame = new THREE.Mesh(flameGeo, flameMat);
    exhaustFlame.position.y = -3.2;
    rocketGroup.add(exhaustFlame);

    // Scale down the whole rocket to make it 'small and cute'
    rocketGroup.scale.set(0.6, 0.6, 0.6);
    
    // Hide initially
    rocketGroup.visible = false;
    scene.add(rocketGroup);
  }

  function defineFlightPath() {
    // Determine screen bounds in 3D space at z=0
    // Camera is at z=40, fov=45
    const vFov = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(vFov / 2) * camera.position.z;
    const w = h * camera.aspect;

    // Create a smooth cubic Bezier curve that arcs over the screen
    // Starts off-screen left, arcs across the center (where the name is), and exits off-screen right
    curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-w * 0.6, -h * 0.3, -5),   // Start (Bottom Left)
      new THREE.Vector3(-w * 0.2, h * 0.2, 5),     // Control 1 (Rising)
      new THREE.Vector3(w * 0.2, h * 0.25, 10),    // Control 2 (Arcing over title)
      new THREE.Vector3(w * 0.6, h * 0.4, -5)      // End (Top Right)
    );
  }

  function launchRocket() {
    if (isFlying) return; // Prevent double launch
    
    isFlying = true;
    flightProgress = 0;
    rocketGroup.visible = true;
    clock.start();
    
    // Reset particles
    particles.forEach(p => scene.remove(p.mesh));
    particles = [];

    if (!animationId) {
      animate();
    }
  }

  function spawnExhaustParticle(basePos) {
    // Cute spherical smoke puffs
    const geo = new THREE.SphereGeometry(0.3, 8, 8);
    
    // Alternate between white smoke and glowing sparks
    const isSpark = Math.random() > 0.7;
    const color = isSpark ? 0x00e5ff : 0xffffff;
    const emissive = isSpark ? 0x00e5ff : 0x000000;
    
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: emissive,
      emissiveIntensity: isSpark ? 1 : 0,
      transparent: true,
      opacity: isSpark ? 0.8 : 0.4,
      roughness: 1
    });

    const mesh = new THREE.Mesh(geo, mat);
    
    // Add some random scatter around the nozzle
    const scatter = 0.5;
    mesh.position.copy(basePos);
    mesh.position.x += (Math.random() - 0.5) * scatter;
    mesh.position.y += (Math.random() - 0.5) * scatter;
    mesh.position.z += (Math.random() - 0.5) * scatter;

    scene.add(mesh);
    
    particles.push({
      mesh: mesh,
      life: 1.0, // 1.0 to 0.0
      decay: Math.random() * 0.02 + 0.02,
      scale: Math.random() * 0.5 + 0.5
    });
  }

  function animate() {
    if (!isFlying) {
      // Sleep GPU when not flying
      animationId = null;
      renderer.clear();
      return; 
    }

    animationId = requestAnimationFrame(animate);

    const dt = clock.getDelta();
    
    // 1. Update Flight Progress
    // Ease-in-out calculation for smooth start and exit
    flightProgress += dt / FLIGHT_DURATION;
    
    if (flightProgress >= 1.0) {
      isFlying = false;
      rocketGroup.visible = false;
      // Let particles finish fading, but stop rocket
    }

    if (flightProgress <= 1.0) {
      // Easing function (sine)
      const easeProgress = Math.sin((flightProgress * Math.PI) / 2); // Ease out
      // Actually let's use a smoother in-out
      const smoothProgress = flightProgress < 0.5 
        ? 2 * flightProgress * flightProgress 
        : 1 - Math.pow(-2 * flightProgress + 2, 2) / 2;

      // Position
      const pos = curve.getPoint(smoothProgress);
      rocketGroup.position.copy(pos);

      // Rotation (align to curve tangent)
      const tangent = curve.getTangent(smoothProgress).normalize();
      
      // Default rocket points UP (+Y). We want it to point along the tangent.
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
      rocketGroup.quaternion.copy(quaternion);

      // Add playful wobble (roll and pitch)
      const time = clock.getElapsedTime();
      rocketGroup.rotateZ(Math.sin(time * 10) * 0.1); // Wobble left/right
      rocketGroup.rotateX(Math.cos(time * 15) * 0.05);

      // Animate Flame
      exhaustFlame.scale.y = 1 + Math.sin(time * 30) * 0.2;
      exhaustFlame.scale.x = 1 + Math.cos(time * 30) * 0.1;
      exhaustFlame.scale.z = 1 + Math.cos(time * 30) * 0.1;

      // Spawn Exhaust Particles
      // Convert rocket nozzle local position to world space
      const nozzleWorldPos = new THREE.Vector3(0, -1.8, 0);
      nozzleWorldPos.applyMatrix4(rocketGroup.matrixWorld);
      
      // Spawn 1-2 particles per frame
      if (Math.random() > 0.3) {
        spawnExhaustParticle(nozzleWorldPos);
      }
    }

    // 2. Update Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= p.decay;
      
      if (p.life <= 0) {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
      } else {
        // Expand smoke slightly as it dissipates
        const s = p.scale * (1 + (1 - p.life));
        p.mesh.scale.set(s, s, s);
        
        // Drift slowly backwards/downwards relative to world
        p.mesh.position.y -= dt * 2;
        p.mesh.position.x -= dt * 1;
        
        p.mesh.material.opacity = p.life;
      }
    }

    // Keep loop alive if particles still exist even after rocket finishes
    if (!isFlying && particles.length === 0) {
      isFlying = false;
      // Next frame will kill the loop
    }

    renderer.render(scene, camera);
  }

  // Init once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRocketScene);
  } else {
    initRocketScene();
  }

})();
