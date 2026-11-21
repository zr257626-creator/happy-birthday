const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const starfield = document.querySelector("#starfield");
const canvas = document.querySelector("#effects-canvas");
const context = canvas.getContext("2d");
const intro = document.querySelector("#intro-screen");
const unwrapButton = document.querySelector("#unwrap-button");
const birthdayNameInput = document.querySelector("#birthday-name");
const celebration = document.querySelector("#celebration");
const heroTitle = document.querySelector("#birthday-title");
const heroName = document.querySelector("#hero-name");
const particles = [];
const balloons = document.querySelector("#balloon-layer");
const audioSupported = "AudioContext" in window || "webkitAudioContext" in window;
let audioContext;
let opened = false;
let candlesBlownOut = false;
let balloonCount = 0;
let nextFireworkAt = 0;
let typewriterStarted = false;
let canvasWidth = 0;
let canvasHeight = 0;

const birthdayMessage = [
  "You make ordinary moments feel like little constellations.",
  "Your kindness is a light people carry with them.",
  "May this new year bring you big joy, quiet peace,",
  "and every beautiful thing your heart is hoping for."
].join("\n");

function createStars() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 115; index += 1) {
    const star = document.createElement("span");
    const size = Math.random() > 0.9 ? 3 : 1 + Math.random() * 1.4;
    star.className = "star";
    star.style.setProperty("--x", `${Math.random() * 100}%`);
    star.style.setProperty("--y", `${Math.random() * 100}%`);
    star.style.setProperty("--size", `${size}px`);
    star.style.setProperty("--opacity", `${0.3 + Math.random() * 0.7}`);
    star.style.setProperty("--twinkle", `${2 + Math.random() * 4}s`);
    star.style.setProperty("--delay", `${-Math.random() * 5}s`);
    fragment.append(star);
  }
  starfield.append(fragment);
}

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.round(canvasWidth * ratio);
  canvas.height = Math.round(canvasHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function getAudioContext() {
  if (!audioSupported) return null;
  if (!audioContext) {
    const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextConstructor();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(frequency, startTime, duration, volume = 0.075, wave = "sine") {
  const audio = getAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.03);
}

function playBirthdayTune() {
  const audio = getAudioContext();
  if (!audio) return;
  const melody = [
    [392, .34], [392, .34], [440, .68], [392, .68], [523.25, .68], [493.88, 1.18],
    [392, .34], [392, .34], [440, .68], [392, .68], [587.33, .68], [523.25, 1.18],
    [392, .34], [392, .34], [783.99, .68], [659.25, .68], [523.25, .68], [493.88, .68], [440, 1.12],
    [698.46, .34], [698.46, .34], [659.25, .68], [523.25, .68], [587.33, .68], [523.25, 1.2]
  ];
  let time = audio.currentTime + 0.04;
  melody.forEach(([frequency, beats]) => {
    const duration = beats * 0.33;
    playTone(frequency, time, duration * 0.88, 0.065);
    time += duration;
  });
}

function playPopSound() {
  const audio = getAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(620, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(150, audio.currentTime + 0.16);
  gain.gain.setValueAtTime(0.12, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.17);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.18);
}

function playBlowSound() {
  const audio = getAudioContext();
  if (!audio) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(380, audio.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(92, audio.currentTime + 0.38);
  gain.gain.setValueAtTime(0.0001, audio.currentTime);
  gain.gain.linearRampToValueAtTime(0.045, audio.currentTime + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.4);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + 0.42);
}

function addParticle(particle) {
  if (particles.length < 1200) particles.push(particle);
}

function launchFirework(x = Math.random() * canvasWidth, y = 90 + Math.random() * canvasHeight * 0.53, amount = 48) {
  const hue = Math.floor(Math.random() * 360);
  const now = performance.now();
  for (let index = 0; index < amount; index += 1) {
    const angle = Math.PI * 2 * index / amount + Math.random() * 0.08;
    const speed = 1.1 + Math.random() * 4.5;
    addParticle({
      type: "spark",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.035 + Math.random() * 0.035,
      hue: hue + Math.random() * 45,
      alpha: 1,
      life: 760 + Math.random() * 740,
      born: now,
      size: 1.2 + Math.random() * 2.2,
      decay: 0.985 + Math.random() * 0.01
    });
  }
}

function launchConfetti(x = canvasWidth / 2, y = canvasHeight / 2, amount = 72) {
  const now = performance.now();
  const colors = [42, 326, 190, 272, 345, 55];
  for (let index = 0; index < amount; index += 1) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.5;
    const speed = 2 + Math.random() * 7;
    addParticle({
      type: "confetti",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      gravity: 0.11 + Math.random() * 0.08,
      hue: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      life: 1900 + Math.random() * 1200,
      born: now,
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.22,
      decay: 0.994
    });
  }
}

function canvasConfetti(x, y, count = 90, spread = 100) {
  if (typeof window.confetti !== "function" || reducedMotion) return;
  window.confetti({
    particleCount: count,
    spread,
    startVelocity: 38,
    gravity: 0.9,
    origin: { x: Math.max(0.05, Math.min(0.95, x / canvasWidth)), y: Math.max(0.05, Math.min(0.9, y / canvasHeight)) },
    colors: ["#ffd98a", "#ff79c8", "#74e6ff", "#9c7aff", "#fff2cc"],
    disableForReducedMotion: true
  });
}

function renderParticles(now) {
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    const age = now - particle.born;
    if (age >= particle.life) {
      particles.splice(index, 1);
      continue;
    }

    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.vx *= particle.decay;
    particle.vy *= particle.decay;
    particle.alpha = Math.max(0, 1 - age / particle.life);
    context.globalAlpha = particle.alpha;

    if (particle.type === "confetti") {
      particle.rotation += particle.spin;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = `hsl(${particle.hue} 96% 69%)`;
      context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.68);
      context.restore();
    } else {
      context.fillStyle = `hsl(${particle.hue} 100% 72%)`;
      context.shadowBlur = 12;
      context.shadowColor = `hsl(${particle.hue} 100% 68%)`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
  }
  context.globalAlpha = 1;
}

