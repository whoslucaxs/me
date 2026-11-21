const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");

class Element {
  children = [];
  value = "";
  set textContent(value) { this.value = value; this.children = []; }
  get textContent() { return this.children.length ? this.children.map(child => child.textContent).join("") : this.value; }
  setAttribute(key, value) { this[key] = value; }
  replaceChildren(...children) { this.children = children; }
}

function setup(reduced = false) {
  const text = new Element();
  text.textContent = "Actually Additions: machines & tools.";
  const motion = { matches: reduced };
  const frames = [];
  function asset(complete, naturalWidth) {
    const item = { complete, naturalWidth, classes: [] };
    item.classList = {
      add(name) { if (!item.classes.includes(name)) item.classes.push(name); },
      remove(name) { item.classes = item.classes.filter(value => value !== name); },
    };
    item.addEventListener = (event, callback, options) => {
      assert.ok(["load", "error"].includes(event));
      assert.equal(options.once, true);
      item[event] = () => { item.complete = true; callback(); };
    };
    return item;
  }
  const images = [true, false, true].map((complete, index) => {
    const image = asset(complete, index === 2 ? 0 : 800);
    image.ascii = asset(complete, 800);
    image.parentElement = asset(true, 0);
    image.parentElement.querySelector = () => image.ascii;
    return image;
  });
  let intersection;
  const observed = new Set();
  const document = {
    hidden: false,
    createElement: () => new Element(),
    querySelectorAll: selector => selector === ".project-banner" ? images : [text],
  };
  runInNewContext(readFileSync(`${__dirname}/projects.js`, "utf8"), {
    window: { matchMedia: () => motion }, document,
    performance: { now: () => 0 },
    requestAnimationFrame: callback => frames.push(callback),
    IntersectionObserver: class {
      constructor(callback) { intersection = callback; }
      observe(element) { observed.add(element); }
      unobserve(element) { observed.delete(element); }
    },
  });
  return { text, motion, frames, images, observed, document,
    reveal: visible => intersection([{ target: text, isIntersecting: visible }]),
    frame: time => frames.splice(0).forEach(callback => callback(time)),
  };
}

const state = setup();
const original = state.text.textContent;
assert.deepEqual(state.images[0].classes, ["is-loaded"]);
assert.deepEqual(state.images[1].classes, []);
state.images[1].load();
assert.deepEqual(state.images[1].classes, []);
assert.deepEqual(state.images[1].parentElement.classes, ["is-loading"]);
state.images[1].ascii.load();
assert.deepEqual(state.images[1].classes, ["is-loaded"]);
assert.deepEqual(state.images[1].parentElement.classes, ["is-loaded"]);
assert.deepEqual(state.images[2].classes, []);
assert.deepEqual(state.images[2].parentElement.classes, []);
state.reveal(false);
assert.equal(state.text.textContent, original);
state.reveal(true);
assert.equal(state.observed.size, 0);
assert.equal(state.text.children[0].textContent, original);
assert.equal(state.text.children[1]["aria-hidden"], "true");
assert.notEqual(state.text.children[1].textContent, original);
state.frame(600);
assert.ok(state.text.children[1].textContent.startsWith(original.slice(0, Math.floor(original.length / 2))));
state.frame(1200);
assert.equal(state.text.textContent, original);
assert.equal(state.frames.length, 0);
const reduced = setup(true);
assert.equal(reduced.observed.size, 0);
assert.equal(reduced.frames.length, 0);
assert.deepEqual(reduced.images[0].classes, []);
assert.deepEqual(reduced.images[0].parentElement.classes, []);
const failed = setup();
failed.images[1].ascii.error();
assert.deepEqual(failed.images[1].parentElement.classes, []);
const changed = setup();
changed.reveal(true);
changed.motion.matches = true;
changed.frame(100);
assert.equal(changed.text.textContent, original);
assert.equal(changed.frames.length, 0);
console.log("OK: ASCII antes da imagem, espera das duas capas, cache, falhas de carga, Matrix e movimento reduzido.");
