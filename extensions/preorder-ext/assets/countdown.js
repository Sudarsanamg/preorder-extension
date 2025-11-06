document.addEventListener("DOMContentLoaded", () => {
  const variantSelect = document.querySelector("[name='id']"); 
  const variantDataEls = document.querySelectorAll(".variant-preorder-data");
  let timer;

  // Helper to get variant data by ID
  function getVariantData(variantId) {
    return Array.from(variantDataEls).find(el => el.dataset.variantId === variantId);
  }

  // Function to render countdown HTML
  function renderCountdown() {
    const countdownEl = document.createElement("div");
    countdownEl.id = "campaign-countdown";
    countdownEl.className = "countdown";
    countdownEl.style.display = "none"; 

    countdownEl.innerHTML = `
      <div>
        <p>Hurry! Sale gonna end in</p>
      </div>
      <div class="countdown-timer">
        <div class="countdown-item"><span id="days">00</span><small>Days</small></div>
        <div class="countdown-item"><span id="hours">00</span><small>Hours</small></div>
        <div class="countdown-item"><span id="minutes">00</span><small>Minutes</small></div>
        <div class="countdown-item"><span id="seconds">00</span><small>Seconds</small></div>
      </div>
    `;

    document.getElementById("campaign-countdown").append(countdownEl);
    return countdownEl;
  }

  // Start countdown for a given variant
  function startCountdown(variantData, countdownEl) {
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

  // Initialize
  if (variantSelect) {
    const countdownEl = renderCountdown();
    const initialVariant = getVariantData(variantSelect.value);
    startCountdown(initialVariant, countdownEl);

    variantSelect.addEventListener("change", (e) => {
      const variantData = getVariantData(e.target.value);
      startCountdown(variantData, countdownEl);
    });
  }
});
