document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("campaign-countdown");
  const endDateStr = el.dataset.endDate; // metafield from Liquid
  const endDate = new Date(endDateStr);

  function update() {
    const now = new Date();
    const diff = endDate - now;

    if (diff <= 0) {
      el.querySelector("p").textContent = "Campaign Ended";
      clearInterval(timer);
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    el.querySelector("#days").textContent = String(d).padStart(2, "0");
    el.querySelector("#hours").textContent = String(h).padStart(2, "0");
    el.querySelector("#minutes").textContent = String(m).padStart(2, "0");
    el.querySelector("#seconds").textContent = String(s).padStart(2, "0");
  }

  update();
  const timer = setInterval(update, 1000);
});


// 