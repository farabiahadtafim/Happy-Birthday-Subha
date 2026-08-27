const knife = document.querySelector('.knife-model');

const previewWidth = 922;
const previewHeight = 670;

const modelWidth = () => knife.getBoundingClientRect().width || Math.min(innerWidth * 0.22, 280);
const centerLeft = () => (innerWidth - modelWidth()) / 2 + innerWidth * 0.03;
const scaledX = (value) => (value / previewWidth) * innerWidth;
const scaledY = (value) => (value / previewHeight) * innerHeight;

const steps = [
  { position: () => ({ left: innerWidth * 0.04, top: innerHeight * 0.58 }), rotation: { x: 0, y: 0, z: 0 }, transform: 'translateY(-50%)', scale: 1.32, blur: 0 },
  { position: () => ({ left: centerLeft(), top: scaledY(153) }), rotation: { x: 0, y: 0, z: 90 }, transform: 'none', scale: 1.32, blur: 0 },
  { position: () => ({ left: centerLeft(), top: 0 }), rotation: { x: -25, y: 0, z: 90 }, transform: 'none', scale: 1.32, blur: 0 },
  { position: () => ({ left: centerLeft(), top: scaledY(282.6) }), rotation: { x: -95, y: 0, z: 90 }, transform: 'none', scale: 1.32, blur: 0 },
  { position: () => ({ left: scaledX(700), top: scaledY(300) }), rotation: { x: 0, y: -90, z: -25 }, transform: 'none', scale: 0.792, blur: 5 }
];

let currentStep = 0;
let dragging = false;
let animating = false;
let startX = 0;
let startY = 0;
let pointerX = 0;
let pointerY = 0;
let animationId;

const easeInOut = (value) => value < 0.5
  ? 2 * value * value
  : 1 - ((-2 * value + 2) ** 2) / 2;

const getPosition = (step) => step.position();
const applyState = (position, rotation, transform, scale, blur) => {
  knife.style.left = `${position.left}px`;
  knife.style.top = `${position.top}px`;
  knife.style.transform = `${transform === 'none' ? '' : `${transform} `}scale(${scale})`;
  knife.style.filter = `blur(${blur}px)`;
  knife.orientation = `${rotation.x}deg ${rotation.y}deg ${rotation.z}deg`;
};

const animateToNextStep = () => {
  if (animating || currentStep >= steps.length - 1) return;
  animating = true;
  const from = steps[currentStep];
  const to = steps[currentStep + 1];
  const fromPosition = getPosition(from);
  const toPosition = getPosition(to);
  const startedAt = performance.now();

  const frame = (now) => {
    const progress = Math.min((now - startedAt) / 1500, 1);
    const eased = easeInOut(progress);
    applyState({
      left: fromPosition.left + (toPosition.left - fromPosition.left) * eased,
      top: fromPosition.top + (toPosition.top - fromPosition.top) * eased
    }, {
      x: from.rotation.x + (to.rotation.x - from.rotation.x) * eased,
      y: from.rotation.y + (to.rotation.y - from.rotation.y) * eased,
      z: from.rotation.z + (to.rotation.z - from.rotation.z) * eased
    }, progress < 0.5 ? from.transform : to.transform,
    from.scale + (to.scale - from.scale) * eased,
    from.blur + (to.blur - from.blur) * eased);

    if (progress < 1) {
      animationId = requestAnimationFrame(frame);
    } else {
      currentStep += 1;
      animating = false;
      startX = pointerX;
      startY = pointerY;
      if (currentStep === 2) {
        playCakeCutVideo();
      }
      if (currentStep === steps.length - 2) {
        dragging = false;
        knife.classList.remove('is-dragging');
        animateToNextStep();
        return;
      }
      checkForNextPhase();
    }
  };

  animationId = requestAnimationFrame(frame);
};

const dragIsTowardNextStep = (deltaX, deltaY) => {
  if (currentStep >= steps.length - 1) return false;
  const current = getPosition(steps[currentStep]);
  const next = getPosition(steps[currentStep + 1]);
  const targetX = next.left - current.left;
  const targetY = next.top - current.top;
  const distance = Math.hypot(targetX, targetY) || 1;
  return ((deltaX * targetX + deltaY * targetY) / distance) > 45;
};

const checkForNextPhase = () => {
  if (!dragging || animating || currentStep >= steps.length - 1) return;
  if (dragIsTowardNextStep(pointerX - startX, pointerY - startY)) {
    animateToNextStep();
  }
};

knife.addEventListener('pointerdown', (event) => {
  vanishText();
  if (animating || currentStep >= steps.length - 1) return;
  dragging = true;
  knife.classList.add('is-dragging');
  knife.setPointerCapture(event.pointerId);
  startX = event.clientX;
  startY = event.clientY;
  pointerX = event.clientX;
  pointerY = event.clientY;
  event.preventDefault();
});

knife.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  pointerX = event.clientX;
  pointerY = event.clientY;
  checkForNextPhase();
});

const stopDragging = () => {
  dragging = false;
  knife.classList.remove('is-dragging');
};

knife.addEventListener('pointerup', stopDragging);
knife.addEventListener('pointercancel', stopDragging);
applyState(getPosition(steps[0]), steps[0].rotation, steps[0].transform, steps[0].scale, steps[0].blur);

