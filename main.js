/**
 * Interactive Birthday Page — 100% Gapless Canvas Blooming & Dynamic Physics Engine
 */

function initApp() {
  const backgroundMusic = document.getElementById('background-music') || new Audio();
  backgroundMusic.loop = true;
  backgroundMusic.preload = 'auto';
  let activeMusic = '';

  function playBackgroundMusic(file) {
    if (activeMusic === file) return;

    activeMusic = file;
    backgroundMusic.muted = false;
    backgroundMusic.src = file;
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(() => {
      backgroundMusic.muted = true;
      backgroundMusic.play().catch(() => {});
    });
  }

  function resumeBackgroundMusic() {
    backgroundMusic.muted = false;
    backgroundMusic.play().catch(() => {});
  }

  function startIntroMusic() {
    playBackgroundMusic('music/Pov- You\u2019re in a long-distance relationship with your partner, and it\u2019s their birthday today, so.mp3');
  }

  function startBirthdayMusic() {
    playBackgroundMusic('music/Happy Birthday My Love  - Friz Love - (64 Kbps).mp3');
  }

  function updateMusicToggle() {
    if (!musicToggle) return;

    const isPlaying = !backgroundMusic.paused;
    musicToggle.classList.toggle('is-paused', !isPlaying);
    musicToggle.setAttribute('aria-label', isPlaying ? 'Pause music' : 'Play music');
    musicToggle.title = isPlaying ? 'Pause music' : 'Play music';
  }

  backgroundMusic.addEventListener('play', updateMusicToggle);
  backgroundMusic.addEventListener('pause', updateMusicToggle);
  backgroundMusic.addEventListener('ended', updateMusicToggle);

  // DOM Elements
  const musicToggle = document.getElementById('music-toggle');
  const envelopeScreen = document.getElementById('envelope-screen');
  const envelopeBtn = document.getElementById('envelope-btn');
  const envelopeImg = document.getElementById('envelope-img');
  const tapText = document.getElementById('tap-text');
  const canvas = document.getElementById('flower-canvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const bloomOverlayText = document.getElementById('bloom-overlay-text');
  const unveiledLayer = document.getElementById('unveiled-layer');

  startIntroMusic();

  // Application States
  const STATES = {
    ENVELOPE: 'ENVELOPE',
    BLOOMING: 'BLOOMING',
    BLOOM_COMPLETE: 'BLOOM_COMPLETE',
    FALLING: 'FALLING'
  };
  let currentState = STATES.ENVELOPE;

  // WebP Asset Loading
  const flowerImages = [];
  const TOTAL_FLOWERS = 26;

  for (let i = 1; i <= TOTAL_FLOWERS; i++) {
    const img = new Image();
    img.src = `images/Flower/${i}.webp`;
    flowerImages.push(img);
  }

  // Canvas Resolution
  let width = window.innerWidth;
  let height = window.innerHeight;

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Optimized Canvas Flower Particle Class
  class FlowerParticle {
    constructor(img, targetX, targetY, targetScale, targetRotation, delayMs) {
      this.img = img;
      
      // Start at envelope center
      this.startX = width / 2;
      this.startY = height / 2;
      
      this.x = this.startX;
      this.y = this.startY;
      
      this.targetX = targetX;
      this.targetY = targetY;
      
      this.scale = 0;
      this.targetScale = targetScale;
      
      this.rotation = targetRotation;
      this.targetRotation = targetRotation;
      
      this.delayMs = delayMs;
      this.elapsedMs = 0;
      this.durationMs = 900 + Math.random() * 350; // Smooth 0.9s - 1.25s bloom
      this.progress = 0;

      // Ambient idle movement parameters
      this.swayPhase = Math.random() * Math.PI * 2;
      this.swaySpeed = 0.0015 + Math.random() * 0.0015;
      this.rotSpeed = 0.001 + Math.random() * 0.001;

      // Physics properties for State 3 (Offscreen Fall)
      this.vx = (Math.random() - 0.5) * 4;
      this.vy = -(Math.random() * 3 + 1);
      this.gravity = 0.45 + Math.random() * 0.25;
      this.drag = 0.985;
      this.vr = (Math.random() - 0.5) * 0.05;
      this.alpha = 1;
      this.isSettled = false;
      this.settledY = height + 350 + Math.random() * 200;
    }

    updateBloom(deltaMs) {
      if (this.delayMs > 0) {
        this.delayMs -= deltaMs;
        return;
      }

      if (this.progress < 1) {
        this.elapsedMs += deltaMs;
        this.progress = Math.min(1, this.elapsedMs / this.durationMs);

        // High precision smooth cubic-bezier spring ease
        const t = this.progress;
        const ease = 1 - Math.pow(1 - t, 3.5);
        
        this.x = this.startX + (this.targetX - this.startX) * ease;
        this.y = this.startY + (this.targetY - this.startY) * ease;
        this.scale = this.targetScale * ease;
      }
    }

    updateIdle(timeMs) {
      // Smooth continuous floating, wobble & breathing movement
      const timeOffset = timeMs * this.swaySpeed + this.swayPhase;
      const rotOffset = Math.sin(timeMs * this.rotSpeed + this.swayPhase) * 0.14;
      const floatX = Math.sin(timeOffset) * 12 + Math.cos(timeOffset * 0.5) * 6;
      const floatY = Math.cos(timeOffset) * 12 + Math.sin(timeOffset * 0.5) * 6;
      const pulseScale = 1 + Math.sin(timeMs * 0.002 + this.swayPhase) * 0.04;

      this.x = this.targetX + floatX;
      this.y = this.targetY + floatY;
      this.rotation = this.targetRotation + rotOffset;
      this.scale = this.targetScale * pulseScale;
    }

    updatePhysics(timeMs) {
      if (this.isSettled) return;

      this.vy += this.gravity;
      this.vy *= this.drag;
      this.vx *= this.drag;
      
      this.vx += Math.sin(timeMs * 0.002 + this.swayPhase) * 0.3;

      this.x += this.vx;
      this.y += this.vy;
      this.rotation += this.vr;

      if (this.alpha > 0) {
        this.alpha -= 0.012;
        if (this.alpha < 0) this.alpha = 0;
      }

      if (this.y >= this.settledY) {
        this.isSettled = true;
      }
    }

    draw(ctx) {
      if (this.scale <= 0 || this.alpha <= 0 || !this.img.complete) return;

      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      const drawW = this.img.width * this.scale;
      const drawH = this.img.height * this.scale;

      ctx.drawImage(this.img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }
  }

  // Particle System Manager
  let particles = [];

  function createDenseBloomParticles() {
    particles = [];
    
    // Grid parameters for 100% gapless screen coverage
    const margin = 140;
    const minX = -margin;
    const maxX = width + margin;
    const minY = -margin;
    const maxY = height + margin;

    // Optimal grid step for high FPS & gapless overlap
    const step = width < 600 ? 95 : 115;
    
    const cols = Math.ceil((maxX - minX) / step);
    const rows = Math.ceil((maxY - minY) / step);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(Math.pow(width / 2 + margin, 2) + Math.pow(height / 2 + margin, 2));

    // Base Layer
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const gridX = minX + c * step + (Math.random() - 0.5) * 35;
        const gridY = minY + r * step + (Math.random() - 0.5) * 35;
        
        const distFromCenter = Math.sqrt(Math.pow(gridX - centerX, 2) + Math.pow(gridY - centerY, 2));
        const normDist = distFromCenter / maxDistance;

        // 20% smaller target scale factor
        const targetScale = (width < 600 ? 0.50 : 0.72) * (0.88 + Math.random() * 0.35);
        const rotation = Math.random() * Math.PI * 2;
        
        // Delay in ms radiating from center outward
        const delayMs = normDist * 450 + Math.random() * 120;
        const img = flowerImages[(r * cols + c) % flowerImages.length];

        particles.push(new FlowerParticle(img, gridX, gridY, targetScale, rotation, delayMs));
      }
    }

    // Midground Layer
    const extraCount = Math.floor(cols * rows * 0.45);
    for (let i = 0; i < extraCount; i++) {
      const randX = minX + Math.random() * (maxX - minX);
      const randY = minY + Math.random() * (maxY - minY);

      const distFromCenter = Math.sqrt(Math.pow(randX - centerX, 2) + Math.pow(randY - centerY, 2));
      const normDist = distFromCenter / maxDistance;

      const targetScale = (width < 600 ? 0.42 : 0.64) * (0.8 + Math.random() * 0.35);
      const rotation = Math.random() * Math.PI * 2;
      const delayMs = normDist * 480 + Math.random() * 150;
      const img = flowerImages[(i * 7 + 3) % flowerImages.length];

      particles.push(new FlowerParticle(img, randX, randY, targetScale, rotation, delayMs));
    }

    // Sort by radial delay for outward radial bloom expansion
    particles.sort((a, b) => a.delayMs - b.delayMs);
  }

  // Time-Delta Animation Loop
  let lastTime = 0;

  function render(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaMs = Math.min(32, timestamp - lastTime);
    lastTime = timestamp;

    ctx.clearRect(0, 0, width, height);

    if (currentState === STATES.BLOOMING || currentState === STATES.BLOOM_COMPLETE) {
      let allDone = true;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.updateBloom(deltaMs);
        
        if (p.progress >= 1) {
          p.updateIdle(timestamp);
        } else {
          allDone = false;
        }

        p.draw(ctx);
      }

      if (allDone && currentState === STATES.BLOOMING) {
        currentState = STATES.BLOOM_COMPLETE;
        bloomOverlayText.classList.remove('hidden');
        canvas.classList.add('interactive');
      }
    } else if (currentState === STATES.FALLING) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.updatePhysics(timestamp);
        p.draw(ctx);
      }
    }

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // User Interaction Handlers
  function handleEnvelopeClick() {
    if (currentState !== STATES.ENVELOPE) return;

    // Trigger wiggle shake animation
    envelopeBtn.classList.add('shake');
    tapText.style.opacity = '0';

    // At halfway point of wiggle shake (~260ms), swap image to opened
    setTimeout(() => {
      envelopeImg.src = 'images/envelope-opened.webp';
    }, 260);

    // At end of wiggle shake (~520ms), fade screen out & start bloom explosion
    setTimeout(() => {
      currentState = STATES.BLOOMING;
      envelopeScreen.classList.add('fade-out');
      createDenseBloomParticles();
    }, 520);
  }

  // Anti-Gravity Floating Balloons, Word Groups & Emojis Spawner
  let balloonsInitialized = false;

  function initFloatingBalloons() {
    if (balloonsInitialized) return;
    balloonsInitialized = true;

    const bgLayer = document.getElementById('balloons-bg-layer');
    const fgLayer = document.getElementById('balloons-fg-layer');
    if (!bgLayer || !fgLayer) return;

    const happyChars = [
      'images/Happy Birthday/Happy/H.png',
      'images/Happy Birthday/Happy/A.png',
      'images/Happy Birthday/Happy/P.png',
      'images/Happy Birthday/Happy/P2.png',
      'images/Happy Birthday/Happy/Y.png'
    ];

    const birthdayChars = [
      'images/Happy Birthday/Birthday/B.png',
      'images/Happy Birthday/Birthday/I.png',
      'images/Happy Birthday/Birthday/R.png',
      'images/Happy Birthday/Birthday/T.png',
      'images/Happy Birthday/Birthday/H2.png',
      'images/Happy Birthday/Birthday/D.png',
      'images/Happy Birthday/Birthday/A2.png',
      'images/Happy Birthday/Birthday/Y2.png'
    ];

    const balloonImages = [
      'images/Happy Birthday/Blue Baloon.png',
      'images/Happy Birthday/Orange Baloon.png',
      'images/Happy Birthday/Pink Baloon.png',
      'images/Happy Birthday/White Baloon.png',
      'images/Happy Birthday/Multiple Ballon.png'
    ];

    const emojiImages = [
      'images/Happy Birthday/1.png',
      'images/Happy Birthday/2.png',
      'images/Happy Birthday/3.png',
      'images/Happy Birthday/4.png',
      'images/Happy Birthday/8.png',
      'images/Happy Birthday/9.png',
      'images/Happy Birthday/104b4dc5f4f72a05a1a2479249abbdac.png',
      'images/Happy Birthday/679e2f2349a5a6181d277f99b7bf34ce.png',
      'images/Happy Birthday/b6776ed102c59790ab8c045e5efb358f 1.png'
    ];

    // Helper to create a unified floating word group (HAPPY or BIRTHDAY)
    function spawnWordGroup(wordType, leftPos, duration, delay, swayX, rot, isFg) {
      const targetLayer = isFg ? fgLayer : bgLayer;
      const group = document.createElement('div');
      group.className = `word-fly-group ${wordType}`;
      group.style.left = `${leftPos}%`;
      group.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      group.style.setProperty('--delay', `${delay.toFixed(2)}s`);
      group.style.setProperty('--sway-x', `${swayX.toFixed(0)}px`);
      group.style.setProperty('--rot', `${rot.toFixed(0)}deg`);

      const charList = wordType === 'happy' ? happyChars : birthdayChars;

      charList.forEach((src, idx) => {
        const img = document.createElement('img');
        img.className = 'char-img';
        img.src = src;
        img.style.setProperty('--char-delay', `${(idx * 0.18).toFixed(2)}s`);
        group.appendChild(img);
      });

      targetLayer.appendChild(group);
    }

    // Spawn unified word groups (HAPPY & BIRTHDAY) floating continuously in streams
    // Stream 1
    spawnWordGroup('happy', 18, 11.5, 0.2, -40, -8, true);
    spawnWordGroup('birthday', 42, 13.0, 2.2, 50, 6, true);

    // Stream 2
    spawnWordGroup('happy', 55, 12.0, 5.8, 35, 8, true);
    spawnWordGroup('birthday', 10, 13.5, 7.5, -45, -6, true);

    // Stream 3
    spawnWordGroup('happy', 25, 12.5, 11.0, -30, -5, true);
    spawnWordGroup('birthday', 48, 14.0, 13.0, 40, 7, true);

    // Spawn floating balloons and emojis around the word groups
    const totalBalloonsAndEmojis = 26;

    for (let i = 0; i < totalBalloonsAndEmojis; i++) {
      const isForeground = Math.random() > 0.5;
      const targetLayer = isForeground ? fgLayer : bgLayer;

      const img = document.createElement('img');
      img.className = 'floating-balloon-item';

      const isEmoji = Math.random() > 0.65;
      if (isEmoji) {
        img.src = emojiImages[i % emojiImages.length];
        const size = 45 + Math.random() * 35;
        img.style.width = `${size}px`;
      } else {
        img.src = balloonImages[i % balloonImages.length];
        const size = 70 + Math.random() * 65;
        img.style.width = `${size}px`;
      }

      const leftPos = Math.random() * 92;
      const duration = 8 + Math.random() * 8;
      const delay = Math.random() * 12;
      const swayX = (Math.random() - 0.5) * 160;
      const rot = (Math.random() - 0.5) * 50;

      img.style.left = `${leftPos}%`;
      img.style.setProperty('--duration', `${duration.toFixed(2)}s`);
      img.style.setProperty('--delay', `${delay.toFixed(2)}s`);
      img.style.setProperty('--sway-x', `${swayX.toFixed(0)}px`);
      img.style.setProperty('--rot', `${rot.toFixed(0)}deg`);

      targetLayer.appendChild(img);
    }
  }

  // Fixed anti-gravity images are enabled only while slides 2, 3, or 4 is visible.
  function initAntiGravityImages() {
    const layer = document.getElementById('anti-gravity-layer');
    const unveiled = document.getElementById('unveiled-layer');
    const activeSlides = [...document.querySelectorAll('#slide-2, #slide-3, #slide-4')];
    if (!layer || !unveiled || !activeSlides.length) return;

    const imagePaths = [
      'images/Cake.png',
      'images/love eye.webp',
      'images/Pookie.png',
      'images/Love.png',
      'images/Love.png',
      'images/Love.png',
      'images/Love.png',
      'images/Kissy.png'
    ];

    const itemCount = 16;
    for (let index = 0; index < itemCount; index++) {
      const image = document.createElement('img');
      image.className = 'anti-gravity-item';
      image.src = imagePaths[index % imagePaths.length];
      image.alt = '';
      image.style.setProperty('--start-left', `${10 + Math.random() * 80}%`);
      image.style.setProperty('--size', `${28 + Math.random() * 14}px`);
      image.style.setProperty('--float-duration', `${10 + Math.random() * 8}s`);
      image.style.setProperty('--float-delay', `${-Math.random() * 12}s`);
      image.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 180}px`);
      image.style.setProperty('--start-rotation', `${(Math.random() - 0.5) * 24}deg`);
      image.style.setProperty('--end-rotation', `${(Math.random() - 0.5) * 48}deg`);
      layer.appendChild(image);
    }

    const observer = new IntersectionObserver((entries) => {
      const isActive = entries.some((entry) => entry.isIntersecting);
      layer.classList.toggle('active', isActive);
    }, { root: unveiled, threshold: 0.35 });

    activeSlides.forEach((slide) => observer.observe(slide));
  }

  function handleBloomClick() {
    if (currentState !== STATES.BLOOM_COMPLETE && currentState !== STATES.BLOOMING) return;

    startBirthdayMusic();
    currentState = STATES.FALLING;

    bloomOverlayText.classList.add('hidden');
    canvas.classList.remove('interactive');
    unveiledLayer.classList.remove('hidden');
    initFloatingBalloons();
  }

  // Interactive Drag-and-Drop for Polaroid Cards
  function initPolaroidDrag() {
    const cards = document.querySelectorAll('.polaroid-card');
    let activeCard = null;
    let offsetX = 0;
    let offsetY = 0;
    let maxZIndex = 200;

    cards.forEach((card) => {
      card.addEventListener('mousedown', startDrag);
      card.addEventListener('touchstart', startDrag, { passive: false });
    });

    function startDrag(e) {
      activeCard = e.currentTarget;
      maxZIndex++;
      activeCard.style.zIndex = maxZIndex;
      activeCard.classList.add('dragging');

      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      const rect = activeCard.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;

      document.addEventListener('mousemove', onDrag);
      document.addEventListener('touchmove', onDrag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    }

    function onDrag(e) {
      if (!activeCard) return;
      if (e.cancelable) e.preventDefault();

      const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

      const parentRect = activeCard.parentElement.getBoundingClientRect();
      const newLeft = clientX - parentRect.left - offsetX;
      const newTop = clientY - parentRect.top - offsetY;

      activeCard.style.left = `${newLeft}px`;
      activeCard.style.top = `${newTop}px`;
    }

    function stopDrag() {
      if (activeCard) {
        activeCard.classList.remove('dragging');
        activeCard = null;
      }
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }

  // Advanced Interactive 3D Infinity Ribbon Carousel Physics Engine
  let ribbonAnimationFrameId = null;

  function init3DInfinityRibbonAnimation() {
    const container = document.getElementById('infinity-gallery') || document.getElementById('spiral-ribbon-container');
    if (!container) return;
    container.innerHTML = '';

    const imagePaths = [
      'images/Subha/Hero 2/589921938_1511684856755834_1072618423494190453_n.png',
      'images/Subha/Hero 2/605882271_2041195483338596_7501771031874749591_n.png',
      'images/Subha/Hero 2/608285406_4446658475561896_8283040957447243239_n.png',
      'images/Subha/Hero 2/608422210_1201458685447402_2872160073547415746_n.png',
      'images/Subha/Hero 2/608426947_2475852026150656_4368029200227351580_n.png',
      'images/Subha/Hero 2/608764431_2618021481902526_1380587592484009063_n.png',
      'images/Subha/Hero 2/609317788_716035808254333_363148713040591868_n.png',
      'images/Subha/Hero 2/609746003_739680088750789_1009677198448807334_n.png',
      'images/Subha/Hero 2/609787795_1380210683848159_718965011234550831_n.png',
      'images/Subha/Hero 2/610459653_1142324894445809_4908197052390803718_n.png',
      'images/Subha/Hero 2/610526866_708574132136671_7591169867108868921_n.png',
      'images/Subha/Hero 2/610527399_1242736521389804_2994083857528779500_n.png',
      'images/Subha/Hero 2/611219175_1227870072774469_1519818138232412819_n.png',
      'images/Subha/Hero 2/612020781_2148195728922309_4962677815590005296_n.png',
      'images/Subha/Hero 2/612239488_2826753160863366_6318388729419094378_n.png',
      'images/Subha/Hero 2/613773403_811931418544061_4967691029767441368_n.png',
      'images/Subha/Hero 2/617546042_1814938205889674_3559039245349911653_n.png',
      'images/Subha/Hero 2/618544167_971040386090526_4751486550846135295_n.png'
    ];

    const cards = [];
    const count = imagePaths.length;

    imagePaths.forEach((src, i) => {
      const card = document.createElement('div');
      card.className = 'spiral-card';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `Subha Memory ${i + 1}`;
      card.appendChild(img);
      container.appendChild(card);
      cards.push(card);
    });

    // Physics Engine State
    let timeOffset = 0;
    const baseSpeed = 0.004;
    let currentVelocity = baseSpeed;
    const friction = 0.95; // Damping ratio for inertia

    let isDragging = false;
    let startX = 0;
    let dragVelocity = 0;

    const centerX = 300;
    const centerY = 260;
    const radiusX = 320;
    const radiusY = 250;

    // Drag to Rotate Event Handlers
    function onPointerDown(e) {
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      currentVelocity = 0; // Click down instantly resets high momentum!
      dragVelocity = 0;
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const deltaX = currentX - startX;
      startX = currentX;

      const angleDelta = deltaX * 0.0035;
      timeOffset += angleDelta;
      dragVelocity = angleDelta;
    }

    function onPointerUp() {
      if (isDragging) {
        isDragging = false;
        currentVelocity = dragVelocity; // Transfer drag velocity to inertia momentum!
      }
    }

    // Attach listeners to gallery container & window
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);

    // 60FPS Render Loop with Physics & Damping (Rotation never pauses on hover)
    function renderLoop() {
      if (!isDragging) {
        // Exponential Damping towards baseSpeed
        currentVelocity = currentVelocity * friction + baseSpeed * (1 - friction);
        timeOffset += currentVelocity;
      }

      cards.forEach((card, i) => {
        const baseAngle = (i / count) * Math.PI * 2;
        const angle = baseAngle + timeOffset;

        // 3D Infinity Figure-8 Curve
        const x = centerX + Math.sin(angle) * radiusX;
        const y = centerY + Math.sin(angle * 2) * (radiusY * 0.55);
        const z = Math.cos(angle); // Depth factor (-1 back to +1 front)

        const scale = 0.70 + (z + 1) * 0.175; // 0.70 to 1.05
        const zIndex = Math.floor((z + 1) * 50) + 10;
        const opacity = 0.60 + (z + 1) * 0.20;
        const rot = Math.cos(angle) * 15 + Math.sin(angle * 2) * 10;

        card.style.left = `${x.toFixed(1)}px`;
        card.style.top = `${y.toFixed(1)}px`;
        card.style.transform = `scale(${scale.toFixed(2)}) rotate(${rot.toFixed(1)}deg)`;
        card.style.zIndex = zIndex;
        card.style.opacity = opacity.toFixed(2);
      });

      ribbonAnimationFrameId = requestAnimationFrame(renderLoop);
    }

    if (ribbonAnimationFrameId) cancelAnimationFrame(ribbonAnimationFrameId);
    renderLoop();
  }

  // Cute Multi-Step Intro Sequence Logic
  function initIntroSequence() {
    const introSeq = document.getElementById('intro-sequence');
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');
    const btnGoBack = document.getElementById('btn-goback');
    const btnClick = document.getElementById('btn-click');

    if (!introSeq || !step1 || !btnNo) return;

    let isCatchable = false;
    let currentX = 0;
    let currentY = 0;
    let lastJumpTime = 0;

    function resetBtnNoPosition() {
      currentX = 0;
      currentY = 0;
      btnNo.style.transform = 'translate(0, 0)';
    }

    // Function to calculate small random translate offset (-80px to 80px) and move smoothly
    function moveNoButton() {
      if (!isCatchable && step1.style.display !== 'none') {
        const now = Date.now();
        if (now - lastJumpTime < 180) return;
        lastJumpTime = now;

        // Base position (un-transformed) relative to viewport
        const rect = btnNo.getBoundingClientRect();
        const baseLeft = rect.left - currentX;
        const baseRight = rect.right - currentX;
        const baseTop = rect.top - currentY;
        const baseBottom = rect.bottom - currentY;

        // Screen boundary margins to prevent overflow or scrolling
        const margin = 16;
        const minAllowedX = margin - baseLeft;
        const maxAllowedX = window.innerWidth - margin - baseRight;
        const minAllowedY = margin - baseTop;
        const maxAllowedY = window.innerHeight - margin - baseBottom;

        // Randomized offset between -100px to 100px relative to original position (0, 0)
        let targetX, targetY;
        let attempts = 0;

        do {
          const rawX = Math.floor(Math.random() * 201) - 100; // -100 to +100
          const rawY = Math.floor(Math.random() * 201) - 100; // -100 to +100

          // Clamp to screen bounds to prevent overflow
          targetX = Math.max(minAllowedX, Math.min(maxAllowedX, rawX));
          targetY = Math.max(minAllowedY, Math.min(maxAllowedY, rawY));
          attempts++;
        } while (Math.hypot(targetX - currentX, targetY - currentY) < 45 && attempts < 10);

        currentX = targetX;
        currentY = targetY;

        btnNo.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }

    // Add mouseover / mouseenter / touchstart event listeners to 'No' button
    btnNo.addEventListener('mouseover', moveNoButton);
    btnNo.addEventListener('mouseenter', moveNoButton);
    btnNo.addEventListener('touchstart', moveNoButton, { passive: true });

    // Proximity check on mousemove over intro overlay so it glides away when mouse gets close
    introSeq.addEventListener('mousemove', (e) => {
      if (!isCatchable && step1.style.display !== 'none') {
        const btnRect = btnNo.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const btnCenterY = btnRect.top + btnRect.height / 2;
        const dist = Math.hypot(mouseX - btnCenterX, mouseY - btnCenterY);

        if (dist < 75) {
          moveNoButton();
        }
      }
    });

    // 10-second runaway timer on load. After 10s set isCatchable = true and smoothly reset position
    const catchTimer = setTimeout(() => {
      isCatchable = true;
      resetBtnNoPosition();
    }, 10000);

    // Navigation logic
    btnNo.addEventListener('click', (e) => {
      if (!isCatchable) {
        e.preventDefault();
        e.stopPropagation();
        moveNoButton();
        return;
      }
      step1.style.display = 'none';
      step2.style.display = 'flex';
    });

    btnGoBack.addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = 'flex';
      isCatchable = true;
      clearTimeout(catchTimer);
      resetBtnNoPosition();
    });

    btnYes.addEventListener('click', () => {
      step1.style.display = 'none';
      step3.style.display = 'flex';
    });

    btnClick.addEventListener('click', () => {
      introSeq.classList.add('fade-out');
      setTimeout(() => {
        if (introSeq.parentNode) {
          introSeq.remove();
        }
        // Reveal envelope screen so user can experience "Tap to open" and flower blooming
        if (envelopeScreen) {
          envelopeScreen.style.display = 'flex';
        }
      }, 600);
    });
  }

  // Interactive Bouncing Heart Scroll Handler (1 Click = 1 Page Scroll)
  function initHeartScrollButton() {
    const scrollBtn = document.getElementById('scroll-heart-btn');
    const unveiledLayer = document.getElementById('unveiled-layer');
    if (!scrollBtn || !unveiledLayer) return;

    let isNavigating = false;
    let cakeButtonVanished = false;
    const cakeSlide = document.getElementById('slide-4');
    const cakeFrame = document.querySelector('.cake-frame');

    const updateScrollButtonVisibility = (isCakeVisible) => {
      scrollBtn.classList.toggle('is-hidden', isCakeVisible && !cakeButtonVanished);
    };

    if (cakeSlide) {
      const cakeObserver = new IntersectionObserver(([entry]) => {
        updateScrollButtonVisibility(entry.isIntersecting);
      }, { threshold: 0.6 });
      cakeObserver.observe(cakeSlide);
    }

    window.addEventListener('message', (event) => {
      if (event.source !== cakeFrame?.contentWindow || event.data !== 'cake-blow-button-vanished') return;
      cakeButtonVanished = true;
      updateScrollButtonVisibility(true);
    });

    scrollBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isNavigating) return;

      const slides = document.querySelectorAll('.birthday-slide');
      if (!slides.length) return;

      const currentScroll = unveiledLayer.scrollTop;
      let currentIndex = 0;
      let closestDistance = Infinity;

      slides.forEach((slide, index) => {
        const distance = Math.abs(slide.offsetTop - currentScroll);
        if (distance < closestDistance) {
          closestDistance = distance;
          currentIndex = index;
        }
      });

      let nextIndex = currentIndex + 1;

      if (nextIndex >= slides.length) {
        nextIndex = 0; // Loop back to top
      }

      isNavigating = true;
      unveiledLayer.scrollTo({
        top: slides[nextIndex].offsetTop,
        behavior: 'smooth'
      });

      setTimeout(() => {
        isNavigating = false;
      }, 750);
    });
  }

  // Pre-initialize anti-gravity floating elements, 3D infinity ribbon & polaroid drag
  initFloatingBalloons();
  initAntiGravityImages();
  init3DInfinityRibbonAnimation();
  initPolaroidDrag();
  initIntroSequence();
  initHeartScrollButton();

  if (musicToggle) {
    musicToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (backgroundMusic.paused) {
        resumeBackgroundMusic();
      } else {
        backgroundMusic.pause();
      }
      updateMusicToggle();
    });
    updateMusicToggle();
  }

  // Event Listeners
  if (envelopeScreen) {
    envelopeScreen.addEventListener('click', handleEnvelopeClick);
  }
  document.addEventListener('click', (event) => {
    if (event.target.closest('#music-toggle')) return;
    resumeBackgroundMusic();
  }, { once: true });
  if (canvas) {
    canvas.addEventListener('click', handleBloomClick);
  }
  document.addEventListener('click', (e) => {
    if (currentState === STATES.BLOOM_COMPLETE) {
      handleBloomClick();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

