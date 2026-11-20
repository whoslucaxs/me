const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");

const waves = { textContent: "" };
const nameElement = { textContent: "nyx" };
const listeners = {};
const motion = { matches: false, addEventListener: (event, fn) => { listeners.motion = fn; } };
let pending;
let pendingTyping;
const document = {
  hidden: false,
  querySelector: (selector) => selector === "#waves" ? waves : nameElement,
  addEventListener: (event, fn) => { listeners[event] = fn; },
};
const window = {
  innerWidth: 1440,
  innerHeight: 900,
  matchMedia: () => motion,
  addEventListener: (event, fn) => { listeners[event] = fn; },
};

runInNewContext(readFileSync(`${__dirname}/script.js`, "utf8"), {
  window, document,
  performance: { timeOrigin: 0, now: () => 0 },
  getComputedStyle: () => ({ fontSize: "12px", lineHeight: "15px" }),
  requestAnimationFrame: (fn) => { pending = fn; return 1; },
  cancelAnimationFrame: () => { pending = undefined; },
  setTimeout: (fn) => { pendingTyping = fn; return 1; },
  clearTimeout: () => { pendingTyping = undefined; },
});

for (const expected of ["ny", "n", "", "w", "wh", "who", "whos", "whosl", "whoslu", "whosluc", "whosluca", "whoslucax", "whoslucaxs"]) {
  pendingTyping();
  assert.equal(nameElement.textContent, expected);
}
for (let letter = 0; letter < 10; letter++) pendingTyping();
assert.equal(nameElement.textContent, "");
for (let letter = 0; letter < 3; letter++) pendingTyping();
assert.equal(nameElement.textContent, "nyx");

assert.equal(waves.textContent.split("\n").length, 61);
assert.equal(waves.textContent.split("\n")[0].length, 200);
assert.match(waves.textContent, /^[ .,:;+=xX$&#\n]+$/);
const firstFrame = waves.textContent;
pending(1500);
assert.notEqual(waves.textContent, firstFrame);
pending(3125);
const shiftedLines = waves.textContent.split("\n");
const originalLines = firstFrame.split("\n");
for (let row = 0; row < 60; row++) {
  assert.equal(shiftedLines[row].slice(10), originalLines[row].slice(0, -10), "As cristas devem avançar para a direita.");
}

window.innerWidth = 390;
window.innerHeight = 844;
listeners.resize();
assert.equal(waves.textContent.split("\n")[0].length, 55);
assert.equal(waves.textContent.split("\n").length, 58);

motion.matches = true;
listeners.motion();
assert.equal(pending, undefined);
assert.equal(pendingTyping, undefined);
assert.equal(nameElement.textContent, "nyx");
assert.ok(waves.textContent.trim());
motion.matches = false;
document.hidden = true;
listeners.visibilitychange();
assert.equal(pending, undefined);
assert.equal(pendingTyping, undefined);
document.hidden = false;
listeners.visibilitychange();
assert.equal(typeof pending, "function");
assert.equal(typeof pendingTyping, "function");
pending(3125);
const sharedFrame = waves.textContent;
runInNewContext(readFileSync(`${__dirname}/script.js`, "utf8"), {
  window,
  performance: { timeOrigin: 3125, now: () => 0 },
  document: { ...document, querySelector: (selector) => selector === "#waves" ? waves : null },
  getComputedStyle: () => ({ fontSize: "12px", lineHeight: "15px" }),
  requestAnimationFrame: (fn) => { pending = fn; return 1; },
  cancelAnimationFrame: () => { pending = undefined; },
  setTimeout: () => assert.fail("About Me não deve iniciar a digitação."),
  clearTimeout: () => {},
});
assert.equal(waves.textContent, sharedFrame, "A nova página deve continuar na mesma posição das ondas.");
assert.ok(waves.textContent.trim());
assert.equal(typeof pending, "function");
motion.matches = true;
assert.doesNotThrow(() => listeners.motion());
assert.equal(pending, undefined);
console.log("OK: digitar/apagar os dois nomes, ondas, mobile, movimento reduzido e aba oculta.");