/* Typing Animation Engine */
const typingElement = document.getElementById('typing-text');
const typingContainer = document.querySelector('.typing-container');

const text1 = "🎂 Now Cake Cut Time 🥳";
const text2 = "Click Blow To Blow The Candles 🕯️";
const text3 = "Take the knife and cut the cake Now 🥳";

let currentTypingToken = 0;

function cancelCurrentTyping() {
  currentTypingToken++;
  return currentTypingToken;
}

function typeText(text, speed = 70, token) {
  const cursorHTML = '<span class="typing-cursor"></span>';
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      if (token !== currentTypingToken) {
        clearInterval(interval);
        resolve(false);
        return;
      }
      if (index < text.length) {
        index++;
        const currentSub = text.substring(0, index);
        typingElement.innerHTML = currentSub + cursorHTML;
      } else {
        clearInterval(interval);
        resolve(true);
      }
    }, speed);
  });
}

function eraseText(speed = 35, token) {
  const cursorHTML = '<span class="typing-cursor"></span>';
  return new Promise((resolve) => {
    let textContent = typingElement.textContent || "";
    let length = textContent.length;
    const interval = setInterval(() => {
      if (token !== currentTypingToken) {
        clearInterval(interval);
        resolve(false);
        return;
      }
      if (length > 0) {
        length--;
        const sub = textContent.substring(0, length);
        typingElement.innerHTML = sub + cursorHTML;
      } else {
        clearInterval(interval);
        typingElement.innerHTML = cursorHTML;
        resolve(true);
      }
    }, speed);
  });
}

function delay(ms, token) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(token === currentTypingToken), ms);
  });
}

async function runTypingSequence() {
  if (!typingElement) return;
  const token = cancelCurrentTyping();

  if (typingContainer) typingContainer.style.opacity = '1';

  const isContinued1 = await delay(300, token);
  if (!isContinued1) return;

  // 1. Type First Text: "🎂 Now Cake Cut Time 🥳"
  const ok1 = await typeText(text1, 70, token);
  if (!ok1) return;

  // 2. Pause so user reads it
  const isContinued2 = await delay(1800, token);
  if (!isContinued2) return;

  // 3. Vanish (Backspace effect)
  const ok2 = await eraseText(35, token);
  if (!ok2) return;

  const isContinued3 = await delay(300, token);
  if (!isContinued3) return;

  // 4. Type Second Text in One Line
  await typeText(text2, 70, token);
}

async function showTakeKnifeText() {
  if (!typingElement) return;
  const token = cancelCurrentTyping();

  if (typingContainer) typingContainer.style.opacity = '1';

  // Immediately set cursor
  typingElement.innerHTML = '<span class="typing-cursor"></span>';

  const isContinued = await delay(200, token);
  if (!isContinued) return;

  // Type new text: "Take the knife and cut the cake Now 🥳"
  await typeText(text3, 60, token);
}

function vanishText() {
  cancelCurrentTyping();
  if (typingContainer) {
    typingContainer.style.transition = 'opacity 0.5s ease';
    typingContainer.style.opacity = '0';
    setTimeout(() => {
      if (typingElement && typingContainer.style.opacity === '0') {
        typingElement.innerHTML = '';
      }
    }, 500);
  }
}

/* Blow Button Click Interaction & Ripple Effect */
const blowBtn = document.getElementById('blow-btn');
const cakeVideo = document.querySelector('.cake-video');

function playCakeCutVideo() {
  if (!cakeVideo) return;

  cakeVideo.muted = false;
  const source = cakeVideo.querySelector('source');
  if (source) source.src = 'cake_cut.mp4';
  cakeVideo.src = 'cake_cut.mp4';
  cakeVideo.load();
  cakeVideo.play().catch(() => {
    cakeVideo.play().catch(() => {});
  });
}

if (blowBtn) {
  blowBtn.addEventListener('click', (e) => {
    // Create Ripple Element
    const rect = blowBtn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    const existingRipple = blowBtn.querySelector('.ripple');
    if (existingRipple) existingRipple.remove();

    blowBtn.appendChild(ripple);

    // Active click style and vanish button
    blowBtn.classList.add('clicked');
    blowBtn.style.pointerEvents = 'none';
    blowBtn.style.opacity = '0';
    blowBtn.style.transform = 'translateX(-50%) scale(0.85)';
    setTimeout(() => {
      blowBtn.style.display = 'none';
      if (window.parent !== window) {
        window.parent.postMessage('cake-blow-button-vanished', '*');
      }
    }, 450);

    // Transition instruction text to "Take the knife and cut the cake Now 🥳"
    showTakeKnifeText();

    // Trigger candle blow video if available
    if (cakeVideo) {
      cakeVideo.muted = false;
      cakeVideo.loop = false;
      cakeVideo.removeAttribute('loop');
      const source = cakeVideo.querySelector('source');
      if (source) {
        source.src = 'candle_blow.mp4';
      }
      cakeVideo.src = 'candle_blow.mp4';
      cakeVideo.load();
      const playPromise = cakeVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          cakeVideo.play().catch(() => {});
        });
      }

      cakeVideo.onended = () => {
        cakeVideo.pause();
      };
    }
  });
}

// Trigger typing sequence
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runTypingSequence);
} else {
  runTypingSequence();
}

