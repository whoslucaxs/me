const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { runInNewContext } = require("node:vm");

async function check(clipboard) {
  const status = { textContent: "" };
  let click;
  runInNewContext(readFileSync(`${__dirname}/contacts.js`, "utf8"), {
    document: { querySelector: selector => selector === "#discord-copy" ? {
      addEventListener: (event, callback) => { assert.equal(event, "click"); click = callback; },
    } : status },
    navigator: { clipboard },
  });
  assert.equal(status.textContent, "");
  await click();
  return status.textContent;
}

(async () => {
  assert.equal(await check({ writeText: async text => assert.equal(text, "nygotte") }), "Username copied.");
  assert.equal(await check({ writeText: async () => { throw new Error("Denied"); } }), "Add nygotte on Discord.");
  assert.equal(await check(undefined), "Add nygotte on Discord.");
  console.log("OK: usuário correto, confirmação da cópia e alternativa quando a cópia não está disponível.");
})().catch(error => { console.error(error); process.exitCode = 1; });
