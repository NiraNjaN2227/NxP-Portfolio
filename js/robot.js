/**
 * NIRANJAN P. — COMPUTATIONAL INTELLIGENCE LAB
 * AI Observer Companion
 */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class AIObserver {
    constructor() {
      this.state = 'IDLE';
      this.currentSection = null; // Start null so the initial section load triggers speech
      
      // Cooldown mechanics
      this.lastMessageTime = 0;
      this.cooldownDuration = 8000; // 8 seconds minimum between automatic messages
      
      // Smooth Gaze Tracking
      this.targetEyeX = 0;
      this.targetEyeY = 0;
      this.currentEyeX = 0;
      this.currentEyeY = 0;
      
      this.bubbleTimeout = null;
      
      this.init();
    }

    init() {
      this.injectCSS();
      this.injectHTML();

      this.robot = document.getElementById('ai-observer');
      this.face = document.getElementById('observer-face');
      this.visor = document.querySelector('.observer-visor');
      this.bubble = document.getElementById('observer-speech');

      if (!this.robot || !this.face) return;

      this.bindEvents();
      this.setupIntersectionObserver();

      if (!prefersReducedMotion) {
        this.animateGaze();
      }

      // Very subtle intro after a delay
      setTimeout(() => {
        this.robot.classList.add('initialized');
      }, 1000);
    }

    injectCSS() {
      const style = document.createElement('style');
      style.textContent = `
        #ai-observer {
          position: fixed;
          top: 50%;
          right: 8vw;
          transform: translateY(-50%);
          z-index: 50;
          opacity: 0;
          transition: opacity 1s ease-in-out;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        #ai-observer.initialized {
          opacity: 1;
        }

        /* Subtle breathing animation for the container */
        .observer-breathing {
          animation: observerBreathe 6s ease-in-out infinite alternate;
        }

        /* Premium Chassis Design */
        .observer-chassis {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(20, 25, 35, 0.95), rgba(10, 12, 18, 0.95));
          border: 1px solid rgba(0, 229, 255, 0.15);
          box-shadow: 
            inset 0 0 12px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 8px 24px rgba(0, 0, 0, 0.5),
            0 0 15px rgba(0, 229, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        /* HUD Ring Details */
        .observer-ring-outer {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 1px dashed rgba(0, 229, 255, 0.1);
          animation: ringSpin 30s linear infinite;
          pointer-events: none;
        }
        
        .observer-ring-inner {
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          border: 1px solid rgba(0, 229, 255, 0.05);
          pointer-events: none;
        }

        /* Visor where the face moves */
        .observer-visor {
          width: 32px;
          height: 32px;
          background: #05070a;
          border-radius: 50%;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* The Face Container */
        .observer-face {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          will-change: transform;
        }

        .observer-eyes {
          display: flex;
          gap: 6px;
        }

        /* The Emissive Eyes */
        .observer-eye {
          width: 6px;
          height: 6px;
          background: #00e5ff;
          border-radius: 50%;
          box-shadow: 
            0 0 6px #00e5ff, 
            0 0 12px rgba(0, 229, 255, 0.6);
          transition: width 0.3s, height 0.3s, border-radius 0.3s, background 0.3s, box-shadow 0.3s;
        }

        /* The Mouth */
        .observer-mouth {
          width: 8px;
          height: 2px;
          background: #00e5ff;
          border-radius: 2px;
          box-shadow: 0 0 4px #00e5ff, 0 0 8px rgba(0, 229, 255, 0.6);
          transition: width 0.3s, height 0.3s, border-radius 0.3s, background 0.3s, box-shadow 0.3s;
        }

        /* --- Expression States --- */
        .observer-face.neutral .observer-eye {
          width: 6px; height: 6px;
          background: #00e5ff; box-shadow: 0 0 6px #00e5ff, 0 0 12px rgba(0, 229, 255, 0.6);
        }
        .observer-face.neutral .observer-mouth {
          width: 8px; height: 3px; border-radius: 0 0 8px 8px;
          background: #00e5ff; box-shadow: 0 0 4px #00e5ff, 0 0 8px rgba(0, 229, 255, 0.6);
        }

        /* About (cyan-400) */
        .observer-face.attentive .observer-eye {
          width: 8px; height: 8px;
          background: #22d3ee; box-shadow: 0 0 10px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.8);
        }
        .observer-face.attentive .observer-mouth {
          width: 4px; height: 4px; border-radius: 50%;
          background: #22d3ee; box-shadow: 0 0 8px #22d3ee, 0 0 16px rgba(34, 211, 238, 0.8);
        }

        /* Experience (amber-300) */
        .observer-face.focused .observer-eye {
          height: 4px; border-radius: 2px;
          background: #fcd34d;
          box-shadow: 0 0 8px #fcd34d, 0 0 16px rgba(252, 211, 77, 0.6);
        }
        .observer-face.focused .observer-mouth {
          width: 10px; height: 3px; border-radius: 0 0 10px 10px;
          background: #fcd34d;
          box-shadow: 0 0 8px #fcd34d;
        }

        /* Projects (violet-400) */
        .observer-face.curious .observer-eye {
          width: 7px; height: 7px;
          background: #c084fc;
          box-shadow: 0 0 8px #c084fc, 0 0 16px rgba(192, 132, 252, 0.6);
        }
        .observer-face.curious .observer-mouth {
          width: 6px; height: 3px; border-radius: 0 0 6px 6px;
          background: #c084fc; box-shadow: 0 0 8px #c084fc;
        }

        /* Skills (emerald-400) */
        .observer-face.scanning .observer-eye {
          background: #34d399; box-shadow: 0 0 8px #34d399, 0 0 16px rgba(52, 211, 153, 0.6);
          animation: scanPulse 2s ease-in-out infinite;
        }
        .observer-face.scanning .observer-mouth {
          width: 10px; height: 3px; border-radius: 0 0 10px 10px;
          background: #34d399; box-shadow: 0 0 8px #34d399, 0 0 16px rgba(52, 211, 153, 0.6);
        }

        /* Contact (rose-400) */
        .observer-face.welcoming .observer-eye {
          height: 4px; width: 8px; border-radius: 4px 4px 0 0;
          background: #fb7185;
          box-shadow: 0 0 8px #fb7185, 0 0 16px rgba(251, 113, 133, 0.6);
        }
        .observer-face.welcoming .observer-mouth {
          width: 12px; height: 6px; border-radius: 0 0 12px 12px;
          background: #fb7185;
          box-shadow: 0 0 8px #fb7185, 0 0 16px rgba(251, 113, 133, 0.6);
        }

        /* Speaking Animation applied to mouth */
        .observer-face.speaking .observer-mouth {
          animation: mouthSpeak 0.25s infinite alternate ease-in-out;
        }

        /* --- Speech Bubble --- */
        .observer-speech-bubble {
          position: absolute;
          bottom: calc(100% + 15px);
          background: rgba(10, 15, 25, 0.9);
          border: 1px solid rgba(0, 229, 255, 0.2);
          padding: 6px 12px;
          border-radius: 6px;
          color: #cbd5e1;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          letter-spacing: 0.02em;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transform: translateY(5px);
          transition: opacity 0.3s ease, transform 0.3s ease;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.6), 0 0 10px rgba(0, 229, 255, 0.05);
        }
        
        /* Subtle triangle pointer */
        .observer-speech-bubble::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: rgba(0, 229, 255, 0.2) transparent transparent transparent;
        }

        .observer-speech-bubble.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* --- Keyframes --- */
        @keyframes observerBreathe {
          0% { transform: translateY(0); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 229, 255, 0.02); }
          100% { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6), 0 0 20px rgba(0, 229, 255, 0.08); }
        }

        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes scanPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }

        @keyframes mouthSpeak {
          0% { height: 2px; border-radius: 0 0 10px 10px; }
          100% { height: 6px; border-radius: 0 0 10px 10px; transform: translateY(1px); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          #ai-observer {
            top: 20px;
            right: 4vw;
            transform: scale(0.85);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .observer-breathing { animation: none; }
          .observer-ring-outer { animation: none; }
          .observer-face.scanning .observer-eye { animation: none; }
        }
      `;
      document.head.appendChild(style);
    }

    injectHTML() {
      const container = document.createElement('div');
      container.id = 'ai-observer';
      container.setAttribute('aria-label', 'AI Observer Companion');
      container.setAttribute('role', 'status');

      container.innerHTML = `
        <div id="observer-speech" class="observer-speech-bubble"></div>
        <div class="observer-breathing">
          <div class="observer-chassis">
            <div class="observer-ring-outer"></div>
            <div class="observer-ring-inner"></div>
            <div class="observer-visor">
              <div id="observer-face" class="observer-face neutral">
                <div class="observer-eyes">
                  <div class="observer-eye left"></div>
                  <div class="observer-eye right"></div>
                </div>
                <div class="observer-mouth"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(container);
    }

    bindEvents() {
      // 1. Mouse Move -> Gaze Tracking
      if (!prefersReducedMotion) {
        window.addEventListener('mousemove', (e) => {
          this.calculateGaze(e.clientX, e.clientY);
        }, { passive: true });
      }

      // 2. Draggable Robot
      this.setupDragging();
    }

    calculateGaze(mouseX, mouseY) {
      const visorRect = this.visor.getBoundingClientRect();
      const cx = visorRect.left + visorRect.width / 2;
      const cy = visorRect.top + visorRect.height / 2;

      const dx = mouseX - cx;
      const dy = mouseY - cy;
      
      // Calculate constrained distance (max travel inside visor)
      const maxTravel = 8; 
      const distance = Math.min(maxTravel, Math.hypot(dx, dy) * 0.015);
      const angle = Math.atan2(dy, dx);

      this.targetEyeX = Math.cos(angle) * distance;
      this.targetEyeY = Math.sin(angle) * distance;
    }

    setupDragging() {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      const onPointerDown = (e) => {
        // Prevent default if possible to avoid text selection
        if (e.type === 'mousedown') e.preventDefault();

        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
        
        isDragging = true;
        startX = clientX;
        startY = clientY;

        // Fix position as absolute pixels, removing right/transform
        const rect = this.robot.getBoundingClientRect();
        this.robot.style.right = 'auto';
        this.robot.style.transform = 'none';
        this.robot.style.bottom = 'auto';
        this.robot.style.left = rect.left + 'px';
        this.robot.style.top = rect.top + 'px';

        initialLeft = rect.left;
        initialTop = rect.top;
      };

      const onPointerMove = (e) => {
        if (!isDragging) return;
        if (e.type === 'touchmove') e.preventDefault(); // Prevent scrolling while dragging
        
        const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

        const dx = clientX - startX;
        const dy = clientY - startY;

        // Constrain to window bounds roughly
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        const rect = this.robot.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(window.innerWidth - rect.width, newLeft));
        newTop = Math.max(0, Math.min(window.innerHeight - rect.height, newTop));

        this.robot.style.left = newLeft + 'px';
        this.robot.style.top = newTop + 'px';
      };

      const onPointerUp = () => {
        isDragging = false;
      };

      // Add grab cursor hint
      this.robot.style.cursor = 'grab';
      this.robot.addEventListener('mousedown', () => { this.robot.style.cursor = 'grabbing'; });
      window.addEventListener('mouseup', () => { this.robot.style.cursor = 'grab'; });

      // Bind events directly to the chassis/robot container
      this.robot.addEventListener('mousedown', onPointerDown);
      this.robot.addEventListener('touchstart', onPointerDown, { passive: false });

      window.addEventListener('mousemove', onPointerMove, { passive: false });
      window.addEventListener('touchmove', onPointerMove, { passive: false });

      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('touchend', onPointerUp);
    }

    animateGaze() {
      // Smooth lerp interpolation for the face
      this.currentEyeX += (this.targetEyeX - this.currentEyeX) * 0.1;
      this.currentEyeY += (this.targetEyeY - this.targetEyeY) * 0.1;
      
      this.face.style.transform = `translate3d(${this.currentEyeX}px, ${this.currentEyeY}px, 0)`;
      
      requestAnimationFrame(() => this.animateGaze());
    }

    setupIntersectionObserver() {
      const sections = document.querySelectorAll('section, header');
      this.sectionRatios = {};

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const id = entry.target.id || 'home';
          this.sectionRatios[id] = entry.intersectionRatio;
        });

        // Determine which section is most visible
        let maxRatio = 0;
        let activeSection = this.currentSection;

        // If the user scrolls to the bottom, contact might not be the "tallest" visible,
        // but if it's >40% visible, we definitely want it to trigger.
        if (this.sectionRatios['contact'] > 0.4) {
          activeSection = 'contact';
        } else {
          for (const [id, ratio] of Object.entries(this.sectionRatios)) {
            if (ratio > maxRatio && ratio > 0.15) {
              maxRatio = ratio;
              activeSection = id;
            }
          }
        }

        if (activeSection) {
          this.handleSectionChange(activeSection);
        }
      }, { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9] });

      sections.forEach(sec => {
        this.sectionRatios[sec.id || 'home'] = 0;
        observer.observe(sec);
      });
    }

    handleSectionChange(sectionId) {
      if (sectionId === 'header' || sectionId === 'hero') sectionId = 'home';
      if (this.currentSection === sectionId) return;

      this.currentSection = sectionId;
      this.applySectionExpression(sectionId);
      
      // Debounce to prevent spam while scrolling fast
      if (this.sectionSpeechTimeout) clearTimeout(this.sectionSpeechTimeout);
      
      this.sectionSpeechTimeout = setTimeout(() => {
        let msg = "";
        switch (sectionId) {
          case 'about': msg = "Am I interesting??"; break;
          case 'experience': msg = "Surviving the code mines... ⛏️"; break;
          case 'projects': msg = "Behold my digital offspring 🚀"; break;
          case 'skills': msg = "Analyzing tech stack."; break;
          case 'certifications': msg = "what I do with my free time"; break;
          case 'contact': msg = "Let's connect!"; break;
          case 'home': msg = "Hello mate 👋"; break;
        }
        if (msg) {
          // Force true to bypass cooldown since the user deliberately stopped here
          this.speak(msg, true, 4000); 
        }
      }, 500); // Reduced to 500ms to pop up faster when scrolling stops
    }
    
    applySectionExpression(sectionId) {
      this.state = sectionId.toUpperCase();
      
      // Update expression silently without speaking
      switch (sectionId) {
        case 'home':
          this.setExpression('neutral');
          break;
        case 'about':
          this.setExpression('attentive');
          break;
        case 'experience':
          this.setExpression('focused');
          break;
        case 'projects':
          this.setExpression('curious');
          break;
        case 'skills':
          this.setExpression('scanning');
          break;
        case 'certifications':
          this.setExpression('attentive');
          break;
        case 'contact':
          this.setExpression('welcoming');
          break;
        default:
          this.setExpression('neutral');
      }
    }



    setExpression(className) {
      // Clear previous classes
      this.face.className = 'observer-face'; 
      if (className) {
        this.face.classList.add(className);
      }
    }

    speak(text, force = false, duration = 3000) {
      const now = Date.now();
      
      // Cooldown check (skip if forced)
      if (!force && (now - this.lastMessageTime < this.cooldownDuration)) {
        return; 
      }
      
      this.lastMessageTime = now;

      if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);

      this.bubble.textContent = text;
      this.bubble.classList.add('visible');
      this.face.classList.add('speaking'); // Activate mouth animation

      this.bubbleTimeout = setTimeout(() => {
        this.bubble.classList.remove('visible');
        this.face.classList.remove('speaking'); // Deactivate mouth animation
      }, duration);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AIObserver());
  } else {
    new AIObserver();
  }

})();
