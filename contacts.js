const discordButton = document.querySelector("#discord-copy");
const contactStatus = document.querySelector("#contact-status");

discordButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("nygotte");
    contactStatus.textContent = "Username copied.";
  } catch {
    contactStatus.textContent = "Add nygotte on Discord.";
  }
});
