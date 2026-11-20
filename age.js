// Birth time is unknown; count from midnight on April 30, 2004, in Fortaleza (UTC-3).
function monthAnniversary(months) {
  const date = new Date(Date.UTC(2004, 3 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(30, lastDay));
  return date;
}

function ageParts(now = new Date()) {
  const local = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  let months = Math.max(0, (local.getUTCFullYear() - 2004) * 12 + local.getUTCMonth() - 3);
  if (months > 0 && monthAnniversary(months) > local) months--;
  let seconds = Math.max(0, Math.floor((local - monthAnniversary(months)) / 1000));
  const parts = [Math.floor(months / 12), months % 12];
  for (const unit of [604800, 86400, 3600, 60, 1]) {
    parts.push(Math.floor(seconds / unit));
    seconds %= unit;
  }
  return parts;
}

const ageElement = document.querySelector("#age");
const units = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];
const suffixes = ["y", "mo", "w", "d", "h", "m", "s"];
const ageMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let ageCharacters = [];

function renderAge(text) {
  if (ageCharacters.length !== text.length) {
    ageCharacters = Array.from(text, () => document.createElement("span"));
    ageElement.replaceChildren(...ageCharacters);
  }
  Array.from(text).forEach((character, index) => {
    const slot = ageCharacters[index];
    const previous = slot.dataset.value;
    if (previous === character) return;
    slot.dataset.value = character;
    slot.setAttribute("aria-hidden", "true");
    slot.className = /\d/.test(character) ? "age-digit" : "";
    if (previous !== undefined && slot.className && !ageMotion.matches && !document.hidden) {
      const outgoing = document.createElement("span");
      outgoing.className = "age-out";
      outgoing.textContent = previous;
      const incoming = document.createElement("span");
      incoming.className = "age-in";
      incoming.textContent = character;
      slot.replaceChildren(outgoing, incoming);
    } else {
      slot.textContent = character;
    }
  });
}

function updateAge(now = new Date()) {
  const parts = ageParts(now);
  renderAge(parts.map((value, index) => `${String(value).padStart(2, "0")}${suffixes[index]}`).join(".") + " old");
  ageElement.setAttribute("aria-label", parts.map((value, index) => `${value} ${units[index]}`).join(", ") + " old");
}

updateAge();
setInterval(updateAge, 1000);
