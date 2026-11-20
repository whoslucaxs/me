const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");
class Element {
  children = [];
  dataset = {};
  text = "";
  set textContent(value) { this.text = value; this.children = []; }
  get textContent() { return this.children.length ? this.children.map(child => child.textContent).join("") : this.text; }
  setAttribute(key, value) { this[key] = value; }
  replaceChildren(...children) { this.text = ""; this.children = children; }
}
const element = new Element();
const motion = { matches: false };
const context = {
  document: { hidden: false, querySelector: () => element, createElement: () => new Element() },
  window: { matchMedia: () => motion },
  setInterval: (fn, delay) => { assert.equal(delay, 1000); context.tick = fn; },
};
runInNewContext(readFileSync(`${__dirname}/age.js`, "utf8"), context);
const check = (date, expected) => assert.deepEqual(Array.from(context.ageParts(new Date(date))), expected);

check("2004-04-30T03:00:00Z", [0, 0, 0, 0, 0, 0, 0]);
check("2004-04-29T03:00:00Z", [0, 0, 0, 0, 0, 0, 0]);
check("2026-04-30T02:59:59Z", [21, 11, 4, 2, 23, 59, 59]);
check("2026-04-30T03:00:00Z", [22, 0, 0, 0, 0, 0, 0]);
check("2025-02-28T03:00:00Z", [20, 10, 0, 0, 0, 0, 0]);
check("2024-02-29T03:00:00Z", [19, 10, 0, 0, 0, 0, 0]);
check("2025-03-29T03:00:00Z", [20, 10, 4, 1, 0, 0, 0]);
check("2026-11-20T16:42:06-03:00", [22, 6, 3, 0, 16, 42, 6]);
check("2026-11-20T16:42:07-03:00", [22, 6, 3, 0, 16, 42, 7]);
context.tick();
const visibleText = () => element.children.map(slot => slot.dataset.value).join("");
assert.match(visibleText(), /^\d+y\.\d+mo\.\d+w\.\d+d\.\d+h\.\d+m\.\d+s old$/);
assert.match(element["aria-label"], /years, .*months, .*weeks, .*days, .*hours, .*minutes, .*seconds old/);
context.updateAge(new Date("2026-11-20T16:42:59-03:00"));
const slots = [...element.children];
context.updateAge(new Date("2026-11-20T16:43:00-03:00"));
assert.equal(visibleText(), "22y.06mo.03w.00d.16h.43m.00s old");
assert.ok(element.children.every((slot, index) => slot === slots[index]));
const secondsDigit = element.children[26];
assert.equal(secondsDigit.children[0].textContent, "9");
assert.equal(secondsDigit.children[1].textContent, "0");
motion.matches = true;
context.updateAge(new Date("2026-11-20T16:43:01-03:00"));
assert.equal(secondsDigit.children.length, 0);
assert.equal(secondsDigit.textContent, "1");
console.log("OK: idade, calendário, UTC-3, rolagem de dígitos, virada do minuto e movimento reduzido.");
