# Niranjan Purushothaman — 3D Personal Portfolio Website

An immersive, modern 3D personal portfolio website engineered for **Niranjan Purushothaman** (AI & Full-Stack Developer). Built with HTML5, Tailwind CSS, Three.js (WebGL), GSAP ScrollTrigger, Lenis smooth scrolling, and hardware-accelerated CSS 3D transforms with a locked 60fps performance budget.

---

## 🚀 Live Demo & Quick Start

You can preview the portfolio immediately in any modern web browser:

### Option 1: Direct File Opening
Double-click `index.html` or open it directly in Google Chrome, Microsoft Edge, Brave, or Firefox.

### Option 2: Local HTTP Server (Recommended)
Using Python:
```bash
python -m http.server 3000
```
Then visit: [http://localhost:3000](http://localhost:3000)

Using Node.js:
```bash
npx serve .
```

---

## 🛠️ How to Customize

### 1. Swapping in Your Real Profile Photo
1. Place your headshot photo (e.g. `niranjan.jpg` or `niranjan.png`) inside the `assets/` directory (e.g., `assets/profile.jpg`).
2. Open `index.html` and search for `<img id="profile-avatar"`.
3. Change the `src` attribute:
   ```html
   <!-- Change from: -->
   <img id="profile-avatar" src="assets/avatar.svg" alt="Niranjan Purushothaman" ... />

   <!-- To: -->
   <img id="profile-avatar" src="assets/profile.jpg" alt="Niranjan Purushothaman" ... />
   ```

### 2. Updating Your Resume PDF
1. Replace or place your final PDF in `assets/Niranjan_Purushothaman_Resume.pdf`.
2. The "Download Resume" button in the Hero section (`index.html`) is already wired directly to this file:
   ```html
   <a href="assets/Niranjan_Purushothaman_Resume.pdf" download="Niranjan_Purushothaman_Resume.pdf" ...>
   ```

### 3. Adding Your Real Social / Publication Links
- **IEEE Publication Link**: Search for `https://ieeexplore.ieee.org` in `index.html` and replace with your exact paper DOI or IEEE Xplore URL.
- **GitHub / LinkedIn**: Search for `https://github.com` and `https://linkedin.com` to insert your exact username handles.

---

## ⚡ 3D Architecture & Performance Safeguards

1. **Three.js Low-Poly Hero Scene**:
   - Geodesic Icosahedron wireframe cage + inner quantum nucleus + orbiting neural node constellation + dynamic synapses.
   - Total geometry vertices: **< 500 vertices** (well under the 5,000 vertex threshold).
   - **IntersectionObserver**: Automatically halts the `requestAnimationFrame` render loop as soon as the Hero scrolls out of view, saving GPU resources and battery.
   - Mobile GPU safeguard: Devices with viewport width `< 768px` or touch inputs automatically switch to a lightweight CSS gradient pulse mesh.

2. **Apple/Framer CSS 3D Tilt Cards**:
   - Project cards calculate pointer position in real time using `perspective(1000px) rotateX(...) rotateY(...) scale3d(...)`.
   - Includes dynamic radial specular glare overlay that follows the cursor coordinate.

3. **Lenis + GSAP ScrollTrigger Integration**:
   - Buttery smooth inertia scroll synchronized with GSAP's ticker.
   - Experience section features a self-drawing vertical progress line.

4. **Accessibility (`prefers-reduced-motion`)**:
   - Fully honors users' reduced motion preferences by disabling tilts, floating animations, and custom cursor.

---

## 📂 File Structure

```
Portfolio/
├── index.html                    # Main single-page HTML document
├── css/
│   └── style.css                 # Custom 3D transforms, glassmorphism, floating tags
├── js/
│   └── main.js                   # Three.js hero, Lenis, GSAP, cursor, tilt math
├── assets/
│   ├── favicon.svg               # Cyber monogram favicon
│   ├── avatar.svg                # Stylized developer avatar illustration
│   └── Niranjan_Purushothaman_Resume.pdf  # Downloadable PDF resume
└── README.md                     # Documentation & setup instructions
```
