const effectsMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const matrixCharacters = "01.:;+=xX$&#";

function revealProjectText(element) {
  const original = element.textContent;
  const accessible = document.createElement("span");
  accessible.className = "sr-only";
  accessible.textContent = original;
  const visual = document.createElement("span");
  visual.setAttribute("aria-hidden", "true");
  element.replaceChildren(accessible, visual);
  const start = performance.now();
  let lastUpdate = -Infinity;

  function build(time) {
    const progress = Math.min(1, (time - start) / 1200);
    if (progress === 1 || effectsMotion.matches || document.hidden) {
      element.textContent = original;
      return;
    }
    if (time - lastUpdate >= 45) {
      const revealed = Math.floor(original.length * progress);
      visual.textContent = Array.from(original, (character, index) =>
        index < revealed || !/[a-z0-9]/i.test(character)
          ? character
          : matrixCharacters[Math.floor(Math.random() * matrixCharacters.length)]
      ).join("");
      lastUpdate = time;
    }
    requestAnimationFrame(build);
  }

  build(start);
}

if (!effectsMotion.matches) {
  for (const image of document.querySelectorAll(".project-banner")) {
    const media = image.parentElement;
    const ascii = media.querySelector(".project-ascii");
    const reveal = () => {
      if (!image.complete || !ascii.complete) return;
      media.classList.remove("is-loading");
      if (image.naturalWidth > 0 && ascii.naturalWidth > 0 && !effectsMotion.matches) {
        media.classList.add("is-loaded");
        image.classList.add("is-loaded");
      }
    };
    media.classList.add("is-loading");
    for (const asset of [image, ascii]) {
      asset.addEventListener("load", reveal, { once: true });
      asset.addEventListener("error", () => media.classList.remove("is-loading"), { once: true });
    }
    reveal();
  }

  const textObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        revealProjectText(entry.target);
        textObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.15 });

  for (const element of document.querySelectorAll(".projects-layout h1, .projects-intro, .project-status, .project-content h2, .project-content p, .project-link, .project-soon")) {
    textObserver.observe(element);
  }
}