function animationFrame(now) {
  renderParticles(now);
  if (!reducedMotion && now >= nextFireworkAt) {
    if (Math.random() > 0.32 || opened) launchFirework();
    nextFireworkAt = now + 1900 + Math.random() * 2200;
  }
  window.requestAnimationFrame(animationFrame);
}

function renderBirthdayName(name) {
  heroName.replaceChildren();
  Array.from(name).forEach((character, index) => {
    const letter = document.createElement("span");
    letter.className = character === " " ? "name-letter space" : "name-letter";
    letter.style.setProperty("--letter-delay", `${0.48 + index * 0.055}s`);
    letter.setAttribute("aria-hidden", "true");
    letter.textContent = character === " " ? "\u00a0" : character;
    heroName.append(letter);
  });
  heroTitle.setAttribute("aria-label", `Happy Birthday, ${name}!`);
  document.querySelector("#letter-name").textContent = name;
  document.querySelector("#voucher-name").textContent = name;
}

function unwrapSurprise() {
  if (opened) return;
  opened = true;
  const name = birthdayNameInput.value.trim() || "Birthday Star";
  birthdayNameInput.value = name;
  renderBirthdayName(name);
  playBirthdayTune();
  intro.classList.add("unwrapping");
  launchFirework(canvasWidth / 2, canvasHeight * 0.43, 86);
  launchConfetti(canvasWidth / 2, canvasHeight * 0.48, 120);
  canvasConfetti(canvasWidth / 2, canvasHeight * 0.48, 110, 125);
  celebration.hidden = false;
  celebration.setAttribute("aria-hidden", "false");
  document.body.classList.add("unwrapped");
  window.requestAnimationFrame(() => celebration.classList.add("is-visible"));
  startBalloonFleet();

  window.setTimeout(() => intro.classList.add("exit"), 420);
  window.setTimeout(() => {
    intro.hidden = true;
    document.querySelector("#birthday-title").setAttribute("tabindex", "-1");
    document.querySelector("#birthday-title").focus({ preventScroll: true });
    document.querySelectorAll(".reveal, .memory-card").forEach((element) => revealObserver.observe(element));
  }, 1320);
}

function spawnBalloon() {
  if (balloonCount >= 9 || celebration.hidden) return;
  balloonCount += 1;
  const balloon = document.createElement("button");
  const color = ["#ff78c8", "#8d7aff", "#61dced", "#ffb36b", "#bb8cff", "#ff708e"][Math.floor(Math.random() * 6)];
  const duration = 16 + Math.random() * 11;
  balloon.type = "button";
  balloon.className = "balloon";
  balloon.style.setProperty("--balloon-x", `${4 + Math.random() * 91}%`);
  balloon.style.setProperty("--float-duration", `${duration}s`);
  balloon.style.setProperty("--float-delay", `${Math.random() * 2}s`);
  balloon.style.setProperty("--balloon-color", color);
  balloon.setAttribute("aria-label", "Pop this floating balloon");
  balloon.innerHTML = '<span class="balloon-shape"></span><span class="balloon-string"></span>';
  balloons.append(balloon);

  balloon.addEventListener("click", () => {
    const rect = balloon.getBoundingClientRect();
    balloon.classList.add("popping");
    playPopSound();
    launchConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
    canvasConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, 65);
    window.setTimeout(() => {
      balloon.remove();
      balloonCount -= 1;
      spawnBalloon();
    }, 360);
  });

  balloon.addEventListener("animationend", () => {
    if (!balloon.isConnected || balloon.classList.contains("popping")) return;
    balloon.remove();
    balloonCount -= 1;
    window.setTimeout(spawnBalloon, 500);
  }, { once: true });
}

