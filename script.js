/* script.js — Logo flotante PRO
   - Parallax sutil con pointer/touch
   - Jitter / breathing orgánico (aplicado a .logo-container)
   - Respeta prefers-reduced-motion
   - No bloquea/rompe el JS embebido que ya tienes
*/

document.addEventListener('DOMContentLoaded', () => {
  // Elementos
  const wrapper = document.querySelector('.logo-wrapper');
  const logoLayer = document.querySelector('.logo-container'); // capa interna para jitter

  // Respecta reduce-motion
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reduceMotionQuery.matches;
  reduceMotionQuery.addEventListener && reduceMotionQuery.addEventListener('change', e => {
    reduceMotion = e.matches;
    if (reduceMotion) {
      if (wrapper) {
        wrapper.classList.remove('animate');
        wrapper.style.transform = '';
      }
      if (logoLayer) logoLayer.style.transform = '';
    } else {
      if (wrapper) wrapper.classList.add('animate');
    }
  });

  // Si no está preferencia de reducir movimiento, arrancamos la animación base CSS
  if (!reduceMotion && wrapper) wrapper.classList.add('animate');

  /* ---------- PARALLAX (pointer) ---------- */
  if (wrapper && logoLayer) {
    const maxTilt = 8;      // grados
    const maxTranslate = 8; // px

    // valores actuales de parallax para composición
    let parallax = { rx: 0, ry: 0, tx: 0, ty: 0 };
    let parallaxResetTimeout = null;
    let isPointerDown = false;

    function setWrapperTransform() {
      // Componemos solo la transformación principal (parallax). El jitter va en logoLayer.
      const { rx, ry, tx, ty } = parallax;
      // perspective para sensación 3D
      wrapper.style.transform = `perspective(900px) translate3d(${tx}px, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg)`;
    }

    function handlePointerMove(e) {
      if (reduceMotion) return;

      // usar clientX/Y (pointer events) — si no están, fallbacks
      const px = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX) ?? window.innerWidth / 2;
      const py = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY) ?? window.innerHeight / 2;

      const rect = wrapper.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      // Normalizamos -1 .. 1
      const nx = (px - cx) / (rect.width / 2);
      const ny = (py - cy) / (rect.height / 2);

      // Calcular rotaciones y traslaciones suavemente
      const ry = clamp(nx * maxTilt, -maxTilt, maxTilt);      // rotateY (basado en X)
      const rx = clamp(-ny * maxTilt, -maxTilt, maxTilt);     // rotateX (basado en Y)
      const tx = clamp(nx * maxTranslate, -maxTranslate, maxTranslate);
      const ty = clamp(ny * maxTranslate * 0.6, -maxTranslate, maxTranslate * 0.6);

      // Aplicamos con pequeña interpolación para que sea suave
      parallax.rx += (rx - parallax.rx) * 0.18;
      parallax.ry += (ry - parallax.ry) * 0.18;
      parallax.tx += (tx - parallax.tx) * 0.18;
      parallax.ty += (ty - parallax.ty) * 0.18;

      setWrapperTransform();

      // Si había timeout para resetear (al salir), lo limpiamos
      if (parallaxResetTimeout) {
        clearTimeout(parallaxResetTimeout);
        parallaxResetTimeout = null;
      }
    }

    function handlePointerLeave() {
      if (reduceMotion) return;
      // Resetear parallax suavemente
      // animamos la propiedad vuelta a 0 con requestAnimationFrame loop simple
      const animateBack = () => {
        parallax.rx += (0 - parallax.rx) * 0.12;
        parallax.ry += (0 - parallax.ry) * 0.12;
        parallax.tx += (0 - parallax.tx) * 0.12;
        parallax.ty += (0 - parallax.ty) * 0.12;
        setWrapperTransform();

        // si prácticamente en 0, terminar
        if (Math.abs(parallax.rx) < 0.02 && Math.abs(parallax.ry) < 0.02 && Math.abs(parallax.tx) < 0.2 && Math.abs(parallax.ty) < 0.2) {
          parallax = { rx: 0, ry: 0, tx: 0, ty: 0 };
          setWrapperTransform();
        } else {
          requestAnimationFrame(animateBack);
        }
      };

      // Dale un pequeño retardo para evitar "parpadeos" cuando el usuario mueve el ratón rápido
      parallaxResetTimeout = setTimeout(() => requestAnimationFrame(animateBack), 60);
    }

    // pointer events (soporta mouse + touch)
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    wrapper.addEventListener('pointerleave', handlePointerLeave);
    wrapper.addEventListener('pointercancel', handlePointerLeave);
    wrapper.addEventListener('pointerdown', () => { isPointerDown = true; });
    wrapper.addEventListener('pointerup', () => { isPointerDown = false; });

    /* ---------- JITTER / BREATHING (aplicado a logoLayer) ---------- */
    // Usaremos Web Animations API para hacer anims no bloqueantes
    let jitterAnim = null;

    function startJitterLoop() {
      if (reduceMotion) {
        logoLayer.style.transform = '';
        return;
      }

      const playJitter = () => {
        // pequeñas variaciones aleatorias
        const rot = randBetween(-3, 3);   // rotación en grados
        const tx = randBetween(-6, 6);    // px en X
        const ty = randBetween(-8, -2);   // px en Y (ligera elevación)
        const scale = 1 + Math.random() * 0.03; // 1.00 .. 1.03

        // Cancela animación previa
        if (jitterAnim) {
          try { jitterAnim.cancel(); } catch (e) { }
        }

        // Animar logoLayer combinando translate, rotate y scale
        jitterAnim = logoLayer.animate(
          [
            { transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)' },
            { transform: `translateX(${tx}px) translateY(${ty}px) rotate(${rot}deg) scale(${scale})` },
            { transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)' }
          ],
          {
            duration: 2400 + Math.random() * 2600,
            easing: 'ease-in-out',
            iterations: 1,
            fill: 'forwards'
          }
        );

        // Programar siguiente jitter en intervalo aleatorio
        const next = 800 + Math.random() * 2600;
        setTimeout(playJitter, next);
      };

      // arrancar con pequeño delay
      setTimeout(playJitter, 700 + Math.random() * 700);
    }

    // arrancamos
    startJitterLoop();

    /* ---------- ACCESIBILITY: keyboard focus + hover enhancements ---------- */
    // Si el usuario enfoca con teclado, damos ligera escala (no motion heavy)
    wrapper.addEventListener('focus', () => {
      if (reduceMotion) return;
      wrapper.style.transition = 'transform 280ms cubic-bezier(.2,.9,.3,1)';
      wrapper.style.transform = 'perspective(900px) translate3d(0,-6px,0) rotateX(0deg) rotateY(0deg)';
      setTimeout(() => wrapper.style.transition = '', 300);
    });

    wrapper.addEventListener('blur', () => {
      if (reduceMotion) return;
      wrapper.style.transition = 'transform 420ms cubic-bezier(.2,.9,.3,1)';
      wrapper.style.transform = '';
      setTimeout(() => wrapper.style.transition = '', 450);
    });
  }

  /* ---------- UTILS ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function randBetween(a, b) { return a + Math.random() * (b - a); }

  /* ---------- BACKGROUND ANIMATION (Neural Network) ---------- */
  const canvas = document.getElementById('bg-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    // Configuración
    const particleCount = 60; // Cantidad de nodos
    const connectionDistance = 150; // Distancia para conectar
    const mouseDistance = 200; // Radio de interacción del mouse

    // Mouse position
    let mouse = { x: null, y: null };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.x;
      mouse.y = e.y;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.5; // Velocidad lenta
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
        this.color = '#5B21B6'; // Color base (morado)
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Rebotar en bordes
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Interacción con mouse
        if (mouse.x != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseDistance) {
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            const force = (mouseDistance - distance) / mouseDistance;
            const directionX = forceDirectionX * force * 0.5;
            const directionY = forceDirectionY * force * 0.5;

            this.vx -= directionX;
            this.vy -= directionY;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    function init() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    }

    function animate() {
      if (reduceMotion) return; // Respetar preferencia

      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // Conexiones
        for (let j = i; j < particles.length; j++) {
          let dx = particles[i].x - particles[j].x;
          let dy = particles[i].y - particles[j].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(91, 33, 182, ${1 - distance / connectionDistance})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    init();
    animate();
  }
});