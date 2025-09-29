document.addEventListener("DOMContentLoaded", () => {
  const countdownEl = document.getElementById("campaign-countdown");
  const variantSelect = document.querySelector("[name='id']"); // adjust for your theme
  const variantDataEls = document.querySelectorAll(".variant-preorder-data");
  let timer;

  function getVariantData(variantId) {
    return Array.from(variantDataEls).find(el => el.dataset.variantId === variantId);
  }

  function startCountdown(variantData) {
    if (!variantData || variantData.dataset.preorder !== "true" || !variantData.dataset.preorderEndDate) {
      countdownEl.style.display = "none";
      clearInterval(timer);
      return;
    }

    countdownEl.style.display = "block";
    const endDate = new Date(variantData.dataset.preorderEndDate);

    function update() {
      const now = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        countdownEl.querySelector("p").textContent = "Campaign Ended";
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      countdownEl.querySelector("#days").textContent = String(days).padStart(2, "0");
      countdownEl.querySelector("#hours").textContent = String(hours).padStart(2, "0");
      countdownEl.querySelector("#minutes").textContent = String(minutes).padStart(2, "0");
      countdownEl.querySelector("#seconds").textContent = String(seconds).padStart(2, "0");
    }

    clearInterval(timer);
    update();
    timer = setInterval(update, 1000);
  }

  // Initialize countdown on page load
  if (variantSelect) {
    const initialVariant = getVariantData(variantSelect.value);
    startCountdown(initialVariant);

    // Update countdown on variant change
    variantSelect.addEventListener("change", (e) => {
      const variantData = getVariantData(e.target.value);
      startCountdown(variantData);
    });
  }
});
