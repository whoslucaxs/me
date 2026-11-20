const waves = document.querySelector("#waves");
const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
const shades = " .,:;+=xX$&#";
const nameElement = document.querySelector("#name");
const names = ["nyx", "whoslucax"];
let nameIndex = 0;
let deleting = true;
let typingTimer;
let columns;
let rows;
let frame;
let lastPaint = -Infinity;

function typeName() {
  const name = names[nameIndex];
  const length = nameElement.textContent.length + (deleting ? -1 : 1);
  nameElement.textContent = name.slice(0, length);
  let delay = deleting ? 65 : 120;

  if (deleting && length === 0) {
    deleting = false;
    nameIndex = (nameIndex + 1) % names.length;
    delay = 400;
  } else if (!deleting && length === name.length) {
    deleting = true;
    delay = 2200;
  }
  typingTimer = setTimeout(typeName, delay);
}

function draw(time) {
  const phase = (performance.timeOrigin + time) * 0.00016;
  let output = "";

  for (let row = 0; row < rows; row++) {
    const y = row / rows;
    for (let column = 0; column < columns; column++) {
      const x = column / columns;
      const travel = x - phase * 0.1;
      const bend = Math.sin(y * 6.5 + travel * 4.1) * 0.07
        + Math.sin(y * 15 - travel * 8.7) * 0.025;
      const ripple = Math.sin((travel + bend) * 24 + Math.sin(travel * 11.3) * 0.8 - y * 1.5);
      const swell = Math.sin(travel * 9 + y * 5);
      const thickness = 3 + Math.sin(travel * 8 + y * 3) * 1.5;
      const intensity = (ripple * 0.5 + 0.5) ** thickness * (0.45 + (swell + 1) * 0.25);
      output += shades[Math.floor(intensity * (shades.length - 1))];
    }
    output += "\n";
  }

  waves.textContent = output;
}

function animate(time) {
  if (time - lastPaint >= 50) {
    draw(time);
    lastPaint = time;
  }
  frame = requestAnimationFrame(animate);
}

function refresh() {
  cancelAnimationFrame(frame);
  clearTimeout(typingTimer);
  const fontSize = parseFloat(getComputedStyle(waves).fontSize);
  columns = Math.ceil(window.innerWidth / (fontSize * 3 / 5));
  rows = Math.ceil(window.innerHeight / parseFloat(getComputedStyle(waves).lineHeight));
  draw(motion.matches ? 0 : performance.now());
  lastPaint = -Infinity;
  if (motion.matches) {
    if (nameElement) nameElement.textContent = names[0];
    nameIndex = 0;
    deleting = true;
  } else if (!document.hidden) {
    frame = requestAnimationFrame(animate);
    if (nameElement) typingTimer = setTimeout(typeName, 2200);
  }
}

window.addEventListener("resize", refresh);
motion.addEventListener("change", refresh);
document.addEventListener("visibilitychange", refresh);
refresh();