function startBalloonFleet() {
  if (reducedMotion) return;
  for (let index = 0; index < 8; index += 1) {
    window.setTimeout(spawnBalloon, index * 520);
  }
}

function typeBirthdayLetter() {
  if (typewriterStarted) return;
  typewriterStarted = true;
  const output = document.querySelector("#typed-message");
  if (reducedMotion) {
    output.textContent = birthdayMessage;
    return;
  }
  output.classList.add("typing");
  let characterIndex = 0;
  function typeNextCharacter() {
    if (characterIndex >= birthdayMessage.length) {
      output.classList.remove("typing");
      return;
    }
    const character = birthdayMessage[characterIndex];
    output.textContent += character;
    characterIndex += 1;
    const delay = character === "\n" ? 280 : /[,.]/.test(character) ? 180 : 28;
    window.setTimeout(typeNextCharacter, delay);
  }
  typeNextCharacter();
}

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        if (entry.target.id === "letter") typeBirthdayLetter();
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -35px 0px" })
  : { observe: (element) => { element.classList.add("is-visible"); if (element.id === "letter") typeBirthdayLetter(); } };

function toggleCandles() {
  const cake = document.querySelector(".cake");
  const buttonLabel = document.querySelector("#blow-button-label");
  const status = document.querySelector("#candle-status");
  const button = document.querySelector("#blow-button");

  candlesBlownOut = !candlesBlownOut;
  cake.classList.toggle("blown-out", candlesBlownOut);
  button.setAttribute("aria-pressed", String(candlesBlownOut));
  if (candlesBlownOut) {
    playBlowSound();
    buttonLabel.textContent = "Relight the Candles";
    status.textContent = "Wish sent. May it find its way to you. ✨";
    document.querySelector("#warm-flash").classList.remove("flash-active");
    void document.querySelector("#warm-flash").offsetWidth;
    document.querySelector("#warm-flash").classList.add("flash-active");
    for (let index = 0; index < 5; index += 1) {
      window.setTimeout(() => launchFirework(canvasWidth * (0.12 + Math.random() * 0.76), canvasHeight * (0.15 + Math.random() * 0.48), 70), index * 185);
    }
    launchConfetti(canvasWidth / 2, canvasHeight * 0.46, 180);
    canvasConfetti(canvasWidth / 2, canvasHeight * 0.46, 180, 150);
  } else {
    playTone(523.25, getAudioContext()?.currentTime ?? 0, 0.3, 0.055);
    buttonLabel.textContent = "Blow Out Candles";
    status.textContent = "Candles are glowing again. Make another wish!";
  }
}

function tiltCard(card, event) {
  if (reducedMotion) return;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  const maxTilt = card.classList.contains("memory-card") ? 8 : 4;
  card.style.setProperty("--tilt-x", `${(0.5 - y) * maxTilt}deg`);
  card.style.setProperty("--tilt-y", `${(x - 0.5) * maxTilt}deg`);
}

function resetTilt(card) {
  card.style.setProperty("--tilt-x", "0deg");
  card.style.setProperty("--tilt-y", "0deg");
}

function toggleEnvelope() {
  const button = document.querySelector("#envelope-button");
  const hint = document.querySelector("#envelope-hint");
  const isOpen = button.classList.toggle("is-open");
  button.setAttribute("aria-expanded", String(isOpen));
  button.setAttribute("aria-label", isOpen ? "Close your birthday envelope" : "Open your birthday envelope");
  hint.textContent = isOpen ? "A whole day of joy, reserved just for you ♡" : "Tap the envelope to open your wish";
  if (isOpen) {
    launchConfetti(canvasWidth / 2, canvasHeight * 0.62, 48);
    canvasConfetti(canvasWidth / 2, canvasHeight * 0.62, 50, 75);
  }
}

createStars();
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
window.requestAnimationFrame(animationFrame);
unwrapButton.addEventListener("click", unwrapSurprise);
document.querySelector("#blow-button").addEventListener("click", toggleCandles);
document.querySelector("#envelope-button").addEventListener("click", toggleEnvelope);
document.querySelectorAll(".tilt-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => tiltCard(card, event));
  card.addEventListener("pointerleave", () => resetTilt(card));
});
if (!reducedMotion) nextFireworkAt = performance.now() + 1400;
